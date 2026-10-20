import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, ListChecks, Send, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { analyzeTicket } from "@/lib/triage.functions";
import { DEMO_TICKETS, TEAMS, type Analysis, type Team, type Ticket, type TicketState } from "@/lib/tickets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Triage Agent — ServiceNow AI Support" },
      { name: "description", content: "Reads ServiceNow tickets, drafts replies for routine ones and outlines solutions for complex ones." },
      { property: "og:title", content: "Triage Agent — ServiceNow AI Support" },
      { property: "og:description", content: "AI ticket triage routed to Clinical Applications, Data Enablement, and App Development & Access." },
    ],
  }),
  component: Index,
});

type Entry = { state: TicketState; analysis?: Analysis; reply?: string; team?: Team; error?: string };

const PRIORITY_STYLE: Record<Ticket["priority"], string> = {
  P1: "bg-destructive text-destructive-foreground",
  P2: "bg-accent text-accent-foreground",
  P3: "bg-secondary text-secondary-foreground",
  P4: "bg-muted text-muted-foreground",
};

function Index() {
  const analyze = useServerFn(analyzeTicket);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const get = (id: string): Entry => entries[id] ?? { state: "new" };
  const patch = (id: string, p: Partial<Entry>) =>
    setEntries((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { state: "new" }), ...p } }));

  const run = async (t: Ticket) => {
    patch(t.id, { state: "analyzing", error: undefined });
    try {
      const res = await analyze({ data: t });
      if (res.ok) patch(t.id, { state: "ready", analysis: res.analysis, reply: res.analysis.draftReply, team: res.analysis.team });
      else patch(t.id, { state: "new", error: res.message });
    } catch {
      patch(t.id, { state: "new", error: "Couldn't reach the agent. Try again." });
    }
  };

  const runAll = async () => {
    for (const t of DEMO_TICKETS) if (get(t.id).state === "new") await run(t);
  };

  const done = Object.values(entries).filter((e) => e.state === "sent" || e.state === "handed_off").length;
  const routine = Object.values(entries).filter((e) => e.analysis?.type === "routine").length;
  const ticket = DEMO_TICKETS.find((t) => t.id === selected);

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-accent text-accent-foreground">
              <Bot className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Triage Agent</h1>
              <p className="font-mono text-xs opacity-70">ServiceNow · Analytics Support Queue</p>
            </div>
          </div>
          <div className="flex items-center gap-5 font-mono text-xs">
            <Stat label="Queue" value={DEMO_TICKETS.length} />
            <Stat label="Routine" value={routine} />
            <Stat label="Closed" value={done} />
            <Button size="sm" variant="secondary" onClick={runAll}>
              <Zap className="size-4" /> Analyze all
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className={cn("space-y-2", ticket && "hidden lg:block")}>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Incoming tickets</h2>
          {DEMO_TICKETS.map((t) => {
            const e = get(t.id);
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelected(t.id);
                  if (e.state === "new" && !e.error) run(t);
                }}
                className={cn(
                  "relative w-full overflow-hidden rounded-lg border bg-card p-4 text-left transition hover:border-primary",
                  selected === t.id && "border-primary ring-1 ring-primary",
                  (e.state === "sent" || e.state === "handed_off") && "opacity-60",
                )}
              >
                {e.state === "analyzing" && (
                  <span className="scan-bar absolute inset-x-0 top-0 h-0.5 w-1/3 bg-accent" />
                )}
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className={cn("rounded px-1.5 py-0.5 font-medium", PRIORITY_STYLE[t.priority])}>{t.priority}</span>
                  <span>{t.number}</span>
                  <span className="ml-auto">{t.opened}</span>
                </div>
                <p className="mt-2 font-medium leading-snug">{t.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t.caller} · {t.department}</span>
                  <StatusPill entry={e} />
                </div>
              </button>
            );
          })}
        </section>

        <section className={cn(!ticket && "hidden lg:block")}>
          {ticket ? (
            <Detail
              ticket={ticket}
              entry={get(ticket.id)}
              onBack={() => setSelected(null)}
              onRetry={() => run(ticket)}
              onChange={(p) => patch(ticket.id, p)}
            />
          ) : (
            <div className="grid h-full min-h-80 place-items-center rounded-lg border border-dashed text-center text-muted-foreground">
              <div>
                <Bot className="mx-auto mb-3 size-8" />
                <p>Pick a ticket and the agent will read it.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-semibold">{value}</div>
      <div className="opacity-60">{label}</div>
    </div>
  );
}

