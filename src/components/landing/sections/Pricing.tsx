import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import GlowCard from '@/components/landing/ui/GlowCard';
import GradientButton from '@/components/landing/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { pricingContent } from '@/lib/landing/content';
import { fadeUp, staggerContainer } from '@/lib/landing/motion';
import { handleSectionNavClick } from '@/lib/landing/scrollToSection';
import { cn } from '@/lib/utils';

export default function Pricing() {
  return (
    <section id="pricing" className="landing-snap-section landing-snap-section--scroll">
      <div className="w-full py-4">
        <SectionHeader
          eyebrow={pricingContent.eyebrow}
          title={pricingContent.title}
          description={pricingContent.description}
          align="center"
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {pricingContent.tiers.map((tier) => (
            <motion.div key={tier.name} variants={fadeUp}>
              <GlowCard
                glow={tier.highlighted}
                className={cn(
                  'p-6 h-full flex flex-col',
                  tier.highlighted && 'border-accent/40',
                )}
              >
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  {tier.period && (
                    <span className="text-sm text-muted-foreground ml-1">{tier.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex-1 mb-6">{tier.description}</p>
                {tier.highlighted ? (
                  <GradientButton asChild className="w-full">
                    {tier.ctaHref.startsWith('/') ? (
                      <Link to={tier.ctaHref}>{tier.cta}</Link>
                    ) : (
                      <a href={tier.ctaHref} onClick={(e) => handleSectionNavClick(e, tier.ctaHref)}>
                        {tier.cta}
                      </a>
                    )}
                  </GradientButton>
                ) : (
                  <Button asChild variant="outline" className="w-full rounded-xl border-border">
                    {tier.ctaHref.startsWith('/') ? (
                      <Link to={tier.ctaHref}>{tier.cta}</Link>
                    ) : (
                      <a href={tier.ctaHref} onClick={(e) => handleSectionNavClick(e, tier.ctaHref)}>
                        {tier.cta}
                      </a>
                    )}
                  </Button>
                )}
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
        <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> No credit card for Free
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Cancel anytime
          </span>
        </p>
      </div>
    </section>
  );
}
