import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useTasks } from './TaskContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  browserNotifications: boolean;
  logActivity: boolean;
}

interface TimerContextType {
  status: TimerStatus;
  mode: TimerMode;
  timeLeft: number;
  sessionCount: number;
  settings: TimerSettings;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  start: () => void;
  pause: () => void;
  skip: () => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  browserNotifications: false,
  logActivity: true,
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Audio context for the ping sound
let audioCtx: AudioContext | null = null;
const playPing = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const playTone = (freq: number, startTime: number, duration: number) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Soft bell envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const now = audioCtx.currentTime;
  // Pleasant major third "ding-ding" chime
  playTone(1046.50, now, 1.5);       // C6
  playTone(1318.51, now + 0.15, 1.5); // E6 slightly delayed
};

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, userPreferences, updateUserPreferences } = useAuth();
  const { addTask } = useTasks();
  
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [mode, setMode] = useState<TimerMode>('focus');
  const settings = userPreferences.timerSettings || DEFAULT_SETTINGS;
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration);
  const [sessionCount, setSessionCount] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Request notification permission if enabled
    if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings]);

  useEffect(() => {
    workerRef.current = new Worker('/timerWorker.js');
    
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleTimerComplete = useCallback(() => {
    if (settings.soundEnabled) {
      playPing();
    }
    
    let nextMode: TimerMode = 'focus';
    let nextTimeLeft = settings.focusDuration;
    let autoStart = false;

    if (mode === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      
      // Log activity if enabled
      if (settings.logActivity) {
        addTask({
          title: `Focus Session (${Math.round(settings.focusDuration / 60)}m)`,
          description: 'Automatically logged from Timer.',
          priority: 'low',
          status: 'completed',
          category: 'Focus',
          due_date: new Date().toISOString().slice(0, 10),
          subtasks: []
        });
      }

      if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete', {
          body: 'Great job! Time for a break.',
          icon: '/vite.svg'
        });
      }

      if (newCount % settings.longBreakInterval === 0) {
        nextMode = 'longBreak';
        nextTimeLeft = settings.longBreakDuration;
      } else {
        nextMode = 'shortBreak';
        nextTimeLeft = settings.shortBreakDuration;
      }
      autoStart = settings.autoStartBreaks;
      
    } else {
      // Coming from a break
      nextMode = 'focus';
      nextTimeLeft = settings.focusDuration;
      autoStart = settings.autoStartFocus;
      
      if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Break Complete', {
          body: 'Time to get back to focus.',
          icon: '/vite.svg'
        });
      }
    }

    setMode(nextMode);
    setTimeLeft(nextTimeLeft);
    
    if (autoStart) {
      targetEndTimeRef.current = Date.now() + nextTimeLeft * 1000;
      setStatus('running');
    } else {
      targetEndTimeRef.current = null;
      setStatus('idle');
      workerRef.current?.postMessage('stop');
    }
  }, [mode, sessionCount, settings, addTask]);

  useEffect(() => {
    if (!workerRef.current) return;
    
    workerRef.current.onmessage = (e) => {
      if (e.data === 'tick') {
        if (targetEndTimeRef.current !== null) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
          if (remaining <= 0) {
            targetEndTimeRef.current = null;
            handleTimerComplete();
          } else {
            setTimeLeft(remaining);
          }
        }
      }
    };
  }, [handleTimerComplete]);

  useEffect(() => {
    if (status === 'running') {
      workerRef.current?.postMessage('start');
    } else {
      workerRef.current?.postMessage('stop');
    }
  }, [status]);

  // Sync initial time if settings change while idle
  useEffect(() => {
    if (status === 'idle') {
      if (mode === 'focus') setTimeLeft(settings.focusDuration);
      else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakDuration);
      else if (mode === 'longBreak') setTimeLeft(settings.longBreakDuration);
    }
  }, [settings, mode, status]);

  // Reset timer entirely on logout
  useEffect(() => {
    if (!currentUser) {
      targetEndTimeRef.current = null;
      setStatus('idle');
      setMode('focus');
      setSessionCount(0);
      workerRef.current?.postMessage('stop');
    }
  }, [currentUser]);

  const start = () => {
    targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    setStatus('running');
  };
  const pause = () => {
    targetEndTimeRef.current = null;
    setStatus('paused');
  };
  
  const skip = () => {
    targetEndTimeRef.current = null;
    handleTimerComplete();
  };

  const reset = () => {
    targetEndTimeRef.current = null;
    setStatus('idle');
    workerRef.current?.postMessage('stop');
    if (mode === 'focus') setTimeLeft(settings.focusDuration);
    else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakDuration);
    else if (mode === 'longBreak') setTimeLeft(settings.longBreakDuration);
  };

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    updateUserPreferences({ timerSettings: { ...settings, ...newSettings } });
  };

  return (
    <TimerContext.Provider value={{
      status, mode, timeLeft, sessionCount, settings,
      updateSettings, start, pause, skip, reset
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within TimerProvider');
  return context;
};
