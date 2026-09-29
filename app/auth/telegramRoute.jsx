import crypto from 'crypto';

export async function POST(req) {
  const data = await req.json();
  const { hash, ...userData } = data;

  if (!hash) {
    return Response.json({ ok: false, error: 'Missing hash' }, { status: 400 });
  }

  const secretKey = crypto
    .createHash('sha256')
    .update(process.env.MERCHANT_TELEGRAM_BOT_TOKEN)
    .digest();

  const checkString = Object.keys(userData)
    .sort()
    .map((k) => `${k}=${userData[k]}`)
    .join('\n');

  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  if (hmac !== hash) {
    return Response.json({ ok: false, error: 'Invalid hash' }, { status: 401 });
  }

  const authAge = Date.now() / 1000 - userData.auth_date;
  if (authAge > 86400) {
    return Response.json({ ok: false, error: 'Login expired' }, { status: 401 });
  }

  // TODO: find or create a user by userData.id (telegram_id) in your DB,
  // then set your own session cookie / JWT here.

  return Response.json({ ok: true, user: userData });
}