/** @format */

import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../services/supabaseClient';
import BackButton from '../components/BackButton';

export default function AdminSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        churchName: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // 1. Create Organization
            const slug = formData.churchName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert([{ name: formData.churchName, slug, paystack_connected: false }])
                .select()
                .single();

            if (orgError) throw orgError;

            // 2. Register Auth User
            const { error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'admin',
                        organization_id: orgData.id
                    }
                }
            });

            if (authError) {
                // Rollback organization if auth fails
                await supabase.from('organizations').delete().eq('id', orgData.id);
                throw authError;
            }

            // 3. SUCCESS: Tell the user to verify their email
            alert("Account created! Please check your email inbox to verify your account before logging in.");
            navigate('/admin/login');

        } catch (err) {
            setError(err.message || 'An error occurred during account setup.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
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
                <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>
                    Create your church account
                </h2>
                <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
                    Start managing your student dues securely
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700'>
                    {error && (
                        <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800'>
                            {error}
                        </div>
                    )}

                    <form className='space-y-6' onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor='churchName'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Church / Fellowship Name
                            </label>
                            <input
                                id='churchName'
                                name='churchName'
                                type='text'
                                required
                                value={formData.churchName}
                                onChange={handleChange}
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                placeholder='e.g. DLCF FUT Minna'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='fullName'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Admin Full Name
                            </label>
                            <input
                                id='fullName'
                                name='fullName'
                                type='text'
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                placeholder='John Doe'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='email'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Email Address
                            </label>
                            <input
                                id='email'
                                name='email'
                                type='email'
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900  focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                placeholder='admin@church.org'
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
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900  focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                placeholder='••••••••'
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='confirmPassword'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Confirm Password
                            </label>
                            <input
                                id='confirmPassword'
                                name='confirmPassword'
                                type='password'
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                placeholder='••••••••'
                            />
                        </div>

                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'>
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <div className='mt-6'>
                        <div className='relative'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-gray-300 dark:border-gray-600' />
                            </div>
                            <div className='relative flex justify-center text-sm'>
                                <span className='px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'>
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className='mt-6'>
                            <Link
                                to='/admin/login'
                                className='w-full flex justify-center py-2 px-4 border border-blue-600 dark:border-blue-500 rounded-lg shadow-sm text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'>
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
