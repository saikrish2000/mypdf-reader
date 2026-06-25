import {

  Sparkles,

  MessageCircle,

  Highlighter,

  Layers,

  HelpCircle,

  GitBranch,

  Languages,

  Volume2,

} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { Theme } from '@/hooks/useTheme';



const LIVE_FEATURES = [

  { icon: Sparkles, label: 'Summarize', title: 'AI page summaries while you read' },

  { icon: MessageCircle, label: 'Chat', title: 'Ask questions about the current page' },

  { icon: Highlighter, label: 'Highlights', title: 'Save highlights and notes when signed in' },

  { icon: Volume2, label: 'Read Aloud', title: 'Listen with text-to-speech' },

  { icon: Layers, label: 'Flashcards', title: 'AI-generated study cards from any page' },

  { icon: HelpCircle, label: 'Quiz', title: 'Multiple-choice quizzes from your PDF' },

] as const;



const SOON_FEATURES = [

  { icon: GitBranch, label: 'Mind Map', title: 'Visualize document structure — coming soon' },

  { icon: Languages, label: 'Translate', title: 'Multi-language support — coming soon' },

] as const;



interface HeroFeatureChipsProps {

  theme: Theme;

}



export default function HeroFeatureChips({ theme }: HeroFeatureChipsProps) {

  const isContrast = theme === 'contrast';



  const chipClass = (soon?: boolean) =>

    cn(

      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-default',

      isContrast

        ? 'border border-foreground bg-background text-foreground'

        : soon
          ? 'border border-border bg-muted/30 text-muted-foreground'

          : 'border border-violet-500/20 bg-violet-500/10 text-violet-300',

    );



  return (

    <div

      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible"

      role="list"

      aria-label="AI reading features"

    >

      {LIVE_FEATURES.map(({ icon: Icon, label, title }) => (

        <span key={label} role="listitem" title={title} className={chipClass()}>

          <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />

          {label}

        </span>

      ))}

      {SOON_FEATURES.map(({ icon: Icon, label, title }) => (
        <span key={label} role="listitem" title={title} className={cn(chipClass(true), 'hidden sm:inline-flex')}>
          <Icon className="h-3.5 w-3.5 opacity-50" aria-hidden />
          {label}
          <span className="text-[10px] uppercase tracking-wide opacity-60">Soon</span>
        </span>
      ))}
      <span className={cn(chipClass(true), 'sm:hidden')} role="listitem">
        +{SOON_FEATURES.length} more coming soon
      </span>

    </div>

  );

}


