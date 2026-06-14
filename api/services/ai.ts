import { env } from "../lib/env";
import { HttpClient } from "../lib/http";
import { readFileSync } from "fs";
import { resolve } from "path";

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

// Load knowledge base files
const knowledgeFiles: Record<string, string> = {};

function loadKnowledge() {
  const topics = [
    "topic1-requirements",
    "topic2-modeling",
    "topic3-databases",
    "topic4-integration",
    "topic5-architecture",
    "topic6-methodologies",
    "topic7-security",
  ];

  for (const topic of topics) {
    try {
      const filePath = resolve(process.cwd(), `knowledge/${topic}.md`);
      knowledgeFiles[topic] = readFileSync(filePath, "utf-8");
    } catch (e) {
      console.error(`Failed to load knowledge file: ${topic}`, e);
    }
  }
}

loadKnowledge();

// Map topic keywords to knowledge files
function getRelevantKnowledge(topic: string): string {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes("требовани") || topicLower.includes("user story") || topicLower.includes("use case") || topicLower.includes("гост") || topicLower.includes("стейкхолдер") || topicLower.includes("srs") || topicLower.includes("верификац") || topicLower.includes("валидац") || topicLower.includes("invest") || topicLower.includes("артефакт") || topicLower.includes("постановк")) {
    return knowledgeFiles["topic1-requirements"] || "";
  }
  if (topicLower.includes("bpmn") || topicLower.includes("uml") || topicLower.includes("нотаци") || topicLower.includes("диаграмм") || topicLower.includes("sequence") || topicLower.includes("шлюз") || topicLower.includes("событи") || topicLower.includes("моделиров")) {
    return knowledgeFiles["topic2-modeling"] || "";
  }
  if (topicLower.includes("бд") || topicLower.includes("баз") || topicLower.includes("sql") || topicLower.includes("нормализ") || topicLower.includes("транзакц") || topicLower.includes("acid") || topicLower.includes("индекс") || topicLower.includes("ключ") || topicLower.includes("join") || topicLower.includes("шардир") || topicLower.includes("реплик") || topicLower.includes("партицион")) {
    return knowledgeFiles["topic3-databases"] || "";
  }
  if (topicLower.includes("api") || topicLower.includes("rest") || topicLower.includes("soap") || topicLower.includes("интеграц") || topicLower.includes("синхрон") || topicLower.includes("асинхрон") || topicLower.includes("kafka") || topicLower.includes("rabbit") || topicLower.includes("graphql") || topicLower.includes("websocket") || topicLower.includes("grpc") || topicLower.includes("webhook") || topicLower.includes("очеред") || topicLower.includes("шина") || topicLower.includes("xml") || topicLower.includes("json") || topicLower.includes("идемпотент") || topicLower.includes("http") || topicLower.includes("метод")) {
    return knowledgeFiles["topic4-integration"] || "";
  }
  if (topicLower.includes("архитектур") || topicLower.includes("микросервис") || topicLower.includes("монолит") || topicLower.includes("soa") || topicLower.includes("хореограф") || topicLower.includes("оркестрац") || topicLower.includes("cap") || topicLower.includes("gateway") || topicLower.includes("баланс") || topicLower.includes("event sourc")) {
    return knowledgeFiles["topic5-architecture"] || "";
  }
  if (topicLower.includes("методолог") || topicLower.includes("scrum") || topicLower.includes("kanban") || topicLower.includes("agile") || topicLower.includes("waterfall") || topicLower.includes("спринт") || topicLower.includes("аналитик") || topicLower.includes("оценк") || topicLower.includes("декомпозиц") || topicLower.includes("dor") || topicLower.includes("dod") || topicLower.includes("story point")) {
    return knowledgeFiles["topic6-methodologies"] || "";
  }
  if (topicLower.includes("протокол") || topicLower.includes("безопасн") || topicLower.includes("шифрован") || topicLower.includes("jwt") || topicLower.includes("oauth") || topicLower.includes("аутентиф") || topicLower.includes("авториз") || topicLower.includes("https") || topicLower.includes("dns") || topicLower.includes("url")) {
    return knowledgeFiles["topic7-security"] || "";
  }

  // Fallback: return all knowledge
  return Object.values(knowledgeFiles).join("\n\n");
}

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

  const knowledge = getRelevantKnowledge(topic);

  const difficultyDesc = {
    easy: "базовые определения, один правильный ответ. Проверяй знание фактов и терминов из материала.",
    medium: "множественный выбор (несколько правильных ответов возможны), применение знаний. Проверяй понимание связей между концепциями.",
    hard: "кейсовые задачи, глубокое понимание, несколько правильных ответов. Проверяй умение применять знания в практических ситуациях.",
  };

  const prompt = `Вот учебный материал по системному анализу:

---
${knowledge}
---

На основе ТОЛЬКО этого материала сгенерируй ${count} вопросов на тему: "${topic}".
Уровень сложности: ${difficulty} — ${difficultyDesc[difficulty]}.

КРИТИЧЕСКИ ВАЖНО:
- Генерируй вопросы СТРОГО по предоставленному материалу
- НЕ выдумывай факты, которых нет в тексте выше
- Правильные ответы должны точно соответствовать информации из материала
- Каждый раз формулируй вопросы ПО-РАЗНОМУ — меняй формулировки, углы подачи, комбинируй факты
- НЕ копируй вопросы из текста дословно — перефразируй

Ответь ТОЛЬКО в формате JSON-массива:
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
- multipleCorrect: true если несколько правильных, false если один
- Вопросы на РУССКОМ языке
- Варианты должны быть правдоподобными, но только correctAnswers — верные`;

  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "Ты — строгий экзаменатор по системному анализу. Генерируй вопросы ИСКЛЮЧИТЕЛЬНО на основе предоставленного учебного материала. Никогда не выдумывай информацию. Отвечай только JSON без markdown.",
    },
    { role: "user", content: prompt },
  ];

  const response = await httpClient.post<AIResponse>("/chat/completions", {
    model: "moonshot-v1-8k",
    messages,
    temperature: 0.9,
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
  if (!isAiAvailable()) {
    throw new Error("MOONSHOT_API_KEY not configured");
  }

  const topics: Record<string, string[]> = {
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
      "Микросервисы: хореография vs оркестрация",
      "Безопасность: OAuth, JWT",
      "Event Sourcing",
      "Проектирование БД для высоких нагрузок",
      "API версионирование и обратная совместимость",
      "Архитектура: монолит vs микросервисы",
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
