import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readLayaConfig, buildLayaRequest, parseLayaResponse, rankWithLaya } from '../lib/laya-ranker.mjs';
import { parsePendingEntries } from '../rank-pipeline.mjs';

const env = { LAYA_ENDPOINT: 'https://laya.example.test/predict', LAYA_API_TOKEN: 'test-secret' };
const config = { endpoint: env.LAYA_ENDPOINT, token: env.LAYA_API_TOKEN, timeoutMs: 1000 };
const profile = { target_roles: { primary: ['Frontend Engineer'], archetypes: [{ name: 'UI Engineer', level: 'Senior', fit: 'secondary' }] }, location: { country: 'India', city: 'Pune', visa_status: 'private' }, candidate: { email: 'private@example.test' }, narrative: { secret: 'private' } };
const entry = { raw: '- [ ] https://jobs.test/1 | Acme | Frontend Engineer | Remote', title: 'Frontend Engineer', location: 'Remote' };
const answer = { answers: { role_fit: { type: 'score', score: 4.2, confidence: 0.8 }, location_fit: { type: 'choice', choice: 'unclear' } } };

test('Laya requires explicit HTTPS configuration and bounded timeout', () => {
  assert.deepEqual(readLayaConfig(env), { ...config, timeoutMs: 15000 });
  for (const values of [{}, { ...env, LAYA_API_TOKEN: '' }, { ...env, LAYA_ENDPOINT: 'http://example.test' }, { ...env, LAYA_ENDPOINT: 'https://user:pass@example.test' }, { ...env, LAYA_TIMEOUT_MS: 'NaN' }, { ...env, LAYA_TIMEOUT_MS: '120001' }]) {
    assert.throws(() => readLayaConfig(values));
  }
});

test('request contains only title and role targeting, not CV, location or contact details', () => {
  const request = buildLayaRequest(entry, profile);
  const text = JSON.stringify(request);
  assert.match(text, /Frontend Engineer/);
  assert.match(text, /UI Engineer/);
  assert.doesNotMatch(text, /private|jobs\.test|Acme|visa_status|email|Pune|India/);
  assert.equal(request.questions.role_fit.type, 'score');
  assert.equal(request.questions.role_fit.criteria.length, 6);
  assert.equal(request.questions.location_fit, undefined);
});

test('missing title, missing targets and oversized context require host review instead of truncation', () => {
  for (const [row, prefs] of [[{ ...entry, title: '' }, profile], [entry, {}], [{ ...entry, title: 'x'.repeat(3000) }, profile]]) {
    assert.throws(() => buildLayaRequest(row, prefs));
  }
  assert.match(JSON.stringify(buildLayaRequest(entry, { target_roles: [{ title: 'Frontend Engineer', fit: 'primary' }] })), /Frontend Engineer/);
});

test('labeled pipeline metadata cannot masquerade as a job title', () => {
  const rows = parsePendingEntries('- [ ] https://jobs.test/a | note: imported | posted: 2026-09-23\n- [ ] https://jobs.test/b | Acme | Frontend Engineer | Remote | note: imported');
  assert.equal(rows[0].title, '');
  assert.equal(rows[1].title, 'Frontend Engineer');
  assert.throws(() => buildLayaRequest(rows[0], profile));
});

test('typed scores produce an explicitly advisory reason, never a generated claim', () => {
  const result = parseLayaResponse(answer);
  assert.equal(result.score, 4.2);
  assert.match(result.reason, /Laya.*location unverified.*metadata only/i);
  for (const score of [null, '4', -1, 6]) {
    assert.throws(() => parseLayaResponse({ answers: { ...answer.answers, role_fit: { type: 'score', score } } }));
  }
  assert.throws(() => parseLayaResponse({}));
  assert.doesNotMatch(parseLayaResponse({ answers: { ...answer.answers, location_fit: { type: 'choice', choice: 'mismatch' } } }).reason, /mismatch/);
});

test('POST authenticates, refuses redirects, and does not forward whole rows', async () => {
  let seen;
  const fetchImpl = async (url, options) => { seen = { url, ...options }; return new Response(JSON.stringify(answer)); };
  const result = await rankWithLaya([entry], profile, config, fetchImpl);
  assert.equal(result.attemptedCalls, 1);
  assert.equal(result.results[0].score, 4.2);
  assert.equal(seen.method, 'POST');
  assert.equal(seen.redirect, 'error');
  assert.equal(seen.headers.Authorization, 'Bearer test-secret');
  assert.ok(seen.signal);
  assert.doesNotMatch(seen.body, /jobs\.test|private/);
});

