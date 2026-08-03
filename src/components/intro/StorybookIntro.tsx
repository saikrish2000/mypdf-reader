import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { UploadCloud, Sparkles, Gauge, BookMarked, Highlighter, Headphones, X } from 'lucide-react';

/**
 * StorybookIntro
 * Cinematic 3D storybook that opens, flips through themed pages, and
 * morphs its final page into the live homepage. Plays once per visitor
 * (localStorage). Skippable. Respects prefers-reduced-motion.
 */

/**
 * Bump INTRO_VERSION whenever the intro is intentionally redesigned —
 * the storage key changes, so every visitor sees the new animation once.
 */
const INTRO_VERSION = 3;
const STORAGE_KEY = `mypdf.intro.seen.v${INTRO_VERSION}`;

/** Route the intro is allowed to play on. */
const INTRO_ROUTE = '/';

/** Module-level flag: intro is a first-paint moment, never a navigation event. */
let introPlayedThisSession = false;

type StoryPage = {
  icon: typeof UploadCloud;
  title: string;
  caption: string;
  /** Opaque page background (solid — pages must never be see-through). */
  tint: string;
};

const PAGES: StoryPage[] = [
  { icon: UploadCloud, title: 'Drop in a PDF',       caption: 'Textbooks, papers, novels — rendered like real paper.', tint: 'linear-gradient(160deg, #fdf6e6 0%, #f3ead6 100%)' },
  { icon: Sparkles,    title: 'AI that reads with you', caption: 'Summaries and answers, grounded in the current page.', tint: 'linear-gradient(160deg, #fdf1ee 0%, #f7ecd9 100%)' },
  { icon: Highlighter, title: 'Highlight & note',    caption: 'Your marks and sticky notes, saved to your library.',  tint: 'linear-gradient(160deg, #eef5fb 0%, #f1ece1 100%)' },
  { icon: Gauge,       title: 'Track your progress', caption: 'Pages read, time spent, and streaks for every book.',  tint: 'linear-gradient(160deg, #ecf7f0 0%, #f2ede2 100%)' },
  { icon: BookMarked,  title: 'Auto-resume',         caption: 'Reopen a document and land exactly where you stopped.', tint: 'linear-gradient(160deg, #f7f4ec 0%, #f6ecd8 100%)' },
  { icon: Headphones,  title: 'Listen along',        caption: 'Natural read-aloud for any chapter, anywhere.',        tint: 'linear-gradient(160deg, #f2effb 0%, #f2ede2 100%)' },
];



interface StorybookIntroProps {
  onFinish: () => void;
}

