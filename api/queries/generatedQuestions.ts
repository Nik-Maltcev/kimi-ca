import { getDb } from "./connection";
import { generatedQuestions } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { GeneratedQuestion } from "@db/schema";

export async function findQuestionsByDifficulty(
  difficulty: "easy" | "medium" | "hard",
  limit: number = 50,
): Promise<GeneratedQuestion[]> {
  return getDb()
    .select()
    .from(generatedQuestions)
    .where(eq(generatedQuestions.difficulty, difficulty))
    .orderBy(desc(generatedQuestions.createdAt))
    .limit(limit);
}

export async function findQuestionsByDifficultyAndTopic(
  difficulty: "easy" | "medium" | "hard",
  topic: string,
  limit: number = 10,
): Promise<GeneratedQuestion[]> {
  return getDb()
    .select()
    .from(generatedQuestions)
    .where(
      and(
        eq(generatedQuestions.difficulty, difficulty),
        eq(generatedQuestions.topic, topic),
      ),
    )
    .orderBy(desc(generatedQuestions.createdAt))
    .limit(limit);
}

export async function createGeneratedQuestion(data: {
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  multipleCorrect: "yes" | "no";
  source?: "ai" | "static";
}): Promise<void> {
  await getDb().insert(generatedQuestions).values({
    ...data,
    source: data.source || "ai",
  });
}

export async function createManyGeneratedQuestions(
  data: Array<{
    difficulty: "easy" | "medium" | "hard";
    topic: string;
    question: string;
    options: string[];
    correctAnswers: number[];
    multipleCorrect: "yes" | "no";
    source?: "ai" | "static";
  }>,
): Promise<void> {
  if (data.length === 0) return;
  await getDb().insert(generatedQuestions).values(
    data.map((d) => ({ ...d, source: d.source || "ai" })),
  );
}

export async function countQuestionsByDifficulty(
  difficulty: "easy" | "medium" | "hard",
): Promise<number> {
  const result = await getDb()
    .select()
    .from(generatedQuestions)
    .where(eq(generatedQuestions.difficulty, difficulty));
  return result.length;
}

export async function deleteOldQuestions(
  difficulty: "easy" | "medium" | "hard",
  keepCount: number = 200,
): Promise<void> {
  const questions = await getDb()
    .select()
    .from(generatedQuestions)
    .where(eq(generatedQuestions.difficulty, difficulty))
    .orderBy(desc(generatedQuestions.createdAt));

  if (questions.length > keepCount) {
    const toDelete = questions.slice(keepCount);
    for (const q of toDelete) {
      await getDb()
        .delete(generatedQuestions)
        .where(eq(generatedQuestions.id, q.id));
    }
  }
}
