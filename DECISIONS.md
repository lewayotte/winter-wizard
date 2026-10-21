# Winter Wizard — Design Decisions

Where the brief was open-ended, these arcade-style calls were made:

## Scope & Levels
- **48 levels, not 60**: 60 felt like padding; the curve stays tight at 45 main days + 3 bonus days. Every level is literal data in `levels.js`.
- **Bonus days 46–48** are the "winter extended" levels from the Groundhog finale, unlocked only by actively scaring the groundhog with the flashlight on day 45.
- Day 1 is idle-survivable (soft tutorial); idling stops working around day 3–4.

## Spells & Unlocks
- One unlock every 3 levels: Clouds → Snow (L4) → Wind (L7) → Rain (L10) → Frost Nova (L13), then 11 upgrades (L16–L46). Christmas (L25) itself is a special event, not an upgrade. **Winter's Eternal Grip (L46)** lands as the bonus tier opens: ambient cooling +0.5°F/s — the extended winter itself fights for you.

## Difficulty Architecture
- **The sun's heat curve is the main difficulty dial**: ~1.0°F/s on day 1 up to ~9.6°F/s on day 48 at full sun. With the flat 5-lane cap, ~2/7 of it always leaks through (~0.19°F/s·avg per unit of heat), so late days require continuous active cooling, not just coverage. The back half (days 29–48) is tuned so reactive play earns 2★ — 3★ demands proactive cooling from dawn (see day 34's Winter's Embrace for the survival tool in the mid-campaign power trough).
- **Wand recharge (0.6s global cast lock)**: every successful cast recharges the wand, capping total spell throughput — tool-spamming can't outpace the sun 6:1 anymore, while casual click rates are barely affected.
- **Upgrade note (day 34)**: "Winter's Embrace" grants ambient cooling +0.25°F/s (on top of the 0.1 base) plus 40% longer cloud life — the survival tool that carries you into the deep campaign. Days 29–48 heat was trimmed ~8% from its first cut after playtesting found days 33–35 spiked against stale toolkits.
- **Cooling has costs**: snowing sifts 2s of life out of its source cloud; rain dissolves its cloud entirely; nova is a modest −8°F with a long cooldown. Over-cooling always trades against coverage.
- **Blasts never target the castle lane** (they'd strip your ray shield and cascade into stuns); late stun rays fire a touch less often.
- Balance targets: a tool-spamming expert clears ~47–48/48 with 3★ common early, 2★ the norm late, 1–2★ on bonus days; casual reactive play clears ~34/48 with scattered, retryable walls. The bonus tier (46–48) was tuned so a good player wins each day in a few tries (near-miss losses, peaks 1–2°F over the limit) — it's the mastery exam, with Winter's Eternal Grip as the power spike that makes it fair.
- **7 vertical sky lanes.** One cloud per lane; casting on an occupied lane **overwrites** it — the existing cloud's life extends by remaining + a fresh cloud (capped at 2× fresh, so dawn-spam can't bank infinite life). The per-level cap limits how many lanes can hold clouds at once.
- **Snow/Rain** require a cloud in the target lane ("it can only snow under clouds"). Wind and Nova are free-target.
- Rain *dissolves the exact cloud it fell from* (tracked even if new clouds stack above it).
- Nova is cast instantly (button or key `5`), no lane click.
- Wizard has no mana — only per-spell cooldowns. Simpler arcade loop; pressure comes from cooldown management.

