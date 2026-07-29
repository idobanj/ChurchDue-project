import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { recordPayment, isReference, isUuid } from '../_shared/payment.ts'

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

    const result = await recordPayment(adminSupabase, {
      reference,
      dueId: due_id,
      studentId: authUser.id,
      paystackSecretKey,
      executionId,
    })

    if (!result.success) {
      return json({ error: result.error }, result.status)
    }

    return json({
      success: true,
      data: result.data,
      ...(result.message ? { message: result.message } : {})
    }, result.status)
  } catch (error) {
    console.error(`[${executionId}] Unexpected verification error`, error)
    return json({ error: 'Internal server error' }, 500)
  }
})
