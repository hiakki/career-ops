# Research: extending career-ops for better hiring outcomes

Checked 2026-09-19. Recommendation: keep career-ops as the operating system,
incorporate the useful Job Hunt OS procedures, and add external tools only where
they address a measured gap. More skill files do not establish better hiring odds.

## Scope and evidence

This was a broad web/GitHub/skills-directory search across job discovery,
application agents, resume tools, referrals, interview preparation and MCP
connectors. It screened **26 repositories** using repository metadata and pinned
README sources, plus the actual four Job Hunt OS skill files. Five shortlisted
instruction files received additional source review, including Open Career
Skills' reviewer and evidence miner, a networking skill, and two resume/job-search
skills. This was not an exhaustive search of the entire internet or a security
audit of every repository. README capabilities are author claims until exercised.

The private research archive remains under `local/job-hunt/research-sources/`:
`inventory.json` records full revisions, source URLs, license metadata, activity
dates and saved READMEs; `reviewed-files.json` records the deeper instruction
checks. Those snapshots are not included in a Git clone; the public source links
are retained below. Stars/install counts were discovery signals, not quality or
placement evidence. No listed tool's effect on this candidate's outcomes has been
measured. License metadata being null or NOASSERTION is inconclusive; inspect
actual license files before copying code or redistributing content.

The local career-ops baseline was 1.32.0, commit
`c49a2dcba8b8d038970bd534cb09fb04871cff6d`. Its existing instructions already cover
scanning, evaluation, resume generation, contacts, interview preparation, tracking
and outcome review. A second complete job-search workspace would duplicate state.
The native LinkedIn join also already matches an explicitly supplied connections
export against target employers without network calls. See
[the native guide](../../docs/LINKEDIN_JOIN.md).

## Incorporated now

| Addition | Practical benefit | Integration |
| --- | --- | --- |
| Job Hunt OS's four workflows | A concise path from discovery to supported resume edits and a contact draft | Adapted through `_custom.md` and `WORKFLOW.md`; original US defaults, alternate scoring and spreadsheet omitted |
| Strict publication evidence | Prevents recently indexed old postings being represented as new | Tested local freshness helper; source credibility remains a separate agent check |
| Application evidence review | Catches invented metrics, inflated ownership and unsupported personalization before handoff | Distinct claim-by-claim review pass; an inline pass is explicitly a self-review |
| Existing connections first | Finds a possible introduction before drafting cold outreach | Uses career-ops' existing export/join/contact workflow |
| Role-specific interview references | Directs practice toward actual JD requirements | References to the three handbooks below in native interview preparation |

