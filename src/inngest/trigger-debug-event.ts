
import 'dotenv/config';
import { inngest } from "./client";
import crypto from "crypto";

async function main() {
  console.log("SIGNING KEY:", process.env.INNGEST_SIGNING_KEY ? "✓ Set" : "✗ Missing");
  await inngest.send({
    name: "code-agent/run",
    idempotencyKey: crypto.randomUUID(),
    data: {
      model: "grok",
      projectId: "debug-project",
      value: "build a landing page",
    },
  });
  console.log("Debug event sent!");
}

main().catch(console.error);
