import { Type, type FunctionDeclaration, type Schema } from "@google/genai";

// Tool schemas are authored once in plain JSON-Schema shape (the same shape
// Anthropic's tool-use format uses) and converted below into Gemini's
// FunctionDeclaration format (Schema with uppercase Type enum values). This
// keeps the 12 tool definitions easy to read/maintain in one place while
// still producing exactly what the Gemini function-calling API expects.

interface PlainSchema {
  type: "object" | "array" | "string" | "integer" | "number" | "boolean";
  description?: string;
  properties?: Record<string, PlainSchema>;
  items?: PlainSchema;
  required?: string[];
  enum?: string[];
  default?: unknown;
}

interface PlainTool {
  name: string;
  description: string;
  input_schema: PlainSchema;
}

const TYPE_MAP: Record<PlainSchema["type"], Type> = {
  object: Type.OBJECT,
  array: Type.ARRAY,
  string: Type.STRING,
  integer: Type.INTEGER,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
};

function toGeminiSchema(schema: PlainSchema): Schema {
  const result: Schema = { type: TYPE_MAP[schema.type] };
  if (schema.description) result.description = schema.description;
  if (schema.enum) {
    result.enum = schema.enum;
    result.format = "enum";
  }
  if (schema.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      result.properties[key] = toGeminiSchema(value);
    }
  }
  if (schema.items) result.items = toGeminiSchema(schema.items);
  if (schema.required && schema.required.length > 0) result.required = schema.required;
  return result;
}

