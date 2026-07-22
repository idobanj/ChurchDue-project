/** @format */

import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton';

export default function AdminLogin() {
    const navigate = useNavigate();
    const {user, loading: authLoading, signIn} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && !authLoading) {
            if (user.role?.toLowerCase() === 'admin') {
                navigate('/admin/dashboard');
            }
        }
    }, [user, authLoading, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const {data, error} = await signIn(email, password);

        if (error) {
            // Show user-friendly message for timeout errors
            if (error.message && error.message.includes('Request timed out')) {
                setError('Connection timeout. Please check your internet connection and try again.');
            } else {
                setError(error.message);
            }
            setLoading(false);
            return;
        }

        setLoading(false);
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
            <BackButton />
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='flex justify-center'>
                    <svg
                        className='w-12 h-12 text-blue-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'>
                        <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
                    </svg>
                </div>
                <h2 className='mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white'>
                    Admin Login
                </h2>
                <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
                    Sign in to manage your church dues
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700'>
                    {error && (
                        <div className='mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg'>
                            {error}
                        </div>
                    )}

                    <form className='space-y-6' onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor='email'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Email address
                            </label>
                            <input
                                id='email'
                                name='email'
                                type='email'
                                autoComplete='email'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                placeholder='admin@church.com'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='password'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Password
                            </label>
                            <input
                                id='password'
                                name='password'
                                type='password'
                                autoComplete='current-password'
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                placeholder='Enter your password'
                            />
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='text-sm'>
                                <Link
                                    to='/forgot-password'
                                    className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'>
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600'>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className='mt-6'>
                        <div className='relative'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-gray-300 dark:border-gray-600' />
                            </div>
                            <div className='relative flex justify-center text-sm'>
                                <span className='px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'>
                                    New to Church Dues?
                                </span>
                            </div>
                        </div>

                        <div className='mt-6'>
                            <Link
                                to='/admin/signup'
                                className='w-full flex justify-center py-2 px-4 border border-blue-600 dark:border-blue-500 rounded-lg shadow-sm text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'>
                                Create your church account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
