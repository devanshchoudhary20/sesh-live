# Roadmap: sesh

Written 2026-09-25. Revised 2026-09-25 after PM gate 1 CONCERNS: milestone 0 demand probe added, every milestone now starts only when the previous metric is met, dates shifted, wheel security and E2E hygiene written into M1 and the stack table. Seven milestones. Each is a demo-able increment a stranger can try, with an acceptance line, a metric, a kill criterion with a date, an estimate, and what it proves about the bet. The bet: multiplayer does not require moving the agent to a vendor cloud; the link is the product and the record belongs with the code.

Gating rule (PM gate 1 fix, 2026-09-25): a milestone's build starts the day the previous milestone's metric is met. If the metric is met early, every later date pulls forward by the same amount. If the metric is not met by its date, the kill criterion fires and nothing later is built. The dates below assume the metric lands on its deadline, so they are latest dates.

## Milestone 0: the demand probe (week 1, 2026-09-26 to 2026-10-05)

PM gate 1 fix (2026-09-25): added because direct demand is claude-code#60082 at 15 reactions and codex#46016 at 0. The probe asks the people who wrote and upvoted those issues whether they will click.

Increment: a one-screen landing page (friend sentence, a 20-second recording, an email field, a visible signup counter) and a proof-of-concept share link: a ~20-line Node script that spawns the agent under `node-pty` and streams stdout frames over `ws` to one Worker, plus a static xterm.js page that renders them read-only. No encryption, no wheel, no packaging. Build 2026-09-26 to 2026-09-28. Posts on 2026-09-28: a comment on anthropics/claude-code#60082, a comment on the qm HN thread (49126604), and one Show HN, "Show HN: A live share link for your local Claude Code or Codex session (PoC)", with a live session running during each posting window.

Acceptance: done when a stranger who found the link on HN or the issue thread opens it and sees a Claude Code session running on the host's laptop update live, and can leave an email.

Metric and gate: 25 email signups or 10 distinct viewers who joined the PoC link (distinct viewer tokens in the Worker's aggregate counter), counted on 2026-10-05.

Kill: below both numbers on 2026-10-05, park the idea with the counts in the idea file. Nothing from M1 is built before this gate.

Proves: whether the thin issue counts mean nobody wants it or nobody has seen it work.

## Milestone 1: the link (weeks 2-4, build 2026-10-05 to 2026-10-23, ship 2026-10-23)

Increment: `npx sesh claude` (or `sesh codex`, or `sesh run -- <any command>`) wraps the agent in a PTY, records it, and prints a link. A viewer opens the link in a browser, watches the terminal live, and can be granted the wheel by the host under the rules below.

Acceptance: done when a stranger can run `npx sesh claude` on their laptop, send the printed link to a friend on another network, and that friend watches the session live in a browser and, once granted the wheel, types the next prompt.

Wheel security (PM gate 1 fix, 2026-09-25; full rule list in plan.md `## Wheel rules (M1)`): the host-side filter in the `sesh` wrapper allows printable text, Enter, Backspace, and the four arrow keys only; drops every Ctrl chord, Esc, `!` at line start, and any message over 2 KB; the first grant in a session shows "Grant the wheel to <name>: they can type prompts, not run shell commands" and waits for Ctrl+] y; a grant expires after 10 minutes of viewer inactivity or 60 minutes total; Ctrl+] twice (a chord no agent binds) or a click on the host's local status page revokes. Unit test per rule; PTY integration test that sends `!ls\r` and asserts the `!` never arrived.

Late joiners (PM gate 1 fix, 2026-09-25): the CLI feeds PTY bytes into `@xterm/headless`; on join the host serializes the current screen with `@xterm/addon-serialize` (2,000 lines of scrollback max), encrypts it, and sends it as the viewer's first frame. This replaces the relay ring buffer from attempt 1.

Metric: 40 distinct hosts with at least one session where a second human joined, by 2026-12-04 (six weeks after ship). M2 does not start until this is met.

Kill: fewer than 40 such hosts on 2026-12-04, or fewer than 10 wheel grants total, park the idea with that number in the idea file.

Proves: people will share a local session over a link at all, and whether they want to watch or to steer (wheel grants vs. joins).

## Milestone 2: the structured view, names, and your own relay (weeks 11-14, build from 2026-12-04, ship 2027-01-08)

Dates assume the M1 metric lands on 2026-12-04 and include two holiday weeks.

Increment: beside the terminal, a turn-by-turn pane for Claude Code and Codex built from the transcript (Claude Code via the `transcript_path` that hooks receive; Codex via `~/.codex/sessions`), showing prompts, tool calls, and diffs, readable on a phone. Viewers sign in with GitHub so every prompt and wheel grant carries a name. Viewers without the wheel can post a "suggest" note that lands in the host's terminal with their name. PM gate 1 fix (2026-09-25): `sesh --relay <url>` plus a documented `wrangler deploy` of the open-source Worker, so a team can run the relay in its own Cloudflare account; moved up from M4 because it is the same code plus a flag, and it is the first answer for the persona whose company rejects third-party relays.

