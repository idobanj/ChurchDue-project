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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Student Payment Ledger</h1>
        
        {isLoading ? (
          <div>Loading ledger...</div>
        ) : (
          <PaymentHistoryTable payments={payments} />
        )}
      </div>
    </div>
  );
}