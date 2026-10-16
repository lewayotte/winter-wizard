/* ============================================================
   WINTER WIZARD — levels.js
   All level definitions, spells, unlocks & tuning constants.
   PURE DATA ONLY — no logic.
   ============================================================ */
window.WW = window.WW || {};

/* ---------------- Global tuning ---------------- */
WW.CONST = {
  LANES: 7,             // vertical sky lanes
  CASTLE_LANE: 0,       // wizard's lane (stun rays aim here)

  CLOUD_LIFE: 20,       // seconds of cloud life under full sun
  CLOUD_CD: 2.2,        // cloud spell cooldown (s)
  CLOUD_STACK: 2,       // max clouds stacked per lane
  FIRE_CLOUD_DMG: 6,    // cloud life (s) burned per fireball hit
  FIRE_FLIGHT: 1.5,     // fireball air time (s)

  SNOW_DUR: 6,  SNOW_DPS: 1.5,  SNOW_CD: 4,
  WIND_DUR: 4,  WIND_DPS: 1.0,  WIND_BURST: 3,  WIND_CD: 5,
  RAIN_DUR: 4,  RAIN_DPS: 4.0,  RAIN_CD: 9,
  NOVA_DROP: 35,

  PASSIVE_COOL: 0.3,    // ambient cooling, deg/s
  WEAKEN: 0.5,         // fireball payload multiplier when wind gusting in lane

  RAY_CHARGE: 1.0,      // stun ray telegraph (s)
  BLAST_CHARGE: 2.5,    // heat blast telegraph (s)
  BLAST_LEAK: 0.5,      // fraction of blastTemp that leaks through a lone cloud

  SANTA_TIME: 0.78,     // day progress when Santa appears (level 25)
  GIFT_LIFE: 9,         // seconds a gift waits on the ground

  STAR2_MARGIN: 10,     // degrees under limit at sunset for the 2nd star
};

/* ---------------- Spells ---------------- */
WW.SPELLS = {
  cloud: { name: 'CLOUD', icon: '☁️', key: '1',
           hint: 'Place over a lane. Blocks sunlight & fireballs.' },
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
  { level: 34, type: 'upgrade', id: 'cloudUp2',   icon: '☁️', name: 'CLOUD FORT',   desc: '+3 max clouds, tougher clouds.' },
  { level: 37, type: 'upgrade', id: 'snowUp2',    icon: '❄️', name: 'BLIZZARD HEART', desc: 'Snow cools even more.' },
  { level: 40, type: 'upgrade', id: 'windUp2',    icon: '💨', name: 'STORM FRONT',  desc: 'Wind blows fireballs clean away.' },
  { level: 43, type: 'upgrade', id: 'novaUp2',    icon: '🧊', name: 'DEEP FREEZE',  desc: 'Frost Nova is brutally cold.' },
];

