import fs from "fs";
import path from "path";

export interface AgencySpecialist {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  division: "engineering" | "design" | "marketing" | "product" | "management";
}

/**
 * Dynamically loads a specialist's "Soul" (System Prompt) from the .agents directory.
 * If the file doesn't exist, it falls back to a default identity.
 */
function loadSpecialistPrompt(skillName: string, fallback: string): string {
  try {
    const skillPath = path.join(process.cwd(), ".agents", skillName, "SKILL.md");
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, "utf-8");
      // Remove YAML frontmatter if present to get raw instructions
      return content.replace(/---[\s\S]*?---/g, "").trim();
    }
  } catch (e) {
    console.warn(`[AgencyRegistry] Failed to load skill ${skillName}, using fallback.`);
  }
  return fallback;
}

export const AGENCY_REGISTRY: AgencySpecialist[] = [
  {
    id: "frontend-wizard",
    name: "Frontend Wizard",
    role: "Lead Frontend Engineer",
    division: "engineering",
    description: "Expert in Next.js, Tailwind v4, and UI aesthetics.",
    systemPrompt: loadSpecialistPrompt("engineering-frontend-developer", "You are an expert Frontend Engineer focusing on Next.js 15 and Tailwind v4.")
  },
  {
    id: "backend-architect",
    name: "Backend Architect",
    role: "System Architect",
    division: "engineering",
    description: "Expert in Prisma, PostgreSQL, and Inngest background orchestration.",
    systemPrompt: loadSpecialistPrompt("engineering-backend-architect", "You are a System Architect focusing on scalable backends and database design.")
  },
  {
    id: "reality-checker",
    name: "Reality Checker",
    role: "QA & Logic Auditor",
    division: "product",
    description: "Ensures the app actually works and makes sense for the user.",
    systemPrompt: loadSpecialistPrompt("testing-reality-checker", "You are a QA Auditor focused on finding edge cases and logic flaws.")
  },
  {
    id: "growth-hacker",
    name: "Growth Hacker",
    role: "Lead Strategist",
    division: "marketing",
    description: "Expert in user acquisition, SEO, and social viral loops.",
    systemPrompt: loadSpecialistPrompt("marketing-growth-hacker", "You are a Growth Hacker focused on SEO and viral growth loops.")
  }
];

export function getTeamForScenario(scenario: "mvp" | "marketing" | "enterprise"): AgencySpecialist[] {
  switch (scenario) {
    case "mvp":
      return AGENCY_REGISTRY.filter(s => ["frontend-wizard", "backend-architect", "reality-checker"].includes(s.id));
    case "marketing":
      return AGENCY_REGISTRY.filter(s => ["frontend-wizard", "growth-hacker"].includes(s.id));
    case "enterprise":
      return AGENCY_REGISTRY;
    default:
      return [AGENCY_REGISTRY[0]];
  }
}
