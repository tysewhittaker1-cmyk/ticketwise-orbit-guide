import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ticketSchema = z.object({
  id: z.string(),
  number: z.string(),
  caller: z.string(),
  department: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  opened: z.string(),
});

export const analyzeTicket = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ticketSchema.parse(d))
  .handler(async ({ data }) => {
    const { analyzeTicketServer } = await import("./ai/triage.server");
    return analyzeTicketServer(data);
  });
