import * as q from "../db/queries";
import type { TurnResponse } from "@/types";
import { getPrimaryCampaignId } from "../db";

export function getFullState(narrative = ""): TurnResponse {
  const campaignId = getPrimaryCampaignId();
  const campaign = q.getCampaign(campaignId);
  const character = q.getCharacterByCampaign(campaignId);
  const inventory = character ? q.getInventory(character.id) : [];
  const quests = q.getQuests(campaignId);
  const worldFacts = q.getAllWorldFacts(campaignId);
  const activeEncounter = q.getActiveEncounter(campaignId);
  const combatants = activeEncounter ? q.getCombatants(activeEncounter.id) : [];
  const recentRolls = q.getRecentRolls(campaignId, 15);

  return {
    narrative,
    awaitingDeathDecision: false,
    sessionComplete: campaign.status === "completed",
    campaign,
    character,
    inventory,
    quests,
    worldFacts,
    activeEncounter,
    combatants,
    recentRolls,
  };
}
