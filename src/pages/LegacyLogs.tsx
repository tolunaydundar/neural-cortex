import { useHabits } from '../context/HabitContext';

export default function LegacyLogs() {
  const { logs, habits } = useHabits();
  
  return (
    <div className="flex-grow">
      <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim mb-8">Legacy Logs</h1>
      <div className="glass-panel p-4 lg:p-6">
        <div className="overflow-x-auto">
        <table className="w-full text-left font-body-md text-on-surface min-w-[400px]">
          <thead className="border-b border-white/10 font-label-caps text-on-surface-variant">
            <tr>
              <th className="pb-4">DATE</th>
              <th className="pb-4">HABIT</th>
              <th className="pb-4">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {[...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
              const habit = habits.find(h => h.id === log.habitId);
              return (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4 font-data-display">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="py-4 text-primary-fixed-dim">{habit?.title || 'Unknown'}</td>
                  <td className="py-4 text-primary-fixed-dim/70">COMPLETED</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
