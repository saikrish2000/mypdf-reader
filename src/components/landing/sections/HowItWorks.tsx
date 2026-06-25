import { motion } from 'framer-motion';
import { Upload, BookOpen, Sparkles, Highlighter } from 'lucide-react';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import { howItWorksContent } from '@/lib/landing/content';
import { fadeUp, staggerContainer } from '@/lib/landing/motion';

const STEP_ICONS = [Upload, BookOpen, Sparkles, Highlighter];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-snap-section landing-snap-section--scroll">
      <div className="w-full py-4">
        <SectionHeader
          eyebrow={howItWorksContent.eyebrow}
          title={howItWorksContent.title}
          align="center"
        />
        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {howItWorksContent.steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <motion.li key={step.title} variants={fadeUp} className="relative">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-accent mb-4 border border-border">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono text-accent mb-1">0{i + 1}</span>
                  <h3 className="text-base font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
