"use client";

import { addDays, format } from "date-fns";
import { CalendarDays, Check, Clock, Eye, Scissors } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppointmentWithCustomer, BusinessSettings } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Image from "next/image";
import { api } from "@/lib/api";
const steps = ["בית", "תאריך", "שעה", "פרטים", "אישור"];
const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function BookingApp() {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<
    Array<{ time: string; available: boolean }>
  >([]);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 21 }, (_, index) => addDays(new Date(), index)),
    [],
  );

  console.log("ar");

  useEffect(() => {
    fetch("/api/settings")
      .then(async (response) => await response.json())
      .then(setSettings)
      .catch(() => setError("לא ניתן לטעון הגדרות"));
  }, []);

  useEffect(() => {
    if (step >= 2) {
      fetch(`/api/appointments/available?date=${date}`)
        .then((response) => response.json())
        .then((data) => setSlots(data.slots ?? []));
    }
  }, [date, step]);
  async function submitBooking() {
    setError("");
    if (name.trim().length < 2 || phone.trim().length < 9) {
      setError("יש למלא שם מלא ומספר טלפון תקין");
      return;
    }
    if (!email.includes("@") || !email.includes(".com")) {
      setError("יש למלא מייל תקין");
      return;
    }

    setLoading(true);
    try {
      await api.createAppointment({ name, phone, email, date, time });
      setStep(4);
    } catch (event) {
      setError(
        event instanceof Error ? event.message : "לא ניתן לקבוע את התור",
      );
    } finally {
      setLoading(false);
    }
  }
  async function book() {
    setError("");
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, date, time }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "לא ניתן לקבוע את התור");
      return;
    }
    (await response.json()) as AppointmentWithCustomer;
    setStep(4);
  }

  const activeHours = settings
    ? `שעות: ${settings.activeDays.map((day) => dayNames[day]).join(", ")} ${settings.workingHoursStart}-${settings.workingHoursEnd}`
    : "טוען שעות פעילות";

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-navy text-bronze">
              <Scissors />
            </div>
            <div>
              <h1 className="text-2xl font-black text-navy">HairSalon108</h1>
              <p className="text-sm text-slate-500">
                מערכת לקביעת תורים - השמחה של החיילים מתחילה מהתספורת
              </p>
            </div>
          </div>
          <a className="font-semibold text-bronze" href="/admin">
            ניהול
          </a>
        </header>

        <div className="mb-8 grid grid-cols-5 gap-2">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`rounded-md px-2 py-3 text-center text-xs font-bold ${index <= step ? "bg-navy text-white" : "bg-white text-slate-500"}`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-lg bg-navy p-8 text-white shadow-soft">
            {step === 0 && (
              <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
                <p className="mb-5 rounded-full bg-bronze/20 px-4 py-1 text-sm font-bold text-bronze">
                  ברוכים הבאים
                </p>

                <div className="mb-6 rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <Image
                    src="/logoApp.jpg"
                    alt="HairSalon108"
                    width={170}
                    height={170}
                    className="rounded-xl object-cover"
                  />
                </div>

                <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                  HairSalon 108
                </h2>

                <p className="mt-5 max-w-md text-base leading-8 text-slate-200 sm:text-lg">
                  קובעים תור במהירות, בוחרים שעה פנויה, ומקבלים אישור מיידי.
                </p>

                <Button
                  className="mt-8 w-full sm:w-auto"
                  onClick={() => setStep(1)}
                >
                  <CalendarDays size={18} />
                  קבע תור
                </Button>
              </div>
            )}
            {step === 1 && (
              <Panel title="בחירת תאריך" text="בחרו יום פעילות פנוי." />
            )}
            {step === 2 && (
              <Panel
                title="בחירת שעה"
                text="שעות זמינות מחושבות מתוך קובץ db.json."
              />
            )}
            {step === 3 && (
              <Panel title="פרטי הלקוח" text="מלאו שם וטלפון לאישור התור." />
            )}
            {step === 4 && (
              <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={42} />
                </div>
                <h2 className="text-3xl font-black">התור נקבע בהצלחה</h2>
                <p className="mt-4 text-lg text-slate-200">
                  Appointment booked successfully for {date} at {time}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  פרטי התור נשלחו אליך במייל. נתראה :)
                </p>
                <Button className="mt-8" onClick={() => setStep(0)}>
                  חזרה למסך הבית
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-lg bg-white p-5 shadow-soft">
            {step === 0 && <Info />}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {days.map((day) => {
                    const value = format(day, "yyyy-MM-dd");
                    const active =
                      settings?.activeDays.includes(day.getDay()) ?? false;
                    const blocked =
                      settings?.blockedDates.includes(value) ?? false;
                    return (
                      <button
                        key={value}
                        disabled={!active || blocked}
                        onClick={() => {
                          setDate(value);
                          setStep(2);
                        }}
                        className="min-h-24 rounded-md border border-slate-200 p-3 text-right transition enabled:hover:border-bronze enabled:hover:bg-champagne disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <span className="block text-sm font-bold">
                          {dayNames[day.getDay()]}
                        </span>
                        <span className="mt-2 block text-2xl font-black">
                          {format(day, "dd")}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(day, "MM.yyyy")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-5 rounded-md bg-champagne px-4 py-3 text-sm font-semibold">
                  {activeHours}
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    שינוי תאריך
                  </Button>
                  <p className="font-bold">{date}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => {
                        setTime(slot.time);
                        setStep(3);
                      }}
                      className={`flex min-h-14 items-center justify-center rounded-md border text-sm font-bold ${slot.available ? "border-emerald-400 hover:bg-mint" : "border-slate-900 bg-slate-900 text-white opacity-40"}`}
                    >
                      <Clock size={16} />
                      <span className="mr-2">{slot.time}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-md bg-champagne px-4 py-3 text-sm font-semibold">
                  {date} בשעה {time}
                </div>
                <label className="block text-sm font-bold">
                  שם מלא
                  <Input
                    className="mt-2"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="block text-sm font-bold">
                  הכנס מייל
                  <Input
                    className="mt-2"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="block text-sm font-bold">
                  טלפון
                  <Input
                    className="mt-2"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
                <Button className="w-full" onClick={book}>
                  קבע תור
                </Button>
              </div>
            )}
            {error && (
              <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </p>
            )}
          </section>
        </div>

        <footer className="mt-6 border-t border-none pt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} כל הזכויות שמורות לצוות מערכות מידע
        </footer>
      </section>
    </main>
  );
}

function Panel({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[480px] flex-col justify-center">
      <p className="mb-3 text-sm font-semibold text-bronze">HairSalon108</p>
      <h2 className="text-4xl font-black">{title}</h2>
      <p className="mt-4 max-w-md text-lg leading-8 text-slate-200">{text}</p>
    </div>
  );
}
function InfoRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <p className="font-bold text-navy">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
function Info() {
  return (
    <div className="flex min-h-[480px] flex-col justify-center gap-4">
      <InfoRow title="בחירה מהירה" text="תאריך, שעה ופרטים במסך אחד ברור." />

      <InfoRow
        title="מקצועיות מעל הכל"
        text="אין מקום לקצבים וחובבנים! תספורת איכותית ומדויקת ברמה הכי גבוהה."
      />

      <InfoRow
        title="זמינות ועדכונים"
        text="מערכת חכמה שמסייעת ללקוחות לקבוע תורים בקלות."
      />
    </div>
  );
}
