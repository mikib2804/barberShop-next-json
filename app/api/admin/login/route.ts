export async function POST(request: Request) {
  const payload = await request.json();
  const email = process.env.ADMIN_EMAIL ?? 'admin@hairsalon108.local';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe108!';
  const token = process.env.ADMIN_TOKEN ?? 'dev-admin-token-change-me';

  if (payload.email !== email || payload.password !== password) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return Response.json({ accessToken: token, admin: { email } });
}

