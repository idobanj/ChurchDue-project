import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

export default function RefundRequests() {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const { data: refunds, isLoading } = useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select(`
          id,
          amount,
          reason,
          status,
          created_at,
          payment_id,
          student_id,
          organization_id,
          users (full_name, email),
          payments (due_id),
          dues (title)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const updateRefund = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data, error } = await supabase
        .from('refunds')
        .update({ status })
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['refunds'])
      setShowModal(false)
      setSelectedRequest(null)
    },
  })

  function handleApprove(refund) {
    updateRefund.mutate({ id: refund.id, status: 'approved' })
  }

  function handleReject(refund) {
    updateRefund.mutate({ id: refund.id, status: 'rejected' })
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Refund Requests</h1>
          <p className="text-gray-600 mt-1">Review and process student refund requests</p>
        </div>

        {/* Refund Requests Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading refund requests...
                  </td>
                </tr>
              ) : refunds?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No refund requests yet
                  </td>
                </tr>
              ) : (
                refunds?.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{refund.users?.full_name}</p>
                        <p className="text-sm text-gray-500">{refund.users?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{refund.dues?.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        ₦{refund.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate">{refund.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          refund.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : refund.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(refund.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {refund.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleApprove(refund)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(refund)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
