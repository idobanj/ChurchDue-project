/** @format */

import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

export default function StudentLogin() {
    const navigate = useNavigate();
    const {signIn} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const {data, error} = await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        if (data?.user) {
            navigate('/student/dashboard');
        }

        setLoading(false);
    }

    return (
        <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='flex justify-center'>
                    <svg
                        className='w-12 h-12 text-primary-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'>
                        <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
                    </svg>
                </div>
                <h2 className='mt-6 text-center text-3xl font-bold text-gray-900'>
                    Student Login
                </h2>
                <p className='mt-2 text-center text-sm text-gray-600'>
                    Sign in to manage your dues
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
                    {error && (
                        <div className='mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
                            {error}
                        </div>
                    )}

                    <form className='space-y-6' onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor='email'
                                className='block text-sm font-medium text-gray-700'>
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
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                                placeholder='student@university.edu'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='password'
                                className='block text-sm font-medium text-gray-700'>
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
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                                placeholder='Enter your password'
                            />
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='text-sm'>
                                <Link
                                    to='/forgot-password'
                                    className='font-medium text-primary-600 hover:text-primary-500'>
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className='mt-6'>
                        <div className='relative'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-gray-300' />
                            </div>
                            <div className='relative flex justify-center text-sm'>
                                <span className='px-2 bg-white text-gray-500'>
                                    Need to join your church?
                                </span>
                            </div>
                        </div>

                        <div className='mt-6'>
                            <p className='text-center text-sm text-gray-600'>
                                Ask your church admin for the invite link
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