function StatusPill({ entry }: { entry: Entry }) {
  if (entry.error) return <Badge variant="destructive">Error</Badge>;
  if (entry.state === "analyzing") return <Badge variant="outline">Reading…</Badge>;
  if (entry.state === "sent") return <Badge className="bg-success text-success-foreground">Resolved</Badge>;
  if (entry.state === "handed_off") return <Badge className="bg-success text-success-foreground">Handed off</Badge>;
  if (entry.analysis)
    return (
      <Badge variant="secondary">
        {entry.analysis.type === "routine" ? "Routine" : "Complex"} → {entry.team}
      </Badge>
    );
  return null;
}

function Detail({
  ticket,
  entry,
  onBack,
  onRetry,
  onChange,
}: {
  ticket: Ticket;
  entry: Entry;
  onBack: () => void;
  onRetry: () => void;
  onChange: (p: Partial<Entry>) => void;
}) {
  const a = entry.analysis;
  const closed = entry.state === "sent" || entry.state === "handed_off";
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="lg:hidden" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back to queue
      </Button>

      <article className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className={cn("rounded px-1.5 py-0.5 font-medium", PRIORITY_STYLE[ticket.priority])}>{ticket.priority}</span>
          {ticket.number}
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{ticket.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ticket.caller} · {ticket.department}</p>
        <p className="mt-4 leading-relaxed">{ticket.description}</p>
      </article>

      {entry.state === "analyzing" && (
        <div className="relative overflow-hidden rounded-lg border bg-card p-5">
          <span className="scan-bar absolute inset-x-0 top-0 h-0.5 w-1/3 bg-accent" />
          <p className="flex items-center gap-2 text-muted-foreground"><Bot className="size-4" /> Agent is reading the ticket…</p>
        </div>
      )}

      {entry.error && (
        <div className="rounded-lg border border-destructive/40 bg-card p-5">
          <p className="text-destructive">{entry.error}</p>
          <Button className="mt-3" size="sm" onClick={onRetry}>Try again</Button>
        </div>
      )}

      {a && (
        <div className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b p-5">
            <Badge className={a.type === "routine" ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}>
              {a.type === "routine" ? "Routine · auto-resolved" : "Complex · needs analyst"}
            </Badge>
            <Badge variant="outline">{a.category}</Badge>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{Math.round(a.confidence * 100)}% confident</span>
          </div>

          <div className="space-y-5 p-5">
            <p className="text-sm">{a.summary}</p>

            <div>
              <label className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <Users className="size-3.5" /> Route to
              </label>
              <select
                disabled={closed}
                value={entry.team}
                onChange={(e) => onChange({ team: e.target.value as Team })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {TEAMS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">{a.rationale}</p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <ListChecks className="size-3.5" /> {a.type === "routine" ? "Steps the agent completed" : "Recommended solution outline"}
              </h3>
              <ol className="space-y-2">
                {a.solutionOutline.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {a.type === "routine" ? "Reply to user" : "Acknowledgment to user"}
              </h3>
              <Textarea
                disabled={closed}
                rows={7}
                value={entry.reply}
                onChange={(e) => onChange({ reply: e.target.value })}
              />
            </div>

            {closed ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="size-4" />
                {entry.state === "sent" ? `Reply sent and ticket resolved by ${entry.team}.` : `Handed off to ${entry.team} with the solution outline.`}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {a.type === "routine" ? (
                  <Button onClick={() => onChange({ state: "sent" })}>
                    <Send className="size-4" /> Send & resolve
                  </Button>
                ) : (
                  <Button onClick={() => onChange({ state: "handed_off" })}>
                    <ChevronRight className="size-4" /> Send to {entry.team}
                  </Button>
                )}
                <Button variant="outline" onClick={onRetry}>Re-analyze</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
