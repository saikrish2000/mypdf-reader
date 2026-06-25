import { motion } from 'framer-motion';
import PDFUpload from '@/components/PDFUpload';
import { Progress } from '@/components/ui/progress';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import LandingRecentLibrary from '@/components/landing/sections/LandingRecentLibrary';
import { useOpenDocument } from '@/hooks/useOpenDocument';
import { useTheme } from '@/hooks/useTheme';
import { uploadContent } from '@/lib/landing/content';
import { fadeUp } from '@/lib/landing/motion';

export default function UploadWorkspace() {
  const { theme } = useTheme();
  const { openFile, isLoading } = useOpenDocument();

  return (
    <section id="upload" className="landing-snap-section landing-snap-section--scroll">
      <div className="w-full py-4">
      <SectionHeader
        eyebrow={uploadContent.eyebrow}
        title={uploadContent.title}
        description={uploadContent.description}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
        className="rounded-2xl border border-dashed border-violet-500/30 bg-card/30 p-2 sm:p-4 glow-accent"
      >
        <PDFUpload
          variant="hero"
          theme={theme}
          onFileSelect={openFile}
          isLoading={isLoading}
        />
      </motion.div>

      {isLoading && (
        <div className="mt-4 space-y-2">
          <Progress value={66} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">Opening your document…</p>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">{uploadContent.supportedTypes}</p>

      <LandingRecentLibrary refreshKey={isLoading} />
      </div>
    </section>
  );
}
