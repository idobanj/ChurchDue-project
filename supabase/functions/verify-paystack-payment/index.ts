import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
const allowedOrigin = Deno.env.get('FRONTEND_ORIGIN') || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const isUuid = (value: unknown) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const isReference = (value: unknown) =>
  typeof value === 'string' && /^[A-Za-z0-9._=-]{6,128}$/.test(value)

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !paystackSecretKey) {
  console.error('verify-paystack-payment missing required environment configuration')
}

const adminSupabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

serve(async (req) => {
  const executionId = crypto.randomUUID()

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!adminSupabase || !supabaseUrl || !supabaseAnonKey || !paystackSecretKey) {
    console.error(`[${executionId}] Server configuration is incomplete`)
    return json({ error: 'Server configuration error' }, 500)
  }

  try {
    const authorization = req.headers.get('Authorization') || ''
    if (!authorization.startsWith('Bearer ')) {
      return json({ error: 'Authentication required' }, 401)
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { user: authUser },
      error: authError,
    } = await userSupabase.auth.getUser()

    if (authError || !authUser) {
      console.warn(`[${executionId}] Invalid caller token`)
      return json({ error: 'Authentication required' }, 401)
    }

    let body: { reference?: unknown; due_id?: unknown }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid JSON in request body' }, 400)
    }

    const { reference, due_id } = body
    if (!isReference(reference)) {
      return json({ error: 'Invalid payment reference' }, 400)
    }
    if (!isUuid(due_id)) {
      return json({ error: 'Invalid due id' }, 400)
    }

    const { data: dueData, error: dueError } = await adminSupabase
      .from('dues')
      .select('id, organization_id, amount, status')
      .eq('id', due_id)
      .maybeSingle()

    if (dueError) {
      console.error(`[${executionId}] Due lookup failed`, dueError)
      return json({ error: 'Database error while fetching due' }, 500)
    }
    if (!dueData) {
      return json({ error: 'Due not found' }, 404)
    }
    if (dueData.status !== 'active') {
      return json({ error: 'This due is not accepting payments' }, 400)
    }

    const { data: callerProfile, error: callerProfileError } = await adminSupabase
      .from('users')
      .select('id, organization_id, role')
      .eq('id', authUser.id)
      .maybeSingle()

    if (callerProfileError || !callerProfile) {
      console.error(`[${executionId}] Caller profile lookup failed`, callerProfileError)
      return json({ error: 'Caller profile not found' }, 403)
    }
    if (callerProfile.role !== 'student' || callerProfile.organization_id !== dueData.organization_id) {
      return json({ error: 'Forbidden' }, 403)
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!paystackResponse.ok) {
      console.error(`[${executionId}] Paystack verification request failed`, paystackResponse.status)
      return json({ error: 'Unable to verify payment' }, 502)
    }

    const paystackData = await paystackResponse.json()
    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return json({ error: 'Payment verification failed' }, 400)
    }

    const { amount, currency, metadata } = paystackData.data
    const metadataDueId = metadata?.due_id
    const metadataStudentId = metadata?.student_id

    if (currency !== 'NGN' || typeof amount !== 'number' || amount <= 0) {
      return json({ error: 'Invalid payment details' }, 400)
    }
    if (
      typeof metadataDueId !== 'string' ||
      typeof metadataStudentId !== 'string' ||
      metadataDueId.toLowerCase() !== due_id.toLowerCase() ||
      metadataStudentId.toLowerCase() !== authUser.id.toLowerCase()
    ) {
      return json({ error: 'Payment metadata mismatch' }, 403)
    }

    const { data: existingPayment, error: existingPaymentError } = await adminSupabase
      .from('payments')
      .select('id, amount_paid, status, paid_at, created_at, due_id, student_id, organization_id')
      .eq('paystack_reference', reference)
      .maybeSingle()

    if (existingPaymentError) {
      console.error(`[${executionId}] Existing payment lookup failed`, existingPaymentError)
      return json({ error: 'Database error while checking payment' }, 500)
    }

    if (existingPayment) {
      if (
        existingPayment.student_id !== authUser.id ||
        existingPayment.due_id !== due_id ||
        existingPayment.organization_id !== dueData.organization_id
      ) {
        return json({ error: 'Payment reference already belongs to another record' }, 409)
      }

      return json({
        success: true,
        data: {
          amount: Math.round(existingPayment.amount_paid * 100),
          reference,
          id: existingPayment.id,
          status: existingPayment.status,
          paid_at: existingPayment.paid_at || existingPayment.created_at,
        },
        message: 'Payment already verified and recorded',
      })
    }

    const { data: previousPayments, error: previousPaymentsError } = await adminSupabase
      .from('payments')
      .select('amount_paid')
      .eq('due_id', due_id)
      .eq('student_id', authUser.id)
      .eq('status', 'completed')

    if (previousPaymentsError) {
      console.error(`[${executionId}] Previous payment lookup failed`, previousPaymentsError)
      return json({ error: 'Database error while checking balance' }, 500)
    }

    const amountInNaira = amount / 100
    const totalPaid = previousPayments?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0
    const remainingAmountInKobo = Math.round((dueData.amount - totalPaid) * 100)

    if (amount <= 0 || amount > remainingAmountInKobo) {
      return json({ error: 'Payment amount exceeds outstanding balance' }, 400)
    }

    const { data: paymentData, error: paymentError } = await adminSupabase
      .from('payments')
      .insert({
        organization_id: dueData.organization_id,
        student_id: authUser.id,
        due_id,
        amount_paid: amountInNaira,
        paystack_reference: reference,
        status: 'completed',
        paid_at: paystackData.data.paid_at || new Date().toISOString(),
      })
      .select('id, amount_paid, paystack_reference, status, paid_at, created_at')
      .single()

    if (paymentError) {
      if (paymentError.code === '23505') {
        return json({ error: 'Payment has already been recorded' }, 409)
      }
      console.error(`[${executionId}] Payment insert failed`, paymentError)
      return json({ error: 'Failed to record payment' }, 500)
    }

    console.log(`[${executionId}] Payment recorded`, {
      paymentId: paymentData.id,
      dueId: due_id,
      studentId: authUser.id,
    })

    return json({
      success: true,
      data: {
        amount,
        reference,
        id: paymentData.id,
        status: paymentData.status,
        paid_at: paymentData.paid_at,
      },
    })
  } catch (error) {
    console.error(`[${executionId}] Unexpected verification error`, error)
    return json({ error: 'Internal server error' }, 500)
  }
})
