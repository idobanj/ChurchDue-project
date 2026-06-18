import { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export default function PaymentModal({ due, onClose }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const maxAmount = due.amount;
  const minAmount = 100;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount < minAmount) {
      setError(`Minimum payment amount is ₦${minAmount}`);
      return;
    }

    if (paymentAmount > maxAmount) {
      setError(`Amount cannot exceed remaining balance of ₦${maxAmount}`);
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error('Please sign in again.');

      const currentUser = authData.user;

      // Defined as a standard function outside the setup call for maximum compatibility
      const handlePaystackSuccess = async (response) => {
        try {
          const { error: functionError } = await supabase.functions.invoke('verify-paystack-payment', {
            body: {
              reference: response.reference,
              due_id: due.id,
              expectedAmount: Math.round(paymentAmount * 100),
            },
          });

          if (functionError) throw new Error(functionError.message || 'Verification failed');
          
          alert('Payment Successful!');
          onClose();
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };

      const handler = window.PaystackPop?.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: Math.round(paymentAmount * 100),
        currency: 'NGN',
        metadata: { due_id: due.id, student_id: currentUser.id },
        callback: handlePaystackSuccess,
        onClose: () => setLoading(false),
      });

      if (handler) {
        handler.openIframe();
      } else {
        throw new Error('Paystack could not be initialized.');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Make Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Paying for</p>
            <p className="font-semibold text-gray-900">{due.title}</p>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Due</span>
              <span className="font-medium text-gray-900">₦{due.amount.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minAmount}
                max={maxAmount}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}