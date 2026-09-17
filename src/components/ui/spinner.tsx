import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return <Loader2 className={cn('animate-spin text-[#aac6ee] dark:text-[#aac6ee]', className)} size={size} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
