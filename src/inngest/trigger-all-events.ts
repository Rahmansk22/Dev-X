import 'dotenv/config';
import { inngest } from "./client";
import crypto from "crypto";

async function triggerAllEvents() {
  console.log("🚀 Triggering ALL Inngest events for comprehensive testing...\n");

  try {
    const projectId1 = crypto.randomUUID();
    const projectId2 = crypto.randomUUID();
    const projectId3 = crypto.randomUUID();
    const projectId4 = crypto.randomUUID();
    const projectId5 = crypto.randomUUID();
    const projectId6 = crypto.randomUUID();
    const _projectId7 = crypto.randomUUID();
    const _projectId8 = crypto.randomUUID();

    // Event 1: code-agent/run
    console.log("1️⃣ Sending: code-agent/run");
    await inngest.send({
      name: "code-agent/run",
      idempotencyKey: crypto.randomUUID(),
      data: {
        model: "grok",
        projectId: projectId1,
        value: "Create a professional calculator app with dark mode, history panel, and keyboard support",
      },
    });
    console.log("✅ code-agent/run sent!\n");

    // Event 2: app/smart-route
    console.log("2️⃣ Sending: app/smart-route");
    await inngest.send({
      name: "app/smart-route",
      idempotencyKey: crypto.randomUUID(),
      data: {
        projectId: projectId2,
        userMessage: "Build a full-stack todo list app with real-time sync, dark mode, categories, and priority levels",
        model: "geminiFlash",
      },
    });
    console.log("✅ app/smart-route sent!\n");

    // Event 3: app/analyze-request
    console.log("3️⃣ Sending: app/analyze-request");
    await inngest.send({
      name: "app/analyze-request",
      idempotencyKey: crypto.randomUUID(),
      data: {
        projectId: projectId3,
        userMessage: "I want a weather app that shows temperature and humidity",
      },
    });
    console.log("✅ app/analyze-request sent!\n");

    // Event 4: app/generate-questions
    console.log("4️⃣ Sending: app/generate-questions");
    await inngest.send({
      name: "app/generate-questions",
      idempotencyKey: crypto.randomUUID(),
      data: {
        projectId: projectId4,
        userMessage: "Create a dashboard",
        suggestedQuestions: ["What type of dashboard?", "What data to display?"],
      },
    });
    console.log("✅ app/generate-questions sent!\n");

    // Event 5: app/build-context
    console.log("5️⃣ Sending: app/build-context");
    await inngest.send({
      name: "app/build-context",
      idempotencyKey: crypto.randomUUID(),
      data: {
        projectId: projectId5,
        originalRequest: "Create an e-commerce app",
        userAnswers: ["For online store", "Product catalog, shopping cart, checkout"],
      },
    });
    console.log("✅ app/build-context sent!\n");

    // Event 6: app/build
    console.log("6️⃣ Sending: app/build");
    await inngest.send({
      name: "app/build",
      idempotencyKey: crypto.randomUUID(),
      data: {
        projectId: projectId6,
        appId: "app-123",
        userId: "user-123",
        code: "export default function App() { return <div>App</div>; }",
      },
    });
    console.log("✅ app/build sent!\n");

    // Event 7: app/deploy-request
    console.log("7️⃣ Sending: app/deploy-request");
    await inngest.send({
      name: "app/deploy-request",
      idempotencyKey: crypto.randomUUID(),
      data: {
        appId: "app-456",
        userId: "user-456",
        buildId: "build-456",
        provider: "vercel",
        apiKey: "test-api-key",
        config: { projectName: "my-app" },
      },
    });
    console.log("✅ app/deploy-request sent!\n");

    // Event 8: app/rollback-request
    console.log("8️⃣ Sending: app/rollback-request");
    await inngest.send({
      name: "app/rollback-request",
      idempotencyKey: crypto.randomUUID(),
      data: {
        deploymentId: "deploy-789",
      },
    });
    console.log("✅ app/rollback-request sent!\n");

    console.log("🎉 All 8 events triggered successfully!");
    console.log("\n📊 Summary:");
    console.log("  ✓ 8 events sent");
    console.log("  ✓ Check Inngest dev server at http://localhost:8288");
    console.log("  ✓ Watch terminal for execution logs");

  } catch (error) {
    console.error("❌ Error triggering events:", error);
    process.exit(1);
  }
}

triggerAllEvents();
