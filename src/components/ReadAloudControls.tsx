import React from 'react';
import { Volume2, VolumeX, Settings2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SpeechSettings } from '@/hooks/useSpeech';

interface Props {
  isReading: boolean;
  onToggleRead: () => void;
  voices: SpeechSynthesisVoice[];
  settings: SpeechSettings;
  onSettingsChange: (next: Partial<SpeechSettings>) => void;
  continuous: boolean;
  onContinuousChange: (value: boolean) => void;
  unsupported?: boolean;
}

const SPEED_OPTIONS = [0.75, 1, 1.5, 2];

const ReadAloudControls: React.FC<Props> = ({
  isReading,
  onToggleRead,
  voices,
  settings,
  onSettingsChange,
  continuous,
  onContinuousChange,
  unsupported = false,
}) => {
  const voiceValue = settings.voiceURI ?? 'auto';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onToggleRead}
        disabled={unsupported}
        className={cn(
          'p-2 rounded-lg transition-colors hover:bg-toolbar-foreground/10',
          isReading && 'bg-accent/20',
          unsupported && 'opacity-40 cursor-not-allowed'
        )}
        title={unsupported ? 'Read aloud is not supported in this browser.' : isReading ? 'Stop reading' : 'Read page aloud'}
        aria-label={unsupported ? 'Read aloud is not supported in this browser.' : isReading ? 'Stop reading' : 'Read page aloud'}
      >
        {isReading ? (
          <VolumeX className="w-4 h-4 text-accent" />
        ) : (
          <Volume2 className="w-4 h-4 text-toolbar-foreground" />
        )}
      </button>

      {/* ponytail: DropdownMenu not Popover+Select — nested Radix Poppers loop in the toolbar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-2 rounded-lg transition-colors hover:bg-toolbar-foreground/10"
            title="Voice settings"
            aria-label="Voice settings"
          >
            <Settings2 className="w-4 h-4 text-toolbar-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-xs font-medium">Voice</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-sm">
              {voiceValue === 'auto'
                ? 'Auto (default)'
                : voices.find(v => v.voiceURI === voiceValue)?.name ?? 'Select voice'}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
              <DropdownMenuRadioGroup
                value={voiceValue}
                onValueChange={value =>
                  onSettingsChange({ voiceURI: value === 'auto' ? null : value })
                }
              >
                <DropdownMenuRadioItem value="auto">Auto (default)</DropdownMenuRadioItem>
                {voices.map(v => (
                  <DropdownMenuRadioItem key={v.voiceURI} value={v.voiceURI}>
                    {v.name} — {v.lang}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {voices.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading voices…
                </p>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-medium">Speed</DropdownMenuLabel>
          <div className="grid grid-cols-4 gap-1 px-2 pb-2">
            {SPEED_OPTIONS.map(rate => (
              <button
                key={rate}
                type="button"
                onClick={() => onSettingsChange({ rate })}
                className={cn(
                  'py-1.5 text-sm rounded-md border transition-colors',
                  settings.rate === rate
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'border-border hover:bg-secondary'
                )}
              >
                {rate}x
              </button>
            ))}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={continuous}
            onCheckedChange={onContinuousChange}
            onSelect={(e) => e.preventDefault()}
          >
            Auto-advance pages
          </DropdownMenuCheckboxItem>
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            When enabled, the reader turns the page and continues reading automatically.
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ReadAloudControls;
