import { motion } from 'framer-motion';

export default function Loader({ 
  title = 'LOADING', 
  subtitle = 'PLEASE WAIT', 
  fullScreen = true 
}: { 
  title?: string; 
  subtitle?: string; 
  fullScreen?: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center p-8 gap-6 w-full ${fullScreen ? 'min-h-screen fixed inset-0 z-[100] bg-background' : 'min-h-[320px] flex-grow h-full'}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full blur-xl bg-primary-fixed-dim/20 animate-pulse"></div>
        <div className="w-16 h-16 border-[3px] border-on-surface/10 border-t-primary-fixed-dim rounded-full animate-spin"></div>
        <div className="absolute w-10 h-10 border-[3px] border-on-surface/10 border-b-primary-fixed-dim/70 rounded-full animate-[spin_1.5s_reverse_infinite]"></div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="font-label-caps text-[12px] tracking-[0.2em] text-primary-fixed-dim font-bold animate-pulse">{title}</span>
        <span className="font-data-display text-[10px] tracking-widest text-on-surface-variant/50">{subtitle}</span>
      </div>
    </motion.div>
  );
}
