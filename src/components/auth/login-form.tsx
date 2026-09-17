'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { authAPI } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

      // Сохраняем access_token в in-memory store → axios добавит Bearer ко всем запросам
      if (data?.access_token) {
        setAccessToken(data.access_token);
      }

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

      toast.success('Добро пожаловать в labsmilê! 🦷');
      router.push('/appointments');
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Неверный email или пароль'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Заголовок */}
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
          style={{ background: 'linear-gradient(135deg, #aac6ee 0%, #d0c8b5 100%)' }}
        >
          🦷
        </div>
        <h1 className="text-xl font-semibold text-white">labsmilê</h1>
        <p className="mt-1 text-sm font-medium text-white/90">Панель управления</p>
      </div>

      {/* Карточка формы */}
      <div className="rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur-sm border border-white/50">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="admin@labsmile22.ru"
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
                className="text-[#aac6ee] hover:text-[#172933] dark:hover:text-slate-200"
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
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-white/90">
        Доступ только для сотрудников клиники с ролью администратора.
      </p>
    </div>
  );
}
