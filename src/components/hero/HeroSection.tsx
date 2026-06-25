import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Theme } from '@/hooks/useTheme';
import { getHeroConfig } from './heroThemeConfig';
import { heroContent } from '@/lib/landing/content';
import { staggerContainer, fadeUp, scaleIn } from '@/lib/landing/motion';
import HeroFeatureChips from './HeroFeatureChips';
import HeroLivePreview from './HeroLivePreview';
import GradientButton from '@/components/landing/ui/GradientButton';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { handleSectionNavClick } from '@/lib/landing/scrollToSection';

interface HeroSectionProps {
  theme: Theme;
  onUpload?: (file: File) => void;
  isLoading?: boolean;
  onTriggerUpload?: () => void;
}

export default function HeroSection({
  theme,
  onUpload,
  isLoading,
  onTriggerUpload,
}: HeroSectionProps) {
  const config = getHeroConfig(theme);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = '';
  };

  return (
    <section id="hero" className="landing-snap-section landing-snap-section--scroll lg:overflow-visible relative">
      <AnimatedBackground className="absolute left-1/2 top-0 -translate-x-1/2 w-screen h-full -z-10 overflow-hidden pointer-events-none opacity-60" />

      <div className="grid w-full min-h-0 flex-1 gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-14 items-center py-4 lg:py-0">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="min-w-0"
        >
          <motion.span
            variants={fadeUp}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold mb-4 border',
              config.useBlur
                ? 'border-violet-500/20 bg-violet-500/10 text-violet-300'
                : 'border-foreground bg-foreground text-background',
            )}
          >
            {config.badgeLabel}
          </motion.span>

          <motion.h1 variants={fadeUp} className="type-display-marketing text-foreground mb-3">
            {config.headline}{' '}
            {config.headlineAccent && (
              <span className="text-gradient-hero">{config.headlineAccent}</span>
            )}
          </motion.h1>

          <motion.p variants={fadeUp} className="type-lead max-w-none mb-5">
            {config.subhead}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={isLoading}
              onChange={handleFileChange}
            />
            <GradientButton
              size="lg"
              disabled={isLoading}
              onClick={() => {
                if (onTriggerUpload) onTriggerUpload();
                else fileInputRef.current?.click();
              }}
            >
              {isLoading ? 'Opening…' : heroContent.primaryCta}
            </GradientButton>
            <Button asChild size="lg" variant="outline" className="rounded-xl border-border">
              <a href="#demo" onClick={(e) => handleSectionNavClick(e, '#demo')}>
                {heroContent.secondaryCta}
              </a>
            </Button>
          </motion.div>

          <motion.div variants={fadeUp}>
            <HeroFeatureChips theme={theme} />
          </motion.div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          className="min-w-0 w-full min-h-[200px] lg:min-h-0 lg:h-full flex items-center"
        >
          <HeroLivePreview theme={theme} className="w-full h-full min-h-[200px] max-h-[38dvh] lg:min-h-[320px] lg:max-h-none" />
        </motion.div>
      </div>
    </section>
  );
}
