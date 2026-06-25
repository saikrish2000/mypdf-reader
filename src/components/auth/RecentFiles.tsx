import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILES = [
  { title: 'Quantum Mechanics', pages: 10, color: 'from-rose-500 to-orange-500' },
  { title: 'Machine Learning Basics', pages: 24, color: 'from-amber-400 to-yellow-500' },
  { title: 'Organic Chemistry', pages: 18, color: 'from-emerald-400 to-teal-500' },
  { title: 'World History Vol. II', pages: 32, color: 'from-blue-400 to-cyan-500' },
] as const;

export default function RecentFiles() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Recent Files
      </p>
      <div className="space-y-2 overflow-hidden">
        {FILES.map((file) => (
          <div
            key={file.title}
            className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br shadow-sm',
                file.color,
              )}
            >
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{file.title}</p>
              <p className="text-[10px] text-slate-500">{file.pages} pages</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