Acceptance: done when a teammate on a phone can follow a Claude Code run turn by turn, open a diff, and send a note that appears in the host's terminal under their GitHub name; and when a stranger can deploy the relay to their own Cloudflare account and share through it.

Metric: 30% of viewers use the structured pane for more than half their session time (client-side aggregate), and 50 named participants, by 2027-02-05. M3 does not start until this is met.

Kill: if the structured pane crashes on more than 5% of sessions across two consecutive Claude Code releases because the transcript format moved, drop it to Codex-only and re-evaluate the transcript dependency on 2027-02-05. Fewer than 50 named participants on 2027-02-05 parks M3 and moves the artifact to a local-only feature.

Proves: the local transcript is a stable enough source for a live structured view, names are worth a sign-in, and whether "run it in your own account" unblocks the enterprise persona.

## Milestone 3: the artifact (weeks 15-17, build from 2027-02-05, ship 2027-02-26)

Increment: `sesh` writes each run to `.sesh/runs/<id>/` (cast, transcript copy, participants, wheel log with accepted and dropped viewer input, redaction pass), gitignored by default, `--commit` to keep it. `sesh pr` posts a link on the open PR that opens the replay. Hosted replays on R2 for teams whose reviewers lack repo access.

Acceptance: done when a reviewer with no shell access can open a PR, click the sesh link, and scrub through the agent run that produced the diff, seeing who prompted each turn.

Metric: 100 replays opened from PR links by 2027-04-09; 5 teams with more than 10 committed runs. M4 does not start until this is met.

Kill: fewer than 25 replay opens from PR links by 2027-04-09, remove `sesh pr` from the surface and treat the artifact as a local feature only.

Proves: provenance is worth keeping where the code lives, and whether the artifact or the live link is the thing teams actually keep.

## Milestone 4: yours to host, and the team plan (weeks 18-21, build from 2027-04-09, ship 2027-05-07)

Increment: `sesh relay` runs the same protocol as a single Node process (Docker image, Tailscale-friendly), for the persona whose security team will not use any third-party account, Cloudflare included. Optional P2P mode where the hosted relay only signals and data flows over WebRTC. Team plan at $10-15 per seat: org allowlist for who may join, 90-day hosted retention, SSO, per-host opt-in session directory.

Acceptance: done when a stranger can `docker run` the relay on their own box, share a session through it, and a teammate outside the office joins it; and when a team admin can restrict joins to their GitHub org.

Metric: 3 paying teams by 2027-06-18; 20 self-hosted relays reporting a heartbeat (opt-in). M5 does not start until this is met.

Kill: zero paying teams by 2027-06-18, keep the OSS tool, stop building team features, and park the business.

Proves: someone pays for the local-first version, or nobody does and the answer is a free tool.

## Milestone 5: native steering across agents (weeks 22-26, build from 2027-06-18, ship 2027-07-23)

