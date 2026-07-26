// Sentinel tags the DM appends to the very end of a narrative response to
// signal a distinct app-level state. Shared between the system prompt
// (which instructs the model when to use them) and the turn route (which
// detects and strips them). Keep these in sync.

/** A killing blow or otherwise lethal outcome is imminent -- the app should
 * pause for an in-fiction "how do you want to handle this" decision instead
 * of silently applying one rule. */
export const DEATH_TAG = "[AWAITING_DEATH_DECISION]";

/** The oneshot has reached its ending -- goal achieved, character died and
 * the player accepted it, or another natural stopping point. The app should
 * stop accepting further input and show a clear "session complete" state. */
export const SESSION_COMPLETE_TAG = "[SESSION_COMPLETE]";
