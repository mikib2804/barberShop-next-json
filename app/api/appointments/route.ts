import { createAppointment, readDb, writeDb } from '@/lib/db';

export async function POST(request: Request) {
  const payload = await request.json();
  if (!payload.name || !payload.phone || !payload.date || !payload.time) {
    return Response.json({ error: 'name, phone, date and time are required' }, { status: 400 });
  }

  const db = await readDb();
  try {
    const appointment = createAppointment(db, payload);
    await writeDb(db);
    return Response.json(appointment, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not create appointment' }, { status: 409 });
  }
}

