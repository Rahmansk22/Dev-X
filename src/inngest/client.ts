import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "dev-x",
  ...(process.env.INNGEST_EVENT_KEY ? { eventKey: process.env.INNGEST_EVENT_KEY } : {}),
  // Force production endpoint on Vercel/production to prevent accidental local env overrides
  baseUrl: (process.env.NODE_ENV === "production" || !!process.env.VERCEL)
    ? "https://inn.gs/"
    : (process.env.INNGEST_BASE_URL || "http://127.0.0.1:8288"),
});
