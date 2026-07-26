# SoloDM

A personal, single-user web app where Google's Gemini acts as a Dungeon Master running an improvised D&D 5e (2014 core rules) solo **oneshot**. Built with Next.js, SQLite, and the Gemini API (free tier).

A oneshot is a single sitting, roughly 2-4 hours of play, with a clear beginning, middle, climax, and resolution — not an indefinite sandbox campaign. Start a session, play it to an ending, and start a new one whenever you want a fresh story.

This is a local-only project for one player. No accounts, no auth, no deployment.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the env example and add your Gemini API key:
   ```
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` and set `GEMINI_API_KEY=...`. Get a free key from [Google AI Studio](https://aistudio.google.com/apikey) — no billing account required for the free tier.
3. (Optional) Initialize the database explicitly — this also happens automatically on first request:
   ```
   npm run db:init
   ```
4. Start the dev server:
   ```
   npm run dev
   ```
5. Open http://localhost:3000

The SQLite database file is created at `data/solodm.db` on first run (auto-created, WAL mode, foreign keys on). Every oneshot is its own row in the `campaigns` table (see Database schema below), so you don't need to delete the file between sessions — just click **Start a New Oneshot** once the current one ends, or at any time from a fresh page load. Delete `data/solodm.db` (and its `-wal`/`-shm` siblings) only if you want to wipe everything and start over from zero.

### A note on the free tier

Google AI Studio API keys are free to create and use against Gemini's free tier, which is rate-limited rather than paid — the tradeoff for $0 is requests-per-minute (and per-day) caps rather than a credit balance. `gemini-flash-latest` (this project's default model, in `lib/config.ts`) is Google's evergreen alias for its current flash-tier model, which has one of the more generous free-tier allowances, but every DM turn can burn several requests in a row (the tool-call loop calls the model once per round of tool use, not once per turn), so:

