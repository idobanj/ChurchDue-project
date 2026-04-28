import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import StudentSidebar from '../../components/StudentSidebar'
import PaymentModal from '../../components/PaymentModal'

export default function StudentDues() {
  const navigate = useNavigate()
  const [selectedDue, setSelectedDue] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const { data: dues, isLoading } = useQuery({
    queryKey: ['studentDues'],
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
          payments (amount_paid)
        `)
        .eq('organization_id', 'org-id')
        .eq('status', 'active')

      if (error) throw error
      return data
    },
  })

  function getAmountPaid(due) {
    return due.payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
  }

  function getPaymentStatus(due) {
    const paid = getAmountPaid(due)
    if (paid >= due.amount) return 'completed'
    if (paid > 0) return 'partial'
    return 'pending'
  }

  function handlePay(due) {
    setSelectedDue(due)
    setShowPaymentModal(true)
  }

  function handleViewDetails(due) {
    navigate(`/student/dues/${due.id}`)
  }

  return (
    <div className="flex">
      <StudentSidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dues</h1>
          <p className="text-gray-600 mt-1">View and pay your church dues</p>
        </div>

        {/* Dues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : dues?.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No active dues</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for new dues</p>
            </div>
          ) : (
            dues?.map((due) => {
              const paid = getAmountPaid(due)
              const remaining = due.amount - paid
              const status = getPaymentStatus(due)

              return (
                <div key={due.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">{due.title}</h3>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : status === 'partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {due.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{due.description}</p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Amount</span>
                      <span className="font-semibold text-gray-900">₦{due.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Paid</span>
                      <span className="font-semibold text-green-600">₦{paid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Remaining</span>
                      <span className="font-semibold text-orange-600">₦{remaining.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((paid / due.amount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          status === 'completed' ? 'bg-green-600' : 'bg-primary-600'
                        }`}
                        style={{ width: `${(paid / due.amount) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(due)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </button>
                    {status !== 'completed' && (
                      <button
                        onClick={() => handlePay(due)}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedDue && (
          <PaymentModal
            due={selectedDue}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedDue(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
