/** @format */

import {useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {supabase} from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';  

export default function StudentJoin() {
    const {slug} = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
    });

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // 1. Find organization by slug
            const {data: org, error: orgError} = await supabase
                .from('organizations')
                .select('id')
                .eq('slug', slug)
                .single();

            if (orgError || !org) {
                throw new Error(
                    'Invalid invite link or organization not found',
                );
            }

            // 2. Sign up the student
            const {data: authData, error: authError} =
                await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            fullName: formData.fullName,
                            organization_id: org.id,
                            role: 'student',
                            dateOfBirth: formData.dateOfBirth,
                        },
                    },
                });

            if (authError) throw authError;

            if (authData.user) {
                // 3. Create user profile in the public.users table
                // Use upsert to avoid primary key conflicts if a database trigger already created the record
                const {error: profileError} = await supabase
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        organization_id: org.id,
                        role: 'student',
                        full_name: formData.fullName,
                        email: formData.email,
                        date_of_birth: formData.dateOfBirth,
                    });

                if (profileError) throw profileError;

                navigate('/student/dashboard', {
                    state: {
                        message:
                            'Account created successfully! Please check your email to verify.',
                    },
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
            
            
            <BackButton />
                <div className='absolute top-2 right-4 p-4'>
                    <ThemeToggle />
                </div>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='flex justify-center'>
                    <svg
                        className='w-12 h-12 text-primary-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'>
                        <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
                    </svg>
                </div>
                <h2 className='mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white'>
                    Join Your Church
                </h2>
                <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
                    Fill in your details to join this organization
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700'>
                    {error && (
                        <div className='mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
                            {error}
                        </div>
                    )}

                    <form className='space-y-4' onSubmit={handleSubmit}>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Full Name
                            </label>
                            <input
                                type='text'
                                required
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        fullName: e.target.value,
                                    })
                                }
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder:-gray-400 dark:placeholder:gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-700'
                                placeholder='John Doe'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Email
                            </label>
                            <input
                                type='email'
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-800'
                                placeholder='student@email.com'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Date of Birth
                            </label>
                            <input
                                type='date'
                               
                                value={formData.dateOfBirth}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        dateOfBirth: e.target.value,
                                    })
                                }
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Password
                            </label>
                            <input
                                type='password'
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white text-gray-900 focus:outline focus:ring-primary-500 focus:border-primary-500'
                                placeholder='Create password'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Confirm Password
                            </label>
                            <input
                                type='password'
                                required
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        confirmPassword: e.target.value,
                                    })
                                }
                                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                                placeholder='Confirm password'
                            />
                        </div>
                        <button
                            type='submit'
                            disabled={loading}
                            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'>
                            {loading ? 'Joining...' : 'Join Now'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
