# Job Hunt OS + career-ops

Integrated on 2026-09-19 for Claude Code and Codex; moved to the Git-visible
`integrations/job-hunt/` directory on 2026-09-21.
The shared `AGENTS.md` entry point directs Claude Code and Codex to
[WORKFLOW.md](WORKFLOW.md). No additional agent host, database, account, or
globally installed skill is required.

## Use it

Open this career-ops checkout in Claude Code or Codex and ask:

> Run career-ops scan using the job-hunt workflow. Use my existing profile and
> constraints, separate verified 24-hour jobs from 72-hour backfill and unknown
> dates, and give me the best next actions with supported resume edits and
> outreach drafts.

For an individual phase, say:

- “Use rocketship-radar to find fresh roles within my current targets.”
- “Use resume-tuner for this JD; show up to three supported changes.”
- “Use warm-path-outreach for these shortlisted roles.”

These are natural-language aliases loaded through career-ops, not newly
registered slash commands. The extension is available in this repository;
it has not been installed into other projects or global skill directories.

For another server, commit and push `AGENTS.md` and `integrations/job-hunt/`,
then pull that commit in its career-ops checkout. Open a new Claude Code or Codex
session there and use the same prompts. `CLAUDE.md` and `CODEX.md` already point
to `AGENTS.md`, so no private activation hook needs to be copied.

The server still needs its normal working career-ops environment, Node.js, and
candidate onboarding/profile. Personal CVs, credentials, tracker data, local
custom rules and MCP configuration do not travel through Git. The extension
adds instructions and a date-classification helper; it does not install all
26 researched projects or register separate third-party agents.

## What was integrated

| Source workflow | Behavior inside career-ops |
| --- | --- |
| Job Hunt OS | Native discovery, fit review, resume edits, contact drafts and next-action handoff |
| Rocketship Radar | Explicit publication evidence and fresh/backfill/older/unknown groups |
| Resume Tuner | Up to three edits tied to the real JD and candidate facts |
| Warm Path Outreach | Existing connections first, verified contact context, concise draft |

An additional claim-by-claim review pass and role-specific interview references
were added from the research. These are written into the workflow; separate
third-party agents have not been installed. Existing candidate facts, queue
limits, canonical resume, tracker, status log and Sheet rules still govern.

## Freshness helper

Input is a JSON array of records. To classify a date, supply:

```json
[
  {
    "id": "example-requisition",
    "publishedAt": "2026-09-19T06:00:00Z",
    "dateKind": "published",
    "dateSourceUrl": "https://example.com/careers/example-requisition"
  }
]
```

From this repository:

```bash
node integrations/job-hunt/freshness.mjs integrations/job-hunt/demo.json 2026-09-19T12:00:00Z
node --test --test-reporter=spec integrations/job-hunt/freshness.test.mjs
```

For real input, replace the demo path and omit the fixed clock. Results go to
stdout. There are no network requests or tracker writes. Additional fields are
preserved. The publication timestamp must include seconds and a timezone;
date-only, ambiguous, future and invalid timestamps remain unknown.

The helper cannot verify whether a website's timestamp is truthful. The agent
must inspect source evidence and separately verify liveness, eligibility and fit.
A fresh role can still be blocked or unsuitable. An indexing/update timestamp
does not refresh an old posting.

## Files, persistence and maintenance

- `AGENTS.md`: shared entry point, loaded by Claude Code and Codex in a fresh clone.
- `modes/_custom.md`: optional private overrides; existing rules preserved.
- `WORKFLOW.md`: the adapted operating instructions.
- `freshness.mjs`, `freshness.test.mjs`, `demo.json`: helper and synthetic verification.
- [RESEARCH.md](RESEARCH.md): screened tools, decisions and next priorities.
- `local/job-hunt/research-sources/inventory.json`: private repository revisions, metadata and saved READMEs.
- `local/job-hunt/research-sources/reviewed-files.json`: private targeted instruction-file provenance.
- `local/job-hunt/job-hunt-os-source.json`, `local/job-hunt/job-hunt-os-original.zip`: private bundle provenance and archive.
- `local/job-hunt/custom-before.md`: private backup of the pre-integration custom instructions.

The six files under `integrations/job-hunt/` are reusable project content and
can be committed normally. `local/` and `modes/_custom.md` remain Git-ignored,
alongside machine-specific Claude/Codex setup. Upstream files already tracked by
Git remain tracked. Do not force-add personal files or downloaded source archives.
Keep a private backup of customization if moving machines.

Career-ops documents `_custom.md` as protected during system updates. The shared
entry in `AGENTS.md` is a fork change: an upstream system-file replacement can
overwrite it. Preserve it when updating this fork and verify it after upgrades.
The installed system was 1.32.0; its update
check reported 1.33.0 available, but no system upgrade was performed here.

Run-specific records belong under the resolved candidate data root at
`data/job-hunt/runs/`. Honor native environment/marker/tracker overrides;
do not assume the checkout is always the data root.

To disable shared discovery, remove the Shared Job Hunt OS integration section
from `AGENTS.md`; also remove the marked `job-hunt-integration` block from
`_custom.md` if present. Do not blindly restore the private backup after later edits.
No service restart is needed: the helper runs on invocation and the agent reads
the workflow on its next matching request.

## Verification and limits

The helper passed 16 focused tests and a five-record CLI demonstration, including
an old job with a recent index date and a fresh but eligibility-blocked job.
The shared entry point is present in `AGENTS.md`; both CLI instruction files
reference it. A clean-directory smoke check without private customization tests
the portable helper and instruction paths, not the behavior of a live AI session.
This is instruction integration, not an end-to-end live hiring run: no real
jobs were searched for this candidate, no applications/messages were sent, and
no paid enrichment or optional MCP connector was enabled. The full upstream
application test suite was not run because no upstream runtime code changed.

The original downloadable bundle did not expose an explicit redistribution
license in the inspected root files. It is retained privately for provenance;
the workflow here is an attributed adaptation written for this local setup.
