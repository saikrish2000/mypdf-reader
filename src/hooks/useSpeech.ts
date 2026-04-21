import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechSettings {
  voiceURI: string | null;
  rate: number;
}

const SETTINGS_KEY = 'pdf-reader-speech-settings';

const loadSettings = (): SpeechSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { voiceURI: null, rate: 1 };
};

// Split text into sentence-sized chunks so we can skip ~10s reliably
const splitIntoChunks = (text: string): string[] => {
  const sentences = text
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+|\S+$/g) ?? [text];
  return sentences.map(s => s.trim()).filter(Boolean);
};

// Approx 150 wpm at 1x = 2.5 words/sec → 10s ≈ 25 words
const CHUNKS_PER_SKIP = (rate: number) => Math.max(1, Math.round(2 / Math.max(rate, 0.25)));

export const useSpeech = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettingsState] = useState<SpeechSettings>(loadSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const onAllDoneRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef(settings);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { voicesRef.current = voices; }, [voices]);

  useEffect(() => {
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
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged)); } catch {}
      return merged;
    });
  }, []);

  const speakChunkAt = useCallback((idx: number) => {
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
    const utterance = new SpeechSynthesisUtterance(chunks[idx]);
    utterance.rate = settingsRef.current.rate;
    utterance.pitch = 1;
    const voice =
      voicesRef.current.find(v => v.voiceURI === settingsRef.current.voiceURI) ||
      voicesRef.current.find(v => v.lang.startsWith('en')) ||
      voicesRef.current[0];
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      // If we were canceled (e.g. via skip/stop), don't auto-advance here
      if (!chunksRef.current.length) return;
      // Auto-advance to next chunk
      if (indexRef.current === idx) {
        speakChunkAt(idx + 1);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    synth.cancel();
    setIsSpeaking(true);
    setIsPaused(false);
    synth.speak(utterance);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    const trimmed = text.trim();
    if (!trimmed) {
      onEnd?.();
      return;
    }
    chunksRef.current = splitIntoChunks(trimmed);
    onAllDoneRef.current = onEnd ?? null;
    speakChunkAt(0);
  }, [speakChunkAt]);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    chunksRef.current = [];
    indexRef.current = 0;
    onAllDoneRef.current = null;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const skipForward = useCallback(() => {
    if (!chunksRef.current.length) return;
    const next = Math.min(
      chunksRef.current.length,
      indexRef.current + CHUNKS_PER_SKIP(settingsRef.current.rate)
    );
    speakChunkAt(next);
  }, [speakChunkAt]);

  const skipBackward = useCallback(() => {
    if (!chunksRef.current.length) return;
    const prev = Math.max(0, indexRef.current - CHUNKS_PER_SKIP(settingsRef.current.rate));
    speakChunkAt(prev);
  }, [speakChunkAt]);

  useEffect(() => {
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
  };
};
