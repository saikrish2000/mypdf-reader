import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Bookshelf from '@/components/library/Bookshelf';
import { fileKey } from '@/components/library/BookOnShelf';
import Navbar from '@/components/Navbar';
import StatsPanel from '@/components/StatsPanel';
import PDFUpload from '@/components/PDFUpload';
import { usePDFStorage } from '@/hooks/usePDFStorage';
import { useTheme } from '@/hooks/useTheme';
import { useOpenDocument } from '@/hooks/useOpenDocument';
import { useReadingStats } from '@/hooks/useReadingStats';
import { getCachedPDF, removeCachedPDF } from '@/lib/pdfCache';
import { generateCoverThumbnail, needsCoverUpdate } from '@/lib/pdfCover';

function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

const LibraryPage = () => {
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());
  const { getRecentFiles, clearProgress, saveBookMetadata } = usePDFStorage();
  const [recentFiles, setRecentFiles] = useState<ReturnType<typeof getRecentFiles>>([]);
  const { theme } = useTheme();
  const { openFile, openFromLibrary, isLoading } = useOpenDocument();
  const [statsOpen, setStatsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { current: streak, todaySeconds } = useReadingStats(null);

  useEffect(() => {
    setRecentFiles(getRecentFiles());
  }, [getRecentFiles]);

  useEffect(() => {
    let cancelled = false;
    const pruneStale = async () => {
      const files = getRecentFiles();
      let pruned = 0;
      for (const file of files) {
        const cached = await getCachedPDF(file.fileName, file.contentHash);
        if (!cached) {
          clearProgress(file.fileName, file.contentHash);
          pruned++;
        }
      }
      if (cancelled) return;
      if (pruned > 0) {
        toast.info(`Removed ${pruned} unavailable book${pruned !== 1 ? 's' : ''} from library`);
        setRecentFiles(getRecentFiles());
      }
    };
    pruneStale();
    return () => { cancelled = true; };
  }, [getRecentFiles, clearProgress]);

  useEffect(() => {
    let cancelled = false;
    const checkCache = async () => {
      const ids = new Set<string>();
      await Promise.all(
        recentFiles.map(async (file) => {
          const key = file.contentHash ?? file.fileName;
          const cached = await getCachedPDF(file.fileName, file.contentHash);
          if (cached) ids.add(key);
        }),
      );
      if (!cancelled) setCachedIds(ids);
    };
    if (recentFiles.length > 0) {
      checkCache();
    } else {
      setCachedIds(new Set());
    }
    return () => { cancelled = true; };
  }, [recentFiles]);

  useEffect(() => {
    let cancelled = false;
    const backfillCovers = async () => {
      const needsCover = recentFiles.filter((f) => needsCoverUpdate(f));
      if (needsCover.length === 0) return;

      let updated = false;
      await Promise.all(
        needsCover.map(async (file) => {
          if (cancelled) return;
          const cached = await getCachedPDF(file.fileName, file.contentHash);
          if (!cached) return;
          try {
            const cover = await generateCoverThumbnail(cached);
            if (cancelled) return;
            saveBookMetadata(file.fileName, file.contentHash, {
              coverThumbnail: cover.thumbnail,
              spineColor: cover.spineColor,
              coverPage: cover.coverPage,
              coverMetaVersion: cover.coverMetaVersion,
            });
            updated = true;
          } catch {
            /* cover optional */
          }
        }),
      );
      if (!cancelled && updated) {
        setRecentFiles(getRecentFiles());
      }
    };
    if (recentFiles.length > 0) {
      backfillCovers();
    }
    return () => { cancelled = true; };
  }, [recentFiles, getRecentFiles, saveBookMetadata]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return recentFiles;
    const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return recentFiles.filter((f) => {
      const name = f.fileName.toLowerCase();
      return words.every((w) => name.includes(w));
    });
  }, [recentFiles, searchQuery]);

  const handleRemove = async (file: (typeof recentFiles)[number]) => {
    const key = fileKey(file);
    await removeCachedPDF(file.fileName, file.contentHash);
    clearProgress(file.fileName, file.contentHash);
    setRecentFiles(getRecentFiles());
    setCachedIds((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    toast.success('Removed from library');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        variant="library"
        onStatsClick={() => setStatsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <StatsPanel isOpen={statsOpen} onClose={() => setStatsOpen(false)} />

      <main className="page-shell page-main">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 type-caption hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        <div className="surface-muted p-5 sm:p-6 section-gap-sm">
          <p className="type-label mb-4">Add study material</p>
          <PDFUpload
            variant="compact"
            theme={theme}
            onFileSelect={openFile}
            isLoading={isLoading}
          />
        </div>

        <section>
          {(todaySeconds > 0 || streak > 0) && (
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="text-muted-foreground">Today</span>
                <span className="font-medium text-foreground">{formatReadingTime(todaySeconds)}</span>
              </div>
              {streak > 0 && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <Flame className="h-4 w-4 text-orange-500" aria-hidden />
                  <span className="font-medium text-foreground">{streak} day streak</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="section-title">My Study Library</h2>
            {recentFiles.length > 0 && (
              <span className="type-caption">
                {recentFiles.length} file{recentFiles.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {filteredFiles.length > 0 ? (
            <Bookshelf
              files={filteredFiles}
              cachedIds={cachedIds}
              onSelect={openFromLibrary}
              onRemove={handleRemove}
            />
          ) : recentFiles.length > 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">No files match your search</p>
              <p className="type-caption mt-1">Try a different file name</p>
            </div>
          ) : (
            <div className="relative py-12">
              <p className="text-sm font-medium text-foreground text-center">
                Your study library is empty
              </p>
              <p className="type-caption text-center mt-2 max-w-xs mx-auto">
                Upload a textbook or exam PDF above to start. Your reading progress and notes save automatically.
              </p>
              <div className="bookshelf-plank h-2 rounded-sm mx-1 mt-10" aria-hidden />
              <div className="bookshelf-plank-edge h-1 rounded-sm mx-2 -mt-px" aria-hidden />
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default LibraryPage;
