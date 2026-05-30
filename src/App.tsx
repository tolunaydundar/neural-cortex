import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { HabitProvider } from './context/HabitContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import LegacyLogs from './pages/LegacyLogs';
import Settings from './pages/Settings';
import HabitDetails from './pages/HabitDetails';
import LogActivityModal from './components/LogActivityModal';
import AddHabitModal from './components/AddHabitModal';
import Toast from './components/Toast';
import OnboardingModal from './components/OnboardingModal';
import { useState, useEffect, useCallback } from 'react';

interface ToastState {
  message: string;
  icon?: string;
}

// Layout component to wrap pages that share the sidebar and topbar
function AppLayout() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('nexus_username'));
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleOnboardingComplete = (name: string) => {
    localStorage.setItem('nexus_username', name);
    setShowOnboarding(false);
    setIsAddModalOpen(true);
    window.dispatchEvent(new Event('username_updated'));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.body.style.backgroundImage = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(0, 220, 230, 0.03) 0%, transparent 50%)`;
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleToastDone = useCallback(() => setToast(null), []);

  return (
    <>
      <Sidebar onLogActivity={() => setIsLogModalOpen(true)} />
      <main className="ml-64 min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-grow flex flex-col p-margin-desktop">
          <Outlet />
        </div>
      </main>

      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-10 right-10 w-16 h-16 rounded-full bg-primary-fixed-dim text-background flex items-center justify-center shadow-[0_0_20px_rgba(0,220,230,0.4)] hover:scale-110 active:scale-95 transition-all z-50 group cursor-pointer">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
      </button>

      {isLogModalOpen && (
        <LogActivityModal
          onClose={() => setIsLogModalOpen(false)}
          onSuccess={() => setToast({ message: 'ACTIVITY LOGGED SUCCESSFULLY', icon: 'task_alt' })}
        />
      )}
      {isAddModalOpen && (
        <AddHabitModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => setToast({ message: 'PROTOCOL INITIALIZED', icon: 'add_task' })}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {toast && <Toast message={toast.message} icon={toast.icon} onDone={handleToastDone} />}
    </>
  );
}

function App() {
  return (
    <HabitProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="performance" element={<PerformanceAnalytics />} />
            <Route path="legacy" element={<LegacyLogs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="habit/:id" element={<HabitDetails />} />
          </Route>
        </Routes>
      </Router>
    </HabitProvider>
  );
}

export default App;
