import { z } from "zod";
import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Context } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/lib/usage";

export const projectsRouter = createTRPCRouter({
  deleteProject: protectedProcedure
    .input(z.object({ id: z.string().min(1, { message: "Project ID is required" }) }))
    .mutation(async ({ input, ctx }: { input: { id: string }; ctx: Context }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
      }
      const project = await prisma.project.findUnique({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!project) {
        // Idempotent: do not throw if already deleted or missing
        return { success: true };
      }
      await prisma.project.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
  deleteAll: protectedProcedure
    .mutation(async ({ ctx }: { ctx: Context }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
      }
      // Delete all projects for the authenticated user
      const deleted = await prisma.project.deleteMany({
        where: { userId: ctx.auth.userId },
      });
      return { success: true, count: deleted.count };
    }),
  updateProject: protectedProcedure
    .input(z.object({
      id: z.string().min(1, { message: "Project ID is required" }),
      name: z.string().min(1, { message: "Name cannot be empty" }).max(100),
    }))
    .mutation(async ({ input, ctx }: { input: { id: string; name: string }; ctx: Context }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
      }
      const project = await prisma.project.findUnique({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      const updated = await prisma.project.update({
        where: { id: input.id },
        data: { name: input.name },
      });
      return updated;
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Project ID is required" }),
      }),
    )
    .query(async ({ input, ctx }: { input: { id: string }; ctx: Context }) => {
      const exsitingProject = await prisma.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId!, // Non-null assertion safe due to protectedProcedure
        },
      });

      if (!exsitingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return exsitingProject;
    }),

  getMany: protectedProcedure
    .query(async ({ ctx }: { ctx: Context }) => {
      try {
        // Validate user ID
        if (!ctx.auth?.userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User ID is missing from context'
          });
        }

        const projects = await prisma.project.findMany({
          where: {
            userId: ctx.auth.userId,
          },
          orderBy: {
            updatedAt: "desc",
          },
        });

        return projects;
      } catch (error: unknown) {
        console.error('[getMany] Error:', error);
        if (error instanceof TRPCError) throw error;
        const message = error instanceof Error ? error.message : "Internal Server Error";
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch projects: ${message}`,
        });
      }
    }),
  create: protectedProcedure
    .input(
      z.object({
        value: z.string()
          .min(1, "Prompt cannot be empty")
          .max(5000, "Prompt cannot be longer than 5000 characters"),
        model: z.enum(["grok", "geminiFlash", "gpt4o", "claude37", "deepseekR1", "o1"]),
        mode: z.enum(["turbo", "pro"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: Context }) => {
      const timings: Record<string, number> = {};
      const startAll = Date.now();

      // Validate user ID
      if (!ctx.auth?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // 1. Credits
      const startCredits = Date.now();
      try {
        await consumeCredits(ctx.auth.userId || undefined);
      } catch (creditsError: any) {
        console.error("[Procedures] Credit consumption failed:", creditsError);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You have reached your usage limit",
        });
      }
      timings.consumeCredits = Date.now() - startCredits;

      // 2. Project create (without nested message)
      const startCreate = Date.now();
      const createdProject = await prisma.project.create({
        data: {
          userId: ctx.auth.userId,
          name: input.value.slice(0, 50),
        }
      });
      timings.projectCreate = Date.now() - startCreate;

      // 3. Create message separately
      const startMessage = Date.now();
      await prisma.message.create({
        data: {
          content: input.value,
          role: "USER",
          type: "RESULT",
          projectId: createdProject.id,
        }
      });
      timings.messageCreate = Date.now() - startMessage;

      // 3. Inngest send
      const startInngest = Date.now();
      await inngest.send({
        name: "super-dev-x-router",
        data: {
          userMessage: input.value,
          projectId: createdProject.id,
          model: input.model,
          mode: input.mode || "turbo",
        },
      });
      timings.inngestSend = Date.now() - startInngest;

      timings.total = Date.now() - startAll;
      // Log timings (visible in server logs)

      console.log("[PERF] Project create timings:", timings);

      return createdProject;
    }),
});
