# Winter Wizard — Design Decisions

Where the brief was open-ended, these arcade-style calls were made:

## Scope & Levels
- **48 levels, not 60**: 60 felt like padding; the curve stays tight at 45 main days + 3 bonus days. Every level is literal data in `levels.js`.
- **Bonus days 46–48** are the "winter extended" levels from the Groundhog finale, unlocked only by holding the flashlight (secret Santa gift) when finishing day 45.
- Day 1 is idle-survivable (soft tutorial); idling stops working around day 3–4.

## Spells & Unlocks
- One unlock every 3 levels: Clouds → Snow (L4) → Wind (L7) → Rain (L10) → Frost Nova (L13), then 10 upgrades (L16–L43). Christmas (L25) itself is a special event, not an upgrade.
- **7 vertical sky lanes.** Clouds occupy a lane (max 2 stacked, cloud cap per level). Stacking soaks a fireball or a heat blast but doesn't double block sunlight.
- **Snow/Rain** require a cloud in the target lane ("it can only snow under clouds"). Wind and Nova are free-target.
- Rain *dissolves the exact cloud it fell from* (tracked even if new clouds stack above it).
- Nova is cast instantly (button or key `5`), no lane click.
- Wizard has no mana — only per-spell cooldowns. Simpler arcade loop; pressure comes from cooldown management.

## The Sun's Threats
- **Fireballs** lob at random lanes; a cloud in the lane absorbs the hit (cloud takes damage instead of the temperature). Wind in the lane weakens the payload ×0.5 (upgrades: ×0.25, then blows them out of the sky entirely).
- **Stun rays** always target the wizard's castle lane (lane 0); blocked if that lane has any cloud. On hit they lock one random ready spell. "No stun hits" is the 3rd star, so castle cover matters all day.
- **Heat blasts** charge ~2.5s with a warning, then pierce: 2+ stacked clouds = fully blocked (lose one cloud), a lone cloud = destroyed + 50% temp leak, no cloud = full spike.
- The sun attacks only while elevated, and **schedules faster the angrier it gets** (anger = temperature ratio + how much sky you've clouded).
- Sun face is drawn shapes (brows/mouth/steam) over an emoji-palette body — happy → annoyed → furious, plus a nervous sweat drop when you're winning.

## Temperature
- One global thermometer per level. Heating = `levelHeat × sunElevation × (1 − cloudCoverage)`. Passive ambient cooling 0.3°/s.
- Exceeding the limit at ANY point before sunset = instant meltdown loss.
- Stars: survive = 1★, finish ≥10° under limit = 2★, no stun hits = 3★.

## Christmas (Day 25)
- Santa 🎅 flies across at ~78% of the day and drops one weighted-random gift: ☕ Hot Cocoa 45% (full temp reset), 🔮 Magic Snow Globe 40% (Nova cooldown reset), 🔦 Flashlight 15% (secret).
- Gift waits 9s on the ground; click it before it melts. The flashlight persists in the save.

## Groundhog Finale (Day 45)
- Survive the day → 🦫 pops up. Holding the flashlight (from any run, saved in localStorage) → he sees his shadow → "winter extended" → bonus days unlock. Without it, a hint nudges replaying day 25 for the secret.

## Presentation & Tech
- Vanilla JS + Canvas 2D, zero dependencies, no build step. Canvas fills the window (responsive, DPR-aware); clicks are handled in screen coordinates.
- Retro look: chunky monospace UI, scanlines, vignette, pixel-ish panels — mixed with emoji sprites (🔥❄️💨🌧️🧊☃️) via fillText. Clouds are drawn shapes so damage states read clearly.
- Minimal WebAudio bleeps (no files); `M` mutes, `P` pauses, `R` restarts, `1–5` select spells.
- Progress (stars, flashlight, bonus unlock) in localStorage, gracefully degrading if storage is unavailable.
- Balance was validated headlessly: a mediocre bot clears 47/48 days; day 48 is the boss.
