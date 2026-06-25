import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import Bookshelf from '@/components/library/Bookshelf';
import { useLibraryPreview } from '@/hooks/useLibraryPreview';
import { useOpenDocument } from '@/hooks/useOpenDocument';
import { uploadContent } from '@/lib/landing/content';
import { fadeUp } from '@/lib/landing/motion';

const PREVIEW_LIMIT = 4;

interface LandingRecentLibraryProps {
  /** Bump when uploads/opens finish so the shelf re-reads local storage */
  refreshKey?: unknown;
}

export default function LandingRecentLibrary({ refreshKey }: LandingRecentLibraryProps) {
  const { files, cachedIds, totalCount, refresh } = useLibraryPreview(PREVIEW_LIMIT);
  const { openFromLibrary, isLoading } = useOpenDocument();

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      className="mt-10 rounded-2xl border border-border bg-gradient-to-b from-card/50 to-card/20 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent mb-1">
            {uploadContent.recentLabel}
          </p>
          <p className="text-sm text-muted-foreground">{uploadContent.recentDescription}</p>
        </div>
        <Link
          to="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md px-1"
        >
          {uploadContent.viewLibrary}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {files.length > 0 ? (
        <>
          <Bookshelf
            files={files}
            cachedIds={cachedIds}
            onSelect={openFromLibrary}
            onRemove={() => {}}
            showActions={false}
          />
          {totalCount > PREVIEW_LIMIT && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              +{totalCount - PREVIEW_LIMIT} more in{' '}
              <Link to="/library" className="text-accent hover:underline">
                your library
              </Link>
            </p>
          )}
        </>
      ) : (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">{uploadContent.emptyLibraryTitle}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {uploadContent.emptyLibraryHint}
          </p>
          <Link
            to="/library"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-accent hover:text-accent/80"
          >
            Go to library
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {isLoading && (
        <p className="text-xs text-center text-muted-foreground mt-3">Opening document…</p>
      )}
    </motion.div>
  );
}
