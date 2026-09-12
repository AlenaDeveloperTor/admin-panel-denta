import { Badge } from './badge';
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from '@/types/appointment';

const toneByStatus: Record<AppointmentStatus, 'amber' | 'emerald' | 'rose' | 'slate' | 'sky'> = {
  created: 'sky',
  confirmed: 'emerald',
  cancelled: 'rose',
  completed: 'slate',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={toneByStatus[status] ?? 'slate'}>{APPOINTMENT_STATUS_LABELS[status] ?? status}</Badge>;
}
