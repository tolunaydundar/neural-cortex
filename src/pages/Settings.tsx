import { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

import { migrateDataToCloud } from '../utils/migration';

export default function Settings() {
  const { habits, logs } = useHabits();
  const { tasks } = useTasks();
  const { currentUser } = useAuth();
  
  const [userName, setUserName] = useState(() => localStorage.getItem('nexus_username') || 'OPERATOR');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigrateSuccess, setShowMigrateSuccess] = useState(false);

  const handleSaveName = () => {
    localStorage.setItem('nexus_username', userName);
    window.dispatchEvent(new Event('username_updated'));
  };

  const handleExport = () => {
    const data = {
      nexus_habits: localStorage.getItem('nexus_habits'),
      nexus_logs: localStorage.getItem('nexus_logs'),
      nexus_tasks: localStorage.getItem('nexus_tasks'),
      nexus_notes: localStorage.getItem('nexus_notes'),
      nexus_folders: localStorage.getItem('nexus_folders'),
      nexus_username: localStorage.getItem('nexus_username'),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (currentUser) {
            await migrateDataToCloud(currentUser, data);
          } else {
            if (data.nexus_habits) localStorage.setItem('nexus_habits', data.nexus_habits);
            if (data.nexus_logs) localStorage.setItem('nexus_logs', data.nexus_logs);
            if (data.nexus_tasks) localStorage.setItem('nexus_tasks', data.nexus_tasks);
            if (data.nexus_notes) localStorage.setItem('nexus_notes', data.nexus_notes);
            if (data.nexus_folders) localStorage.setItem('nexus_folders', data.nexus_folders);
            if (data.nexus_username) localStorage.setItem('nexus_username', data.nexus_username);
          }
          setShowImportSuccess(true);
          setTimeout(() => {
            setShowImportSuccess(false);
            window.location.reload();
          }, 1500);
        } catch (err) {
          console.error(err);
          alert('Invalid backup file format or import failed.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearAll = () => {
    localStorage.removeItem('nexus_habits');
    localStorage.removeItem('nexus_logs');
    localStorage.removeItem('nexus_tasks');
    localStorage.removeItem('nexus_notes');
    localStorage.removeItem('nexus_folders');
    localStorage.removeItem('nexus_username');
    setShowClearConfirm(false);
    window.location.reload();
  };

  const handleMigrateToCloud = async () => {
    if (!currentUser) {
      alert("You must be logged in to migrate data to the cloud.");
      return;
    }
    
    setIsMigrating(true);
    try {
      const migrated = await migrateDataToCloud(currentUser);
      if (migrated) {
        setShowMigrateSuccess(true);
        setTimeout(() => setShowMigrateSuccess(false), 3000);
      } else {
        alert("No local data found to migrate.");
      }
    } catch (err) {
      console.error(err);
      alert("Error migrating data to cloud. See console.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="flex-grow space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">System Protocols</h1>
        <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">CONFIGURATION & DATA MANAGEMENT</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-4 lg:space-y-6">
          {/* Profile */}
          <div className="glass-panel p-4 lg:p-6">
            <h2 className="font-headline-sm text-headline-sm text-primary-fixed-dim mb-1">OPERATOR PROFILE</h2>
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-6">IDENTITY CONFIGURATION</p>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-grow">
                <label className="font-label-caps text-xs text-on-surface block mb-2">OPERATOR NAME</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-surface-container-lowest border-b border-white/20 p-3 font-body-md text-on-surface focus:outline-none focus:border-primary-fixed-dim focus:shadow-[0_4px_12px_rgba(0,220,230,0.1)] transition-all"
                />
              </div>
              <button
                onClick={handleSaveName}
                className="px-6 py-3 bg-primary-fixed-dim text-background font-label-caps text-label-caps hover:bg-[#6ff6ff] transition-colors tracking-widest cursor-pointer"
              >
                SAVE
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="glass-panel p-4 lg:p-6">
            <h2 className="font-headline-sm text-headline-sm text-primary-fixed-dim mb-1">DATA MANAGEMENT</h2>
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-6">BACKUP, RESTORE & PURGE</p>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container/50 border border-white/5 hover:border-white/10 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-primary-fixed-dim">Migrate to Cloud</p>
                  <p className="text-xs text-on-surface-variant mt-1">Move your local data to Firebase Firestore</p>
                </div>
                <button
                  onClick={handleMigrateToCloud}
                  disabled={isMigrating}
                  className="flex items-center justify-center gap-2 w-full sm:w-32 px-4 py-2 bg-primary-fixed-dim/20 border border-primary-fixed-dim/50 text-primary-fixed-dim font-label-caps text-[10px] hover:bg-primary-fixed-dim/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  {isMigrating ? 'MIGRATING...' : 'MIGRATE'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container/50 border border-white/5 hover:border-white/10 transition-colors">
                <div>
                  <p className="text-sm font-semibold">Export Backup</p>
                  <p className="text-xs text-on-surface-variant mt-1">Download all habits and logs as JSON</p>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 w-full sm:w-32 px-4 py-2 border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-[10px] hover:bg-primary-fixed-dim/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  EXPORT
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container/50 border border-white/5 hover:border-white/10 transition-colors">
                <div>
                  <p className="text-sm font-semibold">Import Backup</p>
                  <p className="text-xs text-on-surface-variant mt-1">Restore from a previously exported file</p>
                </div>
                <button
                  onClick={handleImport}
                  className="flex items-center justify-center gap-2 w-full sm:w-32 px-4 py-2 border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-[10px] hover:bg-primary-fixed-dim/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  IMPORT
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container/50 border border-error/20 hover:border-error/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-error">Purge All Data</p>
                  <p className="text-xs text-on-surface-variant mt-1">Permanently delete all local data</p>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-32 px-4 py-2 border border-error/40 text-error font-label-caps text-[10px] hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  PURGE
                </button>
              </div>
            </div>

            {/* Success toasts */}
            {showMigrateSuccess && (
              <div className="mt-4 p-3 bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 text-primary-fixed-dim text-xs font-label-caps flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                DATA MIGRATED TO CLOUD SUCCESSFULLY
              </div>
            )}
            {showExportSuccess && (
              <div className="mt-4 p-3 bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 text-primary-fixed-dim text-xs font-label-caps flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                BACKUP EXPORTED SUCCESSFULLY
              </div>
            )}
            {showImportSuccess && (
              <div className="mt-4 p-3 bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 text-primary-fixed-dim text-xs font-label-caps flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                DATA IMPORTED — RELOADING...
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Info */}
        <div className="lg:col-span-5 space-y-4 lg:space-y-6">
          {/* Statistics */}
          <div className="glass-panel p-6">
            <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-4">SYSTEM STATISTICS</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Active Protocols</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">{habits.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Total Log Entries</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">{logs.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Active Tasks</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">{tasks.filter(t => t.status !== 'done').length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Completed Tasks</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">{tasks.filter(t => t.status === 'done').length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Local Storage Used</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">
                  {((new Blob([JSON.stringify({ h: localStorage.getItem('nexus_habits'), l: localStorage.getItem('nexus_logs'), t: localStorage.getItem('nexus_tasks'), n: localStorage.getItem('nexus_notes'), f: localStorage.getItem('nexus_folders') })]).size) / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-on-surface-variant">Data Backend</span>
                <span className="font-data-display text-sm text-on-surface-variant/70">
                  {currentUser ? 'Firebase Firestore' : 'localStorage'}
                </span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="glass-panel p-6">
            <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-4">ABOUT</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Application</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">Neural Cortex</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Version</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Runtime</span>
                <span className="font-data-display text-sm text-on-surface-variant/70">React 19 + Vite</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-on-surface-variant">Design System</span>
                <span className="font-data-display text-sm text-on-surface-variant/70">Tailwind v4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 lg:p-8 w-full max-w-sm mx-4 rounded-lg border-error/30 shadow-[0_0_30px_rgba(255,75,75,0.1)]">
            <h2 className="font-headline-md text-headline-md text-error mb-2">CONFIRM PURGE</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              This will permanently delete all local data. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 border border-white/20 text-on-surface font-label-caps text-label-caps hover:bg-white/5 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 bg-error text-white font-label-caps text-label-caps hover:bg-red-500 transition-colors cursor-pointer"
              >
                PURGE ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