## The Sun's Threats
- **Fireballs** lob at random lanes; a cloud in the lane absorbs the hit (cloud takes damage instead of the temperature). Wind in the lane weakens the payload ×0.5 (upgrades: ×0.25, then blows them out of the sky entirely).
- **Stun rays** always target the wizard's castle lane — the middle lane, where the castle 🏰 and wizard 🧙 stand centered on the ground. **A ray is blocked if the castle lane is clouded when it locks on (charge) OR when it fires** — so a cloud that gets burned away mid-charge still sacrifices itself to save you. The beam visually stops at the blocking cloud (icy-blue + ✨). On hit they lock **ALL spells** for the ray's duration, then the sun holds its next ray until the lock expires **plus a 4s recovery window** — one stun can never chain into another. Rain dissolving the castle cloud warns you (⚠), since both rain and snow chip the very cloud that shields you. The spell bar and wizard show 🔒 while locked, so castle cover matters all day.
- **Heat blasts** charge ~2.5s with a warning, then pierce the lane's cloud: the cloud is destroyed and 50% of the blast heat leaks through; with no cloud at all it's a full spike.
- The sun attacks only while elevated, and **schedules faster the angrier it gets** (anger = temperature ratio + how much sky you've clouded).
- Sun face is drawn shapes (brows/mouth/steam) over an emoji-palette body — happy → annoyed → furious, plus a nervous sweat drop when you're winning.

## Temperature
- **Fahrenheit winter scale.** Days start cold (~20°F), the ❄ 30°F line marks the average winter we're defending (drawn on the thermometer), and each level's melt limit is the winter average +11–16°F (46°F early, tightening to 41°F by the finale). Bonus days stretch to 38–40°F as the brutal postgame.
- One global thermometer per level. Heating = `levelHeat × sunElevation × (1 − cloudCoverage)`. Passive ambient cooling 0.1°F/s. Temps may dip to −10°F when you over-cool.
- Exceeding the limit at ANY point before sunset = instant meltdown loss.
- **Stars are peak-temperature driven, same dynamic every day**: 3★ = the temp never rose above the 30°F winter goal; 2★ = never above the ⚠ warn line, midway between goal and limit (e.g. 38°F on day 1); 1★ = survived. The bar turns orange past the goal and red past the warn line, and a live ★ tracker in the HUD shows the stars you can still earn. Finishing at/below 30°F earns a "❄ TRUE WINTER" flourish. (Stuns are pressure, not a star criterion.)

## Clouds
- **Flat 5-cloud cap, all game.** Only 5 of 7 lanes can be clouded at once — the sun always has somewhere to burn, so the level's heat stat stays a real, escalating threat (base exposure is always 2/7) and difficulty rises through heat/day length/limit instead of cloud-count inflation. Castle lane is essentially mandatory (ray block), so the tactical choice is which 4 other lanes to shade. Casting on an occupied lane **overwrites** it — the existing cloud's life extends by remaining + a fresh cloud (capped at 2× fresh, so dawn-spam can't bank infinite life). Each cloud lives ~14s under full sun (upgrades stretch it), so slots recycle quickly.
- Clicking **anywhere in a lane column** (sky or ground) casts at that lane; the ghost preview turns red with 🚫 when a cast would fail, and the spell bar shows a live `☁ 3/5` counter.
- Clear failure message when out of slots: "CLOUD LIMIT (5) — SUN MELTS OLD ONES".
- Clouds are **big ☁️ emoji** printed solid (double-printed for full opacity) when fresh, then fading steadily as sunlight melts them (no damage states/cracks — fading is the melt indicator). They are the **top-most scene layer**: sun glows, blast beams/washes, stun rays and the nova flash all strike behind them, so clouds only ever dim when actually melting. Each throws a **ground shadow on the snow that leans away from the sun**, so they visibly keep the land cool.
- The **sun rides a wide arc**: it enters off-screen at the left edge, sweeps high across the top of the sky, and exits off-screen right (no visible path line). Threats/heat still follow the same elevation curve as before.

## Christmas (Day 25)
- Santa 🎅 flies across at ~78% of the day and drops one weighted-random gift: ☕ Hot Cocoa 45% (full temp reset), 🔮 Magic Snow Globe 40% (Frost Nova instantly recharged), 🔦 Flashlight 15% (secret).
- **The gift slot holds exactly what Santa last gave you**: ☕ cocoa / 🔮 snow globe consumables (×1 — press **6** to use; Santa's magic works even while stunned) or the 🔦 flashlight (∞ — the permanent finale key; pressing 6 makes it glow, it is never consumed). Using a consumable empties the slot — it never morphs into something else. **Entering Day 25 resets the slot to the wrapped 🎁** (a fresh Santa drop is coming — the empty slot pulses on Christmas day), and the catch refills it persistently. The flashlight flag lasts for the Day-45 finale regardless of what the slot later holds. The slot is always visible on the spell bar (dimmed 🎅 hint when empty elsewhere) and persists in the save.
- Gift waits 9s on the ground (catchable mid-air); the level-25 end screen reports what you caught or that it melted.

## Groundhog Finale (Day 45)
- Mid-morning (~35% of the day) a 🦫 wanders out and crosses the snow **left→right at exactly 2× the sun's speed** (visible roughly half the day). If you **USE the 🔦 flashlight (key 6 / gift slot) while he's on screen**, he leaps, sees his shadow, and flees home right→left at 3× speed — **winter extends immediately** (bonus days unlock on the spot, even if you later lose the day). Miss him (or hold a cocoa/globe instead) and he strolls off; the win ceremony shows "NO SHADOW... SPRING LOOMS" with a hint to catch Santa's flashlight and shine it next time. A banner tracks him while visible, and the flashlight must be in your gift slot to work — so don't overwrite it with a later consumable before day 45.

## Presentation & Tech
- Vanilla JS + Canvas 2D, zero dependencies, no build step. Canvas fills the window (responsive, DPR-aware); clicks are handled in screen coordinates.
- Retro look: chunky monospace UI, scanlines, vignette, pixel-ish panels — mixed with emoji sprites (🔥❄️💨🌧️🧊☁️) via fillText. The castle 🏰 stands with the wizard 🧙 in every scene; fireballs thrown at a cloud-covered lane are intercepted mid-air at the cloud and never reach the ground.
- Minimal WebAudio bleeps (no files); `M` mutes, `P` pauses, `R` restarts, `1–5` select spells.
- Progress (stars, flashlight, bonus unlock) in localStorage, gracefully degrading if storage is unavailable.
- Balance was validated headlessly: a mediocre bot clears 47/48 days; day 48 is the boss.
