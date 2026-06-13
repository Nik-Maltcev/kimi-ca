import { easyQuestions } from './easyQuestions';
import { mediumQuestions } from './mediumQuestions';
import { hardQuestions } from './hardQuestions';
import type { Question, Difficulty } from '@/types/quiz';

export const questionsByDifficulty: Record<Difficulty, Question[]> = {
  easy: easyQuestions,
  medium: mediumQuestions,
  hard: hardQuestions,
};

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return questionsByDifficulty[difficulty];
}

export function getQuestionCount(difficulty: Difficulty): number {
  return questionsByDifficulty[difficulty].length;
}
