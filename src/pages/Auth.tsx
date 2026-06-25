import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard, { type AuthMode } from '@/components/auth/AuthCard';

function formatAuthError(error: { message: string }): string {
  const msg = error.message;
  if (msg.includes('missing OAuth secret')) {
    return 'Google sign-in is not fully configured. Check Supabase Google provider settings.';
  }
  if (msg.includes('provider is not enabled')) {
    return 'Google sign-in is not configured. Please use email sign-up or contact support.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return 'Email not yet confirmed. Please check your inbox or request a new confirmation link.';
  }
  return msg;
}

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate('/library', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success('Password reset link sent. Check your email.');
        setMode('signin');
        return;
      }
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/library` },
        });
        if (error) throw error;
        setSignedUp(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setUnconfirmedEmail(email);
          }
          throw error;
        }
        navigate('/library', { replace: true });
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? formatAuthError(err as { message: string })
        : 'Authentication failed';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleResendConfirmation = async () => {
    setBusy(true);
    const targetEmail = unconfirmedEmail || email;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: { emailRedirectTo: `${window.location.origin}/library` },
      });
      if (error) throw error;
      toast.success('Confirmation email resent. Please check your inbox.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend confirmation email');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/library`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      toast.error(formatAuthError(error));
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        mode={mode}
        email={email}
        password={password}
        busy={busy}
        loading={loading}
        rememberMe={rememberMe}
        signedUp={signedUp}
        unconfirmedEmail={unconfirmedEmail}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onRememberMeChange={setRememberMe}
        onSubmit={handleSubmit}
        onGoogle={handleGoogle}
        onModeChange={setMode}
        onResendConfirmation={handleResendConfirmation}
        onBackToSignIn={() => {
          setSignedUp(false);
          setMode('signin');
          setUnconfirmedEmail(null);
        }}
        onClearUnconfirmed={() => setUnconfirmedEmail(null)}
      />
    </AuthLayout>
  );
};

export default Auth;
