import { useMemo, useState } from 'react';
import type { UserAnswer, Question, Difficulty } from '@/types/quiz';
import { CheckCircle, XCircle, RotateCcw, Home, AlertTriangle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface ResultsProps {
  difficulty: Difficulty;
  questions: Question[];
  answers: UserAnswer[];
  isAiAvailable: boolean;
  onRetryWrong: (wrongQuestionIds: number[]) => void;
  onRestart: () => void;
}

export function Results({
  questions,
  answers,
  isAiAvailable,
  onRetryWrong,
  onRestart,
}: ResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const results = useMemo(() => {
    return questions.map((question) => {
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const selectedAnswers = userAnswer?.selectedAnswers || [];
      const isCorrect =
        selectedAnswers.length === question.correctAnswers.length &&
        selectedAnswers.every((a) => question.correctAnswers.includes(a));
      return { question, selectedAnswers, isCorrect };
    });
  }, [questions, answers]);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const wrongResults = results.filter((r) => !r.isCorrect);
  const wrongQuestionIds = wrongResults.map((r) => r.question.id);

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Отлично!', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (percentage >= 70) return { label: 'Хорошо', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 50) return { label: 'Удовлетворительно', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Нужно подучить', color: 'text-rose-600', bg: 'bg-rose-50' };
  };

  const grade = getGrade();

  const toggleExpand = (questionId: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Результаты теста</h2>
            {isAiAvailable && (
              <span className="inline-flex items-center gap-0.5 text-xs text-violet-500 bg-violet-50 px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className={`${grade.bg} rounded-2xl p-6 text-center`}>
              <div className={`text-5xl font-bold ${grade.color} mb-2`}>
                {percentage}%
              </div>
              <div className={`text-lg font-medium ${grade.color}`}>
                {grade.label}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
              <div className="text-xs text-emerald-700">Верно</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-rose-600">{wrongResults.length}</div>
              <div className="text-xs text-rose-700">Неверно</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-slate-600">{questions.length}</div>
              <div className="text-xs text-slate-700">Всего</div>
            </div>
          </div>

          {/* Topic breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">По темам:</h3>
            <div className="space-y-2">
              {Array.from(new Set(questions.map((q) => q.topic))).map((topic) => {
                const topicQuestions = questions.filter((q) => q.topic === topic);
                const topicCorrect = topicQuestions.filter((q) => {
                  const userAnswer = answers.find((a) => a.questionId === q.id);
                  const selected = userAnswer?.selectedAnswers || [];
                  return (
                    selected.length === q.correctAnswers.length &&
                    selected.every((a) => q.correctAnswers.includes(a))
                  );
                }).length;
                const topicPercent = topicQuestions.length > 0
                  ? Math.round((topicCorrect / topicQuestions.length) * 100)
                  : 0;
                return (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 flex-1 truncate">{topic}</span>
                    <div className="w-24 bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          topicPercent >= 70 ? 'bg-emerald-400' : topicPercent >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${topicPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-10 text-right">
                      {topicCorrect}/{topicQuestions.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {wrongResults.length > 0 && (
              <button
                onClick={() => onRetryWrong(wrongQuestionIds)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Исправить ошибки ({wrongResults.length})
              </button>
            )}
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              На главную
            </button>
          </div>
        </div>

        {/* Wrong Answers Detail */}
        {wrongResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Вопросы, требующие внимания
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Правильные ответы скрыты. Разверните вопрос, чтобы увидеть ваш выбор.
            </p>

            <div className="space-y-4">
              {wrongResults.map(({ question, selectedAnswers }) => {
                const isExpanded = expandedQuestions.has(question.id);
                return (
                  <div
                    key={question.id}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpand(question.id)}
                      className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs text-slate-500 font-medium">{question.topic}</span>
                        <p className="text-sm text-slate-700 mt-1">{question.question}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="space-y-2 ml-8">
                          {question.options.map((option, optIndex) => {
                            const isSelected = selectedAnswers.includes(optIndex);
                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg text-sm ${
                                  isSelected
                                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                                    : 'bg-slate-50 border border-slate-100 text-slate-600'
                                }`}
                              >
                                <span className="font-medium mr-2">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                {option}
                                {isSelected && (
                                  <span className="ml-2 text-xs text-rose-500 font-medium">
                                    (ваш выбор)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All correct message */}
        {wrongResults.length === 0 && questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Идеальный результат!
            </h3>
            <p className="text-slate-600">
              Вы ответили верно на все вопросы. Попробуйте следующий уровень сложности!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
