import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Edge Function starting...')

// Validate environment variables at startup
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

console.log('Environment variables check:')
console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'SET' : 'MISSING')
console.log('PAYSTACK_SECRET_KEY:', paystackSecretKey ? 'SET' : 'MISSING')

if (!supabaseUrl) {
  console.error('FATAL: SUPABASE_URL environment variable is missing')
}
if (!supabaseServiceRoleKey) {
  console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY environment variable is missing')
}
if (!paystackSecretKey) {
  console.error('FATAL: PAYSTACK_SECRET_KEY environment variable is missing')
}

// Initialize Supabase client with service role for Edge Function
let supabase: any = null
try {
  supabase = createClient(
    supabaseUrl || '',
    supabaseServiceRoleKey || ''
  )
  console.log('Supabase client initialized successfully')
} catch (initError) {
  console.error('FATAL: Failed to initialize Supabase client:', initError)
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, replace with your frontend URL
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  const executionId = crypto.randomUUID()
  console.log(`[${executionId}] Edge Function invoked`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${executionId}] Handling OPTIONS preflight request`)
    return new Response('ok', { headers: corsHeaders })
  }

  // Check if Supabase client is initialized
  if (!supabase) {
    console.error(`[${executionId}] Supabase client not initialized`)
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Supabase client not initialized' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }

  try {
    // Parse and validate request body
    let body
    try {
      const rawBody = await req.text()
      console.log(`[${executionId}] Raw request body:`, rawBody)
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error(`[${executionId}] Failed to parse JSON:`, parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { reference, due_id, expectedAmount, organization_id } = body

    console.log(`[${executionId}] Received request:`, { reference, due_id, expectedAmount, organization_id })

    // Validate required fields
    if (!reference) {
      console.error(`[${executionId}] Missing required field: reference`)
      return new Response(
        JSON.stringify({ error: 'Missing required field: reference' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (!due_id) {
      console.error(`[${executionId}] Missing required field: due_id`)
      return new Response(
        JSON.stringify({ error: 'Missing required field: due_id' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (expectedAmount === undefined || expectedAmount === null) {
      console.error(`[${executionId}] Missing required field: expectedAmount`)
      return new Response(
        JSON.stringify({ error: 'Missing required field: expectedAmount' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Validate expectedAmount is a positive number
    if (typeof expectedAmount !== 'number' || expectedAmount <= 0) {
      console.error(`[${executionId}] Invalid expectedAmount:`, expectedAmount)
      return new Response(
        JSON.stringify({ error: 'expectedAmount must be a positive number' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (!organization_id) {
      console.error(`[${executionId}] Missing required field: organization_id`)
      return new Response(
        JSON.stringify({ error: 'Missing required field: organization_id' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`[${executionId}] Verifying Paystack payment: reference=${reference}, due_id=${due_id}, expectedAmount=${expectedAmount} kobo, organization_id=${organization_id}`)

    // Check if required environment variables are present
    if (!supabaseUrl || !supabaseServiceRoleKey || !paystackSecretKey) {
      const missingVars = []
      if (!supabaseUrl) missingVars.push('SUPABASE_URL')
      if (!supabaseServiceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
      if (!paystackSecretKey) missingVars.push('PAYSTACK_SECRET_KEY')

      console.error(`[${executionId}] Missing server configuration:`, missingVars)
      return new Response(
        JSON.stringify({ error: `Missing server configuration: ${missingVars.join(', ')}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Verify the due exists and get its organization_id
    console.log(`[${executionId}] Fetching due with ID: ${due_id}`)
    const { data: dueData, error: dueError } = await supabase
      .from('dues')
      .select('id, organization_id, amount')
      .eq('id', due_id)
      .single()

    if (dueError) {
      console.error(`[${executionId}] Error fetching due:`, dueError)
      if (dueError.code === 'PGRST116') { // Not found
        return new Response(
          JSON.stringify({ error: 'Due not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        )
      }
      return new Response(
        JSON.stringify({ error: 'Database error while fetching due' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    if (!dueData) {
      console.error(`[${executionId}] Due not found for ID: ${due_id}`)
      return new Response(
        JSON.stringify({ error: 'Due not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    console.log(`[${executionId}] Due data retrieved:`, dueData)

    // Validate that the organization_id matches the due's organization_id
    if (dueData.organization_id !== organization_id) {
      console.error(`[${executionId}] Organization mismatch: expected ${dueData.organization_id}, got ${organization_id}`)
      return new Response(
        JSON.stringify({ error: 'Organization mismatch: due does not belong to the specified organization' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Verify payment with Paystack
    console.log(`[${executionId}] Verifying payment with Paystack: reference=${reference}`)
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
    })

    console.log(`[${executionId}] Paystack API response status:`, paystackResponse.status)

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text()
      console.error(`[${executionId}] Paystack API request failed:`, paystackResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: `Paystack API request failed with status ${paystackResponse.status}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502
        }
      )
    }

    const paystackData = await paystackResponse.json()
    console.log(`[${executionId}] Paystack verification response:`, JSON.stringify(paystackData))

    // Check if Paystack verification was successful
    if (!paystackData.status || paystackData.data.status !== 'success') {
      const errorMessage = paystackData.message || 'Payment verification failed'
      console.error(`[${executionId}] Paystack verification failed:`, errorMessage)
      return new Response(
        JSON.stringify({ error: `Paystack verification failed: ${errorMessage}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const { amount, currency, metadata } = paystackData.data
    console.log(`[${executionId}] Paystack payment details: amount=${amount}, currency=${currency}, metadata:`, metadata)

    // Validate amount (Paystack amount is in kobo/cents, expectedAmount is also in kobo)
    if (amount !== expectedAmount) {
      console.error(`[${executionId}] Amount mismatch: expected ${expectedAmount} kobo, got ${amount} kobo`)
      return new Response(
        JSON.stringify({ error: `Amount mismatch: expected ${expectedAmount} kobo, got ${amount} kobo` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Validate currency
    if (currency !== 'NGN') {
      console.error(`[${executionId}] Invalid currency: expected NGN, got ${currency}`)
      return new Response(
        JSON.stringify({ error: `Invalid currency: expected NGN, got ${currency}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Extract and validate metadata
    const { due_id: metadataDueId, student_id } = metadata || {}

    if (!student_id) {
      console.error(`[${executionId}] Missing student_id in payment metadata`)
      return new Response(
        JSON.stringify({ error: 'Missing student_id in payment metadata' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (metadataDueId !== due_id) {
      console.error(`[${executionId}] Due ID mismatch: expected ${due_id}, got ${metadataDueId}`)
      return new Response(
        JSON.stringify({ error: `Due ID mismatch: expected ${due_id}, got ${metadataDueId}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Optional: Verify that the student belongs to the organization
    // This is more secure but requires an additional query
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('users')
        .select('id, organization_id')
        .eq('id', student_id)
        .single()

      if (!studentError && studentData) {
        if (studentData.organization_id !== organization_id) {
          console.error(`[${executionId}] Student does not belong to organization: student org ${studentData.organization_id}, expected ${organization_id}`)
          return new Response(
            JSON.stringify({ error: 'Student does not belong to the specified organization' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          )
        }
      } else if (studentError) {
        console.warn(`[${executionId}] Could not verify student organization (continuing anyway):`, studentError)
        // We don't return an error here as it might be due to permissions or other non-critical issues
        // The organization_id verification above provides the main security check.
      }
    } catch (studentErr) {
      console.warn(`[${executionId}] Error checking student organization (continuing anyway):`, studentErr)
    }

    // Check if payment already exists to prevent double recording (idempotency)
    console.log(`[${executionId}] Checking for existing payment with reference: ${reference}`)
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('id, amount_paid, status, created_at')
      .eq('paystack_reference', reference)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error(`[${executionId}] Error checking for existing payment:`, checkError)
      return new Response(
        JSON.stringify({ error: 'Database error while checking for existing payment' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    if (existingPayment) {
      // Payment already recorded - return success to prevent frontend error
      console.log(`[${executionId}] Payment already recorded: reference=${reference}, paymentId=${existingPayment.id}`)
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            amount: existingPayment.amount_paid * 100, // Convert back to kobo for consistency
            reference,
            id: existingPayment.id,
            status: existingPayment.status,
            paid_at: existingPayment.created_at
          },
          message: 'Payment already verified and recorded'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Record the payment in database
    const amountInNaira = amount / 100 // Convert from kobo to Naira
    console.log(`[${executionId}] Recording payment: amountInNaira=${amountInNaira}, organization_id=${organization_id}, student_id=${student_id}, due_id=${due_id}, reference=${reference}`)

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id,
        student_id,
        due_id,
        amount_paid: amountInNaira,
        paystack_reference: reference,
        status: 'success',
        paid_at: new Date().toISOString(),
      })
      .select('id, amount_paid, paystack_reference, status, paid_at, created_at')

    if (paymentError) {
      console.error(`[${executionId}] Error recording payment:`, paymentError)
      return new Response(
        JSON.stringify({ error: `Failed to record payment: ${paymentError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const recordedPayment = paymentData[0]
    console.log(`[${executionId}] Payment successfully recorded: reference=${reference}, paymentId=${recordedPayment.id}`)

    // Return success response
    const responseBody = {
      success: true,
      data: {
        amount,
        reference,
        id: recordedPayment.id,
        status: recordedPayment.status,
        paid_at: recordedPayment.paid_at
      }
    }
    console.log(`[${executionId}] Returning success response:`, responseBody)
    return new Response(
      JSON.stringify(responseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error(`[${executionId}] Edge Function error:`, error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})