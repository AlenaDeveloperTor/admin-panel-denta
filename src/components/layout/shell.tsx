'use client';

import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { RequestsWatcher } from '@/components/requests/requests-watcher';
import { useUIStore } from '@/stores/useUIStore';

function ShellInner({ children }: { children: ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <RequestsWatcher />
      <Sidebar />
      <div className={collapsed ? 'lg:pl-16' : 'lg:pl-60'}>
        <Header />
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <ShellInner>{children}</ShellInner>;
}
