import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, browserPopupRedirectResolver } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to authenticate');
      }
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
      .then(() => {
        navigate('/');
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to authenticate with Google');
        }
      });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,220,230,0.25)_0%,rgba(0,220,230,0)_70%)]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,183,77,0.18)_0%,rgba(255,183,77,0)_70%)]" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,105,111,0.25)_0%,rgba(0,105,111,0)_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-[10px] tracking-[0.3em]">
              COGNITIVE OS
            </div>
            <div className="space-y-4">
              <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-5xl text-primary-fixed-dim tracking-tight">
                Orchestrate habits, tasks, and insights in one focused command center.
              </h1>
              <p className="text-on-surface-variant text-base lg:text-lg max-w-xl">
                Neural Cortex turns daily execution into a measurable system. Track momentum, surface bottlenecks, and keep every protocol in motion.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="glass-panel p-4">
                <p className="font-label-caps text-[9px] text-on-surface-variant">SYSTEMS</p>
                <p className="font-data-display text-lg text-primary-fixed-dim">Habits</p>
              </div>
              <div className="glass-panel p-4">
                <p className="font-label-caps text-[9px] text-on-surface-variant">FLOW</p>
                <p className="font-data-display text-lg text-primary-fixed-dim">Tasks</p>
              </div>
              <div className="glass-panel p-4">
                <p className="font-label-caps text-[9px] text-on-surface-variant">MEMORY</p>
                <p className="font-data-display text-lg text-primary-fixed-dim">Notes</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#features"
                className="px-5 py-3 border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-xs tracking-widest hover:bg-primary-fixed-dim/10 transition-colors"
              >
                EXPLORE FEATURES
              </a>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="px-5 py-3 bg-primary-fixed-dim text-background font-label-caps text-xs tracking-widest hover:bg-[#6ff6ff] transition-colors"
              >
                START NOW
              </button>
            </div>

            <div id="features" className="grid md:grid-cols-2 gap-4">
              <div className="glass-panel p-4">
                <h3 className="font-headline-sm text-headline-sm text-primary-fixed-dim">Precision Dashboards</h3>
                <p className="text-sm text-on-surface-variant mt-2">
                  Real-time metrics and status signals reveal exactly where execution is drifting.
                </p>
              </div>
              <div className="glass-panel p-4">
                <h3 className="font-headline-sm text-headline-sm text-primary-fixed-dim">Habit Intelligence</h3>
                <p className="text-sm text-on-surface-variant mt-2">
                  Identify streaks, consistency gaps, and week-over-week efficiency.
                </p>
              </div>
              <div className="glass-panel p-4">
                <h3 className="font-headline-sm text-headline-sm text-primary-fixed-dim">Task Matrix</h3>
                <p className="text-sm text-on-surface-variant mt-2">
                  Drag priorities, manage status, and keep overdue work visible.
                </p>
              </div>
              <div className="glass-panel p-4">
                <h3 className="font-headline-sm text-headline-sm text-primary-fixed-dim">Notes Studio</h3>
                <p className="text-sm text-on-surface-variant mt-2">
                  Structured notes with folders, tags, and markdown previews.
                </p>
              </div>
            </div>
          </section>

          <section className="glass-panel p-6 lg:p-8 rounded-3xl border border-outline/10 shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3">
                <span className="material-symbols-outlined text-[30px]">psychology</span>
              </div>
              <h2 className="text-xl font-semibold text-on-surface">Welcome to Neural Cortex</h2>
              <p className="text-on-surface-variant mt-1 text-sm">
                {isLogin ? 'Authenticate to continue.' : 'Create your operator profile.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-5 text-sm border border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1 ml-1">Email Identifier</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface px-4 py-3 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-outline/10"
                  placeholder="agent@nexus.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1 ml-1">Security Key</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface px-4 py-3 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-outline/10"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-3 rounded-2xl font-medium mt-2 hover:bg-primary/90 transition-colors"
              >
                {isLogin ? 'AUTHENTICATE' : 'INITIALIZE PROTOCOL'}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between">
              <hr className="w-full border-outline/10" />
              <span className="p-2 text-on-surface-variant text-xs font-medium uppercase tracking-wider">OR</span>
              <hr className="w-full border-outline/10" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full mt-5 bg-surface text-on-surface py-3 rounded-2xl font-medium border border-outline/20 hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="text-center mt-6 text-sm text-on-surface-variant">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
