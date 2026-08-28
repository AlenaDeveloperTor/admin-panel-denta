'use client';

import dynamic from 'next/dynamic';

/**
 * Календарь записей (FullCalendar). FullCalendar использует browser-API,
 * поэтому компонент грузится только на клиенте (ssr: false).
 */
export const AppointmentsCalendar = dynamic(
  () => import('./appointments-calendar-inner').then((m) => m.AppointmentsCalendarInner),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />,
  },
);
