import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';
import PaymentHistoryTable from '../../components/student/PaymentHistoryTable';

export default function AdminStudentLedger() {
  const { id } = useParams(); // The student's ID from the URL

  // Fetch student details
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['adminStudentProfile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch payments list
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['adminStudentLedger', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount_paid,
          paid_at,
          status,
          reference:paystack_reference,
          dues (title)
        `)
        .eq('student_id', id)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingStudent || loadingPayments;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <div className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="mb-6">
          <Link to="/admin/students" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4 uppercase tracking-wider">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Students
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Student Payment Ledger</h1>
        </div>

        {loadingStudent ? (
          <div className="card p-6 mb-6 animate-pulse bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ) : student ? (
          <div className="card p-6 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-sm shadow-blue-500/20">
                {student.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{student.full_name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1 uppercase tracking-wider">{student.email}</p>
              </div>
            </div>
          </div>
        ) : null}
        
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