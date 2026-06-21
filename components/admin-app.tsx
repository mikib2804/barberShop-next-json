"use client";

import { addDays, format, startOfWeek } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Settings,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AppointmentStatus,
  AppointmentWithCustomer,
  BusinessSettings,
} from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const statusLabel: Record<AppointmentStatus, string> = {
  planned: "מתוכנן",
  arrived: "הגיע",
  cancelled: "בוטל",
};

export function AdminApp() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>(
    [],
  );
  const [weekly, setWeekly] = useState<AppointmentWithCustomer[]>([]);
  const [selected, setSelected] = useState<AppointmentWithCustomer | null>(
    null,
  );
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("json-admin-token");
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
    fetch("/api/settings")
      .then((response) => response.json())
      .then(setSettings);
  }, [token, date]);

  async function login() {
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError("פרטי התחברות שגויים");
      return;
    }
    const data = await response.json();
    window.localStorage.setItem("json-admin-token", data.accessToken);
    setToken(data.accessToken);
  }

  async function refresh() {
    const headers = { Authorization: `Bearer ${token}` };
    const [dailyResponse, weeklyResponse] = await Promise.all([
      fetch(`/api/admin/appointments?view=daily&date=${date}`, { headers }),
      fetch(`/api/admin/appointments?view=weekly&date=${date}`, { headers }),
    ]);
    setAppointments(await dailyResponse.json());
    setWeekly(await weeklyResponse.json());
  }

  async function updateStatus(
    status: Extract<AppointmentStatus, "arrived" | "cancelled">,
  ) {
    if (!selected) return;
    const response = await fetch(`/api/appointments/${selected.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const updated = await response.json();
    setSelected(updated);
    await refresh();
  }

  const stats = useMemo(
    () => ({
      total: appointments.length,
      arrived: appointments.filter((item) => item.status === "arrived").length,
      planned: appointments.filter((item) => item.status === "planned").length,
    }),
    [appointments],
  );

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy p-4">
        <section className="w-full max-w-md rounded-lg bg-panel p-8 text-white shadow-soft">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-bronze">
              <Lock />
            </div>
            <div>
              <h1 className="text-2xl font-black">HairSalon108</h1>
              <p className="text-sm text-slate-300">כניסה למערכת</p>
            </div>
          </div>
          <div className="space-y-4 text-[#94a3b8]">
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="אימייל"
            />
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="סיסמה"
              type="password"
            />
            <Button className="w-full" onClick={login}>
              התחבר
            </Button>
            {error && <p className="text-sm font-bold text-red-300">{error}</p>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] p-4">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex items-center justify-between rounded-lg bg-navy px-5 py-4 text-white">
          <div>
            <h1 className="text-2xl font-black">לוח בקרה</h1>
            <p className="text-sm text-slate-300">Next.js API + JSON DB</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              window.localStorage.removeItem("json-admin-token");
              setToken("");
            }}
          >
            יציאה
          </Button>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <Stat label="סך התורים" value={stats.total} />
          <Stat label="הגיעו" value={stats.arrived} />
          <Stat label="מתוכנן" value={stats.planned} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-xl font-black">Today's Appointments</h2>
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() => setSelected(appointment)}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 p-3 text-right hover:border-bronze"
                >
                  <span className="font-black">{appointment.time}</span>
                  <span>{appointment.customer.name}</span>
                  <Status status={appointment.status} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">יומן יומי</h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setDate(
                      format(
                        addDays(new Date(`${date}T00:00:00`), -1),
                        "yyyy-MM-dd",
                      ),
                    )
                  }
                >
                  <ArrowRight size={18} />
                </Button>
                <Input
                  className="w-40"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    setDate(
                      format(
                        addDays(new Date(`${date}T00:00:00`), 1),
                        "yyyy-MM-dd",
                      ),
                    )
                  }
                >
                  <ArrowLeft size={18} />
                </Button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid grid-cols-[90px_1fr_auto] items-center gap-3 py-3"
                >
                  <span className="font-black">{appointment.time}</span>
                  <span>{appointment.customer.name}</span>
                  <Status status={appointment.status} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-xl font-black">יומן שבועי</h2>
          <div className="overflow-x-auto">
            <WeeklyGrid
              date={date}
              appointments={weekly}
              onSelect={setSelected}
            />
          </div>
        </section>

        {settings && (
          <SettingsPanel
            token={token}
            settings={settings}
            onSaved={setSettings}
          />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-navy/70 p-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black">פרטי תור</h2>
            <div className="mt-5 space-y-2 text-sm">
              <p>שם: {selected.customer.name}</p>
              <p>טלפון: {selected.customer.phone}</p>
              <p>תאריך: {selected.date}</p>
              <p>שעה: {selected.time}</p>
              <p>סטטוס: {statusLabel[selected.status]}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="success" onClick={() => updateStatus("arrived")}>
                <CheckCircle2 size={18} /> סמן כהגיע
              </Button>
              <Button
                variant="danger"
                onClick={() => updateStatus("cancelled")}
              >
                <XCircle size={18} /> בטל תור
              </Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                סגור
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-navy">{value}</p>
    </div>
  );
}

function Status({ status }: { status: AppointmentStatus }) {
  const classes = {
    planned: "bg-blue-50 text-blue-700",
    arrived: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classes[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

function WeeklyGrid({
  date,
  appointments,
  onSelect,
}: {
  date: string;
  appointments: AppointmentWithCustomer[];
  onSelect: (appointment: AppointmentWithCustomer) => void;
}) {
  const weekStart = startOfWeek(new Date(`${date}T00:00:00`), {
    weekStartsOn: 0,
  });
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  return (
    <div className="grid min-w-[760px] grid-cols-7 overflow-hidden rounded-md border border-slate-200">
      {days.map((day) => {
        const value = format(day, "yyyy-MM-dd");
        return (
          <div
            key={value}
            className="min-h-52 border-l border-slate-200 p-3 last:border-l-0"
          >
            <p className="mb-3 text-sm font-black">
              {dayNames[day.getDay()]} {format(day, "dd/MM")}
            </p>
            <div className="space-y-2">
              {appointments
                .filter((appointment) => appointment.date === value)
                .map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={() => onSelect(appointment)}
                    className="w-full rounded-md bg-champagne px-2 py-2 text-right text-xs font-bold"
                  >
                    {appointment.time} {appointment.customer.name}
                  </button>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingsPanel({
  token,
  settings,
  onSaved,
}: {
  token: string;
  settings: BusinessSettings;
  onSaved: (settings: BusinessSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);

  async function save() {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(draft),
    });
    onSaved(await response.json());
  }

  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        <Settings size={20} /> הגדרות וחסימות
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">
          שעות פעילות מ
          <Input
            className="mt-2"
            type="time"
            value={draft.workingHoursStart}
            onChange={(event) =>
              setDraft({ ...draft, workingHoursStart: event.target.value })
            }
          />
        </label>
        <label className="text-sm font-bold">
          עד
          <Input
            className="mt-2"
            type="time"
            value={draft.workingHoursEnd}
            onChange={(event) =>
              setDraft({ ...draft, workingHoursEnd: event.target.value })
            }
          />
        </label>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {dayNames.map((day, index) => (
          <label
            key={day}
            className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm font-bold"
          >
            <input
              type="checkbox"
              checked={draft.activeDays.includes(index)}
              onChange={(event) => {
                const activeDays = event.target.checked
                  ? [...draft.activeDays, index]
                  : draft.activeDays.filter((item) => item !== index);
                setDraft({ ...draft, activeDays: activeDays.sort() });
              }}
            />
            {day}
          </label>
        ))}
      </div>
      <Button className="mt-5" onClick={save}>
        שמור הגדרות
      </Button>
    </section>
  );
}
