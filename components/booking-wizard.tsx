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
      .then(setSettings)
      .catch(() => setError("לא ניתן לטעון הגדרות עסק"));
  }, []);

  useEffect(() => {
    if (step >= 2) {
      api
        .getAvailable(date)
        .then((data) => setSlots(data.slots))
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
      await api.createAppointment({ name, phone, date, time });
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
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-navy text-bronze">
              {/* <Scissors size={24} /> */}
              <Image
                alt="HairSalon108"
                src="/logoApp.jpg"
                width={56}
                height={56}
                className="mb-2 rounded-full object-cover"
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

        <div className="grid flex-1 items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="w-full break-words rounded-lg bg-navy p-6 text-white shadow-soft">
            {step === 0 && (
              <div className="flex min-h-[480px] flex-col justify-center">
                <p className="mb-3 text-sm font-semibold text-bronze">
                  ברוכים הבאים
                </p>
                <h2 className="max-w-xl text-center text-5xl font-black leading-tight">
                  HairSalon 108
                </h2>
                <p className="mt-5 max-w-lg text-lg leading-8 text-slate-200">
                  קובעים תור במהירות, בוחרים שעה פנויה, ומקבלים אישור מיידי.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button onClick={() => setStep(1)}>
                    <CalendarDays size={18} />
                    קבע תור
                  </Button>
                  <Button variant="secondary">
                    <Eye size={18} />
                    הצג את התורים שלי
                  </Button>
                </div>
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
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={42} />
                </div>
                <h2 className="text-3xl font-bold">התור נקבע בהצלחה</h2>
                <p className="mt-4 text-lg text-slate-200">
                  Appointment booked successfully for {date} at {time}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  פרטי התור נשלחו אליך ב-SMS.
                </p>
                <Button className="mt-8" onClick={() => setStep(0)}>
                  חזרה למסך הבית
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-lg h-full bg-white p-5 shadow-soft">
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
                          setTime("");
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
                <p className="mt-5 rounded-md bg-champagne px-4 py-3 text-sm font-semibold text-navy">
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
                      className={`flex min-h-14 items-center justify-center rounded-md border text-sm font-bold ${
                        slot.available
                          ? "border-emerald-400 bg-white text-navy hover:bg-mint"
                          : "border-slate-900 bg-slate-900 text-white opacity-40"
                      }`}
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
                    placeholder="שם מלא"
                  />
                </label>
                <label className="block text-sm font-bold">
                  email
                  <Input
                    className="mt-2"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="אימייל"
                  />
                </label>
                <label className="block text-sm font-bold">
                  טלפון
                  <Input
                    className="mt-2"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0501234567"
                    inputMode="tel"
                  />
                </label>
                <Button
                  className="w-full"
                  disabled={loading}
                  onClick={submitBooking}
                >
                  קבע תור
                </Button>
              </div>
            )}

            {step === 0 && (
              <div className="flex min-h-[480px] flex-col justify-center gap-4">
                <InfoRow
                  title="בחירה מהירה"
                  text="תאריך, שעה ופרטים במסך אחד ברור."
                />
                <InfoRow
                  title="ניהול מקצועי"
                  text="פאנל מאובטח לספר עם יומן, שבועי והגדרות."
                />
                <InfoRow
                  title="זמיונות ועדכונים"
                  text="התערכת משתדלת לתת מענה לכל הדרישות של הלקוח :)"
                />
              </div>
            )}
            {step === 4 && (
              <InfoRow
                title="נשמח לראות אותך"
                text="אפשר לקבוע תור נוסף בכל רגע."
              />
            )}
            {error && (
              <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
          </section>
        </div>
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
