import { useEffect, useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useNotes } from '../context/NoteContext';
import { useAuth } from '../context/AuthContext';

import { importDataToCloud } from '../utils/migration';

export default function Settings() {
  const { habits, logs } = useHabits();
  const { tasks } = useTasks();
  const { notes, folders } = useNotes();
  const { currentUser, operatorName, theme, userPreferences, updateOperatorName } = useAuth();

  const [userName, setUserName] = useState(operatorName);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);



  useEffect(() => {
    setUserName(operatorName);
  }, [operatorName]);

  const handleSaveName = async () => {
    await updateOperatorName(userName.trim() || 'OPERATOR');
  };

  const handleExport = () => {
    if (!currentUser) {
      alert('Please sign in to export your cloud data.');
      return;
    }
    const data = {
      schema_version: 3,
      nexus_habits: JSON.stringify(habits),
      nexus_logs: JSON.stringify(logs),
      nexus_tasks: JSON.stringify(tasks),
      nexus_notes: JSON.stringify(notes),
      nexus_folders: JSON.stringify(folders),
      nexus_preferences: JSON.stringify({
        operatorName,
        theme,
        notesSortMode: userPreferences.notesSortMode,
        notesViewMode: userPreferences.notesViewMode,
      }),
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
            await importDataToCloud(currentUser, data);
            setShowImportSuccess(true);
            setTimeout(() => {
              setShowImportSuccess(false);
              window.location.reload();
            }, 1500);
          } else {
            alert('You must be logged in to import data.');
          }
        } catch (err) {
          console.error(err);
          alert('Invalid backup file format or import failed.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
            </div>

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

              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-on-surface-variant">Data Backend</span>
                <span className="font-data-display text-sm text-on-surface-variant/70">
                  {currentUser ? 'Firebase Firestore' : 'Signed out'}
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
    </div>
  );
}
