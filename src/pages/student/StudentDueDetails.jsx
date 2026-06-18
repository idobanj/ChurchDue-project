import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import StudentSidebar from '../../components/StudentSidebar'
import PaymentModal from '../../components/PaymentModal'
import RefundModal from '../../components/RefundModal'
import PaymentHistoryTable from '../../components/student/PaymentHistoryTable'
import { useAuth } from '../../contexts/AuthContext'

export default function StudentDueDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)

  const { data: due, isLoading } = useQuery({
    queryKey: ['due', id, user?.id, user?.organization_id],
    enabled: Boolean(id && user?.id && user?.organization_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dues')
        .select(`
          id,
          title,
          description,
          amount,
          status,
          created_at,
          payments (
            id,
            student_id,
            amount_paid,
            paid_at,
            status
          )
        `)
        .eq('id', id)
        .eq('organization_id', user.organization_id)
        .single()

      if (error) throw error
      return {
        ...data,
        payments: data.payments?.filter((payment) => payment.student_id === user.id) || [],
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!due) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentSidebar />
        <div className="flex-1 p-4 md:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Due not found</h2>
            <button
              onClick={() => navigate('/student/dues')}
              className="mt-4 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Back to Dues
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalPaid = due.payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
  const remaining = due.amount - totalPaid
  const isFullyPaid = remaining <= 0

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentSidebar />
      <div className="flex-1 p-4 md:p-8">
        <button
          onClick={() => navigate('/student/dues')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dues
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Due Details */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{due.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{due.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{due.amount.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">₦{totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">₦{remaining.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>Payment Progress</span>
                <span>{Math.round((totalPaid / due.amount) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    isFullyPaid ? 'bg-green-600 dark:bg-green-500' : 'bg-primary-600 dark:bg-primary-500'
                  }`}
                  style={{ width: `${(totalPaid / due.amount) * 100}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!isFullyPaid && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Make Payment
                </button>
              )}
              {totalPaid > 0 && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Request Refund
                </button>
              )}
            </div>
          </div>

          {/* Payment History */}
          <PaymentHistoryTable payments={due.payments} />
        </div>

        {/* Modals */}
        {showPaymentModal && (
          <PaymentModal
            due={due}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
        {showRefundModal && (
          <RefundModal
            due={due}
            totalPaid={totalPaid}
            onClose={() => setShowRefundModal(false)}
          />
        )}
      </div>
    </div>
  )
}
