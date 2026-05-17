import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "dev-x",
  baseUrl: process.env.INNGEST_BASE_URL || "http://127.0.0.1:8288",
});
