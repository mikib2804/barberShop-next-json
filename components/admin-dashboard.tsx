"use client";

import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { he } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Lock,
  Settings,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Appointment, AppointmentStatus, BusinessSettings } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});
const statusLabel: Record<AppointmentStatus, string> = {
  planned: "מתוכנן",
  arrived: "הגיע",
  cancelled: "בוטל",
};

export function AdminDashboard() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weekDate, setWeekDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekly, setWeekly] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("hairsalon108-token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
    api
      .getSettings()
      .then(setSettings)
      .catch(() => undefined);
  }, [token, date]);

  useEffect(() => {
    if (!token) return;
    api
      .getAdminAppointments(token, "weekly", weekDate)
      .then(setWeekly)
      .catch(() => undefined);
  }, [token, weekDate]);

  async function login() {
    setError("");
    try {
      const result = await api.login({ email, password });
      window.localStorage.setItem("hairsalon108-token", result.accessToken);
      setToken(result.accessToken);
    } catch {
      setError("פרטי התחברות שגויים");
    }
  }

  async function refresh() {
    const [dailyData, weeklyData] = await Promise.all([
      api.getAdminAppointments(token, "daily", date),
      api.getAdminAppointments(token, "weekly", weekDate),
    ]);
    setAppointments(dailyData);
    setWeekly(weeklyData);
  }

  async function updateStatus(
    status: Extract<AppointmentStatus, "arrived" | "cancelled">,
  ) {
    if (!selected) return;
    const updated = await api.updateStatus(token, selected.id, status);
    setSelected(updated);
    await refresh();
  }

  async function saveSettings(next: BusinessSettings) {
    const updated = await api.updateSettings(token, next);
    setSettings(updated);
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
      <main
        className="flex min-h-screen items-center justify-center bg-navy p-4"
        dir="rtl"
      >
        <section className="w-full max-w-md rounded-lg bg-slatePanel p-8 text-white shadow-soft">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-bronze text-white">
              <Lock size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black">HairSalon108</h1>
              <p className="text-sm text-slate-300">כניסה למערכת</p>
            </div>
          </div>
          <div className="space-y-4 text-black">
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
            {error && (
              <p className="text-sm font-semibold text-red-300">{error}</p>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] p-4" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-navy px-5 py-4 text-white">
          <div>
            <div className="flex items-center gap-3 ">
              <Image
                alt="HairSalon108"
                src="/logoApp.jpg"
                width={56}
                height={56}
                className="mb-2 rounded-full object-cover"
              />
              <h1 className="text-2xl font-black">לוח בקרה של המספרה</h1>
            </div>
            <p className="text-sm text-slate-300">
              HairSalon108 - השמחה של החיילים מתחילה מהתספורת
            </p>
            <p className="text-sm text-slate-300"></p>
          </div>
          <div className="flex gap-4 items-center justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                window.localStorage.removeItem("hairsalon108-token");
                setToken("");
              }}
            >
              יציאה
            </Button>
            <a
              className="hover:-translate-y-1 duration-300 transition-all w-full h-full  px-5 py-3 text-sm font-semibold rounded-md bg-[#9f7138]"
              href="/"
              onClick={() => {
                window.localStorage.removeItem("hairsalon108-token");
                setToken("");
              }}
            >
              מצב לקוח
            </a>
          </div>
        </header>

        <section className="flex flex-col md:grid gap-3 md:grid-cols-3 justify-center items-center w-full">
          <Stat label="סך התורים" value={stats.total} />
          <Stat label="הגיעו" value={stats.arrived} />
          <Stat label="מתוכנן" value={stats.planned} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg bg-white p-5 shadow-soft">
            <h2 className="mb-4 max-md:text-center text-xl font-black">
              התורים של היום
            </h2>
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() => setSelected(appointment)}
                  className="flex w-full items-center justify-between rounded-md border border-slate-200 p-3 text-right hover:border-bronze"
                >
                  <span className="font-black">{appointment.time}</span>
                  <span>{appointment.customer.name}</span>
                  <StatusBadge status={appointment.status} />
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
                <DateSelect
                  className="w-44"
                  value={date}
                  onChange={(value) => setDate(value)}
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
                  <StatusBadge status={appointment.status} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Calendar size={20} />
              יומן שבועי{" "}
              <span className="text-sm font-semibold text-slate-500">
                {format(
                  startOfWeek(new Date(`${weekDate}T00:00:00`), {
                    weekStartsOn: 0,
                  }),
                  "d בMMMM",
                  { locale: he },
                )}{" "}
                -{" "}
                {format(
                  addDays(
                    startOfWeek(new Date(`${weekDate}T00:00:00`), {
                      weekStartsOn: 0,
                    }),
                    6,
                  ),
                  "d בMMMM yyyy",
                  { locale: he },
                )}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  setWeekDate(
                    format(
                      addDays(new Date(`${weekDate}T00:00:00`), -7),
                      "yyyy-MM-dd",
                    ),
                  )
                }
              >
                <ArrowRight size={18} />
                שבוע קודם
              </Button>
              <Button
                variant="ghost"
                onClick={() => setWeekDate(format(new Date(), "yyyy-MM-dd"))}
              >
                השבוע
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setWeekDate(
                    format(
                      addDays(new Date(`${weekDate}T00:00:00`), 7),
                      "yyyy-MM-dd",
                    ),
                  )
                }
              >
                שבוע הבא
                <ArrowLeft size={18} />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <WeeklyGrid
              date={weekDate}
              appointments={weekly}
              onSelect={setSelected}
            />
          </div>
        </section>

        {settings && (
          <SettingsPanel settings={settings} onSave={saveSettings} />
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
                <CheckCircle2 size={18} />
                סמן כהגיע
              </Button>
              <Button
                variant="danger"
                onClick={() => updateStatus("cancelled")}
              >
                <XCircle size={18} />
                בטל תור
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
    <div className="flex flex-col rounded-lg justify-center items-center w-[70%] md:w-full bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-navy">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
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
  appointments: Appointment[];
  onSelect: (appointment: Appointment) => void;
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
                    className={cn(
                      "w-full rounded-md bg-champagne px-2 py-2 text-right text-xs font-bold",
                      `${appointment.status === "cancelled" ? "bg-red-100 text-red-700" : appointment.status === "arrived" ? "bg-emerald-100 text-emerald-700" : "bg-champagne text-navy"}`,
                    )}
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
  settings,
  onSave,
}: {
  settings: BusinessSettings;
  onSave: (settings: BusinessSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [blockDate, setBlockDate] = useState("");
  const [blockHourDate, setBlockHourDate] = useState("");
  const [blockHourTime, setBlockHourTime] = useState("");

  useEffect(() => setDraft(settings), [settings]);

  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        <Settings size={20} />
        הגדרות וחסימות
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">
          שעות פעילות מ {draft.workingHoursStart}
          <TimeSelect
            className="mt-2"
            value={draft.workingHoursStart}
            onChange={(value) =>
              setDraft({ ...draft, workingHoursStart: value })
            }
          />
        </label>
        <label className="text-sm font-bold">
          עד {draft.workingHoursEnd}
          <TimeSelect
            className="mt-2"
            value={draft.workingHoursEnd}
            onChange={(value) => setDraft({ ...draft, workingHoursEnd: value })}
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
                const next = event.target.checked
                  ? [...draft.activeDays, index]
                  : draft.activeDays.filter((item) => item !== index);
                setDraft({ ...draft, activeDays: next.sort() });
              }}
            />
            {day}
          </label>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 p-4">
          <p className="mb-3 font-black">חסום תאריך</p>
          <div className="flex gap-2">
            <DateSelect
              className="flex-1"
              value={blockDate}
              onChange={(value) => setBlockDate(value)}
            />
            <Button
              onClick={() => {
                if (!blockDate) return;
                setDraft({
                  ...draft,
                  blockedDates: Array.from(
                    new Set([...draft.blockedDates, blockDate]),
                  ),
                });
                setBlockDate("");
              }}
            >
              חסום תאריך
            </Button>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 p-4">
          <p className="mb-3 font-black">חסום שעה</p>
          <div className="grid grid-cols-[1fr_130px_auto] gap-2">
            <DateSelect
              value={blockHourDate}
              onChange={(value) => setBlockHourDate(value)}
            />
            <TimeSelect
              value={blockHourTime}
              onChange={(value) => setBlockHourTime(value)}
            />
            <Button
              onClick={() => {
                if (!blockHourDate || !blockHourTime) return;
                setDraft({
                  ...draft,
                  blockedHours: [
                    ...draft.blockedHours,
                    { date: blockHourDate, time: blockHourTime },
                  ],
                });
                setBlockHourDate("");
                setBlockHourTime("");
              }}
            >
              חסום שעה
            </Button>
          </div>
        </div>
      </div>

      <Button className="mt-5" onClick={() => onSave(draft)}>
        שמור הגדרות
      </Button>
    </section>
  );
}

function TimeSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <span className={value ? "" : "text-slate-400"}>
          {value || "בחר שעה"}
        </span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <ul className="absolute z-30 mt-1 max-h-[200px] w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-soft">
          {timeOptions.map((time) => (
            <li key={time}>
              <button
                type="button"
                onClick={() => {
                  onChange(time);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-right text-sm hover:bg-champagne ${
                  time === value ? "bg-champagne font-bold" : ""
                }`}
              >
                {time}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const hebrewWeekDays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function DateSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? new Date(`${value}T00:00:00`) : new Date(),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setViewMonth(new Date(`${value}T00:00:00`));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }, (_, index) =>
    addDays(gridStart, index),
  );
  const display = value
    ? format(new Date(`${value}T00:00:00`), "d בMMMM yyyy", { locale: he })
    : "בחר תאריך";

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm"
      >
        <span>{display}</span>
        <Calendar size={16} className="text-slate-400" />
      </button>
      {open && (
        <div
          dir="rtl"
          className="absolute z-30 mt-1 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-soft"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md p-1 hover:bg-slate-100"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
            >
              <ArrowRight size={18} />
            </button>
            <span className="text-sm font-black">
              {format(viewMonth, "MMMM yyyy", { locale: he })}
            </span>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-slate-100"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            >
              <ArrowLeft size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
            {hebrewWeekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, viewMonth);
              const selected = iso === value;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md text-sm ${
                    selected
                      ? "bg-navy font-bold text-white"
                      : inMonth
                        ? "hover:bg-champagne"
                        : "text-slate-300"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
