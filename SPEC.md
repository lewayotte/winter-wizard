# WINTER WIZARD — Complete Recreation Specification

This document fully specifies **Winter Wizard**, a browser arcade game, so it can be
rebuilt from scratch in one shot. Every number here is final-tuned and play-validated.
Follow it literally; when a detail is unspecified, make a small arcade-style decision
and keep it consistent. Companion file `DECISIONS.md` records design rationale.

---

## 1. Concept

You are a wizard defending winter. Each level is one day: the sun rises, arcs across
the sky, and sets. While the sun shines on the land the **temperature rises**; if it
exceeds the level's limit before sunset, you lose. You cast spells — ☁️ clouds to
block the sun, ❄️ snow / 💨 wind / 🌧️ rain to cool, 🧊 Frost Nova for emergencies —
while the sun fights back with fireballs, stun rays, and heat blasts. 45 main days,
a Christmas Santa event on day 25, a Groundhog finale on day 45, and 3 bonus days.

**Tech requirements:** Vanilla JavaScript + HTML5 Canvas 2D. No frameworks, no build
step. One canvas filling the browser window responsively; input in screen coordinates.
Retro 8-bit style mixed with emoji sprites drawn via `fillText`. All levels are pure
data. Progress saved to `localStorage`.

**Files** (plain `<script>`s loaded in this order from a minimal `index.html`):
1. `levels.js` — pure data: constants, spells, unlocks, upgrades, gifts, 48 levels (global `window.WW` namespace).
2. `render.js` — all drawing (`WW.R.draw(game)` per frame).
3. `wizard.js` — spell knowledge, cooldowns, stun locks, upgrade math (`WW.Wizard`).
4. `sun.js` — sun arc/anger, threat scheduling (`WW.Sun`).
5. `save.js` — localStorage persistence (`WW.Save`).
6. `game.js` — main loop, states, input, temperature sim, scoring (`WW.Game`; boots on window load into `#game` canvas).

---

## 2. World model & geometry

- Canvas fills the window; re-derive geometry on resize: `W`×`H` logical pixels,
  devicePixelRatio capped at 2. `groundY = H × 0.78`, `cloudY = groundY − min(230, H × 0.33)`, `laneW = W / 7`.
- **7 vertical lanes** across the sky (index 0–6, left to right). Lane `i` spans x ∈ [W·i/7, W·(i+1)/7).
- **Castle 🏰 + wizard 🧙 stand centered on the ground in lane 3** (`CASTLE_LANE = 3`).
- A day runs `level.day` seconds from sunrise to sunset. `p = dayTime / day`.
- All temperatures are **°F winter**: dawns ~20°F, the ❄ winter **goal line is 30°F** (`AVG_WINTER`),
  and each level's melt limit sits 10–16° above the goal (46°F early → 41°F finale).
  Temperature floor is −10°F.

### The sun
- `elev = sin(π·p)`; `sunFactor = clamp(elev × 1.35 − 0.15, 0, 1)` (0 at horizon edges, ~1 at noon).
- Position — a wide edge-to-edge arc (never rises out of the ground mid-screen):
  - `x = W × (−0.14 + 1.28·p)` (off-screen left at dawn, off-screen right at dusk)
  - `y = (groundY+30) − ((groundY+30) − H×0.16) × sin(π·p)^0.5` (fast rise, long high arc)
- **Anger** = `clamp(temp/limit × 0.75 + coverageFrac × 0.4, 0, 1)` where `coverageFrac` = fraction of lanes with a (non-dying) cloud.
  Drawn face: brows/mouth/gritted teeth/steam by anger; red body tint; sweat drop when temp ratio < 0.35; 💢 when > 0.85. Sky gets a red anger wash past 0.45.
- Threat timers tick only while `sunFactor > 0.02`. Next interval for a threat with base `B`:
  `rand(0.75B, 1.3B) × (1 − 0.25 × anger)` — the angrier the sun, the faster it attacks.
  Only one ray and one blast may be active (charge or beam) at a time.

---

## 3. Complete tuning constants

