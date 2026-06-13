export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswers: number[];
  topic: string;
  multipleCorrect: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface UserAnswer {
  questionId: number;
  selectedAnswers: number[];
}

export interface QuizState {
  difficulty: Difficulty | null;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  isFinished: boolean;
  wrongQuestionIds: number[];
  isRetryMode: boolean;
}
