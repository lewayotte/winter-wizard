/* ============================================================
   WINTER WIZARD — levels.js
   All level definitions, spells, unlocks & tuning constants.
   PURE DATA ONLY — no logic.

   Temperature scale: °F winter. Days start cold (~20°F), the
   "average winter" goal line is 30°F (WW.CONST.AVG_WINTER),
   and a day is lost when temp exceeds the level limit — set
   10-16° above the winter average, tightening as days go on.
   ============================================================ */
window.WW = window.WW || {};

/* ---------------- Global tuning ---------------- */
WW.CONST = {
  LANES: 7,             // vertical sky lanes
  CASTLE_LANE: 3,       // castle + wizard stand centered on the ground (stun rays aim here)

  AVG_WINTER: 30,       // °F — the winter we are defending (goal line)

  CLOUD_LIFE: 14,       // seconds of cloud life under full sun (fast melt = fast recycling)
  CLOUD_CD: 2.2,       // cloud spell cooldown (s)
  CLOUDS_MAX: 5,       // flat cap all game: 5 of 7 lanes coverable — the sun always burns somewhere
  WAND_LOCK: 0.6,      // wand recharge after every cast: caps spell throughput (anti-spam)
  SNOW_DRAIN: 2,       // snowing sifts this much life (s) out of its source cloud
  FIRE_CLOUD_DMG: 6,    // cloud life (s) burned per fireball hit
  FIRE_FLIGHT: 1.5,     // fireball air time (s)

  SNOW_DUR: 6,  SNOW_DPS: 0.5,   SNOW_CD: 4,
  WIND_DUR: 4,  WIND_DPS: 0.35,  WIND_BURST: 1,  WIND_CD: 5,
  RAIN_DUR: 4,  RAIN_DPS: 1.4,   RAIN_CD: 9,
  NOVA_DROP: 8,

  PASSIVE_COOL: 0.1,    // ambient cooling, °F/s
  WEAKEN: 0.5,         // fireball payload multiplier when wind gusting in lane

  RAY_CHARGE: 1.0,      // stun ray telegraph (s)
  RAY_GRACE: 4.0,       // after a stun hits, the sun holds its next ray (s) — no chain-stuns
  BLAST_CHARGE: 2.5,    // heat blast telegraph (s)
  BLAST_LEAK: 0.5,      // fraction of blastTemp that leaks through a lone cloud

  SANTA_TIME: 0.78,     // day progress when Santa appears (level 25)
  HOG_TIME: 0.35,       // day progress when the groundhog emerges (level 45)
  GIFT_LIFE: 9,         // seconds a gift waits on the ground

  MIN_TEMP: -10,       // temperature floor (°F)
};

/* ---------------- Spells ---------------- */
WW.SPELLS = {
  cloud: { name: 'CLOUD', icon: '☁️', key: '1',
           hint: 'Place over a lane. Blocks sunlight & fireballs, casts cooling shade.' },
  snow:  { name: 'SNOW', icon: '❄️', key: '2',
           hint: 'Snows under a cloud, cooling the land.' },
  wind:  { name: 'WIND', icon: '💨', key: '3',
           hint: 'Cold gust: cools a lane & weakens fireballs.' },
  rain:  { name: 'RAIN', icon: '🌧️', key: '4',
           hint: 'Big chill from a cloud — dissolves it!' },
  nova:  { name: 'NOVA', icon: '🧊', key: '5',
           hint: 'Screen-wide deep freeze. Long cooldown.' },
};
WW.SPELL_ORDER = ['cloud', 'snow', 'wind', 'rain', 'nova'];

