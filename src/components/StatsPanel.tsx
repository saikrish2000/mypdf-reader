import React from 'react';
import { X, Flame, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReadingStats } from '@/hooks/useReadingStats';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ isOpen, onClose }) => {
  // pass null — read-only view
  const { current, longest, todaySeconds, last30, totalSeconds, topDocs } = useReadingStats(null);

  if (!isOpen) return null;

  const maxDay = Math.max(60, ...last30.map((d) => d.seconds));

  return (
    <>
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
      />
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl',
          'flex flex-col animate-fade-in',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold">Reading Stats</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
            aria-label="Close stats"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Top KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted p-3 text-center">
              <Clock className="w-4 h-4 mx-auto text-accent mb-1" />
              <div className="text-lg font-bold text-foreground">{formatTime(todaySeconds)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Today</div>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" />
              <div className="text-lg font-bold text-foreground">{current}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Streak</div>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <BookOpen className="w-4 h-4 mx-auto text-accent mb-1" />
              <div className="text-lg font-bold text-foreground">{longest}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Longest</div>
            </div>
          </div>

          {/* 30-day heatmap */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Last 30 days</h4>
            <div className="grid grid-cols-10 gap-1">
              {last30.map((d) => {
                const intensity = d.seconds === 0 ? 0 : Math.min(1, d.seconds / maxDay);
                const opacity = d.seconds === 0 ? 0.1 : 0.25 + intensity * 0.75;
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${formatTime(d.seconds)}`}
                    className="aspect-square rounded-sm bg-accent"
                    style={{ opacity }}
                  />
                );
              })}
            </div>
          </div>

          {/* Total time */}
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs text-muted-foreground">Total reading time</div>
            <div className="text-2xl font-bold text-foreground mt-0.5">{formatTime(totalSeconds)}</div>
          </div>

          {/* Top documents */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Most read</h4>
            {topDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reading recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {topDocs.map((d) => {
                  const pct = totalSeconds > 0 ? (d.totalSeconds / totalSeconds) * 100 : 0;
                  return (
                    <li key={d.fileName} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-foreground truncate flex-1">{d.fileName}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(d.totalSeconds)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StatsPanel;
