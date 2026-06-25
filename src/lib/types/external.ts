export interface PdfTextItem {
  str?: string;
  transform?: number[];
  fontName?: string;
}

export interface SummarizePageResponse {
  summary?: string;
  error?: string;
  retryable?: boolean;
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions?: DictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryPhonetic {
  text?: string;
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings?: DictionaryMeaning[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  prompt: string;
  choices: string[];
  answerIndex: number;
}

export interface GenerateFlashcardsResponse {
  cards?: Flashcard[];
  error?: string;
  retryable?: boolean;
}

export interface GenerateQuizResponse {
  questions?: QuizQuestion[];
  error?: string;
  retryable?: boolean;
}

export type ChatScope = 'page' | 'range' | 'document';
