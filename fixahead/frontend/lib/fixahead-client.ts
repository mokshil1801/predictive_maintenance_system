export type RiskLevel = "critical" | "high" | "medium" | "low";

export type SchoolOption = {
  id: string;
  name: string;
  district: string;
  buildingAge: number;
  totalStudents: number;
  isGirlsSchool: boolean;
};

export type QueueItem = {
  id: string;
  predictionId: string;
  schoolId: string;
  schoolName: string;
  district: string;
  issue: string;
  category: string;
  risk: RiskLevel;
  riskScore: number;
  impactScore: number;
  urgencyScore: number;
  priorityScore: number;
  studentImpact: string;
  failureWindow: string;
  failureWindowDays: number;
  reason: string[];
  status: string;
  createdAt: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type DeoAnalytics = {
  totalReports: number;
  highRiskCount: number;
  pendingAssignmentCount: number;
  inProgressRepairs: number;
  completedRepairs: number;
  slaBreaches: number;
  charts: {
    statusDistribution: ChartPoint[];
    categoryDistribution: ChartPoint[];
    weeklyReports: ChartPoint[];
  };
};

export type PrincipalStatus = {
  school: SchoolOption;
  latestReport: null | {
    id: string;
    category: string;
    conditionScore: number;
    createdAt: string;
  };
  issues: Array<{
    id: string;
    category: string;
    issue: string;
    status: string;
    risk: RiskLevel;
    riskScore: number;
    priorityScore: number;
    failureWindowDays: number;
    reason: string[];
    contractorName: string | null;
    assignedAt: string | null;
    deadline: string | null;
    completedAt: string | null;
    reportedAt: string;
  }>;
};

export type PrincipalAnalytics = {
  schoolIssueCount: number;
  activeRepairs: number;
  resolvedRepairs: number;
  currentRiskOverview: ChartPoint[];
  charts: {
    conditionTrend: ChartPoint[];
    categoryRisk: ChartPoint[];
  };
};

export type ContractorTask = {
  id: string;
  workOrderId: string;
  predictionId: string;
  schoolId: string;
  schoolName: string;
  district: string;
  category: string;
  issue: string;
  riskScore: number;
  priorityScore: number;
  reason: string[];
  status: string;
  contractorName: string;
  deadline: string;
  assignedAt: string;
  completedAt: string | null;
};

export type ContractorAnalytics = {
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  charts: {
    workload: ChartPoint[];
  };
};

function authHeaders() {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("fixahead_auth_token") : "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value));

  const response = await fetch(path, { ...init, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "FixAhead API request failed.");
  }

  return payload as T;
}

export async function fetchSchools() {
  const payload = await request<{ schools: SchoolOption[] }>("/api/schools");
  return payload.schools;
}

export async function submitReport(formData: FormData) {
  return request<{ message: string; reportId: string; prediction?: QueueItem; mlError?: string }>(
    "/api/report",
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function fetchPriorityQueue() {
  const payload = await request<{ items: QueueItem[] }>("/api/deo/priority-queue");
  return payload.items;
}

export async function fetchDeoAnalytics() {
  return request<DeoAnalytics>("/api/analytics/deo");
}

export async function assignContractor(predictionId: string, contractorId?: string) {
  return request<{ task: ContractorTask }>("/api/deo/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ predictionId, contractorId }),
  });
}

export async function fetchPrincipalStatus() {
  return request<PrincipalStatus>("/api/principal/current-status");
}

export async function fetchPrincipalAnalytics() {
  return request<PrincipalAnalytics>("/api/analytics/principal");
}

export async function fetchContractorTasks() {
  const payload = await request<{ tasks: ContractorTask[] }>("/api/contractor/tasks");
  return payload.tasks;
}

export async function fetchContractorAnalytics() {
  return request<ContractorAnalytics>("/api/analytics/contractor");
}

export async function startContractorTask(workOrderId: string) {
  return request<{ task: ContractorTask }>(`/api/contractor/task/${workOrderId}/start`, {
    method: "PATCH",
  });
}

export async function completeWorkOrder(workOrderId: string, formData: FormData) {
  return request<{ task: ContractorTask }>(`/api/contractor/task/${workOrderId}/complete`, {
    method: "PATCH",
    body: formData,
  });
}
