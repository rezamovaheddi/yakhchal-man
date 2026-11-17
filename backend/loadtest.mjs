// Load test harness for the Yakhchal Man backend.
// Spawns the local server (or targets a remote URL), then simulates N
// concurrent users performing realistic mixed traffic:
//   - GET  /health                      (10%)
//   - GET  /api/user/fridge/:userId     (30%)
//   - POST /api/user/fridge             (60%)
// The AI endpoint is intentionally excluded: its latency is dominated by the
// external Gemini call and its throughput is capped at 10 req/min by the
// limiter, so hammering it would only burn real API quota.
//
// Usage:
//   node loadtest.mjs --local [users] [seconds]   (spawns server.js on :3999)
//   node loadtest.mjs <baseUrl> [users] [seconds] (remote target)
// Env:
//   DISABLE_RATE_LIMIT=1  pass through to server.js to measure raw capacity

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let mode = args[0];
let USERS = parseInt(args[1], 10) || 100;
let DURATION = parseInt(args[2], 10) || 30;

const PORT = 3999;
let BASE = '';
let serverProc = null;
let rssSamples = [];

const latencies = [];
const statusCounts = {};
let transportErrors = 0;
let started = null;
let stopped = false;

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 23)}] ${msg}`);
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function request(method, urlPath, body, headers = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: urlPath,
        method,
        agent,
        headers: {
          ...(data
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            : {}),
          ...headers,
        },
      },
      (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', () => resolve(-1));
    if (data) req.write(data);
    req.end();
  });
}

const agent = new http.Agent({ keepAlive: true, maxSockets: 200 });

// Authenticated sink users: userId + 256-bit syncSecret, mirroring what the
// mobile app sends after /api/auth/register.
const SINK_USERS = Array.from({ length: 200 }, (_, i) => ({
  // hex-only id: the server validates /^usr-[0-9a-fA-F-]{8,48}$/
  id: `usr-${i.toString(16).padStart(4, '0')}${'abcdef'.repeat(2)}`,
  secret: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
}));

function authHeaderFor(user) {
  return { Authorization: `Bearer ${user.id}:${user.secret}` };
}

async function userLoop(user, authHeader) {
  while (!stopped) {
    const roll = Math.random();
    let p;
    let t0 = performance.now();
    let status;

    if (roll < 0.1) {
      p = request('GET', '/health');
    } else if (roll < 0.4) {
      p = request('GET', `/api/user/fridge/${user.id}`, null, authHeader);
    } else {
      const inventory = Array.from({ length: 8 }, (_, i) => ({
        name: `ماده ${i}`,
        quantity: Math.ceil(Math.random() * 5),
        unit: 'عدد',
      }));
      p = request(
        'POST',
        '/api/user/fridge',
        { userId: user.id, username: `کاربر ${user.id}`, fridgeName: 'یخچال تست', inventory },
        authHeader
      );
    }

    status = await p;
    const dt = performance.now() - t0;

    if (status === -1) {
      transportErrors++;
    } else {
      latencies.push(dt);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
  }
}

async function pollRss(pid) {
  while (!stopped) {
    await new Promise((r) => setTimeout(r, 2000));
    if (stopped) break;
    await new Promise((resolve) => {
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-Command',
        `(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).WS / 1MB`,
      ]);
      let out = '';
      ps.stdout.on('data', (d) => (out += d));
      ps.on('close', () => {
        const v = parseFloat(out.trim());
        if (Number.isFinite(v)) rssSamples.push(v);
        resolve();
      });
      ps.on('error', () => resolve());
    });
  }
}

async function waitHealthy() {
  for (let i = 0; i < 60; i++) {
    const s = await request('GET', '/health');
    if (s === 200) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  if (mode === '--local') {
    serverProc = spawn('node', [path.join(__dirname, 'server.js')], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    serverProc.on('exit', (code, signal) => {
      if (!stopped) log(`⚠️ SERVER EXITED PREMATURELY code=${code} signal=${signal} — CRASH DETECTED`);
    });
    const ok = await waitHealthy();
    if (!ok) {
      console.error('Server did not become healthy in 30s');
      serverProc.kill();
      process.exit(1);
    }
    log(`Local server healthy on :${PORT} (pid ${serverProc.pid})`);
    pollRss(serverProc.pid);
  } else {
    BASE = mode;
    console.log('NOTE: remote mode reuses the local http sender only — remote targets are not supported by this harness.');
    console.log('Use --local for the supported flow.');
    process.exit(1);
  }

  // Register credentials + seed inventory for the sink users so authenticated
  // GETs return real data (200) instead of 404.
  const seedCount = process.env.DISABLE_RATE_LIMIT === '1' ? SINK_USERS.length : 15;
  log(`Registering + seeding ${seedCount} test users...`);
  for (const user of SINK_USERS.slice(0, seedCount)) {
    await request(
      'POST',
      '/api/auth/register',
      { userId: user.id, syncSecret: user.secret, username: 'seed', fridgeName: 'یخچال تست' }
    );
    await request(
      'POST',
      '/api/user/fridge',
      { userId: user.id, username: 'seed', inventory: [{ name: 'تخم‌مرغ', quantity: 2 }] },
      authHeaderFor(user)
    );
  }

  log(`Starting load test: ${USERS} concurrent users for ${DURATION}s ...`);
  started = performance.now();

  const workers = [];
  for (let i = 0; i < USERS; i++) {
    const user = SINK_USERS[i % seedCount];
    workers.push(userLoop(user, authHeaderFor(user)));
  }
  await new Promise((resolve) => setTimeout(resolve, DURATION * 1000));
  stopped = true;
  await Promise.all(workers);

  const wallSec = (performance.now() - started) / 1000;
  const total = latencies.length;

  console.log('\n══════════════════════ LOAD TEST REPORT ══════════════════════');
  console.log(`Users (concurrent):  ${USERS}`);
  console.log(`Duration:            ${DURATION}s (wall ${wallSec.toFixed(1)}s)`);
  console.log(`Completed requests:  ${total}`);
  console.log(`Throughput:          ${(total / wallSec).toFixed(1)} req/s`);
  console.log(`Transport errors:    ${transportErrors}`);
  console.log('Status codes:        ' + JSON.stringify(statusCounts));
  console.log(`Latency p50:         ${percentile(latencies, 50).toFixed(1)} ms`);
  console.log(`Latency p90:         ${percentile(latencies, 90).toFixed(1)} ms`);
  console.log(`Latency p99:         ${percentile(latencies, 99).toFixed(1)} ms`);
  console.log(`Latency max:         ${latencies.length ? latencies.reduce((a, b) => Math.max(a, b)).toFixed(1) : 0} ms`);
  if (rssSamples.length) {
    console.log(`Server RSS start:    ${rssSamples[0].toFixed(0)} MB`);
    console.log(`Server RSS end:      ${rssSamples[rssSamples.length - 1].toFixed(0)} MB`);
    console.log(`Server RSS peak:     ${rssSamples.reduce((a, b) => Math.max(a, b)).toFixed(0)} MB`);
  }
  const success = statusCounts[200] || 0;
  console.log(`Success rate:        ${total + transportErrors ? ((success / (total + transportErrors)) * 100).toFixed(1) : 0}%`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (serverProc) {
    serverProc.kill();
    await new Promise((r) => setTimeout(r, 300));
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  if (serverProc) serverProc.kill();
  process.exit(1);
});
