import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function RefundModal({ due, totalPaid, onClose }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createRefund = useMutation({
    mutationFn: async (refundData) => {
      const { data, error } = await supabase
        .from('refunds')
        .insert(refundData)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['refunds'])
      onClose()
      alert('Refund request submitted successfully!')
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const refundAmount = parseFloat(amount)

    if (isNaN(refundAmount) || refundAmount <= 0) {
      setError('Please enter a valid refund amount')
      return
    }

    if (refundAmount > totalPaid) {
      setError('Refund amount cannot exceed total paid')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund request')
      return
    }

    setLoading(true)

    if (!user?.id || !user?.organization_id) {
      setError('Unable to submit refund request. Please sign in again.')
      setLoading(false)
      return
    }

    createRefund.mutate({
      payment_id: due.payments?.[0]?.id, // Get appropriate payment ID
      student_id: user.id,
      organization_id: user.organization_id,
      amount: refundAmount,
      reason: reason.trim(),
      status: 'pending',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Request Refund</h2>
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
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Due</p>
            <p className="font-semibold text-gray-900">{due.title}</p>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-medium text-green-600">₦{totalPaid.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Amount (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={totalPaid}
                step="0.01"
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₦{totalPaid.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Refund
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Please explain why you're requesting a refund..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
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
                disabled={loading || createRefund.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || createRefund.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Refund requests are subject to approval by your church admin. Processing may take 3-5 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
