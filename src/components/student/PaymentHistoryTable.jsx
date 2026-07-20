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
    if (sortBy === 'amount') {
      const amtA = Number(a.amount || a.amount_paid) || 0;
      const amtB = Number(b.amount || b.amount_paid) || 0;
      return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
    }
    return 0;
  });

  // Check if we should display the "Due" column (if at least one payment has dues.title)
  const showDueColumn = payments?.some((p) => p.dues?.title);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Payment History
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mr-1 hidden sm:inline">
            Sort:
          </span>
          <button
            onClick={() => {
              setSortBy('date');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className={`inline-flex items-center px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors ${
              sortBy === 'date' && sortOrder === 'desc'
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                : ''
            }`}
          >
            Date
            {sortBy === 'date' && (
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    sortOrder === 'desc'
                      ? 'M19 9l-7 7-7-7'
                      : 'M19 15l-7-7-7 7'
                  }
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              setSortBy('amount');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className={`inline-flex items-center px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors ${
              sortBy === 'amount' && sortOrder === 'desc'
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                : ''
            }`}
          >
            Amount
            {sortBy === 'amount' && (
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    sortOrder === 'desc'
                      ? 'M19 9l-7 7-7-7'
                      : 'M19 15l-7-7-7 7'
                  }
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {sortedPayments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No payment history yet</p>
        </div>
      ) : (
        <>
          {/* Tablet/desktop: regular table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {showDueColumn && (
                    <th className="text-left px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      Due Item
                    </th>
                  )}
                  <th className="text-left px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Amount (₦)
                  </th>
                  <th className="text-left px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Reference
                  </th>
                  <th className="text-left px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {showDueColumn && (
                      <td className="px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100 break-words max-w-[180px]">
                        {payment.dues?.title || '-'}
                      </td>
                    )}
                    <td className="px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {new Date(
                        payment.payment_date || payment.paid_at
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      ₦
                      {Number(
                        payment.amount || payment.amount_paid
                      ).toLocaleString()}
                    </td>
                    <td className="px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-[160px]">
                      <span
                        className="block truncate"
                        title={payment.reference || '-'}
                      >
                        {payment.reference || '-'}
                      </span>
                    </td>
                    <td className="px-2 md:px-3 lg:px-4 py-3 text-xs md:text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === 'completed' ||
                          payment.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : payment.status === 'pending' ||
                              payment.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                              : payment.status === 'failed' ||
                                  payment.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {payment.status?.charAt(0).toUpperCase() +
                          payment.status?.slice(1)?.toLowerCase() ||
                          'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-3">
            {sortedPayments.map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    {showDueColumn && (
                      <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                        {payment.dues?.title || 'Payment'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(
                        payment.payment_date || payment.paid_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'completed' ||
                      payment.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : payment.status === 'pending' ||
                            payment.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                          : payment.status === 'failed' ||
                              payment.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {payment.status?.charAt(0).toUpperCase() +
                      payment.status?.slice(1)?.toLowerCase() ||
                      'Completed'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    ₦
                    {Number(payment.amount || payment.amount_paid).toLocaleString()}
                  </p>
                  <p
                    className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0"
                    title={payment.reference || '-'}
                  >
                    {payment.reference || '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
