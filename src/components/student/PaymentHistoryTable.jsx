import { useState } from 'react';

export default function PaymentHistoryTable({ payments }) {
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first

  // Sort payments based on selected criteria
  const sortedPayments = [...(payments || [])].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.payment_date || a.paid_at).getTime();
      const dateB = new Date(b.payment_date || b.paid_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
    // Add other sort options if needed in future
    return 0;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => {
              setSortBy('date');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className={`px-3 py-1 rounded border-gray-300 hover:bg-gray-50 ${
              sortBy === 'date' && sortOrder === 'desc'
                ? 'bg-primary-50 text-primary-600'
                : ''
            }`}
          >
            Date
            {sortBy === 'date' && (
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={sortOrder === 'desc' ? "M19 9l-7 7-7-7" : "M19 15l-7-7-7 7"} />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              setSortBy('amount');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className={`px-3 py-1 rounded border-gray-300 hover:bg-gray-50 ${
              sortBy === 'amount' && sortOrder === 'desc'
                ? 'bg-primary-50 text-primary-600'
                : ''
            }`}
          >
            Amount
            {sortBy === 'amount' && (
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={sortOrder === 'desc' ? "M19 9l-7 7-7-7" : "M19 15l-7-7-7 7"} />
              </svg>
            )}
          </button>
        </div>
      </div>

      {sortedPayments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No payment history yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Amount (₦)
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Reference
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((payment) => (
                <tr key={payment.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(payment.payment_date || payment.paid_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ₦{Number(payment.amount || payment.amount_paid).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {payment.reference || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'completed' || payment.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'pending' || payment.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : payment.status === 'failed' || payment.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                      >
                      {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)?.toLowerCase() || 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}