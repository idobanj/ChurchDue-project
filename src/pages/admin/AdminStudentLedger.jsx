import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';
import PaymentHistoryTable from '../../components/student/PaymentHistoryTable';

export default function AdminStudentLedger() {
  const { id } = useParams(); // The student's ID from the URL

  const { data: payments, isLoading } = useQuery({
    queryKey: ['adminStudentLedger', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          paid_at,
          status,
          reference,
          dues (title)
        `)
        .eq('student_id', id)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <div className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Student Payment Ledger</h1>
        
        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-medium">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading ledger...</span>
          </div>
        ) : (
          <PaymentHistoryTable payments={payments} />
        )}
      </div>
    </div>
  );
}