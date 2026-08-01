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

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

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
    return json({ success: false, error: 'Method not allowed' }, 405)
  }

  if (!adminSupabase || !supabaseUrl || !supabaseAnonKey || !paystackSecretKey) {
    console.error(`[${executionId}] Server configuration is incomplete`)
    return json({ success: false, error: 'Server configuration error' }, 500)
  }

  try {
    const authorization = req.headers.get('Authorization') || ''
    if (!authorization.startsWith('Bearer ')) {
      return json({ success: false, error: 'Authentication required' }, 401)
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
      return json({ success: false, error: 'Authentication required' }, 401)
    }

    let body: { due_id?: unknown; amount?: unknown }
    try {
      body = await req.json()
    } catch {
      return json({ success: false, error: 'Invalid JSON in request body' }, 400)
    }

    const { due_id, amount } = body
    if (!isUuid(due_id)) {
      return json({ success: false, error: 'Invalid due id' }, 400)
    }

    const requestedAmount = Number(amount)
    const requestedAmountInKobo = Math.round(requestedAmount * 100)
    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0 ||
      Math.abs(requestedAmount * 100 - requestedAmountInKobo) > 0.0001
    ) {
      return json({ success: false, error: 'Invalid payment amount' }, 400)
    }

    const { data: studentProfile, error: studentProfileError } =
      await adminSupabase
        .from('users')
        .select('id, email, organization_id, role')
        .eq('id', authUser.id)
        .maybeSingle()

    if (studentProfileError) {
      console.error(`[${executionId}] Student profile lookup failed`, studentProfileError)
      return json({ success: false, error: 'Unable to validate caller profile' }, 500)
    }

    if (
      !studentProfile ||
      studentProfile.role !== 'student' ||
      !studentProfile.organization_id
    ) {
      return json({ success: false, error: 'Forbidden' }, 403)
    }

    const { data: due, error: dueError } = await adminSupabase
      .from('dues')
      .select('id, organization_id, amount, status')
      .eq('id', due_id)
      .maybeSingle()

    if (dueError) {
      console.error(`[${executionId}] Due lookup failed`, dueError)
      return json({ success: false, error: 'Unable to fetch due' }, 500)
    }

    if (!due) {
      return json({ success: false, error: 'Due not found' }, 404)
    }

    if (due.status !== 'active') {
      return json({ success: false, error: 'This due is not accepting payments' }, 400)
    }

    if (due.organization_id !== studentProfile.organization_id) {
      return json({ success: false, error: 'Forbidden' }, 403)
    }

    const { data: previousPayments, error: previousPaymentsError } =
      await adminSupabase
        .from('payments')
        .select('amount_paid')
        .eq('due_id', due.id)
        .eq('student_id', authUser.id)
        .eq('status', 'completed')

    if (previousPaymentsError) {
      console.error(`[${executionId}] Previous payment lookup failed`, previousPaymentsError)
      return json({ success: false, error: 'Unable to check payment balance' }, 500)
    }

    const totalPaid =
      previousPayments?.reduce(
        (sum, payment) => sum + (Number(payment.amount_paid) || 0),
        0,
      ) || 0
    const remainingAmount = Number(due.amount) - totalPaid
    const requestedAmountInNaira = requestedAmountInKobo / 100

    if (remainingAmount <= 0) {
      return json({ success: false, error: 'This due has already been paid' }, 400)
    }

    if (requestedAmountInNaira > remainingAmount) {
      return json({ success: false, error: 'Payment amount exceeds outstanding balance' }, 400)
    }

    const customerEmail = authUser.email || studentProfile.email
    if (!customerEmail) {
      return json({ success: false, error: 'Unable to initialize payment without an email address' }, 400)
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: requestedAmountInKobo,
        currency: 'NGN',
        metadata: {
          due_id: due.id,
          student_id: authUser.id,
          payment_amount: requestedAmount,
        },
      }),
    })

    const paystackBody = await paystackResponse.json().catch(() => null)
    if (!paystackResponse.ok || !paystackBody?.status || !paystackBody?.data) {
      console.error(`[${executionId}] Paystack initialization failed`, {
        status: paystackResponse.status,
        body: paystackBody,
      })
      return json({ success: false, error: 'Unable to initialize payment' }, 502)
    }

    const { authorization_url, access_code, reference } = paystackBody.data
    if (!authorization_url || !access_code || !reference) {
      console.error(`[${executionId}] Paystack initialization response was incomplete`, paystackBody.data)
      return json({ success: false, error: 'Unable to initialize payment' }, 502)
    }

    return json({
      success: true,
      data: {
        authorization_url,
        access_code,
        reference,
      },
    })
  } catch (error) {
    console.error(`[${executionId}] Unexpected initialization error`, error)
    return json({ success: false, error: 'Internal server error' }, 500)
  }
})
