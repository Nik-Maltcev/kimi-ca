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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check AI status
  const { data: aiStatus } = trpc.ai.status.useQuery();
  const isAiAvailable = aiStatus?.available ?? false;

  // AI generation mutation
  const generateMutation = trpc.ai.generate.useMutation();

  // Seed static questions mutation
  const seedMutation = trpc.ai.seedStatic.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  // Generate fresh questions via Kimi when difficulty changes
  useEffect(() => {
    if (!difficulty) {
      setQuestions([]);
      return;
    }

    // If AI is available, generate fresh questions every time
    if (isAiAvailable) {
      let cancelled = false;
      setIsLoading(true);
      setError(null);

      const topics: Record<Difficulty, string[]> = {
        easy: [
          "Способы сбора требований",
          "Стейкхолдеры проекта",
          "Виды требований",
          "User Story и INVEST",
          "BPMN нотация",
          "UML диаграммы",
          "Реляционные базы данных",
          "REST API основы",
          "Scrum и Kanban",
          "HTTP и безопасность",
        ],
        medium: [
          "Нефункциональные требования",
          "Use cases и сценарии",
          "BPMN шлюзы",
          "Sequence диаграммы",
          "Нормализация БД",
          "REST идемпотентность и stateless",
          "GraphQL и WebSocket",
          "Kafka vs RabbitMQ",
          "CAP-теорема",
          "Scrum артефакты и мероприятия",
        ],
        hard: [
          "Верификация vs валидация требований",
          "Проектирование сложных интеграций",
          "Микросервисы: Saga pattern",
          "Безопасность: OAuth, JWT, CORS",
          "Event Sourcing и CQRS",
          "Проектирование БД для высоких нагрузок",
          "API версионирование и обратная совместимость",
          "Хореография vs оркестрация",
        ],
      };

      const selectedTopics = topics[difficulty];
      // Use ALL topics, 3 questions each
      const topicsToGenerate = [...selectedTopics].sort(() => Math.random() - 0.5);

      async function generateAll() {
        const allQuestions: Question[] = [];
        let idCounter = 1;

        for (const topic of topicsToGenerate) {
          if (cancelled) return;
          try {
            const result = await generateMutation.mutateAsync({
              difficulty,
              topic,
              count: 3,
            });
            if (result.questions) {
              for (const q of result.questions) {
                allQuestions.push({
                  id: idCounter++,
                  question: q.question,
                  options: q.options,
                  correctAnswers: q.correctAnswers,
                  topic,
                  multipleCorrect: q.multipleCorrect,
                });
              }
            }
          } catch (e) {
            console.error(`Failed to generate for "${topic}":`, e);
          }
        }

        if (!cancelled) {
          if (allQuestions.length > 0) {
            // Shuffle the final set
            const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            setError(null);
          } else {
            // AI failed completely, fallback to static
            const staticQuestions = getQuestionsByDifficulty(difficulty);
            const shuffled = [...staticQuestions].sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            setError("AI не смог сгенерировать вопросы, используются статичные");
          }
          setIsLoading(false);
        }
      }

      generateAll();

      return () => {
        cancelled = true;
      };
    } else {
      // AI not available — use static questions
      const staticQuestions = getQuestionsByDifficulty(difficulty);
      const shuffled = [...staticQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setError(null);
    }
  }, [difficulty, isAiAvailable]);

  const seedStatic = useCallback(() => {
    if (difficulty) {
      seedMutation.mutate({ difficulty });
    }
  }, [difficulty, seedMutation]);

  return {
    questions,
    isLoading,
    error,
    isAiAvailable,
    aiStatusMessage: aiStatus?.message || "",
    seedStatic,
    isSeeding: seedMutation.isPending,
  };
}
