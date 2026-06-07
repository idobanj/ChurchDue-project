import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/')} 
      className="fixed top-6 left-6 z-50 flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-gray-700 dark:text-gray-200"
    >
      <svg 
        className="w-5 h-5 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 19l-7-7 7-7" 
        />
      </svg>
      <span className="font-medium text-sm">Back</span>
    </button>
  );
}