/** @format */

import {useNavigate} from 'react-router-dom';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {supabase} from '../../services/supabaseClient';
import StudentSidebar from '../../components/StudentSidebar';
import PaymentModal from '../../components/PaymentModal';
import {useAuth} from '../../contexts/AuthContext';

export default function StudentDues() {
    const {user} = useAuth();
    const [selectedDue, setSelectedDue] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const {data: dues, isLoading} = useQuery({
        queryKey: ['studentDues', user?.organization_id, user?.id],
        enabled: Boolean(user?.organization_id && user?.id),
        queryFn: async () => {
            const {data, error} = await supabase
                .from('dues')
                .select(
                    `
          id, title, description, amount, status, created_at,
          payments!left (amount_paid, student_id)
        `,
                )
                .eq('organization_id', user.organization_id)
                .eq('status', 'active');

            if (error) throw error;
            return data;
        },
    });

    function getAmountPaid(due) {
        return (
            due.payments
                ?.filter((payment) => payment.student_id === user?.id)
                .reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
        );
    }

    function getPaymentStatus(due) {
        const paid = getAmountPaid(due);
        if (paid >= due.amount) return 'completed';
        if (paid > 0) return 'partial';
        return 'pending';
    }

    function handlePay(due) {
        setSelectedDue(due);
        setShowPaymentModal(true);
    }

    const navigate = useNavigate();

    function handleViewDetails(due) {
        // setSelectedDue(due);
        // setShowDetailsModal(true);
        navigate(`/student/due/${due.id}`);
    }

    return (
        <div className='flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900'>
            <StudentSidebar />
            <div className='flex-1 p-4 md:p-8'>
                <div className='mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                        My Dues
                    </h1>
                    <p className='text-gray-600 dark:text-gray-400 mt-1'>
                        View and pay your church dues
                    </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {isLoading ? (
                        <div className='col-span-full flex justify-center py-12'>
                            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
                        </div>
                    ) : dues?.length === 0 ? (
                        <div className='col-span-full text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm'>
                            <p className='text-gray-500 dark:text-gray-400'>No active dues</p>
                        </div>
                    ) : (
                        dues?.map((due) => {
                            const paid = getAmountPaid(due);
                            const remaining = due.amount - paid;
                            const status = getPaymentStatus(due);

                            return (
                                <div
                                    key={due.id}
                                    className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow'>
                                    <div className='flex items-start justify-between mb-4'>
                                        <h3 className='font-semibold text-gray-900 dark:text-gray-100 text-lg'>
                                            {due.title}
                                        </h3>
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                                status === 'completed'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                    : status === 'partial'
                                                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {status}
                                        </span>
                                    </div>

                                    {due.description && (
                                        <p className='text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2'>
                                            {due.description}
                                        </p>
                                    )}

                                    <div className='space-y-3 mb-4'>
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-gray-500 dark:text-gray-400'>
                                                Total Amount
                                            </span>
                                            <span className='font-semibold text-gray-900 dark:text-gray-100'>
                                                ₦{due.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className='flex space-x-2'>
                                        <button
                                            onClick={() =>
                                                handleViewDetails(due)
                                            }
                                            className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'>
                                            Details
                                        </button>
                                        {status !== 'completed' && (
                                            <button
                                                onClick={() => handlePay(due)}
                                                className='flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700'>
                                                Pay
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Details Modal Popup */}
                {/* {showDetailsModal && selectedDue && (
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md transition-colors'>
                            <h2 className='text-xl font-bold mb-4 text-gray-900 dark:text-white'>
                                {selectedDue.title}
                            </h2>
                            <div className='space-y-4'>
                                <p className='text-gray-600 dark:text-gray-300'>
                                    {selectedDue.description ||
                                        'No description provided.'}
                                </p>
                                <div className='flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4'>
                                    <span className='font-medium text-gray-700 dark:text-gray-400'>
                                        Total Amount
                                    </span>
                                    <span className='font-semibold text-gray-900 dark:text-white'>
                                        ₦{selectedDue.amount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className='mt-6 w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors'>
                                Close
                            </button>
                        </div>
                    </div>
                )} */}

                {/* Payment Modal */}
                {showPaymentModal && selectedDue && (
                    <PaymentModal
                        due={selectedDue}
                        onClose={() => {
                            setShowPaymentModal(false);
                            setSelectedDue(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
