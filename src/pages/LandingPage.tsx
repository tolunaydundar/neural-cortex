import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden selection:bg-primary-fixed-dim/30">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,220,230,0.3)_0%,rgba(0,220,230,0)_70%)] blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(206,93,255,0.2)_0%,rgba(206,93,255,0)_70%)] blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 40, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(0,105,111,0.3)_0%,rgba(0,105,111,0)_70%)] blur-3xl" 
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-sm bg-surface-container flex items-center justify-center border border-outline/10 group-hover:border-primary-fixed-dim/50 transition-colors group-hover:shadow-[0_0_20px_rgba(0,220,230,0.3)]">
            <span className="material-symbols-outlined text-primary-fixed-dim text-xl">psychology</span>
          </div>
          <span className="font-headline-sm font-bold text-lg tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-primary-fixed-dim to-secondary-container">
            Neural Cortex
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth?mode=login" className="hidden md:inline-block px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            Sign In
          </Link>
          <Link to="/auth?mode=signup" className="px-6 py-2.5 rounded-full bg-primary-fixed-dim text-background font-label-caps text-xs tracking-widest font-bold hover:bg-[#6ff6ff] hover:shadow-[0_0_20px_rgba(0,220,230,0.4)] transition-all">
            GET STARTED
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center pt-10 pb-20 max-w-5xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-fixed-dim/30 bg-primary-fixed-dim/5 backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse"></span>
            <span className="font-label-caps text-[10px] tracking-[0.2em] text-primary-fixed-dim">COGNITIVE OS v1.0</span>
          </motion.div>
          
          <motion.h1 
            initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }}
            className="font-headline-lg text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.1] mb-6"
          >
            Orchestrate your <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-fixed-dim via-primary-container to-secondary-container animate-gradient-x">
              execution system.
            </span>
          </motion.h1>
          
          <motion.p 
            initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}
            className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A unified command center for habits, tasks, and insights. Track momentum, surface bottlenecks, and keep every habit in motion with real-time cloud sync.
          </motion.p>
          
          <motion.div 
            initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link to="/auth?mode=signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary-fixed-dim text-background font-label-caps text-sm tracking-widest font-bold hover:bg-[#6ff6ff] hover:shadow-[0_0_30px_rgba(0,220,230,0.4)] hover:-translate-y-1 transition-all">
              INITIALIZE HABIT
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full border border-outline/20 glass-panel text-on-surface font-label-caps text-sm tracking-widest hover:bg-surface-container-highest hover:border-outline/40 transition-all">
              EXPLORE FEATURES
            </a>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 bg-surface-container-lowest/50 backdrop-blur-sm border-y border-outline/5">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="font-headline-md text-3xl md:text-4xl text-on-surface mb-4">A unified cognitive environment</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">Everything you need to maintain operational excellence, seamlessly integrated.</p>
            </motion.div>

            <motion.div 
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { icon: 'track_changes', title: 'Habit Intelligence', desc: 'Identify streaks, consistency gaps, and week-over-week efficiency metrics.' },
                { icon: 'checklist', title: 'Task Matrix', desc: 'Drag priorities, manage status, and keep overdue work visible and actionable.' },
                { icon: 'description', title: 'Notes Studio', desc: 'Structured markdown notes with folders, tags, and rich editing capabilities.' },
                { icon: 'analytics', title: 'Precision Dashboards', desc: 'Real-time metrics and status signals reveal exactly where execution is drifting.' }
              ].map((feature, i) => (
                <motion.div key={i} variants={fadeIn} className="glass-panel p-8 rounded-md hover:border-primary-fixed-dim/30 hover:shadow-[0_0_30px_rgba(0,220,230,0.1)] transition-all group cursor-default">
                  <div className="w-12 h-12 rounded-sm bg-surface-container flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-fixed-dim/10 transition-all">
                    <span className="material-symbols-outlined text-primary-fixed-dim">{feature.icon}</span>
                  </div>
                  <h3 className="font-headline-sm text-xl text-on-surface mb-3">{feature.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats / Social Proof */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
             <motion.div variants={fadeIn} className="text-center">
               <div className="font-headline-lg text-5xl text-primary-fixed-dim mb-2">100%</div>
               <div className="font-label-caps text-xs tracking-widest text-on-surface-variant">REAL-TIME CLOUD SYNC</div>
             </motion.div>
             <motion.div variants={fadeIn} className="text-center">
               <div className="font-headline-lg text-5xl text-secondary-container mb-2">Zero</div>
               <div className="font-label-caps text-xs tracking-widest text-on-surface-variant">DISTRACTIONS</div>
             </motion.div>
             <motion.div variants={fadeIn} className="text-center">
               <div className="font-headline-lg text-5xl text-primary-fixed-dim mb-2">∞</div>
               <div className="font-label-caps text-xs tracking-widest text-on-surface-variant">CROSS-DEVICE ACCESS</div>
             </motion.div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,220,230,0.05)_0%,transparent_50%)]" />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-headline-lg text-4xl md:text-6xl mb-6">Ready to optimize?</h2>
            <p className="text-xl text-on-surface-variant mb-10">Join the system and take control of your daily execution.</p>
            <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-on-surface text-surface font-label-caps text-sm tracking-widest font-bold hover:bg-primary-fixed-dim hover:shadow-[0_0_30px_rgba(0,220,230,0.4)] transition-all hover:scale-105">
              START YOUR JOURNEY <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-outline/10 py-8 px-6 text-center text-sm text-on-surface-variant/60 font-label-caps tracking-widest">
        &copy; {new Date().getFullYear()} NEURAL CORTEX SYSTEM
      </footer>
    </div>
  );
};

export default LandingPage;
