import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Simple test page
function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-2xl font-bold text-blue-600">Church Dues Platform - Loading...</div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TestPage />} />
      <Route path="/admin/login" element={<TestPage />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}

export default App