```
LANES: 7              CASTLE_LANE: 3        AVG_WINTER: 30 (°F goal)
CLOUD_LIFE: 14s       CLOUD_CD: 2.2s        CLOUDS_MAX: 5 (flat, whole game)
WAND_LOCK: 0.6s       SNOW_DRAIN: 2s        FIRE_CLOUD_DMG: 6s      FIRE_FLIGHT: 1.5s
SNOW: dur 6s, 0.5°F/s, cd 4s
WIND: dur 4s, 0.35°F/s + 1°F instant burst, cd 5s
RAIN: dur 4s, 1.4°F/s, cd 9s
NOVA_DROP: 8°F
PASSIVE_COOL: 0.1°F/s (ambient; +0.25 with Winter's Embrace, +0.5 with Eternal Grip)
WEAKEN: ×0.5 (fireball payload in a wind-gusted lane; upgrades → ×0.25, then blow away)
RAY_CHARGE: 1.0s      RAY_GRACE: 4.0s       BLAST_CHARGE: 2.5s
BLAST_LEAK: 0.5 (fraction of blastTemp through a pierced cloud)
SANTA_TIME: 0.78 (day 25)  HOG_TIME: 0.35 (day 45)  GIFT_LIFE: 9s
MIN_TEMP: −10°F
```

---

## 4. Temperature, stars, win/lose

- **Heating** = `level.heat × sunFactor × (1 − coverageFrac)`.
- **Cooling** = ambient (see constants) + Σ active lane weather (`snowDps + windDps + rainDps` while active).
- `temp += (heat − cool) × dt`, clamped to ≥ −10.
- **Lose** the instant `temp > level.limit` (meltdown, mid-day allowed).
- **Win** when `dayTime ≥ level.day` (sunset).
- Track `maxTemp` all day. **Stars are peak-temperature driven:**
  - `warn = (AVG_WINTER + level.limit) / 2` (e.g. 38°F on day 1)
  - 3★ = maxTemp never rose above **30°F** (goal) · 2★ = never above **warn** · 1★ = survived
  - `stars = 3 − (maxTemp > goal ? 1:0) − (maxTemp > warn ? 1:0)`
- Save best stars per level. Stuns do **not** affect stars.

---

## 5. Spells (all gated by the 0.6s wand recharge; every successful cast sets it)

| Key | Spell | Cooldown | Effect | Costs / rules |
|---|---|---|---|---|
| 1 | ☁️ Cloud | 2.2s | Place a cloud in a lane (~14s life under full sun; melts at `dt × sunFactor`). Contributes lane coverage; casts a ground shadow. | Cap **5 clouds** game-wide. Casting an occupied lane **overwrites**: `life = min(life + fresh, 2×fresh)`, `max` grows. Fresh clouds double-printed solid; fade gradually as they melt (fade = the melt meter, no damage states). |
| 2 | ❄️ Snow | 4s | 6s of snowfall under the cloud, **0.5°F/s** cooling. | Requires a cloud in the lane; **sifts 2s of life** out of that cloud. |
| 3 | 💨 Wind | 5s | 4s gust, 0.35°F/s + instant 1°F; fireballs in the lane are **weakened ×0.5**. | Any lane. |
| 4 | 🌧️ Rain | 9s | 4s downpour, **1.4°F/s** — strongest sustained cooler. | Requires a cloud; **dissolves it** when done. Dissolving the **castle lane** cloud triggers a ⚠ warning toast. |
| 5 | 🧊 Frost Nova | per level (30s → 7s) | Instant screen-wide **−8°F** + flash. | Cast instantly (no lane). |
| 6 | 🎁 Gift | — | Uses the held gift (see §8). **Not a spell:** works while stunned, ignores wand lock. | — |

- **Stun rays lock ALL spells** for the duration (see §6).
- Spell bar shows one button per unlocked spell + always-visible gift slot; cooldown
  pie sweeps; 🔒 overlays while stunned; live `☁ n/5` counter in the hint line.

---

## 6. The sun's threats

**Fireballs** — lobbed at a random lane (target x jittered 20–80% across the lane),
1.5s parabolic flight from the sun. Payload = `fireTemp`, ×weaken if the lane is
wind-gusted (×0.25 with Gale Force; **blown away entirely** with Storm Front).
- **Mid-air interception:** if the lane has a (non-dying) cloud and the fireball
  descends into the cloud band (`y ≥ cloudY − 20`) within the lane horizontally
  (±0.7 laneW of center), it detonates on the cloud — −6s cloud life, fire burst at
  the cloud, **never reaches the ground**, no temperature spike.
