import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  json,
} from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const multipleCorrectEnum = pgEnum("multiple_correct", ["yes", "no"]);
export const sourceEnum = pgEnum("source", ["ai", "static"]);

export const generatedQuestions = pgTable("generated_questions", {
  id: serial("id").primaryKey(),
  difficulty: difficultyEnum("difficulty").notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctAnswers: json("correct_answers").$type<number[]>().notNull(),
  multipleCorrect: multipleCorrectEnum("multiple_correct").notNull(),
  source: sourceEnum("source").notNull().default("ai"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GeneratedQuestion = typeof generatedQuestions.$inferSelect;
