'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[#172933] dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-10 w-full appearance-none rounded-xl border bg-white px-3 pr-9 text-sm text-[#172933] transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100',
              error
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-[#d0c8b5] focus:border-[#aac6ee] focus:ring-[#aac6ee]/30 dark:border-slate-700',
              className,
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aac6ee]" />
        </div>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