test('HTTP failures stay visible, do not echo credentials, and leave failed jobs unranked', async () => {
  let calls = 0;
  const result = await rankWithLaya([entry, { ...entry, raw: entry.raw + '2' }], profile, config, async () => {
    calls++;
    return calls === 1 ? new Response('test-secret', { status: 503 }) : new Response(JSON.stringify(answer));
  });
  assert.equal(result.attemptedCalls, 2);
  assert.equal(result.results.length, 1);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0].error, /503/);
  assert.doesNotMatch(JSON.stringify(result), /test-secret/);
});

test('invalid input makes no request; bad JSON and transport exceptions fail safely', async () => {
  let calls = 0;
  const noTitle = await rankWithLaya([{ ...entry, title: '' }], profile, config, async () => { calls++; });
  assert.equal(calls, 0);
  assert.equal(noTitle.failures.length, 1);
  for (const fetchImpl of [async () => new Response('<html>error</html>'), async () => { throw new Error('test-secret'); }]) {
    const result = await rankWithLaya([entry], profile, config, fetchImpl);
    assert.equal(result.failures.length, 1);
    assert.equal(result.results.length, 0);
    assert.doesNotMatch(JSON.stringify(result), /test-secret/);
  }
});

test('request deadline aborts a stalled transport and preserves the entry for review', async () => {
  const keepAlive = setTimeout(() => {}, 500);
  try {
    const result = await rankWithLaya([entry], profile, { ...config, timeoutMs: 20 }, async (_url, { signal }) => {
      await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    });
    assert.equal(result.attemptedCalls, 1);
    assert.equal(result.results.length, 0);
    assert.match(result.failures[0].error, /timed out/);
  } finally { clearTimeout(keepAlive); }
});

test('real ranking CLI uses data root, writes advisory annotations, and reruns without duplicate calls', () => {
  const root = mkdtempSync(join(tmpdir(), 'career-laya-test-'));
  try {
    mkdirSync(join(root, 'data')); mkdirSync(join(root, 'config'));
    writeFileSync(join(root, 'config/profile.yml'), 'target_roles:\n  primary: [Frontend Engineer]\nlocation:\n  country: India\n');
    const pipeline = join(root, 'data/pipeline.md');
    const original = '## Pending\n' + entry.raw + '\n- [ ] https://jobs.test/bare\n## Processed\n- [x] https://jobs.test/done\n';
    writeFileSync(pipeline, original);
    const preload = join(root, 'transport.cjs');
    writeFileSync(preload, 'global.fetch = async () => new Response(JSON.stringify(' + JSON.stringify(answer) + '));');
    const script = fileURLToPath(new URL('../rank-pipeline.mjs', import.meta.url));
    const run = (args = [], extra = {}) => spawnSync(process.execPath, ['--require', preload, script, '--provider=laya', ...args], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...env, CAREER_OPS_ROOT: root, CAREER_OPS_DATA_DIR: root, CAREER_OPS_RANK_CLI: 'must-not-run', ...extra } });
    const preview = run(['--dry-run', '--limit=1']);
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(preview.stdout, /rank: 4.2\/5.*Laya/);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
    const typo = run(['--dryrun']);
    assert.equal(typo.status, 1);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
    const write = run(['--limit=1']);
    assert.equal(write.status, 0, write.stderr);
    const updated = readFileSync(pipeline, 'utf8');
    assert.match(updated, /rank: 4.2\/5.*Laya/);
    assert.equal(updated.split('\n').length, original.split('\n').length);
    assert.ok(updated.includes('- [ ] https://jobs.test/bare\n'));
    const again = run();
    assert.equal(again.status, 1); // bare URL needs normal host evaluation
    assert.equal(readFileSync(pipeline, 'utf8'), updated);
    writeFileSync(pipeline, original);
    const missing = run([], { LAYA_API_TOKEN: '' });
    assert.equal(missing.status, 1);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
    writeFileSync(preload, 'global.fetch = async () => new Response("test-secret", {status: 401});');
    const failed = run(['--limit=1']);
    assert.equal(failed.status, 1);
    assert.match(failed.stdout + failed.stderr, /401/);
    assert.doesNotMatch(failed.stdout + failed.stderr, /test-secret/);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
