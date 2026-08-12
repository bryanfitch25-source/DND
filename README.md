# SoloDM

A personal, single-player web app where Claude acts as a Dungeon Master running an improvised, **open-ended** D&D 5e (2014 core rules) solo campaign. Built with Next.js, Supabase Postgres, and the Claude API — deployed on Vercel so it's reachable from anywhere, not just your home network.

Unlike a bounded oneshot, this campaign has no forced ending: play a session, stop whenever you like, and pick up again later — your character, the world, and the story all persist. Combat runs on a real tactical grid, and by default this is a **soft-fail** game: your character can be knocked down and defeated, but that leads to a narrated setback (captured, injured, robbed), never permanent death, unless you explicitly choose that outcome yourself.

Single-player by design. It's deployed on a public URL though, so it's gated behind HTTP Basic Auth (see Deployment) — without that, anyone who found the URL could spend your Anthropic credits.

## Local development

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the env example and fill it in:
   ```
   cp .env.local.example .env.local
   ```
   - `ANTHROPIC_API_KEY` — from the [Anthropic Console](https://console.anthropic.com/) (pay-as-you-go, requires billing set up).
   - `DATABASE_URL` — your Supabase project's connection string (Project Settings → Database → Connection string → URI, "Transaction" pooler mode works well for serverless).
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` — leave blank for local dev (the app is left open if unset); required once deployed publicly.
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open http://localhost:3000

The schema is applied automatically on first request (idempotent — safe to run repeatedly), or explicitly via:
```
npm run db:init
```

### A note on cost

**Claude API**: billed per token, not a free tier with rate limits. A DM turn typically involves one or more tool-calling round-trips (character lookups, dice rolls, world-fact searches, etc.) before the final narrative response. Measured in testing: a character-creation turn (create_character plus several inventory/world-fact/quest tool calls in one go) cost about **$0.16 on Sonnet**; an ordinary turn later in a campaign (1-2 tool calls) costs noticeably less.

The main DM model defaults to Haiku for this reason (`CLAUDE_MODEL` in `lib/config.ts`) — cheaper and faster, at some cost to narrative depth/consistency. Switch a specific campaign to Sonnet from the Settings tab (stored per-campaign, no redeploy needed) if you want richer prose and don't mind paying more per turn. The periodic summarization step always uses Haiku (`SUMMARY_MODEL`) regardless of the main model.

**Supabase + Vercel**: both free at this app's scale (a single player's game state is tiny, and traffic is one person's browser/phone). Supabase's free tier caps an org at 2 active projects — this app shares that cap with whatever else you have there.

## Deployment (Vercel + Supabase)

1. **Supabase**: create a project (or reuse one), then run `npm run db:init` locally against its `DATABASE_URL` to apply the schema — or just let the app apply it on first request after deploying.
2. **Vercel**: import this GitHub repo as a new project. Framework preset auto-detects as Next.js.
3. Set these environment variables in Vercel (Project Settings → Environment Variables), for the Production environment:
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL`
   - `BASIC_AUTH_USER`
   - `BASIC_AUTH_PASSWORD`
4. Deploy. Every push to the connected branch redeploys automatically.
5. Open the `*.vercel.app` URL Vercel gives you, enter the Basic Auth credentials once (your browser/phone remembers them), and play.
6. On your iPhone: open that URL in Safari, tap Share → **Add to Home Screen**. Because it's a real HTTPS URL (not a LAN address), this works from anywhere — home Wi-Fi, cell data, a friend's house.

### Execution time limit

A DM turn with several tool calls has measured up to ~55s locally. Vercel's Hobby plan caps a serverless function at 60s (`maxDuration` in `app/api/turn/route.ts` is set to that max). If a turn ever times out, the fix is trimming `MAX_TOOL_ITERATIONS` in `lib/config.ts`, not raising `maxDuration` past what your plan allows.

## Architecture

### Stack
- **Next.js 14 (App Router, TypeScript)** on Vercel
- **Supabase (Postgres)** via the `postgres` npm package — hand-written SQL with typed async wrapper functions (no ORM)
- **Tailwind CSS** for styling
- **`@anthropic-ai/sdk`** (Anthropic's official SDK) for all Claude API calls
- **HTTP Basic Auth** (`middleware.ts`) gating every route when `BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD` are set

### How a turn works

The whole game loop lives behind one API route: `POST /api/turn`.

1. If the campaign's narrative log has accumulated enough unsummarized turns, a rolling-summary compression step runs first (`lib/dm/summarize.ts`) — see "Context management" below.
2. The player's input is saved to `narrative_log` and the turn counter is incremented.
3. A system prompt (`lib/dm/systemPrompt.ts`) encodes the full DM persona and rules — open-ended sandbox pacing (no forced climax), "rule of cool outside combat / tactical grid combat," dice-rolling-via-tool-call, character creation path detection, solo encounter scaling, dark/gritty tone, the soft-fail defeat protocol, and world-consistency instructions. It embeds an original dark-fantasy setting (`lib/dm/worldPrimer.ts`, "The Hollow Reach") as the default backdrop.
4. The prompt context (`lib/dm/context.ts`) is built from the campaign's rolling summary (if any) plus any not-yet-summarized narrative log rows, as Claude `messages` turns, plus the new player input.
5. The app calls Claude with the full tool list and loops: whenever Claude requests a tool call, the app executes it directly against Postgres (`lib/tools/execute.ts`) and feeds the result back as a `tool_result` block, up to `MAX_TOOL_ITERATIONS` rounds per turn. Once Claude replies with `stop_reason !== "tool_use"`, that's the response returned to the player.
6. The DM's reply is saved to `narrative_log`. One sentinel tag the model can append (`lib/dm/tags.ts`), stripped before display:
   - `[DEFEAT]` — the character was just narratively defeated (0 HP, failed death saves) and the DM narrated a soft-fail setback instead of death. The frontend shows a brief "you were defeated — but you survived" beat, then play continues normally.

### Context management: rolling summary

An open-ended campaign's narrative log grows indefinitely, unlike a bounded oneshot's. Once more than `SUMMARY_TRIGGER_ROWS` (see `lib/config.ts`) unsummarized `narrative_log` rows have piled up, `summarizeIfNeeded` folds all but the most recent `KEEP_RAW_ROWS_AFTER_SUMMARY` of them into a single rolling summary via a cheap model call (`campaign_summary` table, one row per campaign, tracking `through_row_id`). Every turn, `lib/dm/context.ts` sends the current summary plus any rows newer than `through_row_id` — so context sent to the main DM model stays roughly bounded no matter how long the campaign runs, while the most recent stretch of play is always sent verbatim for continuity.

### Tools (Claude tool-use format)

Schemas are authored in `lib/tools/definitions.ts` as plain JSON Schema (Claude's `input_schema` is JSON Schema directly, so unlike some other providers there's no format-conversion step); executed in `lib/tools/execute.ts` (this layer only cares about plain JS values, not which model called it):

- `create_character` — creates the character sheet once (handles all three creation paths: guided, bring-your-own, concept-to-sheet)
- `get_character_sheet` / `update_character` — read/patch the full sheet (stats, HP/AC, conditions, spell slots, death saves, XP/level, etc.)
- `add_inventory_item` / `remove_inventory_item`
- `get_quest_log` / `update_quest`
- `log_world_fact` / `search_world_facts` — the world-consistency memory (plain ILIKE search over Postgres), scoped to this campaign and meant to persist across its whole lifetime (not just one session)
- `manage_companion` — add/update/dismiss a persistent NPC ally outside of combat
- `roll_dice` — server-side PRNG, routed through a tool call so every roll is logged to `roll_log` and auditable, rather than just narrated
- `start_combat` / `update_combat_state` / `end_combat` — initiative order, HP/conditions, whose turn it is, grid position (`x`/`y` in 5-ft squares), and terrain markers for every combatant on a tactical battle map

`spell_slots` — a `{"1": {"max": 2, "current": 1}}`-shaped map — is declared as a JSON-encoded **string** parameter and normalized back into a stored JSON string on the way in (`lib/tools/execute.ts`'s `normalizeJsonStringField`), since a couple of schema fields need a freeform-object shape that's simplest to pass through as a JSON string.

Routing dice rolls and state changes through tools (instead of a single JSON blob passed back and forth) means the app always has ground-truth state in Postgres, and the UI panels are just reads against that state after each turn.

### Database schema

All tables key off `campaign_id`. Each **campaign is one row in `campaigns`** — starting a new campaign (`POST /api/session/new`) just inserts a fresh row, which automatically becomes "current" (the app always shows the most recently created campaign; older campaigns stay in the database but aren't surfaced in the UI yet — see "Out of scope"). See `lib/db/schema.sql` for exact columns. Summary:

- `campaigns` — one row per campaign; status (`character_creation` / `active`), current turn number, optional per-campaign model override
- `characters` — full 5e sheet: six ability scores, proficiency bonus, AC, HP (current/max/temp), hit dice, death saves, spell slots (JSON), conditions (JSON), class/race/background/level/XP
- `inventory_items` — per-character, with equipped state
- `quests` — active/completed/failed/abandoned plot threads (a long campaign can have several active at once)
- `world_facts` — NPCs, locations, factions, lore established over the campaign's lifetime, searchable by keyword
- `narrative_log` — every player input and DM response, with turn numbers and timestamps
- `campaign_summary` — one row per campaign: the current rolling summary text and the narrative_log row id it's caught up through (see "Context management" above)
- `combat_encounters` / `combat_participants` — initiative order, per-combatant HP/AC/conditions, grid position (`x`/`y`), terrain markers, and the encounter's `grid_width`/`grid_height`
- `companions` — persistent NPC allies outside of combat
- `roll_log` — full dice audit trail (expression, breakdown, total, purpose)

Booleans are stored as `INTEGER` 0/1 and timestamps as `TEXT`, matching the original SQLite-era convention 1:1 — kept that way across the Postgres migration so every TypeScript type and frontend truthiness check stayed unchanged.

### UI

Dashboard layout (`app/page.tsx`), not a chat window — all panels are visible at once:

- **Header**: campaign name, nav tabs (Story / Journal / Atlas / Settings), status badge, level-up prompt when eligible
- **Center**: narrative panel (scrolling story + input box), with a tactical combat view that appears above it whenever an encounter is active — initiative order/HP/conditions on the left, a visual grid map with positioned tokens (`components/CombatGrid.tsx`) on the right
- **Left**: persistent character sheet (HP bar, AC, all six abilities with modifiers, skills, saves, attacks, spells, conditions, inventory)
- **Right**: quest log, companion roster, and a collapsible/filterable roll history
- **Journal tab**: the rolling summary plus a full searchable transcript
- **Atlas tab**: world facts organized by category, searchable, with tag-based cross-linking
- **Settings tab**: campaign rename, per-campaign model picker, manual summary refresh, new-campaign action
- **Defeat beat**: when the DM flags `[DEFEAT]`, the narrative panel shows a brief "you were defeated — but you survived" banner; play continues immediately afterward, no separate decision screen

Character creation has no separate wizard screen — it happens in the same narrative panel, because the DM is instructed to detect and run whichever of the three creation paths (guided / bring-your-own / concept-to-sheet) the player's first message implies, then call `create_character` once it has a complete sheet.

## Project structure

```
app/
  page.tsx                    dashboard shell (client component): nav tabs, level-up flow, keyboard shortcuts
  manifest.ts                 PWA manifest (home-screen install)
  api/turn/route.ts           main DM turn loop (Claude tool use)
  api/state/route.ts          current campaign/character/quest/combat/companion state
  api/narrative/route.ts      full narrative log (for page load / resume / Journal tab)
  api/session/new/route.ts    start a new campaign (fresh campaign row)
  api/campaign/route.ts       PATCH campaign name / per-campaign model override
  api/summarize/route.ts      force a rolling-summary refresh on demand (Settings tab)
middleware.ts                 HTTP Basic Auth gate for the public deployment
components/
  CharacterSheet.tsx           full sheet: abilities/saves, skills, attacks, spells, inventory (collapsible sections)
  QuestLog.tsx                 active/resolved quest threads
  CompanionRoster.tsx          persistent ally roster (outside combat)
  RollHistory.tsx              collapsible, filterable dice log
  CombatView.tsx / CombatGrid.tsx   tactical grid: click-to-inspect tokens, terrain markers, movement-range highlight
  NarrativePanel.tsx           story chat + "story so far" recap card + defeat banner
  JournalPanel.tsx             rolling summary + full searchable transcript
  WorldAtlas.tsx                world facts by category, searchable, tag-based cross-linking
  SettingsPanel.tsx            campaign rename, model picker, force-summarize, new campaign
  LevelUpModal.tsx              guided level-up trigger + before/after diff banner
lib/
  config.ts                   model constants + tunables
  dnd.ts                       shared 5e reference data (ability mods, skills, XP thresholds)
  dice.ts                      dice expression parser + PRNG
  db/                           schema.sql (Postgres), connection + migration, typed async queries
  dm/                           system prompt, world primer, context builder, rolling summarizer, tags
  tools/                        tool definitions (schema) + execution (Postgres)
types/                         shared TypeScript types
scripts/init-db.js             standalone `npm run db:init` (applies schema.sql to DATABASE_URL)
public/                        PWA icons (apple-touch-icon.png, icon-192.png, icon-512.png)
```

## Out of scope (by design)

No multi-user accounts, no saved-campaign browser/list UI beyond "current campaign" (schema supports it — every campaign is already its own row — a picker is a UI-only addition later), no image generation beyond the built-in tactical grid.
