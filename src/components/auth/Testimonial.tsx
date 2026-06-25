import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { authGlass } from './authStyles';
import { cn } from '@/lib/utils';

const AVATARS = ['SK', 'AM', 'JL'] as const;

export default function Testimonial() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className={cn(authGlass, 'flex items-center gap-4 rounded-2xl px-5 py-4')}
    >
      <div className="flex -space-x-2">
        {AVATARS.map((initials, i) => (
          <div
            key={initials}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#070B1F] text-[10px] font-semibold text-white',
              i === 0 && 'bg-gradient-to-br from-blue-500 to-violet-600',
              i === 1 && 'bg-gradient-to-br from-emerald-500 to-teal-600',
              i === 2 && 'bg-gradient-to-br from-amber-500 to-orange-600',
            )}
          >
            {initials}
          </div>
        ))}
      </div>
      <div>
        <div className="flex gap-0.5 mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-sm text-slate-300">
          Loved by <span className="font-semibold text-white">50,000+</span> students
        </p>
      </div>
    </motion.div>
  );
}
