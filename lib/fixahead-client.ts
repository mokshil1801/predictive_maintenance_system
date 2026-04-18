export type RiskLevel = "critical" | "high" | "medium" | "low";
export type WorkflowStatus =
  | "reported"
  | "predicted"
  | "awaiting_deo"
  | "assigned"
  | "in_progress"
  | "completed"
  | "verified"
  | "delayed"
  | "prediction_failed";

const TOKEN_STORAGE_KEY = "fixahead_auth_token";

export type SchoolOption = {
  id: string;
  _id: string;
  name: string;
  district: string;
  totalStudents: number;
};

export type QueueItem = {
  id: string;
  predictionId: string;
  schoolId: string;
  school: string;
  district: string;
  issue: string;
  category: "Plumbing" | "Electrical" | "Structural";
  categoryKey: "plumbing" | "electrical" | "structural";
  risk: RiskLevel;
  riskScore: number;
  impactScore: number;
  urgencyScore: number;
  priorityScore: number;
  studentImpact: string;
  studentCount: number;
  failureWindow: string;
  failureWindowDays: number;
  reason: string;
  reasons: string[];
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  workOrderId?: string | null;
};

export type PriorityQueueResponse = {
  success: boolean;
  queue: QueueItem[];
};

export type ChartDatum = {
  label: string;
  value: number;
};

export type DeoAnalytics = {
  success: boolean;
  totalReports: number;
  highRiskCount: number;
  pendingAssignmentCount: number;
  inProgressRepairs: number;
  completedRepairs: number;
  slaBreaches: number;
  charts: {
    predictionsByStatus: ChartDatum[];
    weeklyReports: ChartDatum[];
    priorityDistribution: ChartDatum[];
    districtDistribution: ChartDatum[];
  };
};

export type PrincipalStatus = {
  success: boolean;
  school: { id: string; name: string; district: string } | null;
  issues: Array<
    QueueItem & {
      contractor: { name: string; email: string } | null;
      deadline: string | null;
      assignedAt: string | null;
      completedAt: string | null;
    }
  >;
  latestReports: Array<{
    id: string;
    category: string;
    conditionScore: number;
    waterLeak: boolean;
    wiringExposed: boolean;
    crackWidth: number;
    toiletFunctionality: number;
    photoUrl: string | null;
    createdAt: string;
  }>;
  analytics?: PrincipalAnalytics;
};

export type PrincipalAnalytics = {
  success: boolean;
  schoolIssueCount: number;
  activeRepairs: number;
  resolvedRepairs: number;
  currentRiskOverview: ChartDatum[];
  charts: {
    issueStatusDistribution: ChartDatum[];
    weeklyReportsTrend: ChartDatum[];
  };
};

export type ContractorTask = {
  id: string;
  workOrderId: string;
  predictionId: string;
  title: string;
  site: string;
  deadline: string;
  location: string;
  gps: boolean;
  status: "assigned" | "in_progress" | "completed" | "verified" | "delayed";
  riskScore: number;
  priorityScore: number;
  dueDate: string | null;
  reason: string;
};

export type ContractorAnalytics = {
  success: boolean;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  charts: {
    taskStatusDistribution: ChartDatum[];
  };
};

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload.message === "string" ? payload.message : fallback,
    );
  }

  return payload as T;
}

export async function fetchSchools() {
  const response = await fetch("/api/schools", {
    headers: authHeaders(),
  });

  return parseResponse<{ success: boolean; schools: SchoolOption[] }>(
    response,
    "Unable to load schools.",
  );
}

export async function submitReport(formData: FormData) {
  const response = await fetch("/api/report", {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  return parseResponse<{ success: boolean; message: string; prediction: QueueItem }>(
    response,
    "Unable to submit report.",
  );
}

export async function fetchPriorityQueue() {
  const response = await fetch("/api/deo/priority-queue", {
    headers: authHeaders(),
  });

  return parseResponse<PriorityQueueResponse>(
    response,
    "Unable to load priority queue.",
  );
}

export async function assignContractor(predictionId: string) {
  const response = await fetch("/api/deo/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ predictionId }),
  });

  return parseResponse<{ success: boolean; message: string; workOrderId: string }>(
    response,
    "Unable to assign contractor.",
  );
}

export async function fetchDeoAnalytics() {
  const response = await fetch("/api/analytics/deo", {
    headers: authHeaders(),
  });

  return parseResponse<DeoAnalytics>(
    response,
    "Unable to load DEO analytics.",
  );
}

export async function fetchPrincipalStatus() {
  const response = await fetch("/api/principal/current-status", {
    headers: authHeaders(),
  });

  return parseResponse<PrincipalStatus>(
    response,
    "Unable to load current status.",
  );
}

export async function fetchPrincipalAnalytics() {
  const response = await fetch("/api/analytics/principal", {
    headers: authHeaders(),
  });

  return parseResponse<PrincipalAnalytics>(
    response,
    "Unable to load principal analytics.",
  );
}

export async function fetchContractorTasks() {
  const response = await fetch("/api/contractor/tasks", {
    headers: authHeaders(),
  });

  return parseResponse<{ success: boolean; tasks: ContractorTask[] }>(
    response,
    "Unable to load contractor tasks.",
  );
}

export async function fetchContractorAnalytics() {
  const response = await fetch("/api/analytics/contractor", {
    headers: authHeaders(),
  });

  return parseResponse<ContractorAnalytics>(
    response,
    "Unable to load contractor analytics.",
  );
}

export async function startContractorTask(workOrderId: string) {
  const response = await fetch(`/api/contractor/task/${workOrderId}/start`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  return parseResponse<{ success: boolean; message: string }>(
    response,
    "Unable to start task.",
  );
}

export async function completeWorkOrder(formData: FormData) {
  const workOrderId = String(formData.get("workOrderId") || "");
  const response = await fetch(`/api/contractor/task/${workOrderId}/complete`, {
    method: "PATCH",
    headers: authHeaders(),
    body: formData,
  });

  return parseResponse<{ success: boolean; message: string; photoUrl: string }>(
    response,
    "Unable to complete work order.",
  );
}
