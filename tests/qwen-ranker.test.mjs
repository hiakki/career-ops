import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readQwenConfig, parseQwenResponse, rankWithQwen } from '../lib/qwen-ranker.mjs';

const config = { endpoint: 'https://qwen.example.test/rerank', token: 'test-secret', timeoutMs: 1000 };
const profile = { target_roles: { primary: ['Frontend Engineer'], secondary: ['Mobile Engineer'] }, candidate: { email: 'private@example.test' }, location: 'private-location' };
const row = { title: 'Frontend Engineer', raw: '- [ ] https://private.test/job | Private Co | Frontend Engineer' };
const answer = (scores = [0.9]) => ({ model: 'Qwen/Qwen3-Reranker-0.6B', results: scores.map((relevance_score, index) => ({ index, relevance_score })).reverse(), usage: { total_tokens: 168 } });

test('configuration rejects unsafe URLs, missing credentials and unbounded timeouts', () => {
  const env = { QWEN_RERANK_ENDPOINT: config.endpoint, QWEN_RERANK_API_TOKEN: config.token };
  assert.equal(readQwenConfig(env).endpoint, config.endpoint);
  for (const bad of [{}, { ...env, QWEN_RERANK_API_TOKEN: '' }, { ...env, QWEN_RERANK_ENDPOINT: 'http://example.test' }, { ...env, QWEN_RERANK_ENDPOINT: 'https://user:pass@example.test' }, { ...env, QWEN_RERANK_ENDPOINT: 'https://example.test/?token=x' }, { ...env, QWEN_RERANK_TIMEOUT_MS: 'Infinity' }, { ...env, QWEN_RERANK_TIMEOUT_MS: '120001' }]) {
    assert.throws(() => readQwenConfig(bad));
  }
});

test('response validation prevents wrong-job annotations and rejects raw logits as probabilities', () => {
  assert.deepEqual(parseQwenResponse(answer([0.1, 0.9]), 2).map(r => r.score), [0.5, 4.5]);
  for (const payload of [{}, { results: [] }, { results: [{ index: 0, relevance_score: 0.1 }, { index: 0, relevance_score: 0.9 }] }, { results: [{ index: 0, relevance_score: 0.1 }, { index: 2, relevance_score: 0.9 }] }]) {
    assert.throws(() => parseQwenResponse(payload, 2));
  }
  for (const value of [null, '0.9', NaN, Infinity, -2, 7.625]) assert.throws(() => parseQwenResponse(answer([value]), 1));
});

test('batches bound requests, authenticate and send only allowlisted titles/targets', async () => {
  const lengths = [];
  const ranked = await rankWithQwen(Array.from({ length: 21 }, (_, i) => ({ ...row, raw: `row-${i}` })), profile, config, async (url, opts) => {
    assert.equal(url, config.endpoint);
    assert.equal(opts.method, 'POST'); assert.equal(opts.redirect, 'error');
    assert.equal(opts.headers.Authorization, 'Bearer test-secret'); assert.ok(opts.signal);
    assert.doesNotMatch(opts.body, /private|Private Co/);
    const body = JSON.parse(opts.body);
    assert.ok(body.documents.length <= 16, 'Deployed service rejects more than 16 documents');
    assert.match(body.instruction, /primary.*secondary.*adjacent/);
    assert.match(body.query, /primary: Frontend Engineer/);
    assert.match(body.query, /secondary: Mobile Engineer/);
    lengths.push(body.documents.length);
    return new Response(JSON.stringify(answer(body.documents.map(() => 0.9))));
  });
  assert.deepEqual(lengths, [16, 5]);
  assert.equal(ranked.results.length, 21); assert.equal(ranked.attemptedCalls, 2);
  assert.equal(ranked.usageTokens, 336);
});

test('missing or oversized metadata skips only affected rows without sending private context', async () => {
  const ranked = await rankWithQwen([{ ...row, title: '' }, row, { ...row, title: 'x'.repeat(3000) }], profile, config, async () => new Response(JSON.stringify(answer())));
  assert.equal(ranked.attemptedCalls, 1); assert.equal(ranked.results.length, 1);
  assert.deepEqual(ranked.failures.map(f => f.index), [0, 2]);
  const empty = await rankWithQwen([row], {}, config, () => { throw Error('must not call'); });
  assert.equal(empty.attemptedCalls, 0); assert.equal(empty.failures.length, 1);
});

test('failed batches stay unranked, do not leak secrets, and cannot trigger silent CLI fallback', async () => {
  for (const transport of [
    async () => new Response('test-secret', { status: 401 }),
    async () => new Response('not json test-secret'),
    async () => new Response('x'.repeat(65537)),
    async () => new Response(JSON.stringify(answer([0.9]))), // incomplete batch
    async () => { throw Error('test-secret'); },
  ]) {
    const ranked = await rankWithQwen([row, row], profile, config, transport);
    assert.equal(ranked.results.length, 0); assert.equal(ranked.failures.length, 2);
    assert.equal(ranked.attemptedCalls, 1); assert.equal(ranked.usageTokens, null);
    assert.doesNotMatch(JSON.stringify(ranked), /test-secret/);
  }
});

