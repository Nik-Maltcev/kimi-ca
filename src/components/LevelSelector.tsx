import type { Difficulty } from '@/types/quiz';
import { getQuestionCount } from '@/data/questions';
import { Brain, Zap, Trophy, Sparkles, AlertCircle, BarChart3 } from 'lucide-react';

interface LevelSelectorProps {
  onSelect: (difficulty: Difficulty) => void;
  isAiAvailable: boolean;
  aiStatusMessage: string;
  onShowProgress: () => void;
}

const levels: {
  difficulty: Difficulty;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    difficulty: 'easy',
    label: 'Лёгкий уровень',
    description: 'Базовые определения и факты. Один правильный ответ.',
    icon: <Brain className="w-8 h-8" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    borderColor: 'border-emerald-200 hover:border-emerald-300',
  },
  {
    difficulty: 'medium',
    label: 'Средний уровень',
    description: 'Множественный выбор, сравнения, применение знаний.',
    icon: <Zap className="w-8 h-8" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200 hover:border-amber-300',
  },
  {
    difficulty: 'hard',
    label: 'Сложный уровень',
    description: 'Кейсовые задачи, комбинированные вопросы, глубокое понимание.',
    icon: <Trophy className="w-8 h-8" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100',
    borderColor: 'border-rose-200 hover:border-rose-300',
  },
];

export function LevelSelector({ onSelect, isAiAvailable, aiStatusMessage, onShowProgress }: LevelSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Тесты по Системному Анализу
          </h1>
          <p className="text-slate-600 text-lg">
            Выберите уровень сложности и начните проверку знаний
          </p>
          <p className="text-slate-500 text-sm mt-2">
            150+ вопросов по 7 темам
          </p>

          {/* AI Status Badge */}
          <div className="mt-4 flex justify-center">
            {isAiAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-генерация вопросов включена
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                {aiStatusMessage || 'Статичные вопросы (добавьте MOONSHOT_API_KEY для AI)'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {levels.map((level) => (
            <button
              key={level.difficulty}
              onClick={() => onSelect(level.difficulty)}
              className={`w-full p-6 rounded-2xl border-2 ${level.bgColor} ${level.borderColor} transition-all duration-200 flex items-center gap-5 text-left group cursor-pointer`}
            >
              <div className={`${level.color} p-3 rounded-xl bg-white shadow-sm`}>
                {level.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800 group-hover:text-slate-900">
                  {level.label}
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  {level.description}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${level.color}`}>
                  {getQuestionCount(level.difficulty)}
                </span>
                <p className="text-slate-500 text-xs">вопросов</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-700 mb-2">Темы тестов:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Тема 1: Требования
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Тема 2: Нотации моделирования
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Тема 3: Базы данных
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              Тема 4: Интеграция и API
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Тема 5: Архитектура
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              Тема 6: Методологии разработки
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Тема 7: Протоколы и безопасность
            </div>
          </div>
        </div>

        {/* Progress button */}
        <div className="mt-4">
          <button
            onClick={onShowProgress}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shadow-sm"
          >
            <BarChart3 className="w-5 h-5 text-violet-500" />
            Мой прогресс
          </button>
        </div>
      </div>
    </div>
  );
}
