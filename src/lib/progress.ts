import type { Difficulty } from '@/types/quiz';

export interface QuizSession {
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  difficulty: Difficulty;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  isRetry: boolean;
}

const STORAGE_KEY = 'kimi-quiz-progress';

export function saveSession(session: Omit<QuizSession, 'date' | 'timestamp'>): void {
  const now = new Date();
  const entry: QuizSession = {
    ...session,
    date: now.toISOString().split('T')[0],
    timestamp: now.getTime(),
  };
  const sessions = getSessions();
  sessions.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSessions(): QuizSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSessionsByDate(): Record<string, QuizSession[]> {
  const sessions = getSessions();
  const byDate: Record<string, QuizSession[]> = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }
  return byDate;
}

export function getStreak(): number {
  const byDate = getSessionsByDate();
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (byDate[key] && byDate[key].length > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function getTotalStats() {
  const sessions = getSessions();
  const total = sessions.length;
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const avgPercentage = total > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.percentage, 0) / total)
    : 0;
  return { total, totalQuestions, totalCorrect, avgPercentage };
}
