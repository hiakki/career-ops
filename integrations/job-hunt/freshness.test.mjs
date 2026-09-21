import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFreshness } from './freshness.mjs';

const now = '2026-09-19T12:00:00Z';
const posting = (publishedAt, extra = {}) => ({
  publishedAt, dateKind: 'published', dateSourceUrl: 'https://employer.example/jobs/1', ...extra,
});

// Catch inclusive-window mistakes and inadvertent use of the machine timezone.
for (const [name, value, expected] of [
  ['just posted', '2026-09-19T12:00:00Z', 'fresh24'],
  ['exactly 24 hours', '2026-09-18T12:00:00Z', 'fresh24'],
  ['over 24 hours', '2026-09-18T11:59:59Z', 'backfill72'],
  ['exactly 72 hours', '2026-09-16T12:00:00Z', 'backfill72'],
  ['over 72 hours', '2026-09-16T11:59:59Z', 'older'],
  ['explicit timezone offset', '2026-09-18T17:30:00+05:30', 'fresh24'],
  ['future timestamp', '2026-09-20T12:00:00Z', 'unknown'],
  ['date without time', '2026-09-19', 'unknown'],
  ['time without timezone', '2026-09-19T08:00:00', 'unknown'],
  ['invalid calendar date', '2026-02-30T12:00:00Z', 'unknown'],
  ['invalid date text', 'yesterday', 'unknown'],
  ['missing timestamp', undefined, 'unknown'],
]) {
  test(name, () => assert.equal(classifyFreshness(posting(value), now).bucket, expected));
}

test('new index/update timestamps cannot promote an old posting', () => {
  assert.equal(classifyFreshness(posting('2026-08-01T10:00:00Z', {
    indexedAt: now, updatedAt: now,
  }), now).bucket, 'older');
  for (const dateKind of ['indexed', 'updated', 'first_seen', undefined]) {
    assert.equal(classifyFreshness(posting(now, { dateKind }), now).bucket, 'unknown');
  }
});

test('a date without a usable evidence URL remains unknown', () => {
  for (const dateSourceUrl of [undefined, '', 'not-a-url', 'file:///tmp/job']) {
    assert.equal(classifyFreshness(posting(now, { dateSourceUrl }), now).bucket, 'unknown');
  }
});

test('does not mutate upstream scores, eligibility or statuses', () => {
  const item = posting(now, { score: 4.2, eligibility: 'blocked', status: 'Evaluated' });
  const before = structuredClone(item);
  classifyFreshness(item, now);
  assert.deepEqual(item, before);
});

test('invalid run clock fails rather than producing misleading dates', () => {
  assert.throws(() => classifyFreshness(posting(now), 'invalid'), /clock/i);
});
