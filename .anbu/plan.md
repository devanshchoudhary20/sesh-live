# Plan: sesh, a share link for a local coding-agent session

track: big · rubric_b: 7 · ambiguous: false · written 2026-09-25 by strategist (attempt 1) · revised 2026-09-25 after PM gate 1 CONCERNS (attempt 2)

PM gate 1 fix log (2026-09-25), each item marked inline where it lands:
1. Demand honesty: `## Demand` rewritten; milestone 0 probe added to the roadmap; M2 and M3 now gate on the prior metric.
2. Wheel grant: `## Wheel rules (M1)` added; the Esc revoke is gone; Ctrl+] is the host prefix.
3. E2E key leakage: Sentry removed from the viewer; fragment stripped on load; `Referrer-Policy: no-referrer`. See `## Stack` and the risks table.
4. Idea file `## Demand` replaced with this idea's own evidence.
5. codex#10450 corrected in `## Demand` and red team 2.
6. M1 target user renamed; enterprise persona moved to M4; own-account Worker deploy moved to M2.
7. Late joiners get a host-side headless terminal snapshot in M1 (chunk 2).
8. Codex Remote Control date corrected to 2026-05-14 in `## Racing` and `## Why now`.

## Target user

PM gate 1 fix (2026-09-25): the attempt-1 persona worked at a company that had rejected cloud agent workspaces, which means she could not route her terminal through our hosted relay either, and M1 has no self-host path. Decision: rename the M1 target to someone who can install a third-party relay, and keep the enterprise persona for M4 with the Docker relay. Why this instead of self-host in M1: the M1 metric is counted by the hosted relay, so self-hosted rooms would need opt-in heartbeats before the number means anything, and M1 exists to learn whether anyone shares a session at all, not whether enterprises can. The cheap self-host path (deploy the open-source Worker to your own Cloudflare account and pass `sesh --relay`) moves to M2 because it is the same code plus a flag; the Node/Docker relay stays at M4.

M1 target: the technical cofounder or tech lead at a 2 to 8 person startup, or a solo developer on a Claude Code Max or Codex Pro plan, who works in a private repo with no security team gating tool choice and pairs with a cofounder, a contractor, or a friend in another city. She gets the DM "what is Claude doing on your branch, it has been going 40 minutes" and answers it today with a Zoom screen share. Secondary: the mentor onboarding a new hire to agent workflows; the educator or streamer showing a run live (view-only, counted as a join, never a grant).

M4 persona: the senior engineer on a 50 to 500 person team whose security team wants the relay on their own box before any terminal bytes leave the office.

## Job to be done

When a teammate's local agent run goes long or sideways, see it right now from wherever I am, take the wheel without SSH or a screen share, and leave a record of who prompted what, without moving the run off their laptop.

## The wedge

One sentence: a share link for a local coding-agent session (any CLI, Claude Code and Codex first) where a second human watches live, can be handed the wheel, and the run lands in the repo as a replayable artifact with attribution, while the agent never leaves the host's machine.

