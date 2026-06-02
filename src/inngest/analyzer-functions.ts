import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { MemoryService } from "@/lib/memory-service";
import { getTeamForScenario } from "@/lib/agency/registry";
import {
  analyzerPrompt,
  questionerPrompt,
  contextBuilderPrompt,
  AnalysisResult,
  QuestionerResult,
  ContextResult,
} from "@/analyzer-prompt";

/**
 * SUPER DEV X: Step 1 - Analyze user request
 * Determines if we need to ask questions or can build immediately
 */
export const analyzeRequestFunction = inngest.createFunction(
  { 
    id: "analyze-user-request",
    concurrency: [{ limit: 1, key: "event.data.projectId" }],
  },
  { event: "app/analyze-request" },
  async ({ event, step }) => {
    console.log("[analyzeRequestFunction] Starting analysis for request");

    const { projectId, userMessage } = event.data;

    // Call analyzer agent
    const analysis = await step.run("analyze-with-agent", async () => {
      console.log("[analyzeRequestFunction] Calling analyzer agent");

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
          "X-Title": "DevX Analyzer",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-v4-flash",
          messages: [
            { role: "system", content: analyzerPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from analyzer");
      console.log("[analyzeRequestFunction] Analysis result:", content);

      try {
        return JSON.parse(content) as AnalysisResult;
      } catch {
        return { needsQuestions: false, suggestedQuestions: [] } as unknown as AnalysisResult;
      }
    });

    // Create message with analysis
    const message = await step.run("save-analysis", async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        console.warn(`[analyzeRequestFunction] Project ${projectId} not found. Returning early.`);
        return null;
      }

      const msg = await prisma.message.create({
        data: {
          projectId,
          content: JSON.stringify(analysis),
          role: "ASSISTANT",
          type: "RESULT",
        },
      });
      console.log("[analyzeRequestFunction] Message saved:", msg.id);
      return msg;
    });

    if (!message) {
      return {
        skipped: true,
        reason: "Project not found",
      };
    }

    // 🔥 CHAIN REACTION: Decide if we go to questions or straight to coding
    if (analysis.needsQuestions) {
      await step.sendEvent("trigger-questions", {
        name: "app/generate-questions",
        data: {
          projectId,
          userMessage,
          suggestedQuestions: analysis.suggestedQuestions,
          model: event.data.model,
          team: event.data.team,
          memoryContext: event.data.memoryContext,
        },
      });
    } else {
      const projectBusy = await step.run("check-project-busy-before-generate", async () => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { isRunning: true, activeRunId: true },
        });
        return Boolean(project?.isRunning && project?.activeRunId);
      });

      if (projectBusy) {
        console.warn(
          `[analyzeRequestFunction] ⏭️ Skipping trigger-generation because project ${projectId} already has an active run`
        );
        return {
          messageId: message.id,
          analysis,
          shouldAskQuestions: false,
          suggestedQuestions: analysis.suggestedQuestions,
          skippedGeneration: true,
        };
      }

      await step.sendEvent("trigger-generation", {
        name: "code-agent/run",
        data: {
          projectId,
          value: userMessage,
          model: event.data.model || "deepseek",
          team: event.data.team,
          memoryContext: event.data.memoryContext,
        },
      });
    }

    return {
      messageId: message.id,
      analysis,
      shouldAskQuestions: analysis.needsQuestions,
      suggestedQuestions: analysis.suggestedQuestions,
    };
  }
);

/**
 * SUPER DEV X: Step 2 - Generate clarifying questions if needed
 */
