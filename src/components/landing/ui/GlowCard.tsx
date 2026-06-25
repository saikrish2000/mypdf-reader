import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowCardProps extends HTMLMotionProps<'div'> {
  glow?: boolean;
}

export default function GlowCard({ className, glow, children, ...props }: GlowCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-border bg-card/50 backdrop-blur-sm',
        glow && 'glow-accent',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
