import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Add this right after your imports
console.log("DEBUG: Checking secrets...");
console.log("URL exists:", !!Deno.env.get('SUPABASE_URL'));
console.log("SERVICE_KEY exists:", !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
console.log("PAYSTACK_KEY exists:", !!Deno.env.get('PAYSTACK_SECRET_KEY'));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { reference, due_id, expectedAmount } = body
    console.log("FUNCTION RECEIVED:", { reference, due_id, expectedAmount })

    if (!reference || !due_id || !expectedAmount) {
      throw new Error("Missing required fields")
    }

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    })

    const paystackData = await paystackResponse.json()
    console.log("PAYSTACK API RESPONSE:", paystackData)

    if (!paystackData.status || paystackData.data.status !== 'success') {
      throw new Error(`Paystack verification failed: ${paystackData.message || 'unknown error'}`)
    }

    // Amount match check
    if (paystackData.data.amount !== expectedAmount) {
      throw new Error(`Amount mismatch. Expected ${expectedAmount}, got ${paystackData.data.amount}`)
    }

    // ... proceed with DB insert
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: paystackData.data.metadata.student_id,
        due_id: due_id,
        amount_paid: paystackData.data.amount / 100,
        paystack_reference: reference,
        status: 'success',
        paid_at: new Date().toISOString(),
      })
      .select()

    if (paymentError) throw paymentError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error("FUNCTION ERROR:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})