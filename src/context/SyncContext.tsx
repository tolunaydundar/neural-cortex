import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SyncContextType {
  isSaving: boolean;
  lastSaved: Date | null;
  startSync: () => void;
  endSync: () => void;
  runSync: <T>(fn: () => Promise<T>) => Promise<T>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [activeSyncs, setActiveSyncs] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const startSync = useCallback(() => {
    setActiveSyncs((prev) => prev + 1);
  }, []);

  const endSync = useCallback(() => {
    setActiveSyncs((prev) => Math.max(0, prev - 1));
    setLastSaved(new Date());
  }, []);

  const runSync = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    startSync();
    try {
      return await fn();
    } finally {
      endSync();
    }
  }, [startSync, endSync]);

  return (
    <SyncContext.Provider
      value={{
        isSaving: activeSyncs > 0,
        lastSaved,
        startSync,
        endSync,
        runSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
