/** @format */

import {Link} from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-800'>
            {/* Navbar */}
            <nav className='container mx-auto px-4 py-6'>
                <div className='flex justify-between items-center'>
                    <div className='flex items-center space-x-2'>
                        <svg
                            className='w-10 h-10 text-white'
                            fill='currentColor'
                            viewBox='0 0 24 24'>
                            <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
                        </svg>
                        <span className='text-2xl font-bold text-white'>
                            Church Dues
                        </span>
                    </div>
                    <div className='flex items-center space-x-4'>
                        <ThemeToggle variant='landing' />
                        <Link
                            to='/admin/login'
                            className='text-blue-100 hover:text-white dark:text-gray-200 dark:hover:text-white font-medium transition-colors'>
                            Admin Login
                        </Link>
                        <Link
                            to='/student/login'
                            className='text-blue-100 hover:text-white dark:text-gray-200 dark:hover:text-white font-medium transition-colors'>
                            Student Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className='container mx-auto px-4 py-20'>
                <div className='max-w-4xl mx-auto text-center'>
                    <h1 className='text-5xl md:text-6xl font-bold text-white mb-6'>
                        Manage Church Dues Made Simple
                    </h1>
                    <p className='text-xl text-blue-100 mb-10'>
                        A seamless platform for churches and fellowships to
                        track student dues, manage payments, and monitor
                        balances with ease.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                        <Link
                            to='/admin/signup'
                            className='bg-blue-50 text-blue-800 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white transition-colors shadow-lg shadow-blue-900/20 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white'>
                            Create Church Account
                        </Link>
                        <Link
                            to='/student/login'
                            className='bg-blue-800/70 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-800 transition-colors border-2 border-blue-100/40 dark:bg-gray-800/80 dark:hover:bg-gray-700 dark:border-gray-300/30'>
                            Student? Join Your Church
                        </Link>
                    </div>
                </div>

                {/* Features Section */}
                <div className='mt-32 grid md:grid-cols-3 gap-8'>
                    <div className='bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white'>
                        <div className='w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-8 h-8'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'>
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                            </svg>
                        </div>
                        <h3 className='text-xl font-semibold mb-2'>
                            Track Payments
                        </h3>
                        <p className='text-blue-100'>
                            Monitor all dues and payments in real-time with
                            detailed records and export options.
                        </p>
                    </div>

                    <div className='bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white'>
                        <div className='w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-8 h-8'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'>
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                                />
                            </svg>
                        </div>
                        <h3 className='text-xl font-semibold mb-2'>
                            Student Management
                        </h3>
                        <p className='text-blue-100'>
                            Easily onboard students with invite links and manage
                            all member profiles in one place.
                        </p>
                    </div>

                    <div className='bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white'>
                        <div className='w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mb-4'>
                            <svg
                                className='w-8 h-8'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'>
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                                />
                            </svg>
                        </div>
                        <h3 className='text-xl font-semibold mb-2'>
                            Secure Payments
                        </h3>
                        <p className='text-blue-100'>
                            Integrated with Paystack for safe, reliable payment
                            processing and refund management.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className='container mx-auto px-4 py-8 text-center text-blue-200'>
                <p>
                    &copy; 2026 Church Dues Management Platform. All rights
                    reserved.
                </p>
            </footer>
        </div>
    );
}
