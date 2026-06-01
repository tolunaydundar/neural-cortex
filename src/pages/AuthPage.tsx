import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { motion } from 'framer-motion';
import { usePageTitle } from '../utils/usePageTitle';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();

  usePageTitle(isLogin ? 'Sign In' : 'Sign Up');

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
    signInWithRedirect(auth, googleProvider)
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to authenticate with Google');
        }
      });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex overflow-hidden selection:bg-primary-fixed-dim/30">
      
      {/* Left Column (Branding & Visuals) - Hidden on Mobile */}
      <div className="hidden lg:flex w-[45%] relative bg-surface-container-lowest border-r border-outline/10 flex-col justify-center px-16 xl:px-24">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,220,230,0.25)_0%,rgba(0,220,230,0)_70%)] blur-3xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(206,93,255,0.2)_0%,rgba(206,93,255,0)_70%)] blur-3xl" 
          />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <Link to="/welcome" className="inline-flex items-center gap-3 group cursor-pointer mb-16">
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center border border-outline/10 group-hover:border-primary-fixed-dim/40 transition-colors shadow-[0_0_15px_rgba(0,220,230,0.15)] group-hover:shadow-[0_0_25px_rgba(0,220,230,0.3)]">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">psychology</span>
            </div>
            <span className="font-headline-sm font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-primary-fixed-dim to-secondary-container">
              Neural Cortex
            </span>
          </Link>

          <motion.h1 
            initial="hidden" animate="visible" variants={fadeIn}
            className="font-headline-lg text-5xl xl:text-6xl mb-6 text-on-surface leading-[1.1] tracking-tight"
          >
            Welcome to the <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-fixed-dim to-secondary-container">Cognitive OS</span>
          </motion.h1>
          
          <motion.p 
            initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }}
            className="text-on-surface-variant text-lg leading-relaxed"
          >
            Synchronize your habits, tasks, and notes into a unified execution system. Built for high performers.
          </motion.p>

          <motion.div 
            initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.3 }}
            className="mt-16 space-y-3 font-data-display text-xs text-primary-fixed-dim/40 tracking-[0.2em]"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse"></span>
              <p>&gt; SECURE CONNECTION ESTABLISHED</p>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <p>&gt; SYNC HABITS ONLINE</p>
            </div>
            <div className="flex items-center gap-2 opacity-40">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              <p>&gt; AWAITING OPERATOR INPUT...</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column (Auth Form) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Mobile-only background effects */}
        <div className="lg:hidden absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,220,230,0.15)_0%,rgba(0,220,230,0)_70%)] blur-2xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 flex justify-center">
            <Link to="/welcome" className="inline-flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center border border-outline/10 shadow-[0_0_15px_rgba(0,220,230,0.1)]">
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl">psychology</span>
              </div>
              <span className="font-headline-sm font-bold text-lg tracking-wide text-on-surface">
                Neural Cortex
              </span>
            </Link>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-headline-md font-bold text-on-surface tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create profile'}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {isLogin ? 'Enter your credentials to access the system.' : 'Initialize your operator habit.'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-error-container/20 text-error p-4 rounded-xl mb-6 text-sm border border-error/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <p>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-label-caps tracking-widest text-on-surface-variant ml-1">IDENTIFIER</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant/50 group-focus-within:text-primary-fixed-dim transition-colors">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-highest/50 px-4 py-3.5 pl-11 rounded-xl text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim/50 border border-outline/10 focus:border-primary-fixed-dim/30 transition-all focus:bg-surface-container"
                  placeholder="agent@nexus.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-label-caps tracking-widest text-on-surface-variant ml-1">SECURITY KEY</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant/50 group-focus-within:text-primary-fixed-dim transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-highest/50 px-4 py-3.5 pl-11 rounded-xl text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim/50 border border-outline/10 focus:border-primary-fixed-dim/30 transition-all focus:bg-surface-container"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-fixed-dim text-background py-4 rounded-xl font-label-caps text-xs tracking-[0.15em] font-bold mt-4 hover:bg-[#6ff6ff] hover:shadow-[0_0_20px_rgba(0,220,230,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              {isLogin ? 'AUTHENTICATE' : 'INITIALIZE'}
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <hr className="w-full border-outline/10" />
            <span className="px-4 text-on-surface-variant text-[10px] font-label-caps uppercase tracking-[0.2em]">OR CONNECT</span>
            <hr className="w-full border-outline/10" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full mt-8 bg-surface-container/50 text-on-surface py-3.5 rounded-xl font-medium border border-outline/10 hover:bg-surface-container-highest hover:border-outline/20 transition-all flex items-center justify-center gap-3 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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

          <p className="text-center mt-8 text-sm text-on-surface-variant">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-fixed-dim hover:text-[#6ff6ff] font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>

          <div className="mt-8 text-center lg:hidden">
            <Link to="/welcome" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
              <span className="material-symbols-outlined text-[14px]">arrow_back</span> Return to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
