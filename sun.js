/* ============================================================
   WINTER WIZARD — sun.js
   The enemy: sun position/anger, and threat scheduling
   (fireballs, stun rays, heat blasts). Threat events are stored
   on the game object and resolved by game.js.
   ============================================================ */
window.WW = window.WW || {};
(function () {
  'use strict';

  function rand(a, b) { return a + Math.random() * (b - a); }

  WW.Sun = class {
    constructor(game) {
      this.game = game;
      this.reset(null);
    }

    reset(level) {
      this.level = level || { day: 40, fire: 0, ray: 0, blast: 0, fireTemp: 0, blastTemp: 0, rayDur: 4, limit: 100 };
      // threat timers: avg-interval scheduling with a little jitter.
      // The angrier the sun, the faster it attacks.
      this.fireT = this.level.fire > 0 ? rand(2, 4) : Infinity;
      this.rayT = this.level.ray > 0 ? rand(6, 10) : Infinity;
      this.blastT = this.level.blast > 0 ? rand(8, 14) : Infinity;
      this.threatBoost = 1;
    }

    /* ---- day geometry ---- */
    p() {
      return Math.min(1, this.game.dayTime / this.level.day);
    }
    /* Sun elevation 0..1 (sine arc). */
    elev() {
      return Math.sin(Math.PI * this.p());
    }
    /* Heating/intensity factor, 0 at horizon edges, ~1 at noon. */
    factor() {
      return Math.max(0, Math.min(1, this.elev() * 1.35 - 0.15));
    }
    pos() {
      const g = this.game;
      const p = this.p();
      // Wide arc: enters off-screen at the LEFT edge, sweeps high across
      // the top of the sky, exits off-screen at the RIGHT edge. The ^0.5
      // curve makes it climb fast, so it clears the cloud band quickly.
      const lowY = g.groundY + 30;
      const peakY = g.H * 0.16;
      const rise = Math.pow(Math.sin(Math.PI * p), 0.5);
      const y = lowY - (lowY - peakY) * rise;
      return { x: g.W * (-0.14 + 1.28 * p), y };
    }
    /* 0 = calm, 1 = furious. Driven by temperature & how much sky is clouded. */
    anger() {
      const g = this.game;
      if (!g.level) return 0;
      const tRatio = g.temp / g.level.limit;
      return Math.max(0, Math.min(1, tRatio * 0.75 + g.coverageFrac() * 0.4));
    }

    nextInterval(base) {
      if (!(base > 0)) return Infinity;
      const rage = this.anger();
      const mult = 1 - 0.25 * rage;                 // angrier sun = faster threats
      return rand(base * 0.75, base * 1.3) * mult;
    }

    update(dt) {
      const g = this.game;
      if (g.state !== 'play' || g.paused) return;
      const sf = this.factor();
      if (sf <= 0.02) return;                       // only attacks while shining

      /* --- fireballs --- */
      if (this.level.fire > 0) {
        this.fireT -= dt;
        if (this.fireT <= 0) {
          this.fireT = this.nextInterval(this.level.fire);
          const lane = Math.floor(Math.random() * WW.CONST.LANES);
          const pos = this.pos();
          const tx = g.laneX(lane) + g.laneW * rand(0.2, 0.8);
          const L = g.lanes[lane];
          let payload = this.level.fireTemp;
          let weakened = false;
          if (L.wind > 0) {
            if (g.wizard.canBlowAway()) {
              payload = 0; weakened = true;
              g.burst(tx, g.groundY - 60, '💨', 4);
              g.toast('FIREBALL BLOWN AWAY! 💨', '#9fdcff');
            } else {
              payload *= g.wizard.weaken();
              weakened = true;
            }
          }
          if (payload > 0 || !weakened) {
            g.fireballs.push({
              t: 0, dur: WW.CONST.FIRE_FLIGHT,
              sx: pos.x, sy: pos.y,
              tx, ty: g.groundY - 8,
              lane, payload, weakened: payload < this.level.fireTemp,
              full: this.level.fireTemp
            });
          }
        }
      }

      /* --- stun rays (target the castle lane) --- */
      if (this.level.ray > 0) {
        this.rayT -= dt;
        if (this.rayT <= 0) {
          this.rayT = this.nextInterval(this.level.ray);
          if (!g.rays.some(r => r.phase === 'charge' || r.phase === 'beam')) {
            // snapshot castle cover at lock-on: if a cloud shields the castle
            // when the ray targets it, the ray can be blocked even if that
            // cloud burns away during the 1s charge
            g.rays.push({
              phase: 'charge', t: 0, dur: WW.CONST.RAY_CHARGE,
              lockDur: this.level.rayDur,
              coveredAtCharge: g.cloudsInLane(WW.CONST.CASTLE_LANE) > 0
            });
            g.beep(220, 0.15, 'square');
          }
        }
      }

      /* --- heat blasts (prefer the cloudiest lane, but never the castle
         lane — blasts shouldn't strip your ray shield) --- */
      if (this.level.blast > 0) {
        this.blastT -= dt;
        if (this.blastT <= 0) {
          this.blastT = this.nextInterval(this.level.blast);
          if (!g.blasts.some(b => b.phase === 'charge' || b.phase === 'beam')) {
            let lane = Math.floor(Math.random() * WW.CONST.LANES);
            let best = -1;
            for (let i = 0; i < WW.CONST.LANES; i++) {
              if (i === WW.CONST.CASTLE_LANE) continue;
              const n = g.cloudsInLane(i);
              if (n > best) { best = n; lane = i; }
            }
            if (best <= 0) lane = Math.floor(Math.random() * WW.CONST.LANES);
            g.blasts.push({ phase: 'charge', t: 0, dur: WW.CONST.BLAST_CHARGE, lane, temp: this.level.blastTemp });
            g.beep(110, 0.3, 'sawtooth');
            g.toast('⚠️ HEAT BLAST CHARGING!', '#ff8040');
          }
        }
      }
    }
  };
})();
