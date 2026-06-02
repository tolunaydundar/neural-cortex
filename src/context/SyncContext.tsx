/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SyncContextType {
  isSaving: boolean;
  lastSaved: Date | null;
  lastError: string | null;
  startSync: () => void;
  endSync: (error?: unknown) => void;
  runSync: <T>(fn: () => Promise<T>) => Promise<T>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [activeSyncs, setActiveSyncs] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const startSync = useCallback(() => {
    setActiveSyncs((prev) => prev + 1);
  }, []);

  const endSync = useCallback((error?: unknown) => {
    setActiveSyncs((prev) => Math.max(0, prev - 1));
    if (error) {
      setLastError(error instanceof Error ? error.message : 'Sync failed.');
      return;
    }
    setLastError(null);
    setLastSaved(new Date());
  }, []);

  const runSync = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    startSync();
    try {
      const result = await fn();
      endSync();
      return result;
    } catch (error) {
      endSync(error);
      throw error;
    }
  }, [startSync, endSync]);

  return (
    <SyncContext.Provider
      value={{
        isSaving: activeSyncs > 0,
        lastSaved,
        lastError,
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
