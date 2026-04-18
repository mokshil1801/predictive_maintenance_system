export type UserRole = "peon" | "principal" | "deo" | "contractor";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  assignedSchoolId?: string | null;
  district?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

const TOKEN_STORAGE_KEY = "fixahead_auth_token";
const USER_STORAGE_KEY = "fixahead_auth_user";

type ApiErrorPayload = {
  message?: string;
  code?: string;
  email?: string;
};

export class AuthApiError extends Error {
  code?: string;
  email?: string;
  status: number;

  constructor(message: string, status: number, payload: ApiErrorPayload = {}) {
    super(message);
    this.name = "AuthApiError";
    this.code = payload.code;
    this.email = payload.email;
    this.status = status;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AuthApiError(
      getErrorMessage(payload, "Authentication request failed."),
      response.status,
      typeof payload === "object" && payload !== null ? (payload as ApiErrorPayload) : {},
    );
  }

  return payload as T;
}

export function getRoleRedirectPath(role: UserRole) {
  switch (role) {
    case "peon":
      return "/report";
    case "principal":
      return "/principal";
    case "deo":
      return "/dashboard";
    case "contractor":
      return "/contractor";
    default:
      return "/";
  }
}

export function storeAuthSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export async function loginUser(email: string, password: string) {
  return request<{ message: string; token: string; user: AuthUser }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}) {
  return request<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(payload: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}
