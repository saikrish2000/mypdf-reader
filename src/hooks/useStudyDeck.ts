import { useCallback, useState } from 'react';
import { getStorageFileId } from '@/lib/storageKeys';
import type { Flashcard, QuizQuestion } from '@/lib/types/external';

const STORAGE_KEY = 'pdf-reader-study:v1';

interface StudyDeck {
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  updatedAt: number;
}

type StudyStore = Record<string, StudyDeck>;

function readStore(): StudyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(data: StudyStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useStudyDeck(fileName: string, contentHash?: string) {
  const fileId = getStorageFileId(fileName, contentHash);
  const [version, setVersion] = useState(0);

  const deck: StudyDeck = readStore()[fileId] ?? {
    flashcards: [],
    quiz: [],
    updatedAt: 0,
  };

  const bump = () => setVersion((v) => v + 1);

  const saveFlashcards = useCallback(
    (cards: Flashcard[]) => {
      const store = readStore();
      store[fileId] = {
        ...store[fileId],
        flashcards: cards,
        quiz: store[fileId]?.quiz ?? [],
        updatedAt: Date.now(),
      };
      writeStore(store);
      bump();
    },
    [fileId],
  );

  const saveQuiz = useCallback(
    (questions: QuizQuestion[]) => {
      const store = readStore();
      store[fileId] = {
        flashcards: store[fileId]?.flashcards ?? [],
        quiz: questions,
        updatedAt: Date.now(),
      };
      writeStore(store);
      bump();
    },
    [fileId],
  );

  const addFlashcard = useCallback(
    (card: Flashcard) => {
      saveFlashcards([...deck.flashcards, card]);
    },
    [deck.flashcards, saveFlashcards],
  );

  return {
    flashcards: deck.flashcards,
    quiz: deck.quiz,
    saveFlashcards,
    saveQuiz,
    addFlashcard,
    version,
  };
}
