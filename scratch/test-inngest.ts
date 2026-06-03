import { Inngest } from "inngest";

// Use the production keys from your .env file
const eventKey = "AmUgDTyVf9m5f3v3Gs4skckk3VzxolmOL9qzfThgDxtyKG122h2xdSIPIcXUKCkyAfbbiDiueEZo6Uc1U-1jyA";

const inngest = new Inngest({
  id: "dev-x",
  eventKey: eventKey
});

async function main() {
  console.log("Attempting to send a test event to Inngest Cloud...");
  try {
    const result = await inngest.send({
      name: "super-dev-x-router",
      data: {
        projectId: "test_local_trigger_project",
        userMessage: "create a landing page",
        model: "grok",
        mode: "turbo"
      }
    });
    console.log("Event sent successfully! Result:", result);
  } catch (err: any) {
    console.error("Event dispatch FAILED! Error:", err.message || err);
    console.error("Stack trace:", err.stack);
  }
}

main();
