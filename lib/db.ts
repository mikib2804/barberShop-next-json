import { randomUUID } from "crypto";
import { addDays, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  AppointmentStatus,
  AppointmentWithCustomer,
  BusinessSettings,
  JsonDb,
  StoredAppointment,
} from "./types";

const defaultSettings: BusinessSettings = {
  workingHoursStart: "08:00",
  workingHoursEnd: "13:00",
  activeDays: [0, 1, 2, 3, 4],
  blockedDates: [],
  blockedHours: [],
  slotMinutes: 30,
};

/**
 * SAFE: Only runs when explicitly called inside API route
 * (NOT at module import time)
 */
export async function readDb(): Promise<JsonDb> {
  const [customers, appointments, settings] = await Promise.all([
    prisma.customer.findMany(),
    prisma.appointment.findMany(),
    prisma.businessSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: {
        id: "singleton",
        workingHoursStart: defaultSettings.workingHoursStart,
        workingHoursEnd: defaultSettings.workingHoursEnd,
        activeDays: defaultSettings.activeDays as Prisma.InputJsonValue,
        blockedDates: defaultSettings.blockedDates as Prisma.InputJsonValue,
        blockedHours: defaultSettings.blockedHours as Prisma.InputJsonValue,
        slotMinutes: defaultSettings.slotMinutes,
      },
    }),
  ]);

  return {
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
    })),
    appointments: appointments.map((a) => ({
      id: a.id,
      customerId: a.customerId,
      date: a.date,
      time: a.time,
      status: a.status,
    })),
    settings: {
      workingHoursStart: settings.workingHoursStart,
      workingHoursEnd: settings.workingHoursEnd,
      activeDays: settings.activeDays as unknown as number[],
      blockedDates: settings.blockedDates as unknown as string[],
      blockedHours: settings.blockedHours as unknown as Array<{
        date: string;
        time: string;
      }>,
      slotMinutes: settings.slotMinutes,
    },
  };
}

/**
 * SAFE write
 */
export async function writeDb(db: JsonDb): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.businessSettings.upsert({
      where: { id: "singleton" },
      update: {
        workingHoursStart: db.settings.workingHoursStart,
        workingHoursEnd: db.settings.workingHoursEnd,
        activeDays: db.settings.activeDays as Prisma.InputJsonValue,
        blockedDates: db.settings.blockedDates as Prisma.InputJsonValue,
        blockedHours: db.settings.blockedHours as Prisma.InputJsonValue,
        slotMinutes: db.settings.slotMinutes,
      },
      create: {
        id: "singleton",
        workingHoursStart: db.settings.workingHoursStart,
        workingHoursEnd: db.settings.workingHoursEnd,
        activeDays: db.settings.activeDays as Prisma.InputJsonValue,
        blockedDates: db.settings.blockedDates as Prisma.InputJsonValue,
        blockedHours: db.settings.blockedHours as Prisma.InputJsonValue,
        slotMinutes: db.settings.slotMinutes,
      },
    });

    await Promise.all([
      ...db.customers.map((c) =>
        tx.customer.upsert({
          where: { id: c.id },
          update: { name: c.name, phone: c.phone },
          create: c,
        }),
      ),

      ...db.appointments.map((a) =>
        tx.appointment.upsert({
          where: { id: a.id },
          update: {
            customerId: a.customerId,
            date: a.date,
            time: a.time,
            status: a.status,
          },
          create: a,
        }),
      ),
    ]);
  });
}

/**
 * AUTH helper (safe)
 */
export function requireAdmin(request: Request): Response | null {
  const expected = process.env.ADMIN_TOKEN ?? "dev-admin-token-change-me";
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (token !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Slots logic (unchanged but safe)
 */
export function generateSlots(settings: BusinessSettings): string[] {
  const start = toMinutes(settings.workingHoursStart);
  const end = toMinutes(settings.workingHoursEnd);

  const slots: string[] = [];
  for (let m = start; m < end; m += settings.slotMinutes) {
    slots.push(toTime(m));
  }
  return slots;
}

export function getAvailableSlots(db: JsonDb, date: string) {
  const selected = parseISO(`${date}T00:00:00`);
  const day = selected.getDay();

  const { settings } = db;

  if (
    !settings.activeDays.includes(day) ||
    settings.blockedDates.includes(date)
  ) {
    return [];
  }

  const taken = new Set(
    db.appointments
      .filter((a) => a.date === date && a.status !== "cancelled")
      .map((a) => a.time),
  );

  const blocked = new Set(
    settings.blockedHours.filter((b) => b.date === date).map((b) => b.time),
  );

  return generateSlots(settings).map((time) => ({
    time,
    available: !taken.has(time) && !blocked.has(time),
  }));
}

/**
 * Business logic
 */
export function createAppointment(
  db: JsonDb,
  payload: { name: string; phone: string; date: string; time: string },
): AppointmentWithCustomer {
  const slots = getAvailableSlots(db, payload.date);
  const slot = slots.find((s) => s.time === payload.time);

  if (!slot?.available) {
    throw new Error("Selected time is not available");
  }

  let customer = db.customers.find((c) => c.phone === payload.phone);

  if (!customer) {
    customer = {
      id: randomUUID(),
      name: payload.name,
      phone: payload.phone,
    };
    db.customers.push(customer);
  } else {
    customer.name = payload.name;
  }

  const appointment: StoredAppointment = {
    id: randomUUID(),
    customerId: customer.id,
    date: payload.date,
    time: payload.time,
    status: "planned",
  };

  db.appointments.push(appointment);

  return { ...appointment, customer };
}

/**
 * IMPORTANT: sorting safe
 */
function sortByDateTime(
  a: AppointmentWithCustomer,
  b: AppointmentWithCustomer,
) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

/**
 * Weekly / daily queries
 */
export function getAdminAppointments(
  db: JsonDb,
  view: "daily" | "weekly",
  date: string,
): AppointmentWithCustomer[] {
  if (view === "weekly") {
    const base = parseISO(`${date}T00:00:00`);
    const start = startOfWeek(base, { weekStartsOn: 0 });
    const end = endOfWeek(base, { weekStartsOn: 0 });

    const days: string[] = [];

    for (let d = start; d <= end; d = addDays(d, 1)) {
      days.push(format(d, "yyyy-MM-dd"));
    }

    return withCustomers(
      db,
      db.appointments.filter((a) => days.includes(a.date)),
    ).sort(sortByDateTime);
  }

  return withCustomers(
    db,
    db.appointments.filter((a) => a.date === date),
  ).sort(sortByDateTime);
}

export function withCustomers(
  db: JsonDb,
  appointments: StoredAppointment[],
): AppointmentWithCustomer[] {
  return appointments.map((a) => {
    const customer = db.customers.find((c) => c.id === a.customerId) ?? {
      id: a.customerId,
      name: "לקוח לא ידוע",
      phone: "",
    };

    return { ...a, customer };
  });
}

/**
 * helpers
 */
function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
