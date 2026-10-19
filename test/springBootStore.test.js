// Store de progreso respaldado por Spring Boot (src/progress/springBootStore.js).
// Se inyecta un fetch falso: no hace falta backend ni red.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SpringBootProgressStore, ProgressStoreError, schemaVersionOf } from '../src/progress/springBootStore.js';

const SECRET = '0123456789abcdef0123456789abcdef';
const resp = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

function makeStore(handler, extra = {}) {
  const calls = [];
  const fetchImpl = async (url, opts) => { calls.push({ url, opts }); return handler({ url, opts }); };
  const store = new SpringBootProgressStore({
    baseUrl: 'http://localhost:8080/planillas/', secret: SECRET, courseId: 'planillas', fetchImpl, ...extra,
  });
  return { store, calls };
}

test.beforeEach((t) => { t.mock.method(console, 'error', () => {}); }); // los errores esperados no ensucian la salida

test('get: 404 del backend = todavía no hay progreso (null)', async () => {
  const { store } = makeStore(() => resp(404, { error: 'no_encontrado' }));
  assert.equal(await store.get('k1'), null);
});

test('get: devuelve { doc, updatedAt } y manda secreto, clave y curso en headers', async () => {
  const doc = { xp: 50 };
  const { store, calls } = makeStore(() => resp(200, { progress: doc, updatedAt: '2026-09-30T10:00:00Z', schemaVersion: 2 }));
  assert.deepEqual(await store.get('k1'), { doc, updatedAt: '2026-09-30T10:00:00Z' });
  assert.equal(calls[0].url, 'http://localhost:8080/planillas/api/v1/progress');
  assert.equal(calls[0].opts.method, 'GET');
  assert.equal(calls[0].opts.headers['X-Internal-Secret'], SECRET);
  assert.equal(calls[0].opts.headers['X-Student-Key'], 'k1');
  assert.equal(calls[0].opts.headers['X-Course-Id'], 'planillas');
});

test('put: envía progress como string y la schemaVersion que trae el documento', async () => {
  const doc = { schemaVersion: 2, xp: 50 };
  const { store, calls } = makeStore(() => resp(200, { updatedAt: '2026-09-30T10:00:00Z' }));
  assert.deepEqual(await store.put('k1', doc), { updatedAt: '2026-09-30T10:00:00Z' });
  const sent = JSON.parse(calls[0].opts.body);
  assert.equal(sent.schemaVersion, 2);
  assert.equal(typeof sent.progress, 'string');
  assert.deepEqual(JSON.parse(sent.progress), doc);
  assert.equal(calls[0].opts.method, 'PUT');
  assert.equal(calls[0].opts.headers['Content-Type'], 'application/json');
});

test('schemaVersionOf: entero >= 1 o 1', () => {
  assert.equal(schemaVersionOf({ schemaVersion: 2 }), 2);
  for (const bad of [undefined, null, 0, -1, 1.5, '2', NaN]) assert.equal(schemaVersionOf({ schemaVersion: bad }), 1);
  assert.equal(schemaVersionOf(null), 1);
});

test('503 / red caída / timeout => store_unavailable (reintentable)', async () => {
  const s503 = makeStore(() => resp(503, { error: 'almacenamiento_no_disponible' })).store;
  await assert.rejects(() => s503.get('k'), (e) => e instanceof ProgressStoreError && e.code === 'store_unavailable' && e.status === 503);

  const down = makeStore(() => { const e = new TypeError('fetch failed'); e.cause = { code: 'ECONNREFUSED' }; throw e; }).store;
  await assert.rejects(() => down.put('k', {}), (e) => e.code === 'store_unavailable');

  const slow = makeStore(() => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; }).store;
  await assert.rejects(() => slow.get('k'), (e) => e.code === 'store_unavailable' && /timeout/.test(e.message));
});

test('401 / 400 del backend => store_rejected (configuración mal; no es reintentable)', async () => {
  const s401 = makeStore(() => resp(401, { error: 'no_autorizado' })).store;
  await assert.rejects(() => s401.get('k'), (e) => e.code === 'store_rejected' && e.status === 401);
  const s400 = makeStore(() => resp(400, { error: 'curso_invalido' })).store;
  await assert.rejects(() => s400.put('k', {}), (e) => e.code === 'store_rejected' && e.status === 400);
});

test('los errores logueados nunca incluyen el secreto', async (t) => {
  const logged = [];
  t.mock.method(console, 'error', (...a) => logged.push(a.join(' ')));
  const { store } = makeStore(() => resp(401, { error: 'no_autorizado' }));
  await assert.rejects(() => store.get('k'));
  assert.ok(logged.length > 0);
  assert.ok(logged.every((l) => !l.includes(SECRET)));
});

test('el constructor exige baseUrl, secreto y curso', () => {
  const ok = { baseUrl: 'http://x', secret: SECRET, courseId: 'c' };
  assert.doesNotThrow(() => new SpringBootProgressStore(ok));
  for (const k of Object.keys(ok)) assert.throws(() => new SpringBootProgressStore({ ...ok, [k]: '' }));
});
