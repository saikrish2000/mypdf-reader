import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { authGradientBg } from './authStyles';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function GradientButton({
  children,
  className,
  loading,
  disabled,
  type = 'submit',
  ...props
}: GradientButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={cn(
        authGradientBg,
        'relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold text-white',
        'shadow-[0_8px_32px_rgba(99,102,241,0.45)]',
        'transition-shadow hover:shadow-[0_12px_40px_rgba(139,92,246,0.55)]',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
        className,
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
}
