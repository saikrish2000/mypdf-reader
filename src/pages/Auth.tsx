import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

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

  // Show nothing while session is resolving to prevent auth form flash
  if (loading) return null;

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
          Sync your highlights & notes across devices.
        </p>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-toolbar text-toolbar-foreground hover:opacity-90 transition mb-4 font-medium"
        >
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border focus:border-accent outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition"
          >
            {busy ? '...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
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
      </div>
    </div>
  );
};

export default Auth;
