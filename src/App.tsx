import { BrowserRouter as Router, Routes, Route, Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitProvider } from './context/HabitContext';
import { TaskProvider } from './context/TaskContext';
import { NoteProvider } from './context/NoteContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SyncProvider } from './context/SyncContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Toast from './components/Toast';
import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { importDataToCloud, checkHasCloudData } from './utils/migration';
import { motion, AnimatePresence } from 'framer-motion';
import { createSampleLocalData } from './utils/sampleData';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Habits = lazy(() => import('./pages/Habits'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Notes = lazy(() => import('./pages/Notes'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const PerformanceAnalytics = lazy(() => import('./pages/PerformanceAnalytics'));
const LegacyLogs = lazy(() => import('./pages/LegacyLogs'));
const Settings = lazy(() => import('./pages/Settings'));
const HabitDetails = lazy(() => import('./pages/HabitDetails'));
const LogActivityModal = lazy(() => import('./components/LogActivityModal'));
const AddHabitModal = lazy(() => import('./components/AddHabitModal'));
const AddTaskModal = lazy(() => import('./components/AddTaskModal'));
const NoteEditorModal = lazy(() => import('./components/NoteEditorModal'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));

interface ToastState {
  message: string;
  icon?: string;
}

function RouteFallback() {
  return (
    <div className="flex min-h-[320px] flex-grow items-center justify-center">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-primary-fixed-dim">progress_activity</span>
        <span className="font-label-caps text-[11px] tracking-widest">LOADING MODULE</span>
      </div>
    </div>
  );
}

// Layout component to wrap pages that share the sidebar and topbar
function AppLayout() {
  const { currentUser, updateOperatorName } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
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
      if (currentUser) {
        await importDataToCloud(currentUser, createSampleLocalData());
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
          onAddTask={() => setIsAddTaskModalOpen(true)}
          onAddNote={() => setIsAddNoteModalOpen(true)}
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
        <Suspense fallback={null}>
          <LogActivityModal
            onClose={() => setIsLogModalOpen(false)}
            onSuccess={() => setToast({ message: 'ACTIVITY LOGGED SUCCESSFULLY', icon: 'task_alt' })}
          />
        </Suspense>
      )}
      {isAddModalOpen && (
        <Suspense fallback={null}>
          <AddHabitModal
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => setToast({ message: 'HABIT INITIALIZED', icon: 'add_task' })}
          />
        </Suspense>
      )}
      {isAddTaskModalOpen && (
        <Suspense fallback={null}>
          <AddTaskModal
            onClose={() => setIsAddTaskModalOpen(false)}
            onSuccess={() => setToast({ message: 'TASK DEPLOYED', icon: 'task_alt' })}
          />
        </Suspense>
      )}
      {isAddNoteModalOpen && (
        <Suspense fallback={null}>
          <NoteEditorModal initialNote={null} onClose={() => setIsAddNoteModalOpen(false)} />
        </Suspense>
      )}

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onComplete={handleOnboardingComplete} />
        </Suspense>
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
                    <Route path="/welcome" element={<PublicOnlyRoute><Suspense fallback={<RouteFallback />}><LandingPage /></Suspense></PublicOnlyRoute>} />
                    <Route path="/auth" element={<PublicOnlyRoute><Suspense fallback={<RouteFallback />}><AuthPage /></Suspense></PublicOnlyRoute>} />
                    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route index element={<Suspense fallback={<RouteFallback />}><Dashboard /></Suspense>} />
                      <Route path="habits" element={<Suspense fallback={<RouteFallback />}><Habits /></Suspense>} />
                      <Route path="tasks" element={<Suspense fallback={<RouteFallback />}><Tasks /></Suspense>} />
                      <Route path="notes" element={<Suspense fallback={<RouteFallback />}><Notes /></Suspense>} />
                      <Route path="notes/:id" element={<Suspense fallback={<RouteFallback />}><NoteDetail /></Suspense>} />
                      <Route path="performance" element={<Suspense fallback={<RouteFallback />}><PerformanceAnalytics /></Suspense>} />
                      <Route path="legacy" element={<Suspense fallback={<RouteFallback />}><LegacyLogs /></Suspense>} />
                      <Route path="settings" element={<Suspense fallback={<RouteFallback />}><Settings /></Suspense>} />
                      <Route path="habit/:id" element={<Suspense fallback={<RouteFallback />}><HabitDetails /></Suspense>} />
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
