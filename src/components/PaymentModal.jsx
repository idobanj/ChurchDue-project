import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

export default function PaymentModal({ due, onClose }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maxAmount, setMaxAmount] = useState(due.amount)
  const minAmount = 100 // Minimum payment amount

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const paymentAmount = parseFloat(amount)

    if (isNaN(paymentAmount) || paymentAmount < minAmount) {
      setError(`Minimum payment amount is ₦${minAmount}`)
      return
    }

    if (paymentAmount > maxAmount) {
      setError(`Amount cannot exceed remaining balance of ₦${maxAmount}`)
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) {
        throw new Error('Please sign in again to continue.')
      }
      const currentUser = authData.user
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('due_id', due.id)
        .eq('student_id', currentUser.id)

      const alreadyPaid = existingPayments?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0
      const remainingBalance = Math.max(due.amount - alreadyPaid, 0)
      setMaxAmount(remainingBalance)

      if (paymentAmount > remainingBalance) {
        throw new Error(`Amount cannot exceed remaining balance of ₦${remainingBalance}`)
      }

      // Initialize Paystack payment
      const handler = window.PaystackPop?.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: paymentAmount * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        metadata: {
          due_id: due.id,
          student_id: currentUser.id,
        },
        callback: function(response) {
          // Verify payment via our Edge Function
          const payload = {
            reference: response.reference,
            due_id: due.id,
            expectedAmount: Math.round(parseFloat(amount) * 100), // Ensure it's a number
          };
        
          console.log("SENDING TO EDGE FUNCTION:", JSON.stringify(payload, null, 2));
        
          supabase.functions.invoke('verify-paystack-payment', {
            body: payload,
          })
        },
        onClose: () => {
          setLoading(false)
        },
      })

      if (handler) {
        handler.openIframe()
      } else {
        setError('Paystack not loaded. Please check your connection.')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Make Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Paying for</p>
            <p className="font-semibold text-gray-900">{due.title}</p>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total Due</span>
              <span className="font-medium text-gray-900">₦{due.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Remaining</span>
              <span className="font-medium text-orange-600">₦{maxAmount.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minAmount}
                max={maxAmount}
                step="0.01"
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: ₦{minAmount} | Max: ₦{maxAmount}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !amount}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
