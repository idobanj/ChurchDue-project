import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function StudentSidebar() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const navItems = [
    { path: '/student/dashboard', label: 'Overview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { path: '/student/dues', label: 'My Dues', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
  ]

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-30 w-full">
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-sm">Church Dues</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Student Portal</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-600 focus:outline-none dark:text-gray-400"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex md:flex-col border-r dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">Church Dues</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Student Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Theme</span>
            <ThemeToggle />
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {user?.full_name?.[0]?.toUpperCase() || 'S'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                    {user?.full_name || 'Student'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Student</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
