import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { HabitProvider } from './context/HabitContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
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

  const handleOnboardingComplete = (name: string, wantsExampleData: boolean) => {
    localStorage.setItem('nexus_username', name);
    
    if (wantsExampleData) {
      const now = new Date();
      const habit1Id = crypto.randomUUID();
      const habit2Id = crypto.randomUUID();
      const habit3Id = crypto.randomUUID();

      const dummyHabits = [
        { id: habit1Id, title: 'Meditation', icon: 'self_improvement', created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
        { id: habit2Id, title: 'Read 10 Pages', icon: 'menu_book', created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
        { id: habit3Id, title: 'Workout', icon: 'fitness_center', created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
      ];

      const dummyLogs = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date(now.getTime() - i * 86400000);
        // Habit 1: Everyday
        dummyLogs.push({ id: crypto.randomUUID(), habitId: habit1Id, date: date.toISOString() });
        // Habit 2: Skip a few days
        if (i % 3 !== 0) {
          dummyLogs.push({ id: crypto.randomUUID(), habitId: habit2Id, date: date.toISOString() });
        }
        // Habit 3: Every other day
        if (i % 2 === 0) {
          dummyLogs.push({ id: crypto.randomUUID(), habitId: habit3Id, date: date.toISOString() });
        }
      }

      localStorage.setItem('nexus_habits', JSON.stringify(dummyHabits));
      localStorage.setItem('nexus_logs', JSON.stringify(dummyLogs));
      
      window.location.reload();
      return;
    }

    setShowOnboarding(false);
    setIsAddModalOpen(true);
    window.dispatchEvent(new Event('username_updated'));
  };

  const { isDark } = useTheme();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const color = isDark
        ? 'rgba(0, 220, 230, 0.03)'
        : 'rgba(0, 105, 111, 0.03)';
      document.body.style.backgroundImage = `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${color} 0%, transparent 50%)`;
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isDark]);

  const handleToastDone = useCallback(() => setToast(null), []);

  return (
    <>
      <Sidebar onLogActivity={() => setIsLogModalOpen(true)} />
      <main className="ml-64 min-h-screen flex flex-col">
        <TopBar onAddHabit={() => setIsAddModalOpen(true)} />
        <div className="flex-grow flex flex-col p-margin-desktop">
          <Outlet context={{ openAddModal: () => setIsAddModalOpen(true) }} />
        </div>
      </main>



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
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
