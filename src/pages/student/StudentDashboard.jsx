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
      const { data: dues,error } = await supabase
        .from('dues')
        .select('id, title, amount, organization_id, status')
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your dues and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Dues</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₦{stats?.totalDues.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">₦{stats?.totalPaid.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">₦{stats?.totalRemaining.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.completedCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
            <Link to="/student/dues" className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              View all dues
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No payments yet</p>
            ) : (
              recentPayments?.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{payment.dues?.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">₦{payment.amount_paid?.toLocaleString()}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
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
