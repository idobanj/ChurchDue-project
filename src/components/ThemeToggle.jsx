import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useThemeStore } from '../stores/themeStore'

export default function ThemeToggle({ variant = 'default' }) {
  const { theme, toggleTheme } = useThemeStore()
  const isLanding = variant === 'landing'
  const buttonClassName = isLanding
    ? 'p-2 rounded-lg text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 dark:text-gray-200 dark:hover:text-white dark:bg-gray-700/40 dark:hover:bg-gray-600/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 dark:focus:ring-gray-300 transition-colors duration-200'
    : 'p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'

  return (
    <button
      onClick={toggleTheme}
      className={buttonClassName}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  )
}
