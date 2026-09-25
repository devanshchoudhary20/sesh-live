# Screens: sesh, milestone 0 (demand probe)

Scope: the two M0 screens only (landing, viewer PoC). M1+ screens (join gate, wheel UI, host status page, replay, session list) are named in `plan.md` `## Screens` and get their own `screens.md` entries when M1 is designed.

## Direction

**Typefaces.** IBM Plex Sans (UI text: headline, body, buttons, form) paired with IBM Plex Mono (terminal chrome, session names, counters, the friend-sentence headline's code fragments). Same type family across both weights keeps letterforms consistent between the marketing page and the terminal it is selling, and the mono cut is real xterm-adjacent typography, not a display font pretending to be a terminal. Loaded self-hosted (`@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`) so no third-party script reaches the viewer, per the plan's no-third-party-script rule.

**Color.** Warm neutral scale (not Tailwind's cool gray) plus one amber accent tied to the product's own "live" signal:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--neutral-50` | `#FAFAF8` | `#131110` | page background |
| `--neutral-200` | `#E7E2D9` | `#2A2621` | borders, dividers, input bg |
| `--neutral-400` | `#8C8579` | `#948C7E` | secondary text, placeholder |
| `--neutral-700` | `#3A362F` | `#D9D4C9` | primary text |
| `--neutral-950` | `#161409` | `#F5F2EA` | headline text, max-contrast |
| `--accent-500` | `#F0A020` | `#F0A020` | live dot, CTA button, focus ring |
| `--accent-600` | `#D3870C` | `#FFB84D` | hover/pressed (darkens in light, lightens in dark) |

Both apps import the same `src/tokens.css` (identical file, duplicated per app since each Vite app builds standalone; a shared `packages/tokens` earns its keep once a third app needs it, not at two).

**Terminal colors.** The viewer's xterm instance uses xterm.js's default dark theme against `#000000`, with three entries pulled lighter (2026-09-25 fix) because they fail WCAG 4.5:1 (standard eight) / 3:1 (bright eight) against a pure-black background: `brightBlack`, `magenta`, `brightMagenta`. Everything else keeps the documented default. The terminal has no light theme (see below):

| xterm theme key | Dark (shipped) | Contrast vs `#000000` |
|---|---|---|
| `background` | `#000000` | — |
| `foreground` | `#FFFFFF` | 21.00:1 |
| `cursor` | `#FFFFFF` | 21.00:1 |
| `black` / `brightBlack` | `#000000` / `#8B8B8B` (was `#666666`) | 1.00:1 / 6.16:1 |
| `red` / `brightRed` | `#CD3131` / `#F14C4C` | 4.08:1 / 5.88:1 |
| `green` / `brightGreen` | `#0DBC79` / `#23D18B` | 8.49:1 / 10.56:1 |
| `yellow` / `brightYellow` | `#E5E510` / `#F5F543` | 15.55:1 / 18.02:1 |
| `blue` / `brightBlue` | `#2472C8` / `#3B8EEA` | 4.32:1 / 6.24:1 |
| `magenta` / `brightMagenta` | `#D783FF` / `#E6ADFF` (was `#BC3FBC` / `#D670D6`) | 8.58:1 / 11.79:1 |
| `cyan` / `brightCyan` | `#11A8CD` / `#29B8DB` | 7.51:1 / 8.97:1 |
| `white` / `brightWhite` | `#E5E5E5` / `#FFFFFF` | 16.67:1 / 21.00:1 |

**Spacing scale (px).** `4, 8, 12, 16, 24, 32, 48, 64` as `--space-1` through `--space-8`. Covers icon gaps (`--space-1`) up to section padding (`--space-8`) without a step so fine it never gets used.

**Radius.** `--radius-sm: 4px` (badges, the live dot's square-ish pill, counter chip) and `--radius-md: 8px` (buttons, input, cards, the terminal frame). No `--radius-lg`; two screens don't need a third size.

**Components: hand-rolled.** Reason: two static pages with one stateful widget (xterm.js) between them don't earn a component library's bundle weight or API surface; a button, an input, and a status pill are each under 20 lines and used once or twice per screen.

## Screen 1: Landing (`apps/landing`)

PM gate 3 fix (2026-09-25): the live link moved above the fold as a pill, before the email form, with its own "N watching" count; the signup button is renamed "Notify me" (it no longer claims to hand over a link immediately); the recording placeholder copy no longer promises a fixed timeline; the plural bug on a signup count of 1 is fixed; GitHub link now points at `sesh-live`, the renamed npm package.

### Happy path

1. Visitor arrives from an HN comment, the issue thread, or Show HN and sees, top to bottom: the friend-sentence headline, a "Live now, N watching" pill (or the no-live-session fallback) above the fold, a 20-second recording placeholder (`<video>` slot, 960×540, 16:9), and an email field with a "Notify me" button and a live signup counter beneath it.
2. Visitor types an email and clicks "Notify me".
3. The button shows a pending state while `POST /signup` is in flight.
4. On success, the field clears, the button reads "You're in", and the counter increments to the server's returned count.
5. Visitor optionally clicks the live pill and lands on `apps/viewer` with that session's relay URL.
6. Visitor scrolls to the footer and clicks the GitHub link to the repo.

### States

**Empty** (page loads, counter not yet fetched, no session up)
- Counter reads `— signups so far` (em dash, not `0`, so a slow fetch never flashes a false zero). Once the fetch resolves to an actual `0`, copy becomes `Be the first to sign up`; at exactly `1`, copy is `1 signup so far` (singular, PM gate 3 fix).
- The live pill reads `No live session right now, leave your email to get the link` (PM gate 3 fix: dropped the "posting window" phrasing nobody outside the team understands) and is not a link in this state.
- Recording placeholder shows a static frame with centered text `Live demo runs during the launch window; recording coming` (PM gate 3 fix, was `Recording coming soon`) if no `video.src` is configured (env var `VITE_DEMO_VIDEO_URL` unset).

**Loading** (counter fetch in flight, form idle)
- Counter shows `— signups so far` (same em-dash fallback as empty; loading and pre-fetch empty are visually identical on purpose, no skeleton shimmer for one number).
- Form is interactive during this state; a slow counter fetch never blocks signup.

**Error** (`POST /signup` fails: network error, non-2xx, or malformed JSON)
- Inline text under the form, in `--accent-500`... no: error text uses a distinct red, not the amber accent, so it never reads as "live". Add `--error-500: #C6362B` (documented here, used only for this state and its viewer analogue) reading: `Couldn't save that — check the address and try again.`
- Button reverts from pending to its default label `Notify me`, re-enabled immediately (no cooldown).
- Counter is untouched (still shows its last known value, not `— signups so far`, since the fetch that populated it did not fail).

**Success** (`POST /signup` returns 2xx with `{ count }`)
- Button label becomes `You're in`, disabled for 3 seconds then reverts to `Notify me` with the field cleared, so a second, different email can be added.
- Counter updates to the server's `count` value directly (never optimistically incremented client-side, since the server is the count of truth and a failed request must not have already bumped it).
- If the response is 2xx but `count` is missing or not a number (malformed server response), counter keeps its last known value and does not fall back to `— signups so far` (that fallback is reserved for "never fetched", not "fetched something broken").

### Values and fallbacks

| Value | Source | Fallback |
|---|---|---|
| Signup count | `GET /signup` | `— signups so far` until first successful fetch; last known value on any later failure |
| Live session presence + relay URL | `GET /stats` `.live` (polled every 10s) + build-time env `VITE_DEMO_SESSION_URL` | not live, or live with no configured URL → static "no live session" pill copy above; the pill is never rendered as a link with an empty `href` |
| Demo recording | `VITE_DEMO_VIDEO_URL` | unset → static placeholder frame, exact copy above, fixed 960×540 box so layout never shifts when the real clip lands |
| Email input | user | empty submit is blocked client-side (`required`, no request sent); no server round-trip for an obviously blank field |
| GitHub link | build-time constant | hardcoded `https://github.com/devanshchoudhary20/sesh-live` in footer; never sourced from an API so it cannot be undefined |

## Screen 2: Viewer, read-only PoC (`apps/viewer`)

PM gate 3 fix (2026-09-25): the host now sends a `resize` control frame on connect (not only on SIGWINCH) and the relay hands a late joiner the last stored resize before backfill, so the terminal is sized before any content redraws into it; a `--name` flag on the host sends a `meta` frame delivered first, and the top bar now shows that name plus a sub-line; the viewer count freezes at its last value once the session ends instead of drifting toward 0.

### Happy path

1. Visitor opens the link they were sent, of the form `/?relay=wss://sesh-relay.<account>.workers.dev&room=<id>` (query) or `/#relay=...&room=...` (fragment; the CLI's printed link at M0 uses whichever the host's environment produced).
2. Viewer parses `relay` and `room` from the query first, the fragment second, on page load.
3. App shows the connecting state while the WebSocket to `wss://.../room/<id>?role=viewer` opens.
4. On open, the top bar shows the session name, a live indicator, and the viewer count; the terminal below fills the rest of the viewport and starts rendering host frames as they arrive.
5. If the host process exits or its socket closes, the top bar switches to an ended indicator and the terminal freezes on its last frame.
6. Visitor clicks "Get the link for your own session" in the top bar and lands on `apps/landing`.

### States

**Connecting** (WebSocket not yet open)
- Top bar: live indicator shows a static gray dot, label `Connecting…`. Session name shows `Session` (generic) until either the `?name=` query param (initial value) or the relay's `meta` frame (authoritative, arrives first over the socket) supplies one. Under the name, a sub-line reads `<name>, read-only stream`, or `Claude Code session, read-only stream` when no name is known yet.
- Terminal area shows centered text `Connecting to the session…` on the theme's terminal background, no xterm instance mounted yet (avoids a flash of an empty black/white box before the real one).
- Viewer count shows `— viewers`.

**Live** (WebSocket open, frames flowing)
- Live indicator: amber (`--accent-500`) dot, label `Live`.
- Viewer count updates from the relay's periodic count message; if a count message hasn't arrived yet even though the socket is open, shows `1 viewer` (counting the visitor themselves as the floor, never `0` while their own connection is live).
- Terminal renders raw PTY bytes via xterm.js, read-only (no keyboard listener attached at M0, no wheel).

**Host ended** (relay closes the room, or sends an explicit end frame)
- Live indicator: gray dot, label `Ended`.
- Viewer count freezes at its last known value (PM gate 3 fix): the stats poll stops once `ended` is reached, so it never drops toward `0` as viewers close their tabs after the host is already gone.
- Terminal keeps its last rendered frame, dimmed to 70% opacity via a CSS overlay, so the visitor can still read the last lines.
- Banner above the terminal: `This session has ended. Replay isn't available yet — that's coming in a later milestone.` (exact M0 replay-not-available copy).
- "Get the link for your own session" CTA is promoted from the top bar into the banner as a second line, in case the visitor missed the top bar.

**Invalid link** (missing or malformed `relay`/`room`, or the relay's viewer socket sends an `{"type":"invalid"}` frame and closes with code `4404` because the room id never had a host)
- No terminal is mounted at all.
- Centered card: heading `This link doesn't work`, body `The session link is missing a piece or has expired. Ask whoever sent it for a fresh one, or start your own.`, and a button `Get the link for your own session` to the landing page.
- Distinguished from "host ended" (a link that worked and then stopped) by copy and by never having shown a live frame.

**Connection error** (the WebSocket closes with code `1006` before a single frame ever arrived — the handshake itself never completed, e.g. the relay is unreachable; distinct from "Invalid link", which is a definite signal from a room the relay knows never existed)
- No terminal is mounted at all.
- Centered card: heading `Can't reach the session`, body `Something interrupted the connection before it opened. Check your connection and try the link again.`, and the same `Get the link for your own session` button as the invalid-link card.
- Terminal, once this state is reached, never downgrades back to "connecting" — a fresh attempt requires a page reload.

### Values and fallbacks

| Value | Source | Fallback |
|---|---|---|
| Relay URL | query `?relay=` or fragment `#relay=` | missing/malformed → invalid link state, no connection attempted |
| Room id | query `?room=` or fragment `#room=` | missing → invalid link state |
| Session name | relay `meta` control frame (authoritative, sent first on join); query `?name=` is the initial value before it arrives | neither present → `Session` in the top bar, `Claude Code session, read-only stream` on the sub-line |
| Viewer count | relay's periodic count message over the open socket | before first message: `— viewers` (connecting) or `1 viewer` (live, counting self); on disconnect, count freezes at its last value |
| Live/ended state | WebSocket `open`/`close` events, an `invalid` or `ended` control frame, and the close code (`4404` for invalid, `1006` with no frames for connection error) | close code `4404` or an `invalid` frame → invalid link state; an `ended` frame, or any close reached after "live", → ended; close `1006` while still "connecting" (no frames ever received) → connection error state; invalid, ended, and connection error are all terminal — a later close event never overwrites them |
| Terminal frames | WebSocket `message` events, raw bytes | none yet → connecting state's placeholder text, never an empty xterm canvas |

## Both themes

Both screens read `prefers-color-scheme` on load and expose a manual toggle (button in the landing header, icon button in the viewer top bar) that sets a `data-theme` attribute on `<html>`; `tokens.css` defines both `:root` (light) and `[data-theme="dark"]` blocks for every token above.

**Terminal stays dark in both themes (2026-09-25 fix):** the viewer's xterm instance and its container no longer flip with `data-theme`; the top bar and cards still follow the page theme, but the terminal frame is fixed dark (`--terminal-bg`/`--terminal-fg`). Claude Code emits truecolor escapes that bypass the palette, so a light terminal cannot be made accessible from the viewer.

## Analytics

None beyond the two counters already specified (landing signup count, viewer distinct-viewer count), both read from the relay/D1, not from any third-party script, per the plan's no-third-party-script rule.

## Figma

File: **sesh — M0 probe** — https://www.figma.com/design/T4RCavDVoA4KwCVBzDKX7R/sesh---M0-probe

Page `Screens` (`0:1`):

| # | Frame | Node id | Size |
|---|---|---|---|
| 1 | `Landing / Light / Success` | `3:2` | 1440×900 |
| 2 | `Landing / Dark / Success` | `3:37` | 1440×900 |
| 3 | `Landing / Light / Empty` | `3:72` | 1440×900 |
| 4 | `Viewer / Dark / Live` | `4:2` | 1280×800 |
| 5 | `Viewer / Light / Live` | `4:44` | 1280×800 |
| 6 | `Viewer / Dark / Ended` | `4:86` | 1280×800 |
| 7 | `Landing / Light / Mobile` | `5:2` | 390×844 |

Page `Tokens` (`2:4`): `sesh tokens` sheet — `6:2`. Variable collections: `sesh/color-light`, `sesh/color-dark` (two collections rather than one with Light/Dark modes: the Figma Starter plan caps a collection at one mode), `sesh/scale` (space-1…8, radius-sm/md, type sizes).

Typefaces: IBM Plex Sans and IBM Plex Mono, both available in Figma, no substitution.

Deviations from the spec above, all for mockup framing only:
- Recording placeholder drawn at 576×324 (desktop) and 350×197 (mobile) rather than 960×540, so the whole page fits a 1440×900 / 390×844 viewport. Aspect ratio stays 16:9.
- Empty-state counter reads `Be the first to sign up` (the spec's resolved-zero copy) rather than a literal `0`.
- Terminal transcript uses the bright ANSI variants on the dark frames and the base variants on the light frame; both sets come from the documented xterm.js 16-colour palette.

Open visual fixes (the Figma MCP tool-call quota on the Starter plan ran out mid-pass; the fix script is one `use_figma` call and is written down here so the next session can run it):
1. `Friend sentence` / `Subhead` / `No live session copy` / `Ended copy` text nodes sit at a fixed 10px height and clip to one line. Cause: `resize()` on a TEXT node resets `textAutoResize` to `NONE`, and the build script set `HEIGHT` before the resize. Fix: set `textAutoResize = 'HEIGHT'` on those nodes (width is already fixed).
2. `Button / Success`, `Button / Get the link` and `CTA / Get the link` were built with `resize(1, h)`, so they are 1px wide on the primary axis and clip their label. Fix: `primaryAxisSizingMode = 'AUTO'`.
3. Five transcript lines in the viewer terminals render invisible — every line built from a single coloured run (`⎿ Read 84 lines`, `⎿ 3 matches across 2 files`, the `and routing through safeNext()…` continuation, `⎿ Updated with 2 additions and 1 removal`, and the `▌` cursor). Multi-run lines are fine. Fix: set `node.fills` directly instead of a full-range `setRangeFills` with a variable-bound paint.
4. The `Tokens` page intro paragraph has the same one-line clipping as (1).
