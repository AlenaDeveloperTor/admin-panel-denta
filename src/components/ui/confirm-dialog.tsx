'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Подтвердите действие',
  message,
  confirmText = 'Удалить',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
}) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
    } finally {
      setInternalLoading(false);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={loading || internalLoading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
