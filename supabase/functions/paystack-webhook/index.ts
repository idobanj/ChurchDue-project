import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { recordPayment, isReference, isUuid } from '../_shared/payment.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
const allowedOrigin = Deno.env.get('FRONTEND_ORIGIN') || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

if (!supabaseUrl || !supabaseServiceRoleKey || !paystackSecretKey) {
  console.error('paystack-webhook missing required environment configuration')
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

  if (!adminSupabase || !paystackSecretKey) {
    console.error(`[${executionId}] Server configuration is incomplete`)
    return json({ error: 'Server configuration error' }, 500)
  }

  try {
    const signature = req.headers.get('x-paystack-signature')
    if (!signature) {
      console.warn(`[${executionId}] Missing x-paystack-signature header`)
      return json({ error: 'Unauthorized' }, 401)
    }

    const rawBody = await req.arrayBuffer()

    const encoder = new TextEncoder()
    const keyData = encoder.encode(paystackSecretKey)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      rawBody
    )

    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (expectedSignature !== signature) {
      console.warn(`[${executionId}] Invalid webhook signature`)
      return json({ error: 'Unauthorized' }, 401)
    }

    const rawBodyText = new TextDecoder().decode(rawBody)
    let payload: { event?: string; data?: any }
    try {
      payload = JSON.parse(rawBodyText)
    } catch {
      return json({ error: 'Invalid JSON payload' }, 400)
    }

    if (payload.event !== 'charge.success') {
      console.log(`[${executionId}] Ignoring event: ${payload.event}`)
      return json({ success: true, message: 'Event ignored' }, 200)
    }

    const data = payload.data
    if (!data) {
      return json({ error: 'Missing data in payload' }, 400)
    }

    const reference = data.reference
    const due_id = data.metadata?.due_id
    const student_id = data.metadata?.student_id

    if (!isReference(reference)) {
      console.warn(`[${executionId}] Invalid reference format: ${reference}`)
      return json({ error: 'Invalid payment reference' }, 400)
    }
    if (!isUuid(due_id)) {
      console.warn(`[${executionId}] Invalid due_id format: ${due_id}`)
      return json({ error: 'Invalid due id' }, 400)
    }
    if (!isUuid(student_id)) {
      console.warn(`[${executionId}] Invalid student_id format: ${student_id}`)
      return json({ error: 'Invalid student id' }, 400)
    }

    const result = await recordPayment(adminSupabase, {
      reference,
      dueId: due_id,
      studentId: student_id,
      paystackSecretKey,
      executionId,
    })

    if (result.success) {
      return json({ success: true, message: result.message || 'Payment recorded' }, 200)
    }

    if (result.status === 409) {
      console.log(`[${executionId}] Webhook duplicate check: already recorded (${result.error})`)
      return json({ success: true, message: result.error || 'Payment already recorded' }, 200)
    }

    return json({ error: result.error }, result.status)
  } catch (error) {
    console.error(`[${executionId}] Unexpected webhook processing error`, error)
    return json({ error: 'Internal server error' }, 500)
  }
})
