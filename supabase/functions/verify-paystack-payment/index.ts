import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Read the body ONLY ONCE
    const body = await req.json()
    const { reference, due_id, expectedAmount } = body

    // Validate fields
    if (!reference || !due_id || !expectedAmount) {
      console.error("VALIDATION FAILED. Received:", { reference, due_id, expectedAmount });
      return new Response(JSON.stringify({ 
        error: 'Missing fields', 
        received: { reference, due_id, expectedAmount } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // 3. Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const { amount, currency, metadata } = paystackData.data

    // 4. Validate amount (Paystack returns amount in kobo)
    if (amount !== expectedAmount || currency !== 'NGN') {
      return new Response(JSON.stringify({ error: 'Mismatch in amount or currency' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const { student_id } = metadata || {}

    // 5. Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('paystack_reference', reference)
      .maybeSingle()

    if (existingPayment) {
      return new Response(JSON.stringify({ verified: true, message: 'Already recorded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 6. Insert payment
    const orgId = metadata.organization_id || await getOrganizationId(due_id, supabase)
    
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: orgId,
        student_id: student_id,
        due_id: due_id,
        amount_paid: amount / 100,
        paystack_reference: reference,
        status: 'success',
        paid_at: new Date().toISOString(),
      })
      .select()

    if (paymentError) throw paymentError

    return new Response(JSON.stringify({ verified: true, paymentId: paymentData[0]?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function getOrganizationId(due_id, supabase) {
  const { data } = await supabase.from('dues').select('organization_id').eq('id', due_id).single()
  return data?.organization_id
}