import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <div className="bg-white text-black dark:bg-zinc-900 dark:text-white min-h-screen transition-colors">
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  );
}
