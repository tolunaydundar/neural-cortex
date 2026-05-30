import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface OnboardingModalProps {
  onComplete: (name: string, wantsExampleData: boolean) => void;
}

type Step = 'NAME' | 'THEME' | 'DATA';

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('NAME');
  const [name, setName] = useState('');
  const { theme, setTheme } = useTheme();

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setStep('THEME');
    }
  };

  const handleThemeSelect = (selectedTheme: 'dark' | 'light') => {
    setTheme(selectedTheme);
    setStep('DATA');
  };

  const handleDataSelect = (wantsExampleData: boolean) => {
    onComplete(name.trim(), wantsExampleData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel p-8 w-full max-w-md rounded-lg shadow-[0_0_30px_rgba(0,220,230,0.1)]">
        
        {step === 'NAME' && (
          <>
            <div className="text-center mb-8">
              <span className="material-symbols-outlined text-4xl text-primary-fixed-dim mb-4 drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
                psychology
              </span>
              <h2 className="font-headline-md text-headline-md text-primary-fixed-dim tracking-tight">SYSTEM INITIALIZATION</h2>
              <p className="font-label-caps text-[10px] text-on-surface-variant mt-2 tracking-widest">ENTER OPERATOR CREDENTIALS</p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-6">
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
                CONTINUE
              </button>
            </form>
          </>
        )}

        {step === 'THEME' && (
          <>
            <div className="text-center mb-8">
              <span className="material-symbols-outlined text-4xl text-primary-fixed-dim mb-4 drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
                palette
              </span>
              <h2 className="font-headline-md text-headline-md text-primary-fixed-dim tracking-tight">VISUAL PREFERENCE</h2>
              <p className="font-label-caps text-[10px] text-on-surface-variant mt-2 tracking-widest">SELECT INTERFACE THEME</p>
            </div>

            <div className="space-y-4">
              <button
                onMouseEnter={() => setTheme('dark')}
                onClick={() => handleThemeSelect('dark')}
                className={`w-full py-4 border font-label-caps text-label-caps hover:bg-primary-fixed-dim/10 transition-colors tracking-widest cursor-pointer ${theme === 'dark' ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-white/20 text-on-surface'}`}
              >
                DARK THEME
              </button>
              <button
                onMouseEnter={() => setTheme('light')}
                onClick={() => handleThemeSelect('light')}
                className={`w-full py-4 border font-label-caps text-label-caps hover:bg-primary-fixed-dim/10 transition-colors tracking-widest cursor-pointer ${theme === 'light' ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-white/20 text-on-surface'}`}
              >
                LIGHT THEME
              </button>
            </div>
          </>
        )}

        {step === 'DATA' && (
          <>
            <div className="text-center mb-8">
              <span className="material-symbols-outlined text-4xl text-primary-fixed-dim mb-4 drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
                database
              </span>
              <h2 className="font-headline-md text-headline-md text-primary-fixed-dim tracking-tight">DATA INITIALIZATION</h2>
              <p className="font-label-caps text-[10px] text-on-surface-variant mt-2 tracking-widest">CHOOSE STARTING DATA</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleDataSelect(false)}
                className="w-full py-4 border border-white/20 text-on-surface font-label-caps text-label-caps hover:bg-white/5 transition-colors tracking-widest cursor-pointer flex flex-col items-center gap-1"
              >
                <span>FRESH START</span>
                <span className="text-[10px] text-on-surface-variant lowercase tracking-normal">Start with an empty dashboard</span>
              </button>
              <button
                onClick={() => handleDataSelect(true)}
                className="w-full py-4 bg-primary-fixed-dim text-background font-label-caps text-label-caps hover:bg-[#6ff6ff] transition-colors tracking-widest cursor-pointer flex flex-col items-center gap-1"
              >
                <span>LOAD EXAMPLE DATA</span>
                <span className="text-[10px] text-background/70 lowercase tracking-normal">Explore with 2 weeks of pre-filled data</span>
              </button>
            </div>
            
            <p className="text-center text-xs text-on-surface-variant mt-6">
              Note: You can easily purge all data later in the settings page.
            </p>
          </>
        )}

      </div>
    </div>
  );
}
