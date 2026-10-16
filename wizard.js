/* ============================================================
   WINTER WIZARD — wizard.js
   The player: spell knowledge, unlocks, cooldowns, stun locks.
   ============================================================ */
window.WW = window.WW || {};
(function () {
  'use strict';

  const C = () => WW.CONST;

  WW.Wizard = class {
    constructor(game) {
      this.game = game;
      this.reset(1);
    }

    /* Re-derive everything from the day number being played. */
    reset(levelNum) {
      this.levelNum = levelNum;
      this.spells = ['cloud'];
      this.upgrades = {};
      for (const u of WW.UNLOCKS) {
        if (u.level > levelNum) continue;
        if (u.type === 'spell' && !this.spells.includes(u.id)) this.spells.push(u.id);
        if (u.type === 'upgrade') this.upgrades[u.id] = true;
      }
      this.cds = {};
      this.cdMax = {};
      this.stuns = {};
      for (const s of WW.SPELL_ORDER) {
        this.cds[s] = 0;
        this.cdMax[s] = 1;
        this.stuns[s] = 0;
      }
      this.selected = 'cloud';
      this.castAnim = 0;     // 1 -> 0 wand sparkle timer
    }

    has(id) { return !!this.upgrades[id]; }

    /* Multiply all applicable upgrade effects for a stat. */
    fx(base, key, mulKey, addKey) {
      let v = base;
      for (const id in this.upgrades) {
        const f = WW.UPGRADE_FX[id];
        if (!f) continue;
        if (f[mulKey]) v *= f[mulKey];
        if (f[addKey]) v += f[addKey];
      }
      return v;
    }

    /* ---- effective spell stats (with upgrades) ---- */
    cloudLife()  { return this.fx(WW.CONST.CLOUD_LIFE, 'life', 'cloudLifeMul'); }
    cloudsMax()  { return this.game.level.cloudsMax + (this.has('cloudUp2') ? WW.UPGRADE_FX.cloudUp2.extraClouds : 0); }
    snowDps()    { return this.fx(WW.CONST.SNOW_DPS, 'dps', 'snowDpsMul'); }
    snowDur()    { return this.fx(WW.CONST.SNOW_DUR, 'dur', 'snowDurMul'); }
    windDur()    { return WW.CONST.WIND_DUR; }
    windDps()    { return this.fx(WW.CONST.WIND_DPS, 'dps', 'windDpsMul'); }
    windBurst()  { return this.fx(WW.CONST.WIND_BURST, 'burst', 'windDpsMul', 'windBurstAdd'); }
    weaken()    { return this.fx(WW.CONST.WEAKEN, 'wk', 'weakenMul'); }
    canBlowAway(){ return this.has('windUp2'); }
    rainDur()    { return WW.CONST.RAIN_DUR; }
    rainDps()   { return this.fx(WW.CONST.RAIN_DPS, 'dps', 'rainDpsMul'); }
    novaDrop()  { return this.fx(WW.CONST.NOVA_DROP, 'drop', 'novaMul'); }
    novaCd()    { return this.game.level.novaCd * (this.has('novaUp1') ? WW.UPGRADE_FX.novaUp1.novaCdMul : 1); }

    /* ---- readiness ---- */
    isReady(id) { return this.cds[id] <= 0 && this.stuns[id] <= 0; }

    /* Lock one random ready spell (stun ray hit). */
    stunRandom(dur) {
      const pool = this.spells.filter(s => this.stuns[s] <= 0);
      if (!pool.length) return null;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.stuns[pick] = Math.max(this.stuns[pick], dur);
      return pick;
    }

    /* Start a spell's cooldown. */
    cool(id) {
      let cd;
      switch (id) {
        case 'cloud': cd = WW.CONST.CLOUD_CD; break;
        case 'snow': cd = WW.CONST.SNOW_CD; break;
        case 'wind': cd = WW.CONST.WIND_CD; break;
        case 'rain': cd = WW.CONST.RAIN_CD; break;
        case 'nova': cd = this.novaCd(); break;
        default: cd = 1;
      }
      this.cds[id] = cd;
      this.cdMax[id] = cd;
    }

    update(dt) {
      for (const s in this.cds) {
        if (this.cds[s] > 0) this.cds[s] = Math.max(0, this.cds[s] - dt);
        if (this.stuns[s] > 0) this.stuns[s] = Math.max(0, this.stuns[s] - dt);
      }
      if (this.castAnim > 0) this.castAnim = Math.max(0, this.castAnim - dt * 1.8);
    }
  };
})();
