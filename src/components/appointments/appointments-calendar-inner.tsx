'use client';

import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import type { CalendarApi } from '@fullcalendar/core';
import { appointmentTime } from '@/types/appointment';
import type { Appointment, AppointmentStatus } from '@/types/appointment';
import { fullName } from '@/types/user';

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  created: '#0ea5e9',
  pending: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#f43f5e',
  completed: '#64748b',
};

export function AppointmentsCalendarInner({
  appointments,
  onSelect,
  onDayClick,
  dateFrom,
  onRangeChange,
}: {
  appointments: Appointment[];
  onSelect: (appointment: Appointment) => void;
  onDayClick: (dateISO: string) => void;
  dateFrom?: string;
  onRangeChange: (from: string, to: string) => void;
}) {
  const calendarRef = useRef<CalendarApi | null>(null);
  const lastEmittedStartRef = useRef<string | null>(null);

  // Внешнее изменение даты (из фильтров) → прыгаем календарём на эту дату
  useEffect(() => {
    if (dateFrom && dateFrom !== lastEmittedStartRef.current) {
      calendarRef.current?.gotoDate(dateFrom);
    }
  }, [dateFrom]);

  const events = appointments
    .filter((a) => a.appointment_datetime)
    .map((a) => ({
      id: a.id,
      title: `${appointmentTime(a)} · ${fullName(a.patient)}`,
      start: a.appointment_datetime as string,
      backgroundColor: STATUS_COLOR[a.status],
      borderColor: STATUS_COLOR[a.status],
      textColor: '#fff',
      extendedProps: { appointment: a },
    }));

  return (
    <FullCalendar
      ref={(el) => {
        calendarRef.current = el?.getApi() ?? null;
      }}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale="ru"
      locales={[ruLocale]}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek',
      }}
      buttonText={{ today: 'Сегодня', month: 'Месяц', week: 'Неделя' }}
      height="auto"
      events={events}
      eventClick={(info) => onSelect(info.event.extendedProps.appointment as Appointment)}
      dateClick={(info) => onDayClick(info.dateStr)}
      datesSet={(info) => {
        const start = info.startStr.slice(0, 10);
        const end = info.endStr.slice(0, 10);
        if (start !== lastEmittedStartRef.current) {
          lastEmittedStartRef.current = start;
          onRangeChange(start, end);
        }
      }}
    />
  );
}
