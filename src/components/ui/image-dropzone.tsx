'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ImageDropzone({
  value,
  onChange,
  uploading,
  onFile,
}: {
  value?: string;
  onChange: (url: string) => void;
  uploading?: boolean;
  onFile?: (file: File) => void | Promise<void>;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], _rejected: FileRejection[]) => {
      const file = accepted[0];
      if (!file) return;
      // Показываем локальный превью, пока грузится на сервер
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onChange('');
      void onFile?.(file);
    },
    [onChange, onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  });

  const shown = value || preview;

  return (
    <div className="space-y-2">
      {shown ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt="Превью" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange('');
            }}
            className="absolute right-2 top-2 rounded-md bg-slate-900/70 p-1 text-white hover:bg-slate-900"
            aria-label="Удалить изображение"
          >
            <X className="h-4 w-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
            isDragActive
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40',
          )}
        >
          <input {...getInputProps()} />
          <ImagePlus className="h-7 w-7 text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Перетащите изображение или нажмите для выбора
          </p>
          <p className="text-[11px] text-slate-400">PNG, JPG, WEBP до 5 МБ</p>
        </div>
      )}
    </div>
  );
}
