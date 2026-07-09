import { Appointment, AppointmentStatus, BusinessSettings } from "./types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? body.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  getSettings: () => request<BusinessSettings>("/api/settings"),
  getAvailable: (date: string) =>
    request<{
      date: string;
      slots: Array<{ time: string; available: boolean }>;
    }>(`/api/appointments/available?date=${date}`),
  createAppointment: (payload: {
    name: string;
    phone: string;
    email: string;
    date: string;
    time: string;
  }) =>
    request<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ accessToken: string; admin: { email: string } }>(
      "/api/admin/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  getAdminAppointments: (
    token: string,
    view: "daily" | "weekly",
    date: string,
  ) =>
    request<Appointment[]>(
      `/api/admin/appointments?view=${view}&date=${date}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),
  updateStatus: (
    token: string,
    id: string,
    status: Extract<AppointmentStatus, "arrived" | "cancelled">,
  ) =>
    request<Appointment>(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),
  updateSettings: (token: string, payload: BusinessSettings) =>
    request<BusinessSettings>("/api/settings", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
};