Job Hunt OS provenance: [author's article](https://abhijayvuyyuru.substack.com/p/i-replaced-my-entire-job-search-with)
and its downloadable bundle. The four actual sources were reviewed, rather than
relying on the article's outcome claims. Paid contact enrichment is optional,
email enrichment remains opt-in, and supplied actor identifiers/prices must be
checked against the current provider before use.

The review pattern is informed by
[Open Career Skills' application reviewer](https://github.com/squerne/open-career-skills/blob/main/.claude/agents/application-reviewer.md).
Its evidence-mining idea is also promising, but requires an explicitly selected,
authorized set of work artifacts and candidate confirmation. Do not mine unrelated
repositories or chat histories for resume achievements. Do not infer business
impact from lines of code, commit counts or a job description.

## Best optional next additions

| Priority | Candidate | What it could add | Decision gate |
| --- | --- | --- | --- |
| 1 | [Openings MCP](https://github.com/amikai/openings-mcp) | Additional employer ATS and regional discovery through a local Go MCP server; documented Claude/Codex support | Compare on 10 relevant employers against native scanning; advertised coverage is unverified |
| Alternative to 1 | [JobSpy](https://github.com/speedyapply/JobSpy) | Board discovery through Python, including time filters and structured results | Use if broad-board coverage is the actual gap; validate original employer URLs and dates |
| 2 | [Open Career Skills](https://github.com/squerne/open-career-skills) | Evidence-backed story development from selected work artifacts | Only with authorized sources; its reviewer procedure is already adapted locally |
| 3 | [OpenResume](https://github.com/xitanggg/open-resume) | An independent resume parsing/readability check | Try only if native PDF extraction shows problems; no need for another resume editor by default |

Do not install both discovery connectors just to increase the tool count. First
capture a baseline using the same geography, seniority, work authorization and
target employers. Compare unique **eligible, live** roles missed by native scan,
duplicate rate, date accuracy, blocked requests, time and cost. Keep a connector
only if it supplies useful incremental results. A server starting successfully is
not evidence that its job sources work or match the candidate's market.

## Complete repository screening

“Reference” means consult relevant material; “pilot” means a candidate for a
bounded trial; “defer” means no present integration. None of these 26 full
repositories was installed by this task.

| Repository | What it offers | Fit and decision |
| --- | --- | --- |
| [speedyapply/JobSpy](https://github.com/speedyapply/JobSpy) | Python scraper for several major boards with structured fields and time/location filters | **Pilot if board coverage is missing.** Python 3.10+ and source access required; filters do not prove original posting freshness. Older Bunsly links redirect here. |
| [amikai/openings-mcp](https://github.com/amikai/openings-mcp) | Local Go MCP server for ATS/employer and regional job sources | **First ATS coverage pilot.** Broad company/source counts are README claims, not verified coverage for this candidate. |
| [squerne/open-career-skills](https://github.com/squerne/open-career-skills) | Career skills plus application review and evidence-mining agents | **Adapted review procedure.** Strong fit for provenance; defer artifact mining until scoped. Marketing claims about LinkedIn algorithms were not adopted. |
| [yangshun/front-end-interview-handbook](https://github.com/yangshun/front-end-interview-handbook) | Frontend technical interview preparation | **Reference integrated.** Select coding, browser, framework and design topics by the actual role; no new service. |
| [yangshun/tech-interview-handbook](https://github.com/yangshun/tech-interview-handbook) | Coding and behavioral preparation guides | **Reference integrated.** Useful for specific gaps and mock-interview exercises; avoid a generic endless study plan. |
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | System-design concepts, examples and practice | **Reference integrated.** Particularly useful when seniority/JD requires architecture; not a prediction of employer questions. |
| [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) | Full AI job-search workspace, drafting/review flow and LaTeX documents | **Reference, not a second workspace.** Reviewer ideas are useful; separate templates/tracker and LaTeX setup add overlap. Some discovery is Denmark-oriented. |
| [sameergdogg/job-search-skills](https://github.com/sameergdogg/job-search-skills) | Analyze/crawl/form-fill/network-finding skills | **Borrow networking idea through existing tools.** Its workflow uses browser/Google ecosystem inputs; avoid a second referral spreadsheet. |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | Includes a technical-job-search skill covering role analysis, resumes and follow-up | **Reference only.** Actual skill reviewed; mostly overlaps career-ops. No Copilot installation needed or added. |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Broad skill collection including a tailored-resume generator | **Defer.** Reviewed resume skill largely duplicates native tailoring. Do not install unrelated app integrations with it. |
| [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills) | Resume, ATS and LinkedIn-oriented skill pack | **Do not import wholesale.** README encourages estimating unknown numbers in its quantifier; that conflicts with career-ops evidence requirements. Inspect individual skills before reuse. |
| [proyecto26/TheJobInterviewGuide](https://github.com/proyecto26/TheJobInterviewGuide) | Job-search phases, prompts, interview guidance and skills | **Reference.** Useful checklists, substantial overlap with native interview and application modes. |
| [jwasham/coding-interview-university](https://github.com/jwasham/coding-interview-university) | Extensive computer-science/coding interview curriculum | **Selective reference.** Appropriate for identified fundamentals gaps; too broad as a default prerequisite for applications. |
| [srbhr/Resume-Matcher](https://github.com/srbhr/Resume-Matcher) | AI-assisted JD matching and resume/document editing | **Defer.** Separate Python/backend/frontend stack duplicates native tailoring. Matching scores are not a universal ATS result or probability of hiring. |
| [xitanggg/open-resume](https://github.com/xitanggg/open-resume) | Browser-local resume builder and parser | **Optional parsing check.** Could help identify extraction issues; snapshot last push was October 2024, so validate current operation before depending on it. |
| [reactive-resume/reactive-resume](https://github.com/reactive-resume/reactive-resume) | Full resume editor and sharing/export application | **Defer.** Useful as an alternative editor, but adds another document source and application infrastructure. Former AmruthPillai URL redirects here. |
| [muggl3mind/career-manager](https://github.com/muggl3mind/career-manager) | Career workspace spanning research, resumes and application management | **Defer.** Competing workspace and tracker; no demonstrated gap it fills beyond current native modes. |
| [proficientlyjobs/proficiently-claude-skills](https://github.com/proficientlyjobs/proficiently-claude-skills) | Browser-driven job-search skills and application history | **Defer.** Requires Claude in Chrome and maintains its own local profile/history; weaker fit for a shared Claude/Codex career-ops flow. |
| [ua-job-search/job-search-skill](https://github.com/ua-job-search/job-search-skill) | Ukrainian job-board workflow | **Market-specific reference only.** Relevant if targeting those boards; its automatic application/permission-bypass setup is not adopted. |
| [TadMSTR/jobsearch-mcp](https://github.com/TadMSTR/jobsearch-mcp) | Multi-user job search/scoring with LibreChat, FastMCP and PostgreSQL | **Defer.** API dependencies and another database/deployment exceed the demonstrated discovery need. |
| [coryking/jobsearch-buddy](https://github.com/coryking/jobsearch-buddy) | Job-search MCP with ATS access and registry/logging | **Defer.** README says public snapshot, with development moved private; inventory also reports archived. Poor choice for a new maintained core dependency. |
| [workopia/workopia-mcp](https://github.com/workopia/workopia-mcp) | Hosted search, resume, cover-letter and tracker tools | **Defer.** OAuth/account dependency and external data workflow; only worthwhile if a coverage trial establishes a benefit. |
| [anatolykoptev/go-job](https://github.com/anatolykoptev/go-job) | Broad Go MCP toolset for search, resumes, preparation and tracking | **Defer pending narrower review.** Many features overlap; README screening did not establish runtime requirements or quality of every tool. |
| [AgentWong/ai-job-search](https://github.com/AgentWong/ai-job-search) | Deterministic pipeline stages plus LLM review and multiple job feeds | **Adapter ideas only.** Useful separation of collection and judgment, but full pipeline/persona would duplicate current state. Some enrichment uses Firecrawl. |
| [feder-cr/AIHawk](https://github.com/feder-cr/AIHawk) | Current repository presents browser automation/MCP infrastructure | **Do not add based on old job-bot publicity.** The former Jobs Applier URL redirects here; current purpose differs, and browser automation already exists locally. |
| [Play-New/apply-new](https://github.com/Play-New/apply-new) | Employer-specific application workflow using coding-agent history | **Not a general job-search engine.** Broad chat-history mining is outside this candidate's approved factual sources and this integration. |

## What should improve hiring outcomes

The integration makes the workflow more disciplined; it cannot promise offers.
Track the funnel and fix the point where actual losses occur:

| Observed problem | First action | Useful material/tool |
| --- | --- | --- |
| Too few eligible live roles | Audit source and geographic coverage, then trial one additional connector | Native scan, Openings MCP or JobSpy |
| Many discoveries but weak matches | Check hard constraints and the actual JD before producing documents | Native evaluation + explicit blockers |
| Targeted applications receive few screens | Review relevance, readability, supported achievements and contact route | Resume Tuner + evidence review + existing connection export |
| Screens do not progress | Practice the actual weak areas and review interview debriefs | Native interview modes + selected handbooks |
| Ready applications wait unsent | Clear the existing candidate-action queue | Existing queue and submission handoff; more drafting is not the remedy |

Record counts and denominators by source, channel and role family: eligible live
leads, targeted submissions, replies, screens, interviews and offers. Include
time since submission so pending applications are not counted as definitive
failures. Compare time/cost as well as outcomes. Small observational samples do
not prove an uplift caused by a skill or connector.

## Installation boundaries and verification

The reusable workflow, helper/tests, demo and documentation live in the
Git-visible `integrations/job-hunt/` directory as of 2026-09-21. A shared entry
in `AGENTS.md` loads the workflow on another checkout without a private hook.
Personal customization and the raw research archive remain private and ignored.
No optional MCP server,
paid scraper, account, external tracker or new global skill was installed.
Claude Code and Codex continue to use the same career-ops customization path.

The 16 helper tests and synthetic CLI flow check freshness handling and preserve
fit/status/eligibility fields. They do not test live job-board collection,
contact accuracy, resume generation, interview effectiveness or hiring outcomes.
Those require actual candidate work and source-specific validation. Original
third-party instruction files are retained as research evidence, not executed
as setup instructions. The original Job Hunt OS bundle stays private because
an explicit redistribution license was not found in the inspected root files.
