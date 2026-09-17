import type { ReactNode } from 'react';
import { Smile } from 'lucide-react';

export function EmptyState({
  title = 'Данных пока нет',
  description,
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {/* Фирменный кружок с иконкой — голубой тинт */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#aac6ee] dark:bg-slate-800">
        {icon ?? <Smile className="h-7 w-7" />}
      </div>
      <div>
        <p className="text-sm font-medium text-[#172933] dark:text-slate-100">{title}</p>
        {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
