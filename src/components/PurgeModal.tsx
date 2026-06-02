import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../utils/useFocusTrap';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  reauthenticateWithPopup 
} from 'firebase/auth';
import { googleProvider } from '../firebase';
import { purgeCloudData } from '../utils/migration';

interface PurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurgeModal({ isOpen, onClose, onSuccess }: PurgeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [error, setError] = useState('');

  useFocusTrap(modalRef);

  if (!isOpen || !currentUser) return null;

  const isPasswordUser = currentUser.providerData.some(p => p.providerId === 'password');

  const handlePurge = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (confirmText !== 'PURGE') return;
    
    setError('');
    setIsPurging(true);

    try {
      if (isPasswordUser) {
        if (!password) {
          throw new Error('Password is required.');
        }
        const credential = EmailAuthProvider.credential(currentUser.email!, password);
        await reauthenticateWithCredential(currentUser, credential);
      } else {
        // Google auth user
        await reauthenticateWithPopup(currentUser, googleProvider);
      }

      await purgeCloudData(currentUser);
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please try again.');
      }
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="glass-panel p-6 lg:p-8 w-full max-w-md rounded-sm border border-error/20"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4 border border-error/20">
            <span className="material-symbols-outlined text-3xl text-error">warning</span>
          </div>
          <h2 className="font-headline-md text-2xl text-error tracking-tight mb-2">Purge Data</h2>
          <p className="text-sm text-on-surface-variant">
            This will permanently delete all your habits, tasks, notes, folders, and logs from the cloud. 
            <strong className="block mt-1 text-on-surface">Your account will NOT be deleted.</strong>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error/10 border border-error/30 text-error text-xs rounded-lg flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handlePurge} className="space-y-5">
          {isPasswordUser && (
            <div>
              <label className="block text-xs font-label-caps text-on-surface-variant mb-1 ml-1 tracking-widest">VERIFY PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-surface-container px-4 py-3 rounded-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-error/50 transition-all border border-outline/10 focus:border-error/30"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-label-caps text-on-surface-variant mb-1 ml-1 tracking-widest">
              TYPE "PURGE" TO CONFIRM
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="PURGE"
              className="w-full bg-surface-container px-4 py-3 rounded-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-error/50 transition-all border border-outline/10 focus:border-error/30 uppercase"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPurging}
              className="flex-1 py-3.5 rounded-sm border border-outline/20 text-on-surface font-label-caps text-xs tracking-widest hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={confirmText !== 'PURGE' || isPurging || (isPasswordUser && !password)}
              className="flex-1 py-3.5 rounded-sm bg-error text-white font-label-caps text-xs tracking-widest hover:bg-error/90 hover:shadow-[0_0_20px_rgba(255,82,82,0.3)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isPurging ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  PURGING...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  PURGE DATA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