- Playing at a normal, human pace (a few actions a minute) should stay comfortably under the per-minute limit.
- **There's also a per-day cap, and on a brand-new key it can be tight.** During testing, the free tier returned `429 RESOURCE_EXHAUSTED` with `GenerateRequestsPerDayPerProjectPerModel-FreeTier, limit: 20` for the model `gemini-flash-latest` happened to resolve to that day — i.e. only 20 `generateContent` calls per **day**, for that one model, on that one key. Because each DM turn can burn several calls in a row (one per round of tool use, not one per turn), a single oneshot session can burn through most or all of a day's quota by itself on a freshly created key, and a second session the same day may not be possible until the quota resets. The error response includes a `retryDelay` field, but on this quota type it did not reflect a true short-term reset — retrying after the suggested delay (and again after several minutes) still failed. Treat a `GenerateRequestsPerDayPerProjectPerModel-FreeTier` 429 as "come back later" (hours, not seconds), not as a wait-and-retry case. This is a hard external limit set by Google, not a bug in the app.
- If you hit this, your options are: wait for the daily quota to reset, or switch `GEMINI_MODEL` in `lib/config.ts` to a different model, which draws from its own separate quota pool (e.g. `gemini-2.0-flash`, `gemini-2.5-flash-lite` — check `ai.models.list()` for what your key currently has access to, since availability varies by key).
- Free-tier limits and exact numbers are Google's to set, differ per model, and can change without notice (quotas also appear to start more restrictive on freshly created keys/projects and loosen over time) — check your key's actual current limits at [ai.dev/rate-limit](https://ai.dev/rate-limit) or the [Gemini API rate limits page](https://ai.google.dev/gemini-api/docs/rate-limits) rather than trusting any specific number written here.
- If you outgrow the free tier, switching to a paid Gemini key (or another model) is a one-line change to `GEMINI_MODEL` in `lib/config.ts` plus billing setup on Google's side — no app code changes needed.
- **Why an alias instead of a pinned version:** during development, the pinned model ID `gemini-2.5-flash` returned `404 "This model ... is no longer available to new users"` for a freshly created API key, even though it still appeared in the models list — Google gates some model versions to existing users only. `gemini-flash-latest` is confirmed working and is the safer default for that reason; pin to a specific dated model instead if you want fully reproducible behavior across Google's model updates (check `ai.models.list()` for what your key currently has access to).
- **Why a oneshot structure fits the free tier well:** a single 2-4 hour session with a bounded turn count keeps both the per-session request volume and the context size predictable, which plays nicely with rate limits and avoids needing any context-compression machinery (see below).

## Architecture

### Stack
- **Next.js 14 (App Router, TypeScript)** — single Node process, `npm run dev`
- **SQLite via Node's built-in `node:sqlite` module** — hand-written SQL with typed wrapper functions (no ORM, no native compiled dependency)
- **Tailwind CSS** for styling
- **`@google/genai`** (Google's official GenAI SDK) for all Gemini API calls

The model used is a single constant, `GEMINI_MODEL` in `lib/config.ts` (currently `gemini-flash-latest`) — change it in one place if you want to swap models.

### How a turn works

The whole game loop lives behind one API route: `POST /api/turn`.

1. If the current session already reached its ending (`campaigns.status = 'completed'`), the route short-circuits with a "this session is over" message and doesn't call the model at all — no point spending free-tier quota on a turn that can't go anywhere.
2. Otherwise, the player's input is saved to `narrative_log` and the turn counter is incremented.
3. A system prompt (`lib/dm/systemPrompt.ts`) encodes the full DM persona and rules — the oneshot structure (hook early, build to a climax, land a definite resolution), "rule of cool outside combat / tactical precision in combat," dice-rolling-via-tool-call, streamlined character creation path detection, solo encounter scaling, dark/gritty tone, the death-decision protocol, the session-ending protocol, and world-consistency instructions scoped to this one session. It's passed to Gemini as `systemInstruction` (Gemini has no separate "system" message role in the conversation itself, unlike Anthropic's `system` param).
4. The prompt context (`lib/dm/context.ts`) is built from the session's full narrative log verbatim (a oneshot's whole transcript comfortably fits in context — see below) plus the new player input, as Gemini `Content` turns (`role: "user"` / `role: "model"`).
5. The app calls Gemini with the full function-declaration list and loops: whenever Gemini requests a function call, the app executes it directly against SQLite (`lib/tools/execute.ts`) and feeds the result back as a `functionResponse` part, up to 10 tool-call rounds per turn. Once Gemini replies with plain narrative text and no function calls, that's the response returned to the player.
6. The DM's reply is saved to `narrative_log`. Two sentinel tags the model can append (`lib/dm/tags.ts`), stripped before display:
   - `[AWAITING_DEATH_DECISION]` — a lethal outcome is imminent; the frontend shows a distinct "how do you want to handle this" prompt instead of just continuing.
   - `[SESSION_COMPLETE]` — the oneshot has reached a genuine resolution; the app marks the session `completed` and the frontend shows an ending state ("THE END") with a **Start a New Oneshot** button instead of an input box.

### No rolling summarization

The original design (before the oneshot rework) kept a running AI-generated "story so far" summary and periodically compressed older turns, because an open-ended sandbox campaign's narrative log could grow indefinitely. A oneshot doesn't have that problem — a full 2-4 hour session's transcript is a few dozen turns, comfortably within Gemini's context window — so that machinery was removed entirely: no `campaign_summary` table, no periodic compression call, no manual "summarize" endpoint. `lib/dm/context.ts` just sends the full session log every turn, with `MAX_NARRATIVE_ENTRIES_IN_CONTEXT` in `lib/config.ts` as a defensive cap (not an active compression step) in case a single session runs unusually long.

### Tools (Gemini function-calling format)

Schemas are authored once in `lib/tools/definitions.ts` in plain JSON-Schema shape and converted to Gemini's `FunctionDeclaration` format (uppercase `Type` enum, e.g. `Type.OBJECT`) at module load; executed in `lib/tools/execute.ts` (this layer only cares about plain JS values, not which model called it):

- `create_character` — creates the character sheet once (handles all three creation paths: guided, bring-your-own, concept-to-sheet — guided creation is prompted to default to a couple of quick pre-built archetypes rather than a full manual build, to get into play faster)
- `get_character_sheet` / `update_character` — read/patch the full sheet (stats, HP/AC, conditions, spell slots, death saves, etc.)
- `add_inventory_item` / `remove_inventory_item`
- `get_quest_log` / `update_quest`
- `log_world_fact` / `search_world_facts` — the world-consistency memory, backed by SQLite FTS5, scoped to keeping this one session's NPCs/locations/facts consistent (not an ongoing persistent world)
- `roll_dice` — server-side PRNG, routed through a tool call so every roll is logged to `roll_log` and auditable, rather than just narrated
- `start_combat` / `update_combat_state` / `end_combat` — initiative order, HP/conditions/position, whose turn it is

