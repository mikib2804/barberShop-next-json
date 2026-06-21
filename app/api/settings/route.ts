import { readDb, requireAdmin, writeDb } from '@/lib/db';

export async function GET() {
  const db = await readDb();
  return Response.json(db.settings);
}

export async function PATCH(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const payload = await request.json();
  const db = await readDb();
  db.settings = {
    ...db.settings,
    ...payload,
    activeDays: Array.isArray(payload.activeDays) ? payload.activeDays : db.settings.activeDays,
    blockedDates: Array.isArray(payload.blockedDates) ? payload.blockedDates : db.settings.blockedDates,
    blockedHours: Array.isArray(payload.blockedHours) ? payload.blockedHours : db.settings.blockedHours
  };
  await writeDb(db);
  return Response.json(db.settings);
}

