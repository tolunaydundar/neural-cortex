import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../utils/useFocusTrap';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel = 'CONFIRM', onConfirm, onCancel }: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = 'confirm-modal-title';
  const messageId = 'confirm-modal-message';

  useFocusTrap(modalRef);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="glass-panel p-6 lg:p-8 w-full max-w-sm mx-4 rounded-lg border-error/30"
        onClick={e => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-headline-md text-headline-md text-error mb-2">{title}</h2>
        <p id={messageId} className="text-sm text-on-surface-variant mb-6">{message}</p>
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
