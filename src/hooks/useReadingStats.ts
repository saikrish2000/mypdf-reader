import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'pdf-reader:reading-stats:v1';
const TICK_MS = 5000;
const IDLE_MS = 60_000;

interface PersistedStats {
  daily: Record<string, number>; // YYYY-MM-DD -> seconds read
  perDocument: Record<
    string,
    {
      fileName: string;
      totalSeconds: number;
      pagesVisited: number[];
      lastReadIso: string;
    }
  >;
}

const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function loadStats(): PersistedStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { daily: {}, perDocument: {} };
    const parsed = JSON.parse(raw);
    return {
      daily: parsed.daily ?? {},
      perDocument: parsed.perDocument ?? {},
    };
  } catch {
    return { daily: {}, perDocument: {} };
  }
}

function saveStats(s: PersistedStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function computeStreaks(daily: Record<string, number>): { current: number; longest: number } {
  const days = Object.keys(daily)
    .filter((k) => (daily[k] ?? 0) > 0)
    .sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime();
    const cur = new Date(days[i]).getTime();
    const diffDays = Math.round((cur - prev) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // current streak: count back from today/yesterday
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const last = days[days.length - 1];
  if (last !== today && last !== yesterday) return { current: 0, longest };

  let current = 0;
  let cursor = new Date(last);
  while ((daily[todayKey(cursor)] ?? 0) > 0) {
    current += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return { current, longest };
}

/**
 * Tracks reading time globally + per document.
 * Pass null fileName to read stats without recording.
 */
export function useReadingStats(fileName: string | null) {
  const [stats, setStats] = useState<PersistedStats>(() => loadStats());
  const lastActivityRef = useRef<number>(Date.now());

  // Touch activity on user interaction
  useEffect(() => {
    if (!fileName) return;
    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener('scroll', onActivity, { passive: true, capture: true });
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('touchstart', onActivity, { passive: true });
    window.addEventListener('click', onActivity);
    return () => {
      window.removeEventListener('scroll', onActivity, true);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('click', onActivity);
    };
  }, [fileName]);

  // Tick: record seconds while tab visible AND recent activity
  useEffect(() => {
    if (!fileName) return;
    const seconds = TICK_MS / 1000;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivityRef.current > IDLE_MS) return;

      setStats((prev) => {
        const key = todayKey();
        const doc = prev.perDocument[fileName] ?? {
          fileName,
          totalSeconds: 0,
          pagesVisited: [],
          lastReadIso: new Date().toISOString(),
        };
        const next: PersistedStats = {
          daily: { ...prev.daily, [key]: (prev.daily[key] ?? 0) + seconds },
          perDocument: {
            ...prev.perDocument,
            [fileName]: {
              ...doc,
              totalSeconds: doc.totalSeconds + seconds,
              lastReadIso: new Date().toISOString(),
            },
          },
        };
        saveStats(next);
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [fileName]);

  const recordPageVisit = useCallback(
    (pageNumber: number) => {
      if (!fileName) return;
      setStats((prev) => {
        const doc = prev.perDocument[fileName] ?? {
          fileName,
          totalSeconds: 0,
          pagesVisited: [],
          lastReadIso: new Date().toISOString(),
        };
        if (doc.pagesVisited.includes(pageNumber)) return prev;
        const next: PersistedStats = {
          ...prev,
          perDocument: {
            ...prev.perDocument,
            [fileName]: { ...doc, pagesVisited: [...doc.pagesVisited, pageNumber] },
          },
        };
        saveStats(next);
        return next;
      });
    },
    [fileName],
  );

  const derived = useMemo(() => {
    const streaks = computeStreaks(stats.daily);
    const todaySeconds = stats.daily[todayKey()] ?? 0;
    const last30: { date: string; seconds: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const k = todayKey(d);
      last30.push({ date: k, seconds: stats.daily[k] ?? 0 });
    }
    const totalSeconds = Object.values(stats.daily).reduce((a, b) => a + b, 0);
    const topDocs = Object.values(stats.perDocument)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 5);
    return { ...streaks, todaySeconds, last30, totalSeconds, topDocs };
  }, [stats]);

  return { stats, recordPageVisit, ...derived };
}
