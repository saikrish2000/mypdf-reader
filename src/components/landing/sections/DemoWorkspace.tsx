import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Library, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeIn } from '@/lib/landing/motion';

const TABS = ['Chat', 'Summary', 'Highlights', 'Notes', 'Flashcards'] as const;
type Tab = (typeof TABS)[number];

const HIGHLIGHT_CHIPS = ['Important definition', 'Exam tip', 'Key formula'] as const;

function buildTabContent(textSize: string, compact = false): Record<Tab, ReactNode> {
  const pad = compact ? 'px-2 py-1' : 'px-3 py-2';
  const gap = compact ? 'space-y-1' : 'space-y-3';

  return {
    Chat: (
      <div className={gap}>
        <div className={cn('rounded-md bg-muted text-muted-foreground line-clamp-2', pad, textSize)}>
          What is the main argument on this page?
        </div>
        <div className={cn('rounded-md border border-accent/30 bg-accent/10 text-foreground line-clamp-2', pad, textSize)}>
          Active recall improves retention more than passive re-reading…
        </div>
      </div>
    ),
    Summary: (
      <ul className={cn(compact ? 'space-y-0.5' : 'space-y-2', 'text-muted-foreground', textSize)}>
        <li className="flex gap-1 line-clamp-1"><span className="text-accent shrink-0">•</span> Spaced repetition</li>
        <li className="flex gap-1 line-clamp-1"><span className="text-accent shrink-0">•</span> Study techniques</li>
        {!compact && (
          <li className="flex gap-1"><span className="text-accent shrink-0">•</span> Practical tips for exam prep</li>
        )}
      </ul>
    ),
    Highlights: (
      <div className={compact ? 'space-y-0.5' : 'space-y-2'}>
        {(compact ? HIGHLIGHT_CHIPS.slice(0, 2) : HIGHLIGHT_CHIPS).map((label, i) => (
          <div
            key={label}
            className={cn(
              'rounded font-medium text-foreground line-clamp-1',
              compact ? 'px-1.5 py-0.5' : 'px-2 py-1.5',
              textSize,
              i === 0 && 'bg-yellow-300/70 dark:bg-yellow-500/30',
              i === 1 && 'bg-green-300/70 dark:bg-green-500/30',
              i === 2 && 'bg-blue-300/70 dark:bg-blue-500/30',
            )}
          >
            {label}
          </div>
        ))}
      </div>
    ),
    Notes: (
      <div className={cn('rounded-md border border-border bg-muted', compact ? 'p-1.5' : 'p-3')}>
        <p className={cn('font-medium text-foreground', compact ? 'text-[9px] mb-0.5' : 'text-[10px] mb-1')}>
          Page 12 note
        </p>
        <p className={cn('text-muted-foreground line-clamp-2', textSize)}>
          Review before the midterm — chapter 4.
        </p>
      </div>
    ),
    Flashcards: (
      <div className={cn(
        'rounded-md border border-accent/30 bg-muted text-center flex flex-col justify-center',
        compact ? 'p-2 min-h-[44px]' : 'p-4 min-h-[80px]',
      )}>
        <p className={cn('uppercase tracking-wider text-accent', compact ? 'text-[8px] mb-0.5' : 'text-[10px] mb-1')}>
          Question
        </p>
        <p className={cn('font-medium text-foreground line-clamp-1', textSize)}>What is active recall?</p>
      </div>
    ),
  };
}

interface DemoWorkspaceProps {
  variant?: 'default' | 'hero' | 'compact' | 'heroPanel';
  embedded?: boolean;
}

