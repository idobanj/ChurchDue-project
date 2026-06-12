import { supabase } from './supabaseClient';

/**
 * Fetches the payment ledger for a specific student
 * @param {string} studentId - The ID of the student
 * @returns {Promise<Array>} Array of ledger objects containing due info, total paid, balance remaining, and payment history
 */
export const getStudentLedger = async (studentId) => {
  try {
    // Get student's organization ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', studentId)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('User not found');

    const organization_id = userData.organization_id;

    // Fetch all active dues for the student's organization
    const { data: duesData, error: duesError } = await supabase
      .from('dues')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('status', 'active');

    if (duesError) throw duesError;

    // If no dues, return empty array
    if (!duesData || duesData.length === 0) {
      return [];
    }

    const dueIds = duesData.map(due => due.id);

    // Fetch all payments made by this student for these dues
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .in('due_id', dueIds);

    if (paymentsError) throw paymentsError;

    // Group payments by due_id for efficient lookup
    const paymentsByDueId = {};
    (paymentsData || []).forEach(payment => {
      if (!paymentsByDueId[payment.due_id]) {
        paymentsByDueId[payment.due_id] = [];
      }
      paymentsByDueId[payment.due_id].push(payment);
    });

    // Build ledger with calculated fields
    const ledger = duesData.map(due => {
      const paymentsForDue = paymentsByDueId[due.id] || [];
      const total_paid = paymentsForDue.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const balance_remaining = Number(due.total_amount) - total_paid;

      return {
        due: {
          ...due,
          total_amount: Number(due.total_amount)
        },
        total_paid,
        balance_remaining,
        payments: paymentsForDue.map(payment => ({
          ...payment,
          amount: Number(payment.amount),
          payment_date: new Date(payment.payment_date)
        }))
      };
    });

    return ledger;
  } catch (error) {
    console.error('Error fetching student ledger:', error);
    throw error;
  }
};

/**
 * Fetches payment history for a specific student and due
 * @param {string} studentId - The ID of the student
 * @param {string} dueId - The ID of the due
 * @returns {Promise<Array>} Array of payment objects
 */
export const getPaymentHistory = async (studentId, dueId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .eq('due_id', dueId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(payment => ({
      ...payment,
      amount: Number(payment.amount),
      payment_date: new Date(payment.payment_date)
    }));
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

export default { getStudentLedger, getPaymentHistory };