import { Hammer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          <Hammer className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          В разработке
        </span>
      </CardContent>
    </Card>
  );
}