export default function DemoWorkspace({ variant = 'default', embedded = false }: DemoWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Chat');
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<'reader' | 'library'>('reader');

  const isHeroPanel = variant === 'heroPanel';
  const isCompact = variant === 'compact';
  const isHero = variant === 'hero';
  const isSmall = isCompact || isHeroPanel;
  const labelSize = isCompact ? 'text-[9px]' : isHeroPanel ? 'text-[10px]' : isHero ? 'text-xs' : 'text-[10px]';
  const tabSize = isCompact ? 'text-[8px]' : isHeroPanel ? 'text-[9px]' : isHero ? 'text-xs' : 'text-[10px]';
  const tabContent = buildTabContent(
    isCompact ? 'text-[9px]' : isHeroPanel ? 'text-[10px]' : isHero ? 'text-xs' : 'text-[10px]',
    isSmall,
  );

  const cycleTab = useCallback(() => {
    setActiveTab((prev) => TABS[(TABS.indexOf(prev) + 1) % TABS.length]);
  }, []);

  useEffect(() => {
    if (paused || view !== 'reader') return;
    const id = setInterval(cycleTab, 4000);
    return () => clearInterval(id);
  }, [paused, cycleTab, view]);

  const activeViewClass = 'bg-accent/15 text-accent';
  const inactiveViewClass = 'text-muted-foreground hover:text-foreground';

  return (
    <div
      className={cn(
        'overflow-hidden bg-card',
        isCompact && 'text-[9px]',
        isHeroPanel && 'flex h-full min-h-0 flex-col text-[10px]',
        !embedded && 'rounded-2xl border border-border shadow-lg',
      )}
    >
      {/* Title bar */}
      <div className={cn(
        'flex shrink-0 items-center gap-2 border-b border-border bg-muted/30',
        isCompact && 'h-6 px-2',
        isHeroPanel && 'h-7 px-2.5',
        !isSmall && 'px-4 py-2.5',
      )}>
        <div className="flex shrink-0 items-center gap-0.5">
          <span className={cn('rounded-full bg-red-500', isCompact ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5')} />
          <span className={cn('rounded-full bg-yellow-500', isCompact ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5')} />
          <span className={cn('rounded-full bg-green-500', isCompact ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5')} />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setView('reader')}
            className={cn(
              'inline-flex items-center gap-0.5 rounded font-medium transition-colors',
              isSmall ? 'px-1.5 py-0.5' : 'px-2 py-0.5',
              tabSize,
              view === 'reader' ? activeViewClass : inactiveViewClass,
            )}
          >
            <BookOpen className={isCompact ? 'h-2 w-2' : isHeroPanel ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
            Reader
          </button>
          <button
            type="button"
            onClick={() => setView('library')}
            className={cn(
              'inline-flex items-center gap-0.5 rounded font-medium transition-colors',
              isSmall ? 'px-1.5 py-0.5' : 'px-2 py-0.5',
              tabSize,
              view === 'library' ? activeViewClass : inactiveViewClass,
            )}
          >
            <Library className={isCompact ? 'h-2 w-2' : isHeroPanel ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
            Library
          </button>
        </div>
        {!isCompact && !isHeroPanel && (
          <span className={cn('shrink-0 font-mono text-muted-foreground hidden sm:block', labelSize)}>
            {view === 'reader' ? 'mypdf.reader/read' : 'mypdf.reader/library'}
          </span>
        )}
      </div>

      {view === 'reader' ? (
        <div className={cn(
          'grid min-h-0 overflow-hidden',
          isCompact && 'h-[88px] grid-cols-[minmax(0,1fr)_112px]',
          isHeroPanel && 'h-[104px] grid-cols-[minmax(0,1fr)_120px]',
          !isSmall && 'md:grid-cols-[1fr_200px] lg:grid-cols-[1fr_240px]',
          !isSmall && (isHero ? 'min-h-[320px]' : 'min-h-[300px]'),
        )}>
          {/* Reader pane */}
          <div className={cn(
            'min-w-0 border-r border-border overflow-hidden',
            isCompact && 'p-1.5',
            isHeroPanel && 'p-2',
            !isSmall && 'border-b md:border-b-0 p-4 sm:p-5',
          )}>
            <div className={cn('flex items-center justify-between gap-1', isSmall ? 'mb-1' : 'mb-3')}>
              <p className={cn('font-medium text-foreground truncate', labelSize)}>
                {isCompact ? 'Cognitive Psychology — Ch. 4' : 'Cognitive Psychology — Ch. 4'}
              </p>
              <span className={cn('shrink-0 font-medium text-accent', labelSize)}>p.12/248</span>
            </div>
            <div className={cn('rounded-full bg-muted overflow-hidden', isSmall ? 'h-0.5 mb-1.5' : 'h-1.5 mb-4')}>
              <div className="h-full w-[38%] rounded-full bg-accent" />
            </div>
            <div className={cn(
              'rounded border border-border bg-paper shadow-document overflow-hidden',
              isCompact && 'p-1 space-y-0.5',
              isHeroPanel && 'p-2 space-y-1',
              !isSmall && 'p-4 min-h-[160px] space-y-2',
            )}>
              {!isSmall && <div className={cn('w-full rounded bg-muted', 'h-2')} />}
              {isSmall && <div className={cn('w-full rounded bg-muted', isHeroPanel ? 'h-1.5' : 'h-1')} />}
              <span
                className={cn(
                  'inline-block rounded font-semibold text-foreground',
                  'bg-yellow-300/80 dark:bg-yellow-500/40',
                  isCompact && 'px-1 py-px text-[8px] leading-tight',
                  isHeroPanel && 'px-1.5 py-0.5 text-[9px]',
                  !isSmall && 'px-2 py-0.5',
                  !isSmall && labelSize,
                )}
              >
                Highlighted passage
              </span>
              <div className={cn('w-3/4 rounded bg-muted/80', isSmall ? (isHeroPanel ? 'h-1' : 'h-0.5') : 'h-2')} />
            </div>
          </div>

          {/* AI panel */}
          <div className={cn(
            'flex min-w-0 flex-col overflow-hidden bg-muted/20',
            isCompact && 'p-1',
            isHeroPanel && 'p-2',
            !isSmall && 'p-3 sm:p-4',
          )}>
            <div className={cn('flex items-center gap-0.5 shrink-0', isSmall ? 'mb-1' : 'mb-3')}>
              <Sparkles className={cn('text-accent shrink-0', isCompact ? 'h-2 w-2' : isHeroPanel ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
              <span className={cn('font-semibold uppercase tracking-wide text-accent truncate', labelSize)}>AI</span>
            </div>
            <div
              role="tablist"
              aria-label="AI panel views"
              className={cn('flex flex-wrap shrink-0', isSmall ? 'gap-0.5 mb-1' : 'gap-1 mb-3')}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => { setActiveTab(tab); setPaused(true); }}
                  className={cn(
                    'rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                    isCompact && 'px-1 py-0.5 leading-none',
                    isHeroPanel && 'min-h-[28px] px-1.5 py-1 leading-none',
                    !isSmall && 'px-2 py-1',
                    tabSize,
                    activeTab === tab ? activeViewClass : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isHeroPanel ? (
                    <>
                      <span className="hidden min-[360px]:inline">{tab}</span>
                      <span className="min-[360px]:hidden">{tab.slice(0, 3)}</span>
                    </>
                  ) : (
                    tab
                  )}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="h-full overflow-hidden"
                >
                  {tabContent[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(
          'overflow-hidden',
          isCompact && 'h-[88px] p-1.5',
          isHeroPanel && 'h-[104px] p-2',
          !isSmall && 'p-5 sm:p-6',
          !isSmall && (isHero ? 'min-h-[320px]' : 'min-h-[300px]'),
        )}>
          <p className={cn('font-medium text-foreground', isCompact && 'text-[9px] mb-1', isHeroPanel && 'text-[10px] mb-1.5', !isSmall && 'text-sm mb-4')}>
            My Study Library
          </p>
          <div className={cn(
            'flex items-end',
            isCompact && 'gap-1 h-[36px]',
            isHeroPanel && 'gap-2 h-[48px]',
            !isSmall && 'flex-wrap gap-4 min-h-[140px] pb-3',
          )}>
            {(isCompact
              ? [
                  { title: 'Organic', color: 'from-emerald-500 to-teal-600' },
                  { title: 'ML', color: 'from-amber-400 to-orange-500' },
                ]
              : isHeroPanel
                ? [
                    { title: 'Organic', color: 'from-emerald-500 to-teal-600' },
                    { title: 'ML', color: 'from-amber-400 to-orange-500' },
                    { title: 'History', color: 'from-blue-500 to-indigo-600' },
                  ]
              : [
                  { title: 'Organic Chem', color: 'from-emerald-500 to-teal-600', progress: 72 },
                  { title: 'ML Basics', color: 'from-amber-400 to-orange-500', progress: 45 },
                  { title: 'World History', color: 'from-blue-500 to-indigo-600', progress: 18 },
                  { title: 'Physics II', color: 'from-rose-500 to-pink-600', progress: 91 },
                ]
            ).map((book) => (
              <div
                key={book.title}
                className={cn(
                  'aspect-[612/792] rounded-sm shadow-md bg-gradient-to-br flex flex-col justify-end',
                  book.color,
                  isCompact && 'w-9 p-0.5',
                  isHeroPanel && 'w-11 p-1',
                  !isSmall && 'w-[72px] sm:w-[80px] p-1.5',
                )}
              >
                <p className={cn(
                  'font-semibold text-white leading-none line-clamp-2',
                  isCompact && 'text-[6px]',
                  isHeroPanel && 'text-[7px]',
                  !isSmall && 'text-[8px]',
                )}>
                  {book.title}
                </p>
                {!isCompact && !isHeroPanel && 'progress' in book && (
                  <div className="mt-1.5 h-0.5 rounded-full bg-black/30 overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${(book as { progress: number }).progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {!isSmall && (
            <>
              <div className="bookshelf-plank h-2.5 rounded-sm mx-1" aria-hidden />
              <div className="bookshelf-plank-edge h-1 rounded-b-md mx-2 -mt-px opacity-80" aria-hidden />
              <p className={cn('text-center text-muted-foreground mt-4', labelSize)}>
                Your uploads appear here — synced with the home page shelf
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
