// Sentinel tag the DM appends to the very end of a narrative response to
// signal a distinct app-level state. Shared between the system prompt
// (which instructs the model when to use it) and the turn route (which
// detects and strips it). Keep these in sync.

/** The player character was just reduced to 0 HP and failed their death
 * saves. This is a soft-fail campaign (see lib/dm/systemPrompt.ts): that
 * never means permanent death by default -- the DM narrates a setback
 * (captured, injured and dragged to safety, robbed and left for dead,
 * etc.) and the story continues. This tag just tells the app to show a
 * brief "defeated" beat in the UI. */
export const DEFEAT_TAG = "[DEFEAT]";
