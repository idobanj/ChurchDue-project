import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'
import { useAuth } from '../../contexts/AuthContext'

export default function DuesManagement() {
  const { user } = useAuth()
  console.log('DuesManagement - Current user:', user) // Debug log
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingDue, setEditingDue] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    status: 'active',
  })

  const { data: dues, isLoading } = useQuery({
    queryKey: ['dues', user?.organization_id],
    enabled: Boolean(user?.organization_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dues')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const createDue = useMutation({
    mutationFn: async (dueData) => {
      console.log('Attempting to create due with data:', dueData)
      const { data, error } = await supabase
        .from('dues')
        .insert(dueData)
        .select()

      if (error) {
        console.error('Supabase Insert Error:', error)
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dues'])
      setShowModal(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Mutation Error:', error)
      alert(`Failed to create due: ${error.message}`)
    }
  })

  const updateDue = useMutation({
    mutationFn: async ({ id, ...dueData }) => {
      console.log('Attempting to update due with id:', id, 'and data:', dueData)
      const { data, error } = await supabase
        .from('dues')
        .update(dueData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Supabase Update Error:', error)
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dues'])
      setShowModal(false)
      setEditingDue(null)
      resetForm()
    },
    onError: (error) => {
      console.error('Update Mutation Error:', error)
      alert(`Failed to update due: ${error.message}`)
    },
  })

  const deleteDue = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('dues')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dues'])
    },
  })

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      amount: '',
      status: 'active',
    })
  }

  function handleEdit(due) {
    setEditingDue(due)
    setFormData({
      title: due.title,
      description: due.description || '',
      amount: due.amount.toString(),
      status: due.status,
    })
    setShowModal(true)
  }

  function handleSubmit(e) {
    e.preventDefault()

    console.log('Form submit - user:', user) // Debug log
    console.log('Form submit - formData:', formData) // Debug log

    if (!user) {
      alert('Error: No user found. Please log in again.')
      return
    }

    if (!user?.organization_id) {
      alert('Error: No organization associated with your account. Please try logging out and in again, or check your user profile in the database.')
      console.log('User object missing organization_id:', user) // Debug log
      return
    }

    // Validate amount
    const amountValue = parseFloat(formData.amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    const dueData = {
      ...formData,
      amount: amountValue,
      organization_id: user.organization_id,
    }

    if (editingDue) {
      updateDue.mutate({ id: editingDue.id, ...dueData })
    } else {
      createDue.mutate(dueData)
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dues Management</h1>
            <p className="text-gray-600 mt-1">Create and manage church dues</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setEditingDue(null)
              setShowModal(true)
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Due</span>
          </button>
        </div>

        {/* Dues Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading dues...
                  </td>
                </tr>
              ) : dues?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No dues created yet. Click "Create Due" to get started.
                  </td>
                </tr>
              ) : (
                dues?.map((due) => (
                  <tr key={due.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <Link to={`/admin/dues/${due.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                          {due.title}
                        </Link>
                        {due.description && (
                          <p className="text-sm text-gray-500 truncate max-w-md">{due.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">₦{due.amount?.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          due.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {due.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(due.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(due)}
                          className="text-primary-600 hover:text-primary-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this due?')) {
                              deleteDue.mutate(due.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingDue ? 'Edit Due' : 'Create New Due'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Monthly Fellowship Dues"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Brief description of this due"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDue.isPending || updateDue.isPending}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {createDue.isPending || updateDue.isPending ? 'Saving...' : editingDue ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}