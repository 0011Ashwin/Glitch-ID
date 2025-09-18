import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getAllMembers, replaceAllMembers, clearMembers } from './db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

function noStore(res) {
  res.set({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
}

// Members API (SQLite)
app.get('/api/members', (req, res) => {
  noStore(res);
  try {
    const members = getAllMembers();
    res.status(200).json({ members });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load members' });
  }
});

app.post('/api/members', (req, res) => {
  noStore(res);
  try {
    const { members } = req.body || {};
    if (!Array.isArray(members)) {
      return res.status(400).json({ error: 'Invalid data format. "members" should be an array.' });
    }
    replaceAllMembers(members);
    res.status(200).json({ message: 'Data saved successfully.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save members' });
  }
});

app.delete('/api/members', (req, res) => {
  noStore(res);
  try {
    clearMembers();
    res.status(200).json({ message: 'All data cleared.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to clear members' });
  }
});

// QR signing helpers
function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function base64urlToBuf(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

app.get('/api/qr', (req, res) => {
  noStore(res);
  const enrollment = String(req.query.enrollment || '').trim();
  if (!enrollment) return res.status(400).json({ error: 'Missing enrollment parameter' });
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) return res.status(503).json({ error: 'Signing not configured' });
  const payload = { e: enrollment, t: Date.now(), v: 1 };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64url(Buffer.from(payloadJson, 'utf8'));
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest();
  const token = `${payloadB64}.${base64url(sig)}`;
  res.status(200).json({ token });
});

app.get('/api/verify', (req, res) => {
  noStore(res);
  const token = String(req.query.token || '').trim();
  if (!token || !token.includes('.')) return res.status(400).json({ error: 'Invalid token' });
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) return res.status(503).json({ error: 'Signing not configured' });
  const [payloadB64, sigB64] = token.split('.', 2);
  const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest();
  const provided = base64urlToBuf(sigB64);
  if (!crypto.timingSafeEqual(expected, provided)) return res.status(401).json({ error: 'Signature mismatch' });
  const payload = JSON.parse(base64urlToBuf(payloadB64).toString('utf8'));
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (typeof payload.t !== 'number' || Date.now() - payload.t > maxAgeMs) return res.status(401).json({ error: 'Token expired' });
  if (!payload.e || typeof payload.e !== 'string') return res.status(400).json({ error: 'Invalid payload' });
  res.status(200).json({ ok: true, enrollment: payload.e });
});

// Static in prod
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
