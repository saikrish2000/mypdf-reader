import React from 'react';
import { Volume2, VolumeX, Settings2, Repeat } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
}) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleRead}
        className={cn(
          'p-2 rounded-lg transition-colors hover:bg-toolbar-foreground/10',
          isReading && 'bg-accent/20'
        )}
        title={isReading ? 'Stop reading' : 'Read page aloud'}
      >
        {isReading ? (
          <VolumeX className="w-4 h-4 text-accent" />
        ) : (
          <Volume2 className="w-4 h-4 text-toolbar-foreground" />
        )}
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-2 rounded-lg transition-colors hover:bg-toolbar-foreground/10"
            title="Voice settings"
          >
            <Settings2 className="w-4 h-4 text-toolbar-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Voice</Label>
            <Select
              value={settings.voiceURI ?? 'auto'}
              onValueChange={value =>
                onSettingsChange({ voiceURI: value === 'auto' ? null : value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="auto">Auto (default)</SelectItem>
                {voices.map(v => (
                  <SelectItem key={v.voiceURI} value={v.voiceURI}>
                    {v.name} — {v.lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {voices.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Loading voices… (your browser may take a moment)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Speed</Label>
            <div className="grid grid-cols-4 gap-1">
              {SPEED_OPTIONS.map(rate => (
                <button
                  key={rate}
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
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="continuous" className="text-sm cursor-pointer">
                Auto-advance pages
              </Label>
            </div>
            <Switch
              id="continuous"
              checked={continuous}
              onCheckedChange={onContinuousChange}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, the reader will turn the page and continue reading automatically.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ReadAloudControls;
