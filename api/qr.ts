export const config = {
  runtime: 'edge',
};

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

const textEncoder = new TextEncoder();

const base64url = (bytes: ArrayBuffer | Uint8Array) => {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = '';
  for (let i = 0; i < b.length; i++) str += String.fromCharCode(b[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

async function hmacSHA256(key: string, data: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, textEncoder.encode(data));
  return new Uint8Array(sig);
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const enrollment = (searchParams.get('enrollment') || '').trim();

    if (!enrollment) {
      return new Response(JSON.stringify({ error: 'Missing enrollment parameter' }), { status: 400, headers });
    }

    const secret = process.env.QR_SIGNING_SECRET;
    if (!secret) {
      // Secret not configured; signal to client to fallback
      return new Response(JSON.stringify({ error: 'Signing not configured' }), { status: 503, headers });
    }

    const payload = {
      e: enrollment,
      t: Date.now(),
      v: 1,
    };
    const payloadJson = JSON.stringify(payload);
    const payloadB64 = base64url(textEncoder.encode(payloadJson));
    const sig = await hmacSHA256(secret, payloadB64);
    const token = `${payloadB64}.${base64url(sig)}`;

    return new Response(JSON.stringify({ token }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
}
