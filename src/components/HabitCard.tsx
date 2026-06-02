import { Link } from 'react-router-dom';

interface HabitCardProps {
  id: string;
  title: string;
  streak: number;
  icon: string;
  efficiency: number;
  pattern: boolean[];
}

export default function HabitCard({ id, title, streak, icon, efficiency, pattern }: HabitCardProps) {
  return (
    <Link to={`/habit/${id}`} className="bg-on-surface/5 p-5 lg:p-7 rounded-md border border-on-surface/5 hover:border-on-surface/20 hover:bg-on-surface/10 group transition-all duration-300 block">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-fixed-dim transition-colors">{title}</h3>
          <p className="font-label-caps text-[10px] text-on-surface-variant">CURRENT STREAK: {streak.toString().padStart(2, '0')} DAYS</p>
        </div>
        <span className="material-symbols-outlined text-primary-fixed-dim/40 group-hover:text-primary-fixed-dim transition-colors">{icon}</span>
      </div>
      
      {/* Habit Grid */}
      <div className="flex flex-wrap gap-[6px]">
        {pattern.map((active, i) => (
          <div key={i} className={`habit-cell ${active ? 'active' : 'inactive'}`}></div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-[10px] font-label-caps text-on-surface-variant">EFFICIENCY: {efficiency}%</span>
        <button className="font-label-caps text-[10px] text-primary-fixed-dim hover:underline cursor-pointer">VIEW LOGS</button>
      </div>
    </Link>
  );
}