- Landing with a cloud present (late-placed) still soaks it (no spike). No cloud →
  `temp += payload`, ground burst, screen shake, "+X°F FIREBALL!" toast.
- A pulsing orange target ring marks the landing spot (dims while the lane is guarded).

**Stun rays** — always target the castle lane. Charge 1.0s: dashed line + reticle
(reticle aims at the cloud if the lane is covered, else the castle).
- **Blocked if the castle lane has a cloud at lock-on OR at beam time** (a cloud that
  burns away mid-charge still sacrificed itself). Blocked visual: icy-blue jagged
  beam that **stops at the cloud** with a ☁️ + ✨ burst at impact; "STUN RAY BLOCKED!" toast.
- Otherwise: **lock ALL unlocked spells** for `rayDur`, 🔒 over the wizard + spell bar,
  "⚡ ALL SPELLS LOCKED Xs!" toast, and the sun **holds its next ray for
  `rayDur + 4s`** (no chain-stuns — the recovery window lets you re-cover).

**Heat blasts** — 2.5s telegraph: orange lane wash + ⚠️/🔥 floating above the target
lane (never the castle lane). Targets the **cloudiest non-castle lane** (random lane
if none). Beam 0.4s from sun to ground.
- Lane has a cloud: **pierce** — cloud destroyed + `blastTemp × 0.5` leaks through.
- No cloud: full `blastTemp` spike. Shake + toast either way.

---

## 7. Levels — complete data (48 days)

`special`: '' · 'christmas' (25) · 'finale' (45) · 'bonus' (46–48)

