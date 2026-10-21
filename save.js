/* ============================================================
   WINTER WIZARD — save.js
   localStorage persistence: stars per level, flashlight secret,
   extended-winter unlock.
   ============================================================ */
window.WW = window.WW || {};
(function () {
  'use strict';

  const KEY = 'winter-wizard-save-v1';

  const defaults = () => ({
    stars: {},        // levelNumber (string) -> 0..3
    flashlight: false,   // permanent finale key (set when Santa drops the flashlight)
    bonus: false,     // extended winter unlocked (groundhog finale)
    completed: false, // finished day 48
    gift: null,       // the gift Santa last gave you: 'cocoa' | 'globe' | 'flashlight'
    giftMigrated: false,
  });

  WW.Save = {
    data: defaults(),

    load() {
      this.data = defaults();
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (parsed.stars) for (const k in parsed.stars) {
              const n = parseInt(k, 10);
              if (n >= 1 && n <= WW.TOTAL_LEVELS) {
                this.data.stars[k] = Math.max(0, Math.min(3, parsed.stars[k] | 0));
              }
            }
            this.data.flashlight = !!parsed.flashlight;
            this.data.bonus = !!parsed.bonus;
            this.data.completed = !!parsed.completed;
            this.data.gift = ['cocoa', 'globe', 'flashlight'].includes(parsed.gift) ? parsed.gift : null;
            this.data.giftMigrated = !!parsed.giftMigrated;
            // one-time heal: pre-inventory saves that caught the flashlight
            if (this.data.flashlight && !this.data.gift && !this.data.giftMigrated) {
              this.data.gift = 'flashlight';
              this.data.giftMigrated = true;
              this.write();
            }
          }
        }
      } catch (e) { /* private mode / corrupt: keep defaults */ }
      return this.data;
    },

    write() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
      catch (e) { /* storage unavailable: play without saving */ }
    },

    reset() {
      this.data = defaults();
      this.write();
    },

    stars(n) { return this.data.stars[String(n)] | 0; },

    setStars(n, s) {
      const k = String(n);
      if (s > (this.data.stars[k] | 0)) {
        this.data.stars[k] = s;
        this.write();
      }
    },

    /* A main level is playable if it's day 1 or the previous day was survived. */
    isUnlocked(n) {
      if (n <= 1) return true;
      if (n > WW.MAIN_LEVELS) {
        // bonus days: need the flashlight finale, then survive each in order
        return this.data.bonus && (n === WW.MAIN_LEVELS + 1 || this.stars(n - 1) >= 1);
      }
      return this.stars(n - 1) >= 1;
    },

    /* Highest playable day. */
    maxLevel() {
      let m = 1;
      for (let n = 1; n <= WW.TOTAL_LEVELS; n++) {
        if (this.stars(n) >= 1) m = n;
      }
      return Math.min(WW.TOTAL_LEVELS, this.isUnlocked(m + 1) ? m + 1 : m);
    },

    totalStars() {
      let t = 0;
      for (const k in this.data.stars) t += this.data.stars[k];
      return t;
    },

    grantFlashlight() {
      if (!this.data.flashlight) {
        this.data.flashlight = true;
        this.write();
      }
    },

    unlockBonus() {
      if (!this.data.bonus) {
        this.data.bonus = true;
        this.write();
      }
    },
  };
})();
