import { useEffect } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel = 'CONFIRM', onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="glass-panel p-8 w-full max-w-sm rounded-lg border-error/30 shadow-[0_0_30px_rgba(255,75,75,0.1)]" onClick={e => e.stopPropagation()}>
        <h2 className="font-headline-md text-headline-md text-error mb-2">{title}</h2>
        <p className="text-sm text-on-surface-variant mb-6">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-white/20 text-on-surface font-label-caps text-label-caps hover:bg-white/5 transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-error text-white font-label-caps text-label-caps hover:bg-red-500 transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
