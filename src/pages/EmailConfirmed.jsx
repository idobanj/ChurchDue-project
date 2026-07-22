import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * Landing page for the Supabase email-confirmation link.
 * Supabase will redirect users here after they click the verification
 * email. We figure out the role from the active session, sign them
 * out (we don't want them auto-logged-in from the link), and send
 * them to the matching login page.
 */
export default function EmailConfirmed() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying | ok | error
    const [message, setMessage] = useState('Confirming your email…');

    useEffect(() => {
        let cancelled = false;

        async function finish() {
            try {
                // Give Supabase a moment to process the hash/token from the URL.
                await new Promise((r) => setTimeout(r, 400));

                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();

                if (cancelled) return;

                if (error || !user) {
                    setStatus('error');
                    setMessage(
                        error?.message ||
                            'We could not verify your email. Please try again or request a new confirmation email.'
                    );
                    return;
                }

                // Pull the role out of the user's metadata.
                const role =
                    user.user_metadata?.role ||
                    user.app_metadata?.role ||
                    null;

                // Sign the user out so they're not auto-logged-in just because
                // they verified. They still need to log in with their password.
                await supabase.auth.signOut();

                if (cancelled) return;

                if (role === 'admin') {
                    navigate('/admin/login', { replace: true });
                } else {
                    // Default: student (covers 'student' role and any unknown value).
                    navigate('/student/login', { replace: true });
                }
            } catch (err) {
                if (cancelled) return;
                setStatus('error');
                setMessage(
                    err?.message ||
                        'Something went wrong while confirming your email.'
                );
            }
        }

        finish();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4'>
            <div className='w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 sm:p-8 text-center'>
                {status === 'verifying' && (
                    <>
                        <svg
                            className='animate-spin h-10 w-10 text-primary-600 mx-auto'
                            fill='none'
                            viewBox='0 0 24 24'
                        >
                            <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                            />
                            <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            />
                        </svg>
                        <p className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
                            {message}
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className='mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4'>
                            <span className='text-2xl' role='img' aria-label='error'>
                                ⚠️
                            </span>
                        </div>
                        <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                            Verification failed
                        </h2>
                        <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                            {message}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
