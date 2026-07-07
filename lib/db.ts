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
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    })),
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      customerId: appointment.customerId,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
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

export async function writeDb(db: JsonDb): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.businessSettings.upsert({
      where: { id: "singleton" },
      update: {
        workingHoursStart: db.settings.workingHoursStart,
        workingHoursEnd: db.settings.workingHoursEnd,
        activeDays: db.settings.activeDays as Prisma.InputJsonValue,
        blockedDates: db.settings.blockedDates as Prisma.InputJsonValue,
        blockedHours: db.settings
          .blockedHours as unknown as Prisma.InputJsonValue,
        slotMinutes: db.settings.slotMinutes,
      },
      create: {
        id: "singleton",
        workingHoursStart: db.settings.workingHoursStart,
        workingHoursEnd: db.settings.workingHoursEnd,
        activeDays: db.settings.activeDays as Prisma.InputJsonValue,
        blockedDates: db.settings.blockedDates as Prisma.InputJsonValue,
        blockedHours: db.settings
          .blockedHours as unknown as Prisma.InputJsonValue,
        slotMinutes: db.settings.slotMinutes,
      },
    });

    for (const customer of db.customers) {
      await tx.customer.upsert({
        where: { id: customer.id },
        update: { name: customer.name, phone: customer.phone },
        create: customer,
      });
    }

    for (const appointment of db.appointments) {
      await tx.appointment.upsert({
        where: { id: appointment.id },
        update: {
          customerId: appointment.customerId,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
        },
        create: appointment,
      });
    }
  });
}

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

export function generateSlots(settings: BusinessSettings): string[] {
  const start = toMinutes(settings.workingHoursStart);
  const end = toMinutes(settings.workingHoursEnd);
  const slots: string[] = [];
  for (let minutes = start; minutes < end; minutes += settings.slotMinutes) {
    slots.push(toTime(minutes));
  }
  return slots;
}

export function getAvailableSlots(
  db: JsonDb,
  date: string,
): Array<{ time: string; available: boolean }> {
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
      .filter(
        (appointment) =>
          appointment.date === date && appointment.status !== "cancelled",
      )
      .map((appointment) => appointment.time),
  );
  const blocked = new Set(
    settings.blockedHours
      .filter((item) => item.date === date)
      .map((item) => item.time),
  );

  return generateSlots(settings).map((time) => ({
    time,
    available: !taken.has(time) && !blocked.has(time),
  }));
}

export function createAppointment(
  db: JsonDb,
  payload: { name: string; phone: string; date: string; time: string },
): AppointmentWithCustomer {
  const slots = getAvailableSlots(db, payload.date);
  const slot = slots.find((item) => item.time === payload.time);
  if (!slot?.available) {
    throw new Error("Selected time is not available");
  }

  let customer = db.customers.find((item) => item.phone === payload.phone);
  if (!customer) {
    customer = { id: randomUUID(), name: payload.name, phone: payload.phone };
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

export function withCustomers(
  db: JsonDb,
  appointments: StoredAppointment[],
): AppointmentWithCustomer[] {
  return appointments.map((appointment) => {
    const customer = db.customers.find(
      (item) => item.id === appointment.customerId,
    ) ?? {
      id: appointment.customerId,
      name: "לקוח לא ידוע",
      phone: "",
    };
    return { ...appointment, customer };
  });
}

export function getAdminAppointments(
  db: JsonDb,
  view: "daily" | "weekly",
  date: string,
): AppointmentWithCustomer[] {
  if (view === "weekly") {
    const base = parseISO(`${date}T00:00:00`);
    const start = startOfWeek(base, { weekStartsOn: 0 });
    const end = endOfWeek(base, { weekStartsOn: 0 });
    const dates: string[] = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      dates.push(format(cursor, "yyyy-MM-dd"));
    }
    return withCustomers(
      db,
      db.appointments.filter((appointment) => dates.includes(appointment.date)),
    ).sort(sortByDateTime);
  }

  return withCustomers(
    db,
    db.appointments.filter((appointment) => appointment.date === date),
  ).sort(sortByDateTime);
}

export function updateAppointmentStatus(
  db: JsonDb,
  id: string,
  status: AppointmentStatus,
): AppointmentWithCustomer {
  const appointment = db.appointments.find((item) => item.id === id);
  if (!appointment) {
    throw new Error("Appointment not found");
  }
  appointment.status = status;
  return withCustomers(db, [appointment])[0];
}

function sortByDateTime(
  a: AppointmentWithCustomer,
  b: AppointmentWithCustomer,
): number {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}
