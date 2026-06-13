/** @format */

import {serve} from 'https://deno.land/std@0.192.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {headers: corsHeaders});
    }

    try {
        // READ ONCE AND DESTURCTURE
        const {reference, due_id, expectedAmount} = await req.json();

        if (!reference || !due_id || !expectedAmount) {
            return new Response(JSON.stringify({error: 'Missing fields'}), {
                headers: {...corsHeaders, 'Content-Type': 'application/json'},
                status: 400,
            });
        }

        const paystackResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        const paystackData = await paystackResponse.json();

        if (!paystackData.status || paystackData.data.status !== 'success') {
            return new Response(
                JSON.stringify({error: 'Verification failed'}),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                    status: 400,
                },
            );
        }

        const {amount, currency, metadata} = paystackData.data;

        if (amount !== expectedAmount || currency !== 'NGN') {
            return new Response(
                JSON.stringify({error: 'Mismatch in amount or currency'}),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                    status: 400,
                },
            );
        }

        const {student_id} = metadata || {};

        // Check existing
        const {data: existingPayment} = await supabase
            .from('payments')
            .select('id')
            .eq('paystack_reference', reference)
            .maybeSingle();

        if (existingPayment) {
            return new Response(
                JSON.stringify({verified: true, message: 'Already recorded'}),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                    status: 200,
                },
            );
        }

        // Insert
        const {data: paymentData, error: paymentError} = await supabase
            .from('payments')
            .insert({
                student_id,
                due_id,
                amount_paid: amount / 100,
                paystack_reference: reference,
                status: 'success',
                paid_at: new Date().toISOString(),
            })
            .select();

        if (paymentError) throw paymentError;

        return new Response(
            JSON.stringify({verified: true, paymentId: paymentData[0]?.id}),
            {
                headers: {...corsHeaders, 'Content-Type': 'application/json'},
                status: 200,
            },
        );
    } catch (error) {
        return new Response(JSON.stringify({error: error.message}), {
            headers: {...corsHeaders, 'Content-Type': 'application/json'},
            status: 500,
        });
    }
});
