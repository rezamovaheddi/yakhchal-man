// Security test suite for the admin panel + rate limiting.
// Spawns three isolated server instances (temp DATA_DIR each) and asserts:
//   Server A (limits off):  admin auth semantics, data access, XSS-safety
//                           of the transport layer, delete semantics
//   Server B (limits on):   admin brute-force lockout, global 10/min cap,
//                           /health exemption, valid-token skip
//   Server C (no token):    admin disabled → 503 everywhere
//
// Run: node tests/admin-security.test.mjs   (exit 1 on any failure)

import { spawn } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_FILE = path.join(__dirname, '..', 'server.js');

const ADMIN_TOKEN = 'test-admin-' + Math.random().toString(36).slice(2) + 'token';
let failures = 0;
let passes = 0;
const servers = [];

function log(msg) { console.log(msg); }

async function t(name, fn) {
  try {
    await fn();
    passes++;
    log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    log(`  ✗ ${name}\n      ${err && err.message}`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message || 'assertion failed');
}

function startServer(port, env) {
  const dataDir = mkdtempSync(path.join(tmpdir(), 'yakhchal-test-'));
  const proc = spawn(process.execPath, [SERVER_FILE], {
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dataDir,
      ADMIN_TOKEN,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  servers.push({ proc, dataDir });
  return proc;
}

const HOST = '127.0.0.1';

function req(port, method, urlPath, { body, token, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const url = `http://${HOST}:${port}${urlPath}`;
  return fetch(url, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function waitHealthy(port) {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://${HOST}:${port}/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server on :${port} never became healthy`);
}

async function main() {
  // ── boot ──────────────────────────────────────────────────────────────────
  startServer(3971, { DISABLE_RATE_LIMIT: '1' });                    // A
  startServer(3972, { RATE_LIMIT_GLOBAL: '10', ADMIN_AUTH_MAX: '10' }); // B
  startServer(3973, { DISABLE_RATE_LIMIT: '1', ADMIN_TOKEN: '' });   // C
  await Promise.all([waitHealthy(3971), waitHealthy(3972), waitHealthy(3973)]);
  log('● three test servers up (3971/3972/3973)\n');

  // ── Server A: admin semantics ─────────────────────────────────────────────
  log('── Server A: auth & data access ──');

  await t('admin endpoints reject missing token (401)', async () => {
    for (const p of ['/api/admin/stats', '/api/admin/users', '/api/admin/events']) {
      const res = await req(3971, 'GET', p);
      assert(res.status === 401, `${p} → ${res.status}, expected 401`);
    }
    const del = await req(3971, 'DELETE', '/api/admin/users/usr-1234567890abcdef');
    assert(del.status === 401, `DELETE → ${del.status}, expected 401`);
  });

  await t('admin endpoints reject wrong token (401)', async () => {
    const res = await req(3971, 'GET', '/api/admin/stats', { token: 'wrong-token-value' });
    assert(res.status === 401, `got ${res.status}, expected 401`);
  });

  await t('token in query string is NOT accepted (401)', async () => {
    const res = await fetch(`http://${HOST}:3971/api/admin/stats?token=${encodeURIComponent(ADMIN_TOKEN)}`);
    assert(res.status === 401, `got ${res.status}, expected 401`);
  });

  let statsShape = null;
  await t('valid token grants access (200) with no-store', async () => {
    const res = await req(3971, 'GET', '/api/admin/stats', { token: ADMIN_TOKEN });
    assert(res.status === 200, `got ${res.status}`);
    assert((res.headers.get('cache-control') || '').includes('no-store'), 'missing Cache-Control: no-store');
    const body = await res.json();
    statsShape = body.stats;
    assert(body.success === true && typeof statsShape.totalUsers === 'number', 'bad stats shape');
  });

  await t('admin page served, static, no token echo', async () => {
    const res = await fetch('http://127.0.0.1:3971/admin');
    assert(res.status === 200, `got ${res.status}`);
    const html = await res.text();
    assert(html.includes('پنل مدیریت'), 'page body missing');
    assert(!html.includes(ADMIN_TOKEN), 'TOKEN VALUE LEAKED INTO PAGE');
    assert((res.headers.get('x-frame-options') || '').toLowerCase().includes('deny'), 'missing X-Frame-Options: DENY');
  });

  const testUser = { id: 'usr-aaaabbbbccccdddd', secret: 'a'.repeat(64) };
  const xssUser = { id: 'usr-bbbbccccddddeeee', secret: 'b'.repeat(64) };
  await t('registered users appear in admin list + stats', async () => {
    const r1 = await req(3971, 'POST', '/api/auth/register', { body: { userId: testUser.id, syncSecret: testUser.secret, username: 'کاربر تست' } });
    assert(r1.status === 200, `register → ${r1.status}`);
    const r2 = await req(3971, 'POST', '/api/auth/register', { body: { userId: xssUser.id, syncSecret: xssUser.secret, username: '<img src=x onerror=alert(1)>' } });
    assert(r2.status === 200, `register xss user → ${r2.status}`);
    // fridge sync with valid Bearer — the users record is created here
    const sync = await req(3971, 'POST', '/api/user/fridge', {
      token: `${testUser.id}:${testUser.secret}`,
      body: { username: 'کاربر تست', fridgeName: 'یخچال تست', inventory: [{ name: 'سیب', quantity: 2 }] },
    });
    assert(sync.status === 200, `fridge sync → ${sync.status}`);
    const syncXss = await req(3971, 'POST', '/api/user/fridge', {
      token: `${xssUser.id}:${xssUser.secret}`,
      body: { username: '<img src=x onerror=alert(1)>', fridgeName: '<script>alert(1)</script>', inventory: [{ name: 'پیاز', quantity: 1 }] },
    });
    assert(syncXss.status === 200, `xss fridge sync → ${syncXss.status}`);

    const list = await (await req(3971, 'GET', '/api/admin/users', { token: ADMIN_TOKEN })).json();
    assert(list.users.some((u) => u.userId === testUser.id), 'test user missing from admin list');
    assert((await (await req(3971, 'GET', '/api/admin/stats', { token: ADMIN_TOKEN })).json()).stats.totalUsers >= 2, 'stats did not count users');
  });

  await t('user detail exposes inventory and flow events', async () => {
    const res = await req(3971, 'GET', `/api/admin/users/${testUser.id}`, { token: ADMIN_TOKEN });
    assert(res.status === 200, `got ${res.status}`);
    const body = await res.json();
    assert(body.user.inventory.length === 1 && body.user.inventory[0].name === 'سیب', 'inventory missing');
    assert(body.events.some((e) => e.type === 'fridge_sync'), 'fridge_sync event missing');
    const feed = await (await req(3971, 'GET', '/api/admin/events', { token: ADMIN_TOKEN })).json();
    assert(feed.events.some((e) => e.type === 'register'), 'register event missing from feed');
  });

  await t('hostile usernames travel as JSON (not HTML) — safe transport', async () => {
    const res = await req(3971, 'GET', `/api/admin/users/${xssUser.id}`, { token: ADMIN_TOKEN });
    assert(res.status === 200, `got ${res.status}`);
    assert((res.headers.get('content-type') || '').includes('application/json'), 'must be JSON, never HTML');
    const body = await res.json();
    assert(body.user.username === '<img src=x onerror=alert(1)>', 'username mangled server-side');
  });

  await t('admin delete removes user AND revokes its credentials', async () => {
    const del = await req(3971, 'DELETE', `/api/admin/users/${testUser.id}`, { token: ADMIN_TOKEN });
    assert(del.status === 200, `delete → ${del.status}`);
    const after = await req(3971, 'GET', `/api/admin/users/${testUser.id}`, { token: ADMIN_TOKEN });
    assert(after.status === 404, `detail after delete → ${after.status}`);
    const fridge = await req(3971, 'GET', `/api/user/fridge/${testUser.id}`, { token: `${testUser.id}:${testUser.secret}` });
    assert(fridge.status === 401, `revoked credential still authenticated (${fridge.status})`);
  });

  await t('admin endpoints reject unknown user ids (404)', async () => {
    const res = await req(3971, 'GET', '/api/admin/users/usr-0000000000000000', { token: ADMIN_TOKEN });
    assert(res.status === 404, `got ${res.status}`);
  });

  // ── Server C: admin disabled without token ────────────────────────────────
  log('── Server C: admin disabled (no ADMIN_TOKEN) ──');

  await t('panel and API return 503 when ADMIN_TOKEN unset', async () => {
    const page = await fetch('http://127.0.0.1:3973/admin');
    assert(page.status === 503, `page → ${page.status}`);
    const api = await fetch('http://127.0.0.1:3973/api/admin/stats', { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    assert(api.status === 503, `api → ${api.status}`);
  });

  // ── Server B: rate limiting ───────────────────────────────────────────────
  log('── Server B: rate limiting (limits ON) ──');

  await t('admin brute-force: 10 wrong tokens pass, 11th is 429-locked', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await req(3972, 'GET', '/api/admin/stats', { token: `brute-${i}` });
      assert(res.status === 401, `attempt ${i + 1} → ${res.status}, expected 401`);
    }
    const locked = await req(3972, 'GET', '/api/admin/stats', { token: 'brute-locked' });
    assert(locked.status === 429, `attempt 11 → ${locked.status}, expected 429`);
  });

  await t('valid admin token bypasses the brute-force lock', async () => {
    const res = await req(3972, 'GET', '/api/admin/stats', { token: ADMIN_TOKEN });
    assert(res.status === 200, `got ${res.status}, expected 200`);
  });

  await t('app API: 10 requests pass, 11th per IP gets 429', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await req(3972, 'POST', '/api/auth/register', { body: { userId: 'bad' } });
      assert(res.status !== 429, `request ${i + 1} unexpectedly rate-limited`);
    }
    const res = await req(3972, 'POST', '/api/auth/register', { body: { userId: 'bad' } });
    assert(res.status === 429, `11th request → ${res.status}, expected 429`);
  });

  await t('/health is exempt from the rate limit', async () => {
    for (let i = 0; i < 30; i++) {
      const res = await fetch('http://127.0.0.1:3972/health');
      assert(res.status === 200, `health call ${i + 1} → ${res.status}`);
    }
  });

  // ── summary ───────────────────────────────────────────────────────────────
  log(`\n═══ admin security suite: ${passes} passed, ${failures} failed ═══`);
  process.exitCode = failures ? 1 : 0;
}

main()
  .catch((err) => {
    console.error('SUITE CRASH:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const s of servers) {
      try { s.proc.kill(); } catch { /* already dead */ }
      try { rmSync(s.dataDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  });
