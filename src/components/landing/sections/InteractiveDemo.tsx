import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Highlighter, StickyNote, Layers, Sparkles, ArrowRight, Library } from 'lucide-react';
import GlowCard from '@/components/landing/ui/GlowCard';
import GradientButton from '@/components/landing/ui/GradientButton';
import DemoWorkspace from './DemoWorkspace';
import { demoContent, aiToolsContent } from '@/lib/landing/content';
import { fadeUp, staggerContainer } from '@/lib/landing/motion';
import { Button } from '@/components/ui/button';
import { handleSectionNavClick } from '@/lib/landing/scrollToSection';

const FEATURES = [
  { icon: MessageSquare, label: 'Ask questions in context' },
  { icon: Sparkles, label: 'Summaries on every page' },
  { icon: Highlighter, label: 'Highlights that stick' },
  { icon: StickyNote, label: 'Notes tied to pages' },
  { icon: Layers, label: 'Flashcards from your PDF' },
] as const;

export default function InteractiveDemo() {
  return (
    <section id="demo" className="landing-snap-section landing-snap-section--scroll">
      <div className="w-full py-4">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-14 items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="min-w-0 order-2 lg:order-none"
        >
          <motion.p variants={fadeUp} className="mb-3 text-xs font-medium uppercase tracking-widest text-accent">
            {demoContent.eyebrow}
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            {demoContent.title}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg">
            {demoContent.description}
          </motion.p>

          <motion.ul variants={fadeUp} className="mt-6 space-y-2 lg:mt-8 lg:space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-foreground/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </motion.ul>
          <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground">
            {aiToolsContent.description}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3">
            <GradientButton asChild size="lg">
              <Link to="/library">
                <Library className="h-4 w-4 mr-2" />
                {demoContent.libraryCta}
              </Link>
            </GradientButton>
            <Button asChild size="lg" variant="outline" className="rounded-xl border-border">
              <a href="#upload" onClick={(e) => handleSectionNavClick(e, '#upload')}>
                {demoContent.uploadCta}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="min-w-0 order-1 lg:order-none"
        >
          <GlowCard glow className="p-1 sm:p-2">
            <DemoWorkspace />
          </GlowCard>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {demoContent.demoHint}
          </p>
        </motion.div>
      </div>
      </div>
    </section>
  );
}
