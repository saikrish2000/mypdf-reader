import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';

const GradientButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        'bg-gradient-to-r from-blue-500 to-violet-600 text-white border-0 shadow-md',
        'hover:from-blue-600 hover:to-violet-700 hover:opacity-95',
        'focus-visible:ring-violet-500',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  ),
);
GradientButton.displayName = 'GradientButton';

export default GradientButton;
