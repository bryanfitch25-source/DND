// Server-side dice PRNG. Parses simple D&D dice expressions like "1d20+3",
// "2d6", "4d6kh3" (keep highest 3), "1d8-1".

interface DiceParseResult {
  count: number;
  sides: number;
  modifier: number;
  keepHighest?: number;
  keepLowest?: number;
}

function parseExpression(expr: string): DiceParseResult {
  const cleaned = expr.replace(/\s+/g, "").toLowerCase();
  const match = cleaned.match(/^(\d*)d(\d+)(kh(\d+)|kl(\d+))?([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice expression: ${expr}`);
  }
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const keepHighest = match[4] ? parseInt(match[4], 10) : undefined;
  const keepLowest = match[5] ? parseInt(match[5], 10) : undefined;
  const modifier = match[6] ? parseInt(match[6], 10) : 0;

  if (count < 1 || count > 100) throw new Error("Dice count out of range (1-100)");
  if (sides < 2 || sides > 1000) throw new Error("Dice sides out of range (2-1000)");

  return { count, sides, modifier, keepHighest, keepLowest };
}

export interface RollResult {
  expression: string;
  rolls: number[];
  keptRolls: number[];
  modifier: number;
  total: number;
  breakdown: string;
}

export function rollDice(expression: string): RollResult {
  const parsed = parseExpression(expression);
  const rolls: number[] = [];
  for (let i = 0; i < parsed.count; i++) {
    rolls.push(1 + Math.floor(Math.random() * parsed.sides));
  }

  let kept = [...rolls];
  if (parsed.keepHighest) {
    kept = [...rolls].sort((a, b) => b - a).slice(0, parsed.keepHighest);
  } else if (parsed.keepLowest) {
    kept = [...rolls].sort((a, b) => a - b).slice(0, parsed.keepLowest);
  }

  const sum = kept.reduce((a, b) => a + b, 0);
  const total = sum + parsed.modifier;

  const rollsStr = rolls.length > 1 ? `[${rolls.join(", ")}]` : `${rolls[0]}`;
  const keptStr =
    kept.length !== rolls.length ? ` keep [${kept.join(", ")}]` : "";
  const modStr = parsed.modifier !== 0 ? ` ${parsed.modifier > 0 ? "+" : "-"} ${Math.abs(parsed.modifier)}` : "";
  const breakdown = `${rollsStr}${keptStr}${modStr} = ${total}`;

  return {
    expression,
    rolls,
    keptRolls: kept,
    modifier: parsed.modifier,
    total,
    breakdown,
  };
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
