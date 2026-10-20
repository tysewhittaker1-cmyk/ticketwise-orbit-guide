export const TEAMS = ["Clinical Applications", "Data Enablement", "App Development & Access"] as const;
export type Team = (typeof TEAMS)[number];

export type Ticket = {
  id: string;
  number: string;
  caller: string;
  department: string;
  title: string;
  description: string;
  priority: "P1" | "P2" | "P3" | "P4";
  opened: string;
};

export type Analysis = {
  type: "routine" | "complex";
  category: string;
  team: Team;
  confidence: number;
  summary: string;
  draftReply: string;
  solutionOutline: string[];
  rationale: string;
};

export type TicketState = "new" | "analyzing" | "ready" | "sent" | "handed_off";

export const DEMO_TICKETS: Ticket[] = [
  {
    id: "1",
    number: "INC0041827",
    caller: "Maria Lopez",
    department: "Cardiology",
    title: "Locked out of Epic after password expired",
    description:
      "My Epic password expired over the weekend and now I'm locked out after 3 tries. I have clinic starting at 1pm. Can someone reset it?",
    priority: "P2",
    opened: "12 min ago",
  },
  {
    id: "2",
    number: "RITM0019344",
    caller: "James Patel",
    department: "Finance",
    title: "Need access to Revenue Cycle Power BI workspace",
    description:
      "Hi, my manager (Laura Kim) approved me to view the Revenue Cycle dashboards. Please grant me viewer access to the 'RevCycle Analytics' Power BI workspace.",
    priority: "P3",
    opened: "25 min ago",
  },
  {
    id: "3",
    number: "RITM0019351",
    caller: "Dr. Aisha Grant",
    department: "Emergency Medicine",
    title: "Add facility filter to ED Throughput dashboard",
    description:
      "Could you add a facility filter (Main Campus / North / South) to the ED Throughput dashboard? Also a measure for median door-to-provider time would be great.",
    priority: "P3",
    opened: "41 min ago",
  },
  {
    id: "4",
    number: "INC0041802",
    caller: "Tom Becker",
    department: "Quality",
    title: "Status of my readmissions report request?",
    description:
      "I submitted RITM0018870 two weeks ago for a 30-day readmissions report. Any update on when it will be ready?",
    priority: "P4",
    opened: "1 hr ago",
  },
  {
    id: "5",
    number: "INC0041790",
    caller: "Priya Nair",
    department: "Nursing Informatics",
    title: "Sepsis alert numbers don't match between Epic and data warehouse",
    description:
      "The sepsis BPA firing counts in Epic Reporting Workbench are ~18% higher than what the enterprise data warehouse sepsis dashboard shows for September. Leadership is using the dashboard for a board report next week. We need to know which is right and why they differ.",
    priority: "P1",
    opened: "1 hr ago",
  },
  {
    id: "6",
    number: "INC0041785",
    caller: "Kevin Wu",
    department: "Pharmacy",
    title: "How do I export a dashboard to PDF?",
    description: "How do I export the Antimicrobial Stewardship dashboard to PDF so I can share it at committee?",
    priority: "P4",
    opened: "2 hr ago",
  },
  {
    id: "7",
    number: "RITM0019322",
    caller: "Sarah Okafor",
    department: "Population Health",
    title: "New app to track care-gap outreach",
    description:
      "We need a small internal app where care coordinators can log outreach attempts to patients with open care gaps, pulling the patient list from the data warehouse nightly and writing results back so we can report on it. Needs SSO and role-based access.",
    priority: "P2",
    opened: "3 hr ago",
  },
  {
    id: "8",
    number: "INC0041771",
    caller: "Daniel Reyes",
    department: "Surgery",
    title: "OR scheduling extract failing every night",
    description:
      "The nightly OR case scheduling extract to the analytics database has failed 4 nights in a row. Error in the job log: 'ORA-01555 snapshot too old'. Downstream OR utilization dashboard is stale.",
    priority: "P2",
    opened: "4 hr ago",
  },
];
