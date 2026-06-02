import { z } from "zod";
import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/lib/usage";
import { observable } from "@trpc/server/observable";

export const messagesRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: "Project ID is required" }),
      }),
    )
    .query(async ({ input, ctx }: { input: any; ctx: any }) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
          project: {
            userId: ctx.auth.userId,
          },
        },
        orderBy: {
          updatedAt: "asc",
        },
        include: {
          fragment: true,
        },
      });

      return messages;
    }),

  // Real-time file updates subscription
  onFileUpdates: protectedProcedure
    .input(
      z.object({
        messageId: z.string().min(1),
        projectId: z.string().min(1),
      }),
    )
    .subscription(({ input, ctx }: { input: any; ctx: any }) => {
      return observable<any>((emit) => {
        const interval = setInterval(async () => {
          const message = await prisma.message.findUnique({
            where: { id: input.messageId },
          });

          if (message?.fileActions) {
            emit.next({
              messageId: input.messageId,
              fileActions: message.fileActions as any[],
              updatedAt: message.updatedAt,
            });
          }
        }, 500); // Poll every 500ms for real-time updates

        return () => clearInterval(interval);
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Message cannot be empty" })
          .max(5000, { message: "Message cannot be longer than 5000 characters" }),
        projectId: z.string().min(1, { message: "Project ID is required" }),
        model: z.string(), // Relaxed to string to match UI MESSAGE_MODELS
        mode: z.enum(["turbo", "pro"]).default("turbo"),
      }),
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const exsitingProject = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!exsitingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      try {
        await consumeCredits(ctx.auth.userId || undefined);
      } catch (creditsError: any) {
        console.error("[Procedures] Message credit consumption failed:", creditsError);
        try {
          await prisma.deploy.create({
            data: {
              userId: ctx.auth.userId || "unknown",
              projectId: "limit_debug_message",
              status: "FAILED",
              error: `[Messages.create] ${creditsError?.stack || creditsError?.message || String(creditsError)}`,
            }
          });
        } catch (dbErr) {
          console.error("Failed to log credit error to database:", dbErr);
        }
        const errMsg = (creditsError instanceof Error || (creditsError && typeof creditsError === 'object' && 'message' in creditsError))
          ? `Credit check failed: ${creditsError.message || String(creditsError)}`
          : "You have reached your limit of requests";
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: errMsg,
        });
      }

      const createdMessage = await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: input.value,
          role: "USER",
          type: "RESULT",
          // TODO: save model to prisma DB
        },
      });

      // SUPER DEV X: Use smart router to decide between question mode and generation mode
      try {
        await inngest.send({
          name: "super-dev-x-router",
          data: {
            projectId: input.projectId,
            userMessage: input.value,
            model: input.model,
            mode: input.mode,
          },
        });
      } catch (inngestErr) {
        console.error("[Procedures] Failed to send trigger to Inngest inside message creation:", inngestErr);
      }

      return createdMessage;
    }),

  // SUPER DEV X: Handle user answers to clarifying questions
  answerQuestions: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        originalRequest: z.string().min(1),
        answers: z.array(z.string().min(1)).min(1),
      }),
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Save user answers
      const answerMessage = await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: JSON.stringify(input.answers),
          role: "USER",
          type: "RESULT",
        },
      });

      // Trigger context building with all the information
      await inngest.send({
        name: "app/build-context",
        data: {
          projectId: input.projectId,
          originalRequest: input.originalRequest,
          userAnswers: input.answers,
        },
      });

      return answerMessage;
    }),
});

export type MessagesRouter = typeof messagesRouter;