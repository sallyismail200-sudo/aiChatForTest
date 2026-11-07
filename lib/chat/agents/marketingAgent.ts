import { Agent } from "@openai/agents";
import { getWebsiteFeatureHelpTool } from "@/lib/chat/tools/help";
import { buildInstructions } from "@/lib/chat/prompts/instructions";
import { getPlanDetailsTool, getPlansTool } from "@/lib/chat/tools/plans";
import { getOfferDetailsTool, getOffersTool } from "@/lib/chat/tools/offers";
import {
  getCareersInfoTool,
  getCareersJobsTool,
} from "@/lib/chat/tools/careers";
import {
  getServiceDetailsTool,
  getServicesTool,
} from "@/lib/chat/tools/services";

export const lunaAgent = new Agent({
  name: "Cello graphics Assistant",
  instructions: buildInstructions(),
  model: "gpt-5.6-luna-2026-04-01",
  modelSettings: { store: false, reasoning: { effort: "none" } },
  tools: [
    getServicesTool,
    getCareersInfoTool,
    getCareersJobsTool,
    getWebsiteFeatureHelpTool,
    getOffersTool,
    getOfferDetailsTool,
    getPlansTool,
    getPlanDetailsTool,
    getServiceDetailsTool,
  ],
});
