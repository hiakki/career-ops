import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Classifies supplied evidence; does not fetch a URL or verify the source claim.
export function classifyFreshness(posting, now = new Date().toISOString()) {
  const clock = Date.parse(now);
  if (!Number.isFinite(clock)) throw new Error('Invalid run clock');
  const unknown = (reason) => ({ bucket: 'unknown', reason, ageHours: null });
  if (posting?.dateKind !== 'published') return unknown('original publication timestamp unavailable');
  try {
    if (!['https:', 'http:'].includes(new URL(posting.dateSourceUrl).protocol)) {
      return unknown('publication source URL unavailable');
    }
  } catch {
    return unknown('publication source URL unavailable');
  }
  const match = typeof posting.publishedAt === 'string' && posting.publishedAt.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) return unknown('exact timestamp with timezone unavailable');
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > days || hour > 23 || minute > 59 || second > 59) {
    return unknown('invalid publication timestamp');
  }
  const published = Date.parse(posting.publishedAt);
  if (!Number.isFinite(published) || published > clock) return unknown('invalid or future publication timestamp');
  const ageHours = (clock - published) / 3_600_000;
  const bucket = ageHours <= 24 ? 'fresh24' : ageHours <= 72 ? 'backfill72' : 'older';
  return { bucket, reason: 'age from supplied original publication timestamp', ageHours };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [, , input, now = new Date().toISOString()] = process.argv;
    if (!input) throw new Error('Usage: node integrations/job-hunt/freshness.mjs INPUT.json [ISO_RUN_TIME]');
    const jobs = JSON.parse(readFileSync(input, 'utf8'));
    if (!Array.isArray(jobs) || jobs.some((job) => !job || typeof job !== 'object' || Array.isArray(job))) {
      throw new Error('Expected a JSON array of job records');
    }
    const results = jobs.map((job) => ({ ...job, freshness: classifyFreshness(job, now) }));
    console.log(JSON.stringify({ checkedAt: now, jobs: results }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
