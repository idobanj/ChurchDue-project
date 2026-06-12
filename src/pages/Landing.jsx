/** @format */

import {Link} from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-between antialiased selection:bg-white/20 selection:text-white font-body'>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                
                .font-display {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .font-body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
            `}</style>

            {/* Navbar */}
            <nav className='w-full max-w-7xl mx-auto px-4 py-5 sm:py-6'>
                <div className='flex justify-between items-center w-full'>
                    <div className='flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0'>
                        <svg
                            className='w-6 h-6 sm:w-10 sm:h-10 text-white transition-transform duration-300 hover:rotate-12'
                            fill='currentColor'
                            viewBox='0 0 24 24'>
                            <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
                        </svg>
                        <span className='text-sm sm:text-2xl font-bold tracking-tight text-white font-display'>
                            Church Dues
                        </span>
                    </div>
                    <div className='flex items-center space-x-2 sm:space-x-6 flex-shrink-0'>
                        <ThemeToggle variant='landing' />
                        <Link
                            to='/admin/login'
                            className='text-xs sm:text-sm md:text-base font-semibold text-blue-100 hover:text-white dark:text-gray-200 dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5'>
                            <span className='hidden sm:inline'>Admin Login</span>
                            <span className='sm:hidden'>Admin</span>
                        </Link>
                        <Link
                            to='/student/login'
                            className='text-xs sm:text-sm md:text-base font-semibold text-blue-100 hover:text-white dark:text-gray-200 dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5'>
                            <span className='hidden sm:inline'>Student Login</span>
                            <span className='sm:hidden'>Student</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 flex-grow flex flex-col justify-center'>
                <div className='max-w-4xl mx-auto text-center'>
                    <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight font-display'>
                        Manage Church Dues <br className="hidden sm:inline" />Made Simple
                    </h1>
                    <p className='text-sm sm:text-base md:text-lg lg:text-xl text-blue-100/90 max-w-2xl mx-auto mb-10 leading-relaxed font-body'>
                        A seamless platform for churches and fellowships to
                        track student dues, manage payments, and monitor
                        balances with ease.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-4 justify-center items-center px-4 sm:px-0 max-w-md sm:max-w-none mx-auto w-full sm:w-auto'>
                        <Link
                            to='/admin/signup'
                            className='group w-full sm:w-auto text-center bg-blue-50 text-blue-800 px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-900/20 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white flex items-center justify-center space-x-2'>
                            <span>Create Church Account</span>
                            <svg 
                                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                        </Link>
                        <Link
                            to='/student/login'
                            className='w-full sm:w-auto text-center bg-blue-800/70 text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-blue-100/40 dark:bg-gray-800/80 dark:hover:bg-gray-700 dark:border-gray-300/30 flex items-center justify-center'>
                            <span>Student? Join Your Church</span>
                        </Link>
                    </div>
                </div>

                {/* Features Section */}
                <div className='mt-20 sm:mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
                    <div className='group bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-white border border-white/10 hover:border-white/20 hover:bg-white/15 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between'>
                        <div>
                            <div className='w-12 h-12 sm:w-14 sm:h-14 bg-white/15 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300'>
                                <svg
                                    className='w-6 h-6 sm:w-7 sm:h-7 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth={2.5}
                                    viewBox='0 0 24 24'>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <h3 className='text-lg sm:text-xl font-bold mb-3 tracking-tight font-display'>
                                Track Payments
                            </h3>
                            <p className='text-sm sm:text-base text-blue-100/85 font-body leading-relaxed'>
                                Monitor all dues and payments in real-time with
                                detailed records and export options.
                            </p>
                        </div>
                    </div>

                    <div className='group bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-white border border-white/10 hover:border-white/20 hover:bg-white/15 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between'>
                        <div>
                            <div className='w-12 h-12 sm:w-14 sm:h-14 bg-white/15 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300'>
                                <svg
                                    className='w-6 h-6 sm:w-7 sm:h-7 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth={2.5}
                                    viewBox='0 0 24 24'>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                                    />
                                </svg>
                            </div>
                            <h3 className='text-lg sm:text-xl font-bold mb-3 tracking-tight font-display'>
                                Student Management
                            </h3>
                            <p className='text-sm sm:text-base text-blue-100/85 font-body leading-relaxed'>
                                Easily onboard students with invite links and manage
                                all member profiles in one place.
                            </p>
                        </div>
                    </div>

                    <div className='group bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-white border border-white/10 hover:border-white/20 hover:bg-white/15 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between'>
                        <div>
                            <div className='w-12 h-12 sm:w-14 sm:h-14 bg-white/15 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300'>
                                <svg
                                    className='w-6 h-6 sm:w-7 sm:h-7 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth={2.5}
                                    viewBox='0 0 24 24'>
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                                    />
                                </svg>
                            </div>
                            <h3 className='text-lg sm:text-xl font-bold mb-3 tracking-tight font-display'>
                                Secure Payments
                            </h3>
                            <p className='text-sm sm:text-base text-blue-100/85 font-body leading-relaxed'>
                                Integrated with Paystack for safe, reliable payment
                                processing and refund management.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 border-t border-white/10 py-8 text-center text-xs sm:text-sm text-blue-200/80 font-body'>
                <p>
                    &copy; {new Date().getFullYear()} Church Dues Management Platform. All rights
                    reserved.
                </p>
            </footer>
        </div>
    );
}
