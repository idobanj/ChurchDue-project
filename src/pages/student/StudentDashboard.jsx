import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import StudentSidebar from '../../components/StudentSidebar'
import { useAuth } from '../../contexts/AuthContext'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['studentStats', user?.id, user?.organization_id],
    enabled: Boolean(user?.id && user?.organization_id),
    queryFn: async () => {
      // Fetch student's payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_paid, status')
        .eq('student_id', user.id)

      const totalPaid = payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0

      // Fetch student's dues
      const { data: dues } = await supabase
        .from('dues')
        .select('amount, status')
        .eq('organization_id', user.organization_id)

      const totalDues = dues?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0

      return {
        totalDues,
        totalPaid,
        totalRemaining: totalDues - totalPaid,
        completedCount: dues?.filter(d => d.status === 'inactive').length || 0,
      }
    },
  })

  const { data: recentPayments } = useQuery({
    queryKey: ['recentPayments', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          paid_at,
          dues (title)
        `)
        .eq('student_id', user.id)
        .order('paid_at', { ascending: false })
        .limit(3)

      if (error) throw error
      return data
    },
  })

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentSidebar />
      <div className="flex-1 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your dues and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dues</p>
                <p className="text-3xl font-bold text-gray-900">₦{stats?.totalDues.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">₦{stats?.totalPaid.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-3xl font-bold text-orange-600">₦{stats?.totalRemaining.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.completedCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <Link to="/student/dues" className="text-sm text-primary-600 hover:text-primary-500">
              View all dues
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments?.length === 0 ? (
              <p className="text-gray-500 text-sm">No payments yet</p>
            ) : (
              recentPayments?.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.dues?.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₦{payment.amount_paid?.toLocaleString()}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Paid
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
