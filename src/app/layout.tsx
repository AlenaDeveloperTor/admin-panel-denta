import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/providers/theme-provider';

export const metadata: Metadata = {
  title: {
    default: 'Админ-панель · Стоматология «Улыбка»',
    template: '%s · Админ-панель',
  },
  description: 'Панель управления стоматологической клиникой «Улыбка»',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Применяем тему до рендера, чтобы не было «вспышки» светлой темы */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
