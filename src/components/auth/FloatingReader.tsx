import { motion } from 'framer-motion';
import { LayoutGrid, FileText, Bookmark, Settings } from 'lucide-react';
import RecentFiles from './RecentFiles';
import { authGlass } from './authStyles';
import { cn } from '@/lib/utils';

const NAV = [
  { Icon: LayoutGrid, active: true },
  { Icon: FileText, active: false },
  { Icon: Bookmark, active: false },
  { Icon: Settings, active: false },
] as const;

export default function FloatingReader() {
  return (
    <motion.div
      className={cn(
        authGlass,
        'relative z-10 w-full max-w-[300px] overflow-hidden rounded-2xl p-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] xl:max-w-[340px]',
      )}
      style={{ rotate: '10deg' }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="flex gap-2">
        <div className="flex w-10 shrink-0 flex-col items-center gap-3 rounded-lg bg-white/[0.04] py-3">
          {NAV.map(({ Icon, active }, i) => (
            <div
              key={i}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                active ? 'bg-violet-500/30 text-violet-300' : 'text-slate-500',
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 rounded-lg bg-[#0B1028]/80 p-3">
          <RecentFiles />
        </div>
      </div>
    </motion.div>
  );
}
