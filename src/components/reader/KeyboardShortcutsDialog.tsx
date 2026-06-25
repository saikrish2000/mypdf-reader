import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SHORTCUTS = [
  { keys: '← / →', action: 'Previous / next page' },
  { keys: 'Space', action: 'Next page' },
  { keys: 'Ctrl/Cmd + F', action: 'Search document' },
  { keys: 'Ctrl/Cmd + K', action: 'Command palette' },
  { keys: 'Ctrl/Cmd + B', action: 'Toggle bookmark' },
  { keys: '?', action: 'Show shortcuts' },
  { keys: 'Esc', action: 'Close panel or exit reader' },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map(({ keys, action }) => (
            <li key={keys} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{action}</span>
              <kbd className="text-xs font-mono bg-muted px-2 py-1 rounded border border-border shrink-0">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
