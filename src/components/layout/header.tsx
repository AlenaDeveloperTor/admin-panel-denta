'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import { useLogout, useMe } from '@/hooks/queries/useAuth';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen);

  useMe(); // подгружаем текущего администратора в стор

  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    toast.success('До встречи! 👋');
    router.push('/login');
    router.refresh();
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'A';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#ece7df] bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Открыть меню">
        <Menu className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Переключить тему">
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* Профиль-пилюля */}
      <div className="flex items-center gap-2 rounded-full border border-[#d0c8b5] py-1 pl-1 pr-3 dark:border-slate-700">
        {/* Аватар с градиентом */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-[#172933]"
          style={{ background: 'linear-gradient(135deg, #aac6ee 0%, #d0c8b5 100%)' }}
        >
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-35 truncate text-sm font-medium leading-tight text-[#172933] dark:text-slate-100">
            {user?.name ?? 'Администратор'}
          </p>
          <p className="text-[11px] capitalize leading-tight text-slate-500 dark:text-[#aac6ee]">{user?.role ?? 'admin'}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className={cn(
            'ml-1 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30',
            logout.isPending && 'opacity-50',
          )}
          aria-label="Выйти"
          title="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
