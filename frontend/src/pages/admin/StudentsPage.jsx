import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

export default function StudentsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          date_of_birth,
          profile_picture_url,
          payments (amount_paid)
        `)
        .eq('role', 'student')

      if (error) throw error
      return data
    },
  })

  function getTotalPaid(student) {
    return student.payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">View and manage all students in your organization</p>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : students?.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-500">No students have joined yet</p>
              <p className="text-sm text-gray-400 mt-1">Share your invite link to onboard students</p>
            </div>
          ) : (
            students?.map((student) => (
              <div key={student.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {student.profile_picture_url ? (
                      <img
                        src={student.profile_picture_url}
                        alt={student.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-primary-600">
                        {student.full_name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{student.full_name}</h3>
                    <p className="text-sm text-gray-500 truncate">{student.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Joined {new Date(student.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Paid</p>
                    <p className="text-lg font-semibold text-green-600">
                      ₦{getTotalPaid(student).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Status</p>
                    <p className="text-sm font-medium text-gray-700">Active</p>
                  </div>
                </div>

                <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  View Profile
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
