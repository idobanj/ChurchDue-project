import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDueDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: due, isLoading: dueLoading } = useQuery({
    queryKey: ['adminDue', id, user?.organization_id],
    enabled: Boolean(id && user?.organization_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dues')
        .select('id, title, description, amount, status, organization_id, created_at')
        .eq('id', id)
        .eq('organization_id', user.organization_id)
        .single()

      if (error) throw error
      return data
    },
  })

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['dueStudents', user?.organization_id],
    enabled: Boolean(user?.organization_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('organization_id', user.organization_id)
        .eq('role', 'student')

      if (error) throw error
      return data || []
    },
  })

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['duePayments', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, student_id, amount_paid, status, paid_at, users (full_name, email)')
        .eq('due_id', id)

      if (error) throw error
      return data || []
    },
  })

  const rows = useMemo(() => {
    if (!due || !students) return []

    return students.map((student) => {
      const studentPayments = (payments || []).filter((payment) => payment.student_id === student.id)
      const amountPaid = studentPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0)
      const amountRemaining = Math.max((due.amount || 0) - amountPaid, 0)
      const paymentStatus =
        amountPaid <= 0 ? 'pending' : amountRemaining > 0 ? 'partial' : 'completed'

      return {
        studentName: student.full_name,
        studentEmail: student.email,
        amountPaid,
        amountRemaining,
        paymentStatus,
      }
    })
  }, [due, students, payments])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        row.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || row.paymentStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, searchTerm, statusFilter])

  function exportToCSV() {
    const headers = ['Student Name', 'Student Email', 'Amount Paid', 'Amount Remaining', 'Status']
    const csvRows = filteredRows.map((row) => [
      row.studentName,
      row.studentEmail,
      row.amountPaid,
      row.amountRemaining,
      row.paymentStatus,
    ])

    const csvContent = [headers, ...csvRows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `due-${due?.title || 'details'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const isLoading = dueLoading || studentsLoading || paymentsLoading

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin/dues" className="text-sm text-primary-600 hover:text-primary-500">
              ← Back to Dues
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{due?.title || 'Due Details'}</h1>
            <p className="text-gray-600 mt-1">{due?.description || 'Payment records for this due'}</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Due Amount</p>
            <p className="text-2xl font-bold text-gray-900">₦{due?.amount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {rows.filter((row) => row.paymentStatus === 'completed').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Loading due details...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No students match your filters
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.studentEmail} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{row.studentName}</p>
                        <p className="text-sm text-gray-500">{row.studentEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-600">₦{row.amountPaid.toLocaleString()}</td>
                      <td className="px-6 py-4 font-semibold text-orange-600">
                        ₦{row.amountRemaining.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            row.paymentStatus === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : row.paymentStatus === 'partial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {row.paymentStatus}
                        </span>
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