export const generateQuestionsFunction = inngest.createFunction(
  { 
    id: "generate-clarifying-questions",
    concurrency: [{ limit: 1, key: "event.data.projectId" }],
  },
  { event: "app/generate-questions" },
  async ({ event, step }) => {
    console.log("[generateQuestionsFunction] Generating questions");

    const { projectId, userMessage, suggestedQuestions } = event.data;

    // Call questioner agent
    const questioner = await step.run("generate-with-questioner", async () => {
      console.log("[generateQuestionsFunction] Calling questioner agent");

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
          "X-Title": "DevX Analyzer",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-v4-flash",
          messages: [
            { role: "system", content: questionerPrompt },
            {
              role: "user",
              content: `User wants: "${userMessage}"\n\nSuggested questions to ask: ${suggestedQuestions.join(", ")}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from questioner");
      console.log("[generateQuestionsFunction] Questions generated:", content);

      try {
        return JSON.parse(content) as QuestionerResult;
      } catch {
        return { questions: [], context: "" } as QuestionerResult;
      }
    });

    // Save questions as QUESTION message
    const questionMessage = await step.run("save-questions", async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        console.warn(`[generateQuestionsFunction] Project ${projectId} not found. Returning early.`);
        return null;
      }

      const msg = await prisma.message.create({
        data: {
          projectId,
          content: JSON.stringify(questioner.questions),
          role: "ASSISTANT",
          type: "RESULT",
        },
      });
      console.log("[generateQuestionsFunction] Questions saved:", msg.id);
      return msg;
    });

    if (!questionMessage) {
      return {
        skipped: true,
        reason: "Project not found",
      };
    }

    return {
      messageId: questionMessage.id,
      questions: questioner.questions,
      context: questioner.context,
    };
  }
);

/**
 * SUPER DEV X: Step 3 - Build context from user answers
 */
export const buildContextFunction = inngest.createFunction(
  { 
    id: "build-app-context",
    concurrency: [{ limit: 1, key: "event.data.projectId" }],
  },
  { event: "app/build-context" },
  async ({ event, step }) => {
    console.log("[buildContextFunction] Building context from answers");

    const { projectId, originalRequest, userAnswers } = event.data;

    // Fetch previous messages for context
    const previousMessages = await step.run("fetch-context-messages", async () => {
      return await prisma.message.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
    });

    // Build context with context builder
    const contextData = await step.run("build-context-with-agent", async () => {
      console.log("[buildContextFunction] Building comprehensive context");

      const contextPrompt = `${contextBuilderPrompt}

Original request: "${originalRequest}"
User's answers:
${userAnswers.map((ans: string, i: number) => `${i + 1}. ${ans}`).join("\n")}

Previous requirements mentioned: ${previousMessages
        .slice(0, 5)
        .map((m: any) => m.content)
        .join(", ")}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://devx.app",
          "X-Title": "DevX Analyzer",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-v4-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert at building comprehensive app requirements from user input.",
            },
            { role: "user", content: contextPrompt },
          ],
          temperature: 0.4,
          max_tokens: 800,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from context builder");
      console.log("[buildContextFunction] Context built:", content);

      try {
        return JSON.parse(content) as ContextResult;
      } catch {
        return { requirements: originalRequest, features: [], techStack: [] } as unknown as ContextResult;
      }
    });

    // Save context as ANALYSIS message
    const contextMessage = await step.run("save-context", async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        console.warn(`[buildContextFunction] Project ${projectId} not found. Returning early.`);
        return null;
      }

      const msg = await prisma.message.create({
        data: {
          projectId,
          content: JSON.stringify(contextData),
          role: "ASSISTANT",
          type: "RESULT",
        },
      });
      console.log("[buildContextFunction] Context saved:", msg.id);
      return msg;
    });

    if (!contextMessage) {
      return {
        skipped: true,
        reason: "Project not found",
      };
    }

    // 🔥 THE MISSING LINK: Trigger the Code Agent to start generating files based on this context
    const projectBusy = await step.run("check-project-busy-before-context-generate", async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { isRunning: true, activeRunId: true },
      });
      return Boolean(project?.isRunning && project?.activeRunId);
    });

    if (projectBusy) {
      console.warn(
        `[buildContextFunction] ⏭️ Skipping trigger-generation because project ${projectId} already has an active run`
      );
      return {
        messageId: contextMessage.id,
        context: contextData,
        readyForGeneration: false,
        skippedGeneration: true,
      };
    }

    await step.sendEvent("trigger-generation", {
      name: "code-agent/run",
      data: {
        projectId,
        value: `APP CONTEXT: ${JSON.stringify(contextData)}. ORIGINAL REQUEST: ${originalRequest}`,
        model: event.data.model || "deepseek",
        team: event.data.team,
        memoryContext: event.data.memoryContext,
      },
    });

    return {
      messageId: contextMessage.id,
      context: contextData,
      readyForGeneration: true,
    };
  }
);

/**
 * SUPER DEV X: Smart router - decides question mode or generation mode
 */
export const smartRouterFunction = inngest.createFunction(
  {
    id: "super-dev-x-router",
    concurrency: [{ limit: 1, key: "event.data.projectId" }],
  },
  { event: "super-dev-x-router" },
  async ({ event, step }) => {
    console.log("[smartRouterFunction] Routing request");

    const { projectId, model, mode } = event.data;
    const userMessage = event.data.userMessage || event.data.value; // ✅ Robust fallback for different event sources

    // 🚀 ULTRA-FAST ROUTING: Minimal steps, maximum speed
    const project = await step.run("get-project-and-lock", async () => {
      const exists = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!exists) {
        return null;
      }
      // Consolidate busy check + lock in one DB call
      const p = await prisma.project.update({
        where: { id: projectId },
        data: { isRunning: true },
        select: { isRunning: true, activeRunId: true }
      });
      return p;
    });

    if (!project) {
      console.warn(`[smartRouterFunction] Project ${projectId} not found. Returning early.`);
      return { mode: "turbo", status: "skipped_missing" };
    }

    if (project.activeRunId && project.activeRunId !== `queued:${event.id}`) {
       console.log(`[smartRouterFunction] ⏭️ Skipping trigger because project ${projectId} is busy with ${project.activeRunId}`);
       return { mode: "turbo", status: "skipped_busy" };
    }
    
    const isPro = mode === "pro";
    if (isPro) {
      console.log("[smartRouterFunction] PRO Mode: Assembling Agency Team & Memory...");
      const team = getTeamForScenario("mvp");
      const memoryContext = await MemoryService.getContextForAgent(projectId);

      await step.sendEvent("trigger-analysis", {
        name: "app/analyze-request",
        data: {
          projectId,
          userMessage,
          team,
          memoryContext,
        },
      });
      return {
        mode: "pro",
        status: "agency_assembled",
      };
    } else {
      console.log("[smartRouterFunction] TURBO Mode: Triggering lightning generation...");
      await step.sendEvent("trigger-generation", {
        name: "code-agent/run",
        data: {
          projectId,
          value: userMessage,
          model: model || "deepseek",
        },
      });

      return { mode: "turbo", status: "generation_started" };
    }
  }
);
