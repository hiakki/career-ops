# Optional Laya queue ranking

Laya can annotate pending jobs before full evaluation, using the existing
`rank-pipeline.mjs` command. It never removes, reorders or marks a job processed.
This is portable repository code: your other server needs Node 18+ and the normal
Career Ops dependencies, not the Mac's global skill or Python installation.

## Configure on another server

Pull this fork's merged changes (or check out the feature branch while reviewing),
then run `npm install --ignore-scripts` if dependencies are not already installed.
In the same shell or service environment that launches Career Ops:

```bash
export LAYA_ENDPOINT='https://YOUR-LAYA-HOST/predict'
# Bash: read the token without displaying it or putting its value in history.
read -r -s -p 'Laya API token: ' LAYA_API_TOKEN
printf '\n'
export LAYA_API_TOKEN
```

Use your deployed HTTPS `/predict` URL. The service must accept Bearer
authentication and Laya's `state`/`questions` request format. For scheduled runs,
supply these variables through your existing private service environment or
secret manager. Never commit the token. The ranking command also loads `.env`
from the resolved data root without overriding existing process variables.
It does not load the Mac's global private Laya config.

Normal `CAREER_OPS_ROOT`, `CAREER_OPS_DATA_DIR` and `.career-ops-data` resolution
applies. The script reads `data/pipeline.md` and `config/profile.yml` under that
data root. Target roles must be personalized and nonempty. Supported shapes are
`target_roles.primary/secondary/adjacent` arrays plus `archetypes`, or an array
of role strings/objects with `title`.

## Test, then use

```bash
# Preview one pending, unranked row. This calls Laya but writes nothing.
node rank-pipeline.mjs --provider laya --limit 1 --dry-run

# Annotate up to 20 rows in place, using the existing pipeline lock.
node rank-pipeline.mjs --provider laya --limit 20

# Optional: make Laya the provider for future ranking invocations in this process.
export CAREER_OPS_RANK_PROVIDER=laya
node rank-pipeline.mjs --limit 20

# Explicitly use the original host CLI provider instead.
node rank-pipeline.mjs --provider cli --cli codex --limit 10
```

In Claude or Codex, ask: “Rank my pending Career Ops jobs with Laya, then show me
the jobs to review.” The shared agent instructions route this to the same command.
When `CAREER_OPS_RANK_PROVIDER=laya` is explicitly set, the agent's scan workflow
also runs this optional pass after discovery. Running `node scan.mjs` directly
still only scans; chain the rank command explicitly in automation if wanted.

Example annotation:

```text
| rank: 4.2/5 — Laya title fit; location unverified; metadata only, verify JD (advisory)
```

The score is a 0–5 title-fit estimate. The reason is a fixed template derived from
typed answers, not generated evidence or an explanation of the candidate's CV.
Location and work eligibility stay with the normal workflow. A live synthetic
test incorrectly classified Remote India as a mismatch for an India-based
candidate, so location comparison was deliberately excluded from this provider.

## Failure behavior and limits

- No full CV, profile, JD, contact details, posting URL or company name is sent.
  The allowlist is target role titles/levels/fit tiers and the posting title.
  Location and compensation preferences are not sent.
- Missing titles (including bare URLs), missing targets and oversized metadata
  remain unranked for host review. The adapter rejects state over 1,400 UTF-8
  bytes instead of truncating it. This is a conservative size guard, not an
  exact model-token count; verify the server's tokenizer/context budget.
- Requests are sequential, one per selected job, with no automatic retries or
  CLI fallback. Default limit: 20; maximum: 200. Already-ranked rows are skipped.
- Default timeout: 15 seconds per request. `LAYA_TIMEOUT_MS` may be set from
  1,000 to 120,000. HTTPS is required; redirects are refused.
- Any failed/skipped selected entry produces exit code 1, including in preview.
  Successful entries may still be annotated. Error messages and the summary
  identify partial completion; all other rows stay available for review.
- Re-runs skip existing rank annotations, including earlier CLI rankings. When
  targeting changes, review/remove the old `rank:` segments before reranking.
- This does not replace full evaluation, priority-company rules, verification,
  application approval or the existing deterministic scanner filters.

The setup's latest generic smoke test measured about 1.5–2.3 seconds per request.
That is not a Career Ops throughput or accuracy benchmark. Compare against the
existing batched CLI ranking on representative jobs before claiming savings.

## Offline checks

```bash
node --test tests/laya-ranker.test.mjs
node rank-pipeline.mjs --self-test
```

The tests use synthetic credentials and mocked transport; they also exercise the
actual CLI against an isolated data root. A live preview is the deployment check.
