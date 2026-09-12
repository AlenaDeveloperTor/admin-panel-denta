'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  Inbox,
  Megaphone,
  Send,
  Settings,
  Star,
  Syringe,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import { useRequestsStore } from '@/stores/useRequestsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ReactNode } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/patients', label: 'Пациенты', icon: <Users className="h-5 w-5" /> },
  { href: '/staff', label: 'Сотрудники', icon: <UserCog className="h-5 w-5" /> },
  { href: '/requests', label: 'Заявки', icon: <Inbox className="h-5 w-5" /> },
  { href: '/appointments', label: 'Записи', icon: <CalendarDays className="h-5 w-5" /> },
  { href: '/services', label: 'Услуги', icon: <Syringe className="h-5 w-5" /> },
  { href: '/news', label: 'Акции и новости', icon: <Megaphone className="h-5 w-5" />, soon: true },
  { href: '/loyalty', label: 'Лояльность', icon: <Star className="h-5 w-5" /> },
  { href: '/push', label: 'Push-рассылка', icon: <Send className="h-5 w-5" /> },
  { href: '/settings', label: 'Настройки', icon: <Settings className="h-5 w-5" /> },
];

/** Количество непрочитанных заявок для бейджа */
function useUnreadRequests(): number {
  const latestIds = useRequestsStore((s) => s.latestIds);
  const seenIds = useRequestsStore((s) => s.seenIds);
  const seen = new Set(seenIds);
  return latestIds.filter((id) => !seen.has(String(id))).length;
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const unreadRequests = useUnreadRequests();
  const role = useAuthStore((s) => s.user?.role);
  const canManageStaff = role !== 'manager';
  const canManageSettings = role === 'admin';

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800', collapsed && 'justify-center px-2')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg text-white">
          🦷
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">Стоматология</p>
            <p className="truncate text-[11px] text-slate-400">«Улыбка» · Админ</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.filter(
          (item) =>
            (item.href !== '/staff' || canManageStaff) &&
            (item.href !== '/settings' || canManageSettings),
        ).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                collapsed && 'justify-center px-2',
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.soon && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      скоро
                    </span>
                  )}
                  {item.href === '/requests' && unreadRequests > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadRequests}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        {!collapsed && (
          <p className="px-3 text-[11px] leading-relaxed text-slate-400">
            Панель управления стоматологической клиникой
          </p>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:block dark:border-slate-800 dark:bg-slate-950',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl dark:bg-slate-950">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Закрыть меню"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
