import { getAvailableSlots, readDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date) {
    return Response.json({ error: 'date is required' }, { status: 400 });
  }
  const db = await readDb();
  return Response.json({ date, slots: getAvailableSlots(db, date) });
}

