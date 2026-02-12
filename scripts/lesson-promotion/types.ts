/**
 * Shared types for the lesson-promotion system.
 */

export interface Lesson {
  id: string;
  text: string;
  category: string;
  tier: 'local' | 'universal' | 'canon-candidate' | 'promoted';
  languages: string[];
  frameworks: string[];
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  sources: string[];
  promotedTo: string | null;
  promotedDate: string | null;
}

export interface Ledger {
  lessons: Lesson[];
  lastIngest: string;
}

export interface ClassificationResult {
  languages: string[];
  frameworks: string[];
}

export interface ParsedLesson {
  text: string;
  category: string;
}

export interface PromotionAction {
  lesson: Lesson;
  action: 'append-to-universal' | 'append-to-profile';
  target: string;
}