/* Upgrade effects (multipliers are cumulative) */
WW.UPGRADE_FX = {
  cloudUp1: { cloudLifeMul: 1.5 },
  cloudUp2: { cloudLifeMul: 1.25, extraClouds: 3 },
  snowUp1:  { snowDpsMul: 1.7, snowDurMul: 1.2 },
  snowUp2:  { snowDpsMul: 1.5 },
  windUp1:  { windDpsMul: 2.0, windBurstAdd: 2, weakenMul: 0.5 },
  windUp2:  { windDpsMul: 3.0, windBurstAdd: 5, weakenMul: 0.0, blowAway: true },
  rainUp1:  { rainDpsMul: 1.4 },
  novaUp1:  { novaMul: 1.3, novaCdMul: 0.8 },
  novaUp2:  { novaMul: 1.25 },
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
   start:  starting temperature          limit: lose temp
   heat:   deg/s at full sun, zero cloud cover
   fire:   avg seconds between fireballs (0 = none)   fireTemp: spike on land
   ray:    avg seconds between stun rays (0 = none)   rayDur: stun lock (s)
   blast:  avg seconds between heat blasts (0 = none)  blastTemp: spike
   cloudsMax: concurrent clouds allowed   novaCd: Frost Nova cooldown
   special: '' | 'christmas' | 'finale' | 'bonus'
   ============================================================ */
WW.LEVELS = [
  { name: 'First Frost',        day: 40,  start: 30, limit: 100, heat: 2.8,  fire: 0,  fireTemp: 0,  ray: 0,  rayDur: 0, blast: 0,  blastTemp: 0,  cloudsMax: 2,  novaCd: 30, special: '' },
  { name: 'Cold Shoulder',      day: 42,  start: 30, limit: 100, heat: 2.8,  fire: 0,  fireTemp: 0,  ray: 0,  rayDur: 0, blast: 0,  blastTemp: 0,  cloudsMax: 2,  novaCd: 30, special: '' },
  { name: 'Sunbeams',           day: 45,  start: 30, limit: 100, heat: 2.8,  fire: 16, fireTemp: 5,  ray: 0,  rayDur: 0, blast: 0,  blastTemp: 0,  cloudsMax: 2,  novaCd: 28, special: '' },
  { name: 'Light Flurries',     day: 48,  start: 32, limit: 100, heat: 3.0,  fire: 15, fireTemp: 5,  ray: 0,  rayDur: 0, blast: 0,  blastTemp: 0,  cloudsMax: 2,  novaCd: 28, special: '' },
  { name: 'Melting Point',      day: 50,  start: 32, limit: 100, heat: 3.2,  fire: 14, fireTemp: 6,  ray: 0,  rayDur: 0, blast: 0,  blastTemp: 0,  cloudsMax: 2,  novaCd: 26, special: '' },
  { name: 'Scorch Watch',       day: 52,  start: 32, limit: 100, heat: 3.4,  fire: 13, fireTemp: 6,  ray: 0,  rayDur: 0, blast: 0,  blastTemp: 0,  cloudsMax: 3,  novaCd: 26, special: '' },
  { name: 'Solar Flare',        day: 55,  start: 33, limit: 100, heat: 3.6,  fire: 12, fireTemp: 6,  ray: 18, rayDur: 4, blast: 0,  blastTemp: 0,  cloudsMax: 3,  novaCd: 24, special: '' },
  { name: 'Ray of Trouble',     day: 55,  start: 33, limit: 100, heat: 3.8,  fire: 12, fireTemp: 7,  ray: 16, rayDur: 5, blast: 0,  blastTemp: 0,  cloudsMax: 3,  novaCd: 24, special: '' },
  { name: 'Heat Wave',          day: 58,  start: 34, limit: 100, heat: 4.0,  fire: 11, fireTemp: 7,  ray: 15, rayDur: 5, blast: 0,  blastTemp: 0,  cloudsMax: 3,  novaCd: 22, special: '' },
  { name: 'Burn Notice',        day: 58,  start: 34, limit: 100, heat: 4.2,  fire: 11, fireTemp: 7,  ray: 14, rayDur: 5, blast: 0,  blastTemp: 0,  cloudsMax: 4,  novaCd: 22, special: '' },
  { name: 'Fire Drill',         day: 60,  start: 34, limit: 100, heat: 4.4,  fire: 10, fireTemp: 8,  ray: 13, rayDur: 5, blast: 0,  blastTemp: 0,  cloudsMax: 4,  novaCd: 20, special: '' },
  { name: 'Blaze March',        day: 60,  start: 35, limit: 100, heat: 4.6,  fire: 10, fireTemp: 8,  ray: 13, rayDur: 6, blast: 0,  blastTemp: 0,  cloudsMax: 4,  novaCd: 20, special: '' },
  { name: 'Nova Dawn',          day: 62,  start: 35, limit: 100, heat: 4.8,  fire: 10, fireTemp: 8,  ray: 12, rayDur: 6, blast: 24, blastTemp: 10, cloudsMax: 4,  novaCd: 20, special: '' },
  { name: 'Charged Sky',        day: 62,  start: 35, limit: 100, heat: 5.0,  fire: 9,  fireTemp: 8,  ray: 12, rayDur: 6, blast: 22, blastTemp: 11, cloudsMax: 5,  novaCd: 18, special: '' },
  { name: 'Piercing Light',     day: 65,  start: 35, limit: 100, heat: 5.2,  fire: 9,  fireTemp: 9,  ray: 11, rayDur: 6, blast: 21, blastTemp: 12, cloudsMax: 5,  novaCd: 18, special: '' },
  { name: 'Big Flakes',         day: 65,  start: 35, limit: 100, heat: 5.4,  fire: 9,  fireTemp: 9,  ray: 11, rayDur: 6, blast: 20, blastTemp: 12, cloudsMax: 5,  novaCd: 18, special: '' },
  { name: 'Solar Siege',        day: 68,  start: 36, limit: 100, heat: 5.6,  fire: 8,  fireTemp: 9,  ray: 10, rayDur: 6, blast: 19, blastTemp: 13, cloudsMax: 6,  novaCd: 16, special: '' },
  { name: 'Gale Warning',       day: 68,  start: 36, limit: 100, heat: 5.8,  fire: 8,  fireTemp: 10, ray: 10, rayDur: 6, blast: 18, blastTemp: 13, cloudsMax: 6,  novaCd: 16, special: '' },
  { name: 'Scorched Lane',      day: 70,  start: 36, limit: 100, heat: 6.0,  fire: 8,  fireTemp: 10, ray: 10, rayDur: 7, blast: 18, blastTemp: 14, cloudsMax: 6,  novaCd: 16, special: '' },
  { name: 'Firestorm',          day: 70,  start: 36, limit: 100, heat: 6.2,  fire: 7,  fireTemp: 10, ray: 9,  rayDur: 7, blast: 17, blastTemp: 14, cloudsMax: 6,  novaCd: 14, special: '' },
  { name: 'Stun Spectrum',      day: 72,  start: 36, limit: 100, heat: 6.4,  fire: 7,  fireTemp: 10, ray: 9,  rayDur: 7, blast: 16, blastTemp: 15, cloudsMax: 6,  novaCd: 14, special: '' },
  { name: 'Heavy Sky',          day: 72,  start: 36, limit: 98,  heat: 6.6,  fire: 7,  fireTemp: 11, ray: 9,  rayDur: 7, blast: 16, blastTemp: 15, cloudsMax: 7,  novaCd: 14, special: '' },
  { name: 'Blister Bowl',       day: 75,  start: 37, limit: 98,  heat: 6.8,  fire: 7,  fireTemp: 11, ray: 8,  rayDur: 7, blast: 15, blastTemp: 16, cloudsMax: 7,  novaCd: 14, special: '' },
  { name: 'Meltwater',          day: 75,  start: 37, limit: 98,  heat: 7.0,  fire: 6,  fireTemp: 11, ray: 8,  rayDur: 8, blast: 15, blastTemp: 16, cloudsMax: 7,  novaCd: 12, special: '' },
  { name: 'Christmas Morning',  day: 78,  start: 37, limit: 98,  heat: 6.2,  fire: 7,  fireTemp: 9,  ray: 9,  rayDur: 6, blast: 18, blastTemp: 12, cloudsMax: 7,  novaCd: 12, special: 'christmas' },
  { name: 'Ember Tide',         day: 78,  start: 37, limit: 98,  heat: 7.2,  fire: 6,  fireTemp: 11, ray: 8,  rayDur: 8, blast: 14, blastTemp: 16, cloudsMax: 7,  novaCd: 12, special: '' },
  { name: 'Furnace Wind',       day: 78,  start: 37, limit: 98,  heat: 7.4,  fire: 6,  fireTemp: 12, ray: 8,  rayDur: 8, blast: 14, blastTemp: 17, cloudsMax: 7,  novaCd: 12, special: '' },
  { name: 'Pyre Plane',        day: 80,  start: 38, limit: 98,  heat: 7.6,  fire: 6,  fireTemp: 12, ray: 7,  rayDur: 8, blast: 13, blastTemp: 17, cloudsMax: 7,  novaCd: 11, special: '' },
  { name: 'Kiln Sky',           day: 80,  start: 38, limit: 96,  heat: 7.8,  fire: 6,  fireTemp: 12, ray: 7,  rayDur: 8, blast: 13, blastTemp: 18, cloudsMax: 8,  novaCd: 11, special: '' },
  { name: 'Flashover',         day: 82,  start: 38, limit: 96,  heat: 8.0,  fire: 5,  fireTemp: 12, ray: 7,  rayDur: 9, blast: 13, blastTemp: 18, cloudsMax: 8,  novaCd: 11, special: '' },
  { name: 'Sun Scorn',         day: 82,  start: 38, limit: 96,  heat: 8.2,  fire: 5,  fireTemp: 13, ray: 7,  rayDur: 9, blast: 12, blastTemp: 19, cloudsMax: 8,  novaCd: 10, special: '' },
  { name: 'Radiant Wrath',     day: 85,  start: 38, limit: 96,  heat: 8.4,  fire: 5,  fireTemp: 13, ray: 6,  rayDur: 9, blast: 12, blastTemp: 19, cloudsMax: 8,  novaCd: 10, special: '' },
  { name: 'Furnace March',     day: 85,  start: 39, limit: 96,  heat: 8.6,  fire: 5,  fireTemp: 13, ray: 6,  rayDur: 9, blast: 11, blastTemp: 20, cloudsMax: 8,  novaCd: 10, special: '' },
  { name: 'Twin Suns',         day: 88,  start: 39, limit: 96,  heat: 8.8,  fire: 5,  fireTemp: 13, ray: 6,  rayDur: 9, blast: 11, blastTemp: 20, cloudsMax: 9,  novaCd: 10, special: '' },
  { name: 'Heat Haze',         day: 88,  start: 39, limit: 96,  heat: 9.0,  fire: 4,  fireTemp: 13, ray: 6,  rayDur: 10, blast: 11, blastTemp: 21, cloudsMax: 9, novaCd: 10, special: '' },
  { name: 'Blaze Alliance',    day: 90,  start: 39, limit: 94,  heat: 9.2,  fire: 4,  fireTemp: 14, ray: 6,  rayDur: 10, blast: 10, blastTemp: 21, cloudsMax: 9, novaCd: 10, special: '' },
  { name: 'Inferno Lane',      day: 90,  start: 39, limit: 94,  heat: 9.4,  fire: 4,  fireTemp: 14, ray: 5,  rayDur: 10, blast: 10, blastTemp: 22, cloudsMax: 9, novaCd: 9,  special: '' },
  { name: 'Magma Morn',        day: 92,  start: 40, limit: 94,  heat: 9.6,  fire: 4,  fireTemp: 14, ray: 5,  rayDur: 10, blast: 10, blastTemp: 22, cloudsMax: 10, novaCd: 9, special: '' },
  { name: 'Furnace Gate',      day: 92,  start: 40, limit: 94,  heat: 9.8,  fire: 4,  fireTemp: 14, ray: 5,  rayDur: 10, blast: 9,  blastTemp: 23, cloudsMax: 10, novaCd: 9, special: '' },
  { name: 'Cinder Sea',        day: 95,  start: 40, limit: 94,  heat: 10.0, fire: 4,  fireTemp: 14, ray: 5,  rayDur: 11, blast: 9,  blastTemp: 23, cloudsMax: 10, novaCd: 9, special: '' },
  { name: 'Heat Crown',        day: 95,  start: 40, limit: 92,  heat: 10.2, fire: 3,  fireTemp: 14, ray: 5,  rayDur: 11, blast: 9,  blastTemp: 24, cloudsMax: 10, novaCd: 9, special: '' },
  { name: 'Pyre Peak',         day: 98,  start: 40, limit: 92,  heat: 10.4, fire: 3,  fireTemp: 15, ray: 4,  rayDur: 11, blast: 8,  blastTemp: 24, cloudsMax: 10, novaCd: 8, special: '' },
  { name: 'Solar Fury',        day: 98,  start: 40, limit: 92,  heat: 10.6, fire: 3,  fireTemp: 15, ray: 4,  rayDur: 11, blast: 8,  blastTemp: 25, cloudsMax: 11, novaCd: 8, special: '' },
  { name: 'Blazing Zenith',    day: 100, start: 40, limit: 92,  heat: 10.8, fire: 3,  fireTemp: 15, ray: 4,  rayDur: 12, blast: 8,  blastTemp: 25, cloudsMax: 11, novaCd: 8, special: '' },
  { name: 'Groundhog Day',     day: 105, start: 40, limit: 90,  heat: 11.0, fire: 3,  fireTemp: 15, ray: 4,  rayDur: 12, blast: 7,  blastTemp: 25, cloudsMax: 12, novaCd: 8, special: 'finale' },
  /* ---- BONUS: extended winter (unlocked by the flashlight secret) ---- */
  { name: 'Extended Winter',   day: 110, start: 35, limit: 92,  heat: 11.5, fire: 3,  fireTemp: 16, ray: 4,  rayDur: 12, blast: 8,  blastTemp: 26, cloudsMax: 12, novaCd: 8, special: 'bonus' },
  { name: 'Shadow Season',     day: 115, start: 35, limit: 90,  heat: 12.0, fire: 3,  fireTemp: 16, ray: 3,  rayDur: 12, blast: 7,  blastTemp: 27, cloudsMax: 12, novaCd: 7, special: 'bonus' },
  { name: 'Eternal Frost',     day: 120, start: 35, limit: 88,  heat: 12.5, fire: 3,  fireTemp: 16, ray: 3,  rayDur: 13, blast: 7,  blastTemp: 28, cloudsMax: 12, novaCd: 7, special: 'bonus' },
];

WW.MAIN_LEVELS = 45;
WW.TOTAL_LEVELS = WW.LEVELS.length;
