/** @format */

import {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2';

export const isUuid = (value: unknown): boolean =>
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );

export const isReference = (value: unknown): boolean =>
    typeof value === 'string' && /^[A-Za-z0-9._=-]{6,128}$/.test(value);

export interface RecordPaymentParams {
    reference: string;
    dueId: string;
    studentId: string;
    paystackSecretKey: string;
    executionId: string;
}

export interface RecordPaymentResult {
    success: boolean;
    status: number;
    error?: string;
    message?: string;
    data?: {
        amount: number;
        reference: string;
        id: string;
        status: string;
        paid_at: string;
    };
}

export async function recordPayment(
    adminSupabase: SupabaseClient,
    params: RecordPaymentParams,
): Promise<RecordPaymentResult> {
    const {reference, dueId, studentId, paystackSecretKey, executionId} =
        params;

    // 1. Fetch the due and check if active
    const {data: dueData, error: dueError} = await adminSupabase
        .from('dues')
        .select('id, organization_id, amount, status')
        .eq('id', dueId)
        .maybeSingle();

    if (dueError) {
        console.error(`[${executionId}] Due lookup failed`, dueError);
        return {
            success: false,
            status: 500,
            error: 'Database error while fetching due',
        };
    }
    if (!dueData) {
        return {success: false, status: 404, error: 'Due not found'};
    }
    if (dueData.status !== 'active') {
        return {
            success: false,
            status: 400,
            error: 'This due is not accepting payments',
        };
    }

    // 2. Fetch student profile and check role/organization match
    const {data: studentProfile, error: studentProfileError} =
        await adminSupabase
            .from('users')
            .select('id, organization_id, role')
            .eq('id', studentId)
            .maybeSingle();

    if (studentProfileError || !studentProfile) {
        console.error(
            `[${executionId}] Student profile lookup failed`,
            studentProfileError,
        );
        return {success: false, status: 403, error: 'Caller profile not found'};
    }
    if (
        studentProfile.role !== 'student' ||
        studentProfile.organization_id !== dueData.organization_id
    ) {
        return {success: false, status: 403, error: 'Forbidden'};
    }

    // 3. Verify transaction with Paystack
    const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
                'Content-Type': 'application/json',
            },
        },
    );

    if (!paystackResponse.ok) {
        console.error(
            `[${executionId}] Paystack verification request failed`,
            paystackResponse.status,
        );
        return {success: false, status: 502, error: 'Unable to verify payment'};
    }

    const paystackData = await paystackResponse.json();
    if (!paystackData.status || paystackData.data?.status !== 'success') {
        return {
            success: false,
            status: 400,
            error: 'Payment verification failed',
        };
    }

    // 4. Validate metadata
    const {amount, currency, metadata} = paystackData.data;
    const metadataDueId = metadata?.due_id;
    const metadataStudentId = metadata?.student_id;

    if (currency !== 'NGN' || typeof amount !== 'number' || amount <= 0) {
        return {success: false, status: 400, error: 'Invalid payment details'};
    }
    if (metadataDueId !== dueId || metadataStudentId !== studentId) {
        return {
            success: false,
            status: 403,
            error: 'Payment metadata mismatch',
        };
    }

    // 5. Check duplicate payment reference
    const {data: existingPayment, error: existingPaymentError} =
        await adminSupabase
            .from('payments')
            .select(
                'id, amount_paid, status, paid_at, created_at, due_id, student_id, organization_id',
            )
            .eq('paystack_reference', reference)
            .maybeSingle();

    if (existingPaymentError) {
        console.error(
            `[${executionId}] Existing payment lookup failed`,
            existingPaymentError,
        );
        return {
            success: false,
            status: 500,
            error: 'Database error while checking payment',
        };
    }

    if (existingPayment) {
        if (
            existingPayment.student_id !== studentId ||
            existingPayment.due_id !== dueId ||
            existingPayment.organization_id !== dueData.organization_id
        ) {
            return {
                success: false,
                status: 409,
                error: 'Payment reference already belongs to another record',
            };
        }

        return {
            success: true,
            status: 200,
            data: {
                amount: Math.round(existingPayment.amount_paid * 100),
                reference,
                id: existingPayment.id,
                status: existingPayment.status,
                paid_at: existingPayment.paid_at || existingPayment.created_at,
            },
            message: 'Payment already verified and recorded',
        };
    }

    // 6. Calculate outstanding balance & Prevent overpayment
    const {data: previousPayments, error: previousPaymentsError} =
        await adminSupabase
            .from('payments')
            .select('amount_paid')
            .eq('due_id', dueId)
            .eq('student_id', studentId)
            .eq('status', 'completed');

    if (previousPaymentsError) {
        console.error(
            `[${executionId}] Previous payment lookup failed`,
            previousPaymentsError,
        );
        return {
            success: false,
            status: 500,
            error: 'Database error while checking balance',
        };
    }

    // We store the student's intended payment amount in Paystack's metadata and read it here 
    // instead of relying on Paystack's transaction amount field. If "Pass fees to customers" is enabled,
    // Paystack's transaction amount includes the added processing fee (e.g. ₦203.50 instead of ₦200),
    // which must not be credited to the student's due.
    const metadataPaymentAmount = metadata?.payment_amount;
    const amountInNaira =
        typeof metadataPaymentAmount === 'number' && metadataPaymentAmount > 0
            ? metadataPaymentAmount
            : amount / 100;
    const totalPaid =
        previousPayments?.reduce(
            (sum, payment) => sum + (payment.amount_paid || 0),
            0,
        ) || 0;
    const remainingAmount = dueData.amount - totalPaid;

    if (amountInNaira <= 0 || amountInNaira > remainingAmount) {
        return {
            success: false,
            status: 400,
            error: 'Payment amount exceeds outstanding balance',
        };
    }

    // 7. Insert payment
    const {data: paymentData, error: paymentError} = await adminSupabase
        .from('payments')
        .insert({
            organization_id: dueData.organization_id,
            student_id: studentId,
            due_id: dueId,
            amount_paid: amountInNaira,
            paystack_reference: reference,
            status: 'completed',
            paid_at: new Date().toISOString(),
        })
        .select(
            'id, amount_paid, paystack_reference, status, paid_at, created_at',
        )
        .single();

    if (paymentError) {
        if (paymentError.code === '23505') {
            return {
                success: false,
                status: 409,
                error: 'Payment has already been recorded',
            };
        }
        console.error(`[${executionId}] Payment insert failed`, paymentError);
        return {success: false, status: 500, error: 'Failed to record payment'};
    }

    console.log(`[${executionId}] Payment recorded`, {
        paymentId: paymentData.id,
        dueId,
        studentId,
    });

    return {
        success: true,
        status: 200,
        data: {
            amount: Math.round(amountInNaira * 100),
            reference,
            id: paymentData.id,
            status: paymentData.status,
            paid_at: paymentData.paid_at,
        },
    };
}
