"use client";

import { addDays, format } from "date-fns";
import { CalendarDays, Check, Clock, Eye, Scissors } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { BusinessSettings, Slot } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Image from "next/image";

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const steps = ["בית", "תאריך", "שעה", "פרטים", "אישור"];

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 21 }, (_, index) => addDays(new Date(), index)),
    [],
  );

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        setSettings(data);
        setError("");
      })
      .catch(() => setError("לא ניתן לטעון הגדרות עסק"));
  }, []);

  useEffect(() => {
    if (step >= 2) {
      api
        .getAvailable(date)
        .then((data) => {
          setSlots(data.slots);
          setError("");
        })
        .catch(() => setError("לא ניתן לטעון שעות זמינות"));
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

  const activeHours = settings
    ? `שעות: ${settings.activeDays.map((day) => dayNames[day]).join(", ")} ${settings.workingHoursStart}-${settings.workingHoursEnd}`
    : "טוען שעות פעילות";

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-navy text-bronze flex-shrink-0">
              <Image
                src="/logoApp.jpg"
                alt="HairSalon108"
                width={56}
                height={56}
                className="rounded-md object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">HairSalon108</h1>
              <p className="text-sm text-slate-500">
                מערכת לקביעת תורים - השמחה של החיילים מתחילה מהתספורת
              </p>
            </div>
          </div>
          <a className="text-sm font-semibold text-bronze" href="/admin">
            ניהול
          </a>
        </div>

        <div className="mb-8 grid grid-cols-5 gap-2">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`rounded-md px-2 py-3 text-center text-xs font-semibold ${
                index <= step ? "bg-navy text-white" : "bg-white text-slate-500"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left Panel */}
          <section
            className="
      relative overflow-hidden rounded-2xl 
      bg-gradient-to-br from-navy via-navy to-slate-900
      p-6 text-white shadow-xl
      sm:p-8
    "
          >
            {/* Decorative background */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-bronze/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10">
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
                <PanelTitle
                  title="בחירת תאריך"
                  subtitle="בחרו יום פעילות פנוי מתוך שלושת השבועות הקרובים."
                />
              )}

              {step === 2 && (
                <PanelTitle
                  title="בחירת שעה"
                  subtitle="בחרו משבצת פנויה. שעות תפוסות מוצגות כלא זמינות."
                />
              )}

              {step === 3 && (
                <PanelTitle
                  title="פרטי הלקוח"
                  subtitle="נשמור את הפרטים לקביעת התור ולשליחת אישור."
                />
              )}

              {step === 4 && (
                <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                    <Check size={46} />
                  </div>

                  <h2 className="text-3xl font-black">התור נקבע בהצלחה</h2>

                  <p className="mt-4 text-lg text-slate-200">
                    {date} בשעה {time}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    פרטי התור נשלחו אליך ב-SMS.
                  </p>

                  <Button
                    className="mt-8 w-full sm:w-auto"
                    onClick={() => setStep(0)}
                  >
                    חזרה למסך הבית
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Right Panel */}
          <section
            className="
      h-full rounded-2xl border border-slate-100 
      bg-white p-5 shadow-xl
      sm:p-6
    "
          >
            {step === 0 && (
              <div className="flex min-h-[480px] flex-col justify-center gap-4">
                <InfoRow
                  title="בחירה מהירה"
                  text="תאריך, שעה ופרטים במסך אחד ברור."
                />

                <InfoRow
                  title="מקצועיות מעל הכל"
                  text="אין מקום לקצבים וחובבנים! תספורת איכותית ומדויקת ברמה הכי גבוהה."
                />

                <InfoRow
                  title="זמינות ועדכונים"
                  text="מערכת חכמה שמסייעת ללקוחות לקבוע תורים בקלות."
                />
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
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

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-h-[480px] flex-col justify-center">
      <p className="mb-3 text-sm font-semibold text-bronze">HairSalon108</p>
      <h2 className="text-4xl font-black">{title}</h2>
      <p className="mt-4 max-w-md text-lg leading-8 text-slate-200">
        {subtitle}
      </p>
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