/* ---------------- Unlocks (one every 3 levels) ---------------- */
WW.UNLOCKS = [
  { level: 1,  type: 'spell',   id: 'cloud',     icon: '☁️', name: 'CLOUD',      desc: 'Block sunlight & fireballs over any lane.' },
  { level: 4,  type: 'spell',   id: 'snow',      icon: '❄️', name: 'SNOW',       desc: 'It can only snow under clouds.' },
  { level: 7,  type: 'spell',   id: 'wind',      icon: '💨', name: 'WIND',       desc: 'Cold air over the land. Weakens fireballs.' },
  { level: 10, type: 'spell',   id: 'rain',      icon: '🌧️', name: 'RAIN',       desc: 'Huge temp drop — but dissolves its cloud.' },
  { level: 13, type: 'spell',   id: 'nova',      icon: '🧊', name: 'FROST NOVA', desc: 'Emergency screen-wide freeze.' },
  { level: 16, type: 'upgrade', id: 'cloudUp1',   icon: '☁️', name: 'FLUFFY CLOUDS', desc: 'Clouds last 50% longer.' },
  { level: 19, type: 'upgrade', id: 'windUp1',    icon: '💨', name: 'GALE FORCE',   desc: 'Wind cools more & nearly douses fireballs.' },
  { level: 22, type: 'upgrade', id: 'snowUp1',    icon: '❄️', name: 'HEAVY SNOWFALL', desc: 'Snow cools 70% harder, lasts longer.' },
  { level: 25, type: 'special', id: 'santa',      icon: '🎅', name: 'CHRISTMAS!',   desc: 'Santa flies by near dusk. Catch his gift!' },
  { level: 28, type: 'upgrade', id: 'rainUp1',    icon: '🌧️', name: 'DOWNPOUR',     desc: 'Rain cools 40% more.' },
  { level: 31, type: 'upgrade', id: 'novaUp1',    icon: '🧊', name: 'COLD SNAP',    desc: 'Frost Nova chills harder, recharges faster.' },
  { level: 34, type: 'upgrade', id: 'embraceUp',  icon: '❄️', name: "WINTER'S EMBRACE", desc: 'Ambient cooling +0.25°F/s · clouds last 40% longer.' },
  { level: 37, type: 'upgrade', id: 'snowUp2',    icon: '❄️', name: 'BLIZZARD HEART', desc: 'Snow cools even more.' },
  { level: 40, type: 'upgrade', id: 'windUp2',    icon: '💨', name: 'STORM FRONT',  desc: 'Wind blows fireballs clean away.' },
  { level: 43, type: 'upgrade', id: 'novaUp2',    icon: '🧊', name: 'DEEP FREEZE',  desc: 'Frost Nova is brutally cold.' },
  { level: 46, type: 'upgrade', id: 'gripUp',     icon: '❄️', name: "WINTER'S ETERNAL GRIP", desc: 'Ambient cooling +0.5°F/s — the extended winter itself fights for you.' },
];

/* Upgrade effects (multipliers are cumulative) */
WW.UPGRADE_FX = {
  cloudUp1: { cloudLifeMul: 1.5 },
  embraceUp: { cloudLifeMul: 1.4, ambientAdd: 0.25 },
  snowUp1:  { snowDpsMul: 1.7, snowDurMul: 1.2 },
  snowUp2:  { snowDpsMul: 1.5 },
  windUp1:  { windDpsMul: 2.0, windBurstAdd: 2, weakenMul: 0.5 },
  windUp2:  { windDpsMul: 3.0, windBurstAdd: 5, weakenMul: 0.0, blowAway: true },
  rainUp1:  { rainDpsMul: 1.4 },
  novaUp1:  { novaMul: 1.3, novaCdMul: 0.8 },
  novaUp2:  { novaMul: 1.25 },
  gripUp:   { ambientAdd: 0.5 },
};

/* ---------------- Santa's gifts (level 25) ---------------- */
WW.GIFTS = {
  cocoa:      { icon: '☕', name: 'HOT COCOA',       weight: 45, desc: 'Full temperature reset!' },
  globe:      { icon: '🔮', name: 'MAGIC SNOW GLOBE', weight: 40, desc: 'Frost Nova instantly recharged!' },
  flashlight: { icon: '🔦', name: 'FLASHLIGHT',      weight: 15, desc: '???' },
};

/* ============================================================
   LEVELS — 45 main days + 3 bonus "extended winter" days.
   day:    seconds sunrise→sunset
   start:  dawn temperature (°F)      limit: meltdown threshold (°F)
   heat:   °F/s at full sun, zero cloud cover
   fire:   avg seconds between fireballs (0 = none)   fireTemp: spike on land
   ray:    avg seconds between stun rays (0 = none)   rayDur: stun lock (s)
   blast:  avg seconds between heat blasts (0 = none)  blastTemp: spike
   novaCd: Frost Nova cooldown
   special: '' | 'christmas' | 'finale' | 'bonus'
   ============================================================ */
