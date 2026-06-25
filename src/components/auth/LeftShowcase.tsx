import { motion, useMotionValue, useTransform } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import FloatingGlow from './FloatingGlow';
import FloatingReader from './FloatingReader';
import FeatureList from './FeatureList';
import Testimonial from './Testimonial';
import OrbitalIcons from './OrbitalIcons';
import { authGradientText, authMuted } from './authStyles';
import { cn } from '@/lib/utils';

export default function LeftShowcase() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useTransform(mouseX, [-0.5, 0.5], [-12, 12]);
  const parallaxY = useTransform(mouseY, [-0.5, 0.5], [-8, 8]);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      className="relative hidden min-h-0 overflow-y-auto lg:flex lg:flex-col"
      onMouseMove={onMouseMove}
    >
      <FloatingGlow />
      <ParticleBackground />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-8 py-5 xl:px-12 xl:py-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex shrink-0 items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">myPDF.reader</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 max-w-lg shrink-0 xl:mt-6"
        >
          <h1 className="font-display-serif text-[32px] leading-[1.1] tracking-tight text-white lg:text-[36px] xl:text-[42px]">
            Your study
            <br />
            library,{' '}
            <span className={cn(authGradientText, 'font-sans font-bold italic')}>everywhere.</span>
          </h1>
          <p className={cn('mt-2 max-w-md text-sm leading-relaxed xl:mt-3 xl:text-[15px]', authMuted)}>
            Sync your highlights, notes and bookmarks across every device.
          </p>
        </motion.div>

        <div className="relative my-3 flex min-h-[180px] flex-1 items-center justify-center xl:my-4 xl:min-h-[220px]">
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
            className="relative w-full max-w-md scale-[0.88] xl:max-w-lg xl:scale-100"
          >
            <div className="relative flex h-[200px] w-full items-center justify-center xl:h-[260px]">
              <OrbitalIcons />
              <FloatingReader />
            </div>
          </motion.div>
        </div>

        <div className="mt-auto shrink-0 space-y-3 pb-1">
          <div className="grid grid-cols-1 items-end gap-4 xl:grid-cols-[1fr_auto] xl:gap-6">
            <FeatureList />
            <div className="hidden xl:block w-[260px] shrink-0">
              <Testimonial />
            </div>
          </div>
          <div className="xl:hidden">
            <Testimonial />
          </div>
        </div>
      </div>
    </section>
  );
}
