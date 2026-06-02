import { useEffect, useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useNotes } from '../context/NoteContext';
import { useAuth } from '../context/AuthContext';
import PurgeModal from '../components/PurgeModal';
import { usePageTitle } from '../utils/usePageTitle';
import { importDataToCloud } from '../utils/migration';

export default function Settings() {
  usePageTitle('Settings');
  const { habits, logs } = useHabits();
  const { tasks } = useTasks();
  const { notes, folders } = useNotes();
  const { currentUser, operatorName, theme, userPreferences, updateOperatorName } = useAuth();

  const [userName, setUserName] = useState(operatorName);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [dataMessage, setDataMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showPurgeSuccess, setShowPurgeSuccess] = useState(false);
  
  const [lastExported, setLastExported] = useState<string | null>(localStorage.getItem('nexus_last_exported'));

  useEffect(() => {
    // Keep the editable draft in sync with profile updates from Firestore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserName(operatorName);
  }, [operatorName]);

  const handleSaveName = async () => {
    await updateOperatorName(userName.trim() || 'OPERATOR');
  };

  const handleExport = () => {
    if (!currentUser) {
      setDataMessage({ type: 'error', text: 'Please sign in to export your cloud data.' });
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
        notesEditorMode: userPreferences.notesEditorMode,
        tasksViewMode: userPreferences.tasksViewMode,
        timerSettings: userPreferences.timerSettings,
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
    
    const now = new Date().toISOString();
    localStorage.setItem('nexus_last_exported', now);
    setLastExported(now);

    setShowExportSuccess(true);
    setDataMessage({ type: 'info', text: 'Backup exported successfully.' });
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
            setDataMessage({ type: 'info', text: 'Data imported. Reloading to refresh local listeners.' });
            setTimeout(() => {
              setShowImportSuccess(false);
              window.location.reload();
            }, 1500);
          } else {
            setDataMessage({ type: 'error', text: 'You must be logged in to import data.' });
          }
        } catch (err) {
          console.error(err);
          setDataMessage({ type: 'error', text: err instanceof Error ? err.message : 'Invalid backup file format or import failed.' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex-grow space-y-8 max-w-[1200px] mx-auto w-full pb-24">
      {/* Massive Header */}
      <div className="mb-8 pt-8 lg:pt-12">
        <h1 className="font-headline-lg text-4xl sm:text-6xl text-on-surface font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6 lg:space-y-8">
          {/* Profile */}
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h2 className="font-headline-sm text-2xl text-on-surface mb-2">Operator Profile</h2>
            <p className="font-label-caps text-[11px] text-on-surface-variant mb-8 tracking-wider">IDENTITY CONFIGURATION</p>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-grow">
                <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2 font-bold tracking-wider">OPERATOR NAME</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-on-surface/5 border border-on-surface/5 rounded-sm p-4 text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all hover:bg-on-surface/10"
                />
              </div>
              <button
                onClick={handleSaveName}
                className="px-8 py-4 bg-primary-fixed-dim text-background font-label-caps text-[11px] font-bold rounded-sm hover:bg-[#6ff6ff] transition-all cursor-pointer tracking-widest hover:shadow-lg"
              >
                SAVE
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h2 className="font-headline-sm text-2xl text-on-surface mb-2">Data Management</h2>
            <p className="font-label-caps text-[11px] text-on-surface-variant mb-8 tracking-wider">BACKUP, RESTORE & PURGE</p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-on-surface/5 rounded-sm border border-on-surface/5 hover:bg-on-surface/10 transition-colors">
                <div>
                  <p className="text-base font-semibold text-on-surface">Export Backup</p>
                  <p className="text-sm text-on-surface-variant mt-1">Download all configuration and data as JSON</p>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border-2 border-primary-fixed-dim/30 rounded-sm text-primary-fixed-dim font-label-caps text-[11px] font-bold hover:bg-primary-fixed-dim/10 hover:border-primary-fixed-dim/50 transition-all cursor-pointer tracking-widest"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  EXPORT
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-on-surface/5 rounded-sm border border-on-surface/5 hover:bg-on-surface/10 transition-colors">
                <div>
                  <p className="text-base font-semibold text-on-surface">Import Backup</p>
                  <p className="text-sm text-on-surface-variant mt-1">Restore from a previously exported file</p>
                </div>
                <button
                  onClick={handleImport}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border-2 border-primary-fixed-dim/30 rounded-sm text-primary-fixed-dim font-label-caps text-[11px] font-bold hover:bg-primary-fixed-dim/10 hover:border-primary-fixed-dim/50 transition-all cursor-pointer tracking-widest"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  IMPORT
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-error/5 rounded-sm border border-error/20 hover:bg-error/10 transition-colors mt-8">
                <div>
                  <p className="text-base font-semibold text-error">Purge Cloud Data</p>
                  <p className="text-sm text-error/70 mt-1">Permanently delete all your content</p>
                </div>
                <button
                  onClick={() => setShowPurgeModal(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-error text-background rounded-sm font-label-caps text-[11px] font-bold hover:bg-error/80 transition-all cursor-pointer tracking-widest"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  PURGE
                </button>
              </div>
            </div>

            {showExportSuccess && (
              <div className="mt-6 p-4 rounded-sm bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 text-primary-fixed-dim text-xs font-label-caps font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                BACKUP EXPORTED SUCCESSFULLY
              </div>
            )}
            {dataMessage && (
              <div className={`mt-6 p-4 rounded-sm border text-xs font-label-caps font-bold flex items-center gap-3 ${
                dataMessage.type === 'error'
                  ? 'bg-error/10 border-error/30 text-error'
                  : 'bg-primary-fixed-dim/10 border-primary-fixed-dim/30 text-primary-fixed-dim'
              }`}>
                <span className="material-symbols-outlined text-[18px]">{dataMessage.type === 'error' ? 'error' : 'info'}</span>
                {dataMessage.text}
              </div>
            )}
            {showImportSuccess && (
              <div className="mt-6 p-4 rounded-sm bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 text-primary-fixed-dim text-xs font-label-caps font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                DATA IMPORTED — RELOADING...
              </div>
            )}
            {showPurgeSuccess && (
              <div className="mt-6 p-4 rounded-sm bg-error/10 border border-error/30 text-error text-xs font-label-caps font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                ALL CLOUD DATA PURGED
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Info */}
        <div className="lg:col-span-5 space-y-6 lg:space-y-8">
          {/* Statistics */}
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h3 className="font-headline-sm text-xl text-on-surface mb-6">System Statistics</h3>
            <div className="space-y-4">
              {/* Habits Group */}
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Active Habits</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{habits.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Total Log Entries</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{logs.length}</span>
              </div>
              
              {/* Tasks Group */}
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10 mt-4">
                <span className="text-sm font-medium text-on-surface/80">Active Tasks</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{tasks.filter(t => t.status !== 'done').length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Completed Tasks</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{tasks.filter(t => t.status === 'done').length}</span>
              </div>
              
              {/* Notes Group */}
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10 mt-4">
                <span className="text-sm font-medium text-on-surface/80">Active Notes</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{notes.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Note Folders</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{folders.length}</span>
              </div>
              
              {/* Account / Backup */}
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10 mt-4">
                <span className="text-sm font-medium text-on-surface/80">Account Created</span>
                <span className="font-data-display text-sm font-bold text-on-surface-variant/70">
                  {currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-on-surface/80">Last Manual Backup</span>
                <span className="font-data-display text-sm font-bold text-on-surface-variant/70">
                  {lastExported ? new Date(lastExported).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h3 className="font-headline-sm text-xl text-on-surface mb-6">About</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Application</span>
                <span className="font-data-display text-sm font-bold text-primary-fixed-dim">Neural Cortex</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Version</span>
                <span className="font-data-display text-sm font-bold text-primary-fixed-dim">1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Design System</span>
                <span className="font-data-display text-sm font-bold text-on-surface-variant/70">Tailwind v4</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Runtime</span>
                <span className="font-data-display text-sm font-bold text-on-surface-variant/70">React 19 + Vite</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-on-surface/80">Data Backend</span>
                <span className="font-data-display text-sm font-bold text-on-surface-variant/70">
                  {currentUser ? 'Firebase Firestore' : 'Signed out'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PurgeModal 
        isOpen={showPurgeModal} 
        onClose={() => setShowPurgeModal(false)} 
        onSuccess={() => {
          setShowPurgeModal(false);
          setShowPurgeSuccess(true);
          setTimeout(() => {
            setShowPurgeSuccess(false);
            window.location.reload();
          }, 2000);
        }} 
      />
    </div>
  );
}
