/* ============================================================
   WINTER WIZARD — render.js
   All drawing. Emoji sprites + retro canvas shapes.
   Exposes WW.R.draw(game) called every frame by game.js.
   ============================================================ */
window.WW = window.WW || {};
(function () {
  'use strict';

  const R = {};
  WW.R = R;
  let scanPattern = null;

  /* ---------------- helpers ---------------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) {
    return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];
  }
  function rgb(a) { return 'rgb(' + a[0] + ',' + a[1] + ',' + a[2] + ')'; }
  function E(ctx, e, x, y, s, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.font = Math.round(s) + 'px "Segoe UI Emoji","Apple Color Emoji",serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e, x, y);
    ctx.restore();
  }
  /* Double-printed emoji: composited over itself it fills in soft,
     low-opacity glyph pixels, guaranteeing a solid look. */
  function Es(ctx, e, x, y, s, alpha) {
    E(ctx, e, x, y, s, alpha);
    E(ctx, e, x, y, s, alpha);
  }
  function text(ctx, str, x, y, size, color, align, weight) {
    ctx.save();
    ctx.font = (weight || 'bold') + ' ' + Math.round(size) + 'px "Courier New",monospace';
    ctx.fillStyle = color;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function textShadow(ctx, str, x, y, size, color, shadow, align, weight) {
    text(ctx, str, x + 2, y + 2, size, shadow, align, weight);
    text(ctx, str, x, y, size, color, align, weight);
  }
  function panel(ctx, x, y, w, h, fill, stroke) {
    ctx.save();
    ctx.fillStyle = fill || 'rgba(10,16,38,0.82)';
    ctx.strokeStyle = stroke || '#7fd4ff';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.restore();
  }
  function btn(ctx, b, hover, accent) {
    const on = hover;
    ctx.save();
    ctx.fillStyle = on ? '#274a7a' : '#101c3c';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = b.disabled ? '#33415e' : (on ? '#ffd94a' : (accent || '#7fd4ff'));
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    if (b.sub) {
      text(ctx, b.label, b.x + b.w / 2, b.y + b.h * 0.34, b.font || 16, b.disabled ? '#5b6b8c' : (on ? '#ffffff' : '#cfe8ff'), 'center');
      text(ctx, b.sub, b.x + b.w / 2, b.y + b.h * 0.7, 11, b.disabled ? '#44526e' : '#9db8dd', 'center');
    } else {
      text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, b.font || 16, b.disabled ? '#5b6b8c' : (on ? '#ffffff' : '#cfe8ff'), 'center');
    }
    ctx.restore();
  }
  function stars(ctx, n, x, y, size) {
    for (let i = 0; i < 3; i++) {
      const on = i < n;
      textShadow(ctx, on ? '★' : '☆', x + (i - 1) * size * 1.2, y, size, on ? '#ffd94a' : '#516086', '#000', 'center');
    }
  }
  function scanlines(ctx, g) {
    if (!scanPattern) {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 4;
      const cx = c.getContext('2d');
      cx.fillStyle = 'rgba(0,0,0,0.14)';
      cx.fillRect(0, 2, 4, 2);
      scanPattern = ctx.createPattern(c, 'repeat');
    }
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = scanPattern;
    ctx.fillRect(0, 0, g.W, g.H);
    ctx.restore();
  }
  function vignette(ctx, g) {
    ctx.save();
    const grd = ctx.createRadialGradient(g.W / 2, g.H / 2, g.H * 0.45, g.W / 2, g.H / 2, g.H * 0.95);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(2,4,16,0.42)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, g.W, g.H);
    ctx.restore();
  }

  /* ---------------- sky, mountains, ground ---------------- */
  function drawSky(ctx, g) {
    const p = g.sun ? g.sun.p() : 0;
    const anger = g.sun ? g.sun.anger() : 0;
    const night = [10, 14, 42], dawn = [96, 62, 122], day = [86, 140, 200], dusk = [140, 82, 120];
    let top, bot;
    if (p < 0.14) { const t = clamp(p / 0.14, 0, 1); top = mix(night, dawn, t); bot = mix(night, [230, 120, 130], t); }
    else if (p < 0.86) { const t = clamp((p - 0.14) / 0.72, 0, 1); top = mix(dawn, day, Math.min(1, t * 3)); bot = mix([230, 120, 130], [150, 200, 235], Math.min(1, t * 3)); }
    else { const t = clamp((p - 0.86) / 0.14, 0, 1); top = mix(day, dusk, t); bot = mix([150, 200, 235], [200, 100, 110], t); }
    const grd = ctx.createLinearGradient(0, 0, 0, g.groundY);
    grd.addColorStop(0, rgb(top));
    grd.addColorStop(1, rgb(bot));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, g.W, g.groundY);
    // anger tint washes the sky red
    if (anger > 0.45 && g.state === 'play') {
      ctx.fillStyle = `rgba(255,60,20,${(anger - 0.45) * 0.22})`;
      ctx.fillRect(0, 0, g.W, g.groundY);
    }
    // stars
    const dark = Math.min(clamp((0.14 - p) / 0.14, 0, 1), clamp((p - 0.86) / 0.14, 0, 1));
    if (dark > 0.02) {
      ctx.save();
      for (const s of g.bgStars) {
        const tw = 0.5 + 0.5 * Math.sin(g.t * s.tw + s.x);
        ctx.globalAlpha = dark * tw;
        ctx.fillStyle = '#dfeaff';
        ctx.fillRect(s.x * g.W, s.y * g.groundY * 0.9, s.s, s.s);
      }
      ctx.restore();
    }
  }
  function drawMountains(ctx, g) {
    const p = g.sun ? g.sun.p() : 0;
    const night = Math.min(clamp((0.14 - p) / 0.14, 0, 1), clamp((p - 0.86) / 0.14, 0, 1));
    const c1 = mix([40, 60, 100], [16, 22, 48], night);
    const c2 = mix([58, 84, 128], [26, 34, 66], night);
    ctx.save();
    // far range
    ctx.fillStyle = rgb(c1);
    ctx.beginPath();
    ctx.moveTo(0, g.groundY);
    for (let x = 0; x <= g.W; x += g.W / 10) {
      const h = g.H * 0.16 * (0.4 + 0.6 * Math.abs(Math.sin(x * 0.013 + 2)));
      ctx.lineTo(x, g.groundY - h);
      ctx.lineTo(x + g.W / 20, g.groundY - h * 0.55);
    }
    ctx.lineTo(g.W, g.groundY);
    ctx.closePath();
    ctx.fill();
    // near range
    ctx.fillStyle = rgb(c2);
    ctx.beginPath();
    ctx.moveTo(0, g.groundY);
    for (let x = 0; x <= g.W; x += g.W / 7) {
      const h = g.H * 0.10 * (0.5 + 0.5 * Math.abs(Math.sin(x * 0.021 + 1)));
      ctx.lineTo(x, g.groundY - h);
      ctx.lineTo(x + g.W / 14, g.groundY - h * 0.5);
    }
    ctx.lineTo(g.W, g.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function drawGround(ctx, g) {
    const p = g.sun ? g.sun.p() : 0;
    const night = Math.min(clamp((0.14 - p) / 0.14, 0, 1), clamp((p - 0.86) / 0.14, 0, 1));
    ctx.save();
    const grd = ctx.createLinearGradient(0, g.groundY, 0, g.H);
    grd.addColorStop(0, rgb(mix([236, 244, 255], [90, 110, 150], night)));
    grd.addColorStop(1, rgb(mix([190, 210, 236], [60, 80, 120], night)));
    ctx.fillStyle = grd;
    ctx.fillRect(0, g.groundY, g.W, g.H - g.groundY);
    // humps
    ctx.strokeStyle = 'rgba(120,150,200,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -20; x < g.W + 40; x += 80) {
      ctx.moveTo(x, g.groundY + 34);
      ctx.quadraticCurveTo(x + 40, g.groundY + 14, x + 80, g.groundY + 34);
    }
    ctx.stroke();
    // decorations
    for (const d of g.groundDeco) {
      let e = d.e;
      if (g.level && g.level.special === 'christmas' && e === '🎄') e = '🎄';
      E(ctx, e, d.x * g.W, g.groundY + 8 + d.dy, d.s * Math.min(1, g.W / 900));
    }
    ctx.restore();
  }

  /* ---------------- sun ---------------- */
  function drawSun(ctx, g) {
    const pos = g.sun.pos();
    const x = pos.x, y = pos.y;
    const sf = g.sun.factor();
    if (sf <= 0.001 && g.state === 'play') return;
    const anger = g.sun.anger();
    const base = Math.max(34, Math.min(56, g.H * 0.085));
    const r = base * (1 + 0.08 * Math.sin(g.t * 2) * anger) * (0.9 + 0.25 * sf);
    // blast charge glow
    let charging = false;
    for (const b of g.blasts) if (b.phase === 'charge') charging = true;
    if (charging) {
      const pl = 0.5 + 0.5 * Math.sin(g.t * 14);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.25 * pl;
      const gr = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3.2);
      gr.addColorStop(0, 'rgba(255,190,60,0.9)');
      gr.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      E(ctx, '⚡', x + r * 1.4, y - r * 0.8, r * 0.9);
    }
    // rays
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(g.t * 0.25);
    const nRays = 12;
    for (let i = 0; i < nRays; i++) {
      const a = (i / nRays) * Math.PI * 2;
      const len = r * (1.35 + 0.5 * sf) * (i % 2 ? 0.75 : 1) * (1 + 0.15 * Math.sin(g.t * 3 + i));
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = anger > 0.75 ? '#ff8c1a' : '#ffd94a';
      ctx.beginPath();
      ctx.moveTo(r * 0.95, -r * 0.16);
      ctx.lineTo(r * 0.95 + len, 0);
      ctx.lineTo(r * 0.95, r * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // body
    const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    grd.addColorStop(0, '#fff3b0');
    grd.addColorStop(0.6, rgb(mix([255, 214, 90], [255, 120, 30], anger)));
    grd.addColorStop(1, rgb(mix([255, 170, 40], [230, 60, 10], anger)));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = anger > 0.85 ? '#c92a0a' : '#e8a020';
    ctx.stroke();
    // ---- face (drawn shapes) ----
    const ex = r * 0.42, ey = -r * 0.18, er = r * 0.16;
    // eyes
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath();
      ctx.ellipse(x + s * ex, y + ey, er, er * (anger > 0.75 ? 0.75 : 1.05), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1608';
      const px = x + s * ex + r * 0.06, py = y + ey + r * 0.07;
      ctx.beginPath();
      ctx.ellipse(px, py, er * (anger > 0.75 ? 0.42 : 0.5), er * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // brows
    for (const s of [-1, 1]) {
      ctx.strokeStyle = '#7a3b00';
      ctx.lineWidth = r * 0.11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const inY = y + ey - er * (1.3 - anger * 0.6);
      const outY = y + ey - er * (0.2 + anger * 2.6);
      ctx.moveTo(x + s * ex * 0.45, inY);
      ctx.lineTo(x + s * ex * 1.7, outY);
      ctx.stroke();
    }
    // mouth: smile -> flat -> frown -> gritted
    const my = y + r * 0.45;
    ctx.strokeStyle = '#7a3b00';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    if (anger < 0.4) {
      ctx.arc(x, my - r * 0.1, r * 0.42, 0.25 * Math.PI, 0.75 * Math.PI);
    } else if (anger < 0.72) {
      ctx.moveTo(x - r * 0.3, my);
      ctx.lineTo(x + r * 0.3, my);
    } else if (anger < 0.9) {
      ctx.arc(x, my + r * 0.34, r * 0.34, Math.PI * 1.22, Math.PI * 1.78);
    } else {
      // gritted teeth
      ctx.fillStyle = '#5a1c00';
      ctx.beginPath();
      ctx.ellipse(x, my, r * 0.5, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fffdf2';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * r * 0.18, my - r * 0.24);
        ctx.lineTo(x + i * r * 0.18, my + r * 0.24);
        ctx.stroke();
      }
    }
    if (anger >= 0.4 && anger < 0.9) { ctx.stroke(); }
    // sweat drop (nervous) when cooling well
    const tempRatio = g.temp / g.level.limit;
    if (tempRatio < 0.35 && g.state === 'play') {
      ctx.fillStyle = '#8fd0ff';
      ctx.beginPath();
      ctx.moveTo(x + r * 0.95, y - r * 0.5);
      ctx.quadraticCurveTo(x + r * 1.15, y - r * 0.1, x + r * 0.95, y + r * 0.05);
      ctx.quadraticCurveTo(x + r * 0.75, y - r * 0.1, x + r * 0.95, y - r * 0.5);
      ctx.fill();
    }
    // steam puffs when furious
    if (anger > 0.85) {
      for (let i = 0; i < 2; i++) {
        const tt = (g.t * 0.8 + i * 0.5) % 1;
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - tt);
        ctx.fillStyle = '#ff9a5a';
        ctx.beginPath();
        ctx.arc(x - r * 0.9 + i * r * 1.8, y - r * (1.2 + tt), r * 0.14 * (1 + tt), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      E(ctx, '💢', x - r * 1.35, y - r * 0.9, r * 0.5);
    }
  }

  /* ---------------- clouds ---------------- */
  /* Shared geometry for big emoji clouds. */
  function cloudGeom(g, c) {
    const size = Math.min(g.laneW * 0.95, 185);
    const lx = g.laneX(c.lane) + g.laneW / 2;
    const y = g.cloudY - (c.stack || 0) * size * 0.42 + Math.sin(g.t * 1.3 + c.seed) * 4;
    return { lx, y, size };
  }
  function drawCloud(ctx, g, c) {
    const gm = cloudGeom(g, c);
    const frac = clamp(c.life / c.max, 0, 1);
    // solid when fresh, fading steadily as sunlight melts it away
    const born = clamp((g.t - (c.born || 0)) * 4, 0, 1);
    const sc = 0.6 + 0.4 * born;
    const melt = Math.pow(frac, 0.8);
    const alpha = c.dying ? Math.max(0, c.dieT / 0.4)
                          : (0.25 + 0.75 * melt) * (0.55 + 0.45 * born);
    const prints = c.dying ? 1 : (frac > 0.5 ? 2 : 1);  // double-print = solid when fresh
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < prints; i++) E(ctx, '☁️', gm.lx, gm.y, gm.size * sc);
    if (c.raining) E(ctx, '🌧️', gm.lx + gm.size * 0.3, gm.y - gm.size * 0.44, gm.size * 0.34);
    ctx.restore();
  }
  function drawClouds(ctx, g) {
    g.clouds.forEach((c) => drawCloud(ctx, g, c));
  }
  /* Ground shadow each cloud throws on the snow, leaning away from
     the sun. Fades in sync with the cloud. */
  function drawCloudShadows(ctx, g) {
    const sf = g.sun ? g.sun.factor() : 0;
    if (sf <= 0.02 || !g.clouds.length) return;
    const sunX = g.sun.pos().x;
    for (const c of g.clouds) {
      const gm = cloudGeom(g, c);
      const frac = clamp(c.life / c.max, 0, 1);
      const a = (c.dying ? Math.max(0, c.dieT / 0.4) : 0.25 + 0.75 * Math.pow(frac, 0.8)) * sf;
      if (a <= 0.01) continue;
      const off = clamp((gm.lx - sunX) / g.W, -0.5, 0.5) * g.laneW * 0.55;
      ctx.fillStyle = 'rgba(42,62,124,' + (0.34 * a).toFixed(3) + ')';
      ctx.beginPath();
      ctx.ellipse(gm.lx + off, g.groundY + 14, g.laneW * 0.38 * (0.75 + 0.25 * frac), 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------------- weather per lane ---------------- */
  function drawWeather(ctx, g) {
    const lw = g.laneW;
    for (let i = 0; i < WW.CONST.LANES; i++) {
      const L = g.lanes[i];
      const cx = g.laneX(i) + lw / 2;
      // snow
      if (L.snow > 0) {
        const n = 8;
        for (let j = 0; j < n; j++) {
          const tt = ((g.t * 0.5 + j * 0.13 + i * 0.31) % 1);
          const yy = g.cloudY - 20 + tt * (g.groundY - g.cloudY);
          const xx = cx + Math.sin(j * 2.4 + g.t * 2) * lw * 0.32;
          E(ctx, '❄️', xx, yy, 13 + (j % 3) * 4, 0.9 * Math.min(1, L.snow));
        }
      }
      // rain
      if (L.rain > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(120,180,255,0.85)';
        ctx.lineWidth = 2;
        for (let j = 0; j < 10; j++) {
          const tt = ((g.t * 1.4 + j * 0.1 + i * 0.17) % 1);
          const yy = g.cloudY + tt * (g.groundY - g.cloudY);
          const xx = cx + (j - 4.5) * lw * 0.09;
          ctx.beginPath();
          ctx.moveTo(xx, yy); ctx.lineTo(xx - 3, yy + 12);
          ctx.stroke();
        }
        ctx.restore();
      }
      // wind
      if (L.wind > 0) {
        const a = Math.min(1, L.wind);
        for (let j = 0; j < 3; j++) {
          const tt = ((g.t * 0.9 + j * 0.33) % 1);
          const yy = g.cloudY + 55 + j * 32;
          const xx = g.laneX(i) + lw * (1 - tt);
          ctx.save();
          ctx.globalAlpha = a * (1 - tt * 0.4);
          ctx.strokeStyle = '#bfefff';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.moveTo(xx + k * 8, yy + k * 5);
            ctx.quadraticCurveTo(xx + 22 + k * 8, yy - 8 + k * 5, xx + 44 + k * 8, yy + k * 5);
            ctx.stroke();
          }
          ctx.restore();
        }
        E(ctx, '💨', g.laneX(i) + lw - 30, g.cloudY + 115, 34, a);   // below the cloud band so it stays visible
      }
    }
  }

  /* ---------------- fireballs / rays / blasts ---------------- */
  function fireballPos(g, f) {
    const t = clamp(f.t / f.dur, 0, 1);
    const mx = (f.sx + f.tx) / 2;
    const my = Math.min(f.sy, g.H * 0.08) - g.H * 0.14;
    const u = 1 - t;
    const x = u * u * f.sx + 2 * u * t * mx + t * t * f.tx;
    const y = u * u * f.sy + 2 * u * t * my + t * t * f.ty;
    return { x, y };
  }
  function drawFireballs(ctx, g) {
    for (const f of g.fireballs) {
      const p = fireballPos(g, f);
      // target ring telegraph (dims when a cloud guards the lane)
      const guarded = g.lanes[f.lane] && g.lanes[f.lane].cloud;
      ctx.save();
      ctx.strokeStyle = `rgba(255,90,30,${guarded ? 0.12 : 0.4 + 0.3 * Math.sin(g.t * 10)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(f.tx, g.groundY - 4, 26, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      const s = f.weakened ? 20 : 30;
      E(ctx, '🔥', p.x, p.y, s);
      if (f.weakened) E(ctx, '💨', p.x + 16, p.y - 12, 18, 0.8);
    }
  }
  function drawRays(ctx, g) {
    for (const r of g.rays) {
      const sx = g.sun.pos().x, sy = g.sun.pos().y;
      const cx = g.laneX(WW.CONST.CASTLE_LANE) + g.laneW / 2;
      // if the castle lane is covered, the ray aims at (and stops at) the cloud
      const coveredNow = g.cloudsInLane(WW.CONST.CASTLE_LANE) > 0;
      const cy = r.blocked && r.blockY !== undefined ? r.blockY - 20
               : coveredNow ? g.cloudY - 20
               : g.groundY - 60;
      if (r.phase === 'charge') {
        ctx.save();
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = -g.t * 40;
        ctx.strokeStyle = `rgba(255,240,80,${0.35 + 0.3 * Math.sin(g.t * 12)})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.setLineDash([]);
        // reticle on the target (castle, or the cloud guarding it)
        ctx.strokeStyle = `rgba(255,240,80,${0.5 + 0.4 * Math.sin(g.t * 12)})`;
        ctx.lineWidth = 3;
        const rr = 34 + 6 * Math.sin(g.t * 12);
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - rr - 8, cy); ctx.lineTo(cx - rr + 6, cy); ctx.moveTo(cx + rr + 8, cy); ctx.lineTo(cx + rr - 6, cy); ctx.stroke();
        ctx.restore();
      } else {
        // beam: jagged lightning — stops AT the blocking cloud when blocked
        ctx.save();
        ctx.globalAlpha = clamp(1 - r.t / r.dur, 0, 1);
        const beamEnd = r.blocked && r.blockY !== undefined ? r.blockY - 20 : cy;
        for (let pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = r.blocked ? (pass === 0 ? '#7fd4ff' : '#e8f8ff')
                        : pass === 0 ? '#ffe94a' : '#fffbe0';
          ctx.lineWidth = pass === 0 ? 7 : 3;
          ctx.beginPath();
          const steps = 8;
          for (let i = 0; i <= steps; i++) {
            const tt = i / steps;
            const jx = i > 0 && i < steps ? (Math.sin(i * 9.7 + g.t * 40) * 16) : 0;
            const x = lerp(sx, cx, tt) + jx;
            const y = lerp(sy, beamEnd, tt) + (i > 0 && i < steps ? Math.cos(i * 7.3 + g.t * 31) * 8 : 0);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        E(ctx, r.blocked ? '☁️' : '⚡', cx + 26, beamEnd - 14, r.blocked ? 30 : 30, clamp(1 - r.t / r.dur, 0, 1));
        ctx.restore();
      }
    }
  }
  function drawBlasts(ctx, g) {
    for (const b of g.blasts) {
      const sx = g.sun.pos().x, sy = g.sun.pos().y;
      const cx = g.laneX(b.lane) + g.laneW / 2;
      if (b.phase === 'charge') {
        const pl = 0.5 + 0.5 * Math.sin(g.t * 16);
        ctx.save();
        ctx.fillStyle = `rgba(255,120,20,${0.10 + 0.10 * pl})`;
        ctx.fillRect(g.laneX(b.lane), 0, g.laneW, g.groundY);
        ctx.restore();
        E(ctx, '⚠️', cx, g.groundY - 92, 34, 0.7 + 0.3 * pl);
        E(ctx, '🔥', cx, g.groundY - 58, 22, 0.4 + 0.4 * pl);
      } else {
        ctx.save();
        const a = clamp(1 - b.t / b.dur, 0, 1);
        ctx.globalAlpha = a;
        const gr = ctx.createLinearGradient(cx - g.laneW * 0.2, 0, cx + g.laneW * 0.2, 0);
        gr.addColorStop(0, 'rgba(255,60,0,0)');
        gr.addColorStop(0.5, '#ffb20a');
        gr.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = gr;
        const w = g.laneW * (0.28 + 0.2 * (1 - a));
        ctx.fillRect(cx - w, Math.min(sy, g.H * 0.06), w * 2, g.groundY - Math.min(sy, g.H * 0.06));
        E(ctx, '☀️', cx, g.groundY - 26, 40, a);
        ctx.restore();
      }
    }
  }

  /* ---------------- Santa & gifts ---------------- */
  function drawSanta(ctx, g) {
    if (!g.santa) return;
    const s = g.santa;
    E(ctx, '🛷', s.x, s.y, 54);
    E(ctx, '🎅', s.x - 4, s.y - 26, 44);
    for (let i = 0; i < 3; i++) {
      const tt = (g.t * 2 + i * 0.33) % 1;
      E(ctx, '✨', s.x - 30 - tt * 60, s.y - 10 + i * 12, 14, (1 - tt) * 0.7);
    }
    if (s.ho) text(ctx, 'HO HO HO!', s.x + 10, s.y - 60, 18, '#ffdddd', 'left');
  }
  function drawGifts(ctx, g) {
    for (const gf of g.gifts) {
      if (gf.collected) continue;
      const bob = gf.landed ? Math.sin(g.t * 3) * 4 : 0;
      const a = gf.landed ? clamp(gf.life / 2, 0, 1) : 1;
      if (gf.landed) {
        ctx.save();
        ctx.globalAlpha = 0.4 * a;
        ctx.fillStyle = '#ffd94a';
        ctx.beginPath();
        ctx.ellipse(gf.x, gf.y + 22, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      E(ctx, '🎁', gf.x, gf.y + bob, 34, a);
      E(ctx, '❕', gf.x, gf.y - 34 + bob, 16, a * (0.6 + 0.4 * Math.sin(g.t * 6)));
    }
  }

  /* ---------------- particles ---------------- */
  function drawParticles(ctx, g) {
    for (const p of g.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      if (p.emoji) {
        E(ctx, p.emoji, p.x, p.y, p.size);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }
  }

  /* ---------------- groundhog (finale) ---------------- */
  function drawHog(ctx, g) {
    const h = g.hog;
    if (!h) return;
    ctx.save();
    ctx.translate(h.x, h.y);
    // 🦫 faces left by default: flip him to face right while walking east,
    // natural orientation while fleeing home west
    if (!h.scared) ctx.scale(-1, 1);
    const hop = h.scared ? Math.sin(h.hopT * Math.PI) * 30 : Math.sin(g.t * 6) * 2;
    E(ctx, '🦫', 0, -24 - hop, 46);
    if (h.scared) {
      for (let i = 1; i <= 2; i++) {
        E(ctx, '💨', -26 - i * 16, -12 - hop * 0.6, 22 - i * 5, 0.7 - i * 0.25);
      }
    }
    ctx.restore();
  }

  /* ---------------- castle & wizard ---------------- */
  function drawCastle(ctx, g) {
    const cx = g.laneX(WW.CONST.CASTLE_LANE) + g.laneW * 0.5;
    const gy = g.groundY;
    const s = Math.min(1.1, g.W / 900);
    const wx = cx + 38 * s;   // wizard stands beside the keep
    Es(ctx, '🏰', cx - 34 * s, gy - 30 * s, 72 * s);
    Es(ctx, '🧙', wx, gy - 24 * s, 42 * s);
    // wand spark while casting
    const w = g.wizard;
    if (w && w.castAnim > 0) {
      E(ctx, '✨', wx + 14, gy - 24 * s - 30 * (1 - w.castAnim) - 8, 18, w.castAnim);
    }
    // stun lock over head
    for (const spellId in w.stuns) {
      if (w.stuns[spellId] > 0) {
        E(ctx, '🔒', wx, gy - 58 * s, 22, 0.9);
        break;
      }
    }
  }

  /* ---------------- HUD ---------------- */
  function drawHUD(ctx, g) {
    const lv = g.level;
    // top panel
    panel(ctx, 10, 10, g.W - 20, 54, 'rgba(8,12,30,0.75)', '#3b5b8f');
    // --- thermometer ---
    const bx = 34, bw = Math.min(280, g.W * 0.24), by = 24, bh = 26;
    E(ctx, '🌡️', 18, 37, 24);
    const ratio = clamp(g.temp / lv.limit, 0, 1.05);
    ctx.fillStyle = '#101c3c';
    ctx.fillRect(bx, by, bw, bh);
    // star zones: goal (30°F) = 3★, warn line (goal+limit)/2 = 2★, limit = melt
    const goal = WW.CONST.AVG_WINTER;
    const warn = (goal + lv.limit) / 2;
    const zone = g.temp > warn ? 2 : g.temp > goal ? 1 : 0;
    const zoneCol = ['#3ddc55', '#ffa20a', '#ff3030'][zone];
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const on = ratio >= i / segs;
      ctx.fillStyle = on ? zoneCol : '#1c2c50';
      ctx.fillRect(bx + i * (bw / segs) + 1, by + 2, bw / segs - 2, bh - 4);
    }
    ctx.strokeStyle = '#7fd4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    const flash = zone === 2 ? 0.5 + 0.5 * Math.sin(g.t * 10) : 1;
    const numCol = zone === 2 ? `rgb(255,${Math.round(80 * flash)},60)` : zone === 1 ? '#ffa20a' : '#9fe8ff';
    text(ctx, Math.round(g.temp) + '°F', bx + bw + 12, by + bh / 2, 20, numCol, 'left');
    text(ctx, 'LIMIT ' + lv.limit + '°F', bx + bw + 84, by + bh / 2, 13, '#9db8dd', 'left');
    // winter goal tick (❄) + warn tick (⚠) on the bar
    const goalX = bx + bw * clamp(goal / lv.limit, 0, 1);
    ctx.fillStyle = '#9fe8ff';
    ctx.fillRect(goalX - 1, by - 4, 2, bh + 8);
    E(ctx, '❄', goalX, by - 10, 13, 0.9);
    const warnX = bx + bw * clamp(warn / lv.limit, 0, 1);
    ctx.fillStyle = '#ffa20a';
    ctx.fillRect(warnX - 1, by - 4, 2, bh + 8);
    E(ctx, '⚠', warnX, by - 10, 13, 0.9);
    text(ctx, '❄' + goal + '° GOAL  ·  ⚠' + warn + '° RISK  ·  LIMIT ' + lv.limit + '°F', bx, by + bh + 8, 11, '#9db8dd', 'left');
    // --- day progress ---
    const dp = clamp(g.dayTime / lv.day, 0, 1);
    const dw = Math.min(220, g.W * 0.2);
    const dx = g.W - dw - 90, dy = 24;
    ctx.fillStyle = '#101c3c';
    ctx.fillRect(dx, dy + 6, dw, 14);
    ctx.fillStyle = '#ffd94a';
    ctx.fillRect(dx, dy + 6, dw * dp, 14);
    ctx.strokeStyle = '#3b5b8f';
    ctx.strokeRect(dx, dy + 6, dw, 14);
    E(ctx, '☀️', dx + dw * dp, dy + 13, 22);
    E(ctx, '🌙', dx + dw + 16, dy + 13, 20);
    const remain = Math.max(0, lv.day - g.dayTime);
    text(ctx, Math.ceil(remain) + 's', dx + dw / 2, dy + 40, 13, '#9db8dd');
    // --- title ---
    const name = 'DAY ' + g.levelNum + ' · ' + lv.name.toUpperCase() + (lv.special === 'christmas' ? ' 🎅' : lv.special === 'finale' ? ' 🦫' : lv.special === 'bonus' ? ' ❄️' : '');
    text(ctx, name, g.W / 2, 37, Math.min(19, g.W * 0.024), '#cfe8ff');
    // live star tracker: stars you can still earn at sunset
    const live = g.liveStars ? g.liveStars() : 3;
    const lost1 = g.maxTemp > goal, lost2 = g.maxTemp > warn;
    const starTxt = (live >= 1 ? '★' : '☆') + (lost2 ? '☆' : '★') + (lost1 ? '☆' : '★');
    const starCols = ['#ffd94a', lost2 ? '#ff5050' : '#ffd94a', lost1 ? '#ffa20a' : '#ffd94a'];
    for (let i = 0; i < 3; i++) text(ctx, starTxt[i], g.W / 2 + (i - 1) * 22, 52, 16, starCols[i]);
    text(ctx, 'PEAK ' + Math.round(g.maxTemp) + '°F', g.W / 2 + 46, 52, 11, '#9db8dd', 'left');
  }
  function drawSpellBar(ctx, g) {
    const w = g.wizard;
    const ids = w.spells;
    const size = Math.max(52, Math.min(64, g.W / 18));
    const gap = 10;
    const count = ids.length + 1;   // + always-visible gift slot (key 6)
    const total = count * size + (count - 1) * gap;
    let x = (g.W - total) / 2;
    const y = g.H - size - 14;
    g.spellBarRects = [];
    for (const id of ids) {
      const S = WW.SPELLS[id];
      const b = { id, x, y, w: size, h: size };
      g.spellBarRects.push(b);
      const ready = w.isReady(id);
      const selected = w.selected === id;
      const hovered = g.hover && g.hover.x >= x && g.hover.x <= x + size && g.hover.y >= y && g.hover.y <= y + size;
      ctx.save();
      ctx.fillStyle = selected ? '#3a2c6e' : (ready ? '#152447' : '#0d1526');
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = selected ? '#ffd94a' : hovered ? '#9fdcff' : '#3b5b8f';
      ctx.lineWidth = selected ? 3 : 2;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      E(ctx, S.icon, x + size / 2, y + size * 0.42, size * 0.52);
      text(ctx, S.key, x + 10, y + 10, 12, '#9db8dd', 'left');
      // cooldown sweep
      if (w.cds[id] > 0) {
        const frac = clamp(w.cds[id] / (w.cdMax[id] || 1), 0, 1);
        ctx.fillStyle = 'rgba(4,8,20,0.75)';
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + size / 2);
        ctx.arc(x + size / 2, y + size / 2, size, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.closePath();
        ctx.fill();
      }
      // stun lock
      if (w.stuns[id] > 0) {
        ctx.fillStyle = 'rgba(200,20,20,0.35)';
        ctx.fillRect(x, y, size, size);
        E(ctx, '🔒', x + size / 2, y + size * 0.42, size * 0.5);
      }
      ctx.restore();
      x += size + gap;
    }
    // gift slot (key 6): holds exactly what Santa last gave you —
    // ☕/🔮 consumables (×1, used with 6), 🔦 flashlight (∞, never consumed),
    // or a dimmed Santa hint when you have no gift
    {
      const heldType = g.heldGift;
      const G = heldType ? WW.GIFTS[heldType] : null;
      const b = { id: 'gift', x, y, w: size, h: size };
      g.spellBarRects.push(b);
      const hovered = g.hover && g.hover.x >= x && g.hover.x <= x + size && g.hover.y >= y && g.hover.y <= y + size;
      ctx.save();
      ctx.fillStyle = heldType ? (heldType === 'flashlight' ? '#233a5f' : '#3a2450') : '#0d1526';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = heldType ? (hovered ? '#ffd94a' : (heldType === 'flashlight' ? '#9fdcff' : '#c89aff')) : (hovered ? '#9fdcff' : '#26314e');
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      if (heldType) {
        E(ctx, G.icon, x + size / 2, y + size * 0.42, size * 0.5);
        text(ctx, '6', x + 10, y + 10, 12, '#9db8dd', 'left');
        text(ctx, heldType === 'flashlight' ? '∞' : '×1', x + size - 8, y + size - 9, 11, '#ffd94a', 'right');
      } else {
        // empty slot: on Christmas day it pulses — Santa's parcel is coming
        const coming = g.level && g.level.special === 'christmas';
        const pl = coming ? 0.55 + 0.35 * Math.sin(g.t * 5) : 0.35;
        E(ctx, '🎁', x + size / 2, y + size * 0.44, size * 0.42, pl);
        E(ctx, '🎅', x + size - 12, y + 12, 13, coming ? 0.85 : 0.55);
        text(ctx, '6', x + 10, y + 10, 12, '#516086', 'left');
      }
      ctx.restore();
      x += size + gap;
    }
    // hint line
    const hintId = w.selected;
    const S = WW.SPELLS[hintId];
    let hint = S.name + (hintId === 'snow' || hintId === 'rain' ? ' — CLICK A LANE WITH A CLOUD' : hintId === 'nova' ? ' — CLICK TO UNLEASH' : ' — CLICK A LANE');
    if (hintId === 'cloud') {
      const cur = g.clouds.filter(c => !c.dying).length;
      hint += '   ·   ☁ ' + cur + '/' + g.wizard.cloudsMax();
    }
    text(ctx, hint, g.W / 2, y - 14, 13, '#9db8dd');
    // snow-globe flash: glow the NOVA button when its cooldown was instantly recharged
    if (g.novaReadyFlash > 0 && g.spellBarRects) {
      const nb = g.spellBarRects.find(r => r.id === 'nova');
      if (nb) {
        const pl = 0.5 + 0.5 * Math.sin(g.t * 10);
        ctx.save();
        ctx.strokeStyle = `rgba(159,220,255,${((0.4 + 0.6 * pl) * Math.min(1, g.novaReadyFlash)).toFixed(2)})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(nb.x - 4, nb.y - 4, nb.w + 8, nb.h + 8);
        E(ctx, '✨', nb.x + nb.w / 2, nb.y - 16, 20, 0.6 + 0.4 * pl);
        ctx.restore();
      }
    }
  }
  function drawLaneTarget(ctx, g) {
    if (!g.hoverLane && g.hoverLane !== 0) return;
    const w = g.wizard;
    const id = w.selected;
    if (id === 'nova') return;
    const lx = g.laneX(g.hoverLane);
    // validity: red tint when the cast would fail here
    let valid = true;
    if (id === 'cloud') valid = g.canPlaceCloud(g.hoverLane);
    else if (id === 'snow' || id === 'rain') valid = !!g.lanes[g.hoverLane].cloud;
    ctx.save();
    ctx.fillStyle = valid ? 'rgba(255,255,255,0.06)' : 'rgba(255,60,60,0.05)';
    ctx.fillRect(lx, 0, g.laneW, g.groundY);
    ctx.strokeStyle = valid ? 'rgba(255,217,74,0.55)' : 'rgba(255,70,70,0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(lx + 3, 4, g.laneW - 6, g.groundY - 8);
    ctx.setLineDash([]);
    if (id === 'cloud') {
      E(ctx, valid ? '☁️' : '🚫', lx + g.laneW / 2, g.cloudY - 8, 40, 0.5 + 0.2 * Math.sin(g.t * 5));
    } else if (id === 'snow' || id === 'rain') {
      E(ctx, valid ? WW.SPELLS[id].icon : '🚫', lx + g.laneW / 2, g.cloudY + 6, 36, 0.55);
    } else if (id === 'wind') {
      E(ctx, '💨', lx + g.laneW / 2, g.cloudY + 6, 36, 0.55);
    }
    ctx.restore();
  }

  /* ---------------- toasts & banners ---------------- */
  function drawToasts(ctx, g) {
    let y = 78;
    for (const t of g.toasts) {
      const a = clamp(t.t / 0.4, 0, 1) * clamp(t.dur - t.t < 0.3 ? (t.dur - t.t) / 0.3 : 1, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      const wpx = Math.max(180, g.W * 0.35);
      panel(ctx, g.W / 2 - wpx / 2, y - 14, wpx, 28, 'rgba(8,12,30,0.85)', t.color || '#7fd4ff');
      text(ctx, t.msg, g.W / 2, y, 15, '#ffffff');
      ctx.restore();
      y += 36;
    }
  }
  function drawUnlockBanner(ctx, g) {
    const u = g.unlockBanner;
    if (!u) return;
    const a = clamp(u.t / 0.3, 0, 1) * clamp((5 - u.t) / 0.4, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    const wpx = g.W * 0.6, h = 92;
    panel(ctx, g.W / 2 - wpx / 2, g.H * 0.24, wpx, h, 'rgba(20,16,50,0.92)', '#ffd94a');
    const isSpell = u.u.type === 'spell';
    textShadow(ctx, (isSpell ? 'NEW SPELL: ' : u.u.type === 'special' ? '' : 'UPGRADE: ') + u.u.name + ' ' + u.u.icon, g.W / 2, g.H * 0.24 + 26, 22, '#ffd94a', '#402c00');
    text(ctx, u.u.desc, g.W / 2, g.H * 0.24 + 56, 15, '#cfe8ff');
    ctx.restore();
  }
  function drawNova(ctx, g) {
    if (g.novaFlash <= 0) return;
    const a = g.novaFlash;
    ctx.save();
    ctx.globalAlpha = a * 0.55;
    ctx.fillStyle = '#bff0ff';
    ctx.fillRect(0, 0, g.W, g.H);
    ctx.globalAlpha = a;
    E(ctx, '🧊', g.W / 2, g.H * 0.28, 90);   // above the cloud band so it stays visible
    ctx.lineWidth = 6;
    ctx.strokeStyle = `rgba(200,245,255,${a})`;
    const rr = (1 - a) * g.W * 0.4 + 40;
    ctx.beginPath();
    ctx.arc(g.W / 2, g.H * 0.28, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------- screens ---------------- */
  function drawTitle(ctx, g) {
    drawSky(ctx, g);
    drawMountains(ctx, g);
    drawGround(ctx, g);
    // ambient snow
    for (const p of g.titleFlakes) {
      const x = ((p.x * g.W) + g.t * p.sp * 30) % g.W;
      const y = ((p.y * g.H) + g.t * p.sp * 42) % g.H;
      E(ctx, '❄️', x, y, p.s, 0.7);
    }
    E(ctx, '😠', g.W * 0.5 + Math.sin(g.t * 0.7) * g.W * 0.06, g.H * 0.2, 70, 0.25);
    E(ctx, '🧙', g.W / 2, g.H * 0.66, 90);
    textShadow(ctx, 'WINTER WIZARD', g.W / 2, g.H * 0.3, Math.min(64, g.W * 0.075), '#e8f6ff', '#123');
    textShadow(ctx, '❄ DEFEND THE SNOW FROM THE SUN ☀', g.W / 2, g.H * 0.3 + Math.min(64, g.W * 0.075) * 0.8, Math.min(20, g.W * 0.026), '#9fdcff', '#123');
    const blink = Math.sin(g.t * 4) > -0.2;
    if (blink) textShadow(ctx, 'CLICK / TAP TO BEGIN', g.W / 2, g.H * 0.5, 22, '#ffd94a', '#402c00');
    text(ctx, 'CLOUDS BLOCK SUN & FIRE · SNOW COOLS · SURVIVE TILL SUNSET', g.W / 2, g.H * 0.5 + 40, 14, '#9db8dd');
    text(ctx, '45 DAYS · EVERY 3 DAYS A NEW SPELL · SANTA VISITS DAY 25', g.W / 2, g.H * 0.5 + 62, 14, '#7fa3cf');
    text(ctx, 'M: SOUND · P: PAUSE', g.W / 2, g.H - 30, 12, '#516086');
  }

  function drawSelect(ctx, g) {
    drawSky(ctx, g);
    drawMountains(ctx, g);
    drawGround(ctx, g);
    for (const p of g.titleFlakes) {
      const x = ((p.x * g.W) + g.t * p.sp * 20) % g.W;
      const y = ((p.y * g.H) + g.t * p.sp * 30) % g.H;
      E(ctx, '❄️', x, y, p.s, 0.4);
    }
    textShadow(ctx, 'CHOOSE A DAY', g.W / 2, 52, 34, '#e8f6ff', '#123');
    const total = Object.values(WW.Save.data.stars).reduce((a, b) => a + b, 0);
    text(ctx, '★ ' + total + ' / ' + WW.TOTAL_LEVELS * 3 + (WW.Save.data.flashlight ? '   ·   🔦 SECRET HELD' : '') + (WW.Save.data.gift ? '   ·   ' + WW.GIFTS[WW.Save.data.gift].icon + ' GIFT HELD (6)' : ''), g.W / 2, 88, 15, '#ffd94a');
    // grid buttons were built by game.buildButtons()
    for (const b of g.buttons) {
      if (b.kind !== 'level') continue;
      const on = g.hover && g.hover.x >= b.x && g.hover.x <= b.x + b.w && g.hover.y >= b.y && g.hover.y <= b.y + b.h;
      ctx.save();
      ctx.fillStyle = b.disabled ? '#0c132a' : (b.special === 'christmas' ? '#3a2450' : b.special === 'finale' ? '#50242a' : b.special === 'bonus' ? '#1d3a5f' : '#152447');
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = on && !b.disabled ? '#ffd94a' : (b.disabled ? '#26314e' : b.special === 'bonus' ? '#9fdcff' : '#3b5b8f');
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      if (b.disabled) {
        E(ctx, '🔒', b.x + b.w / 2, b.y + b.h * 0.38, 18);
      } else {
        text(ctx, b.num, b.x + b.w / 2, b.y + b.h * 0.3, 18, b.special === 'bonus' ? '#ffd94a' : '#ffffff');
        stars(ctx, b.starCount, b.x + b.w / 2, b.y + b.h * 0.72, 10);
        if (b.special === 'christmas') E(ctx, '🎅', b.x + b.w - 12, b.y + 12, 14);
        if (b.special === 'finale') E(ctx, '🦫', b.x + b.w - 12, b.y + 12, 14);
      }
      ctx.restore();
    }
    for (const b of g.buttons) {
      if (b.kind === 'level') continue;
      const on = g.hover && g.hover.x >= b.x && g.hover.x <= b.x + b.w && g.hover.y >= b.y && g.hover.y <= b.y + b.h;
      btn(ctx, b, on);
    }
    // bonus legend
    if (WW.Save.data.bonus) text(ctx, '❄ EXTENDED WINTER DAYS 46-48 OPEN ❄', g.W / 2, g.H - 84, 13, '#9fdcff');
    text(ctx, '3★ = NEVER ABOVE ❄30° · 2★ = NEVER ABOVE ⚠ ORANGE LINE · 1★ = SURVIVE', g.W / 2, g.H - 46, 13, '#9db8dd');
  }

  function drawEnd(ctx, g) {
    drawPlay(ctx, g, true);
    const e = g.end;
    ctx.fillStyle = 'rgba(4,6,18,0.72)';
    ctx.fillRect(0, 0, g.W, g.H);
    const wpx = Math.min(560, g.W * 0.86), h = e.win ? (e.ceremony ? 380 : 300) : 280;
    const x = g.W / 2 - wpx / 2, y = Math.max(30, g.H / 2 - h / 2);
    panel(ctx, x, y, wpx, h, 'rgba(12,18,44,0.95)', e.win ? '#ffd94a' : '#ff5050');
    if (e.win) {
      textShadow(ctx, e.ceremony ? 'GROUNDHOG DAY!' : 'DAY ' + g.levelNum + ' SURVIVED!', g.W / 2, y + 42, 28, '#e8f6ff', '#123');
      for (let i = 0; i < 3; i++) {
        const on = i < e.stars;
        const pop = clamp((g.t - e.starT - i * 0.25) / 0.3, 0, 1);
        const s = on ? 40 * (0.5 + 0.5 * pop) + (pop < 1 ? (1 - pop) * 30 : 0) : 26;
        textShadow(ctx, on ? '★' : '☆', g.W / 2 + (i - 1) * 64, y + 96, s, on ? '#ffd94a' : '#516086', '#000');
      }
      const lines = [
        'Peak ' + Math.round(e.maxTemp) + '°F · Final ' + Math.round(e.temp) + '°F · Limit ' + g.level.limit + '°F' + (e.temp <= WW.CONST.AVG_WINTER ? '  ❄ TRUE WINTER' : ''),
        (e.maxTemp <= e.goal ? '✓' : '✗') + ' Never above ❄' + e.goal + '°F  (3rd star)',
        (e.maxTemp <= e.warn ? '✓' : '✗') + ' Never above ⚠' + e.warn + '°F  (2nd star)'
      ];
      if (g.level.special === 'christmas') {
        const gr = g.giftResult;
        lines.push(gr && gr.collected
          ? '🎁 Gift caught: ' + WW.GIFTS[gr.type].icon + ' ' + WW.GIFTS[gr.type].name + (gr.type === 'flashlight' ? ' — ???' : ' — held! Press 6 on any day to use it')
          : '🎁 Gift: it melted away before you grabbed it... 😢');
      }
      lines.forEach((l, i) => text(ctx, l, g.W / 2, y + 150 + i * 24, 15, '#cfe8ff'));
      if (e.ceremony) {
        const c = e.ceremony;
        // groundhog mound
        ctx.fillStyle = '#dfe9f8';
        ctx.beginPath();
        ctx.ellipse(g.W / 2, y + 236, 70, 30, 0, Math.PI, 0);
        ctx.fill();
        const rise = clamp((g.t - e.mhogT) / 0.8, 0, 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(g.W / 2 - 80, y + 160, 160, 80);
        ctx.clip();
        E(ctx, '🦫', g.W / 2, y + 246 - rise * 52, 56);
        ctx.restore();
        if (c.shadow) {
          ctx.fillStyle = 'rgba(30,40,70,0.45)';
          ctx.beginPath();
          ctx.ellipse(g.W / 2 + 74, y + 240, 52, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          E(ctx, '🔦', g.W / 2 - 74, y + 206, 34);
          textShadow(ctx, 'HE SEES HIS SHADOW!', g.W / 2, y + 288, 18, '#ffd94a', '#402c00');
          text(ctx, 'WINTER EXTENDED — 3 BONUS DAYS UNLOCKED!', g.W / 2, y + 314, 14, '#9fdcff');
        } else {
          textShadow(ctx, 'NO SHADOW... SPRING LOOMS.', g.W / 2, y + 288, 17, '#cfe8ff', '#123');
          text(ctx, "(Catch Santa's 🔦 on day 25 — then USE it while the groundhog is on screen!)", g.W / 2, y + 314, 13, '#9db8dd');
        }
      }
    } else {
      textShadow(ctx, 'MELTDOWN!', g.W / 2, y + 48, 34, '#ff7070', '#200');
      text(ctx, 'The temperature exceeded ' + g.level.limit + '°F before sunset.', g.W / 2, y + 92, 15, '#cfe8ff');
      E(ctx, '😤', g.W / 2, y + 150, 64);
      text(ctx, '"' + e.taunt + '"', g.W / 2, y + 214, 15, '#ffd94a');
      text(ctx, 'Peak temp: ' + Math.round(e.maxTemp) + '°F  ·  Final: ' + Math.round(e.temp) + '°F', g.W / 2, y + 244, 13, '#9db8dd');
    }
    for (const b of g.buttons) {
      const on = g.hover && g.hover.x >= b.x && g.hover.x <= b.x + b.w && g.hover.y >= b.y && g.hover.y <= b.y + b.h;
      btn(ctx, b, on);
    }
  }

  function drawPause(ctx, g) {
    ctx.fillStyle = 'rgba(4,6,18,0.6)';
    ctx.fillRect(0, 0, g.W, g.H);
    textShadow(ctx, 'PAUSED', g.W / 2, g.H / 2 - 20, 36, '#e8f6ff', '#123');
    text(ctx, 'P TO RESUME', g.W / 2, g.H / 2 + 24, 16, '#9db8dd');
  }

  /* ---------------- play screen ---------------- */
  function drawPlay(ctx, g, still) {
    drawSky(ctx, g);
    drawMountains(ctx, g);
    drawGround(ctx, g);
    drawHog(ctx, g);
    drawCloudShadows(ctx, g);
    drawWeather(ctx, g);
    drawFireballs(ctx, g);
    drawBlasts(ctx, g);
    drawRays(ctx, g);
    drawSanta(ctx, g);
    drawGifts(ctx, g);
    drawSun(ctx, g);
    drawNova(ctx, g);
    // clouds are the top-most scene layer: sun glows, blast beams & washes,
    // rays and the nova flash all strike BEHIND them — clouds only ever dim
    // when they are actually melting.
    drawClouds(ctx, g);
    // transient bursts (fireball splashes, dissolve puffs) in front
    drawParticles(ctx, g);
    // castle + wizard on top of everything transient — never painted over
    drawCastle(ctx, g);
    if (g.state === 'play' && !still) drawLaneTarget(ctx, g);
    drawHUD(ctx, g);
    if (g.state === 'play') drawSpellBar(ctx, g);
    drawToasts(ctx, g);
    drawUnlockBanner(ctx, g);
    if (g.hog && !g.hog.scared) {
      if (g.heldGift === 'flashlight') {
        text(ctx, '🦫 THE GROUNDHOG! PRESS 6 — SHINE YOUR FLASHLIGHT!', g.W / 2, 100, 15, '#ffd94a');
      } else {
        text(ctx, '🦫 A GROUNDHOG WANDERS THE SNOW...', g.W / 2, 100, 15, '#9db8dd');
      }
    }
    if (g.level.special === 'christmas') {
      const giftWaiting = g.gifts.some(x => !x.collected);
      if (g.santa) {
        text(ctx, '🎁 SANTA IS HERE — CLICK HIS GIFT WHEN IT LANDS!', g.W / 2, 100, 15, '#ffd94a');
      } else if (giftWaiting) {
        const blink = 0.55 + 0.45 * Math.sin(g.t * 6);
        text(ctx, '🎁 HIS GIFT IS ON THE GROUND — CLICK IT FAST!', g.W / 2, 100, 15, `rgba(255,217,74,${blink.toFixed(2)})`);
      }
    }
  }

  /* ---------------- main dispatch ---------------- */
  R.draw = function (game) {
    const g = game, ctx = g.ctx;
    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    let sx = 0, sy = 0;
    if (g.shake > 0) {
      const m = g.shake * 12;
      sx = (Math.random() - 0.5) * m;
      sy = (Math.random() - 0.5) * m;
    }
    ctx.translate(sx, sy);
    ctx.clearRect(-8, -8, g.W + 16, g.H + 16);
    ctx.fillStyle = '#060a1c';
    ctx.fillRect(-8, -8, g.W + 16, g.H + 16);
    if (g.state === 'title') drawTitle(ctx, g);
    else if (g.state === 'select') drawSelect(ctx, g);
    else if (g.state === 'play') { drawPlay(ctx, g); if (g.paused) drawPause(ctx, g); }
    else if (g.state === 'end') drawEnd(ctx, g);
    scanlines(ctx, g);
    vignette(ctx, g);
    if (g.flashErr > 0) {
      ctx.fillStyle = `rgba(255,40,40,${g.flashErr * 0.25})`;
      ctx.fillRect(0, 0, g.W, g.H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
})();
