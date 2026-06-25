import { motion } from 'framer-motion';
import { CloudUpload, Bookmark, StickyNote } from 'lucide-react';
import { authGlass } from './authStyles';
import { cn } from '@/lib/utils';

const ORBITS = [
  { Icon: CloudUpload, angle: 0, radius: 140, delay: 0 },
  { Icon: Bookmark, angle: 120, radius: 155, delay: 0.3 },
  { Icon: StickyNote, angle: 240, radius: 130, delay: 0.6 },
] as const;

export default function OrbitalIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <svg className="absolute h-[280px] w-[280px] opacity-30 xl:h-[320px] xl:w-[320px]" viewBox="0 0 340 340">
        <motion.ellipse
          cx="170"
          cy="170"
          rx="155"
          ry="95"
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1"
          strokeDasharray="4 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '170px 170px' }}
        />
        <defs>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {ORBITS.map(({ Icon, angle, radius, delay }, i) => (
        <motion.div
          key={i}
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: 24 + i * 4, repeat: Infinity, ease: 'linear', delay }}
          style={{ width: radius * 2, height: radius * 2 }}
        >
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{ transform: `rotate(${angle}deg) translateY(-${radius}px)` }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div
              className={cn(
                authGlass,
                'flex h-11 w-11 items-center justify-center rounded-xl shadow-[0_0_24px_rgba(139,92,246,0.35)]',
              )}
            >
              <Icon className="h-5 w-5 text-violet-300" />
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
