import {lazy, Suspense} from 'react';
import {Routes, Route} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy Loaded Pages
const Landing = lazy(() => import('./pages/Landing'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminSignup = lazy(() => import('./pages/AdminSignup'));
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const StudentSignup = lazy(() => import('./pages/StudentSignup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const StudentJoin = lazy(() => import('./pages/StudentJoin'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminDueDetails = lazy(() => import('./pages/admin/AdminDueDetails'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const DuesManagement = lazy(() => import('./pages/admin/DuesManagement'));
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage'));
const RefundRequests = lazy(() => import('./pages/admin/RefundRequests'));
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'));
const AdminStudentLedger = lazy(() => import('./pages/admin/AdminStudentLedger'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentDueDetails = lazy(() => import('./pages/student/StudentDueDetails'));
const StudentDues = lazy(() => import('./pages/student/StudentDues'));

// Simple test page for development
function TestPage() {
    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
            <div className='text-2xl font-bold text-blue-600'>
                Component Under Development
            </div>
        </div>
    );
}

// Simple, clean loading fallback for lazy-loaded routes
function LoadingFallback() {
    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
            <div className='flex flex-col items-center justify-center space-y-4'>
                <svg className='animate-spin h-10 w-10 text-blue-600' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                </svg>
                <span className='text-sm font-semibold text-gray-500 dark:text-gray-400'>
                    Loading application...
                </span>
            </div>
        </div>
    );
}

function AppRoutes() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route path='/' element={<Landing />} />
                <Route path='/admin/login' element={<AdminLogin />} />
                <Route path='/admin/signup' element={<AdminSignup />} />

                {/* Admin Routes */}
                <Route
                    path='/admin/dashboard'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/admin/dues'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <DuesManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/admin/payments'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <PaymentsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/admin/students'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <StudentsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/admin/refunds'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <RefundRequests />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/admin/settings'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <AdminSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/admin/due/:id'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <AdminDueDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/admin/student/:id/ledger'
                    element={
                        <ProtectedRoute expectedRole='admin'>
                            <AdminStudentLedger />
                        </ProtectedRoute>
                    }
                />
                <Route path='/student/login' element={<StudentLogin />} />
                <Route path='/student/signup' element={<StudentSignup />} />
                <Route path='/join/:slug' element={<StudentJoin />} />

                {/* Student Routes */}
                <Route
                    path='/student/dashboard'
                    element={
                        <ProtectedRoute expectedRole='student'>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/student/dues'
                    element={
                        <ProtectedRoute expectedRole='student'>
                            <StudentDues />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/student/due/:id'
                    element={
                        <ProtectedRoute expectedRole='student'>
                            <StudentDueDetails />
                        </ProtectedRoute>
                    }
                />

                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/reset-password' element={<ResetPassword />} />
                <Route path='*' element={<TestPage />} />
            </Routes>
        </Suspense>
    );
}

function App() {
    return (
        <AuthProvider>
            <div className='min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100'>
                <AppRoutes />
            </div>
        </AuthProvider>
    );
}

export default App;
