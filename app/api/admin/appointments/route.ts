import { format } from 'date-fns';
import { getAdminAppointments, readDb, requireAdmin } from '@/lib/db';

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') === 'weekly' ? 'weekly' : 'daily';
  const date = searchParams.get('date') ?? format(new Date(), 'yyyy-MM-dd');
  const db = await readDb();
  return Response.json(getAdminAppointments(db, view, date));
}

