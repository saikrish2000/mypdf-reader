import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  Shield,
  LogOut,
  Library,
  Upload,
  LogIn,
  Sparkles,
  Layers,
  CreditCard,
} from 'lucide-react';
import { useScroll } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import ThemeToggle from './ThemeToggle';
import GradientButton from '@/components/landing/ui/GradientButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityAlert } from '@/hooks/useSecurityAlert';
import { navLinks } from '@/lib/landing/content';
import { handleSectionNavClick, scrollToSection } from '@/lib/landing/scrollToSection';

type NavbarVariant = 'landing' | 'marketing' | 'library';

interface NavbarProps {
  variant?: NavbarVariant;
  onStatsClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onUploadClick?: () => void;
}

const iconBtnClass =
  'p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors';

const Navbar: React.FC<NavbarProps> = ({
  variant = 'landing',
  onStatsClick,
  searchQuery = '',
  onSearchChange,
  onUploadClick,
}) => {
  const isLibrary = variant === 'library';
  const isMarketing = variant === 'marketing' || variant === 'landing';
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { hasHighSeverity } = useSecurityAlert();
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    return scrollY.on('change', (y) => setScrolled(y > 8));
  }, [scrollY]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isMarketing && (e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMarketing]);

  const runCommand = (action: () => void) => {
    setCommandOpen(false);
    action();
  };

  return (
    <>
      <header className={cn('sticky top-0 z-50 w-full glass transition-shadow', scrolled && 'glass-scrolled')}>
        <div className={isMarketing ? 'landing-shell' : 'page-shell'}>
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-bold tracking-tighter shadow-sm">
                  μP
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground tracking-tight">
                    mypdf<span className="text-accent font-medium">.reader</span>
                  </span>
                  {isMarketing && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-accent/10 text-accent rounded border border-accent/20">
                      AI
                    </span>
                  )}
                </div>
              </Link>

              {isMarketing && (
                <nav className="hidden lg:flex items-center gap-1 ml-2" aria-label="Main">
                  {navLinks.map(({ label, href }) => (
                    <a
                      key={`${label}-${href}`}
                      href={href}
                      onClick={(e) => location.pathname === '/' && handleSectionNavClick(e, href)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                </nav>
              )}

              {!isLibrary && !isMarketing && (
                <Link
                  to="/library"
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                    location.pathname === '/library'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <Library className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Study Library</span>
                </Link>
              )}
            </div>

            {isLibrary && (
              <div className="hidden md:flex flex-1 max-w-sm mx-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search study materials…"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-border text-sm"
                />
              </div>
            )}

            {isMarketing && (
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex flex-1 max-w-xs mx-4 items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Search…</span>
                <kbd className="hidden sm:inline text-[10px] font-mono bg-background/80 border border-border rounded px-1.5 py-0.5">
                  ⌘K
                </kbd>
              </button>
            )}

            <div className="flex items-center gap-0.5">
              {isMarketing && (
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className={cn(iconBtnClass, 'md:hidden')}
                  aria-label="Open command menu"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}

              {isLibrary && (
                <button
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  className={cn(iconBtnClass, 'md:hidden')}
                  aria-label="Toggle search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}

              {isLibrary && onStatsClick && (
                <button
                  onClick={onStatsClick}
                  className={iconBtnClass}
                  title="Reading stats"
                  aria-label="Reading stats"
                >
                  <TrendingUp className="w-4 h-4" />
                </button>
              )}

              {!isMarketing && (
                <Link
                  to="/security"
                  title="Security"
                  aria-label="Security findings"
                  className={cn(iconBtnClass, 'relative')}
                >
                  <Shield className="w-4 h-4" />
                  {user && hasHighSeverity && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
                  )}
                </Link>
              )}

              <ThemeToggle theme={theme} onToggle={toggleTheme} onSelect={setTheme} />

              {user ? (
                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-border">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                      {user.email?.charAt(0)?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => signOut()}
                    title="Sign out"
                    aria-label="Sign out"
                    className={iconBtnClass}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : isMarketing ? (
                <div className="flex items-center gap-2 ml-2">
                  <Button asChild size="sm" variant="ghost" className="h-8 px-3 text-xs hidden sm:inline-flex">
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <GradientButton
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      if (onUploadClick) {
                        onUploadClick();
                      } else {
                        document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    Get started
                  </GradientButton>
                </div>
              ) : (
                <Link to="/auth" className="ml-2">
                  <Button size="sm" variant="default" className="h-8 px-3 text-xs">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {isLibrary && mobileSearchOpen && (
            <div className="md:hidden pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search study materials…"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-border text-sm"
                  autoFocus
                />
              </div>
            </div>
          )}

          {isMarketing && (
            <nav
              className="lg:hidden flex gap-2 overflow-x-auto scrollbar-none py-2 -mx-1 px-1 border-t border-border"
              aria-label="Section navigation"
            >
              {navLinks.map(({ label, href }) => (
                <a
                  key={`mobile-${label}-${href}`}
                  href={href}
                  onClick={(e) => location.pathname === '/' && handleSectionNavClick(e, href)}
                  className="inline-flex shrink-0 items-center min-h-[44px] px-3.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      {isMarketing && (
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Search actions…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Quick actions">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    if (onUploadClick) onUploadClick();
                    else scrollToSection('upload');
                  })
                }
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/library'))}>
                <Library className="mr-2 h-4 w-4" />
                Go to Library
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => scrollToSection('demo'))}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                View Demo
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => scrollToSection('features'))}
              >
                <Layers className="mr-2 h-4 w-4" />
                View Features
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => scrollToSection('pricing'))}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                View Pricing
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
              {!user && (
                <CommandItem onSelect={() => runCommand(() => navigate('/auth'))}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
};

export default Navbar;
