import { useCallback, useEffect, useRef, useState } from 'react';

const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export interface SpeechSettings {
  voiceURI: string | null;
  rate: number;
}

const SETTINGS_KEY = 'pdf-reader-speech-settings';

const loadSettings = (): SpeechSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore invalid stored settings
  }
  return { voiceURI: null, rate: 1 };
};

const splitIntoChunks = (text: string): string[] => {
  // Use a placeholder character unlikely to appear in normal text.
  // We use the Private Use Area character U+E000 to replace periods
  // that should NOT trigger a sentence split (abbreviations, decimals, etc.).
  const P = '\uE000';
  const raw = text
    .replace(/\s+/g, ' ')
    // Protect abbreviations from being split
    .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Ave|Blvd|Rd|Dr|Ln|Pt|Ch|Dept|Univ|Corp|Inc|Ltd|Co|Govt|Est|Approx|Apt|Bldg|Dept|Est|Hosp|Intl|Misc|No|Pkwy|Sq|Ste|Vs|Etc|Fig|Eq|Ref|Sec|Vol|Pg|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\./g,
      (m) => m.replace('.', P))
    // Protect acronyms with periods (e.g., U.S.A., F.B.I.)
    .replace(/(?:[A-Z]\.)+/g, (m) => m.replace(/\./g, P))
    // Protect decimal numbers
    .replace(/\b\d+\.\d+/g, (m) => m.replace('.', P))
    // Protect ellipsis
    .replace(/\.{3,}/g, (m) => m.replace(/\./g, P));

  const parts = raw.match(/[^.!?]+[.!?]+|\S+$/g) ?? [raw];
  const sentences = parts.map(s => s.trim()).filter(Boolean);

  // Restore protected periods
  return sentences.map(s => s.replace(/\uE000/g, '.'));
};

const CHUNKS_PER_SKIP = (rate: number) => Math.max(1, Math.round(2 / Math.max(rate, 0.25)));

export const useSpeech = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettingsState] = useState<SpeechSettings>(loadSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [unsupported, setUnsupported] = useState(!isSpeechSupported);

  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const onAllDoneRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef(settings);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const genRef = useRef(0);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { voicesRef.current = voices; }, [voices]);

  useEffect(() => {
    if (!isSpeechSupported) return;
    const synth = window.speechSynthesis;
    const update = () => {
      const v = synth.getVoices();
      if (v.length) setVoices(v);
    };
    update();
    synth.addEventListener('voiceschanged', update);
    return () => synth.removeEventListener('voiceschanged', update);
  }, []);

  const setSettings = useCallback((next: Partial<SpeechSettings>) => {
    setSettingsState(prev => {
      const merged = { ...prev, ...next };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged)); } catch {
        // ignore localStorage errors
      }
      return merged;
    });
  }, []);

  const speakChunkAt = useCallback((idx: number) => {
    if (!isSpeechSupported) return;
    const synth = window.speechSynthesis;
    const chunks = chunksRef.current;
    if (idx >= chunks.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      const cb = onAllDoneRef.current;
      onAllDoneRef.current = null;
      cb?.();
      return;
    }
    indexRef.current = idx;
    const gen = genRef.current;
    const utterance = new SpeechSynthesisUtterance(chunks[idx]);
    utterance.rate = settingsRef.current.rate;
    utterance.pitch = 1;
    const voice =
      voicesRef.current.find(v => v.voiceURI === settingsRef.current.voiceURI) ||
      voicesRef.current.find(v => v.lang.startsWith('en')) ||
      voicesRef.current[0];
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (gen !== genRef.current) return;
      if (!chunksRef.current.length) return;
      speakChunkAt(idx + 1);
    };
    utterance.onerror = () => {
      if (gen !== genRef.current) return;
      setIsSpeaking(false);
      setIsPaused(false);
    };
    setIsSpeaking(true);
    setIsPaused(false);
    synth.speak(utterance);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!isSpeechSupported) { onEnd?.(); return; }
    const trimmed = text.trim();
    if (!trimmed) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    genRef.current += 1;
    chunksRef.current = splitIntoChunks(trimmed);
    indexRef.current = 0;
    onAllDoneRef.current = onEnd ?? null;
    speakChunkAt(0);
  }, [speakChunkAt]);

  const pause = useCallback(() => {
    if (!isSpeechSupported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (!isSpeechSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (!isSpeechSupported) return;
    genRef.current += 1;
    chunksRef.current = [];
    indexRef.current = 0;
    onAllDoneRef.current = null;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const skipForward = useCallback(() => {
    if (!isSpeechSupported || !chunksRef.current.length) return;
    window.speechSynthesis.cancel();
    genRef.current += 1;
    const next = Math.min(
      chunksRef.current.length,
      indexRef.current + CHUNKS_PER_SKIP(settingsRef.current.rate)
    );
    speakChunkAt(next);
  }, [speakChunkAt]);

  const skipBackward = useCallback(() => {
    if (!isSpeechSupported || !chunksRef.current.length) return;
    window.speechSynthesis.cancel();
    genRef.current += 1;
    const prev = Math.max(0, indexRef.current - CHUNKS_PER_SKIP(settingsRef.current.rate));
    speakChunkAt(prev);
  }, [speakChunkAt]);

  useEffect(() => {
    if (!isSpeechSupported) return;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  return {
    voices,
    settings,
    setSettings,
    speak,
    stop,
    pause,
    resume,
    skipForward,
    skipBackward,
    isSpeaking,
    isPaused,
    unsupported,
  };
};