The belief the market does not hold: every vendor that ships multiplayer today moves the runtime to its cloud first (Superconductor's manifesto literally argues "laptop agents can't be accessed by the rest of the team"). The bet is that the link is the product and the runtime can stay local. The same argument Remote Control already made for one account; we make it for two people and for any agent.

Why the alternative wedge lost. "Attributed replay artifact first, live second" (a `git log` for agent runs) has the crisper provenance quote (HN stephenway: "The more code agents produce, the more important provenance becomes") but the viewer side is crowded by six MIT tools with 800 to 6,000 stars, and post-hoc share is already sold by Lore and shipped read-only by Anthropic. Live plus hand-off on a local session has zero products and only `tmux` as the workaround. So live is milestone 1, the artifact is milestone 3.

## Acceptance line (milestone 1)

Milestone 1 is done when a stranger can run `npx sesh claude` on their laptop, send the printed link to a friend on another network, and that friend watches the session live in a browser and, once granted the wheel, types the next prompt.

## Success metric

PM gate 1 fix (2026-09-25): dates re-folded so each metric gates the next milestone.

- Milestone 0 (probe) gate, 2026-10-05: 25 email signups on the landing page or 10 distinct viewers who joined a proof-of-concept share link. Below both, park before M1 is built.
- Milestone 1 metric, 2026-12-04: 40 distinct hosts have had a second human join one of their sessions (M1 ships 2026-10-23, six-week window), measured by the relay counting rooms with two distinct participant tokens, aggregated, no content. M2 does not start until this is met.

## Rubric B (rescored 2026-09-25 after PM gate 1; one line of evidence per row)

| Weight | Criterion | Score | Evidence |
|---|---|---|---|
| 2 | Tech unlock | 2 | ACP registry (Jan 2026) puts ~50 agents behind `session/update` and `session/request_permission`; Codex app-server protocol public since Mar 2026 with bidirectional approvals; Claude Code hooks expose `transcript_path` and `--input-format stream-json` exposes `control_request`. A year ago the only handle on a local session was its PTY. |
| 2 | Why-now | 2 | Codex Remote Control shipped 2026-05-14 (closed #9224 and #10450 the same day), Claude Code mid-turn steering shipped 2026-08-17 (closed #30492), Amp orbs 2026-07-22, Slack Code 2026-08-20, Superconductor manifesto 2026-09-05, qm 15k stars in 8 weeks. Two years ago there were no agent CLIs to share; two years from now both vendors will ship cross-account share on their own agent. |
| 1 | Live-in-the-future | 0 | The user runs multi-agent missions daily but solo. Not lived. Fix: share every ANBU mission session with one friend during M1. |
| 1 | Real wedge | 0 | Displaces screen share and `tmux`+SSH (the workaround #60082 names) and rests on a belief the cloud vendors reject, but "urgent for someone" is unproven: direct demand is 15 reactions on #60082 and 0 on #46016. Flips to 1 the day the milestone 0 threshold is met. Attempt 1 scored this 1 by counting same-account remote-access issues; that was wrong. |
| 1 | Solo MVP | 1 | M1 is a PTY wrapper, a stateless relay, an xterm.js page, an 80-line input filter, and a headless-terminal snapshot on join. Three weeks after a one-week probe. |
| 1 | Cross-source | 1 | Launches (Amp, Slack Code, Conductor, Devin, Superconductor), capital (YC RFS Fall 2026 "Multiplayer AI", Conductor at $60/seat), repo velocity (qm 15,233, agentsview 5,987, zoetrope 940 in 5 weeks). Three uncorrelated classes without counting the same-account issues. |
| 1 | Picks-and-shovels | 0 | Anthropic and OpenAI can each absorb their own half by adding a second account to Remote Control. The cross-agent remainder is unproven until a mixed-agent team pays. |
| 1 | Capital positioned | 1 | YC RFS Fall 2026 names Multiplayer AI; Superconductor (YC), Conductor, HumanLayer (YC F24) funded on it. |
| | **Total** | **7** | Down from 8: real wedge drops to 0 until milestone 0 proves urgency. Big-game admission holds at 7 with two independent demand classes (issues, launches and pricing). |

## Demand

PM gate 1 fix (2026-09-25): rewritten. Attempt 1 counted same-account remote-access issues as demand for a second human. They are not, and one quote attributed to #28791 was not in the issue. Counts below re-verified with `gh api` on 2026-09-25.

Direct demand for a second human on one session (the only column that counts as demand for this product):

- anthropics/claude-code#60082, "real-time multi-user collaboration on a single Claude Code session", 15 reactions, open since 2026-05-18. "Pair programming, both users prompt the same agent. Mentoring/onboarding, senior dev watches junior's session live and intervenes. … Current workarounds: screen sharing or tmux session sharing (unsupported)." Proposes read-write share links "similar to Figma/Notion". https://github.com/anthropics/claude-code/issues/60082
- openai/codex#46016, "Real-Time Collaborative Codex Sessions", 0 reactions, open since 2026-09-16, no vendor response. "Ability to transfer session control … Searchable session transcript." https://github.com/openai/codex/issues/46016

That is the whole direct column: 15 reactions across two vendors in four months. It does not fund M1 on its own. Milestone 0 in the roadmap exists to test whether the ask is thin because nobody wants it or because nobody has seen it work.

Adjacent evidence, same account on another surface, now shipped by both vendors. Counts as proof that the runtime stays local for these users, not as demand for sharing:

- openai/codex#9224, "Codex Remote Control", 544 reactions, opened 2026-01-14, closed 2026-05-14 when Remote Control shipped. "Being able to use a proper mobile app UI would be much better for me than having to access the sessions through ssh + tmux." Same account only. https://github.com/openai/codex/issues/9224
- openai/codex#10450, "Remote Development in Codex Desktop App", 876 reactions, opened 2026-02-03, closed 2026-05-14. This asks to reach code on remote SSH hosts from the desktop app, the opposite direction from a local-runtime thesis. It is evidence that client and code are often on different machines, which `sesh` also serves (run it on the SSH box), and nothing more. https://github.com/openai/codex/issues/10450
- anthropics/claude-code#28791, "Sync conversation history between CLI and Claude Code desktop app", 164 reactions, open since 2026-02-26. Same-account history sync between two Anthropic surfaces. The attempt-1 quote was removed; the issue does not contain it. https://github.com/anthropics/claude-code/issues/28791

Why-now positive, not open demand:

- anthropics/claude-code#30492, "Real-time steering: priority message channel for redirecting Claude mid-execution", 61 reactions, closed 2026-08-17 when mid-turn steering shipped. The wheel holder inherits that primitive; it is a capability that arrived, not an unmet ask. https://github.com/anthropics/claude-code/issues/30492

Market statements that the ask exists in the cloud framing, and the local answer does not:

- "Teams should be able to drop into the same live agent session to watch it work, redirect it, and hand it off." YC RFS Fall 2026, Multiplayer AI. https://explainx.ai/blog/yc-requests-for-startups-fall-2026
- "Two people can jump into the same session and drive one Claude (or Codex) together, like a Google Doc for AI." HN 48841178, describing a cloud product. https://news.ycombinator.com/item?id=48841178
- "With each handoff, the company pays a context tax that they wouldn't have to pay if teammates could collaborate in the same agent session." Superconductor's Multiplayer AI Manifesto, 2026-09-05. https://multiplayer-ai.com/
- "The interesting challenge isn't running agents, it's reviewing their work. The more code agents produce, the more important provenance becomes." stephenway on the qm launch thread. https://news.ycombinator.com/item?id=49126604
- "Because people want to be able to use their own clients … with LLMs they run themselves … not permanently tied to an Anthropic ecosystem." walrus01, same thread (the self-host and cross-agent objection to qm).
- Native limitation, verbatim from Anthropic's docs: share links on cloud sessions, "Recipients see the latest state when they open the link, but their view doesn't update in real time." Remote Control: "a session it starts appears only in your own account's Claude apps and grants no one else access." https://code.claude.com/docs/en/claude-code-on-the-web and https://code.claude.com/docs/en/remote-control

Repo velocity for local-first session tooling, all 2026, all MIT, all single-user: kenn-io/agentsview 5,987; matt1398/claude-devtools 3,946; yigitkonur/cli-continues 1,538; Ataraxy-Labs/opensessions 1,228; furkankly/zoetrope 940 (created 2026-08-18; "It's read-only, and nothing leaves your machine"); es617/claude-replay 836; Ark0N/Codeman 768.

Paying-customer signal, cloud runtime only: Conductor Pro $50/mo "collab with up to 5 Pro users", Teams $60/user "prompting agents in real-time together"; Devin Teams $40/seat + $80 base with shareable session links; Amp free tier includes thread sharing; Lore workspace sharing on its Team plan; Superconductor beta free, per-seat compute planned.

Source classes covered: GitHub issues (thin for the direct ask), HN threads, vendor docs stating the limitation, repo velocity, pricing. Not covered: 1-2 star reviews of the nearest tool, "wish this existed" searches, any paying pull for the local case. Reddit and G2 were blocked in this environment. Milestone 0 is the probe that fills or kills.

## Racing

| Who | What they ship today | What they lack for this wedge |
|---|---|---|
| Anthropic Claude Code | Cloud-session share links (Team or Public visibility, not live); Remote Control for local sessions (Feb 2026), same account, all paid plans; mid-turn steering (2026-08-17); `--teleport` cloud to terminal, one-way; Compliance API transcripts, Enterprise only | No second account on a local session; no live update on shares; no Codex or other agents; no repo-local artifact |
| OpenAI Codex | Cloud tasks; Remote Control from the Codex desktop app and ChatGPT app, shipped 2026-05-14 (PM gate 1 fix: attempt 1 said GA 2026-06-25; #9224 and #10450 closed 2026-05-14 on ship, the 2026-08-15 date is the ChatGPT mobile preview on all plans), same account; app-server JSON-RPC for integrators | No share link for any thread; codex#46016 open with no response |
| Conductor | Cloud-native multiplayer: watch every agent, steer together, hand off with one keystroke; $50 Pro, $60/user Teams | Runtime is their cloud; Claude Code centric; no local session |
| Superconductor | Cloud workspace, join a teammate's run, live previews, network sandbox; beta, free | Cloud runtime by conviction (the manifesto) |
| Amp | Threads sync to ampcode.com, share links; multiplayer orbs (2026-07-22): workspace members share control of a running orb | Amp agent only; orb is their cloud |
| Zed | ACP (created it), parallel agents in one window, ACP registry with JetBrains | Editor-bound; no link for a non-Zed human; no replay artifact |
| Slack Code (2026-08-20) | Agent-owned code channels, session artifacts (diffs, canvases, previews), Claude Code, Devin, Copilot, ChatGPT, Vercel | Slack-hosted sessions; no local CLI; Salesforce rollout is gradual |
| qm (YC, MIT, 15,233 stars) | Slack + web, per-person sandboxes, Postgres, Claude Code, OpenCode, Codex, Pi | Server-side harness you deploy; HN asked for self-host and non-Anthropic clients |
| Cursor | Cloud agent URLs shareable in a team, admin-enabled team follow-ups, mid-run steering | Cloud agents only; Cursor only |
| Devin | Every session has a share link, multiplayer mode, Slack mirror; $40/seat + $80 | Devin only; cloud |
| Google Jules | API sessions with immutable activities | No sharing |
| HumanLayer | Desktop IDE + cloud control plane, BYO Claude Code, Codex, Copilot | Runtime in their control plane |
| AQ | Server-side agent CLIs, shared live terminals, "free to start" | Server-side |
| Lore | `/lore:share` upload, block comments, `/lore:fork`; Claude, Cowork, Codex, Amp; free tier | Post-hoc only; a fork, not the same session |
| Lody | Teammate continues the same Claude Code session, worktree and branch | Claude only; needs workspace membership and machine sharing |
| zoetrope, agentsview, claude-replay, Codeman, claude-devtools | Local-first watch, search, replay, self-hosted mission control across 2 to 9 CLIs | Single user by design; Codeman's multi-user is separate workspaces, not one session; no share link with roles; no attribution |

The one thing none of them do: a second human on a local session, any agent, over a link, with the record kept where the code lives.

## Why now

Twelve months ago the only handle on a running local agent was its terminal. Now: Claude Code hooks expose `transcript_path` on every event and `--input-format stream-json` exposes a driven session with `control_request` permission prompts; Codex ships a public app-server protocol with per-item lifecycle notifications and bidirectional approvals; the ACP registry (Jan 2026) puts ~50 agents behind `session/update` and `session/request_permission`. Remote Control on both vendors (Anthropic Feb 2026, OpenAI 2026-05-14; PM gate 1 fix: was "Jun") proved that users accept steering a local runtime from another surface. Claude Code's mid-turn steering (2026-08-17, closing #30492) means a second human's redirect lands mid-turn instead of at the next turn boundary. The vendor race for cloud multiplayer (Jul to Sep 2026) taught the market the UX and left the local case empty.

## Screens (names only)

Probe landing page (M0) · Link card (CLI output) · Join gate · Viewer (terminal, participants, wheel state) · Wheel request, first-grant warning, grant toast, expiry toast · Host local status page · Disconnected and expired states · Replay (M3) · Session list (M3)

## Wheel rules (M1)

PM gate 1 fix (2026-09-25): the grant is no longer raw PTY keystrokes. The filter runs on the host inside the `sesh` wrapper, before any byte reaches the PTY; viewer code is untrusted and enforces nothing.

Input allowlist for a viewer holding the wheel. Anything not listed is dropped and counted:

1. Allowed: printable UTF-8 text (no bytes 0x00-0x1F, no 0x7F except Backspace below, no C1 controls).
2. Allowed: Enter as `\r` or `\n`.
3. Allowed: Backspace `\x7f`.
4. Allowed: arrow keys, exactly `\x1b[A`, `\x1b[B`, `\x1b[C`, `\x1b[D`. No other CSI or SS3 sequence.
5. Blocked: every Ctrl chord (bytes 0x00-0x1F other than `\r` and `\n`), so Ctrl+C, Ctrl+D, Ctrl+Z, Ctrl+R, Tab and friends never reach the agent from a viewer.
6. Blocked: Esc on its own or as any prefix other than the four arrows above. Esc is Claude Code's stop key and the viewer does not get it.
7. Blocked: `!` at line start. The host keeps a per-grant line buffer of accepted viewer bytes since the last Enter (Backspace pops it); a `!` arriving while that buffer is empty, or directly after `\r`/`\n` inside one message, is dropped. This covers Claude Code's and Codex's shell prefix.
8. Blocked: any single viewer message over 2,048 bytes; the whole message is dropped and the viewer sees "paste too large, 2 KB max".
9. Rate: at most 20 messages per second per viewer; excess dropped.
10. Every accepted and dropped byte is logged in the cast metadata with the viewer's token (name from M2) and the reason for the drop.

Grant, revoke, expiry:

- The viewer clicks "Request wheel". The host's status line (drawn by `sesh` in the terminal's bottom row, outside the agent's alternate screen) shows "`<name>` requests the wheel. Ctrl+] g grant, Ctrl+] d deny".
- Before the first grant in a session the host sees, in that status line and on the local status page, "Grant the wheel to `<name>`: they can type prompts, not run shell commands. Ctrl+] y to confirm". Later grants in the same session skip the confirmation.
- Ctrl+] (0x1D) is the `sesh` prefix. The wrapper swallows it and the next key; neither Claude Code nor Codex binds it. Ctrl+] pressed twice revokes immediately. Ctrl+] g grants, d denies, s shows the status line. The same buttons exist on the host's local status page at `http://127.0.0.1:<port>`, printed with the link at start.
- A grant expires after 10 minutes of viewer inactivity (no accepted input), on viewer disconnect, on host disconnect, and on a hard cap of 60 minutes; the host can re-grant with Ctrl+] g. Expiry writes a line in the cast and a toast in the viewer.
- One wheel at a time. A second request while a grant is live is queued and shown to the host.

