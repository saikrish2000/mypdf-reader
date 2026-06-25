import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/hero/HeroSection';
import UploadWorkspace from '@/components/landing/sections/UploadWorkspace';
import InteractiveDemo from '@/components/landing/sections/InteractiveDemo';
import FeaturesGrid from '@/components/landing/sections/FeaturesGrid';
import AIToolsGrid from '@/components/landing/sections/AIToolsGrid';
import HowItWorks from '@/components/landing/sections/HowItWorks';
import Pricing from '@/components/landing/sections/Pricing';
import Testimonials from '@/components/landing/sections/Testimonials';
import LandingFooter from '@/components/landing/sections/LandingFooter';
import { useTheme } from '@/hooks/useTheme';
import { useOpenDocument } from '@/hooks/useOpenDocument';

const Landing = () => {
  const { theme } = useTheme();
  const { openFile, isLoading } = useOpenDocument();

  useEffect(() => {
    document.documentElement.classList.add('landing-scroll-snap');
    return () => document.documentElement.classList.remove('landing-scroll-snap');
  }, []);

  const triggerUpload = () => {
    document.getElementById('landing-upload-trigger')?.click();
  };

  return (
    <div className="min-h-screen bg-background relative landing-page">
      <Navbar variant="marketing" onUploadClick={triggerUpload} />

      <main className="overflow-x-clip">
        <div className="landing-shell landing-main">
          <HeroSection
            theme={theme}
            onUpload={openFile}
            isLoading={isLoading}
            onTriggerUpload={triggerUpload}
          />
          <UploadWorkspace />
          <InteractiveDemo />
          <FeaturesGrid />
          <AIToolsGrid />
          <HowItWorks />
          <Pricing />
          <Testimonials />
        </div>
        <LandingFooter />
      </main>

      <input
        id="landing-upload-trigger"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={isLoading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) openFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default Landing;
