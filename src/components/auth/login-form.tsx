'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { authAPI } from '@/lib/api/auth';
import { demoLogin } from '@/lib/demo-auth';
import { useStaffStore, MAIN_ADMIN } from '@/stores/useStaffStore';
import { toAdminUser } from '@/types/staff';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const staff = useStaffStore((s) => s.staff);
  const [demoEmail, setDemoEmail] = useState(MAIN_ADMIN.email);

  useEffect(() => {
    if (searchParams.get('expired')) {
      toast.error('Сессия истекла. Войдите заново.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await authAPI.login(values.email, values.password);
      const data = res.data;

      // Fallback: если бэкенд вернул токены в теле (а не Set-Cookie) — сохраняем в httpOnly-куки через BFF
      if (data?.access_token) {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          }),
        });
      }

      if (data?.user) setUser(data.user);

      toast.success('Добро пожаловать!');
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Неверный email или пароль'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const member = staff.find((m) => m.email === demoEmail);
    if (!member) {
      toast.error('Сотрудник не найден');
      return;
    }
    setDemoLoading(true);
    try {
      await demoLogin(member);
      setUser(toAdminUser(member));
      toast.success(`Демо-вход: ${member.name}`);
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Не удалось войти в демо-режиме'));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-3xl text-white">
          🦷
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Стоматология «Улыбка»</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Вход в панель управления</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="admin@clinic.ru"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('password')}
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Войти
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-400">демо-режим</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="space-y-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-3 dark:border-brand-700 dark:bg-brand-900/20">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Без бэкенда — войти под учёткой для теста (основной администратор уже создан).
          </p>
          <div className="flex gap-2">
            <select
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {staff
                .filter((m) => !m.is_blocked)
                .map((m) => (
                  <option key={m.id} value={m.email}>
                    {m.name} · {m.email}
                  </option>
                ))}
            </select>
            <Button type="button" variant="secondary" onClick={handleDemoLogin} loading={demoLoading}>
              Войти
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">
            Основной админ: <b>director@clinic.ru</b> / <b>director123</b>
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
        Доступ только для сотрудников клиники с ролью администратора.
        <br />Вход и выход фиксируются в журнале безопасности.
      </p>
    </div>
  );
}
