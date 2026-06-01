import { BrowserRouter as Router, Routes, Route, Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import { HabitProvider } from './context/HabitContext';
import { TaskProvider } from './context/TaskContext';
import { NoteProvider } from './context/NoteContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SyncProvider } from './context/SyncContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import LegacyLogs from './pages/LegacyLogs';
import Settings from './pages/Settings';
import HabitDetails from './pages/HabitDetails';
import LogActivityModal from './components/LogActivityModal';
import AddHabitModal from './components/AddHabitModal';
import AddTaskModal from './components/AddTaskModal';
import Toast from './components/Toast';
import OnboardingModal from './components/OnboardingModal';
import { useState, useEffect, useCallback } from 'react';
import { importDataToCloud, checkHasCloudData } from './utils/migration';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastState {
  message: string;
  icon?: string;
}

// Layout component to wrap pages that share the sidebar and topbar
function AppLayout() {
  const { currentUser, updateOperatorName } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializingData, setIsInitializingData] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    async function initData() {
      if (!currentUser) {
        setIsInitializingData(false);
        return;
      }
      const hasCloud = await checkHasCloudData(currentUser);
      setShowOnboarding(!hasCloud);
      setIsInitializingData(false);
    }
    initData();
  }, [currentUser]);

  const handleOnboardingComplete = async (name: string, wantsExampleData: boolean) => {
    await updateOperatorName(name);

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
        dummyLogs.push({ id: crypto.randomUUID(), habitId: habit1Id, date: date.toISOString() });
        if (i % 3 !== 0) {
          dummyLogs.push({ id: crypto.randomUUID(), habitId: habit2Id, date: date.toISOString() });
        }
        if (i % 2 === 0) {
          dummyLogs.push({ id: crypto.randomUUID(), habitId: habit3Id, date: date.toISOString() });
        }
      }

      // Sample tasks with varied priorities, statuses, categories, due dates, and subtasks
      const dummyTasks = [
        {
          id: crypto.randomUUID(),
          title: 'Review project roadmap',
          description: 'Go through Q3 objectives and prioritize deliverables.',
          priority: 'high' as const,
          status: 'in_progress' as const,
          category: 'Work',
          due_date: new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10),
          created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
          completed_at: null,
          subtasks: [
            { id: crypto.randomUUID(), title: 'Gather team feedback', done: true },
            { id: crypto.randomUUID(), title: 'Draft timeline', done: false },
            { id: crypto.randomUUID(), title: 'Present to stakeholders', done: false },
          ],
        },
        {
          id: crypto.randomUUID(),
          title: 'Buy groceries',
          description: '',
          priority: 'medium' as const,
          status: 'todo' as const,
          category: 'Personal',
          due_date: new Date(now.getTime() + 1 * 86400000).toISOString().slice(0, 10),
          created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
          completed_at: null,
          subtasks: [
            { id: crypto.randomUUID(), title: 'Vegetables & fruits', done: false },
            { id: crypto.randomUUID(), title: 'Protein & dairy', done: false },
          ],
        },
        {
          id: crypto.randomUUID(),
          title: 'Fix login page bug',
          description: 'Users report a flash of unstyled content on initial load.',
          priority: 'critical' as const,
          status: 'todo' as const,
          category: 'Work',
          due_date: new Date().toISOString().slice(0, 10),
          created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
          completed_at: null,
          subtasks: [],
        },
        {
          id: crypto.randomUUID(),
          title: 'Read "Atomic Habits" chapter 5',
          description: '',
          priority: 'low' as const,
          status: 'todo' as const,
          category: 'Personal',
          due_date: null,
          created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
          completed_at: null,
          subtasks: [],
        },
        {
          id: crypto.randomUUID(),
          title: 'Set up CI/CD pipeline',
          description: 'Configure GitHub Actions for automated testing and deployment.',
          priority: 'high' as const,
          status: 'done' as const,
          category: 'Work',
          due_date: new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10),
          created_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
          completed_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
          subtasks: [
            { id: crypto.randomUUID(), title: 'Write test suite', done: true },
            { id: crypto.randomUUID(), title: 'Configure deploy step', done: true },
          ],
        },
        {
          id: crypto.randomUUID(),
          title: 'Schedule dentist appointment',
          description: '',
          priority: 'medium' as const,
          status: 'done' as const,
          category: 'Health',
          due_date: new Date(now.getTime() - 1 * 86400000).toISOString().slice(0, 10),
          created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
          completed_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
          subtasks: [],
        },
      ];

      const dummyData = {
        nexus_habits: JSON.stringify(dummyHabits),
        nexus_logs: JSON.stringify(dummyLogs),
        nexus_tasks: JSON.stringify(dummyTasks)
      };

      if (currentUser) {
        await importDataToCloud(currentUser, dummyData);
      }

      window.location.reload();
      return;
    }

    setShowOnboarding(false);
  };

  const { isDark } = useTheme();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.body.style.backgroundImage = '';
      return;
    }

    let rafId: number | null = null;
    let latestX = 0;
    let latestY = 0;

    const updateBackground = () => {
      rafId = null;
      const color = isDark
        ? 'rgba(0, 220, 230, 0.03)'
        : 'rgba(0, 105, 111, 0.03)';
      document.body.style.backgroundImage = `radial-gradient(circle at ${latestX * 100}% ${latestY * 100}%, ${color} 0%, transparent 50%)`;
    };

    const handlePointerMove = (e: PointerEvent) => {
      latestX = e.clientX / window.innerWidth;
      latestY = e.clientY / window.innerHeight;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateBackground);
      }
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      document.body.style.backgroundImage = '';
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isDark]);

  const handleToastDone = useCallback(() => setToast(null), []);

  const getMobileNavClass = (isActive: boolean) =>
    `mobile-nav-item ${isActive ? 'active text-primary-fixed-dim' : 'text-on-surface-variant'}`;

  if (isInitializingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary-fixed-dim border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Sidebar
        onLogActivity={() => setIsLogModalOpen(true)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="ml-0 lg:ml-64 min-h-screen flex flex-col mobile-content-pad">
        <TopBar
          onAddHabit={() => setIsAddModalOpen(true)}
          onMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
        />
        <div className="flex-grow flex flex-col px-4 lg:px-margin-desktop pb-4 lg:pb-margin-desktop pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col"
            >
              <Outlet context={{
                openAddModal: () => setIsAddModalOpen(true),
                openAddTaskModal: () => setIsAddTaskModalOpen(true),
              }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation — Core, Habits, FAB, Tasks, Perf */}
      <nav className="mobile-bottom-nav lg:hidden">
        <div className="flex items-center justify-around px-2 pt-1">
          <NavLink to="/" end className={({ isActive }) => getMobileNavClass(isActive)}>
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-[9px] font-label-caps tracking-wider">Core</span>
          </NavLink>
          <NavLink to="/habits" className={({ isActive }) => getMobileNavClass(isActive)}>
            <span className="material-symbols-outlined text-[22px]">routine</span>
            <span className="text-[9px] font-label-caps tracking-wider">Habits</span>
          </NavLink>

          {/* Center FAB — Log Activity */}
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="mobile-fab cursor-pointer"
            aria-label="Log activity"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>

          <NavLink to="/tasks" className={({ isActive }) => getMobileNavClass(isActive)}>
            <span className="material-symbols-outlined text-[22px]">task_alt</span>
            <span className="text-[9px] font-label-caps tracking-wider">Tasks</span>
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => getMobileNavClass(isActive)}>
            <span className="material-symbols-outlined text-[22px]">book</span>
            <span className="text-[9px] font-label-caps tracking-wider">Notes</span>
          </NavLink>
        </div>
      </nav>

      {isLogModalOpen && (
        <LogActivityModal
          onClose={() => setIsLogModalOpen(false)}
          onSuccess={() => setToast({ message: 'ACTIVITY LOGGED SUCCESSFULLY', icon: 'task_alt' })}
        />
      )}
      {isAddModalOpen && (
        <AddHabitModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => setToast({ message: 'HABIT INITIALIZED', icon: 'add_task' })}
        />
      )}
      {isAddTaskModalOpen && (
        <AddTaskModal
          onClose={() => setIsAddTaskModalOpen(false)}
          onSuccess={() => setToast({ message: 'TASK DEPLOYED', icon: 'task_alt' })}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {toast && <Toast message={toast.message} icon={toast.icon} onDone={handleToastDone} />}
    </>
  );
}


// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

// Public Only Route Component
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <SyncProvider>
      <AuthProvider>
        <ThemeProvider>
          <HabitProvider>
            <TaskProvider>
              <NoteProvider>
                <Router>
                  <Routes>
                    <Route path="/welcome" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
                    <Route path="/auth" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
                    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route index element={<Dashboard />} />
                      <Route path="habits" element={<Habits />} />
                      <Route path="tasks" element={<Tasks />} />
                      <Route path="notes" element={<Notes />} />
                      <Route path="performance" element={<PerformanceAnalytics />} />
                      <Route path="legacy" element={<LegacyLogs />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="habit/:id" element={<HabitDetails />} />
                    </Route>
                  </Routes>
                </Router>
              </NoteProvider>
            </TaskProvider>
          </HabitProvider>
        </ThemeProvider>
      </AuthProvider>
    </SyncProvider>
  );
}

export default App;
