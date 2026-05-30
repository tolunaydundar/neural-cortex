import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  icon?: string;
  duration?: number;
  onDone: () => void;
}

export default function Toast({ message, icon = 'check_circle', duration = 2500, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  return (
    <div
      className={`fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 lg:px-6 py-3 lg:py-4 max-w-[calc(100vw-2rem)] bg-surface-container-high border border-primary-fixed-dim/30 shadow-[0_0_30px_rgba(0,220,230,0.15)] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <span className="material-symbols-outlined text-primary-fixed-dim text-lg" style={{fontVariationSettings: "'FILL' 1"}}>{icon}</span>
      <span className="font-label-caps text-[11px] text-primary-fixed-dim tracking-widest">{message}</span>
    </div>
  );
}
