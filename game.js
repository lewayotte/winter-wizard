/* ============================================================
   WINTER WIZARD — game.js
   Main loop, state machine, input, temperature simulation,
   threat resolution, Santa, gifts, scoring, sound.
   ============================================================ */
window.WW = window.WW || {};
(function () {
  'use strict';

  const C = WW.CONST;
  const LANES = C.LANES;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  const TAUNTS = [
    'FEEL THE BURN, FROST BOY!',
    'YOUR WINTER IS MINE!',
    'TOO HOT FOR YOU?',
    'I AM THE STORM OF SUMMER!',
    'MELT, LITTLE WIZARD!',
    'SUNSCREEN WON\'T SAVE YOU NOW!',
  ];

  WW.Game = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.state = 'boot';
      this.t = 0;
      this.muted = false;
      this.paused = false;
      this.pointer = { x: 0, y: 0 };
      this.hover = null;
      this.buttons = [];
      this.toasts = [];
      this.particles = [];
      this.shake = 0;
      this.flashErr = 0;
      this.novaFlash = 0;
      this.dpr = 1;

      WW.Save.load();
      this.wizard = new WW.Wizard(this);
      this.sun = new WW.Sun(this);
      this.level = WW.LEVELS[0];
      this.levelNum = 1;
      this.temp = 30;
      this.dayTime = 0;
      this.clouds = [];
      this.lanes = [];
      this.fireballs = [];
      this.rays = [];
      this.blasts = [];
      this.gifts = [];
      this.santa = null;
      this.stunHits = 0;
      this.end = {};
      this.unlockBanner = null;
      this.santaDone = false;

      this.resize();
      this.buildTitleFlakes();
      this.state = 'title';

      window.addEventListener('resize', () => this.resize());
      canvas.addEventListener('pointerdown', (e) => this.onDown(e.clientX, e.clientY));
      window.addEventListener('pointermove', (e) => {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
      });
      window.addEventListener('keydown', (e) => this.onKey(e));

      let last = performance.now();
      const loop = (now) => {
        let dt = (now - last) / 1000;
        last = now;
        dt = Math.min(dt, 0.05);
        this.update(dt);
        WW.R.draw(this);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    /* ---------------- layout ---------------- */
    resize() {
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(this.W * this.dpr);
      this.canvas.height = Math.round(this.H * this.dpr);
      this.canvas.style.width = this.W + 'px';
      this.canvas.style.height = this.H + 'px';
      this.groundY = this.H * 0.78;
      this.laneW = this.W / LANES;
      this.cloudY = this.groundY - Math.min(230, this.H * 0.33);
      // deterministic background stars
      this.bgStars = [];
      for (let i = 0; i < 90; i++) {
        const s = Math.sin(i * 127.1) * 0.5 + 0.5;
        const s2 = Math.sin(i * 311.7) * 0.5 + 0.5;
        this.bgStars.push({ x: s, y: s2, s: 1 + (i % 3), tw: 1 + (i % 5) });
      }
      // ground decorations (deterministic)
      this.groundDeco = [];
      const deco = ['🌲', '🌲', '🌲', '🌲', '🌲', '🌲', '🌲', '🎄', '🌲'];
      for (let i = 0; i < deco.length; i++) {
        this.groundDeco.push({
          e: deco[i],
          x: 0.06 + (i * 0.113) % 0.9,
          dy: 26 + (i % 3) * 10,
          s: 34 + (i % 4) * 8
        });
      }
      if (this.state === 'select') this.buildSelectButtons();
    }
    buildTitleFlakes() {
      this.titleFlakes = [];
      for (let i = 0; i < 40; i++) {
        this.titleFlakes.push({
          x: Math.random(), y: Math.random(),
          s: 10 + (i % 4) * 6, sp: 0.5 + (i % 5) * 0.3
        });
      }
    }

    laneX(i) { return this.W / LANES * i; }

    /* ---------------- sound ---------------- */
    beep(freq, dur, type, vol) {
      if (this.muted) return;
      try {
        if (!this._ac) this._ac = new (window.AudioContext || window.webkitAudioContext)();
        const ac = this._ac;
        if (ac.state === 'suspended') ac.resume();
        const o = ac.createOscillator();
        const gn = ac.createGain();
        o.type = type || 'square';
        o.frequency.value = freq;
        gn.gain.value = (vol || 0.06);
        o.connect(gn); gn.connect(ac.destination);
        const t0 = ac.currentTime;
        gn.gain.setValueAtTime(gn.gain.value, t0);
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.1));
        o.start(t0); o.stop(t0 + (dur || 0.1) + 0.02);
      } catch (e) { /* audio unavailable */ }
    }
    chord(freqs, dur, type) {
      freqs.forEach((f, i) => setTimeout(() => this.beep(f, dur, type || 'square'), i * 70));
    }

    /* ---------------- state / levels ---------------- */
    toast(msg, color, dur) {
      const d = dur || 2.4;
      // dedupe: rapid repeat clicks refresh the existing toast instead of stacking
      const existing = this.toasts.find(t => t.msg === msg);
      if (existing) {
        existing.t = 0;
        existing.dur = d;
        if (color) existing.color = color;
        return;
      }
      this.toasts.push({ msg, color: color || '#7fd4ff', t: 0, dur: d });
      if (this.toasts.length > 2) this.toasts.shift();
    }
    burst(x, y, emoji, n, spread) {
      for (let i = 0; i < n; i++) {
        this.particles.push({
          x, y,
          vx: rand(-1, 1) * (spread || 120),
          vy: rand(-1.2, -0.2) * (spread || 120),
          life: rand(0.4, 0.9), max: 0.9,
          size: rand(14, 26), emoji
        });
      }
    }
    confetti(n) {
      for (let i = 0; i < n; i++) {
        this.particles.push({
          x: rand(0, this.W), y: rand(-80, 0),
          vx: rand(-20, 20), vy: rand(60, 160),
          life: rand(1, 2.4), max: 2.4,
          size: 14, emoji: ['❄️', '✨', '⭐'][i % 3]
        });
      }
    }

    startLevel(n) {
      this.levelNum = n;
      this.level = WW.LEVELS[n - 1];
      this.temp = this.level.start;
      this.dayTime = 0;
      this.clouds = [];
      this.lanes = [];
      for (let i = 0; i < LANES; i++) {
        this.lanes.push({ snow: 0, wind: 0, rain: 0, snowDps: 0, windDps: 0, rainDps: 0, rainCloud: null, cloud: null });
      }
      this.fireballs = [];
      this.rays = [];
      this.blasts = [];
      this.gifts = [];
      this.santa = null;
      this.santaDone = false;
      this.hog = null;
      this.hogScared = false;
      this.hogLeft = false;
      this.stunHits = 0;
      this.maxTemp = this.level.start;
      this.castLock = 0;
      this.giftResult = null;
      this.novaReadyFlash = 0;
      this.heldGift = WW.Save.data.gift || null;
      if (this.level.special === 'christmas') {
        // Christmas is a fresh-gift day: the slot resets to the wrapped 🎁,
        // then refills with whatever Santa drops you this run.
        this.heldGift = null;
        if (WW.Save.data.gift) {
          WW.Save.data.gift = null;
          WW.Save.write();
        }
      }
      this.novaFlash = 0;
      this.shake = 0;
      this.paused = false;
      this.buttons = [];
      this.wizard.reset(n);
      this.sun.reset(this.level);
      this.state = 'play';
      const u = WW.UNLOCKS.find(x => x.level === n);
      this.unlockBanner = u ? { u, t: 0 } : null;
      if (this.level.special === 'christmas') {
        this.toast('🎅 MERRY CHRISTMAS! SANTA VISITS NEAR DUSK 🎁', '#ffd94a', 4);
      }
      if (this.level.special === 'finale') {
        this.toast('🦫 GROUNDHOG DAY FINALE! 🦫', '#ffd94a', 4);
      }
      if (this.level.special === 'bonus') {
        this.toast('❄ EXTENDED WINTER — BONUS DAY ❄', '#9fdcff', 4);
      }
      if (n === 1) {
        this.toast('SELECT ☁️ THEN CLICK A SKY LANE TO BLOCK THE SUN', '#ffd94a', 5);
      }
      this.chord([392, 523, 659], 0.12);
    }

    cloudsInLane(i) {
      return this.clouds.filter(c => c.lane === i && !c.dying).length;
    }
    coverageFrac() {
      let covered = 0;
      for (let i = 0; i < LANES; i++) if (this.cloudsInLane(i) > 0) covered++;
      return covered / LANES;
    }
    canPlaceCloud(lane) {
      // overwriting/refreshing the lane's existing cloud is always allowed
      if (this.cloudsInLane(lane) > 0) return true;
      return this.clouds.filter(c => !c.dying).length < this.wizard.cloudsMax();
    }
    laneTopCloud(lane) {
      const cs = this.clouds.filter(c => c.lane === lane && !c.dying);
      if (!cs.length) return null;
      return cs[cs.length - 1];
    }

    /* ---------------- casting ---------------- */
    selectSpell(id) {
      if (!this.wizard.spells.includes(id)) return;
      if (id === 'nova') { this.castNova(); return; }
      this.wizard.selected = id;
      this.beep(600, 0.05, 'triangle');
    }
    tryCast(lane) {
      const w = this.wizard;
      const id = w.selected;
      if (!w.spells.includes(id)) return;
      if (this.castLock > 0) { this.beep(140, 0.05, 'sawtooth'); return; }
      if (w.stuns[id] > 0) { this.toast(WW.SPELLS[id].name + ' IS STUNNED! ⚡', '#ff5050'); this.flashErr = 0.5; return; }
      if (w.cds[id] > 0) { this.beep(140, 0.08, 'sawtooth'); return; }

      if (id === 'cloud') {
        const existing = this.laneTopCloud(lane);
        const fresh = w.cloudLife();
        if (existing) {
          // overwrite: extend the existing cloud's life (remaining + fresh, capped at 2x fresh)
          existing.life = Math.min(existing.life + fresh, fresh * 2);
          existing.max = Math.max(existing.max, existing.life);
          existing.born = this.t;
        } else {
          if (this.clouds.filter(c => !c.dying).length >= this.wizard.cloudsMax()) {
            this.toast('CLOUD LIMIT (' + this.wizard.cloudsMax() + ') — SUN MELTS OLD ONES ☀️', '#ff8080');
            this.flashErr = 0.35;
            return;
          }
          this.clouds.push({
            lane, stack: 0,
            life: fresh, max: fresh,
            seed: Math.random() * 10, raining: false, dying: false,
            born: this.t
          });
        }
        this.lanes[lane].cloud = this.laneTopCloud(lane);
        this.burst(this.laneX(lane) + this.laneW / 2, this.cloudY, '☁️', 3, 60);
        this.beep(300, 0.1, 'sine');
      } else if (id === 'snow') {
        const cloud = this.laneTopCloud(lane);
        if (!cloud) { this.toast('SNOW NEEDS A CLOUD OVERHEAD ☁️', '#ff8080'); this.flashErr = 0.35; return; }
        const L = this.lanes[lane];
        L.snow = w.snowDur();
        L.snowDps = w.snowDps();
        // snowing sifts life out of the source cloud — cooling isn't free
        cloud.life -= C.SNOW_DRAIN;
        if (cloud.life <= 0) this.dissolveCloud(cloud, 'burn');
        this.burst(this.laneX(lane) + this.laneW / 2, this.cloudY, '❄️', 5, 80);
        this.beep(880, 0.12, 'sine');
      } else if (id === 'wind') {
        const L = this.lanes[lane];
        L.wind = w.windDur();
        L.windDps = w.windDps();
        this.temp = Math.max(0, this.temp - w.windBurst());
        // weaken/blow away airborne fireballs in this lane
        for (const f of this.fireballs) {
          if (f.lane !== lane || f.done) continue;
          if (w.canBlowAway()) {
            f.done = true;
            const p = this.fireballXY(f);
            this.burst(p.x, p.y, '💨', 3);
          } else {
            f.payload *= w.weaken();
            f.weakened = true;
          }
        }
        this.burst(this.laneX(lane) + this.laneW / 2, this.cloudY, '💨', 4, 90);
        this.beep(500, 0.18, 'triangle');
      } else if (id === 'rain') {
        const cloud = this.laneTopCloud(lane);
        if (!cloud) { this.toast('RAIN NEEDS A CLOUD ☁️', '#ff8080'); this.flashErr = 0.35; return; }
        const L = this.lanes[lane];
        L.rain = w.rainDur();
        L.rainDps = w.rainDps();
        L.rainCloud = cloud;
        cloud.raining = true;
        this.beep(200, 0.25, 'sine');
      }
      w.cool(id);
      w.castAnim = 1;
      this.castLock = C.WAND_LOCK;
    }
    castNova() {
      const w = this.wizard;
      if (!w.spells.includes('nova')) return;
      if (this.castLock > 0) { this.beep(140, 0.05, 'sawtooth'); return; }
      if (w.stuns.nova > 0) { this.toast('NOVA IS STUNNED! ⚡', '#ff5050'); this.flashErr = 0.5; return; }
      if (w.cds.nova > 0) { this.beep(140, 0.08, 'sawtooth'); return; }
      this.temp = Math.max(0, this.temp - w.novaDrop());
      this.novaFlash = 1;
      this.shake = Math.max(this.shake, 0.5);
      w.cool('nova');
      w.castAnim = 1;
      this.castLock = C.WAND_LOCK;
      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: rand(0, this.W), y: rand(this.H * 0.2, this.groundY),
          vx: 0, vy: rand(20, 80), life: rand(0.5, 1.2), max: 1.2,
          size: rand(16, 30), emoji: '❄️'
        });
      }
      this.chord([660, 440, 220], 0.2, 'sine');
      this.toast('FROST NOVA! 🧊 −' + Math.round(w.novaDrop()) + '°', '#9fdcff');
    }

    fireballXY(f) {
      const t = clamp(f.t / f.dur, 0, 1);
      const mx = (f.sx + f.tx) / 2;
      const my = Math.min(f.sy, this.H * 0.08) - this.H * 0.14;
      const u = 1 - t;
      return {
        x: u * u * f.sx + 2 * u * t * mx + t * t * f.tx,
        y: u * u * f.sy + 2 * u * t * my + t * t * f.ty
      };
    }

    /* ---------------- gift / santa ---------------- */
    spawnSanta() {
      this.santa = { x: -80, y: this.H * 0.16, vx: this.W * 0.11, dropped: false, ho: true };
      this.chord([392, 330, 392, 262], 0.15, 'triangle');
    }
    rollGift() {
      const entries = Object.entries(WW.GIFTS);
      const total = entries.reduce((a, e) => a + e[1].weight, 0);
      let r = Math.random() * total;
      for (const [k, v] of entries) {
        r -= v.weight;
        if (r <= 0) return k;
      }
      return 'cocoa';
    }
    collectGift(gf) {
      gf.collected = true;
      this.giftResult = { type: gf.type, collected: true };
      const G = WW.GIFTS[gf.type];
      if (gf.type === 'flashlight') {
        WW.Save.grantFlashlight();
        this.toast('🔦 FLASHLIGHT CAUGHT — IT WILL NOT MELT. KEEP IT... (???)', '#9fdcff', 4);
      } else {
        this.toast(G.icon + ' ' + G.name + ' — HELD! PRESS 6 TO USE', '#ffd94a', 4);
      }
      // the slot holds exactly what Santa gave you (latest catch replaces)
      this.heldGift = gf.type;
      WW.Save.data.gift = gf.type;
      WW.Save.write();
      this.burst(gf.x, gf.y, G.icon, 8, 140);
      this.chord([523, 659, 784, 1047], 0.12, 'sine');
    }
    /* Use the held gift (key 6 or the 🎁 button). Santa's magic — works
       even while stunned; consumes the slot. */
    useGift() {
      if (this.state !== 'play' || this.paused) return;
      const type = this.heldGift;
      if (!type) { this.toast('NO GIFT HELD — SANTA VISITS DAY 25 🎅', '#9db8dd'); return; }
      const G = WW.GIFTS[type];
      if (type === 'flashlight') {
        // permanent key item — never consumed.
        // FINALE MOMENT: shine it while the groundhog is on screen and he
        // sees his shadow — winter extends! (3 bonus days)
        if (this.hog && !this.hog.scared) {
          this.hog.scared = true;
          this.hog.hopT = 1;
          this.hogScared = true;
          WW.Save.unlockBonus();
          this.toast('🦫 HE SAW HIS SHADOW! WINTER EXTENDED! ❄', '#ffd94a', 4);
          this.confetti(30);
          this.chord([392, 523, 659, 784], 0.15, 'triangle');
        } else {
          this.toast('🔦 THE FLASHLIGHT GLOWS STEADILY... (SOMETHING ABOUT DAY 45?)', '#9fdcff', 2.5);
          const cx = this.laneX(WW.CONST.CASTLE_LANE) + this.laneW / 2;
          this.burst(cx, this.cloudY - 40, '🔦', 4, 100);
        }
        return;
      }
      if (type === 'cocoa') {
        this.temp = this.level.start;
        this.confetti(10);
        this.toast('☕ HOT COCOA — TEMP RESET!', '#ffd94a', 3);
      } else if (type === 'globe') {
        this.wizard.cds.nova = 0;
        this.novaReadyFlash = 2.5;
        this.toast('🔮 SNOW GLOBE — FROST NOVA RECHARGED! 🧊', '#9fdcff', 3.5);
      }
      this.heldGift = null;
      WW.Save.data.gift = null;
      WW.Save.write();
      this.wizard.castAnim = 1;
      const cx = this.laneX(WW.CONST.CASTLE_LANE) + this.laneW / 2;
      this.burst(cx, this.cloudY - 40, G.icon, 10, 150);
      this.chord([523, 659, 784, 1047], 0.12, 'sine');
    }

    /* ---------------- win / lose ---------------- */
    /* Star thresholds (same dynamic every day):
       3★ = temperature never rose above the winter goal (30°F)
       2★ = ...never above the warn line, (goal + limit) / 2
       1★ = survived the day at all */
    warnTemp() {
      return (WW.CONST.AVG_WINTER + this.level.limit) / 2;
    }
    liveStars() {
      const goal = WW.CONST.AVG_WINTER, warn = this.warnTemp();
      return Math.max(1, 3 - (this.maxTemp > goal ? 1 : 0) - (this.maxTemp > warn ? 1 : 0));
    }
    win() {
      const goal = WW.CONST.AVG_WINTER, warn = this.warnTemp();
      const stars = this.liveStars();
      WW.Save.setStars(this.levelNum, stars);
      let ceremony = null;
      if (this.level.special === 'finale') {
        const shadow = this.hogScared || WW.Save.data.bonus;
        ceremony = { shadow };
      }
      if (this.levelNum === WW.TOTAL_LEVELS) WW.Save.data.completed = true, WW.Save.write();
      this.end = {
        win: true, stars, temp: this.temp, maxTemp: this.maxTemp,
        goal, warn, stunHits: this.stunHits,
        ceremony, starT: this.t, mhogT: this.t + 0.6
      };
      this.state = 'end';
      this.unlockBanner = null;
      this.buildEndButtons();
      this.confetti(stars >= 3 ? 50 : 25);
      this.chord([523, 659, 784, 1047, 1319], 0.15);
    }
    lose() {
      this.end = {
        win: false,
        temp: this.temp, maxTemp: this.maxTemp,
        goal: WW.CONST.AVG_WINTER, warn: this.warnTemp(),
        taunt: TAUNTS[Math.floor(Math.random() * TAUNTS.length)]
      };
      this.state = 'end';
      this.unlockBanner = null;
      this.buildEndButtons();
      this.shake = 1;
      this.chord([300, 220, 150, 100], 0.25, 'sawtooth');
    }
    buildEndButtons() {
      const bw = 150, bh = 48, gap = 20;
      const ph = this.end.ceremony ? 380 : (this.end.win ? 300 : 280);
      const py = Math.max(30, this.H / 2 - ph / 2);
      const total = 3 * bw + 2 * gap;
      let x = this.W / 2 - total / 2;
      const y = Math.min(this.H - bh - 12, py + ph + 14);
      this.buttons = [
        { kind: 'btn', id: 'retry', label: '↺ RETRY', x, y, w: bw, h: bh },
      ];
      x += bw + gap;
      if (this.end.win) {
        let nextN = this.levelNum + 1;
        let nextOk = nextN <= WW.TOTAL_LEVELS && WW.Save.isUnlocked(nextN);
        if (this.levelNum === WW.MAIN_LEVELS && !WW.Save.data.bonus) nextOk = false;
        if (nextOk) {
          this.buttons.push({ kind: 'btn', id: 'next', label: 'NEXT DAY ▶', x, y, w: bw, h: bh });
          x += bw + gap;
        }
      }
      this.buttons.push({ kind: 'btn', id: 'map', label: '☀ MAP', x, y, w: bw, h: bh });
    }
    buildSelectButtons() {
      this.buttons = [];
      const cols = 12;
      const size = Math.max(40, Math.min(60, (this.W - 80) / cols - 6));
      const gx = this.W / 2 - (cols * (size + 6) - 6) / 2;
      const gy = 116;
      const nMain = WW.MAIN_LEVELS;
      for (let n = 1; n <= WW.TOTAL_LEVELS; n++) {
        const idx = n - 1;
        const row = Math.floor(idx / cols), col = idx % cols;
        const isBonus = n > nMain;
        const special = WW.LEVELS[idx].special;
        const unlocked = WW.Save.isUnlocked(n);
        if (isBonus && !WW.Save.data.bonus) continue;
        this.buttons.push({
          kind: 'level', id: 'lvl:' + n, num: n,
          x: gx + col * (size + 6), y: gy + row * (size + 6),
          w: size, h: size,
          disabled: !unlocked,
          starCount: WW.Save.stars(n),
          special
        });
      }
      const bw = 160, bh = 44;
      this.buttons.push({
        kind: 'btn', id: 'reset', label: '⚠ RESET SAVE', sub: 'erase all progress',
        x: this.W / 2 - bw / 2, y: this.H - 24 - bh, w: bw, h: bh
      });
    }

    /* ---------------- input ---------------- */
    onDown(x, y) {
      this.hover = { x, y };
      const hit = (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
      if (this.state === 'title') {
        this.state = 'select';
        this.buildSelectButtons();
        this.beep(440, 0.1);
        return;
      }
      if (this.state === 'select') {
        for (const b of this.buttons) {
          if (!hit(b)) continue;
          if (b.kind === 'level' && !b.disabled) { this.startLevel(b.num); return; }
          if (b.id === 'reset') {
            WW.Save.reset();
            this.buildSelectButtons();
            this.beep(200, 0.2, 'sawtooth');
            return;
          }
        }
        return;
      }
      if (this.state === 'end') {
        for (const b of this.buttons) {
          if (!hit(b)) continue;
          if (b.id === 'retry') { this.startLevel(this.levelNum); return; }
          if (b.id === 'next') { this.startLevel(this.levelNum + 1); return; }
          if (b.id === 'map') { this.state = 'select'; this.buildSelectButtons(); return; }
        }
        return;
      }
      if (this.state === 'play') {
        if (this.paused) { this.paused = false; return; }
        // gifts first (catchable mid-air or on the ground)
        for (const gf of this.gifts) {
          if (!gf.collected && Math.hypot(x - gf.x, y - gf.y) < 48) {
            this.collectGift(gf);
            return;
          }
        }
        // spell bar (gift slot included when holding one)
        if (this.spellBarRects) {
          for (const b of this.spellBarRects) {
            if (hit(b)) {
              if (b.id === 'gift') this.useGift();
              else this.selectSpell(b.id);
              return;
            }
          }
        }
        // lane cast — anywhere in the lane column (sky or ground), below the HUD
        if (y > 62) {
          const lane = clamp(Math.floor(x / this.laneW), 0, LANES - 1);
          this.tryCast(lane);
        }
      }
    }
    onKey(e) {
      const k = e.key.toLowerCase();
      if (this.state === 'play') {
        const idx = parseInt(k, 10);
        if (idx >= 1 && idx <= 5) {
          const id = WW.SPELL_ORDER[idx - 1];
          if (this.wizard.spells.includes(id)) this.selectSpell(id);
          return;
        }
        if (k === '6') { this.useGift(); return; }
        if (k === 'p' || k === 'escape') { this.paused = !this.paused; return; }
        if (k === 'r') { this.startLevel(this.levelNum); return; }
      }
      if (k === 'm') {
        this.muted = !this.muted;
        this.toast(this.muted ? '🔇 SOUND OFF' : '🔊 SOUND ON', '#9db8dd', 1.2);
      }
      if (k === 'enter' && this.state === 'title') {
        this.state = 'select';
        this.buildSelectButtons();
      }
    }

    /* ---------------- per-frame update ---------------- */
    update(dt) {
      this.t += dt;
      this.hover = { x: this.pointer.x, y: this.pointer.y };
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2);
      if (this.flashErr > 0) this.flashErr = Math.max(0, this.flashErr - dt * 1.5);
      this.novaFlash = Math.max(0, this.novaFlash - dt * 1.4);
      // toasts & particles always tick
      for (const t of this.toasts) t.t += dt;
      this.toasts = this.toasts.filter(t => t.t < t.dur);
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.emoji === '❄️' || p.emoji === '✨' || p.emoji === '⭐') p.vy += 40 * dt;
        p.life -= dt;
      }
      this.particles = this.particles.filter(p => p.life > 0);

      if (this.state === 'play' && !this.paused) this.updatePlay(dt);
      if (this.state === 'select') {
        this.hoverLane = -1;
      } else {
        this.hoverLane = clamp(Math.floor(this.pointer.x / this.laneW), 0, LANES - 1);
      }
    }

    updatePlay(dt) {
      const lv = this.level;
      this.dayTime += dt;
      if (this.unlockBanner) {
        this.unlockBanner.t += dt;
        if (this.unlockBanner.t > 5) this.unlockBanner = null;
      }
      if (this.temp > this.maxTemp) this.maxTemp = this.temp;
      if (this.castLock > 0) this.castLock = Math.max(0, this.castLock - dt);
      if (this.novaReadyFlash > 0) this.novaReadyFlash = Math.max(0, this.novaReadyFlash - dt);
      this.wizard.update(dt);
      this.sun.update(dt);
      const sf = this.sun.factor();

      /* ---- temperature ---- */
      const coverage = this.coverageFrac();
      const heat = lv.heat * sf * (1 - coverage);
      let cool = this.wizard.ambientCool();
      for (let i = 0; i < LANES; i++) {
        const L = this.lanes[i];
        if (L.snow > 0) cool += L.snowDps;
        if (L.wind > 0) cool += L.windDps;
        if (L.rain > 0) cool += L.rainDps;
      }
      this.temp = clamp(this.temp + (heat - cool) * dt, C.MIN_TEMP, 999);
      if (this.temp > lv.limit) {
        this.burst(this.W / 2, this.groundY - 40, '♨️', 10, 200);
        this.lose();
        return;
      }

      /* ---- clouds decay under sunlight ---- */
      const sunUp = sf > 0.001;
      for (const c of this.clouds) {
        if (c.dying) {
          c.dieT -= dt;
          if (c.dieT <= 0) c.dead = true;
          continue;
        }
        if (sunUp) c.life -= dt * sf;
        if (c.life <= 0) this.dissolveCloud(c, 'evaporate');
      }
      this.clouds = this.clouds.filter(c => !c.dead);

      /* ---- lane weather timers ---- */
      for (let i = 0; i < LANES; i++) {
        const L = this.lanes[i];
        if (L.snow > 0) L.snow -= dt;
        if (L.wind > 0) L.wind -= dt;
        if (L.rain > 0) {
          L.rain -= dt;
          if (L.rain <= 0) {
            // rain dissolves the cloud it fell from
            if (L.rainCloud && !L.rainCloud.dying) {
              const wasCastle = L.rainCloud.lane === C.CASTLE_LANE;
              this.dissolveCloud(L.rainCloud, 'rain');
              if (wasCastle) {
                this.toast('⚠ RAIN DISSOLVED YOUR CASTLE CLOUD! ☁️', '#ff8080');
              }
            }
            L.rainCloud = null;
          }
        }
        L.cloud = this.laneTopCloud(i);
      }

      /* ---- fireballs ---- */
      for (const f of this.fireballs) {
        if (f.done) continue;
        f.t += dt;
        const cloud = f.payload > 0 ? this.laneTopCloud(f.lane) : null;
        if (cloud && f.t < f.dur) {
          // Mid-flight interception: a guarding cloud catches the fireball
          // at its surface — the fireball never reaches the ground.
          const pos = this.fireballXY(f);
          const csize = Math.min(this.laneW * 0.95, 185);
          const cy = this.cloudY - (cloud.stack || 0) * csize * 0.42;
          const lx = this.laneX(f.lane) + this.laneW / 2;
          if (pos.y >= cy - 20 && Math.abs(pos.x - lx) < this.laneW * 0.7) {
            f.done = true;
            cloud.life -= C.FIRE_CLOUD_DMG;
            this.burst(pos.x, pos.y, '🔥', 4, 70);
            this.beep(160, 0.12, 'square');
            if (cloud.life <= 0) this.dissolveCloud(cloud, 'burn');
            continue;
          }
        }
        if (f.t >= f.dur) {
          f.done = true;
          if (cloud && f.payload > 0) {
            // fallback: a cloud placed late still soaks the hit
            cloud.life -= C.FIRE_CLOUD_DMG;
            this.burst(f.tx, this.cloudY - 20, '🔥', 3, 60);
            this.beep(160, 0.12, 'square');
            if (cloud.life <= 0) this.dissolveCloud(cloud, 'burn');
          } else if (f.payload > 0) {
            this.temp += f.payload;
            this.burst(f.tx, this.groundY - 8, '🔥', 6, 140);
            this.shake = Math.max(this.shake, 0.25);
            this.beep(120, 0.2, 'sawtooth');
            this.toast('+' + Math.round(f.payload) + '° FIREBALL! 🔥', '#ff8080', 1.6);
          }
        }
      }
      this.fireballs = this.fireballs.filter(f => !f.done);

      /* ---- stun rays ---- */
      for (const r of this.rays) {
        r.t += dt;
        if (r.phase === 'charge' && r.t >= r.dur) {
          r.phase = 'beam';
          r.t = 0;
          r.dur = 0.45;
          const castleLane = C.CASTLE_LANE;
          // blocked if the castle lane is clouded now — OR was clouded when the
          // ray locked on (that cloud sacrificed itself shielding the charge)
          const covered = this.cloudsInLane(castleLane) > 0 || r.coveredAtCharge;
          if (covered) {
            r.blocked = true;
            const cx = this.laneX(castleLane) + this.laneW / 2;
            const cloud = this.laneTopCloud(castleLane);
            const csize = Math.min(this.laneW * 0.95, 185);
            // beam will stop at the cloud — record the impact point
            r.blockX = cx;
            r.blockY = cloud ? this.cloudY - (cloud.stack || 0) * csize * 0.42 : this.cloudY;
            this.burst(r.blockX, r.blockY - csize * 0.15, '✨', 8, 120);
            this.toast('STUN RAY BLOCKED! ☁️', '#9fdcff');
            this.beep(880, 0.15, 'sine');
          } else {
            this.wizard.stunAll(r.lockDur);
            this.stunHits++;
            // recovery window: the sun holds its next ray until this stun
            // EXPIRES plus a re-cover grace — one stun can never chain
            this.sun.rayT = Math.max(this.sun.rayT, C.RAY_GRACE + r.lockDur);
            this.toast('⚡ ALL SPELLS LOCKED ' + Math.round(r.lockDur) + 's!', '#ff5050');
            this.shake = Math.max(this.shake, 0.3);
            this.beep(90, 0.3, 'square');
          }
        } else if (r.phase === 'beam' && r.t >= r.dur) {
          r.done = true;
        }
      }
      this.rays = this.rays.filter(r => !r.done);

      /* ---- heat blasts ---- */
      for (const b of this.blasts) {
        b.t += dt;
        if (b.phase === 'charge' && b.t >= b.dur) {
          b.phase = 'beam';
          b.t = 0;
          b.dur = 0.4;
          const n = this.cloudsInLane(b.lane);
          const cx = this.laneX(b.lane) + this.laneW / 2;
          if (n >= 1) {
            // pierces the lane's cloud: destroyed + partial heat leaks through
            const top = this.laneTopCloud(b.lane);
            this.dissolveCloud(top, 'blast');
            const leak = b.temp * C.BLAST_LEAK;
            this.temp += leak;
            this.burst(cx, this.cloudY, '💥', 6, 140);
            this.toast('+' + Math.round(leak) + '° BLAST PIERCED YOUR CLOUD! 💥', '#ff8040');
            this.shake = Math.max(this.shake, 0.3);
          } else {
            this.temp += b.temp;
            this.burst(cx, this.groundY - 10, '💥', 10, 180);
            this.toast('+' + Math.round(b.temp) + '° HEAT BLAST! ☀️', '#ff5050');
            this.shake = Math.max(this.shake, 0.5);
          }
          this.beep(80, 0.35, 'sawtooth');
        } else if (b.phase === 'beam' && b.t >= b.dur) {
          b.done = true;
        }
      }
      this.blasts = this.blasts.filter(b => !b.done);

      /* ---- Santa & gifts (level 25) ---- */
      if (lv.special === 'christmas' && !this.santaDone && this.sun.p() >= C.SANTA_TIME) {
        this.santaDone = true;
        this.spawnSanta();
      }
      if (this.santa) {
        this.santa.x += this.santa.vx * dt;
        this.santa.y += Math.sin(this.t * 2) * 8 * dt;
        if (!this.santa.dropped && this.santa.x > this.W * 0.5) {
          this.santa.dropped = true;
          const type = this.rollGift();
          this.gifts.push({
            x: this.santa.x, y: this.santa.y + 30,
            vy: 60, type, landed: false, life: C.GIFT_LIFE, collected: false
          });
        }
        if (this.santa.x > this.W + 120) this.santa = null;
      }
      for (const gf of this.gifts) {
        if (gf.collected) continue;
        if (!gf.landed) {
          gf.y += gf.vy * dt;
          gf.vy += 140 * dt;
          gf.x += Math.sin(this.t * 3) * 10 * dt;
          if (gf.y >= this.groundY - 26) {
            gf.y = this.groundY - 26;
            gf.landed = true;
            this.burst(gf.x, gf.y, '❄️', 4, 60);
          }
        } else {
          gf.life -= dt;
          if (gf.life <= 0) {
            gf.collected = true;
            if (!this.giftResult) this.giftResult = { collected: false };
            this.toast('THE GIFT MELTED AWAY... 😢', '#9db8dd');
          }
        }
      }

      /* ---- groundhog (level 45 finale) ---- */
      if (lv.special === 'finale') {
        if (!this.hog && !this.hogScared && !this.hogLeft && this.sun.p() >= C.HOG_TIME) {
          const sunVX = 1.28 * this.W / lv.day;   // the sun's x speed
          this.hog = { x: -70, y: this.groundY + 36, vx: 2 * sunVX, scared: false, hopT: 0 };
          this.toast('🦫 A GROUNDHOG WANDERS OUT...', '#ffd94a');
          this.beep(200, 0.2, 'triangle');
        }
        if (this.hog) {
          const h = this.hog;
          if (h.scared) {
            h.x -= h.vx * 3 * dt;   // flees home (right-to-left), fast
            if (h.hopT > 0) h.hopT = Math.max(0, h.hopT - dt * 2);
            if (h.x < -90) this.hog = null;
          } else {
            h.x += h.vx * dt;
            if (h.x > this.W + 90) { this.hog = null; this.hogLeft = true; }
          }
        }
      }

      /* ---- sunset? ---- */
      if (this.dayTime >= lv.day) {
        this.win();
      }
    }

    dissolveCloud(c, why) {
      if (c.dying) return;
      c.dying = true;
      c.dieT = 0.4;
      const cx = this.laneX(c.lane) + this.laneW / 2;
      const cy = this.cloudY - (c.stack || 0) * Math.max(34, this.H * 0.06);
      if (why === 'burn' || why === 'blast') {
        this.burst(cx, cy, '💨', 4, 100);
      } else {
        this.burst(cx, cy, '💧', 4, 90);
      }
    }
  };

  /* boot */
  window.addEventListener('load', () => {
    const canvas = document.getElementById('game');
    if (!window.WW.gameInstance) window.WW.gameInstance = new WW.Game(canvas);
  });
})();
