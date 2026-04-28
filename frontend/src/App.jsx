import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Public Pages
import Landing from './pages/Landing'
import AdminLogin from './pages/AdminLogin'
import AdminSignup from './pages/AdminSignup'
import StudentLogin from './pages/StudentLogin'
import StudentSignup from './pages/StudentSignup'
import ForgotPassword from './pages/ForgotPassword'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import DuesManagement from './pages/admin/DuesManagement'
import StudentsPage from './pages/admin/StudentsPage'
import PaymentsPage from './pages/admin/PaymentsPage'
import RefundRequests from './pages/admin/RefundRequests'
import AdminSettings from './pages/admin/AdminSettings'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import StudentDues from './pages/student/StudentDues'
import StudentDueDetails from './pages/student/StudentDueDetails'

const queryClient = new QueryClient()

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/join/:slug" element={<StudentSignup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dues"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DuesManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <StudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/refunds"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <RefundRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dues"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDues />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dues/:id"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDueDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
