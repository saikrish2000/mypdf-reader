import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/landing/motion';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'left' | 'center';
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = 'left',
}: SectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className={cn(
        'mb-10 sm:mb-12',
        align === 'center' && 'text-center mx-auto max-w-2xl',
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className={cn(
          'mt-3 text-base sm:text-lg text-muted-foreground',
          align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-3xl',
        )}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
