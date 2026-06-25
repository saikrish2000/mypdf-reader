import { motion } from 'framer-motion';
import { BookOpen, ScrollText, Sparkles, MessageCircle, Highlighter, Volume2, TrendingUp } from 'lucide-react';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import GlowCard from '@/components/landing/ui/GlowCard';
import { featuresContent } from '@/lib/landing/content';
import { fadeUp, staggerContainer } from '@/lib/landing/motion';

const FEATURES = [
  { icon: ScrollText, title: 'Scroll & flip modes', description: 'Read your way — continuous scroll or realistic page flip.' },
  { icon: BookOpen, title: 'Bookshelf library', description: 'Covers, progress, and recent files in one place.' },
  { icon: Sparkles, title: 'AI summaries', description: 'Page-level summaries in one click when signed in.' },
  { icon: MessageCircle, title: 'Contextual chat', description: 'Ask questions about the page you are reading.' },
  { icon: Highlighter, title: 'Highlights & notes', description: 'Select text, highlight, and sync when signed in.' },
  { icon: Volume2, title: 'Read aloud', description: 'Natural text-to-speech with speed and voice controls.' },
  { icon: TrendingUp, title: 'Reading stats', description: 'Track time, streaks, and pages visited per document.' },
] as const;

export default function FeaturesGrid() {
  return (
    <section id="features" className="landing-section-gap scroll-mt-20">
      <SectionHeader
        eyebrow={featuresContent.eyebrow}
        title={featuresContent.title}
        description={featuresContent.description}
        align="center"
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <motion.div key={title} variants={fadeUp}>
            <GlowCard className="p-5 h-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </GlowCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
