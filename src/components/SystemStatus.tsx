import { useState, useRef, useEffect, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';

type StatusLevel = 'on_track' | 'needs_focus' | 'off_track';

interface StatusConfig {
  label: string;
  icon: string;
  colorClass: string;
  glowColor: string;
  lightGlowColor: string;
  bgClass: string;
  dotClass: string;
}

const STATUS_MAP: Record<StatusLevel, StatusConfig> = {
  on_track: {
    label: 'ON TRACK',
    icon: 'bolt',
    colorClass: 'text-primary-fixed-dim',
    glowColor: 'rgba(0, 220, 230, 0.4)',
    lightGlowColor: 'rgba(0, 105, 111, 0.3)',
    bgClass: 'system-status-on-track',
    dotClass: 'system-status-dot-on-track',
  },
  needs_focus: {
    label: 'NEEDS FOCUS',
    icon: 'warning',
    colorClass: 'system-status-amber',
    glowColor: 'rgba(255, 183, 77, 0.4)',
    lightGlowColor: 'rgba(200, 130, 0, 0.3)',
    bgClass: 'system-status-needs-focus',
    dotClass: 'system-status-dot-needs-focus',
  },
  off_track: {
    label: 'OFF TRACK',
    icon: 'error',
    colorClass: 'text-error',
    glowColor: 'rgba(255, 75, 75, 0.4)',
    lightGlowColor: 'rgba(186, 26, 26, 0.3)',
    bgClass: 'system-status-off-track',
    dotClass: 'system-status-dot-off-track',
  },
};

function getStatusConfig(level: StatusLevel): StatusConfig {
  switch (level) {
    case 'on_track':
      return STATUS_MAP.on_track;
    case 'needs_focus':
      return STATUS_MAP.needs_focus;
    case 'off_track':
      return STATUS_MAP.off_track;
  }
}


export default function SystemStatus() {
  const { habits, getEfficiency } = useHabits();
  const { tasks, getOverdueTasks, getCompletionStats } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Compute metrics ──
  const metrics = useMemo(() => {
    // Habit efficiency: average across all habits (last 7 days)
    const habitEfficiencies = habits.map(h => getEfficiency(h.id, 7));
    const avgHabitEfficiency =
      habitEfficiencies.length > 0
        ? Math.round(habitEfficiencies.reduce((a, b) => a + b, 0) / habitEfficiencies.length)
        : null; // null = no habits

    // Task metrics
    const overdueTasks = getOverdueTasks();
    const overdueCount = overdueTasks.length;
    const completionStats = getCompletionStats(7);
    const activeTasks = tasks.filter(t => t.status !== 'done');

    return {
      avgHabitEfficiency,
      overdueCount,
      taskCompletionRate: completionStats.rate,
      taskCompleted: completionStats.completed,
      taskTotal: completionStats.total,
      activeTaskCount: activeTasks.length,
      habitCount: habits.length,
    };
  }, [habits, tasks, getEfficiency, getOverdueTasks, getCompletionStats]);

  // ── Compute composite score (0–100) ──
  const { score, level } = useMemo(() => {
    const hasHabits = metrics.habitCount > 0;
    const hasTasks = metrics.taskTotal > 0;

    if (!hasHabits && !hasTasks) {
      // Fresh user — always on track
      return { score: 100, level: 'on_track' as StatusLevel };
    }

    let compositeScore = 0;
    let weights = 0;

    // Habit component (0–100): avg efficiency, weighted 50%
    if (hasHabits && metrics.avgHabitEfficiency !== null) {
      compositeScore += metrics.avgHabitEfficiency * 0.5;
      weights += 0.5;
    }

    // Task completion rate (0–100): weighted 30%
    if (hasTasks) {
      compositeScore += metrics.taskCompletionRate * 0.3;
      weights += 0.3;
    }

    // Overdue penalty component: starts at 100, drops by 25 per overdue task, weighted 20%
    if (hasTasks) {
      const overduePenalty = Math.max(0, 100 - metrics.overdueCount * 25);
      compositeScore += overduePenalty * 0.2;
      weights += 0.2;
    }

    // Normalize if not all components present
    const normalizedScore = weights > 0 ? Math.round(compositeScore / weights) : 100;

    let level: StatusLevel;
    if (normalizedScore >= 65) {
      level = 'on_track';
    } else if (normalizedScore >= 35) {
      level = 'needs_focus';
    } else {
      level = 'off_track';
    }

    return { score: normalizedScore, level };
  }, [metrics]);

  const config = getStatusConfig(level);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(prev => !prev)}
        className={`hidden sm:flex items-center gap-2 px-4 py-2 border cursor-pointer transition-all duration-300 hover:scale-[1.02] ${config.bgClass}`}
        aria-label={`System status: ${config.label}`}
        aria-expanded={isOpen}
      >
        <span className={`${config.dotClass} system-status-dot`} />
        <span className={`font-label-caps text-[10px] tracking-widest ${config.colorClass}`}>
          {config.label}
        </span>
        <span
          className={`font-data-display text-[10px] tracking-wider ${config.colorClass}`}
          style={{ opacity: 0.7 }}
        >
          {score}
        </span>
        <span
          className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${config.colorClass}`}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.6,
          }}
        >
          expand_more
        </span>
      </button>

      {/* ── Popover ── */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="system-status-popover"
        >
          {/* Score header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-[18px] ${config.colorClass}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {config.icon}
              </span>
              <span className={`font-label-caps text-[11px] tracking-widest ${config.colorClass}`}>
                SYSTEM STATUS
              </span>
            </div>
            <div className={`font-data-display text-[24px] ${config.colorClass}`}>
              {score}
              <span className="text-[10px] text-on-surface-variant ml-1">/100</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="system-status-bar-track">
            <div
              className={`system-status-bar-fill ${config.dotClass}`}
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Breakdown */}
          <div className="mt-4 space-y-3">
            {/* Habits */}
            <div className="system-status-metric-row">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">routine</span>
                <span className="font-label-caps text-[9px] tracking-wider text-on-surface-variant">
                  HABITS (7D)
                </span>
              </div>
              <span className="font-data-display text-[13px] text-on-surface">
                {metrics.habitCount === 0
                  ? '—'
                  : `${metrics.avgHabitEfficiency}%`}
              </span>
            </div>

            {/* Task completion */}
            <div className="system-status-metric-row">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">task_alt</span>
                <span className="font-label-caps text-[9px] tracking-wider text-on-surface-variant">
                  TASKS DONE (7D)
                </span>
              </div>
              <span className="font-data-display text-[13px] text-on-surface">
                {metrics.taskTotal === 0
                  ? '—'
                  : `${metrics.taskCompleted}/${metrics.taskTotal}`}
              </span>
            </div>

            {/* Overdue */}
            <div className="system-status-metric-row">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[14px] ${metrics.overdueCount > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                  schedule
                </span>
                <span className="font-label-caps text-[9px] tracking-wider text-on-surface-variant">
                  OVERDUE
                </span>
              </div>
              <span className={`font-data-display text-[13px] ${metrics.overdueCount > 0 ? 'text-error' : 'text-on-surface'}`}>
                {metrics.overdueCount}
              </span>
            </div>

            {/* Active tasks */}
            <div className="system-status-metric-row">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">pending_actions</span>
                <span className="font-label-caps text-[9px] tracking-wider text-on-surface-variant">
                  ACTIVE TASKS
                </span>
              </div>
              <span className="font-data-display text-[13px] text-on-surface">
                {metrics.activeTaskCount}
              </span>
            </div>
          </div>

          {/* Tip */}
          {level !== 'on_track' && (
            <div className="system-status-tip mt-4">
              <span className="material-symbols-outlined text-[12px]" style={{ opacity: 0.7 }}>lightbulb</span>
              <span className="font-body-md text-[11px] text-on-surface-variant leading-tight">
                {level === 'needs_focus'
                  ? 'Complete your habits and resolve overdue tasks to improve your score.'
                  : 'You have significant overdue items. Focus on clearing them to get back on track.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
