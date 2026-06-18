import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminSettings() {
  const { user } = useAuth()
  const [copySuccess, setCopySuccess] = useState(false)
  const [paystackConnected, setPaystackConnected] = useState(false)

  const { data: organization } = useQuery({
    queryKey: ['organization', user?.organization_id],
    enabled: Boolean(user?.organization_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, paystack_connected')
        .eq('id', user.organization_id)
        .single()

      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    if (organization?.paystack_connected) {
      setPaystackConnected(organization.paystack_connected)
    }
  }, [organization])

  const inviteLink = `${window.location.origin}/join/${organization?.slug || ''}`

  function handleCopyInvite() {
    navigator.clipboard.writeText(inviteLink)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your organization settings</p>
        </div>

        <div className="space-y-6">
          {/* Organization Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Organization Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Church Name
                </label>
                <input
                  type="text"

                  value={organization?.name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Slug
                </label>
                <input
                  type="text"
                  value={organization?.slug || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Invite Link */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invite Link</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share this link with students to allow them to join your organization
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm min-w-0"
              />
              <button
                onClick={handleCopyInvite}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  copySuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Paystack Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Integration</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Paystack</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {paystackConnected
                    ? 'Your Paystack account is connected'
                    : 'Connect your Paystack account to receive payments'}
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    paystackConnected
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {paystackConnected ? 'Connected' : 'Not Connected'}
                </span>
                <button
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 whitespace-nowrap"
                >
                  {paystackConnected ? 'Configure' : 'Connect Paystack'}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 border-red-500 dark:border-red-500">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Irreversible and destructive actions
            </p>
            <button className="px-4 py-2 border border-red-500 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
              Delete Organization
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
