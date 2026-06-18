import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalDues: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalStudents: 0,
  })

  const { data: recentPayments } = useQuery({
    queryKey: ['recentPayments', user?.organization_id],
    enabled: Boolean(user?.organization_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          paid_at,
          student_id,
          due_id,
          users (full_name),
          dues (title)
        `)
        .order('paid_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    async function fetchStats() {
      if (!user?.organization_id) return
      // Fetch dues count
      const { count: duesCount } = await supabase
        .from('dues')
        .select('*', { head: true, count: 'exact' })
        .eq('organization_id', user.organization_id)

      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('users')
        .select('*', { head: true, count: 'exact' })
        .eq('organization_id', user.organization_id)
        .eq('role', 'student')

      // Fetch payments sum
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount_paid')

      const totalCollected = paymentsData?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0

      setStats({
        totalDues: duesCount || 0,
        totalStudents: studentsCount || 0,
        totalCollected,
        totalOutstanding: 0, // Will be calculated based on dues - payments
      })
    }

    fetchStats()
  }, [user?.organization_id])

  const chartData = [
    { name: 'Collected', amount: stats.totalCollected },
    { name: 'Outstanding', amount: stats.totalOutstanding },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your church dues.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Dues</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDues}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₦{stats.totalCollected.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₦{stats.totalOutstanding.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Chart and Recent Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Overview</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} className="dark:[&>*]:stroke-gray-600" />
                <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-gray-400" tick={{ fill: 'currentColor' }} />
                <YAxis stroke="#6b7280" className="dark:stroke-gray-400" tick={{ fill: 'currentColor' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(31 41 55)',
                    border: '1px solid rgb(55 65 81)',
                    borderRadius: '0.5rem',
                    color: 'rgb(243 244 246)',
                  }}
                  cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                />
                <Bar dataKey="amount" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
              <Link to="/admin/payments" className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentPayments?.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No payments yet</p>
              ) : (
                recentPayments?.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{payment.users?.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{payment.dues?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">₦{payment.amount_paid?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(payment.paid_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
