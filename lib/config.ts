// Central config so model choice / limits live in one place.

// Main DM model — used for every narrative turn. Defaults to Haiku for
// cost: a real character-creation turn (create_character + several
// inventory/world-fact tool calls) measured ~$0.16 on Sonnet. Haiku is
// meaningfully cheaper and faster at some cost to narrative depth/
// consistency. Override per-campaign from the Settings tab (stored on
// campaigns.model) if you want Sonnet's quality for a specific campaign.
export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

// Cheaper/faster model used only for the periodic rolling-summary
// compression step (see lib/dm/summarize.ts) -- that's a much simpler
// condense-this-text task and doesn't need the main model.
export const SUMMARY_MODEL = "claude-haiku-4-5-20251001";

// This is an open-ended campaign, not a bounded oneshot, so the narrative
// log can grow indefinitely. Once more than this many *unsummarized*
// narrative_log rows have piled up (beyond the always-kept-raw window
// below), older rows get folded into the rolling summary. See
// lib/dm/summarize.ts.
export const SUMMARY_TRIGGER_ROWS = 60;

// However many of the most recent rows are always sent verbatim regardless
// of summarization, so recent continuity/detail is never lossy-compressed.
export const KEEP_RAW_ROWS_AFTER_SUMMARY = 24;

// Max tokens for a single DM turn response.
export const MAX_OUTPUT_TOKENS = 4096;

// Max tokens for a summarization call.
export const SUMMARY_MAX_OUTPUT_TOKENS = 1024;

// How many world facts to pull into context per turn via FTS5 search.
export const WORLD_FACT_SEARCH_LIMIT = 8;

// Safety cap on tool-call round-trips within a single turn.
export const MAX_TOOL_ITERATIONS = 10;
