'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const autoId = useId();
    const areaId = id ?? autoId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={areaId} className="block text-sm font-medium text-[#172933] dark:text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            'w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#172933] placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100',
            error
              ? 'border-rose-400 focus:ring-rose-200'
              : 'border-[#d0c8b5] focus:border-[#aac6ee] focus:ring-[#aac6ee]/30 dark:border-slate-700',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
