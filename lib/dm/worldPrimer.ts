// Setting primer seeded into the DM's system prompt so it has a consistent
// world to run instead of a blank page. Swap this content out for a
// different custom setting any time -- same shape (premise, tone, factions,
// locations, NPCs, mechanics) and the DM will pick it up automatically.
// Leave it empty (WORLD_PRIMER = ``) and the DM will ask the player what
// kind of world they want instead of assuming one.

export const WORLD_PRIMER = `
# The Kaldmoor Reaches

A dark fantasy setting for solo D&D play.

## Premise

Forty years ago the Hollow King's wardstones failed, and the Grey Rot came up out of the earth. It doesn't kill outright -- it hollows. Crops wither grey, wells turn to silt, and the people who linger too long in a rotten place stop dreaming, then stop speaking, then simply stop. The old kingdoms fractured trying to contain it. What's left is the Kaldmoor Reaches: a strip of surviving, defensible land squeezed between the Rot to the north and a hostile sea to the south, ruled by whoever can hold a wall.

There is no chosen one. There is no clean quest. There is only the next patch of ground worth saving, and the cost of saving it.

**Tone**: low-fantasy scarcity, moral compromise, magic that is real but suspect, monsters that used to be people. Nothing here is fully good or fully evil -- every faction has a real grievance and a real crime.

**Premise in one line**: Everyone in the Reaches is trying to survive the same shrinking map, and no two of them agree on how.

---

## Geography & the Rot

The Reaches are a rocky coastal strip roughly sixty miles east-to-west and fifteen miles north-to-south at their widest, hemmed by cliffs on the south and the Greyline -- the visible edge of the Rot -- creeping down from the north at a few yards a year. Think of it as a narrow shelf of livable land being slowly rolled up like a carpet, with the sea on one side and nowhere to retreat to on the other.

- **The Greyline** -- anywhere touched by the Rot. Plants are ash-grey and brittle, water is undrinkable, sound carries strangely (voices seem farther away than they are), and creatures that die there sometimes get back up within the hour, wrong in ways that aren't always visible at first. Salvage inside the Greyline is valuable precisely because almost no one will go get it. The Greyline is not a hard boundary -- it has fingers, pockets, and tide-like pulses where it advances and briefly retreats.
- **The King's Road** -- the one maintained artery connecting the three holds, roughly 45 miles end to end. Patrolled by whichever hold's stretch you're on, tolled at each hold's gate, relatively safe by day. At night, patrols thin and the road is merely "safer than the alternative."
- **The Drowned Shelf** -- tidal flats and old drowned villages to the south, exposed twice a day at low tide for a roughly 3-hour window. Smugglers and worse use the windows; the schedule itself is a built-in countdown clock for any scene set there.
- **The Backspine** -- a broken ridge of hills running behind Cairnhollow, riddled with old mine workings, sinkholes, and at least one confirmed Aldenmere ruin (the Vault). Poorly mapped; locals avoid it out of superstition as much as danger.
- **The Salt Marches** -- brackish wetland between the Landing and Ashmere, slow going, thick with biting insects and old bog-graves. A common route for people who want to avoid the King's Road tolls or its patrols.

### Travel Times (for pacing solo-play clocks)
| Route | Distance | Time on foot | Time on horse/cart |
|---|---|---|---|
| The Landing <-> Cairnhollow | ~18 miles | 1.5 days | 1 day |
| Cairnhollow <-> Ashmere | ~22 miles | 2 days | 1.5 days |
| The Landing <-> Ashmere (via Marches) | ~14 miles | 1 day, rough going | not viable by cart |
| Any hold <-> Greystile Waypoint | 4-8 miles | half a day | -- |
| Drowned Shelf low-tide window | -- | ~3 hours, twice daily | -- |

---

## Calendar & Seasons

The Reaches use the old Aldenmere calendar out of habit, though nobody enforces it. Four seasons, no leap correction anyone bothers with anymore.

- **Thawmark** (spring) -- the Greyline recedes slightly as ground-ice melts elsewhere; the only season anyone plants in, and even then only near the coast.
- **Longlight** (summer) -- driest, calmest, best travel season. Also when Choir "harvest" activity in the Greyline peaks.
- **Fallrot** (autumn) -- the Greyline's fastest advance of the year; the name is not a coincidence. Most evacuation and resettlement happens now, ahead of it.
- **Hollowtide** (winter) -- storms close the Drowned Shelf smuggling routes; cold slows hollowing but also slows everything else. The King's Road is the only reliable route.

The current campaign start is assumed to open in late Thawmark, with Fallrot's advance from last year still fresh in everyone's memory.

---

## Cosmology & Faith

Nobody in the Reaches practices an organized religion the way Aldenmere once did -- the old temples fell with the wardstones, and most surviving faith is folk practice, not doctrine.

- **The Wardfaith** -- dying belief that the wardstones were tied to a real pact with an old, half-forgotten power referred to only as the Debtholder. Wardfaith holdouts (mostly elderly) think the Failing was the Debtholder calling in what it was owed, and that it can be repaid.
- **The Choir's doctrine** -- the Rot is not divine punishment but transformation: the land and its people becoming something else, something the old wardstones were suppressing. The Choir doesn't worship the Rot so much as midwife it.
- **Common folk practice** -- small household wards (salt lines, iron nails, a coin under the threshold), rarely magical, mostly comfort. Priests are gone; healers and hedge-wisdom fill the gap.
- **What's actually true**: left deliberately open. Evidence exists for multiple interpretations (see Long-Arc Mystery Threads below). Don't resolve this from the setting doc -- let play discover it.

---

## History

- **~140 years before the Failing**: Aldenmere's wardstone network completed, following what court records call "the Binding Accord." No surviving record explains what the Accord was made with.
- **~15 years before the Failing**: Minor tremors and localized "grey patches" reported and quietly suppressed by the crown -- early, ignored warning signs.
- **The Failing (Year 0, 40 years ago)**: The wardstones went dark in a single night, all at once, regardless of distance from each other. No one agrees why -- sabotage, a broken oath, simple age, or something choosing that night specifically. The Rot surfaced within the month, fastest where the oldest stones stood.
- **Year 1-3, The Scattering**: Aldenmere's court fled or died within the capital's own collapsing walls. Local lords who held a defensible line kept their land; everyone else fled south and were absorbed, turned away, or lost to the Rot.
- **Year 6**: The three surviving holds -- the Landing, Cairnhollow, and Ashmere -- signed the Three Wall Accord, a mutual-defense pact that has never been broken outright but is trusted by no one who's actually read it twice.
- **Year 12**: First confirmed sighting of Choir way-tenders; origin unknown, though rumor holds their founders were Aldenmere survivors who went into the Rot rather than away from it.
- **Year 30**: Cairnhollow's mining expansion first breaches what will become known as the Vault; the gallery is sealed within the week and remains so until recently.
- **Year 38 (two years ago)**: The Vault is breached again -- deeper this time, deliberately, by Foreman Betts's crew, chasing a rumored iron seam. What they actually found is not iron.
- **Now (Year 40)**: Tensions between the three holds over dwindling arable land are the highest they've been since the Scattering. The Greyline advanced further last Fallrot than in any prior year on record. Nobody knows why, and almost nobody is asking loudly, because the honest answers are all frightening.

Nobody currently alive knows the true cause of the Failing. That's a deliberate gap -- treat it as the campaign's long-arc mystery, not a fact to hand out. See Long-Arc Mystery Threads below for how to seed it.

---

## Factions

### The Landing (Varrow's Landing) -- the merchant hold
Coastal town-fortress, the closest thing to civilization left. Runs on trade tolls and fishing.
- **Government**: Lady-Warden Isolde Varrow, hereditary but propped up by a merchant council she needs more than they need her.
- **Wants**: control of the King's Road toll rights; hard currency; to be the hold everyone else needs.
- **Resources**: the only working deep harbor; the largest standing market; the best-fed population in the Reaches.
- **Weakness**: thin walls on the landward side, built for trade access, not siege; the fishing fleet is one bad storm from crippling the food supply.
- **Relationship to others**: undercuts Cairnhollow on iron prices out of spite as much as strategy; treats Ashmere as a buffer to be spent, not a partner to be saved.
- **Secret**: Lady-Warden Isolde has been paying off Choir raiders to leave Landing shipments alone -- and is quietly funding a private expedition into the Greyline to find whatever caused the Failing, hoping to control it rather than stop it.

### Cairnhollow -- the soldier hold
A fortified mining town built into a hillside, holds the Reaches' iron and the largest standing militia.
- **Government**: a rotating council of guild-captains, currently dominated by the mining guild under Foreman Betts's political patron, Guild-Captain Orrun Vahl.
- **Wants**: manpower, food (they can't farm the Backspine's soil), and legitimacy -- they believe they should lead the Reaches by right of strength and by supplying everyone's steel.
- **Resources**: without Cairnhollow steel, no one's walls, tools, or weapons get repaired. Best-defended hold by far.
- **Weakness**: chronic food shortage; entirely dependent on Landing grain shipments they resent needing.
- **Relationship to others**: quietly arms Ashmere's garrison at cost, partly out of genuine solidarity, partly to keep a buffer between themselves and the Greyline.
- **Secret**: their mines have broken into an old Aldenmere vault. Command is sitting on it, terrified of what's inside, unwilling to admit they can't get the door open -- or that something on the other side is getting out.

### Ashmere Garrison -- the desperate hold
Smallest, most exposed, closest to the Greyline. Half farmers, half refugees, defended by a shrinking garrison of increasingly disillusioned soldiers.
- **Government**: Garrison-Captain Renn Doss, technically a Three Wall Accord appointee, functionally in sole charge because no one else wants the job.
- **Wants**: survival, evacuation routes, anyone who'll actually help instead of extracting tolls.
- **Resources**: the northernmost buffer everyone else relies on; whatever crops survive Thawmark planting; scavenged Aldenmere-era relics nobody else bothers digging for this close to the Greyline.
- **Weakness**: undermanned, underfed, and increasingly hollowed-adjacent -- several residents are in early stages nobody's willing to name out loud.
- **Relationship to others**: resents both other holds for treating Ashmere as expendable while depending on it for exactly that reason.
- **Secret**: Garrison-Captain Doss has begun secretly negotiating with the Choir, trading intelligence for the antidote-doses they claim to make. It isn't an antidote. It's something else -- see Choirbloom below.

### The Choir of the Unbroken Wound -- the outside power
Wandering cult/order who believe the Rot is not a wound but a birth, and that hollowed people and rotting land are becoming something, not dying. They "tend" the Greyline, harvest from it, and induct the hollowed into their ranks as something between clergy and living relic.
- **Structure**: no central seat; loose network of way-tenders (like Grae at Greystile) reporting to unseen "Chorus-elders" nobody outside the order has met.
- **Wants**: to expand the Rot's reach, or at minimum to be left to their work, and converts -- willing ones preferred, but not required.
- **Resources**: they're the only ones who move safely through the Greyline; genuine (if partial and costly) treatments for hollowing; deep, dangerous knowledge of what the Rot actually is.
- **Weakness**: no numbers, no walls, no food supply of their own beyond what the Greyline yields -- they need the holds as much as the holds fear them.
- **Secret**: some Choir rites genuinely slow or reverse hollowing in individuals -- which is how they recruit true believers among people the holds have written off. The substance behind this is Choirbloom, a grey-veined fungus that grows only in the Rot; it treats hollowing symptoms while quietly making the user more receptive to Choir doctrine. Whether that's manipulation or an honest side effect of the cure is a question the Choir itself doesn't agree on.

### Faction Relationship Matrix (for quick reference)
| | Landing | Cairnhollow | Ashmere | Choir |
|---|---|---|---|---|
| **Landing** | -- | Rival (trade) | Exploits as buffer | Covertly pays off |
| **Cairnhollow** | Resents dependency | -- | Arms at cost, mild solidarity | Distrust, no contact |
| **Ashmere** | Resents being spent | Grateful but wary | -- | Covertly negotiating |
| **Choir** | Takes the coin, no loyalty | Avoids | Sees genuine converts here | -- |

---

## Key Locations

**Varrow's Landing (start here)** -- Walled harbor town, pop. ~900. The market square, the Salt Anchor tavern (best rumor source in the Reaches -- see Rumor Table), the toll-gate onto the King's Road, and Lady-Warden Isolde's keep on the bluff above the docks. Good hub for a home base: shops, a healer (Mother Ysolt, who charges in favors, not coin), and a job board of sorts via the harbormaster, Old Corrin.

**Cairnhollow** -- Fortified hillside mining town, pop. ~650, built in defensive terraces up the Backspine's southern face. Iron forges run day and night; the air tastes of it. The militia barracks and the guild hall dominate the upper terrace. Below ground, the mine galleries run deeper than anyone admits, down to the sealed door of the Vault.

**The Cairnhollow Vault** -- Newly-breached Aldenmere ruin inside the Cairnhollow mine complex's lower gallery. Worked stone, not natural cave -- clearly pre-Failing, possibly pre-dating the wardstone network entirely. Command has sealed the lower gallery and posted guards who don't know what they're guarding against, only that two miners who went in didn't hollow -- they changed, in ways Foreman Betts has kept off the official log.

**Ashmere Garrison** -- Half-abandoned farm town on the Greyline's edge, pop. ~300 and falling, evacuating in slow, informal motion as families quietly relocate south. Grain stores are thin. Good source of desperate, high-stakes hooks and the Reaches' only regular Choir contact.

**The Drowned Shelf** -- Tidal ruins of pre-Failing fishing villages south of the Landing, walkable only at low tide (roughly a 3-hour window twice daily -- a good built-in solo-play clock). Smuggler caches, drowned dead that don't always stay down, old Aldenmere waystones half-buried in silt. The Tideclerk operates from a hidden dry-cache here.

**Greystile Waypoint** -- A ruined coaching inn exactly on the Greyline, half in the Rot, half not. Choir uses it as a way-shrine, tended by Grae. Neutral ground by unspoken rule -- nobody fights at Greystile -- which makes it the best place in the Reaches to meet someone you don't trust.

**The Salt Marches** -- Brackish wetland between the Landing and Ashmere. Home to the Marsh Folk, a handful of families who never joined any hold and are trusted by none of them, but who know routes and safe ground nobody else does. Old bog-graves here sometimes surface bodies far too well preserved for their age.

**The Backspine Mines (outer workings)** -- The older, played-out sections of Cairnhollow's mine network, mostly abandoned but still used for illegal ore-skimming, black-market meetings, and -- per rumor -- as a hiding place for at least one deserter band.

**The Hollow Road** -- A stretch of the old Aldenmere royal highway that now runs directly into the Greyline, still visibly paved beneath the ash-grey overgrowth. Nobody maintains it; nobody needs to. It leads, eventually, toward the ruins of Aldenmere's capital, which no living person from the Reaches has confirmed reaching and returning from sane.

**Corvin's Watch** -- A collapsed signal tower on the King's Road roughly midway between the Landing and Cairnhollow, once part of the wardstone network's relay system. The stone at its base is dark and inert like all the others -- except that travelers occasionally report it faintly warm to the touch, always denied when asked twice.

**The Sunken Chapel** -- Part of the Drowned Shelf ruins, a pre-Failing shrine to the old Wardfaith, exposed only during the lowest tides of the year (roughly twice, in Hollowtide). Local superstition holds that praying there on those nights is answered -- by something.

---

## Notable NPCs

| Name | Role | Wants | Secret / Hook |
|---|---|---|---|
| Isolde Varrow | Lady-Warden of the Landing | Control, and to fix the Failing on her own terms | Funding a Greyline expedition; will pay very well for discretion |
| Renn Doss | Garrison-Captain, Ashmere | To save his people, by any means left | Dealing with the Choir; increasingly hollowed himself, hiding it |
| Mother Ysolt | Healer, the Landing | Owed favors, not coin | Knows more about hollowing-sickness than she admits; was Aldenmere court physician once |
| Grae | Choir way-tender at Greystile | Converts, and honest answers for honest questions | Genuinely believes the Choir is right; will trade real Rot-lore for aid to the hollowed |
| Foreman Betts | Runs the Cairnhollow Vault dig | To be the one who "solves" the vault before command panics and seals it forever | Already hollowed a miner's family member and is hiding the body |
| The Tideclerk | Unnamed smuggler broker, Drowned Shelf | Coin, salvage, no questions | Knows the tide windows better than anyone; will sell that knowledge or a boat |
| Guild-Captain Orrun Vahl | Cairnhollow's political power broker | Legitimacy for Cairnhollow as leader of the Reaches | Backs Betts's cover-up because exposing it would cost him his seat |
| Old Corrin | Harbormaster, the Landing | A quiet retirement he'll never get | Runs the informal job board; knows everyone's business and sells small pieces of it |
| Sella Marsh | Elder of the Marsh Folk | To be left alone by all three holds | Knows a safe route through the Greyline's edge that even the Choir doesn't use |
| Brother Icken | Last remaining Wardfaith priest, itinerant | To find proof the Debtholder can be repaid, not just placated | Carries a fragment of a wardstone that has never gone fully dark |
| Dell Varrow | Isolde's estranged brother, exiled to Cairnhollow | Reinstatement, or petty revenge if that fails | Knows the real reason Isolde exiled him -- it involves the Failing's cover-up, not simple politics |
| "Whistler" | Deserter-band leader hiding in the Backspine outer workings | Amnesty, or enough coin to buy passage far south | Deserted after seeing what happened to a patrol that entered the Vault's outer gallery |

---

## Bestiary -- What the Rot Makes

Not all hollowed creatures are the same. Use this as a rough progression, not a strict taxonomy -- the Rot doesn't read tables.

- **The Hollowed** -- people (or animals) who've lost too much to the Rot. Slow, largely mindless, driven by dim habitual echoes of their old life (a hollowed baker still kneads at nothing; a hollowed soldier still walks a patrol route). Not aggressive unless cornered or protecting the ash-thing they've come to treat as precious.
- **Wakened Hollow** -- rarer, more dangerous: hollowed creatures that retain purpose, sometimes coordination. Nobody agrees on what causes some hollowed to wake instead of simply fading.
- **Greylings** -- small, fast, animal-sized things that seem to have grown in the Rot rather than been changed by it -- never confirmed to have been anything else first. Pack hunters, drawn to warmth and noise.
- **Vault-changed** -- whatever the two Cairnhollow miners became. Not hollowed at all in the usual sense -- stronger, purposeful, and unnervingly patient. Treat as a unique, campaign-specific threat rather than a reusable monster type; the point is that the Vault is doing something categorically different from ordinary Rot exposure.
- **Choirbloom-touched** -- living people deep in Choir practice, not hollowed, not quite unchanged either. Grey veining under the skin, calm affect, genuine strength of conviction. Not inherently hostile -- some are the setting's most reasonable NPCs.

None of the above come with 5e stat blocks -- build reasonable, level-appropriate stat blocks for them yourself when they appear (using existing 5e monsters as a mechanical base and reflavoring is fine), scaled for solo play per the party-balance rules.

---

## Economy, Currency & Trade

- **Currency**: pre-Failing Aldenmere coin still circulates and is trusted (it's well-minted and can't easily be faked), supplemented by each hold's own crude stamped tokens, which are trusted only within that hold's walls.
- **Real wealth**: food, iron, and Choirbloom (traded quietly, rarely openly) matter more than coin in the Reaches. A meal owed is often better currency than money.
- **Salvage economy**: pre-Failing goods -- tools, books, anything Aldenmere-made -- are valuable both for utility and as clues to what was lost. The Drowned Shelf and the Hollow Road are the two richest (and most dangerous) salvage grounds.
- **Sample loot table (d8)** -- roll when searching a ruin, drowned building, or Greyline pocket:
  1. Aldenmere-minted coin, tarnished but good
  2. A half-legible logbook page, pre-Failing handwriting
  3. A child's toy, untouched by grey -- oddly unsettling in context
  4. A sealed jar of something that hasn't rotted in 40 years
  5. Scrap of a wardstone, cold and inert
  6. A weapon of old make, better balanced than anything forged now
  7. A journal entry naming a person or place from this table's NPC/location lists -- DM's choice which
  8. Nothing useful, but a clear sign someone else was here recently

---

## Adventure Hooks

1. A Landing merchant's salvage crew hasn't returned from the Drowned Shelf; the harbormaster quietly offers double rate to whoever checks -- and doesn't report it to Isolde.
2. Cairnhollow miners are vanishing from the lower gallery one at a time; Foreman Betts wants it handled quietly, before command notices the count is off.
3. A Choir way-tender at Greystile offers a real cure for a hollowing villager -- in exchange for escorting three converts safely across the Greyline.
4. Garrison-Captain Doss asks for an escort to a "supply meeting" north of Ashmere that turns out to be well past the safe line.
5. An Aldenmere-era waystone surfaces on the Drowned Shelf at an unusually low tide -- locals are already fighting over who gets to loot it first.
6. A hollowed creature is seen behaving with unnerving purpose near the King's Road -- not shambling, hunting.
7. Isolde Varrow's private expedition into the Greyline hasn't reported back in two weeks; she needs deniable help finding out why.
8. A child in Ashmere hasn't hollowed after weeks of exposure -- word is spreading, and both the holds and the Choir want to know why first.
9. Someone is selling forged Choir "antidote" doses in the Landing market; real victims are getting worse, not better.
10. The tide windows at the Drowned Shelf have started shifting -- arriving early, running long -- and nobody knows why. The Tideclerk is spooked, which is new.
11. Sella Marsh sends word she'll trade her safe Greyline route for help moving her people somewhere the holds can't tax them.
12. Brother Icken arrives at whatever settlement the party is in, insisting his wardstone fragment just flickered for the first time in years.
13. Dell Varrow offers proof of his sister's cover-up -- for a price, and for passage out of Cairnhollow before Vahl finds out he's talking.
14. "Whistler" and his deserters intercept a shipment, and the party is caught between recovering it and hearing out why the band deserted in the first place.
15. A Cairnhollow patrol goes dark near Corvin's Watch; the last message mentions the old stone being warm.
16. Two rival salvage crews both hire the party -- for the same wreck on the Drowned Shelf -- without knowing about each other.
17. A hollowed creature is found tied up and cared for in someone's cellar; the family insists it's still "in there."
18. The Sunken Chapel's rare exposed night is coming up in Hollowtide, and Brother Icken wants an escort to pray there, no matter what it costs.
19. Choirbloom shipments meant for Ashmere are being intercepted before they arrive -- by whom, and why, is unclear even to Grae.
20. A stranger with an Aldenmere court signet ring is found wandering the King's Road, hollowed but somehow still speaking -- in a dialect nobody's heard outside old records.

---

## Long-Arc Mystery Threads (seed slowly, never info-dump)

- **What actually caused the Failing** -- sabotage, exhaustion of the Binding Accord, or the Debtholder calling in a debt on purpose. Evidence for each exists (Vault findings, Icken's wardstone fragment, Choir doctrine) and can point different directions depending on what the player wants.
- **What the Vault-changed miners are becoming** -- and whether it's related to, ahead of, or entirely separate from ordinary hollowing.
- **Whether Choirbloom cures or converts** -- and whether the Choir itself fully understands the difference.
- **What's down the Hollow Road**, and whether anything of Aldenmere's capital -- or its court -- survived intact.

---

## Solo Play Tools -- roll these for real via the roll_dice tool, don't just pick a result

### Rumor Table (d12) -- roll when arriving at any settlement or asking around
1. A hold is quietly buying weapons from outside the Reaches.
2. The Greyline moved faster than usual near [nearest location] last week.
3. Someone claims to have seen a wardstone still glowing, deep in the Rot.
4. A local has started acting strange -- not hollowed, just wrong.
5. The Choir was seen somewhere they don't usually go.
6. A shipment/cargo went missing between holds; blame is flying.
7. An old-timer says this has all happened before, generations back.
8. A hollowed person was seen speaking -- actual words, not just moaning.
9. One of the holds is running low on something critical (food/iron/medicine).
10. A grave near the Greyline was dug up from the inside.
11. Someone's offering good coin for a guide into the Rot, no questions asked.
12. Two rumors on this table are both true, and connected. DM's choice which.

### Complication Oracle (d10) -- roll when a scene needs a twist
1. Reinforcements arrive -- for the other side.
2. The environment turns against you (tide, collapse, Rot creep, fire).
3. An ally's hidden agenda surfaces at the worst moment.
4. What you came for is already gone/taken/spoiled.
5. A third party interrupts, with their own goal.
6. The information you had was wrong or outdated.
7. Something here is more hollowed/changed than expected.
8. You're recognized -- by reputation, debt, or an old enemy.
9. The clock accelerates (tide turns early, patrol comes back sooner, etc).
10. You find exactly what you needed -- and it costs more than expected to take.

### Random Encounter Table (d10) -- Greyline / off-road terrain
1. A lone Hollowed, harmless unless cornered.
2. A pack of 1d4+1 Greylings, hunting.
3. A Choir way-tender, alone, willing to talk.
4. Fresh tracks -- human, heading somewhere purposeful.
5. A Wakened Hollow, watching from a distance before it decides.
6. A salvager or smuggler, wary, possibly willing to trade.
7. An old wardstone marker, inert, but marked with recent fresh chalk.
8. Sudden weather shift -- visibility drops, Greyline edges seem to blur.
9. Signs of a recent fight -- no bodies, more questions than answers.
10. Nothing. Just long enough for the quiet to feel wrong.

### Faction Turn Moves (roll d6, once per in-game week, to advance the background)
1. Landing: raises tolls or cuts a shipment, straining another hold.
2. Cairnhollow: the Vault situation worsens by one increment (your judgment).
3. Ashmere: loses another family to quiet evacuation, or gains a rumor of Choir contact spreading.
4. Choir: a way-tender appears somewhere new, or a convert surfaces in hold territory.
5. Weather/Season: the Greyline advances or recedes slightly per the current season's tendency.
6. Wildcard: draw an Adventure Hook that hasn't been used yet -- it becomes live this week.

### Hollowing Clock
Track exposure to the Rot as a simple clock (0-6). Each turn spent in Greyline terrain, or each failed save vs. Rot effects, fills one segment. At 6, the character begins to hollow: minor personality flattening at first, escalating toward the character becoming an NPC if untreated. Mother Ysolt or the Choir (via Choirbloom) can reduce the clock -- at a cost: Ysolt calls in a favor later; the Choir expects openness to their doctrine in return. Since the app has no dedicated clock widget, track this via update_character's conditions array as a plain string like "Hollowing 3/6", updating it every time it changes so the player can always see it on their sheet.

---

## Culture & Texture Notes

- Nobody says "the Rot" to a stranger's face without watching how they react to the phrase first -- it's considered mildly unlucky, like naming a storm.
- Salt is currency-adjacent: used in wards, preservation, and payment for small favors alike. The Landing controls most of the supply and knows it.
- Children born after the Failing are called Aftlings by the older generation -- not an insult, exactly, but never said with total ease either.
- Aldenmere heraldry (a grey heron on blue) still turns up on salvage and is generally left alone or quietly buried by whoever finds it -- displaying it openly is seen as either naive or a political statement, depending on who's asked.

---

## Running It

Start the character in Varrow's Landing with a simple, low-stakes hook (the missing salvage crew works well) to establish tone and introduce the toll of the Greyline before raising the stakes toward the Cairnhollow Vault or Ashmere's Choir dealings. Let the factions' competing secrets -- Isolde's expedition, Doss's deal, Betts's cover-up -- surface gradually through play rather than exposition; any one of them can become the campaign's spine.

Use the Faction Turn Moves table to keep the background world advancing even when play is focused elsewhere -- it keeps the Reaches feeling like it's shrinking in real time, which is the whole point of the setting.
`.trim();
