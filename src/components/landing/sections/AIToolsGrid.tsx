import { motion } from 'framer-motion';
import {
  Sparkles, MessageCircle, Highlighter, Volume2,
  Layers, HelpCircle, GitBranch, Languages,
} from 'lucide-react';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import GlowCard from '@/components/landing/ui/GlowCard';
import { aiToolsContent } from '@/lib/landing/content';
import { fadeUp, staggerContainer } from '@/lib/landing/motion';
import { cn } from '@/lib/utils';

const TOOLS = [
  { icon: Sparkles, label: 'Summarize', status: 'live' as const },
  { icon: MessageCircle, label: 'Chat', status: 'live' as const },
  { icon: Highlighter, label: 'Highlights', status: 'live' as const },
  { icon: Volume2, label: 'Read Aloud', status: 'live' as const },
  { icon: Layers, label: 'Flashcards', status: 'live' as const },
  { icon: HelpCircle, label: 'Quiz', status: 'live' as const },
  { icon: GitBranch, label: 'Mind Map', status: 'soon' as const },
  { icon: Languages, label: 'Translate', status: 'soon' as const },
];

export default function AIToolsGrid() {
  return (
    <section id="ai-tools" className="landing-snap-section landing-snap-section--scroll">
      <div className="w-full py-4">
        <SectionHeader
          eyebrow={aiToolsContent.eyebrow}
          title={aiToolsContent.title}
          description={aiToolsContent.description}
          align="center"
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {TOOLS.map(({ icon: Icon, label, status }) => (
            <motion.div key={label} variants={fadeUp}>
              <GlowCard className={cn('p-4 text-center', status === 'soon' && 'opacity-80')}>
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-accent/10 text-accent mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <span
                  className={cn(
                    'inline-block mt-2 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full',
                    status === 'live'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {status === 'live' ? 'Live' : 'Soon'}
                </span>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
