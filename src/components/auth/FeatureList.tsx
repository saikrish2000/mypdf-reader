import { motion } from 'framer-motion';
import { Cloud, Shield, Zap } from 'lucide-react';
import { authGlass, authGlassHover } from './authStyles';
import { cn } from '@/lib/utils';

const FEATURES = [
  { Icon: Cloud, title: 'Cloud Sync', desc: 'Access anywhere' },
  { Icon: Shield, title: 'Secure Storage', desc: 'Encrypted data' },
  { Icon: Zap, title: 'Lightning Fast', desc: 'Instant loading' },
] as const;

export default function FeatureList() {
  return (
    <div className="flex flex-col gap-2">
      {FEATURES.map(({ Icon, title, desc }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          whileHover={{ x: 4, scale: 1.02 }}
          className={cn(authGlass, authGlassHover, 'flex items-center gap-2.5 rounded-xl px-3 py-2.5')}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-white/[0.08]">
            <Icon className="h-4 w-4 text-violet-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