Residual, accepted: a viewer with the wheel can type a prompt that asks the agent to run a shell command, subject to the host's own permission mode. The warning text says so in plain words. `sesh` does not change the agent's permission prompts; that is M5's job (route them to the wheel holder with the host's veto).

## Chunks for BUILD, milestone 0 (PM gate 1 fix, 2026-09-25)

1. Landing page on Cloudflare Pages: one screen, the friend sentence, a 20-second recording of a real share, an email field writing to a D1 table or a Formspree form, and the numeric counter the gate reads.
2. Proof-of-concept share link, target 20 lines: a Node script that spawns the agent under `node-pty`, pipes stdout frames over a `ws` connection to a single Worker, and a static xterm.js page that renders them read-only, no encryption, no wheel. Posted as the link people click, with a live session running during the posting windows.
3. Three posts: a comment on anthropics/claude-code#60082, a comment on the qm HN thread (49126604), and one Show HN titled "Show HN: A live share link for your local Claude Code or Codex session (PoC)".

## Chunks for BUILD, milestone 1

1. `sesh run <cmd>`: PTY wrapper that records an asciinema v2 cast to `~/.sesh/runs/`, plus `sesh play <cast>` locally. Proves the wrapper is transparent for Claude Code and Codex TUIs (resize, colors, Ctrl-C). Includes the Ctrl+] prefix and the bottom-row status line.
2. Relay and late-join snapshot: one Cloudflare Durable Object per room, WebSocket hibernation, no storage. PM gate 1 fix (2026-09-25): the 64 KB ring buffer is replaced by a host-side snapshot. The CLI feeds the same PTY bytes into `@xterm/headless`; on a `join` message the relay asks the host, the host serializes the screen with `@xterm/addon-serialize` (scrollback capped at 2,000 lines), encrypts it, and sends it to the joining viewer as the first frame, then live frames follow. A late joiner sees the exact current screen instead of a torn replay.
3. Viewer: Vite + React + xterm.js on Cloudflare Pages. Reads the E2E key from the URL fragment, then `history.replaceState` drops the fragment before anything else runs; decrypts frames, renders live, shows participants, handles resize, has empty, loading, disconnected, and expired states. No Sentry, no third-party script.
4. Wheel: request, first-grant warning, grant, revoke, expiry, and the input filter from `## Wheel rules (M1)`, with a unit test per rule (each blocked sequence asserted dropped, each allowed one asserted passed) and a PTY integration test that sends `!ls\r` from a viewer and asserts the PTY never received the `!`.
5. Packaging and landing: `npx sesh`, brew tap, README, landing page gains a 30-second demo replay, relay-side aggregate counter of rooms with two humans, `Referrer-Policy: no-referrer` and CSP headers on Pages.

