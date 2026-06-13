import { useState, useCallback } from 'react';
import { LevelSelector } from '@/components/LevelSelector';
import { Quiz } from '@/components/Quiz';
import { Results } from '@/components/Results';
import { useQuestions } from '@/hooks/useQuestions';
import type { Difficulty, UserAnswer } from '@/types/quiz';
import './App.css';

type Screen = 'level' | 'quiz' | 'results';

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

  const handleFinishQuiz = useCallback((answers: UserAnswer[]) => {
    setLastAnswers(answers);
    setScreen('results');
  }, []);

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
          questions={questions}
          answers={lastAnswers}
          isAiAvailable={isAiAvailable}
          onRetryWrong={handleRetryWrong}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
