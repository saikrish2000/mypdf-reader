import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageCircle,
  Sparkles,
  Bookmark,
  Volume2,
  Home,
  LogIn,
  GraduationCap,
  FileText,
  ListTree,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import type { AITab } from '@/components/reader/AISidePanel';

interface ReaderCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenSearch: () => void;
  onOpenOutline?: () => void;
  onOpenAI: (tab: AITab) => void;
  onToggleReadAloud: () => void;
  onToggleBookmark: () => void;
  isBookmarked: boolean;
  onGoHome?: () => void;
  isSignedIn: boolean;
}

export default function ReaderCommandPalette({
  open,
  onOpenChange,
  currentPage,
  totalPages,
  onPageChange,
  onOpenSearch,
  onOpenOutline,
  onOpenAI,
  onToggleReadAloud,
  onToggleBookmark,
  isBookmarked,
  onGoHome,
  isSignedIn,
}: ReaderCommandPaletteProps) {
  const navigate = useNavigate();
  const [pageInput, setPageInput] = useState('');

  useEffect(() => {
    if (!open) setPageInput('');
  }, [open]);

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  const goToPage = () => {
    const n = parseInt(pageInput, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      run(() => onPageChange(n));
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search actions or type a page number…"
        value={pageInput}
        onValueChange={setPageInput}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {pageInput && /^\d+$/.test(pageInput) && (
          <CommandGroup heading="Go to page">
            <CommandItem onSelect={goToPage}>
              <FileText className="mr-2 h-4 w-4" />
              Go to page {pageInput}
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(onOpenSearch)}>
            <Search className="mr-2 h-4 w-4" />
            Search document
          </CommandItem>
          {onOpenOutline && (
            <CommandItem onSelect={() => run(onOpenOutline)}>
              <ListTree className="mr-2 h-4 w-4" />
              Open document outline
            </CommandItem>
          )}
          {onGoHome && (
            <CommandItem onSelect={() => run(onGoHome)}>
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="AI">
          <CommandItem onSelect={() => run(() => onOpenAI('chat'))}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Open AI chat
          </CommandItem>
          <CommandItem onSelect={() => run(() => onOpenAI('summary'))}>
            <Sparkles className="mr-2 h-4 w-4" />
            Open AI summary
          </CommandItem>
          <CommandItem onSelect={() => run(() => onOpenAI('study'))}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Open study tools
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Reading">
          <CommandItem onSelect={() => run(onToggleReadAloud)}>
            <Volume2 className="mr-2 h-4 w-4" />
            Toggle read aloud
          </CommandItem>
          <CommandItem onSelect={() => run(onToggleBookmark)}>
            <Bookmark className="mr-2 h-4 w-4" />
            {isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          </CommandItem>
        </CommandGroup>
        {!isSignedIn && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem onSelect={() => run(() => navigate('/auth'))}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in for AI
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
