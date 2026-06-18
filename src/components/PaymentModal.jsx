/** @format */

import {useState} from 'react';
import {supabase} from '../services/supabaseClient';

export default function PaymentModal({due, onClose}) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const maxAmount = due.amount;
    const minAmount = 100;

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const paymentAmount = parseFloat(amount);
        if (
            isNaN(paymentAmount) ||
            paymentAmount < minAmount ||
            paymentAmount > maxAmount
        ) {
            setError(`Amount must be between ₦${minAmount} and ₦${maxAmount}`);
            return;
        }

        if (!window.PaystackPop) {
            setError('Payment gateway is still loading. Please try again.');
            return;
        }

        setLoading(true);

        // 1. Define callback as a standard, non-async function reference
        const handlePaystackSuccess = (response) => {
            // Perform verification after Paystack confirms
            supabase.functions
                .invoke('verify-paystack-payment', {
                    body: {
                        reference: response.reference,
                        due_id: due.id,
                        expectedAmount: Math.round(paymentAmount * 100),
                        organization_id: due.organization_id,
                    },
                })
                .then(({error: funcError}) => {
                    if (funcError) throw new Error(funcError.message);
                    alert('Payment Successful!');
                    onClose();
                })
                .catch((err) => {
                    setError(err.message);
                    setLoading(false);
                });
        };

        try {
            const {data: authData} = await supabase.auth.getUser();
            const currentUser = authData?.user;
            if (!currentUser) throw new Error('Please sign in again.');

            // 2. Initialize using the function reference
            const handler = window.PaystackPop.setup({
                key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
                email: currentUser.email,
                amount: Math.round(paymentAmount * 100),
                currency: 'NGN',
                metadata: {due_id: due.id, student_id: currentUser.id},
                callback: handlePaystackSuccess,
                onClose: () => setLoading(false),
            });

            handler.openIframe();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-md p-6'>
                <h2 className='text-xl font-semibold mb-4'>Make Payment</h2>
                {error && (
                    <div className='mb-4 text-red-600 bg-red-50 p-3 rounded text-sm'>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <input
                        type='number'
                        className='w-full p-2 border rounded mb-4'
                        placeholder='Amount'
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                    <div className='flex gap-2'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='flex-1 p-2 border rounded'>
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={loading}
                            className='flex-1 p-2 bg-blue-600 text-white rounded'>
                            {loading ? 'Processing...' : 'Pay Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
