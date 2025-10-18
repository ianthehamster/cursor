import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased">
        {/* Pre-hydration theme script to avoid flash and ensure dark class before mount */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldUseDark = stored ? stored === 'dark' : prefersDark;
                const root = document.documentElement;
                if (shouldUseDark) {
                  root.classList.add('dark');
                } else {
                  root.classList.remove('dark');
                }
              } catch {}
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
