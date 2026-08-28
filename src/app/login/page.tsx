import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Suspense
        fallback={
          <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
