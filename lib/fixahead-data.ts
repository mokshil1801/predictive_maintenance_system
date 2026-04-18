export type RiskLevel = "critical" | "high" | "medium" | "low";

export type QueueItem = {
  school: string;
  district: string;
  issue: string;
  category: "Plumbing" | "Electrical" | "Structural";
  risk: RiskLevel;
  riskScore: number;
  studentImpact: string;
  failureWindow: string;
  reason: string;
};

export const deoQueue: QueueItem[] = [
  {
    school: "Govt Girls School, Ahmedabad",
    district: "Ahmedabad",
    issue: "Toilet failure risk",
    category: "Plumbing",
    risk: "critical",
    riskScore: 94,
    studentImpact: "120 students affected",
    failureWindow: "Within 20 days",
    reason:
      "Toilet functionality has fallen to 42% for two weekly cycles, water leakage is active near the inlet line, and the school reported long queues during recess.",
  },
  {
    school: "Primary School, Patan Taluka",
    district: "Patan",
    issue: "Exposed wiring near classroom block",
    category: "Electrical",
    risk: "critical",
    riskScore: 91,
    studentImpact: "86 students affected",
    failureWindow: "Within 12 days",
    reason:
      "Three inspection photos show insulation peeling near the corridor switchboard. Student movement is high during midday meal service and moisture readings increased after rainfall.",
  },
  {
    school: "Govt Boys School, Surendranagar",
    district: "Surendranagar",
    issue: "Roof crack progression over science room",
    category: "Structural",
    risk: "high",
    riskScore: 83,
    studentImpact: "64 students affected",
    failureWindow: "Within 28 days",
    reason:
      "Crack width moved from 2.8 mm to 4.1 mm in 14 days. Ceiling seepage is visible and the affected room is used for classes VI to VIII.",
  },
  {
    school: "Kanya Shala, Bhavnagar",
    district: "Bhavnagar",
    issue: "Handpump drainage overflow",
    category: "Plumbing",
    risk: "high",
    riskScore: 79,
    studentImpact: "140 students affected",
    failureWindow: "Within 34 days",
    reason:
      "Standing water was observed around the handpump platform for three consecutive reports, increasing slip risk and reducing access to safe drinking water.",
  },
  {
    school: "Model School, Dahod",
    district: "Dahod",
    issue: "Distribution board overheating",
    category: "Electrical",
    risk: "medium",
    riskScore: 66,
    studentImpact: "52 students affected",
    failureWindow: "Within 45 days",
    reason:
      "Current load is stable, but a recurring warm spot near the fuse enclosure has been flagged twice. Immediate shutdown is not required, but inspection should be scheduled.",
  },
];

export const principalIssues = [
  {
    id: "FX-PL-2041",
    location: "North Wing Toilets",
    category: "Plumbing",
    status: "Pending approval",
    note: "Toilet non-functional for 3 days",
  },
  {
    id: "FX-EL-1178",
    location: "Std. 8 Corridor",
    category: "Electrical",
    status: "Inspection scheduled",
    note: "Electrical wiring exposed near notice board",
  },
  {
    id: "FX-ST-0924",
    location: "Library Rear Wall",
    category: "Structural",
    status: "Under monitoring",
    note: "Visible crack widened after rain",
  },
  {
    id: "FX-PL-1985",
    location: "Mid-day Meal Wash Area",
    category: "Plumbing",
    status: "Resolved",
    note: "Water leakage detected under sink line",
  },
];

export const contractorTasks = [
  {
    title: "Repair toilet inlet valve",
    site: "Govt Girls School, Ahmedabad",
    deadline: "2H remaining",
    location: "Block B Toilet Cluster",
    gps: true,
    status: "In progress",
  },
  {
    title: "Secure exposed classroom wiring",
    site: "Primary School, Patan Taluka",
    deadline: "Due 5:30 PM",
    location: "Corridor Switchboard",
    gps: false,
    status: "Assigned",
  },
  {
    title: "Inspect roof crack sealant",
    site: "Govt Boys School, Surendranagar",
    deadline: "Tomorrow",
    location: "Science Room Roofline",
    gps: false,
    status: "Scheduled",
  },
];

export const districtRiskTiles = [
  { name: "Ahmedabad", risk: "Critical", count: 6 },
  { name: "Patan", risk: "High", count: 4 },
  { name: "Bhavnagar", risk: "High", count: 3 },
  { name: "Dahod", risk: "Monitor", count: 2 },
  { name: "Rajkot", risk: "Monitor", count: 2 },
  { name: "Jamnagar", risk: "Stable", count: 1 },
];

export const healthBreakdown = [
  { label: "Plumbing", value: 61, tone: "critical" },
  { label: "Electrical", value: 72, tone: "high" },
  { label: "Structural", value: 84, tone: "medium" },
];

export const trendPoints = [74, 73, 71, 72, 70, 69, 72, 76, 81, 84, 86, 88];
