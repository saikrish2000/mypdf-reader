import { motion } from 'framer-motion';
import { BookOpen, Mail, Lock, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import GoogleButton from './GoogleButton';
import InputField from './InputField';
import GradientButton from './GradientButton';
import { authGlass, authMuted, authGradientBg } from './authStyles';
import { cn } from '@/lib/utils';

export type AuthMode = 'signin' | 'signup' | 'forgot';

export interface AuthCardProps {
  mode: AuthMode;
  email: string;
  password: string;
  busy: boolean;
  loading: boolean;
  rememberMe: boolean;
  signedUp: boolean;
  unconfirmedEmail: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  onModeChange: (mode: AuthMode) => void;
  onResendConfirmation: () => void;
  onBackToSignIn: () => void;
  onClearUnconfirmed: () => void;
}

const HEADLINES: Record<AuthMode, string> = {
  signin: 'Welcome back',
  signup: 'Create account',
  forgot: 'Reset password',
};

const SUBHEADS: Record<AuthMode, string> = {
  signin: 'Sign in to continue to your account',
  signup: 'Start syncing your study library today',
  forgot: 'We will email you a reset link',
};

export default function AuthCard(props: AuthCardProps) {
  const {
    mode,
    email,
    password,
    busy,
    loading,
    rememberMe,
    signedUp,
    unconfirmedEmail,
    onEmailChange,
    onPasswordChange,
    onRememberMeChange,
    onSubmit,
    onGoogle,
    onModeChange,
    onResendConfirmation,
    onBackToSignIn,
    onClearUnconfirmed,
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        authGlass,
        'w-full max-w-[470px] rounded-[32px] p-6 sm:p-8',
        'shadow-[0_32px_120px_rgba(0,0,0,0.65)]',
      )}
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <motion.div
          animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 36px rgba(99,102,241,0.5)', '0 0 20px rgba(139,92,246,0.3)'] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 ring-2 ring-violet-500/30"
        >
          <BookOpen className="h-5 w-5 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {signedUp ? 'Check your email' : unconfirmedEmail ? 'Email not confirmed' : HEADLINES[mode]}
        </h2>
        <p className={cn('mt-2 text-[15px]', authMuted)}>
          {signedUp
            ? 'Confirm your address to finish signing up'
            : unconfirmedEmail
              ? 'Confirm your email before signing in'
              : SUBHEADS[mode]}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : signedUp ? (
        <AlternateState
          busy={busy}
          onResend={onResendConfirmation}
          onBack={onBackToSignIn}
          email={email}
          variant="signedUp"
        />
      ) : unconfirmedEmail ? (
        <AlternateState
          busy={busy}
          onResend={onResendConfirmation}
          onBack={onClearUnconfirmed}
          email={unconfirmedEmail}
          variant="unconfirmed"
        />
      ) : (
        <>
          {mode !== 'forgot' && (
            <>
              <GoogleButton onClick={onGoogle} busy={busy} disabled={busy} />
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className={cn('bg-transparent px-3', authMuted)}>or</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <InputField
              id="auth-email"
              icon={Mail}
              label="Email"
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              autoComplete="email"
            />
            {mode !== 'forgot' && (
              <InputField
                id="auth-password"
                icon={Lock}
                label="Password"
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            )}

            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(v) => onRememberMeChange(v === true)}
                    className="border-white/20 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => onModeChange('forgot')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <GradientButton loading={busy} disabled={busy} className="mt-2">
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Send reset link'}
            </GradientButton>
          </form>

          <p className={cn('mt-6 text-center text-[15px]', authMuted)}>
            {mode === 'signin' && (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => onModeChange('signup')}
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Create one
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Have an account?{' '}
                <button
                  type="button"
                  onClick={() => onModeChange('signin')}
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => onModeChange('signin')}
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Back to sign in
              </button>
            )}
          </p>
        </>
      )}

      <p className="mt-6 text-center">
        <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Back to home
        </Link>
      </p>
    </motion.div>
  );
}

function AlternateState({
  busy,
  onResend,
  onBack,
  email,
  variant,
}: {
  busy: boolean;
  onResend: () => void;
  onBack: () => void;
  email: string;
  variant: 'signedUp' | 'unconfirmed';
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05]">
        <Mail className="h-5 w-5 text-violet-300" />
      </div>
      <p className={cn('text-sm', authMuted)}>
        {variant === 'signedUp' ? 'We sent a link to' : 'Confirm'}{' '}
        <strong className="text-white">{email}</strong>
        {variant === 'unconfirmed' && ' before signing in.'}
      </p>
      <button
        type="button"
        onClick={onResend}
        disabled={busy}
        className={cn(
          authGradientBg,
          'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white',
          'shadow-[0_8px_32px_rgba(99,102,241,0.45)] disabled:opacity-50',
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Resend confirmation
      </button>
      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </button>
    </div>
  );
}
