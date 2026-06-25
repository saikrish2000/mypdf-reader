import { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authGlass } from './authStyles';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  label: string;
}

export default function InputField({
  icon: Icon,
  label,
  type = 'text',
  className,
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={props.id} className="sr-only">
        {label}
      </label>
      <div className={cn(authGlass, 'flex items-center gap-3 rounded-xl px-4 py-0.5')}>
        <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        <input
          {...props}
          type={inputType}
          className={cn(
            'h-11 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500',
            'focus:outline-none',
            className,
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-slate-500 hover:text-slate-300 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
