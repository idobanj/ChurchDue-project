import { Link } from 'react-router-dom';

/**
 * Modal shown after a successful signup, prompting the user to confirm
 * their email before they can log in.
 *
 * Props:
 *  - email:       the address the verification email was sent to
 *  - loginPath:   where the "Go to Login" button takes the user
 *                 (e.g. '/student/login' or '/admin/login')
 *  - onClose:     optional callback when the user dismisses the modal
 */
export default function SignupSuccessModal({ email, loginPath, onClose }) {
    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            role='dialog'
            aria-modal='true'
            aria-labelledby='signup-success-title'
        >
            <div className='relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center'>
                {onClose && (
                    <button
                        type='button'
                        onClick={onClose}
                        aria-label='Close'
                        className='absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors'
                    >
                        <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>
                )}

                {/* ✅ Mark icon in a soft circle */}
                <div className='mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-4'>
                    <span
                        className='text-3xl'
                        role='img'
                        aria-label='success'
                    >
                        ✅
                    </span>
                </div>

                <h3
                    id='signup-success-title'
                    className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'
                >
                    You have successfully signed up!
                </h3>

                <p className='mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                    We sent a confirmation link to{' '}
                    <span className='font-semibold text-gray-900 dark:text-white break-all'>
                        {email}
                    </span>
                    . Please click the link in that email to verify your
                    account before logging in.
                </p>

                <Link
                    to={loginPath}
                    onClick={onClose}
                    className='mt-6 inline-flex w-full justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors'
                >
                    Go to Login
                </Link>

                <p className='mt-4 text-xs text-gray-500 dark:text-gray-400'>
                    Didn't get the email? Check your spam folder, or wait a
                    minute and try again.
                </p>
            </div>
        </div>
    );
}
