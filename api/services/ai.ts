import { env } from "../lib/env";
import { HttpClient } from "../lib/http";

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const httpClient = new HttpClient(env.moonshotApiUrl, {
  headers: env.moonshotApiKey
    ? { Authorization: `Bearer ${env.moonshotApiKey}` }
    : {},
});

export function isAiAvailable(): boolean {
  return !!env.moonshotApiKey;
}

export async function generateQuestions(
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  count: number = 5,
): Promise<
  Array<{
    question: string;
    options: string[];
    correctAnswers: number[];
    multipleCorrect: boolean;
  }>
> {
  if (!isAiAvailable()) {
    throw new Error("MOONSHOT_API_KEY not configured");
  }

  const difficultyDesc = {
    easy: "базовые определения, один правильный ответ",
    medium: "множественный выбор (несколько правильных ответов возможны), применение знаний",
    hard: "кейсовые задачи, глубокое понимание, несколько правильных ответов",
  };

  const prompt = `Сгенерируй ${count} вопросов по системному анализу на тему: "${topic}".
Уровень сложности: ${difficulty} — ${difficultyDesc[difficulty]}.

ВАЖНО: ответь ТОЛЬКО в формате JSON-массива, без markdown, без пояснений:
[
  {
    "question": "текст вопроса",
    "options": ["вариант A", "вариант B", "вариант C", "вариант D"],
    "correctAnswers": [0],
    "multipleCorrect": false
  }
]

Правила:
- options: ровно 4 варианта ответа
- correctAnswers: массив индексов правильных ответов (0-based)
- multipleCorrect: true если несколько правильных ответов, false если один
- Вопросы должны быть на РУССКОМ языке
- Не повторяй вопросы из типовых собеседований — придумывай оригинальные формулировки
- Варианты должны быть правдоподобными, но только correctAnswers — правильные`;

  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "Ты — эксперт по системному анализу. Генерируй точные, проверенные вопросы для тестирования знаний. Отвечай только JSON без markdown.",
    },
    { role: "user", content: prompt },
  ];

  const response = await httpClient.post<AIResponse>("/chat/completions", {
    model: "moonshot-v1-8k",
    messages,
    temperature: 0.8,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content || "[]";

  // Clean markdown code blocks if present
  const jsonStr = content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }
    return parsed.map((q: any) => ({
      question: String(q.question || ""),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correctAnswers: Array.isArray(q.correctAnswers)
        ? q.correctAnswers.map(Number)
        : [Number(q.correctAnswers)],
      multipleCorrect: !!q.multipleCorrect,
    }));
  } catch (e) {
    console.error("Failed to parse AI response:", content);
    throw new Error("Invalid AI response format");
  }
}

export async function generateQuestionsForAllTopics(
  difficulty: "easy" | "medium" | "hard",
): Promise<
  Array<{
    topic: string;
    question: string;
    options: string[];
    correctAnswers: number[];
    multipleCorrect: boolean;
  }>
> {
  const topics: Record<string, string[]> = {
    easy: [
      "Способы сбора требований (интервью, анкетирование, наблюдение)",
      "Стейкхолдеры проекта и их роли",
      "Виды требований: бизнес, пользовательские, функциональные, нефункциональные",
      "User Story и критерий INVEST",
      "ГОСТ 19 и ГОСТ 34",
      "BPMN нотация: элементы и шлюзы",
      "UML диаграммы: Use Case, Class, Sequence",
      "Реляционные базы данных: нормализация, ключи, связи",
      "ACID требования и транзакции",
      "SQL: JOIN, GROUP BY, HAVING",
      "REST API: методы, коды ответов, параметры",
      "SOAP vs REST",
      "Микросервисная архитектура vs монолит",
      "Scrum и Kanban методологии",
      "HTTP, HTTPS, JWT, шифрование",
    ],
    medium: [
      "Классификация нефункциональных требований (НФТ)",
      "User Story Map (USM)",
      "Use cases: структура, основной и альтернативный сценарии",
      "BPMN: типы шлюзов (XOR, AND, OR, событийные)",
      "Sequence диаграмма: фреймы (loop, alt, opt, par)",
      "Нормализация БД: 1НФ, 2НФ, 3НФ",
      "Денормализация: когда и зачем",
      "Индексы, партиционирование, шардирование, репликация",
      "REST: идемпотентность, stateless, кэширование",
      "GraphQL, WebSocket, gRPC, Webhook",
      "Kafka vs RabbitMQ, очереди vs топики",
      "ESB корпоративная шина",
      "CAP-теорема, Event Sourcing, API Gateway",
      "Scrum: роли, артефакты, мероприятия, спринты",
      "Оценка задач: Story Points vs часы, DoR, DoD, AC",
    ],
    hard: [
      "Критерии хороших требований: верификация vs валидация",
      "Шаблон постановки задачи: UI, бэкенд, интеграции",
      "BPMN: моделирование сложных процессов с ветвлениями",
      "Проектирование БД: ER-диаграммы, связи, оптимизация",
      "Интеграция систем: синхронная vs асинхронная, очереди",
      "REST API: версионирование, обратная совместимость, безопасность",
      "Микросервисы: хореография vs оркестрация, Saga pattern",
      "Безопасность: JWT, OAuth, шифрование, CSRF, XSS, CORS",
    ],
  };

  const selectedTopics = topics[difficulty] || topics.easy;
  const allQuestions: Array<{
    topic: string;
    question: string;
    options: string[];
    correctAnswers: number[];
    multipleCorrect: boolean;
  }> = [];

  // Generate 2-3 questions per topic
  for (const topic of selectedTopics) {
    try {
      const questions = await generateQuestions(topic, difficulty, 2);
      for (const q of questions) {
        if (
          q.question &&
          q.options.length === 4 &&
          q.correctAnswers.length > 0
        ) {
          allQuestions.push({ topic, ...q });
        }
      }
    } catch (e) {
      console.error(`Failed to generate for topic "${topic}":`, e);
    }
  }

  return allQuestions;
}
