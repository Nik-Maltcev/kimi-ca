import { useMemo } from 'react';
import { getSessions, getSessionsByDate, getStreak, getTotalStats } from '@/lib/progress';
import type { QuizSession } from '@/lib/progress';
import { ChevronLeft, Flame, Target, BookOpen, TrendingUp } from 'lucide-react';

interface ProgressProps {
  onBack: () => void;
}

export function Progress({ onBack }: ProgressProps) {
  const sessions = useMemo(() => getSessions(), []);
  const byDate = useMemo(() => getSessionsByDate(), []);
  const streak = useMemo(() => getStreak(), []);
  const stats = useMemo(() => getTotalStats(), []);

  // Generate calendar grid for last 12 weeks (84 days)
  const calendarDays = useMemo(() => {
    const days: { date: string; count: number; sessions: QuizSession[] }[] = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const daySessions = byDate[key] || [];
      days.push({ date: key, count: daySessions.length, sessions: daySessions });
    }
    return days;
  }, [byDate]);

  // Recent sessions (last 10)
  const recentSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [sessions]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count === 1) return 'bg-emerald-200';
    if (count === 2) return 'bg-emerald-300';
    if (count <= 4) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'hard': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Лёгкий';
      case 'medium': return 'Средний';
      case 'hard': return 'Сложный';
      default: return difficulty;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Мой прогресс</h1>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{streak}</div>
            <div className="text-xs text-slate-500">дней подряд</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-xs text-slate-500">тестов</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{stats.totalCorrect}</div>
            <div className="text-xs text-slate-500">верных ответов</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <TrendingUp className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{stats.avgPercentage}%</div>
            <div className="text-xs text-slate-500">средний балл</div>
          </div>
        </div>

        {/* Activity calendar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Активность (12 недель)</h3>
          <div className="grid grid-cols-12 gap-1">
            {calendarDays.map((day) => (
              <div
                key={day.date}
                className={`aspect-square rounded-sm ${getIntensityClass(day.count)} transition-colors`}
                title={`${formatDate(day.date)}: ${day.count} тест(ов)`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-xs text-slate-500">Меньше</span>
            <div className="w-3 h-3 rounded-sm bg-slate-100" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200" />
            <div className="w-3 h-3 rounded-sm bg-emerald-300" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-slate-500">Больше</span>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Последние тесты</h3>
          {recentSessions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              Пока нет пройденных тестов. Начните тест, чтобы увидеть прогресс!
            </p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyBadge(session.difficulty)}`}>
                        {getDifficultyLabel(session.difficulty)}
                      </span>
                      {session.isRetry && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                          повтор
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(session.date)} · {session.correctAnswers}/{session.totalQuestions} верно
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${
                    session.percentage >= 70 ? 'text-emerald-600' :
                    session.percentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {session.percentage}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
