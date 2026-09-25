# sesh-relay

Cloudflare Worker: one Durable Object per room, plus D1 for signups and join counts.

## First-time setup (not done by this repo)

The D1 database does not exist yet. `wrangler.toml`'s `database_id` is the literal placeholder `REPLACE_WITH_D1_ID`, on purpose, so nobody accidentally deploys against a database that was never created. To stand it up:

```
wrangler d1 create sesh-signups
```

Copy the `database_id` from the command's output into `wrangler.toml`'s `[[d1_databases]]` block, then run:

```
npm run db:init
```

## Env vars

- `ALLOWED_ORIGIN`: the deployed Pages origin for CORS. Defaults to `http://localhost:5173` (the landing app's local Vite port) when unset, so local dev works with no config.

## Scripts

- `npm run dev` — `wrangler dev`
- `npm run deploy` — `wrangler deploy`
- `npm run test` — pure-helper unit tests (`src/routing.ts`), no workers runtime needed
- `npm run typecheck` — `tsc --noEmit`
