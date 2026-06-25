import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignInPromptProps {
  title?: string;
  description?: string;
}

export default function SignInPrompt({
  title = 'Sign in to use AI',
  description = 'Create a free account to summarize, chat, and generate study materials from your PDFs.',
}: SignInPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
        <LogIn className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
      </div>
      <Button asChild size="sm" className="rounded-lg">
        <Link to="/auth">Sign in</Link>
      </Button>
    </div>
  );
}