One Gemini-specific wrinkle: its function-calling schema has no "freeform object" type (no `additionalProperties`), so `spell_slots` — a `{"1": {"max": 2, "current": 1}}`-shaped map — is declared to the model as a JSON-encoded **string** parameter instead of a nested object, and normalized back into a stored JSON string on the way in (`lib/tools/execute.ts`'s `normalizeJsonStringField`). Everywhere else the schemas are a direct, mechanical translation.

Routing dice rolls and state changes through tools (instead of a single JSON blob passed back and forth) means the app always has ground-truth state in SQLite, and the UI panels are just reads against that state after each turn.

### Database schema

All tables key off `campaign_id`. Each **oneshot is one row in `campaigns`** — starting a new session (`POST /api/session/new`) just inserts a fresh row, which automatically becomes "current" (the app always shows the most recently created campaign). See `lib/db/schema.sql` for exact columns. Summary:

- `campaigns` — one row per oneshot; status (`character_creation` / `active` / `completed`), current turn number
- `characters` — full 5e sheet: six ability scores, proficiency bonus, AC, HP (current/max/temp), hit dice, death saves, spell slots (JSON), conditions (JSON), class/race/background/level/XP
- `inventory_items` — per-character, with equipped state
- `quests` — active/completed/failed/abandoned plot threads (usually just one main thread for a oneshot)
- `world_facts` + `world_facts_fts` (FTS5 virtual table, kept in sync via triggers) — NPCs, locations, factions, lore established during this session, searchable by keyword
- `narrative_log` — every player input and DM response, with turn numbers and timestamps
- `combat_encounters` / `combat_participants` — initiative order, per-combatant HP/AC/conditions/position
- `roll_log` — full dice audit trail (expression, breakdown, total, purpose)

### UI

Dashboard layout (`app/page.tsx`), not a chat window — all panels are visible at once:

- **Header**: session status badge (Building Character / Session Active / Session Complete)
- **Center**: narrative panel (scrolling story + input box), with a distinct combat-mode banner (initiative order, HP bars, whose turn, conditions, tactical position) that appears above it whenever an encounter is active
- **Left**: persistent character sheet (HP bar, AC, all six abilities with modifiers, conditions, spell slots, inventory)
- **Right**: quest/plot log — active and resolved threads, plus known NPCs/factions/locations pulled from logged world facts
- **Death decisions**: when the DM flags `[AWAITING_DEATH_DECISION]`, the narrative panel swaps in a small set of in-fiction choice buttons instead of silently applying a rule
- **Session ending**: when the DM flags `[SESSION_COMPLETE]`, the narrative panel shows a "THE END" state and replaces the input box with a **Start a New Oneshot** button (`POST /api/session/new`), which starts a fresh campaign row and reloads the dashboard

Character creation has no separate wizard screen — it happens in the same narrative panel, because the DM is instructed to detect and run whichever of the three creation paths (guided / bring-your-own / concept-to-sheet) the player's first message implies, then call `create_character` once it has a complete sheet.

## Project structure

```
app/
  page.tsx                 dashboard (client component)
  api/turn/route.ts        main DM turn loop (Gemini function calling)
  api/state/route.ts        current session/character/quest/combat state
  api/narrative/route.ts    full narrative log (for page load / resume)
  api/session/new/route.ts  start a new oneshot (fresh campaign row)
components/                 CharacterSheet, QuestLog, CombatView, NarrativePanel
lib/
  config.ts                 model constant + tunables
  dice.ts                   dice expression parser + PRNG
  db/                        schema.sql, connection + migration, typed queries (node:sqlite)
  dm/                        system prompt, context builder, ending tags, state assembly
  tools/                     tool definitions (schema) + execution (SQLite)
types/                       shared TypeScript types
scripts/init-db.js           standalone `npm run db:init`
data/solodm.db                SQLite file (created on first run, gitignored)
```

## Out of scope (by design)

No multi-user accounts, no public deployment/auth, no saved-session browser/list UI beyond "current session" (schema supports it — every oneshot is already its own row — a picker is a UI-only addition later), no maps or image generation.
