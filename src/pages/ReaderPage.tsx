import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';
import ReadingModeDialog from '@/components/library/ReadingModeDialog';
import { useTheme } from '@/hooks/useTheme';
import { usePDFStorage, type PDFProgress, type ReadingMode } from '@/hooks/usePDFStorage';
import { decodeDocId, resolveDocument } from '@/lib/documentRoute';
import { hashFile } from '@/lib/documentHash';
import { toast } from 'sonner';

interface ReaderLocationState {
  file?: File;
  meta?: PDFProgress;
}

const ReaderPage = () => {
  const { docId: docIdParam } = useParams<{ docId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { saveReadingMode } = usePDFStorage();

  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<PDFProgress | null>(null);
  const [readingMode, setReadingMode] = useState<ReadingMode>('scroll');
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const docId = docIdParam ? decodeDocId(docIdParam) : '';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!docId) {
        navigate('/library', { replace: true, state: null });
        return;
      }

      setLoading(true);
      const state = location.state as ReaderLocationState | null;

      if (state?.file && state?.meta) {
        if (cancelled) return;
        setFile(state.file);
        setMeta(state.meta);
        if (state.meta.readingMode) {
          setReadingMode(state.meta.readingMode);
          setReady(true);
        } else {
          setModeDialogOpen(true);
        }
        setLoading(false);
        return;
      }

      const resolved = await resolveDocument(docId);
      if (cancelled) return;

      if (!resolved) {
        toast.error('Document not found. Please open it from your library.');
        navigate('/library', { replace: true, state: null });
        return;
      }

      setFile(resolved.file);
      setMeta(resolved.meta);
      if (resolved.meta.readingMode) {
        setReadingMode(resolved.meta.readingMode);
        setReady(true);
      } else {
        setModeDialogOpen(true);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [docId, location.state, navigate]);

  const handleModeConfirm = useCallback((mode: ReadingMode, remember: boolean) => {
    if (!file || !meta) return;
    if (remember) {
      saveReadingMode(file.name, meta.contentHash, mode);
    }
    setReadingMode(mode);
    setModeDialogOpen(false);
    setReady(true);
  }, [file, meta, saveReadingMode]);

  const handleModeCancel = useCallback(() => {
    setModeDialogOpen(false);
    navigate('/library', { replace: true, state: null });
  }, [navigate]);

  const handleClose = useCallback(() => {
    navigate('/library', { replace: true, state: null });
  }, [navigate]);

  const handleGoHome = useCallback(() => {
    navigate('/', { replace: true, state: null });
  }, [navigate]);

  const handleReadingModeChange = useCallback((mode: ReadingMode) => {
    setReadingMode(mode);
    if (file) {
      hashFile(file).then((hash) => {
        saveReadingMode(file.name, hash, mode);
      }).catch(() => { /* optional */ });
    }
  }, [file, saveReadingMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!file || !ready) {
    return (
      <>
        <ReadingModeDialog
          open={modeDialogOpen}
          fileName={file?.name ?? meta?.fileName ?? ''}
          onConfirm={handleModeConfirm}
          onCancel={handleModeCancel}
        />
        {!modeDialogOpen && (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}
      </>
    );
  }

  return (
    <PDFViewer
      file={file}
      readingMode={readingMode}
      onReadingModeChange={handleReadingModeChange}
      onClose={handleClose}
      onGoHome={handleGoHome}
      theme={theme}
      onToggleTheme={toggleTheme}
      onSelectTheme={setTheme}
    />
  );
};

export default ReaderPage;
