import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #aac6ee 0%, #d0c8b5 100%)' }}
    >
      <Suspense
        fallback={
          <div className="h-8 w-40 animate-pulse rounded-xl bg-white/40" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