const toolSchemas: PlainTool[] = [
  {
    name: "create_character",
    description:
      "Create the initial character sheet once you have enough information, from any of the three creation paths (guided step-by-step, player-supplied finished build, or a vague concept you fleshed out into a full sheet). Call this exactly once per campaign. After this, use update_character for further changes.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        race: { type: "string" },
        class: { type: "string" },
        background: { type: "string" },
        alignment: { type: "string" },
        level: { type: "integer" },
        proficiency_bonus: { type: "integer" },
        str: { type: "integer" },
        dex: { type: "integer" },
        con: { type: "integer" },
        int: { type: "integer" },
        wis: { type: "integer" },
        cha: { type: "integer" },
        ac: { type: "integer" },
        hp_max: { type: "integer" },
        hp_current: { type: "integer" },
        hit_dice_type: { type: "string", description: "e.g. 'd8'" },
        hit_dice_total: { type: "integer" },
        speed: { type: "integer" },
        saving_throw_proficiencies: { type: "array", items: { type: "string" } },
        skill_proficiencies: { type: "array", items: { type: "string" } },
        spell_slots: {
          type: "string",
          description:
            "JSON-encoded object mapping spell level to slots, e.g. '{\"1\":{\"max\":2,\"current\":2}}'. Pass '{}' if the class has none.",
        },
        known_spells: { type: "array", items: { type: "string" } },
        features: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
        starting_inventory: {
          type: "array",
          description: "Starting equipment to add to inventory immediately",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              quantity: { type: "integer" },
              equipped: { type: "boolean" },
            },
            required: ["name"],
          },
        },
      },
      required: ["name", "race", "class", "str", "dex", "con", "int", "wis", "cha", "ac", "hp_max"],
    },
  },
  {
    name: "get_character_sheet",
    description:
      "Read the full current character sheet: ability scores, HP/AC, conditions, spell slots, inventory summary, level, class, race, background. Call this whenever you need to check exact numbers before making a ruling.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "update_character",
    description:
      "Patch the character sheet with a partial update. Only include fields that changed. Use for HP changes, AC changes, condition changes, spell slot use, leveling up, ability score changes, death saves, etc. conditions/known_spells/features are full-replacement arrays; spell_slots is a full-replacement JSON-encoded object like '{\"1\":{\"max\":2,\"current\":1}}'.",
    input_schema: {
      type: "object",
      properties: {
        hp_current: { type: "integer", description: "Current hit points" },
        hp_max: { type: "integer", description: "Maximum hit points" },
        hp_temp: { type: "integer", description: "Temporary hit points" },
        ac: { type: "integer", description: "Armor class" },
        level: { type: "integer" },
        xp: { type: "integer" },
        proficiency_bonus: { type: "integer" },
        str: { type: "integer" },
        dex: { type: "integer" },
        con: { type: "integer" },
        int: { type: "integer" },
        wis: { type: "integer" },
        cha: { type: "integer" },
        speed: { type: "integer" },
        hit_dice_current: { type: "integer" },
        hit_dice_total: { type: "integer" },
        death_save_successes: { type: "integer", description: "0-3" },
        death_save_failures: { type: "integer", description: "0-3" },
        is_dead: { type: "boolean" },
        conditions: {
          type: "array",
          items: { type: "string" },
          description: "Full replacement list of current conditions, e.g. [\"poisoned\", \"prone\"]",
        },
        spell_slots: {
          type: "string",
          description:
            "Full replacement JSON-encoded object of spell slots by level, e.g. '{\"1\":{\"max\":2,\"current\":1}}'",
        },
        known_spells: {
          type: "array",
          items: { type: "string" },
        },
        features: {
          type: "array",
          items: { type: "string" },
        },
        name: { type: "string" },
        race: { type: "string" },
        class: { type: "string" },
        background: { type: "string" },
        alignment: { type: "string" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "add_inventory_item",
    description:
      "Add an item to the character's inventory (or increase quantity of an existing stack you track separately).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        category: {
          type: "string",
          enum: ["weapon", "armor", "gear", "consumable", "treasure", "other"],
        },
        quantity: { type: "integer" },
        equipped: { type: "boolean" },
        weight: { type: "number" },
      },
      required: ["name"],
    },
  },
  {
    name: "remove_inventory_item",
    description: "Remove an item (or reduce its quantity) from the character's inventory by item id.",
    input_schema: {
      type: "object",
      properties: {
        item_id: { type: "integer", description: "The inventory item's id from get_character_sheet" },
        quantity: { type: "integer", description: "Quantity to remove; omit to remove the whole stack" },
      },
      required: ["item_id"],
    },
  },
  {
    name: "get_quest_log",
    description: "Read all quest threads (active, completed, failed, abandoned).",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "update_quest",
    description: "Add a new quest thread or update an existing one's status/description. Omit id to create a new quest.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Existing quest id to update; omit to create a new quest" },
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: ["active", "completed", "failed", "abandoned"] },
        category: { type: "string", enum: ["main", "side", "personal"] },
      },
      required: ["title"],
    },
  },
  {
    name: "log_world_fact",
    description:
      "Record an established world fact (NPC, location, faction, lore, item, event) so it can be searched and honored consistently later. Call this every time you introduce something new and durable to the world.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["npc", "location", "faction", "lore", "item", "event"] },
        title: { type: "string", description: "Short name, e.g. 'Kaelen Vosk' or 'The Sunken Keep'" },
        content: { type: "string", description: "The fact itself, written so it can be reused verbatim later" },
        tags: { type: "string", description: "Comma-separated search tags" },
      },
      required: ["category", "title", "content"],
    },
  },
  {
    name: "search_world_facts",
    description:
      "Keyword/tag search over previously logged world facts. ALWAYS search before introducing an NPC, location, or faction name that might already exist, to avoid contradicting established lore.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords to search for" },
      },
      required: ["query"],
    },
  },
  {
    name: "roll_dice",
    description:
      "Roll dice using standard D&D notation (e.g. '1d20+3', '2d6', '4d6kh3' for keep-highest-3, '1d8-1'). ALWAYS use this tool instead of narrating a roll yourself, so it is logged and auditable. Then narrate the result transparently, e.g. 'Stealth check: 14 + 3 = 17'.",
    input_schema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Dice expression, e.g. '1d20+5'" },
        purpose: { type: "string", description: "What the roll is for, e.g. 'Stealth check' or 'Longsword damage'" },
      },
      required: ["expression"],
    },
  },
  {
    name: "start_combat",
    description:
      "Initialize a combat encounter: roll/assign initiative order and register all participants (PC, optional companion, and enemies). Auto-scale enemy count/stats for solo play before calling this.",
    input_schema: {
      type: "object",
      properties: {
        description: { type: "string", description: "Short description of the encounter" },
        participants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              is_pc: { type: "boolean" },
              is_companion: { type: "boolean" },
              initiative: { type: "integer" },
              hp_current: { type: "integer" },
              hp_max: { type: "integer" },
              ac: { type: "integer" },
              position: { type: "string", description: "Tactical position/range note" },
              notes: { type: "string" },
            },
            required: ["name", "initiative", "hp_current", "hp_max", "ac"],
          },
        },
      },
      required: ["description", "participants"],
    },
  },
  {
    name: "update_combat_state",
    description:
      "Update the active encounter: advance round/turn, and/or update participant HP, conditions, position, or defeated status. Pass only the fields that changed. Use participant 'id' values from get_character_sheet's combat context or from the most recent start_combat/update_combat_state result.",
    input_schema: {
      type: "object",
      properties: {
        round_number: { type: "integer" },
        current_turn_index: { type: "integer", description: "Index into initiative order of whose turn it is" },
        participant_updates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              hp_current: { type: "integer" },
              hp_max: { type: "integer" },
              ac: { type: "integer" },
              conditions: { type: "array", items: { type: "string" } },
              position: { type: "string" },
              notes: { type: "string" },
              is_defeated: { type: "boolean" },
              initiative: { type: "integer" },
            },
            required: ["id"],
          },
        },
      },
    },
  },
  {
    name: "end_combat",
    description: "Tear down the active combat encounter once it's resolved (all enemies defeated/fled, or PC fled).",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];

export const toolDefinitions: FunctionDeclaration[] = toolSchemas.map((tool) => ({
  name: tool.name,
  description: tool.description,
  parameters: toGeminiSchema(tool.input_schema),
}));
