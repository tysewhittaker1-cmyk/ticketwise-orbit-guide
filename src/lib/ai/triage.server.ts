import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText, APICallError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";
import { TEAMS, type Analysis, type Ticket } from "../tickets";

const schema = z.object({
  type: z.enum(["routine", "complex"]),
  category: z.string(),
  team: z.enum(TEAMS),
  confidence: z.number(),
  summary: z.string(),
  draftReply: z.string(),
  solutionOutline: z.array(z.string()),
  rationale: z.string(),
});

const INSTRUCTIONS = `You are the ServiceNow triage agent for a healthcare analytics organization.
Classify each ticket and route it to exactly one team:
- "Clinical Applications": Epic and clinical system issues, clinical data discrepancies, BPA/alert logic, clinical workflow questions.
- "Data Enablement": dashboards, reports, data models, filters, measures, data pipelines/extracts, data warehouse, BI how-to questions.
- "App Development & Access": access/permission requests, password resets, account unlocks, SSO, new internal applications.

ROUTINE tickets: password resets/unlocks, access requests with approval, simple how-to questions, status updates, adding filters or measures to existing dashboards/data models.
For routine tickets: write draftReply as a friendly, complete, ready-to-send reply to the end user (address them by first name, explain what was done or the steps, sign off as "Analytics Support"). Set solutionOutline to 3-5 short internal fulfillment steps.
COMPLEX tickets: data discrepancies, failing pipelines, new builds, multi-team or ambiguous issues.
For complex tickets: set draftReply to a short acknowledgment to the user that an analyst is investigating. Set solutionOutline to 4-7 concrete, ordered investigation/solution steps for the human analyst.
category: 2-4 words. summary: one sentence. rationale: one sentence on why this team and type. confidence: 0 to 1.`;

export async function analyzeTicketServer(ticket: Ticket): Promise<
  { ok: true; analysis: Analysis } | { ok: false; message: string }
> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, message: "AI is not configured for this app." };

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions: INSTRUCTIONS,
      prompt: `Ticket ${ticket.number} (${ticket.priority})\nCaller: ${ticket.caller}, ${ticket.department}\nTitle: ${ticket.title}\n\n${ticket.description}`,
      output: Output.object({ schema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const out = await result.output;
    return {
      ok: true,
      analysis: { ...out, confidence: Math.max(0, Math.min(1, out.confidence)) },
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return { ok: false, message: "The agent returned an unreadable answer. Try again." };
    }
    if (APICallError.isInstance(error)) {
      const s = error.statusCode;
      if (s === 429) return { ok: false, message: "Too many requests right now. Wait a moment and try again." };
      if (s === 402) return { ok: false, message: "AI credits are used up. Add credits to keep analyzing tickets." };
      if (s === 403) return { ok: false, message: "AI access is blocked for this workspace." };
    }
    console.error("triage error", error);
    return { ok: false, message: "The agent couldn't analyze this ticket. Try again." };
  }
}