| # | Name | day(s) | start°F | limit°F | heat | fire(s) | fireTemp | ray(s) | rayDur | blast(s) | blastTemp | novaCd |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | First Frost | 40 | 20 | 46 | 1.0 | – | – | – | – | – | – | 30 |
| 2 | Cold Shoulder | 42 | 20 | 46 | 1.0 | – | – | – | – | – | – | 30 |
| 3 | Sunbeams | 45 | 20 | 46 | 1.1 | 18 | 1.5 | – | – | – | – | 28 |
| 4 | Light Flurries | 48 | 20 | 46 | 1.2 | 15 | 2 | – | – | – | – | 28 |
| 5 | Melting Point | 50 | 20 | 46 | 1.3 | 14 | 2 | – | – | – | – | 26 |
| 6 | Scorch Watch | 52 | 20 | 46 | 1.4 | 13 | 2 | – | – | – | – | 26 |
| 7 | Solar Flare | 55 | 20 | 46 | 2.0 | 12 | 2 | 18 | 4 | – | – | 24 |
| 8 | Ray of Trouble | 55 | 20 | 46 | 2.2 | 12 | 2.5 | 16 | 4 | – | – | 24 |
| 9 | Heat Wave | 58 | 20 | 46 | 2.4 | 11 | 2.5 | 15 | 4 | – | – | 22 |
| 10 | Burn Notice | 58 | 20 | 45 | 2.6 | 11 | 2.5 | 14 | 5 | – | – | 22 |
| 11 | Fire Drill | 60 | 20 | 45 | 2.8 | 10 | 3 | 13 | 5 | – | – | 20 |
| 12 | Blaze March | 60 | 20 | 45 | 3.0 | 10 | 3 | 13 | 5 | – | – | 20 |
| 13 | Nova Dawn | 62 | 21 | 45 | 3.0 | 10 | 3 | 12 | 5 | 24 | 3.5 | 20 |
| 14 | Charged Sky | 62 | 21 | 45 | 3.2 | 9 | 3 | 12 | 5 | 22 | 4 | 18 |
| 15 | Piercing Light | 65 | 21 | 45 | 3.5 | 9 | 3 | 11 | 5 | 21 | 4 | 18 |
| 16 | Big Flakes | 65 | 21 | 45 | 3.7 | 9 | 3 | 11 | 5 | 20 | 4.5 | 18 |
| 17 | Solar Siege | 68 | 21 | 45 | 3.9 | 8 | 3 | 10 | 5 | 19 | 4.5 | 16 |
| 18 | Gale Warning | 68 | 21 | 44 | 4.1 | 8 | 3.5 | 10 | 5 | 18 | 5 | 16 |
| 19 | Scorched Lane | 70 | 21 | 44 | 4.3 | 8 | 3.5 | 10 | 6 | 18 | 5 | 16 |
| 20 | Firestorm | 70 | 21 | 44 | 4.5 | 7 | 3.5 | 9 | 6 | 17 | 5 | 14 |
| 21 | Stun Spectrum | 72 | 21 | 44 | 4.7 | 7 | 3.5 | 9 | 6 | 16 | 5.5 | 14 |
| 22 | Heavy Sky | 72 | 21 | 44 | 4.9 | 7 | 4 | 9 | 6 | 16 | 5.5 | 14 |
| 23 | Blister Bowl | 75 | 21 | 44 | 5.1 | 7 | 4 | 8 | 6 | 15 | 5.5 | 14 |
| 24 | Meltwater | 75 | 21 | 44 | 5.3 | 6 | 4 | 8 | 6 | 15 | 5.5 | 12 |
| 25 | Christmas Morning | 78 | 22 | 44 | 5.2 | 7 | 3 | 9 | 5 | 18 | 4.5 | 12 |
| 26 | Ember Tide | 78 | 22 | 44 | 5.5 | 6 | 4 | 8 | 6 | 14 | 5.5 | 12 |
| 27 | Furnace Wind | 78 | 22 | 44 | 5.7 | 6 | 4.5 | 8 | 6 | 14 | 6 | 12 |
| 28 | Pyre Plane | 80 | 22 | 44 | 5.9 | 6 | 4.5 | 7 | 6 | 13 | 6 | 11 |
| 29 | Kiln Sky | 80 | 22 | 44 | 5.6 | 6 | 4.5 | 7 | 6 | 13 | 6.5 | 11 |
| 30 | Flashover | 82 | 22 | 44 | 5.8 | 5 | 4.5 | 7 | 6 | 13 | 6.5 | 11 |
| 31 | Sun Scorn | 82 | 22 | 43 | 6.0 | 5 | 4.5 | 7 | 6 | 12 | 7 | 10 |
| 32 | Radiant Wrath | 85 | 22 | 43 | 6.2 | 5 | 4.5 | 6 | 7 | 12 | 7 | 10 |
| 33 | Furnace March | 85 | 22 | 43 | 6.3 | 5 | 4.5 | 6 | 7 | 11 | 7 | 10 |
| 34 | Twin Suns | 88 | 22 | 43 | 6.5 | 5 | 4.5 | 6 | 7 | 11 | 7 | 10 |
| 35 | Heat Haze | 88 | 22 | 43 | 6.7 | 4 | 4.5 | 6 | 7 | 11 | 7.5 | 10 |
| 36 | Blaze Alliance | 90 | 22 | 43 | 6.9 | 4 | 5 | 6 | 7 | 10 | 7.5 | 10 |
| 37 | Inferno Lane | 90 | 23 | 43 | 7.1 | 4 | 5 | 5 | 7 | 10 | 9 | 9 |
| 38 | Magma Morn | 92 | 23 | 43 | 7.3 | 4 | 5 | 5 | 7 | 10 | 9 | 9 |
| 39 | Furnace Gate | 92 | 23 | 43 | 7.5 | 4 | 5 | 5 | 7 | 9 | 9.5 | 9 |
| 40 | Cinder Sea | 95 | 23 | 42 | 7.6 | 4 | 5 | 5 | 7 | 9 | 9.5 | 9 |
| 41 | Heat Crown | 95 | 23 | 42 | 7.8 | 3 | 5 | 5 | 7 | 9 | 10 | 9 |
| 42 | Pyre Peak | 98 | 23 | 42 | 8.0 | 3 | 6.5 | 5 | 8 | 8 | 10 | 8 |
| 43 | Solar Fury | 98 | 23 | 42 | 8.2 | 3 | 6.5 | 5 | 8 | 8 | 10.5 | 8 |
| 44 | Blazing Zenith | 100 | 23 | 42 | 8.4 | 3 | 6.5 | 5 | 8 | 8 | 10.5 | 8 |
| 45 | Groundhog Day | 105 | 23 | 41 | 8.6 | 3 | 6.5 | 5 | 8 | 7 | 11 | 8 |
| 46 | Extended Winter | 110 | 23 | 40 | 8.1 | 3 | 7 | 4 | 6 | 9 | 11.5 | 7 |
| 47 | Shadow Season | 115 | 23 | 39 | 8.8 | 3 | 7 | 4 | 6 | 7 | 12 | 7 |
| 48 | Eternal Frost | 120 | 21 | 40 | 9.0 | 3 | 7 | 4 | 6 | 7 | 12 | 7 |

