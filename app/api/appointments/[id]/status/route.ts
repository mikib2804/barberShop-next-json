import { readDb, requireAdmin, updateAppointmentStatus, writeDb } from '@/lib/db';
import { AppointmentStatus } from '@/lib/types';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const payload = await request.json();
  if (!['arrived', 'cancelled'].includes(payload.status)) {
    return Response.json({ error: 'status must be arrived or cancelled' }, { status: 400 });
  }

  const db = await readDb();
  try {
    const { id } = await context.params;
    const appointment = updateAppointmentStatus(db, id, payload.status as AppointmentStatus);
    await writeDb(db);
    return Response.json(appointment);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Not found' }, { status: 404 });
  }
}
