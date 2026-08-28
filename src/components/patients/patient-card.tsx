'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Coins,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  UserRound,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientFormModal } from './patient-form-modal';
import { AdjustPointsModal } from '@/components/loyalty/adjust-points-modal';
import { PushModal } from '@/components/shared/push-modal';
import { useUser } from '@/hooks/queries/useUsers';
import { usePatientAppointments } from '@/hooks/queries/useAppointments';
import { useLoyaltyHistory } from '@/hooks/queries/useLoyalty';
import { APPOINTMENT_STATUS_LABELS, appointmentDate, appointmentTime } from '@/types/appointment';
import { fullName, formatPhone } from '@/types/user';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';

/**
 * Карточка пациента: контакты, баланс баллов, история записей и операций с баллами.
 * Открывается из таблицы пациентов (клик по строке / иконка).
 */
export function PatientCard({
  userId,
  onClose,
}: {
  userId: number | null;
  onClose: () => void;
}) {
  const { data: user, isLoading } = useUser(userId);
  const { data: appointments, isLoading: apptsLoading } = usePatientAppointments(userId, 8);
  const { data: loyaltyPage, isLoading: loyaltyLoading } = useLoyaltyHistory({
    user_id: userId ?? undefined,
    limit: 6,
  });
  const loyaltyHistory = loyaltyPage?.items ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);

  const phone = user?.phone;

  return (
    <Modal
      open={Boolean(userId)}
      onClose={onClose}
      title={isLoading || !user ? 'Карточка пациента' : fullName(user)}
      description={user ? `ID: ${user.id}` : undefined}
      size="lg"
      footer={
        user ? (
          <>
            {phone && (
              <Button variant="secondary" onClick={() => setPushOpen(true)}>
                <MessageSquare className="h-4 w-4" /> Push
              </Button>
            )}
            <Button variant="secondary" onClick={() => setPointsOpen(true)}>
              <Coins className="h-4 w-4" /> Баллы
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Редактировать
            </Button>
          </>
        ) : null
      }
    >
      {isLoading || !user ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Шапка карточки */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-500 dark:bg-brand-900/30">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={fullName(user)} className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <UserRound className="h-8 w-8" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{fullName(user)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {formatPhone(user.phone)}
                </span>
                {user.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Регистрация: {formatDate(user.created_at)}
                {user.birth_date ? ` · ДР: ${formatDate(user.birth_date)}` : ''}
              </p>
            </div>
          </div>

          {/* Баланс баллов */}
          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-900/20">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                Бонусный баланс
              </p>
              <p className="mt-0.5 text-2xl font-bold text-brand-700 dark:text-brand-300">
                {formatNumber(user.loyalty_balance)} баллов
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPointsOpen(true)}>
              <Coins className="h-4 w-4" /> Начислить / списать
            </Button>
          </div>

          {/* История записей */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <CalendarDays className="h-4 w-4 text-slate-400" /> История записей
            </h4>
            {apptsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                {appointments.map((a) => (
                  <div
                    key={String(a.id)}
                    className="flex items-center justify-between gap-3 border-b border-slate-50 px-3.5 py-2.5 last:border-0 dark:border-slate-800/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-700 dark:text-slate-300">
                        {a.service?.name ?? 'Услуга'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.appointment_datetime
                          ? `${formatDate(appointmentDate(a) ?? '')} · ${appointmentTime(a)}`
                          : 'Время не назначено'}
                      </p>
                    </div>
                    <Badge tone={a.status === 'completed' ? 'slate' : a.status === 'confirmed' ? 'emerald' : a.status === 'cancelled' ? 'rose' : 'amber'}>
                      {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Записей пока не было</p>
            )}
          </div>

          {/* Последние операции с баллами */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Coins className="h-4 w-4 text-slate-400" /> Операции с баллами
            </h4>
            {loyaltyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : loyaltyHistory && loyaltyHistory.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {loyaltyHistory.map((tx) => (
                  <div key={String(tx.id)} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-700 dark:text-slate-300">{tx.reason}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(tx.created_at)}</p>
                    </div>
                    <span
                      className={
                        tx.amount > 0
                          ? 'text-sm font-semibold text-emerald-600 dark:text-emerald-400'
                          : 'text-sm font-semibold text-rose-600 dark:text-rose-400'
                      }
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {formatNumber(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Операций с баллами пока нет</p>
            )}
          </div>
        </div>
      )}

      <PatientFormModal open={editOpen} onClose={() => setEditOpen(false)} user={user ?? null} />
      <AdjustPointsModal open={pointsOpen} onClose={() => setPointsOpen(false)} patient={user ?? null} />
      <PushModal
        open={pushOpen}
        onClose={() => setPushOpen(false)}
        phone={phone}
        patientName={user ? fullName(user) : undefined}
        userId={user?.id}
      />
    </Modal>
  );
}
