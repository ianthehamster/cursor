import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const apply = (enable: boolean) => {
      const action = enable ? 'add' : 'remove';
      root.classList[action]('dark');
      body.classList[action]('dark');
      root.style.colorScheme = enable ? 'dark' : 'light';
      localStorage.setItem('theme', enable ? 'dark' : 'light');
    };
    apply(darkMode);
    console.log('🌗 Applied dark mode:', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
