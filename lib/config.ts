// Central config so model choice / limits live in one place.

// Google Gemini free tier. "gemini-flash-latest" is an evergreen alias that
// Google points at its current-generation flash-tier model — the best
// balance of quality vs. free-tier rate limits for a text-heavy reasoning
// task like this DM loop. A pinned version string like "gemini-2.5-flash"
// can get cut off from new API keys once a newer generation ships (this
// happened during development of this app), so the alias is the safer
// default; pin to a specific dated model here instead if you want
// reproducible behavior across Google's model updates.
export const GEMINI_MODEL = "gemini-flash-latest";

// A oneshot is a single ~2-4 hour sitting, so its full narrative log
// comfortably fits in context -- no rolling summarization needed. This is a
// defensive cap only (guards against a single unusually long, combat-heavy
// session), not an active compression step. Each "turn" is ~2 log rows
// (player + DM), so 400 rows covers a very long oneshot with room to spare.
export const MAX_NARRATIVE_ENTRIES_IN_CONTEXT = 400;

// Max tokens for a single DM turn response.
export const MAX_OUTPUT_TOKENS = 4096;

// How many world facts to pull into context per turn via FTS5 search.
export const WORLD_FACT_SEARCH_LIMIT = 8;

// Safety cap on tool-call round-trips within a single turn.
export const MAX_TOOL_ITERATIONS = 10;

export const DB_PATH = process.env.SOLODM_DB_PATH || "data/solodm.db";
