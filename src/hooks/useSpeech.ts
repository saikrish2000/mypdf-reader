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

export const useSpeech = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettingsState] = useState<SpeechSettings>(loadSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);

  // Load voices (async on some browsers)
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
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  const stop = useCallback(() => {
    onEndRef.current = null;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      if (!text.trim()) {
        onEnd?.();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.rate;
      utterance.pitch = 1;
      const voice =
        voices.find(v => v.voiceURI === settings.voiceURI) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (voice) utterance.voice = voice;
      onEndRef.current = onEnd ?? null;
      utterance.onend = () => {
        setIsSpeaking(false);
        const cb = onEndRef.current;
        onEndRef.current = null;
        cb?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEndRef.current = null;
      };
      utteranceRef.current = utterance;
      setIsSpeaking(true);
      synth.speak(utterance);
    },
    [settings.rate, settings.voiceURI, voices]
  );

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { voices, settings, setSettings, speak, stop, isSpeaking };
};
