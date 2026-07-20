import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PaymentModal({ due, onClose }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Calculate total paid by this student for this due
  const totalPaid = due.payments
    ?.filter((payment) => payment.student_id === user?.id)
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

  const remainingAmount = due.amount - totalPaid;
  // Define limits based on remaining amount
  // If no amount remaining, don't allow any payment
  let maxAmount = 0;
  let minAmount = 0;

  if (remainingAmount > 0) {
    maxAmount = remainingAmount;
    const baseMinAmount = 100; // Define your minimum here
    // If remaining amount is less than base minimum, allow paying the remaining amount to clear the due
    minAmount = remainingAmount >= baseMinAmount ? baseMinAmount : remainingAmount;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let finalOrgId = due.organization_id;

      if (!finalOrgId) {
        const { data: fetchedDue, error: fetchError } = await supabase
          .from('dues')
          .select('organization_id')
          .eq('id', due.id)
          .single();

        if (fetchError || !fetchedDue?.organization_id) {
          throw new Error("Could not retrieve organization info. Please refresh.");
        }
        finalOrgId = fetchedDue.organization_id;
      }

      const paymentAmount = parseFloat(amount);
      // Validate against Min and Max
      if (isNaN(paymentAmount) || paymentAmount < minAmount || paymentAmount > maxAmount) {
        throw new Error(`Amount must be between ₦${minAmount.toLocaleString()} and ₦${maxAmount.toLocaleString()}`);
      }

      if (!window.PaystackPop) throw new Error('Payment gateway not ready.');

      const handlePaystackSuccess = (response) => {
        supabase.functions.invoke('verify-paystack-payment', {
          body: {
            reference: response.reference,
            due_id: due.id,
            expectedAmount: Math.round(paymentAmount * 100),
            organization_id: finalOrgId,
          },
        })
        .then(({ error: funcError }) => {
          if (funcError) throw new Error(funcError.message);
          alert('Payment Successful!');
          onClose();
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
      };

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error('Please sign in again.');

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: authData.user.email,
        amount: Math.round(paymentAmount * 100),
        currency: 'NGN',
        metadata: { due_id: due.id, student_id: authData.user.id },
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6">
          <div className="mb-6 space-y-2">
            <p className="text-sm text-gray-500">Paying for: <span className="font-medium text-gray-900">{due.title}</span></p>
            {/* Added display of min/max limits */}
            <div className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <span>Min: ₦{minAmount.toLocaleString()}</span>
              <span>Max: ₦{maxAmount.toLocaleString()}</span>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 1000"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}