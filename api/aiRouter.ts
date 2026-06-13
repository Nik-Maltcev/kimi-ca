import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { generateQuestions, isAiAvailable } from "./services/ai";
import {
  findQuestionsByDifficulty,
  createManyGeneratedQuestions,
  countQuestionsByDifficulty,
  deleteOldQuestions,
} from "./queries/generatedQuestions";
import { TRPCError } from "@trpc/server";

export const aiRouter = createRouter({
  status: publicQuery.query(() => ({
    available: isAiAvailable(),
    message: isAiAvailable()
      ? "AI generation is available"
      : "MOONSHOT_API_KEY not configured. Add your API key to .env to enable AI-generated questions.",
  })),

  generate: publicQuery
    .input(
      z.object({
        difficulty: z.enum(["easy", "medium", "hard"]),
        topic: z.string().optional(),
        count: z.number().min(1).max(10).default(5),
      }),
    )
    .mutation(async ({ input }) => {
      if (!isAiAvailable()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "MOONSHOT_API_KEY not configured. Add your API key to .env file.",
        });
      }

      try {
        const questions = input.topic
          ? await generateQuestions(input.topic, input.difficulty, input.count)
          : []; // bulk generation handled separately

        // Save to DB
        const dbQuestions = questions.map((q) => ({
          difficulty: input.difficulty,
          topic: input.topic || "General",
          question: q.question,
          options: q.options,
          correctAnswers: q.correctAnswers,
          multipleCorrect: q.multipleCorrect ? ("yes" as const) : ("no" as const),
          source: "ai" as const,
        }));

        await createManyGeneratedQuestions(dbQuestions);

        return { success: true, generated: questions.length, questions };
      } catch (e: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: e.message || "Failed to generate questions",
        });
      }
    }),

  list: publicQuery
    .input(
      z.object({
        difficulty: z.enum(["easy", "medium", "hard"]),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const questions = await findQuestionsByDifficulty(
        input.difficulty,
        input.limit,
      );
      return questions.map((q) => ({
        id: q.id,
        difficulty: q.difficulty,
        topic: q.topic,
        question: q.question,
        options: q.options as string[],
        correctAnswers: q.correctAnswers as number[],
        multipleCorrect: q.multipleCorrect === "yes",
        source: q.source,
        createdAt: q.createdAt,
      }));
    }),

  count: publicQuery
    .input(z.object({ difficulty: z.enum(["easy", "medium", "hard"]) }))
    .query(async ({ input }) => {
      return countQuestionsByDifficulty(input.difficulty);
    }),

  seedStatic: publicQuery
    .input(
      z.object({
        difficulty: z.enum(["easy", "medium", "hard"]),
      }),
    )
    .mutation(async ({ input }) => {
      // Import static questions and save them to DB
      const { questionsByDifficulty } = await import("./seedQuestions.ts");
      const staticQuestions = questionsByDifficulty[input.difficulty];

      if (!staticQuestions || staticQuestions.length === 0) {
        return { success: false, message: "No static questions found" };
      }

      const dbQuestions = staticQuestions.map((q: typeof staticQuestions[0]) => ({
        difficulty: input.difficulty,
        topic: q.topic,
        question: q.question,
        options: q.options,
        correctAnswers: q.correctAnswers,
        multipleCorrect: q.multipleCorrect ? ("yes" as const) : ("no" as const),
        source: "static" as const,
      }));

      await createManyGeneratedQuestions(dbQuestions);
      await deleteOldQuestions(input.difficulty, 200);

      return { success: true, seeded: dbQuestions.length };
    }),
});
