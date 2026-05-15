import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error('Google sign-in failed: ' + error.message);
      setBusy(false);
    }
    // On success Supabase redirects the browser — no navigate() needed
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md pdf-paper rounded-2xl p-8 shadow-elegant animate-fade-in">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mx-auto mb-4">
          <BookOpen className="w-7 h-7 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Sync your highlights &amp; notes across devices.
        </p>

        {/* Show spinner while auth state is resolving */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-toolbar text-toolbar-foreground hover:opacity-90 transition mb-4 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-accent outline-none"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-accent outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-accent hover:underline"
              >
                {mode === 'signin' ? 'Create account' : 'Have an account? Sign in'}
              </button>
              <Link to="/" className="text-muted-foreground hover:underline">Back</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
