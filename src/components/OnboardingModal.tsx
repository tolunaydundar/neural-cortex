import { useState } from 'react';

interface OnboardingModalProps {
  onComplete: (name: string) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel p-8 w-full max-w-md rounded-lg shadow-[0_0_30px_rgba(0,220,230,0.1)]">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-4xl text-primary-fixed-dim mb-4 drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
            psychology
          </span>
          <h2 className="font-headline-md text-headline-md text-primary-fixed-dim tracking-tight">SYSTEM INITIALIZATION</h2>
          <p className="font-label-caps text-[10px] text-on-surface-variant mt-2 tracking-widest">ENTER OPERATOR CREDENTIALS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="font-label-caps text-xs text-on-surface block mb-2">OPERATOR NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-surface-container-lowest border-b border-white/20 p-3 font-body-md text-on-surface focus:outline-none focus:border-primary-fixed-dim focus:shadow-[0_4px_12px_rgba(0,220,230,0.1)] transition-all"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-primary-fixed-dim text-background font-label-caps text-label-caps hover:bg-[#6ff6ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-widest cursor-pointer"
          >
            INITIALIZE PROTOCOLS
          </button>
        </form>
      </div>
    </div>
  );
}