Increment: for agents that expose a protocol, steer through it instead of the PTY: Codex app-server (`turn/start`, approval requests routed to the wheel holder with the host's veto), ACP for Gemini CLI, Cline, OpenCode, and Claude Code through the `claude-agent-acp` adapter; permission prompts appear in the viewer for the wheel holder. Listing in the ACP registry.

Acceptance: done when a viewer with the wheel can approve or deny a Codex command from the browser and the approval appears in the host's terminal with the viewer's name.

Metric: 25% of shared sessions are non-Claude agents by 2027-08-27. M6 does not start until this is met.

Kill: if under 10% of sessions are non-Claude by 2027-08-27, stop adding agents and accept a Claude-and-Codex product.

Proves: the cross-agent half of the wedge exists, which is the half a single vendor cannot absorb.

## Milestone 6: watch from anywhere, decide (weeks 27-30, build from 2027-08-27, ship 2027-09-24)

Increment: a session list across a team's hosts (opt-in per host), a mobile-first viewer, and notification hooks (Slack, GitHub) when a session asks for a human. Then the decision: raise, keep as a paid tool, or park.

Acceptance: done when a team lead opens one page on a phone, sees every teammate's opted-in live session, and is paged when one asks for approval.

Metric: 10 paying teams and 500 monthly active hosts by 2027-10-29.

Kill: under 5 paying teams on 2027-10-29, freeze features, keep the OSS tool maintained, park the business.

Proves: whether this is a company or a tool.

## Stack per layer

Rule: the cheapest option that will not need a rewrite by milestone 3.

| Layer | Choice | Why, and what it would take to outgrow |
|---|---|---|
| Probe (M0) | Static landing page on Cloudflare Pages, signups to a D1 table behind one Worker route, PoC streamer: `node-pty` + `ws` script, one Worker, static xterm.js page. | Throwaway by design; only the landing page and the Worker skeleton survive into M1. |
| CLI host agent | TypeScript on Node 22, `node-pty` via the prebuilt multiarch package, `ws`, `commander`, asciinema v2 cast writer, WebCrypto AES-GCM for E2E, `@xterm/headless` + `@xterm/addon-serialize` for the join snapshot (PM gate 1 fix, 2026-09-25), the viewer input filter and Ctrl+] prefix handler. Published as `sesh-live` on npm (2026-09-25: `sesh` was taken, renamed before the first publish), plus a brew tap. | `npx` is the distribution channel developers already use for agent tooling. Bun single-binary is a later packaging change, not a rewrite. |
| Realtime transport | WebSocket host-to-relay-to-viewers, PTY frames batched at 50 ms, E2E encrypted with a key in the URL fragment. Join snapshot is a distinct frame type sent host-to-one-viewer. | Simplest thing that traverses NAT. P2P WebRTC (M4) plugs in behind the same frame protocol; the relay becomes signaling. |
| Relay (BE) | Cloudflare Worker + one Durable Object per room, WebSocket hibernation API, no persistent storage at M1 and no ring buffer (the host snapshot replaces it). TypeScript, open source. M2: deployable to your own Cloudflare account with `wrangler deploy`, selected by `sesh --relay`. M4: ~300-line Node `ws` server, Docker image, same protocol. | Free plan includes DOs (since 2025-04); hibernation means idle rooms cost nothing. Rooms are independent, so it scales without a rewrite. |
| Viewer (FE) | Vite + React + xterm.js, static, on Cloudflare Pages, same origin as the Worker. PM gate 1 fix (2026-09-25), E2E key hygiene: no Sentry and no third-party script in the viewer; on load the app reads the key from `location.hash`, holds it in memory only, and calls `history.replaceState(null, "", location.pathname)` before any render or fetch; Pages `_headers` sets `Referrer-Policy: no-referrer` and a CSP whose `connect-src` is the relay origin only. Errors go to an in-page ring buffer with a "copy report" button that redacts nothing because it never contains the key. | No SSR needed. The structured pane (M2) is components in the same app. Sentry can return at M2 only with `beforeSend` stripping URLs and navigation breadcrumbs disabled; not before. |
| Storage | M0: D1 table for signups. M1: none else server-side; casts in `~/.sesh/runs/`. M2: D1 for users, rooms, participants. M3: R2 for hosted replays, repo `.sesh/runs/` for committed artifacts. | D1 and R2 free tiers (5 GB and 10 GB) cover through M4. Both are plain SQL and S3-compatible, so moving to Postgres or S3 is a config change, not a rewrite. |
| Auth | M1: capability links (128-bit room id + viewer token) and a host-side grant for the wheel with the allowlist. M2: GitHub OAuth on the Worker, session cookie, names on every event. M4: org allowlist, SSO via WorkOS or Auth.js. | GitHub is the identity every target user already has, and it gives repo-access checks at M3 for free. |
| Infra and ops | Cloudflare account, GitHub Actions for CLI CI (macOS, Linux, WSL) and npm publish, no error telemetry in the viewer at M1 (see Viewer), no telemetry in the CLI beyond an opt-in heartbeat. | One vendor, one bill, zero servers to patch. |

## Cost plan

| Item | Free until | First paid | When |
|---|---|---|---|
| Domain | never | ~$10/yr | M0, week 1 |
| Cloudflare Workers + DO | 100k requests/day, 313k GB-s/day; each inbound WebSocket message is a request, so ~2-3 hours/day of active output across all rooms | Workers Paid $5/mo, includes 10M requests | M1 launch day (2026-10-23); the first paid line item |
| Cloudflare Pages | always for this traffic | none | |
| D1 | 5 GB, 5M reads/day | $5 plan covers it | M0 signups, M2 users, inside Workers Paid |
| R2 | 10 GB, 1M class A ops/mo | ~$0.015/GB-mo beyond | M3, expected under $5/mo through M4 |
| GitHub OAuth, npm | free | none | |
| SSO (WorkOS) | 1M MAU free tier | none through M6 | M4 |
| Total | | ~$5-10/mo from M1, ~$10-20/mo by M4 | |

Revenue side: free for individuals forever; team plan at $10-15/seat from M4, against Conductor at $60/seat and Devin at $40/seat, because we do not run their compute.

## Sequence check

M0 costs a week and answers the question the issue counts cannot. M1 is useful alone: a link to a live local session with a safe hand-off is something nobody offers today. M2 makes it readable on a phone, puts names on it, and lets a team keep the relay in its own account. M3 turns runs into evidence next to PRs. M4 answers "I will not send my terminal through anyone's account." M5 earns the cross-agent claim. M6 decides. The core loop (share, watch, hand off) lands in M1, and no milestone starts until the previous one's number is in.
