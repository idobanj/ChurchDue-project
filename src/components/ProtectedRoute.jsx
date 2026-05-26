import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, expectedRole }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        const redirectPath = location.pathname.startsWith('/admin')
            ? '/admin/login'
            : location.pathname.startsWith('/student')
                ? '/student/login'
                : '/';

        return <Navigate to={redirectPath} replace />;
    }

    if (expectedRole && user.role !== expectedRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}
