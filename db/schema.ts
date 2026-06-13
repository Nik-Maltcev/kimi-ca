import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";

export const generatedQuestions = mysqlTable("generated_questions", {
  id: serial("id").primaryKey(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctAnswers: json("correct_answers").$type<number[]>().notNull(),
  multipleCorrect: mysqlEnum("multiple_correct", ["yes", "no"]).notNull(),
  source: mysqlEnum("source", ["ai", "static"]).notNull().default("ai"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GeneratedQuestion = typeof generatedQuestions.$inferSelect;
