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

const base64urlToUint8 = (str: string) => {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
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

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const token = (searchParams.get('token') || '').trim();

    if (!token || !token.includes('.')) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers });
    }

    const secret = process.env.QR_SIGNING_SECRET;
    if (!secret) {
      return new Response(JSON.stringify({ error: 'Signing not configured' }), { status: 503, headers });
    }

    const [payloadB64, sigB64] = token.split('.', 2);
    const expectedSig = await hmacSHA256(secret, payloadB64);
    const providedSig = base64urlToUint8(sigB64);
    if (!timingSafeEqual(expectedSig, providedSig)) {
      return new Response(JSON.stringify({ error: 'Signature mismatch' }), { status: 401, headers });
    }

    const payloadBytes = base64urlToUint8(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as { e: string; t: number; v: number };

    // Optional: freshness check (7 days)
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (typeof payload.t !== 'number' || Date.now() - payload.t > maxAgeMs) {
      return new Response(JSON.stringify({ error: 'Token expired' }), { status: 401, headers });
    }

    if (!payload.e || typeof payload.e !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ ok: true, enrollment: payload.e }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
}