WW.LEVELS = [
  { name: 'First Frost',        day: 40,  start: 20, limit: 46, heat: 1.0,  fire: 0,  fireTemp: 0,   ray: 0,  rayDur: 0,  blast: 0,  blastTemp: 0,  novaCd: 30, special: '' },
  { name: 'Cold Shoulder',      day: 42,  start: 20, limit: 46, heat: 1.0,  fire: 0,  fireTemp: 0,   ray: 0,  rayDur: 0,  blast: 0,  blastTemp: 0,  novaCd: 30, special: '' },
  { name: 'Sunbeams',           day: 45,  start: 20, limit: 46, heat: 1.1,  fire: 18, fireTemp: 1.5, ray: 0,  rayDur: 0,  blast: 0,  blastTemp: 0,  novaCd: 28, special: '' },
  { name: 'Light Flurries',     day: 48,  start: 20, limit: 46, heat: 1.2,  fire: 15, fireTemp: 2,   ray: 0,  rayDur: 0,  blast: 0,  blastTemp: 0,  novaCd: 28, special: '' },
  { name: 'Melting Point',      day: 50,  start: 20, limit: 46, heat: 1.3,  fire: 14, fireTemp: 2,   ray: 0,  rayDur: 0,  blast: 0,  blastTemp: 0,  novaCd: 26, special: '' },
  { name: 'Scorch Watch',       day: 52,  start: 20, limit: 46, heat: 1.4,  fire: 13, fireTemp: 2,   ray: 0,  rayDur: 0,  blast: 0,  blastTemp: 0,  novaCd: 26, special: '' },
  { name: 'Solar Flare',        day: 55,  start: 20, limit: 46, heat: 2.0,  fire: 12, fireTemp: 2,   ray: 18, rayDur: 4,  blast: 0,  blastTemp: 0,  novaCd: 24, special: '' },
  { name: 'Ray of Trouble',     day: 55,  start: 20, limit: 46, heat: 2.2,  fire: 12, fireTemp: 2.5, ray: 16, rayDur: 4,  blast: 0,  blastTemp: 0,  novaCd: 24, special: '' },
  { name: 'Heat Wave',          day: 58,  start: 20, limit: 46, heat: 2.4,  fire: 11, fireTemp: 2.5, ray: 15, rayDur: 4,  blast: 0,  blastTemp: 0,  novaCd: 22, special: '' },
  { name: 'Burn Notice',        day: 58,  start: 20, limit: 45, heat: 2.6,  fire: 11, fireTemp: 2.5, ray: 14, rayDur: 5,  blast: 0,  blastTemp: 0,  novaCd: 22, special: '' },
  { name: 'Fire Drill',         day: 60,  start: 20, limit: 45, heat: 2.8,  fire: 10, fireTemp: 3,   ray: 13, rayDur: 5,  blast: 0,  blastTemp: 0,  novaCd: 20, special: '' },
  { name: 'Blaze March',        day: 60,  start: 20, limit: 45, heat: 3.0,  fire: 10, fireTemp: 3,   ray: 13, rayDur: 5,  blast: 0,  blastTemp: 0,  novaCd: 20, special: '' },
  { name: 'Nova Dawn',          day: 62,  start: 21, limit: 45, heat: 3.0,  fire: 10, fireTemp: 3,   ray: 12, rayDur: 5,  blast: 24, blastTemp: 3.5,  novaCd: 20, special: '' },
  { name: 'Charged Sky',        day: 62,  start: 21, limit: 45, heat: 3.2,  fire: 9,  fireTemp: 3,   ray: 12, rayDur: 5,  blast: 22, blastTemp: 4,  novaCd: 18, special: '' },
  { name: 'Piercing Light',     day: 65,  start: 21, limit: 45, heat: 3.5,  fire: 9,  fireTemp: 3,   ray: 11, rayDur: 5,  blast: 21, blastTemp: 4,  novaCd: 18, special: '' },
  { name: 'Big Flakes',         day: 65,  start: 21, limit: 45, heat: 3.7,  fire: 9,  fireTemp: 3,   ray: 11, rayDur: 5,  blast: 20, blastTemp: 4.5,  novaCd: 18, special: '' },
  { name: 'Solar Siege',        day: 68,  start: 21, limit: 45, heat: 3.9,  fire: 8,  fireTemp: 3,   ray: 10, rayDur: 5,  blast: 19, blastTemp: 4.5,  novaCd: 16, special: '' },
  { name: 'Gale Warning',       day: 68,  start: 21, limit: 44, heat: 4.1,  fire: 8,  fireTemp: 3.5, ray: 10, rayDur: 5,  blast: 18, blastTemp: 5,  novaCd: 16, special: '' },
  { name: 'Scorched Lane',      day: 70,  start: 21, limit: 44, heat: 4.3,  fire: 8,  fireTemp: 3.5, ray: 10, rayDur: 6,  blast: 18, blastTemp: 5,  novaCd: 16, special: '' },
  { name: 'Firestorm',          day: 70,  start: 21, limit: 44, heat: 4.5,  fire: 7,  fireTemp: 3.5, ray: 9,  rayDur: 6,  blast: 17, blastTemp: 5,  novaCd: 14, special: '' },
  { name: 'Stun Spectrum',      day: 72,  start: 21, limit: 44, heat: 4.7,  fire: 7,  fireTemp: 3.5, ray: 9,  rayDur: 6,  blast: 16, blastTemp: 5.5,  novaCd: 14, special: '' },
  { name: 'Heavy Sky',          day: 72,  start: 21, limit: 44, heat: 4.9,  fire: 7,  fireTemp: 4,   ray: 9,  rayDur: 6,  blast: 16, blastTemp: 5.5,  novaCd: 14, special: '' },
  { name: 'Blister Bowl',       day: 75,  start: 21, limit: 44, heat: 5.1,  fire: 7,  fireTemp: 4,   ray: 8,  rayDur: 6,  blast: 15, blastTemp: 5.5,  novaCd: 14, special: '' },
  { name: 'Meltwater',          day: 75,  start: 21, limit: 44, heat: 5.3,  fire: 6,  fireTemp: 4,   ray: 8,  rayDur: 6,  blast: 15, blastTemp: 5.5,  novaCd: 12, special: '' },
  { name: 'Christmas Morning',  day: 78,  start: 22, limit: 44, heat: 5.2,  fire: 7,  fireTemp: 3,   ray: 9,  rayDur: 5,  blast: 18, blastTemp: 4.5,  novaCd: 12, special: 'christmas' },
  { name: 'Ember Tide',         day: 78,  start: 22, limit: 44, heat: 5.5,  fire: 6,  fireTemp: 4,   ray: 8,  rayDur: 6,  blast: 14, blastTemp: 5.5, novaCd: 12, special: '' },
  { name: 'Furnace Wind',       day: 78,  start: 22, limit: 44, heat: 5.7,  fire: 6,  fireTemp: 4.5, ray: 8,  rayDur: 6,  blast: 14, blastTemp: 6, novaCd: 12, special: '' },
  { name: 'Pyre Plane',        day: 80,  start: 22, limit: 44, heat: 5.9,  fire: 6,  fireTemp: 4.5, ray: 7,  rayDur: 6,  blast: 13, blastTemp: 6, novaCd: 11, special: '' },
  { name: 'Kiln Sky',           day: 80,  start: 22, limit: 44, heat: 5.6,  fire: 6,  fireTemp: 4.5, ray: 7,  rayDur: 6,  blast: 13, blastTemp: 6.5, novaCd: 11, special: '' },
  { name: 'Flashover',         day: 82,  start: 22, limit: 44, heat: 5.8,  fire: 5,  fireTemp: 4.5, ray: 7,  rayDur: 6,  blast: 13, blastTemp: 6.5, novaCd: 11, special: '' },
  { name: 'Sun Scorn',         day: 82,  start: 22, limit: 43, heat: 6.0,  fire: 5,  fireTemp: 4.5, ray: 7,  rayDur: 6,  blast: 12, blastTemp: 7, novaCd: 10, special: '' },
  { name: 'Radiant Wrath',     day: 85,  start: 22, limit: 43, heat: 6.2,  fire: 5,  fireTemp: 4.5, ray: 6,  rayDur: 7,  blast: 12, blastTemp: 7, novaCd: 10, special: '' },
  { name: 'Furnace March',     day: 85,  start: 22, limit: 43, heat: 6.3,  fire: 5,  fireTemp: 4.5, ray: 6,  rayDur: 7,  blast: 11, blastTemp: 7, novaCd: 10, special: '' },
  { name: 'Twin Suns',         day: 88,  start: 22, limit: 43, heat: 6.5,  fire: 5,  fireTemp: 4.5, ray: 6,  rayDur: 7,  blast: 11, blastTemp: 7, novaCd: 10, special: '' },
  { name: 'Heat Haze',         day: 88,  start: 22, limit: 43, heat: 6.7,  fire: 4,  fireTemp: 4.5, ray: 6,  rayDur: 7, blast: 11, blastTemp: 7.5, novaCd: 10, special: '' },
  { name: 'Blaze Alliance',    day: 90,  start: 22, limit: 43, heat: 6.9,  fire: 4,  fireTemp: 5,   ray: 6,  rayDur: 7, blast: 10, blastTemp: 7.5, novaCd: 10, special: '' },
  { name: 'Inferno Lane',      day: 90,  start: 23, limit: 43, heat: 7.1,  fire: 4,  fireTemp: 5,   ray: 5,  rayDur: 7, blast: 10, blastTemp: 9, novaCd: 9,  special: '' },
  { name: 'Magma Morn',        day: 92,  start: 23, limit: 43, heat: 7.3,  fire: 4,  fireTemp: 5,   ray: 5,  rayDur: 7, blast: 10, blastTemp: 9, novaCd: 9,  special: '' },
  { name: 'Furnace Gate',      day: 92,  start: 23, limit: 43, heat: 7.5,  fire: 4,  fireTemp: 5,   ray: 5,  rayDur: 7, blast: 9,  blastTemp: 9.5, novaCd: 9,  special: '' },
  { name: 'Cinder Sea',        day: 95,  start: 23, limit: 42, heat: 7.6,  fire: 4,  fireTemp: 5,   ray: 5,  rayDur: 7, blast: 9,  blastTemp: 9.5, novaCd: 9,  special: '' },
  { name: 'Heat Crown',        day: 95,  start: 23, limit: 42, heat: 7.8,  fire: 3,  fireTemp: 5,   ray: 5,  rayDur: 7, blast: 9,  blastTemp: 10, novaCd: 9,  special: '' },
  { name: 'Pyre Peak',         day: 98,  start: 23, limit: 42, heat: 8.0,  fire: 3,  fireTemp: 6.5, ray: 5,  rayDur: 8, blast: 8,  blastTemp: 10, novaCd: 8,  special: '' },
  { name: 'Solar Fury',        day: 98,  start: 23, limit: 42, heat: 8.2,  fire: 3,  fireTemp: 6.5, ray: 5,  rayDur: 8, blast: 8,  blastTemp: 10.5, novaCd: 8,  special: '' },
  { name: 'Blazing Zenith',    day: 100, start: 23, limit: 42, heat: 8.4,  fire: 3,  fireTemp: 6.5, ray: 5,  rayDur: 8, blast: 8,  blastTemp: 10.5, novaCd: 8,  special: '' },
  { name: 'Groundhog Day',     day: 105, start: 23, limit: 41, heat: 8.6,  fire: 3,  fireTemp: 6.5, ray: 5,  rayDur: 8, blast: 7,  blastTemp: 11, novaCd: 8,  special: 'finale' },
  /* ---- BONUS: extended winter (unlocked by the flashlight secret) ---- */
  { name: 'Extended Winter',   day: 110, start: 23, limit: 40, heat: 8.1,  fire: 3,  fireTemp: 7,   ray: 4,  rayDur: 6, blast: 9,  blastTemp: 11.5, novaCd: 7,  special: 'bonus' },
  { name: 'Shadow Season',     day: 115, start: 23, limit: 39, heat: 8.8,  fire: 3,  fireTemp: 7,   ray: 4,  rayDur: 6, blast: 7,  blastTemp: 12, novaCd: 7,  special: 'bonus' },
  { name: 'Eternal Frost',     day: 120, start: 21, limit: 40, heat: 9.0,  fire: 3,  fireTemp: 7,   ray: 4,  rayDur: 6, blast: 7,  blastTemp: 12, novaCd: 7,  special: 'bonus' },
];

WW.MAIN_LEVELS = 45;
WW.TOTAL_LEVELS = WW.LEVELS.length;
