import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center dark:bg-slate-950">
      <p className="text-6xl font-black text-brand-600">404</p>
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Страница не найдена</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Возможно, страница была удалена или вы перешли по неверной ссылке.
        </p>
      </div>
      <Link
        href="/appointments"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        Вернуться к записям
      </Link>
    </div>
  );
}