export default function StorybookIntro({ onFinish }: StorybookIntroProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'atmos' | 'reveal' | 'zoom' | 'open' | 'flipping' | 'morph' | 'done'>('atmos');
  const [flipped, setFlipped] = useState(0);

  // Timeline
  useEffect(() => {
    if (reduce) {
      onFinish();
      return;
    }
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase('reveal'), 400));
    timers.push(window.setTimeout(() => setPhase('zoom'), 1000));
    timers.push(window.setTimeout(() => setPhase('open'), 1700));
    timers.push(window.setTimeout(() => setPhase('flipping'), 2300));
    return () => timers.forEach(clearTimeout);
  }, [reduce, onFinish]);

  // Sequential page flips
  useEffect(() => {
    if (phase !== 'flipping') return;
    if (flipped >= PAGES.length - 1) {
      const t = window.setTimeout(() => setPhase('morph'), 550);
      return () => clearTimeout(t);
    }
    const t = window.setTimeout(() => setFlipped((f) => f + 1), 520);
    return () => clearTimeout(t);
  }, [phase, flipped]);

  // Morph -> finish
  useEffect(() => {
    if (phase !== 'morph') return;
    const t = window.setTimeout(() => {
      setPhase('done');
      onFinish();
    }, 900);
    return () => clearTimeout(t);
  }, [phase, onFinish]);

  const skip = () => {
    setPhase('done');
    onFinish();
  };

  // Particles (memoized so they don't re-generate each render)
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 4,
        duration: 6 + Math.random() * 6,
      })),
    [],
  );

  const bookOpen = phase === 'open' || phase === 'flipping' || phase === 'morph';
  const zoomed = phase === 'zoom' || bookOpen;
  const morphing = phase === 'morph';

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          aria-hidden={false}
          role="dialog"
          aria-label="Intro animation"
        >
          {/* Deep navy cinematic backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(1200px 700px at 50% 45%, #1a2350 0%, #0b1027 45%, #05070f 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: morphing ? 0 : 1 }}
            transition={{ duration: morphing ? 0.7 : 0.6, ease: 'easeOut' }}
          />

          {/* Volumetric spotlight */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '90vmin',
              height: '90vmin',
              background:
                'radial-gradient(closest-side, rgba(255,214,150,0.18), rgba(255,214,150,0.06) 45%, transparent 70%)',
              filter: 'blur(10px)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: morphing ? 0 : 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Floating dust particles */}
          <div className="pointer-events-none absolute inset-0">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute rounded-full bg-amber-100/70"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: p.size,
                  height: p.size,
                  boxShadow: '0 0 6px rgba(255,220,170,0.6)',
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: morphing ? 0 : [0, 0.9, 0.2, 0.9, 0],
                  y: [-8, -30, -50],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Skip Intro */}
          <button
            onClick={skip}
            className="absolute right-4 top-4 z-[110] inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
          >
            Skip intro <X className="h-3.5 w-3.5" />
          </button>

          {/* Stage with 3D perspective */}
          <div
            className="absolute inset-0 grid place-items-center px-4 py-6"
            style={{ perspective: '2200px' }}
          >
            <motion.div
              className="relative mx-auto"
              style={{ transformStyle: 'preserve-3d' }}
              initial={{ opacity: 0, scale: 0.55, rotateX: 18, y: 30 }}
              animate={{
                opacity: phase === 'atmos' ? 0 : 1,
                scale: morphing ? 1.08 : zoomed ? 1 : 0.7,

                rotateX: bookOpen ? 6 : 14,
                y: morphing ? -20 : 0,
              }}
              transition={{
                duration: morphing ? 0.9 : 1.0,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Book
                open={bookOpen}
                flipped={flipped}
                morphing={morphing}
              />
            </motion.div>
          </div>

          {/* Golden glow that spills from opened book */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '70vmin',
              height: '40vmin',
              background:
                'radial-gradient(closest-side, rgba(255,196,120,0.35), rgba(255,196,120,0.08) 55%, transparent 75%)',
              filter: 'blur(20px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: bookOpen && !morphing ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Book ---------------- */

function Book({ open, flipped, morphing }: { open: boolean; flipped: number; morphing: boolean }) {
  // Book sizes responsive to viewport (never wider/taller than the stage)
  const width = 'min(78vmin, 86vw, 720px)';
  const height = 'min(56vmin, 60vh, 520px)';


  return (
    <div
      className="relative"
      style={{
        width,
        height,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Back cover */}
      <div
        className="absolute inset-0 rounded-r-md rounded-l-sm"
        style={{
          background:
            'linear-gradient(135deg, #10163a 0%, #1a2350 60%, #0b1027 100%)',
          boxShadow:
            '0 40px 80px -20px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.4)',
          transform: 'translateZ(-14px)',
        }}
      />

      {/* Page stack (paper edges) */}
      <div
        className="absolute inset-1 rounded-r-sm"
        style={{
          background:
            'repeating-linear-gradient(0deg, #f5efe0 0px, #f5efe0 1px, #e8dfc7 2px)',
          transform: 'translateZ(-6px)',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.15)',
        }}
      />

      {/* Static right page underneath (last page reveals homepage) */}
      <div
        className="absolute inset-0 origin-left overflow-hidden rounded-r-md"
        style={{
          transform: 'translateZ(0.1px)',
          background:
            morphing
              ? 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)'
              : 'linear-gradient(180deg, #fbf7ec 0%, #f2ead6 100%)',
          transition: 'background 0.6s ease',
        }}
      >
        <FinalPage morphing={morphing} />
      </div>

      {/* Flippable pages (stacked, flip in reverse to reveal underneath) */}
      {PAGES.map((page, i) => {
        const isFlipped = i < flipped;
        // z-order: unflipped highest so top page is visible
        const z = PAGES.length - i;
        return (
          <motion.div
            key={i}
            className="absolute inset-0 origin-left rounded-r-md"
            style={{
              transformStyle: 'preserve-3d',
              zIndex: z,
              transformOrigin: 'left center',
              backfaceVisibility: 'hidden',
            }}
            initial={false}
            animate={{
              rotateY: isFlipped ? -172 : open ? 0 : 0,
            }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          >
            {/* Front face */}
            <div
              className="absolute inset-0 overflow-hidden rounded-r-md"
              style={{
                backfaceVisibility: 'hidden',
                backgroundColor: '#f6efdf',
                backgroundImage: `radial-gradient(1200px 400px at -10% 0%, rgba(0,0,0,0.04), transparent 40%), radial-gradient(circle at 90% 100%, rgba(0,0,0,0.06), transparent 40%), ${page.tint}`,
                boxShadow:
                  'inset -12px 0 24px -12px rgba(0,0,0,0.15), inset 2px 0 0 rgba(0,0,0,0.05)',
              }}
            >
              <PageContent page={page} index={i} />
            </div>

            {/* Back face (paper) */}
            <div
              className="absolute inset-0 rounded-l-md"
              style={{
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                background:
                  'linear-gradient(180deg, #f7f1e1 0%, #ede3c8 100%)',
                boxShadow: 'inset 12px 0 24px -12px rgba(0,0,0,0.15)',
              }}
            />
          </motion.div>
        );
      })}

      {/* Front cover (opens once) */}
      <motion.div
        className="absolute inset-0 origin-left rounded-r-md rounded-l-sm"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: 'left center',
          zIndex: PAGES.length + 5,
        }}
        initial={false}
        animate={{ rotateY: open ? -172 : 0 }}
        transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
      >
        {/* Cover front (visible when closed) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-r-md"
          style={{
            backfaceVisibility: 'hidden',
            background:
              'linear-gradient(135deg, #0f1638 0%, #1a2352 45%, #0a1030 100%)',
            boxShadow:
              '0 40px 90px -25px rgba(0,0,0,0.75), inset 0 0 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* Cloth spine */}
          <div
            className="absolute inset-y-0 left-0 w-4"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.5), rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.5))',
            }}
          />
          {/* Gold corner protectors */}
          <CornerOrnament pos="tl" />
          <CornerOrnament pos="tr" />
          <CornerOrnament pos="bl" />
          <CornerOrnament pos="br" />

          {/* Gold-foil title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
            <div
              className="mb-3 h-px w-28"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #d4af5a, transparent)',
              }}
            />
            <h1
              className="font-serif text-4xl tracking-[0.2em] sm:text-5xl"
              style={{
                color: '#e6c98a',
                textShadow:
                  '0 1px 0 rgba(0,0,0,0.4), 0 0 12px rgba(212,175,90,0.35)',
                letterSpacing: '0.18em',
              }}
            >
              MYPDF
            </h1>
            <p
              className="mt-2 text-[10px] uppercase tracking-[0.5em]"
              style={{ color: '#c7a25a' }}
            >
              A Reading Companion
            </p>
            <div
              className="mt-4 h-px w-28"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #d4af5a, transparent)',
              }}
            />
          </div>
        </div>
        {/* Cover inside (visible when opened) */}
        <div
          className="absolute inset-0 rounded-l-md"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            background:
              'linear-gradient(180deg, #f7f1e1 0%, #ede3c8 100%)',
            boxShadow: 'inset 12px 0 24px -12px rgba(0,0,0,0.2)',
          }}
        />
      </motion.div>
    </div>
  );
}

