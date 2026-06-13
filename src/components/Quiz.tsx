import { useState, useCallback } from 'react';
import type { Question, UserAnswer, Difficulty } from '@/types/quiz';
import { ChevronRight, ChevronLeft, Flag, AlertCircle, Loader2, Database, Sparkles } from 'lucide-react';

interface QuizProps {
  difficulty: Difficulty;
  questions: Question[];
  isLoading: boolean;
  isRetryMode: boolean;
  wrongQuestionIds: number[];
  dbError: string | null;
  isAiAvailable: boolean;
  onSeedStatic: () => void;
  isSeeding: boolean;
  onFinish: (answers: UserAnswer[]) => void;
  onExit: () => void;
}

export function Quiz({
  difficulty,
  questions: allQuestions,
  isLoading,
  isRetryMode,
  wrongQuestionIds,
  dbError,
  isAiAvailable,
  onSeedStatic,
  isSeeding,
  onFinish,
  onExit,
}: QuizProps) {
  const questions = isRetryMode
    ? allQuestions.filter((q) => wrongQuestionIds.includes(q.id))
    : allQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion
    ? answers.find((a) => a.questionId === currentQuestion.id)
    : null;

  const handleOptionToggle = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion) return;
      if (currentQuestion.multipleCorrect) {
        setSelectedOptions((prev) =>
          prev.includes(optionIndex)
            ? prev.filter((i) => i !== optionIndex)
            : [...prev, optionIndex]
        );
      } else {
        setSelectedOptions([optionIndex]);
      }
    },
    [currentQuestion]
  );

  const saveCurrentAnswer = useCallback(() => {
    if (!currentQuestion || selectedOptions.length === 0) return;
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== currentQuestion.id);
      return [
        ...filtered,
        { questionId: currentQuestion.id, selectedAnswers: [...selectedOptions] },
      ];
    });
  }, [selectedOptions, currentQuestion]);

  const goToNext = useCallback(() => {
    saveCurrentAnswer();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      const nextQuestion = questions[currentIndex + 1];
      const nextAnswer = answers.find((a) => a.questionId === nextQuestion?.id);
      setSelectedOptions(nextAnswer ? nextAnswer.selectedAnswers : []);
    }
  }, [currentIndex, questions, answers, saveCurrentAnswer]);

  const goToPrev = useCallback(() => {
    saveCurrentAnswer();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      const prevQuestion = questions[currentIndex - 1];
      const prevAnswer = answers.find((a) => a.questionId === prevQuestion?.id);
      setSelectedOptions(prevAnswer ? prevAnswer.selectedAnswers : []);
    }
  }, [currentIndex, questions, answers, saveCurrentAnswer]);

  const goToQuestion = useCallback(
    (index: number) => {
      saveCurrentAnswer();
      setCurrentIndex(index);
      const targetQuestion = questions[index];
      const targetAnswer = answers.find((a) => a.questionId === targetQuestion?.id);
      setSelectedOptions(targetAnswer ? targetAnswer.selectedAnswers : []);
    },
    [questions, answers, saveCurrentAnswer]
  );

  const handleFinish = useCallback(() => {
    saveCurrentAnswer();
    const finalAnswers = [...answers];
    if (currentQuestion && selectedOptions.length > 0) {
      const existing = finalAnswers.find((a) => a.questionId === currentQuestion.id);
      if (!existing) {
        finalAnswers.push({
          questionId: currentQuestion.id,
          selectedAnswers: [...selectedOptions],
        });
      }
    }
    onFinish(finalAnswers);
  }, [saveCurrentAnswer, answers, currentQuestion, selectedOptions, onFinish]);

  const isAnswered =
    selectedOptions.length > 0 ||
    (currentAnswer && currentAnswer.selectedAnswers.length > 0);

  const answeredCount =
    answers.filter((a) => a.selectedAnswers.length > 0).length +
    (selectedOptions.length > 0 &&
    currentQuestion &&
    !answers.find((a) => a.questionId === currentQuestion.id)
      ? 1
      : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Вопросы не найдены
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            {dbError || 'В базе данных пока нет вопросов для этого уровня.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onSeedStatic}
              disabled={isSeeding}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSeeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Загрузить статичные вопросы в БД
            </button>
            <button
              onClick={onExit}
              className="text-slate-500 text-sm hover:text-slate-700 transition-colors cursor-pointer"
            >
              Назад
            </button>
          </div>
          {!isAiAvailable && (
            <p className="text-xs text-slate-400 mt-4">
              Добавьте MOONSHOT_API_KEY в .env для AI-генерации уникальных вопросов
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onExit}
                className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-semibold text-slate-800">
                  {difficulty === 'easy' && 'Лёгкий уровень'}
                  {difficulty === 'medium' && 'Средний уровень'}
                  {difficulty === 'hard' && 'Сложный уровень'}
                  {isRetryMode && ' — Исправление ошибок'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500">{currentQuestion?.topic}</p>
                  {isAiAvailable && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-violet-500">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-slate-600">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
          <div className="flex items-start gap-3 mb-6">
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-lg shrink-0 mt-1">
              Вопрос {currentIndex + 1}
            </span>
            {currentQuestion?.multipleCorrect && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-lg shrink-0 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Несколько вариантов
              </span>
            )}
          </div>

          <h3 className="text-lg font-medium text-slate-800 mb-6 leading-relaxed">
            {currentQuestion?.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedOptions.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => handleOptionToggle(index)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50 text-blue-800'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-slate-300 text-transparent'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              currentIndex === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={goToNext}
              disabled={!isAnswered}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isAnswered
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Далее
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-colors cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              Завершить
            </button>
          )}
        </div>

        {/* Question navigator */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Навигатор</span>
            <span className="text-xs text-slate-500">
              Отвечено: {answeredCount} из {questions.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => {
              const hasAnswer = answers.find(
                (a) => a.questionId === q.id && a.selectedAnswers.length > 0
              );
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-500 text-white shadow-sm'
                      : hasAnswer
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirm finish modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Завершить тест?
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              Вы ответили на {answeredCount} из {questions.length} вопросов.
              {answeredCount < questions.length &&
                ' Неотвеченные вопросы будут засчитаны как неверные.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Продолжить
              </button>
              <button
                onClick={() => {
                  setShowConfirmFinish(false);
                  handleFinish();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
