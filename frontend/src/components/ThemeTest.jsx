import { useTheme } from '../context/ThemeProvider';

const ThemeTest = () => {
  const { isDarkMode, toggleTheme, setLightMode, setDarkMode, isInitialized } = useTheme();

  if (!isInitialized) {
    return (
      <div className="fixed top-4 right-4 z-50 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <p className="text-yellow-800 text-sm">Theme loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
      <div className="space-y-2">
        <p className="text-gray-900 dark:text-white text-sm font-medium">
          Current theme: {isDarkMode ? 'Dark' : 'Light'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
          >
            Toggle
          </button>
          <button
            onClick={setLightMode}
            className="px-3 py-1 bg-gray-100 text-gray-900 rounded text-xs hover:bg-gray-200"
          >
            Light
          </button>
          <button
            onClick={setDarkMode}
            className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700"
          >
            Dark
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          DOM classes: {document.documentElement.classList.contains('dark') ? '✅ dark' : '❌ light'}
        </p>
      </div>
    </div>
  );
};

export default ThemeTest;