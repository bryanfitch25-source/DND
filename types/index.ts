// One row per open-ended campaign.
export interface Campaign {
  id: number;
  name: string;
  status: "character_creation" | "active";
  current_turn_number: number;
  setting_notes: string;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: number;
  campaign_id: number;
  name: string;
  race: string;
  class: string;
  background: string;
  alignment: string;
  level: number;
  xp: number;
  proficiency_bonus: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  ac: number;
  hp_max: number;
  hp_current: number;
  hp_temp: number;
  hit_dice_type: string;
  hit_dice_total: number;
  hit_dice_current: number;
  speed: number;
  death_save_successes: number;
  death_save_failures: number;
  is_dead: number;
  saving_throw_proficiencies: string; // JSON array
  skill_proficiencies: string; // JSON array
  conditions: string; // JSON array
  spell_slots: string; // JSON object
  known_spells: string; // JSON array
  features: string; // JSON array
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  campaign_id: number;
  character_id: number;
  name: string;
  description: string;
  category: string;
  quantity: number;
  equipped: number;
  weight: number;
  created_at: string;
}

export interface Quest {
  id: number;
  campaign_id: number;
  title: string;
  description: string;
  status: "active" | "completed" | "failed" | "abandoned";
  category: "main" | "side" | "personal";
  created_at: string;
  updated_at: string;
}

export interface WorldFact {
  id: number;
  campaign_id: number;
  category: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
}

export interface NarrativeLogEntry {
  id: number;
  campaign_id: number;
  turn_number: number;
  role: "player" | "dm";
  content: string;
  created_at: string;
}

export interface CombatEncounter {
  id: number;
  campaign_id: number;
  status: "active" | "ended";
  round_number: number;
  current_turn_index: number;
  description: string;
  grid_width: number;
  grid_height: number;
  terrain: string; // JSON array of {x,y,type}
  created_at: string;
  ended_at: string | null;
}

export interface TerrainMarker {
  x: number;
  y: number;
  type: "wall" | "cover" | "difficult";
}

export interface Companion {
  id: number;
  campaign_id: number;
  name: string;
  description: string;
  hp_current: number;
  hp_max: number;
  ac: number;
  notes: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CombatParticipant {
  id: number;
  encounter_id: number;
  name: string;
  is_pc: number;
  is_companion: number;
  initiative: number;
  turn_order: number;
  hp_current: number;
  hp_max: number;
  ac: number;
  conditions: string;
  x: number;
  y: number;
  notes: string;
  is_defeated: number;
}

export interface RollLogEntry {
  id: number;
  campaign_id: number;
  turn_number: number;
  expression: string;
  breakdown: string;
  total: number;
  purpose: string;
  created_at: string;
}

// API response shape for the /api/turn endpoint.
export interface TurnResponse {
  narrative: string;
  /** True when this turn's beat was a defeat/setback (character dropped to
   * 0 HP and failed death saves) -- this is a soft-fail game, so the story
   * continues; the frontend just shows a brief "defeated" banner. */
  defeatOccurred: boolean;
  campaign: Campaign;
  character: Character | null;
  inventory: InventoryItem[];
  quests: Quest[];
  worldFacts: WorldFact[];
  activeEncounter: CombatEncounter | null;
  combatants: CombatParticipant[];
  companions: Companion[];
  recentRolls: RollLogEntry[];
  /** Rolling campaign summary text, if the campaign has run long enough to
   * have one yet (see lib/dm/summarize.ts). Empty string if none. */
  summary: string;
  error?: string;
}
