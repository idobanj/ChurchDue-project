import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          paystack_reference,
          status,
          paid_at,
          created_at,
          student_id,
          due_id,
          users (full_name, email),
          dues (title)
        `)
        .order('paid_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch = payment.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.dues?.title?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  function exportToCSV() {
    const headers = ['Student Name', 'Student Email', 'Due Title', 'Amount', 'Status', 'Payment Date']
    const rows = filteredPayments?.map((payment) => [
      payment.users?.full_name,
      payment.users?.email,
      payment.dues?.title,
      payment.amount_paid,
      payment.status,
      new Date(payment.paid_at).toISOString(),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">Track all incoming payments</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by student name or due..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-10m-7-4a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredPayments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'No matching payments found' : 'No payments yet'}
                    </td>
                  </tr>
                ) : (
                  filteredPayments?.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{payment.users?.full_name}</p>
                          <p className="text-sm text-gray-500">{payment.users?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{payment.dues?.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-600">
                          ₦{payment.amount_paid?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(payment.paid_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {payment.paystack_reference?.substring(0, 12)}...
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
