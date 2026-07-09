import "server-only";
import nodemailer from "nodemailer";
import type { AppointmentWithCustomer } from "./types";

const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth:
    smtpUser && smtpPass
      ? {
          user: smtpUser,
          pass: smtpPass,
        }
      : undefined,
});

// function getBookingRecipient(): string | null {
//   return process.env.SMTP_TO ?? smtpUser ?? process.env.ADMIN_EMAIL ?? null;
// }

function assertSmtpConfigured() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !smtpUser ||
    !smtpPass
  ) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS must be configured",
    );
  }
}

export async function sendAppointmentEmail(
  appointment: AppointmentWithCustomer,
): Promise<void> {
  assertSmtpConfigured();

  const to = appointment.customer.email;
  if (!to) {
    throw new Error(
      "SMTP_TO, ADMIN_EMAIL or SMTP_USER must be configured as an email recipient",
    );
  }

  const subject = `New appointment: ${appointment.customer.name} on ${appointment.date} at ${appointment.time}`;
  const text = [
    "✂️ נקבע עבורך תור חדש בהצלחה!",
    "",
    "פרטי התור:",
    `👤 שם: ${appointment.customer.name}`,
    `📱 טלפון: ${appointment.customer.phone}`,
    `📅 תאריך: ${appointment.date}`,
    `⏰ שעה: ${appointment.time}`,
    "",
    "התור ממתין לאישור.",
    "",
    `מספר תור: ${appointment.id}`,
    "",
    "תודה שבחרת ב-HairSalon 108 💈",
  ].join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? smtpUser,
    to,
    subject,
    text,
  });
}
