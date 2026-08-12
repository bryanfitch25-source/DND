import * as q from "../db/queries";
import type { TurnResponse } from "@/types";
import { getPrimaryCampaignId } from "../db";

export async function getFullState(narrative = ""): Promise<TurnResponse> {
  const campaignId = await getPrimaryCampaignId();
  const campaign = await q.getCampaign(campaignId);
  const character = await q.getCharacterByCampaign(campaignId);
  const inventory = character ? await q.getInventory(character.id) : [];
  const quests = await q.getQuests(campaignId);
  const worldFacts = await q.getAllWorldFacts(campaignId);
  const activeEncounter = await q.getActiveEncounter(campaignId);
  const combatants = activeEncounter ? await q.getCombatants(activeEncounter.id) : [];
  const companions = await q.getCompanions(campaignId);
  const recentRolls = await q.getRecentRolls(campaignId, 30);
  const { summary } = await q.getCampaignSummary(campaignId);

  return {
    narrative,
    defeatOccurred: false,
    campaign,
    character,
    inventory,
    quests,
    worldFacts,
    activeEncounter,
    combatants,
    companions,
    recentRolls,
    summary,
  };
}
