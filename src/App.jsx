/** @format */

import {Routes, Route} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import StudentLogin from './pages/StudentLogin';
import StudentSignup from './pages/StudentSignup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentJoin from './pages/StudentJoin';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDueDetails from './pages/admin/AdminDueDetails';
import AdminSettings from './pages/admin/AdminSettings';
import DuesManagement from './pages/admin/DuesManagement';
import PaymentsPage from './pages/admin/PaymentsPage';
import RefundRequests from './pages/admin/RefundRequests';
import StudentsPage from './pages/admin/StudentsPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentDueDetails from './pages/student/StudentDueDetails';
import StudentDues from './pages/student/StudentDues';

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

function AppRoutes() {
    return (
        <Routes>
            <Route path='/' element={<Landing />} />
            <Route path='/admin/login' element={<AdminLogin />} />
            <Route path='/admin/signup' element={<AdminSignup />} />

            {/* Admin Routes */}
            <Route path='/admin/dashboard' element={<AdminDashboard />} />
            <Route path='/admin/dues' element={<DuesManagement />} />
            <Route path='/admin/payments' element={<PaymentsPage />} />
            <Route path='/admin/students' element={<StudentsPage />} />
            <Route path='/admin/refunds' element={<RefundRequests />} />
            <Route path='/admin/settings' element={<AdminSettings />} />
            <Route path='/admin/due/:id' element={<AdminDueDetails />} />

            <Route path='/student/login' element={<StudentLogin />} />
            <Route path='/student/signup' element={<StudentSignup />} />
            <Route path='/join/:slug' element={<StudentJoin />} />

            {/* Student Routes */}
            <Route path='/student/dashboard' element={<StudentDashboard />} />
            <Route path='/student/dues' element={<StudentDues />} />
            <Route path='/student/due/:id' element={<StudentDueDetails />} />

            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route path='*' element={<TestPage />} />
        </Routes>
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