---

## 8. Unlocks, upgrades, Santa's gifts, the gift slot

**Unlocks — one every 3 levels.** A day grants every entry with `level ≤ day number`
(the day you reach it, it's yours; the start-of-level banner announces new ones):

| Day | Grants | Detail |
|---|---|---|
| 1 | ☁️ Cloud spell | |
| 4 | ❄️ Snow | |
| 7 | 💨 Wind | |
| 10 | 🌧️ Rain | |
| 13 | 🧊 Frost Nova | |
| 16 | FLUFFY CLOUDS | cloud life ×1.5 |
| 19 | GALE FORCE | wind ×2 dps, +2 burst, fireballs weakened ×0.25 |
| 22 | HEAVY SNOWFALL | snow ×1.7 dps, +20% duration |
| 25 | 🎅 CHRISTMAS! | Santa event (not an upgrade) |
| 28 | DOWNPOUR | rain ×1.4 |
| 31 | COLD SNAP | nova ×1.3, cooldown ×0.8 |
| 34 | WINTER'S EMBRACE | ambient +0.25°F/s · cloud life ×1.4 |
| 37 | BLIZZARD HEART | snow ×1.5 more |
| 40 | STORM FRONT | wind ×3, +5 burst, blows fireballs away |
| 43 | DEEP FREEZE | nova ×1.25 more |
| 46 | WINTER'S ETERNAL GRIP | ambient +0.5°F/s (bonus tier power spike) |

Multipliers are cumulative (e.g. cloud life 14 → 21 → 29.4s; nova 8 → 10.4 → 13°F).

**Santa (day 25):** spawns at p ≥ 0.78, flies left→right near the top with 🛷+🎅,
drops one wrapped 🎁 at mid-screen. The gift falls, lands on the snow, waits **9s**
(catchable mid-air or grounded, click radius 48px). Uncollected → melts ("THE GIFT
MELTED AWAY... 😢"). Weighted roll: ☕ Hot Cocoa 45% · 🔮 Magic Snow Globe 40% · 🔦 Flashlight 15%.

**The gift slot (key 6, always visible on the spell bar):**
- Holds **exactly what Santa last gave you**. Persisted in the save across levels/sessions.
- ☕ (×1): use → temp resets to the day's starting temp. 🔮 (×1): use → Frost Nova
  cooldown instantly cleared + a glow ring on the nova button. Both consumed on use.
- 🔦 (∞): never consumed. Using it: on day 45 with the groundhog on screen → §9.
  Otherwise a flavor glow ("the flashlight glows steadily... something about day 45?").
- **Entering day 25 resets the slot to the wrapped 🎁** (a fresh catch is coming; the
  empty slot pulses on Christmas day); the catch refills it persistently.
- Empty slot: dimmed 🎁 + 🎅 hint; pressing 6 → "NO GIFT HELD — SANTA VISITS DAY 25 🎅".
- Icons: slot shows the held gift's own emoji (☕/🔮/🔦), never a generic 🎁, when held.
- Day-25 end screen reports the catch (or the melt). Level-select shows held indicators.
- Toasts are **deduplicated by message** (rapid repeat clicks refresh the one toast; max 2 stacked).

## 9. Groundhog finale (day 45) — active flashlight moment

- At p ≥ 0.35 a 🦫 wanders out and crosses the snow **left→right at exactly 2× the
  sun's x-speed** (sun x-speed = 1.28·W/day). Visible roughly half the day; hops
  off-screen right if ignored.
- Banner while visible: "🦫 THE GROUNDHOG! PRESS 6 — SHINE YOUR FLASHLIGHT!" if the
  🔦 is held, else a teaser.
- **Use the flashlight while he's on screen** → he leaps (hop arc + panicked 💨),
  flees home **right→left at 3× speed**, and *"HE SAW HIS SHADOW! WINTER EXTENDED! ❄"*
  — **bonus days 46–48 unlock instantly** (persisted; even if you lose the day).
- Win ceremony shows 🦫 rising from a snow mound: shadow variant ("HE SEES HIS
  SHADOW! WINTER EXTENDED — 3 BONUS DAYS UNLOCKED!") when the hog was scared this
  run or the bonus save flag is set; otherwise "NO SHADOW... SPRING LOOMS." plus
  the hint "(Catch Santa's 🔦 on day 25 — then USE it while the groundhog is on screen!)".
- The flashlight flag is permanent once caught, but the **scare requires the 🔦 in
  the slot** — don't overwrite it with a later consumable.

---

## 10. Save (localStorage key `winter-wizard-save-v1`)

```json
{ "stars": { "<level>": 0–3, ... },
  "flashlight": false, "bonus": false, "completed": false,
  "gift": "cocoa" | "globe" | "flashlight" | null,
  "giftMigrated": false }
```
- `flashlight` = permanent finale key (set the moment the 🔦 is ever caught).
- `bonus` = extended winter unlocked (set by the groundhog scare).
- Load validates/clamps everything; corrupt or missing storage → fresh defaults, game still runs.
- One-time migration: old saves with the flashlight flag but no gift get
  `gift: "flashlight"` once (`giftMigrated` prevents resurrection after the slot is used).
- Level unlock rules: day 1 always; days 2–45 need stars(n−1) ≥ 1;
  days 46–48 need `bonus && (n === 46 || stars(n−1) ≥ 1)`.
- Level select: 12-column grid, days 46–48 appear only when unlocked and sit **flush
  in the same rows**; shows stars, total, 🔦 SECRET HELD, and the held-gift indicator;
  includes a RESET SAVE button.

---

## 11. Rendering specification

**Style:** retro-arcade — bold Courier New, chunky outlined panels, scanline overlay
(4px pattern at low alpha), vignette, plus emoji sprites via `fillText`
(🔥❄️💨🌧️🧊☁️🎅🛷🎁☕🔮🔦🦫🏰🧙🌲🎄⭐). **Double-print emoji** (draw twice, same spot)
so soft emoji-font pixels read as solid — used for castle, wizard, fresh clouds.
Keep colors consistent: panels `#101c3c`-ish with `#7fd4ff` borders, gold `#ffd94a`
accents, warning `#ff8080`, icy `#9fdcff`.

**Play screen — draw in EXACTLY this order** (later = on top):
1. Sky (gradient by day progress: night→dawn→day→dusk + red anger wash past 0.45; twinkling stars at edges)
2. Mountains (two silhouette layers)
3. Ground (snow gradient, humps, 🌲 trees, one 🎄; deterministic decor)
4. 🦫 Groundhog (if active — before lane effects)
5. Cloud **ground shadows** (ellipse on the snow, leaning away from the sun by `(cloudX−sunX)/W`; fades in sync with its cloud)
6. Lane weather (snow ❄️ falling from the cloud, rain streaks, wind 💨 + streaks **below the cloud band**)
7. Fireballs 🔥 (bezier pos; target ring dims when lane guarded)
8. Blasts (charge: orange lane wash + ⚠️/🔥 above the lane; beam: orange column sun→ground, ☀️ at impact)
9. Stun rays (charge: dashed line + reticle at cloud-or-castle; beam: jagged lightning — icy-blue, **stops at the blocking cloud** with ☁️ at impact, or yellow to the castle)
10. Santa (🛷+🎅 + trail) and gifts (falling/landed 🎁 with ❕ pulse; sparkle while waiting)
11. The sun (rotating rays, radial-gradient body, expressive face per anger tier, charge glow + ⚡ when blasting)
12. Nova flash (white-blue wash + 🧊 + expanding ring; drawn above sun, below clouds)
13. **☁️ Clouds** — top-most scene layer: big emoji (~95% lane width, ≤185px), pop-in on birth, double-printed while healthy, fading as they melt; 🌧️ badge when raining
14. Particle bursts (sparks, 🔥 splashes, 💨 puffs, confetti ❄️✨⭐)
15. **🏰 Castle + 🧙 wizard** (never painted over; wizard wand-✨ on cast; 🔒 overhead while stunned)
16. Lane targeting overlay (dashed column, red when the cast would fail, ghost spell emoji)
17. HUD · 18. Spell bar · 19. Toasts · 20. Unlock banner · 21. Santa/groundhog banners

**HUD (top strip):** thermometer bar (segments lit by temp/limit; ❄ tick at 30°F goal,
⚠ tick at warn; **green → orange past goal → red past warn**, flashing near limit),
`NN°F` readout + `LIMIT NN°F`; day-progress bar with ☀️ marker and seconds left;
`DAY n · NAME`; live 3-star tracker (gold stars, lost ones dimmed orange/red) + `PEAK NN°F`.

**Spell bar (bottom):** one button per unlocked spell (icon, key number, cooldown pie,
🔒 while stunned, selected highlight) + the always-visible gift slot (§8).

**Screens:** Title (wizard alone, falling ❄️, angry sun cameo, controls blurb) →
Level select → Play → Win/Lose. Win: star pop animation (0.25s stagger), breakdown
(Peak/Goal/Warn lines, gift line on day 25, groundhog ceremony on 45), buttons
↺ RETRY / NEXT DAY ▶ / ☀ MAP. Lose: "MELTDOWN!", taunt line, peak stats.
Pause overlay (P). Mute with M.

---

## 12. Input & audio

- **Mouse/touch:** clicks anywhere in a lane column (sky or ground) cast the selected
  spell at that lane; gifts are clickable first (radius 48); spell bar buttons; select/end-screen buttons.
- **Keys:** `1–5` select/cast spells (5 = cast Nova instantly), `6` use gift,
  `P`/`Esc` pause, `M` mute, `R` restart day, `Enter` confirm on title.
- **Audio:** tiny WebAudio oscillator bleeps (square/sine/saw), arpeggio chords for
  events; zero audio files; graceful if unavailable.

---

## 13. Balance targets & validation (verify your rebuild headlessly)

Write bot harnesses that drive the game logic headlessly (no DOM rendering) and check:

- **Day 1 idle (no input):** survives with 1★, peak ≈ 43–44°F. Day 2 idle ≈ 44°F.
  Day 3 idle = meltdown loss. Attentive 5-cloud play on days 1–2: 3★ at 25–28°F peak.
- **Expert bot** (castle lane first, spread 5 lanes, refresh most-melted cloud at <45%
  life, snow/wind/rain/nova spam off cooldown, ~3 reactions/sec): clears **47–48 of 48**.
  3★ common early, 2★ the norm late (peaks 30–36°F), rare on bonus days.
- **Casual bot** (reactive: one action per 0.75s, cools only when temp > limit−14):
  ~34–45 of 48 with scattered, retryable walls.
- **Human-profile bot** on the bonus tier (10–30 runs): day 46 ≈ 73% wins,
  day 47 ≈ 63%, day 48 ≈ 40–45% with **near-miss losses** (peaks 1–2°F over limit).
- Regression checks: blocked rays stop at the cloud; guarded-lane fireballs never
  reach the ground; no cast works while stunned; wand lock gates throughput; gift
  slot persists across levels/reloads; day-25 slot reset; groundhog scare unlocks
  bonus instantly (even on a subsequent loss); stars follow the peak formula.

**Design intent:** the flat 5-cloud cap means 2 of 7 lanes always burn, so the heat
curve is the real difficulty dial; the wand recharge stops tool-spam from out-cooling
the sun; cooling costs (snow drain, rain dissolve, nova's cooldown) mean over-cooling
trades against coverage; 3★ late is a proactive-cooling award, not a reactive one.
The bonus tier is the mastery exam, armed by Winter's Eternal Grip.
