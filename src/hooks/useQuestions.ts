import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/providers/trpc';
import { getQuestionsByDifficulty } from '@/data/questions';
import type { Question, Difficulty } from '@/types/quiz';

interface UseQuestionsReturn {
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  isAiAvailable: boolean;
  aiStatusMessage: string;
  seedStatic: () => void;
  isSeeding: boolean;
}

export function useQuestions(difficulty: Difficulty | null): UseQuestionsReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check AI status
  const { data: aiStatus } = trpc.ai.status.useQuery();
  const isAiAvailable = aiStatus?.available ?? false;

  // Fetch questions from DB
  const { data: dbQuestions, isLoading: isLoadingDb, error: dbError } =
    trpc.ai.list.useQuery(
      { difficulty: difficulty!, limit: 50 },
      { enabled: !!difficulty },
    );

  // Seed static questions mutation
  const seedMutation = trpc.ai.seedStatic.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  useEffect(() => {
    if (!difficulty) {
      setQuestions([]);
      return;
    }

    // If DB has questions, use them
    if (dbQuestions && dbQuestions.length > 0) {
      const mapped: Question[] = dbQuestions.map((q) => ({
        id: q.id + 10000, // offset to avoid conflicts
        question: q.question,
        options: q.options as string[],
        correctAnswers: q.correctAnswers as number[],
        topic: q.topic,
        multipleCorrect: q.multipleCorrect,
      }));

      // Shuffle for variety
      const shuffled = [...mapped].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, 50));
      setError(null);
      return;
    }

    // Fallback to static questions
    if (!isLoadingDb) {
      const staticQuestions = getQuestionsByDifficulty(difficulty);
      // Shuffle for variety
      const shuffled = [...staticQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);

      if (dbError) {
        setError("Using local questions (DB unavailable)");
      }
    }
  }, [difficulty, dbQuestions, isLoadingDb, dbError]);

  const seedStatic = useCallback(() => {
    if (difficulty) {
      seedMutation.mutate({ difficulty });
    }
  }, [difficulty, seedMutation]);

  return {
    questions,
    isLoading: isLoadingDb,
    error,
    isAiAvailable,
    aiStatusMessage: aiStatus?.message || "",
    seedStatic,
    isSeeding: seedMutation.isPending,
  };
}
