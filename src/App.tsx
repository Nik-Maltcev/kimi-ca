import { useState, useCallback } from 'react';
import { LevelSelector } from '@/components/LevelSelector';
import { Quiz } from '@/components/Quiz';
import { Results } from '@/components/Results';
import { Progress } from '@/components/Progress';
import { useQuestions } from '@/hooks/useQuestions';
import { saveSession } from '@/lib/progress';
import type { Difficulty, UserAnswer, Question } from '@/types/quiz';
import './App.css';

type Screen = 'level' | 'quiz' | 'results' | 'progress';

function App() {
  const [screen, setScreen] = useState<Screen>('level');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [lastAnswers, setLastAnswers] = useState<UserAnswer[]>([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [wrongQuestionIds, setWrongQuestionIds] = useState<number[]>([]);

  const {
    questions,
    isLoading,
    error,
    isAiAvailable,
    aiStatusMessage,
    seedStatic,
    isSeeding,
  } = useQuestions(difficulty);

  const handleSelectLevel = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setIsRetryMode(false);
    setWrongQuestionIds([]);
    setScreen('quiz');
  }, []);

  const getActiveQuestions = useCallback((): Question[] => {
    if (isRetryMode) {
      return questions.filter((q) => wrongQuestionIds.includes(q.id));
    }
    return questions;
  }, [questions, isRetryMode, wrongQuestionIds]);

  const handleFinishQuiz = useCallback((answers: UserAnswer[]) => {
    setLastAnswers(answers);

    // Save progress
    const activeQuestions = getActiveQuestions();
    const correctCount = activeQuestions.filter((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      const selected = userAnswer?.selectedAnswers || [];
      return (
        selected.length === q.correctAnswers.length &&
        selected.every((a) => q.correctAnswers.includes(a))
      );
    }).length;

    saveSession({
      difficulty: difficulty!,
      totalQuestions: activeQuestions.length,
      correctAnswers: correctCount,
      percentage: activeQuestions.length > 0
        ? Math.round((correctCount / activeQuestions.length) * 100)
        : 0,
      isRetry: isRetryMode,
    });

    setScreen('results');
  }, [difficulty, isRetryMode, getActiveQuestions]);

  const handleRetryWrong = useCallback((ids: number[]) => {
    setWrongQuestionIds(ids);
    setIsRetryMode(true);
    setScreen('quiz');
  }, []);

  const handleRestart = useCallback(() => {
    setDifficulty(null);
    setIsRetryMode(false);
    setWrongQuestionIds([]);
    setLastAnswers([]);
    setScreen('level');
  }, []);

  const handleExitQuiz = useCallback(() => {
    setScreen('level');
    setDifficulty(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'level' && (
        <LevelSelector
          onSelect={handleSelectLevel}
          isAiAvailable={isAiAvailable}
          aiStatusMessage={aiStatusMessage}
          onShowProgress={() => setScreen('progress')}
        />
      )}

      {screen === 'quiz' && difficulty && (
        <Quiz
          difficulty={difficulty}
          questions={questions}
          isLoading={isLoading}
          isRetryMode={isRetryMode}
          wrongQuestionIds={wrongQuestionIds}
          dbError={error}
          isAiAvailable={isAiAvailable}
          onSeedStatic={seedStatic}
          isSeeding={isSeeding}
          onFinish={handleFinishQuiz}
          onExit={handleExitQuiz}
        />
      )}

      {screen === 'results' && difficulty && (
        <Results
          difficulty={difficulty}
          questions={
            isRetryMode
              ? questions.filter((q) => wrongQuestionIds.includes(q.id))
              : questions
          }
          answers={lastAnswers}
          isAiAvailable={isAiAvailable}
          onRetryWrong={handleRetryWrong}
          onRestart={handleRestart}
        />
      )}

      {screen === 'progress' && (
        <Progress onBack={() => setScreen('level')} />
      )}
    </div>
  );
}

export default App;
