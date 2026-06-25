import { motion } from 'framer-motion';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import GlowCard from '@/components/landing/ui/GlowCard';
import { testimonialsContent } from '@/lib/landing/content';
import { fadeUp, staggerContainer } from '@/lib/landing/motion';

export default function Testimonials() {
  return (
    <section className="landing-section-gap">
      <SectionHeader
        eyebrow={testimonialsContent.eyebrow}
        title={testimonialsContent.title}
        align="center"
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="grid md:grid-cols-3 gap-6"
      >
        {testimonialsContent.items.map((item) => (
          <motion.div key={item.name} variants={fadeUp}>
            <GlowCard className="p-6 h-full flex flex-col">
              <p className="text-sm text-foreground/90 flex-1 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