function CornerOrnament({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const map = {
    tl: 'top-2 left-2 rounded-tl-sm border-t border-l',
    tr: 'top-2 right-2 rounded-tr-sm border-t border-r',
    bl: 'bottom-2 left-2 rounded-bl-sm border-b border-l',
    br: 'bottom-2 right-2 rounded-br-sm border-b border-r',
  } as const;
  return (
    <div
      className={`pointer-events-none absolute h-8 w-8 ${map[pos]}`}
      style={{
        borderColor: '#c9a45a',
        boxShadow: '0 0 6px rgba(201,164,90,0.4)',
      }}
    />
  );
}

function PageContent({ page, index }: { page: StoryPage; index: number }) {
  const Icon = page.icon;
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 px-8 pb-12 pt-8 text-center sm:gap-4">
      {/* subtle paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(0,0,0,0.4) 0.6px, transparent 0.7px)',
          backgroundSize: '3px 3px',
        }}
      />
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(212,175,90,0.25), transparent 70%)',
        }}
      >
        <Icon className="h-8 w-8" style={{ color: '#8a5a1a' }} />
      </div>
      <h2
        className="font-serif text-2xl leading-tight text-stone-800 sm:text-3xl"
        style={{ letterSpacing: '0.01em' }}
      >
        {page.title}
      </h2>
      <p className="max-w-xs text-sm text-stone-600 sm:text-base">
        {page.caption}
      </p>
      <p className="absolute bottom-4 text-[10px] uppercase tracking-[0.4em] text-stone-400">
        — {index + 1} —
      </p>
    </div>
  );
}

function FinalPage({ morphing }: { morphing: boolean }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-8 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-600"
        style={{ opacity: morphing ? 0 : 1, transition: 'opacity 0.4s' }}
      >
        Chapter One
      </motion.div>
      <h2
        className={`font-serif leading-tight text-stone-900 ${
          morphing ? 'text-5xl' : 'text-3xl sm:text-4xl'
        }`}
        style={{ transition: 'font-size 0.7s cubic-bezier(0.22,1,0.36,1)' }}
      >
        Read smarter.
        <br />
        <span style={{ color: '#8a5a1a' }}>Understand faster.</span>
      </h2>
      <p className="mt-3 max-w-sm text-sm text-stone-600">
        Upload any PDF. Summarize, chat, highlight, and listen — without leaving
        the document.
      </p>
      <div className="mt-5 flex gap-2">
        <div className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white shadow">
          Get started
        </div>
        <div className="rounded-lg border border-stone-300 bg-white/70 px-4 py-2 text-xs font-medium text-stone-800">
          See demo
        </div>
      </div>
    </div>
  );
}

/* ---------------- Hook ---------------- */

export function useShouldPlayIntro() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    // Only ever evaluate on the landing route, and only on the first mount of
    // this session — returning to "/" via internal navigation must not replay.
    if (pathname !== INTRO_ROUTE || introPlayedThisSession) {
      setShouldPlay(false);
      setReady(true);
      return;
    }
    introPlayedThisSession = true;

    let seen: string | null = null;
    try {
      // Clear stale keys from previous intro versions.
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('mypdf.intro.seen.v') && key !== STORAGE_KEY) {
          localStorage.removeItem(key);
          i--;
        }
      }
      seen = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — play once */
    }
    setShouldPlay(!seen);
    setReady(true);
  }, [pathname]);

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return { ready, shouldPlay, markSeen };

}