## later

- Own-account relay: `wrangler deploy` of the open-source Worker to your Cloudflare account, `sesh --relay https://…`. Milestone 2 (PM gate 1 fix: moved up from M4 because it is a flag on existing code).
- Structured turn view from transcripts (Claude Code `transcript_path`, Codex `~/.codex/sessions`), with viewer "suggest" notes the host accepts. Milestone 2.
- Named attribution via GitHub OAuth. Milestone 2.
- Repo-local run artifact `.sesh/runs/<id>/` with cast, transcript copy, participants, wheel log, and a PR comment link. Milestone 3.
- Hosted replays on R2 for teams without repo access. Milestone 3.
- Self-hosted Node relay (`sesh relay`, Docker image) and P2P WebRTC data channels with the relay as signaling only. Milestone 4.
- Team plan: org allowlist, 90-day retention, SSO, per-seat pricing. Milestone 4.
- Native steering over Codex app-server and ACP (`session/prompt` from the wheel holder, permission prompts routed to the wheel holder), Gemini CLI and Cline. Milestone 5.
- Mobile-friendly reflow of the terminal. Not before M2's structured view exists.
- Any agent orchestration, worktrees, parallel runs, cloud runtime. Never; that is the racers' product.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Demand is vendor push, not user pull (PM gate 1 fix, 2026-09-25: direct demand is 15 + 0 reactions) | Milestone 0 probe before any M1 code: 25 signups or 10 live joins by 2026-10-05, or park. M1's kill metric counts sessions with a second human, not installs. M2 does not start until 40 hosts have had one. |
| First-party absorption: Anthropic adds a second account to Remote Control (#60082 proposes it), OpenAI adds share to Codex Remote | Cross-agent from day one (any PTY), the repo-local artifact vendors will not write, own-account relay at M2, Docker relay at M4. Trigger: if Anthropic ships cross-account live share before M3, drop Claude-only marketing and lead with Codex, mixed-agent teams, and the artifact. If both vendors ship by M4, park. |
| Wheel grant equals a shell on the host (PM gate 1 fix, 2026-09-25: attempt 1 forwarded raw keystrokes and used Esc to revoke) | `## Wheel rules (M1)`: host-side allowlist (printable text, Enter, Backspace, four arrows), Ctrl chords, Esc, line-start `!`, and pastes over 2 KB dropped; first-grant warning modal; 10-minute inactivity expiry, 60-minute cap; Ctrl+] twice or the local status page revokes, a chord no agent owns. Unit test per rule. |
| E2E key in the URL fragment leaks through error telemetry, history sync, or referrers (PM gate 1 fix, 2026-09-25) | No Sentry or any third-party script in the viewer at M1; errors go to an in-page ring buffer the user can copy into a GitHub issue. The viewer reads the key then calls `history.replaceState` to drop the fragment before rendering. Pages serves `Referrer-Policy: no-referrer` and a CSP with `connect-src` limited to the relay origin. |
| Link leak means a stranger watches a terminal | Links are view-only by default; the wheel is granted per viewer by the host. E2E encryption with the key in the fragment, so the relay reads ciphertext. Links expire in 24 h by default; the host can end the share with Ctrl+] x. |
| Late joiner sees a torn or empty screen (PM gate 1 fix, 2026-09-25) | Host-side `@xterm/headless` snapshot serialized on join, chunk 2. |
| Terminal mirror is hard to read on a phone | Accepted for M1 (desktop viewers). M2 adds the structured view from transcripts. |
| Transcript formats are "internal and change between versions" (Anthropic's words) | Live path is the PTY and does not depend on them. M2 reads `transcript_path` from hooks and vendors claude-replay's MIT parsers behind one adapter, pinned and tested against fixture files per version. |
| `node-pty` native build fails under `npx` | Use the prebuilt multiarch package, CI matrix on macOS, Linux, WSL; brew tap as the fallback install; consider a Bun single binary at M2. |
| Relay cost or abuse | Free DO tier counts each inbound message as a request (100k/day); batch PTY frames at 50 ms; per-room rate limit; Workers Paid $5/mo is the first paid line item, planned for M1 launch day. |
| "Why not tmux + Tailscale" | The link needs no SSH access setup, adds roles and a record, and works for a viewer who has never been given a shell on the host. Say this on the landing page. |

## Red team

Five reasons it fails, each with the plan's answer or an explicit acceptance:

1. Anthropic ships cross-account share on local sessions. Answer: the absorption trigger above; the cross-agent and artifact halves survive; park if both vendors ship.
2. Superconductor is right and teams that want multiplayer move to cloud runtimes. Answer (PM gate 1 fix, 2026-09-25: attempt 1 cited codex#10450 as support; it is the opposite): codex#9224 (544) asked to drive a local Codex from a phone, which is evidence that the runtime sits on a laptop for those users and they want to keep it there. codex#10450 (876) asked the desktop app to reach code on remote SSH hosts, which is evidence that many users already keep code off the laptop, on a box they own, not a vendor cloud. `sesh` runs wherever the agent runs, including that SSH box, so it serves both, but #10450 is not support for a local thesis and is not counted as such. Accept that the cloud-runtime segment grows over years; the bet is the next 12 months, and milestone 0 measures it before M1.
3. It is "tmux with a link" and people say so. Answer: the wheel grant with its allowlist, the attribution, and the artifact are what tmux cannot do; if M1 users only ever watch and never grant the wheel, that is a measured signal to move the artifact up to M2.
4. Nobody pays: solo devs have nobody to share with, teams with budget buy Conductor at $60/seat. Answer: free for individuals forever; charge teams $10-15/seat for named viewers, org allowlist, retention, and SSO at M4; validate willingness with hosted replays at M3 before building the team plan. Accept that revenue may be zero until 2027.
5. Vendors' own mobile UIs are structured and free (same account); a raw terminal loses on the phone. Answer: M2 structured view; M1 targets desktop viewers and says so.

Five unintended consequences:

1. Managers use it to watch juniors. Answer: only the host can start a share, every viewer is listed in the host's status line, and there is no org-wide session directory before M4, where it is opt-in per host.
2. Secrets in terminal output end up in a shared link. Answer: E2E key never reaches the server, 24 h expiry, and M3 redacts common secret patterns from the recording. Residual risk accepted and documented.
3. Two humans fight over the wheel and confuse the agent. Answer: one wheel at a time, queued requests, prompts tagged with the sender in the cast, handoff log.
4. Run artifacts bloat repositories. Answer: `.sesh/runs/` is gitignored by default; `--commit` is opt-in; casts gzip small; PR links can point at R2.
5. A second record of every session appears next to Anthropic's Compliance API capture (Enterprise) and could contradict it. Answer: the cast records what happened on the device, which Anthropic's docs say their capture does not ("not what happened on the device"); it complements rather than contradicts. Accepted.

## Distribution

1. Show HN: "Show HN: A share link for your local Claude Code or Codex session. The agent stays on your laptop." The qm and zoetrope threads show HN rewards local-first framing. Milestone 0 posts a PoC version first; M1 posts the real one.
2. The open issue threads where the direct ask lives: anthropics/claude-code#60082 and openai/codex#46016 (comment with the link at M0 and M1), plus the adjacent threads codex#9224 and claude-code#28791 for the "local runtime" audience, awesome-claude-code, and the ACP registry at M5. Reddit (r/ClaudeAI, r/ChatGPTCoding) posted by the human; this environment cannot reach reddit.com (see LEARNINGS).

## Stack (summary; per-layer detail in roadmap.md)

TypeScript CLI (`node-pty` prebuilt, `ws`, `@xterm/headless` + `@xterm/addon-serialize` for join snapshots, asciinema v2 cast, host-side input filter) · Cloudflare Durable Object relay with WebSocket hibernation, stateless · Vite + React + xterm.js viewer on Cloudflare Pages, no Sentry and no third-party script, fragment dropped via `history.replaceState` on load, `Referrer-Policy: no-referrer` (PM gate 1 fix, 2026-09-25) · no server storage at M1, D1 and R2 from M2/M3 · capability links plus E2E at M1, GitHub OAuth at M2 · first paid line item: Workers Paid $5/mo on M1 launch day plus a $10/yr domain.

## Learnings applied

- Scaffold with `create-vite` into a temp dir and move; it wipes `.anbu/` otherwise.
- Ship the single-line-comment lint script in `npm run lint` from chunk 1.
- Viewer pages are plain web; Playwright covers them. The CLI gets a PTY integration test that runs `sesh run bash -c 'printf ok'` and asserts the cast, and a wheel test that sends `!ls\r` and asserts the PTY never saw the `!`.
- Plan for the verifier to find real bugs every round; budget 3 build rounds and 2 test rounds for M1.

## Friend sentence

PM gate 3 fix (2026-09-25): `sesh` was taken on npm, so the command is `npx sesh-live`. The old wording overstated "never leaves your laptop" (the agent process does; the terminal bytes travel through the relay in plaintext at M0, E2E is not built yet), so the sentence now says exactly what M0 ships.

"Run `npx sesh-live claude` instead of `claude`, send me the link, and I can watch your session live. The agent runs on your laptop; the terminal stream goes through a relay, end-to-end encryption is next."
