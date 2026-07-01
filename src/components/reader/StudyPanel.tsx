import { useState } from 'react';
import { Loader2, Layers, HelpCircle, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useStudyDeck } from '@/hooks/useStudyDeck';
import type { GenerateFlashcardsResponse, GenerateQuizResponse } from '@/lib/types/external';
import { Button } from '@/components/ui/button';

type StudyMode = 'flashcards' | 'quiz';
type GenerateSource = 'page' | 'highlights';

interface StudyPanelProps {
  fileName: string;
  contentHash?: string;
  currentPage: number;
  totalPages: number;
  annotations: { quote: string; page_number: number }[];
  extractPageText: (page: number) => Promise<string>;
}

export default function StudyPanel({
  fileName,
  contentHash,
  currentPage,
  totalPages,
  annotations,
  extractPageText,
}: StudyPanelProps) {
  const { flashcards, quiz, saveFlashcards, saveQuiz } = useStudyDeck(fileName, contentHash);
  const [mode, setMode] = useState<StudyMode>('flashcards');
  const [loading, setLoading] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const highlights = annotations.filter((a) => a.quote?.trim());

  const exportHighlights = () => {
    if (highlights.length === 0) return;
    const base = fileName.replace(/\.pdf$/i, '') || 'document';
    const md = highlights
      .map((h) => `## Page ${h.page_number}\n\n> ${h.quote.replace(/\n/g, '\n> ')}\n`)
      .join('\n');
    const blob = new Blob([`# Highlights — ${base}\n\n${md}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}-highlights.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported highlights');
  };

  const generate = async (source: GenerateSource) => {
    setLoading(true);
    try {
      let text = '';
      if (source === 'highlights' && highlights.length > 0) {
        text = highlights.map((h) => `[p.${h.page_number}] ${h.quote}`).join('\n');
      } else {
        text = await extractPageText(currentPage);
      }
      if (!text) {
        toast.error('No text to generate from.');
        return;
      }

      const highlightQuotes = source === 'highlights' ? highlights.map((h) => h.quote) : undefined;
      const body = { text, pageNumber: currentPage, highlightQuotes };

      if (mode === 'flashcards') {
        const { data, error } = await supabase!.functions.invoke('generate-flashcards', { body });
        if (error) throw error;
        const result = data as GenerateFlashcardsResponse;
        if (result.error) throw new Error(result.error);
        saveFlashcards(result.cards ?? []);
        setCardIndex(0);
        setFlipped(false);
        toast.success(`Generated ${result.cards?.length ?? 0} flashcards`);
      } else {
        const { data, error } = await supabase!.functions.invoke('generate-quiz', { body });
        if (error) throw error;
        const result = data as GenerateQuizResponse;
        if (result.error) throw new Error(result.error);
        saveQuiz(result.questions ?? []);
        setQuizIndex(0);
        setSelected(null);
        setScore(0);
        setQuizDone(false);
        toast.success(`Generated ${result.questions?.length ?? 0} questions`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[cardIndex];
  const currentQ = quiz[quizIndex];

  const pickAnswer = (idx: number) => {
    if (selected !== null || !currentQ) return;
    setSelected(idx);
    if (idx === currentQ.answerIndex) setScore((s) => s + 1);
    setTimeout(() => {
      if (quizIndex + 1 >= quiz.length) {
        setQuizDone(true);
      } else {
        setQuizIndex((i) => i + 1);
        setSelected(null);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-1 p-2 border-b border-border shrink-0">
        {(['flashcards', 'quiz'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md capitalize',
              mode === m ? 'bg-violet-500/15 text-violet-300' : 'text-muted-foreground hover:bg-muted/50',
            )}
          >
            {m === 'flashcards' ? <Layers className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
            {m}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-3 border-b border-border shrink-0">
        <Button size="sm" variant="outline" disabled={loading} onClick={() => generate('page')}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          From page {currentPage}
        </Button>
        {highlights.length > 0 && (
          <Button size="sm" variant="outline" disabled={loading} onClick={() => generate('highlights')}>
            From {highlights.length} highlights
          </Button>
        )}
        {highlights.length > 0 && (
          <Button size="sm" variant="ghost" onClick={exportHighlights}>
            <Download className="h-3 w-3 mr-1" />
            Export .md
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'flashcards' ? (
          flashcards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              Generate flashcards from the current page or your highlights.
            </p>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="w-full min-h-[140px] rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-blue-500/10 p-6 text-center transition-transform"
                style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
              >
                <p className="text-xs uppercase tracking-wide text-violet-400 mb-2">
                  {flipped ? 'Answer' : 'Question'}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {flipped ? currentCard?.back : currentCard?.front}
                </p>
              </button>
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cardIndex <= 0}
                  onClick={() => { setCardIndex((i) => i - 1); setFlipped(false); }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {cardIndex + 1} / {flashcards.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cardIndex >= flashcards.length - 1}
                  onClick={() => { setCardIndex((i) => i + 1); setFlipped(false); }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        ) : quiz.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Generate a quiz from page {currentPage} of {totalPages}.
          </p>
        ) : quizDone ? (
          <div className="text-center mt-8 space-y-2">
            <p className="text-lg font-semibold text-foreground">Quiz complete</p>
            <p className="text-sm text-muted-foreground">
              Score: {score} / {quiz.length}
            </p>
          </div>
        ) : currentQ ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{currentQ.prompt}</p>
            {currentQ.choices.map((choice, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => pickAnswer(idx)}
                disabled={selected !== null}
                className={cn(
                  'w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors',
                  selected === null && 'hover:bg-muted/50 border-border',
                  selected === idx && idx === currentQ.answerIndex && 'border-emerald-500/50 bg-emerald-500/10',
                  selected === idx && idx !== currentQ.answerIndex && 'border-destructive/50 bg-destructive/10',
                  selected !== null && idx === currentQ.answerIndex && selected !== idx && 'border-emerald-500/30',
                )}
              >
                {choice}
              </button>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              Question {quizIndex + 1} of {quiz.length}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