test('deadline aborts stalled service requests', async () => {
  const keepAlive = setTimeout(() => {}, 500);
  try {
    const ranked = await rankWithQwen([row], profile, { ...config, timeoutMs: 20 }, async (_url, { signal }) => {
      await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    });
    assert.equal(ranked.results.length, 0);
    assert.match(ranked.failures[0].error, /timed out/);
  } finally { clearTimeout(keepAlive); }
});

// Catches provider selection, response-index mapping, unintended CLI fallback,
// lost rows, preview writes, and duplicate requests on a repeated invocation.
test('ranking CLI uses configured Qwen in batches, maps indexes, and preserves the queue', () => {
  const root = mkdtempSync(join(tmpdir(), 'career-qwen-test-'));
  try {
    mkdirSync(join(root, 'data')); mkdirSync(join(root, 'config'));
    writeFileSync(join(root, 'config/profile.yml'), 'target_roles:\n  primary: [Frontend Engineer]\n');
    writeFileSync(join(root, '.env'), 'CAREER_OPS_RANK_PROVIDER=qwen\nQWEN_RERANK_ENDPOINT=https://qwen.example.test/rerank\nQWEN_RERANK_API_TOKEN=test-secret\n');
    const cwd = join(root, 'working-dir'); mkdirSync(cwd);
    writeFileSync(join(cwd, '.env'), 'QWEN_RERANK_ENDPOINT=https://wrong.example.test/rerank\nQWEN_RERANK_API_TOKEN=wrong-secret\n');
    const pipeline = join(root, 'data/pipeline.md');
    const original = '## Pending\n- [ ] https://jobs.test/a | Acme | Nurse\n- [ ] https://jobs.test/b | Beta | Frontend Engineer\n## Processed\n- [x] https://jobs.test/done\n';
    writeFileSync(pipeline, original);
    const preload = join(root, 'transport.cjs');
    writeFileSync(preload, `global.fetch = async (url, opts) => {
      const b = JSON.parse(opts.body);
      if (url !== 'https://qwen.example.test/rerank' || opts.headers.Authorization !== 'Bearer test-secret'
          || b.documents.length !== 2 || b.documents[0] !== 'Nurse' || b.documents[1] !== 'Frontend Engineer') throw Error('bad request');
      return new Response(JSON.stringify({model:'Qwen/Qwen3-Reranker-0.6B', results:[{index:1,relevance_score:0.9},{index:0,relevance_score:0.1}],usage:{total_tokens:168}}));
    };`);
    const script = fileURLToPath(new URL('../rank-pipeline.mjs', import.meta.url));
    const env = { ...process.env, CAREER_OPS_ROOT: root, CAREER_OPS_DATA_DIR: root, CAREER_OPS_RANK_CLI: 'must-not-run' };
    for (const key of ['CAREER_OPS_RANK_PROVIDER', 'QWEN_RERANK_ENDPOINT', 'QWEN_RERANK_API_TOKEN', 'QWEN_RERANK_TIMEOUT_MS']) delete env[key];
    const run = (args = [], extra = {}) => spawnSync(process.execPath, ['--require', preload, script, ...args], { cwd, encoding: 'utf8', timeout: 15000, env: { ...env, ...extra } });
    const preview = run(['--provider=qwen', '--dry-run']);
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(preview.stdout, /Nurse \| rank: 0.5\/5.*Qwen/);
    assert.match(preview.stdout, /Frontend Engineer \| rank: 4.5\/5.*Qwen/);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
    const write = run(); // .env selects Qwen without command-line flags
    assert.equal(write.status, 0, write.stderr);
    assert.match(write.stdout, /in 1 call\(s\) via qwen/);
    assert.match(write.stdout, /CLI calls: 0/);
    assert.match(write.stdout, /168/);
    const updated = readFileSync(pipeline, 'utf8');
    assert.match(updated, /Nurse \| rank: 0.5\/5.*relevance=0.1/);
    assert.match(updated, /Frontend Engineer \| rank: 4.5\/5.*relevance=0.9/);
    assert.equal(updated.split('\n').length, original.split('\n').length);
    assert.ok(updated.includes('- [x] https://jobs.test/done\n'));
    writeFileSync(preload, 'global.fetch = async () => { throw Error("must not call again"); };');
    assert.equal(run().status, 0);
    assert.equal(readFileSync(pipeline, 'utf8'), updated);
    writeFileSync(pipeline, original);
    const forcedCli = run(['--provider=cli']);
    assert.doesNotMatch(forcedCli.stdout, /via qwen/);
    assert.match(forcedCli.stderr, /CLI call failed/);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
    const noToken = run([], { QWEN_RERANK_API_TOKEN: '' });
    assert.equal(noToken.status, 1);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
    writeFileSync(preload, 'global.fetch = async () => new Response("test-secret", {status:401});');
    const failed = run();
    assert.equal(failed.status, 1);
    assert.match(failed.stdout + failed.stderr, /401/);
    assert.doesNotMatch(failed.stdout + failed.stderr, /test-secret/);
    assert.equal(readFileSync(pipeline, 'utf8'), original);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
