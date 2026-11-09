/* ==========================================================================
   White Coffee House — White Rewards visual: "beans that build the house".
   --------------------------------------------------------------------------
   A few hundred coffee beans pour in and settle into the logo's house (with
   chimney) and the cup with steam. A fine pointer pushes them away, a finger
   drag scatters them (the page still scrolls), and springs bring every bean
   home. Canvas 2D with pre-rendered bean sprites, no libraries.

     const beans = WCHBeans.mount(el, opts?);   // → { destroy(), replay() }

   el: <div class="rewards__beans" data-beans aria-hidden="true"> — a square
   box (aspect-ratio 1) holding a static fallback <img> (logo-mark.svg). The
   fallback stays until the pour starts and comes back if the canvas is lost.

   opts (all optional):
     ring     : true   thin double gold ring, like the emblem
     glow     : true   soft porcelain light behind the beans
     hint     : true   "Move your cursor through the beans" / "Drag across
                       the beans" under the emblem; fades after first play
     hintText : { fine, touch }   override the hint copy
     pourAt   : 0.35   share of the box on screen before the pour starts

   Cost: the canvas covers only el plus a small margin, DPR ≤ 2 (≤ 1.5 on
   coarse pointers). The rAF loop runs only while something moves: it stops
   when every bean is home (or held still by a resting cursor), when el is
   off-screen and when the tab is hidden. Reduced motion draws the finished
   emblem once. el gets data-beans-state = waiting | pouring | active |
   resting | paused | static | fallback.
   ========================================================================== */
(() => {
  'use strict';
  if (window.WCHBeans && window.WCHBeans.version) return;

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const media = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false });
  const onMedia = (mq, fn) => {
    if (!mq || (!mq.addEventListener && !mq.addListener)) return () => {};
    if (mq.addEventListener) { mq.addEventListener('change', fn); return () => mq.removeEventListener('change', fn); }
    mq.addListener(fn); return () => mq.removeListener(fn);
  };

  /* ------------------------------------------------------------------ colour */
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const LIGHT = [255, 246, 228];
  const DARK = [24, 14, 8];
  const mix = (c, to, t) => c.map((v, i) => Math.round(v + (to[i] - v) * t));
  const shade = (c, t) => (t >= 0 ? mix(c, LIGHT, t) : mix(c, DARK, -t));
  const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // espresso → light roast, plus brand gold (index 4)
  const TONES = ['#46301F', '#64432D', '#86603D', '#A88155', '#B4925A'].map(hex);
  const GOLD = 4;
  const PALETTES = {
    cup:    [0.30, 0.38, 0.24, 0.05, 0.03],
    handle: [0.22, 0.40, 0.28, 0.06, 0.04],
    saucer: [0.06, 0.24, 0.38, 0.22, 0.10],
    steam:  [0.00, 0.00, 0.12, 0.40, 0.48],
    corner: [0, 0, 0, 0, 1],
  };
  const pickTone = (pal, r) => {
    let x = r();
    for (let i = 0; i < pal.length; i++) { x -= pal[i]; if (x <= 0) return i; }
    return pal.length - 1;
  };

  /* ------------------------------------------------------------------ sprites (built once, shared) */
  const ASPECTS = [0.64, 0.7];
  const SIZES = [16, 30, 60, 120];           // sprite bean lengths in device px; the closest larger one is used

  function makeBean(rgb, len, aspect, face, gold) {
    const a = len / 2, b = a * aspect;
    const pad = Math.ceil(len * 0.05) + 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(len + pad * 2);
    c.height = Math.ceil(b * 2 + pad * 2);
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2);

    g.save();
    g.beginPath(); g.ellipse(0, 0, a, b, 0, 0, TAU); g.clip();
    // symmetric dome, so the light stays true when the bean rotates
    g.save(); g.scale(1, b / a);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, a);
    if (gold) {                      // warm metallic gold, never olive
      rg.addColorStop(0, 'rgb(238,218,166)');
      rg.addColorStop(0.5, 'rgb(200,165,102)');
      rg.addColorStop(1, 'rgb(134,98,48)');
    } else {
      rg.addColorStop(0, rgba(shade(rgb, 0.18)));
      rg.addColorStop(0.62, rgba(rgb));
      rg.addColorStop(1, rgba(shade(rgb, -0.4)));
    }
    g.fillStyle = rg; g.fillRect(-a, -a, a * 2, a * 2);
    g.restore();

    if (face) {
      // the centre cleft: a soft valley, a dark groove and a lit lip on one side
      const crease = new Path2D();
      crease.moveTo(-a * 0.95, b * 0.18);
      crease.bezierCurveTo(-a * 0.32, -b * 0.46, a * 0.32, b * 0.46, a * 0.95, -b * 0.18);
      g.lineCap = 'round';
      g.strokeStyle = gold ? 'rgba(120,84,38,0.36)' : rgba(shade(rgb, -0.45), 0.4); g.lineWidth = b * 0.52; g.stroke(crease);
      g.strokeStyle = gold ? 'rgb(108,74,32)' : rgba(shade(rgb, -0.7), 1); g.lineWidth = b * 0.15; g.stroke(crease);
      g.save(); g.translate(0, -b * 0.19);
      g.strokeStyle = rgba(shade(rgb, gold ? 0.5 : 0.34), gold ? 0.5 : 0.34); g.lineWidth = b * 0.075; g.stroke(crease);
      g.restore();
    } else {
      // the rounded back: one soft ridge
      g.strokeStyle = rgba(shade(rgb, 0.3), 0.22); g.lineWidth = b * 0.55; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-a * 0.62, 0); g.lineTo(a * 0.62, 0); g.stroke();
    }
    g.restore();

    g.beginPath(); g.ellipse(0, 0, a - 0.5, b - 0.5, 0, 0, TAU);
    g.strokeStyle = gold ? 'rgba(112,78,34,0.4)' : rgba(shade(rgb, -0.58), 0.42);
    g.lineWidth = Math.max(0.8, len * 0.02);
    g.stroke();
    return c;
  }

  function makeShadow(len, aspect) {
    const a = len / 2, b = a * aspect, blur = Math.max(1.5, len * 0.12);
    const pad = Math.ceil(blur * 2.4);
    const c = document.createElement('canvas');
    c.width = Math.ceil(len + pad * 2); c.height = Math.ceil(b * 2 + pad * 2);
    const g = c.getContext('2d');
    const off = 4000;                // draw the shape off-canvas, keep only its blurred shadow
    g.shadowColor = 'rgb(60, 42, 28)'; g.shadowBlur = blur; g.shadowOffsetX = off;
    g.beginPath(); g.ellipse(c.width / 2 - off, c.height / 2, a * 0.94, b * 0.9, 0, 0, TAU);
    g.fill();
    return c;
  }

  function makeGlint(d, warm) {
    const c = document.createElement('canvas'); c.width = c.height = d;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
    const col = warm ? '255,240,206' : '255,249,238';
    rg.addColorStop(0, `rgba(${col},0.95)`);
    rg.addColorStop(0.35, `rgba(${col},0.45)`);
    rg.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, d, d);
    return c;
  }

  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    SPR = {
      sets: SIZES.map((len) => ({
        len,
        bean: TONES.map((rgb, ti) => ASPECTS.map((asp) => [makeBean(rgb, len, asp, false, ti === GOLD), makeBean(rgb, len, asp, true, ti === GOLD)])),
        shadow: ASPECTS.map((asp) => makeShadow(len, asp)),
      })),
      glint: makeGlint(48, false),
      glintWarm: makeGlint(48, true),
    };
    return SPR;
  }

  /* ------------------------------------------------------------------ emblem geometry (1000-unit box) */
  function offsetPoly(pts, d, closed) {
    const n = pts.length, out = [];
    const norm = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const hasPrev = closed || i > 0, hasNext = closed || i < n - 1;
      const n1 = hasPrev ? norm(pts[(i - 1 + n) % n], p) : null;
      const n2 = hasNext ? norm(p, pts[(i + 1) % n]) : null;
      const a = n1 || n2, b = n2 || n1;
      let mx = a[0] + b[0], my = a[1] + b[1];
      const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
      const cos = mx * a[0] + my * a[1];
      const len = d / Math.max(cos, 0.4);
      out.push([p[0] + mx * len, p[1] + my * len]);
    }
    return out;
  }
  const area = (pts) => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
  const inset = (pts, d) => offsetPoly(pts, area(pts) < 0 ? -d : d, true);
  const distToPath = (x, y, pts) => {
    let best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const t = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1);
      best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t));
    }
    return best;
  };
  const bisect = (a1, a2) => Math.atan2(Math.sin(a1) + Math.sin(a2), Math.cos(a1) + Math.cos(a2));

  // straight segments: a bean on every corner, even spacing per side
  function sampleSegments(pts, closed, step, cb) {
    const segs = [];
    const n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      segs.push({ a, dx, dy, len: Math.hypot(dx, dy), ang: Math.atan2(dy, dx) });
    }
    segs.forEach((s, i) => {
      const count = Math.max(1, Math.round(s.len / step));
      for (let j = 0; j < count; j++) {
        const t = j / count;
        let ang = s.ang;
        if (j === 0 && (closed || i > 0)) ang = bisect(segs[(i - 1 + segs.length) % segs.length].ang, s.ang);
        cb(s.a[0] + s.dx * t, s.a[1] + s.dy * t, ang);
      }
    });
    if (!closed) { const s = segs[segs.length - 1]; cb(s.a[0] + s.dx, s.a[1] + s.dy, s.ang); }
  }

  // curves: walk the arc length; the step may vary with progress
  function walk(pts, closed, stepAt, cb, fit) {
    const P = closed ? pts.concat([pts[0]]) : pts;
    let total = 0; const lens = [];
    for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); lens.push(l); total += l; }
    let k = 1;
    if (fit) { const s0 = stepAt(0); const cnt = Math.max(1, Math.round(total / s0)); k = total / (cnt * s0); }
    let next = 0, acc = 0;
    for (let i = 0; i < lens.length; i++) {
      const l = lens[i];
      while (next <= acc + l + 1e-6) {
        if (closed && next >= total - 1e-3) return;
        const t = l ? (next - acc) / l : 0;
        const x = P[i][0] + (P[i + 1][0] - P[i][0]) * t, y = P[i][1] + (P[i + 1][1] - P[i][1]) * t;
        const ang = Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]);
        cb(x, y, ang, total ? next / total : 0);
        next += stepAt(total ? next / total : 0) * k;
      }
      acc += l;
    }
  }

  // The emblem: house outline (double row, with chimney), cup with handle, saucer, three steam wisps, four gold beans.
  // Lu = bean length in emblem units (bigger on small screens, so the drawing keeps fewer, readable beans).
  const DESIGNS = new Map();
  function design(Lu) {
    if (DESIGNS.has(Lu)) return DESIGNS.get(Lu);
    const rand = mulberry32(20261110);
    const W = Lu * 0.67;
    const out = [];
    const add = (x, y, a, kind, pal, o = {}) => out.push({
      ux: x, uy: y, ang: a, kind, tone: pal ? pickTone(PALETTES[pal], rand) : 0, variant: rand() < 0.5 ? 0 : 1,
      size: o.size || 1, al: o.alpha || 1, order: o.order || 0,
      spin: rand() < 0.5 ? -1 : 1,
    });
    const jitter = (s) => (rand() - 0.5) * s;
    // like the logo's gold gradient: lighter roasts top-left, darker bottom-right, ~10% gold
    const roastAt = (x, y) => {
      if (rand() < 0.1) return GOLD;
      const t = clamp(((x - 200) * 0.7 + (y - 200) * 0.72) / 840, 0, 1);
      return clamp(Math.round(3.1 - t * 2.6 + (rand() - 0.5) * 1.5), 0, 3);
    };
    const G = 1.13, CY = 505;                          // scale the drawing up inside the ring
    const T = (pts) => pts.map(([x, y]) => [500 + (x - 500) * G, CY + (y - CY) * G]);

    // house: floor-left, walls, eave ledges, roof, chimney
    const house = [[288, 772], [288, 486], [236, 486], [500, 232], [596, 324.4], [596, 270], [660, 270], [660, 385.9], [764, 486], [712, 486], [712, 772]];
    const rowOff = W * 0.58;
    [-rowOff, rowOff].forEach((off) => {
      sampleSegments(offsetPoly(T(house), off, true), true, Lu * 1.05, (x, y, ang) => {
        if (distToPath(x, y, T(house)) > rowOff * 1.45) return;   // drop miter spikes at tight corners
        add(x + jitter(1.2), y + jitter(1.2), ang + jitter(0.12), 'house', null, { order: 0.04 + ((830 - y) / 640) * 0.62 });
        out[out.length - 1].tone = roastAt(x, y);
      });
    });

    // cup body (bowl), rim at the top
    const cx = 500, rimY = 566, botY = 682, rimW = 108;
    const hw = (y) => rimW * Math.cos(((y - rimY) / (botY - rimY)) * 1.02);
    const cup = [];
    for (let i = 0; i <= 18; i++) { const y = rimY + ((botY - rimY) * i) / 18; cup.push([cx - hw(y), y]); }
    for (let i = 18; i >= 0; i--) { const y = rimY + ((botY - rimY) * i) / 18; cup.push([cx + hw(y), y]); }
    const cupT = T(cup);
    walk(inset(cupT, W * 0.52), true, () => Lu * 1.02, (x, y, ang) => {
      add(x, y, ang + jitter(0.1), 'cup', 'cup', { order: 0.22 + clamp((CY + (botY - CY) * G - y) / ((botY - rimY) * G), 0, 1) * 0.3 });
    }, true);
    // fill: tidy woven rows (alternate rows tilt a touch, like a herringbone)
    const inner = inset(cupT, W * 1.02);
    let iy0 = Infinity, iy1 = -Infinity;
    for (const [, y] of inner) { iy0 = Math.min(iy0, y); iy1 = Math.max(iy1, y); }
    const rowH = W * 1.06;
    const rows = Math.max(1, Math.floor((iy1 - iy0) / rowH));
    const pad = (iy1 - iy0 - rows * rowH) / 2;
    for (let r = 0; r < rows; r++) {
      const y = iy0 + pad + rowH * (r + 0.5);
      const xs = [];
      for (let i = 0; i < inner.length; i++) {
        const [xa, ya] = inner[i], [xb, yb] = inner[(i + 1) % inner.length];
        if ((ya <= y) !== (yb <= y)) xs.push(xa + ((y - ya) / (yb - ya)) * (xb - xa));
      }
      if (xs.length < 2) continue;
      const xl = Math.min(...xs), xr = Math.max(...xs);
      const n = Math.floor((xr - xl) / (Lu * 0.98));
      if (n < 1) continue;
      const sp = (xr - xl) / n;
      const tilt = r % 2 ? 0.2 : -0.2;
      for (let i = 0; i < n; i++) {
        add(xl + sp * (i + 0.5), y + jitter(0.8), tilt + jitter(0.08), 'cup', 'cup', { order: 0.26 + clamp((iy1 - y) / (iy1 - iy0), 0, 1) * 0.3 });
      }
    }

    // handle loop
    const hc = [638, 609], hr = 37;
    const arc = [];
    for (let i = 0; i <= 48; i++) { const t = -2.2 + (4.62 * i) / 48; arc.push([hc[0] + Math.cos(t) * hr, hc[1] + Math.sin(t) * hr]); }
    walk(T(arc), false, () => Lu * 0.84, (x, y, ang) => add(x, y, ang, 'handle', 'handle', { size: 0.84, order: 0.5 }), true);

    // saucer: a shallow smile and a short foot
    const saucer = [], foot = [];
    for (let i = 0; i <= 30; i++) { const x = 360 + (280 * i) / 30, t = (x - 500) / 140; saucer.push([x, 700 + 10 * (1 - t * t)]); }
    for (let i = 0; i <= 20; i++) { const x = 432 + (136 * i) / 20, t = (x - 500) / 68; foot.push([x, 718 + 3 * (1 - t * t)]); }
    walk(T(saucer), false, () => Lu * 1.02, (x, y, ang) => add(x, y, ang + jitter(0.06), 'saucer', 'saucer', { order: 0.16 }), true);
    walk(T(foot), false, () => Lu * 1.02, (x, y, ang) => add(x, y, ang + jitter(0.06), 'saucer', 'saucer', { size: 0.9, order: 0.12 }), true);

    // three steam wisps, beans shrinking + fading as they rise
    [[462, 542, 418], [500, 542, 386], [538, 542, 418]].forEach(([x0, yb, yt]) => {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const p = i / 60, y = yb - (yb - yt) * p; pts.push([x0 + 12 * Math.sin(p * TAU * 0.95 + 0.35), y]); }
      walk(T(pts), false, (p) => Lu * (1 - 0.42 * p) * 1.02, (x, y, ang, p) => {
        add(x, y, ang, 'steam', 'steam', { size: 1 - 0.44 * p, alpha: 1 - 0.45 * p, order: 0.6 + p * 0.28 });
      });
    });

    // four gold beans at the diagonals, like the emblem
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => {
      const r = 418;
      const x = 500 + (sx * r) / Math.SQRT2, y = 500 + (sy * r) / Math.SQRT2;
      add(x, y, Math.atan2(sy, sx) + Math.PI / 2, 'corner', 'corner', { size: 2.2, order: 0.72 + i * 0.03 });
    });
    DESIGNS.set(Lu, out);
    return out;
  }

  /* ------------------------------------------------------------------ physics constants */
  const SPRING = 95, DAMP = 11, ASPRING = 80, ADAMP = 10, FSPRING = 55, FDAMP = 8, ZSPRING = 70, ZDAMP = 10;
  const REPEL = 14000, DRAG = 7, SPIN = 0.012, TWIRL = 26, LIFT = 30, FLIP = 30, MAX_VF = 20;
  const POUR_SPAN = 1.35;            // seconds between the first and the last bean leaving the scoop
  const SWEEP_DUR = 2.6;             // the one quiet shimmer after the pour
  const SWEEP_AGAIN_MS = 12000;      // shimmer again when the emblem returns after being away this long

  const registry = new WeakMap();
  const HINT = { fine: 'Move your cursor through the beans', touch: 'Drag across the beans' };

  /* ------------------------------------------------------------------ mount */
  function mount(el, opts) {
    const noop = { destroy() {}, replay() {} };
    if (!el || el.nodeType !== 1) return noop;
    const existing = registry.get(el);
    if (existing) return existing;

    const o = Object.assign({ ring: true, glow: true, hint: true, hintText: null, pourAt: 0.35 }, opts || {});
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return noop;
    const SP = sprites();

    const mqReduce = media('(prefers-reduced-motion: reduce)');
    const mqCoarse = media('(pointer: coarse)');
    const mqFine = media('(hover: hover) and (pointer: fine)');
    let reduce = mqReduce.matches;

    /* ---------- DOM ---------- */
    const made = [];
    const fallbacks = Array.prototype.filter.call(el.children, (n) => n.tagName === 'IMG');
    const savedImg = fallbacks.map((img) => [img.style.opacity, img.style.transition]);
    el.classList.add('beans-host');

    let hintEl = null;
    if (o.glow) {
      const glowEl = document.createElement('div');
      glowEl.className = 'beans__glow';
      el.insertBefore(glowEl, el.firstChild);
      made.push(glowEl);
    }
    if (o.ring) {
      const NS = 'http://www.w3.org/2000/svg';
      const ringEl = document.createElementNS(NS, 'svg');
      ringEl.setAttribute('class', 'beans__ring');
      ringEl.setAttribute('viewBox', '0 0 1000 1000');
      ringEl.setAttribute('aria-hidden', 'true');
      ringEl.setAttribute('focusable', 'false');
      [488, 470].forEach((r) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', '500'); c.setAttribute('cy', '500'); c.setAttribute('r', String(r));
        c.setAttribute('pathLength', '1');
        ringEl.appendChild(c);
      });
      el.appendChild(ringEl);
      made.push(ringEl);
    }
    canvas.className = 'beans__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    made.push(canvas);
    if (o.hint) {
      hintEl = document.createElement('p');
      hintEl.className = 'beans__hint';
      el.appendChild(hintEl);
      made.push(hintEl);
    }

    const setFallback = (show) => {
      fallbacks.forEach((img) => {
        img.style.transition = 'opacity .5s ease';
        img.style.opacity = show ? savedImg[fallbacks.indexOf(img)][0] : '0';
      });
    };

    let state = '';
    const setState = (s) => { if (s !== state) { state = s; el.setAttribute('data-beans-state', s); } };

    /* ---------- state ---------- */
    let beans = [];
    let designLu = -1;
    let dpr = 1, S = 0, CW = 0, CH = 0, ox = 0, oy = 0, k = 1, Lpx = 10, R0 = 60, mL = 0, mT = 0;
    let sized = false, destroyed = false, lost = false;
    let phase = 'waiting';           // waiting → pouring → live
    let time = 0, pourAt = 0, running = false, raf = 0, last = 0;
    let visible = false, leftAt = 0;
    let sweep = -2, sweepT = -1, sweepQueuedAt = -1;
    let quietFrames = 0;
    let hintState = 0;               // 0 not shown yet, 1 shown, 2 done
    let travel = 0;
    const ptr = { on: false, x: -9999, y: -9999, vx: 0, vy: 0, t: 0, power: 0, speed: 0, speedN: 0, r: 60, touch: false, touching: false };

    /* ---------- layout ---------- */
    function layout() {
      if (destroyed) return;
      const w = el.clientWidth, h = el.clientHeight;
      if (w < 8 || h < 8) { sized = false; return; }
      const prevS = S;
      S = Math.min(w, h);
      // a small margin so pushed beans are not cut off — but never past the viewport's sides (no sideways scroll)
      const r = el.getBoundingClientRect();
      const scale = r.width ? w / r.width : 1;
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const m = Math.round(clamp(S * 0.12, 20, 64));
      mL = Math.max(0, Math.min(m, Math.floor(r.left * scale)));
      const mR = Math.max(0, Math.min(m, Math.floor((vw - r.right) * scale)));
      mT = m;
      CW = w + mL + mR; CH = h + m * 2;
      ox = mL + (w - S) / 2; oy = mT + (h - S) / 2; k = S / 1000;
      dpr = Math.min(window.devicePixelRatio || 1, mqCoarse.matches ? 1.5 : 2);
      const cs = canvas.style;
      cs.left = -mL + 'px'; cs.top = -mT + 'px'; cs.width = CW + 'px'; cs.height = CH + 'px';
      const cw = Math.max(1, Math.round(CW * dpr)), ch = Math.max(1, Math.round(CH * dpr));
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      Lpx = clamp(S * 0.0232, 8.5, 13.5);
      R0 = clamp(S * 0.16, 60, 104);
      const Lu = Math.round((Lpx / k) * 2) / 2;     // quantised, so small resizes keep the same bean layout
      if (Lu !== designLu) {
        designLu = Lu;
        const old = beans;
        beans = design(Lu).map((d, i) => {
          const b = old[i] || { x: 0, y: 0, a: d.ang, vx: 0, vy: 0, va: 0, z: 0, vz: 0, f: 0, vf: 0, live: false, alpha: 0, fresh: true };
          Object.assign(b, d);
          b.baseAlpha = d.al;
          return b;
        });
      }
      for (const b of beans) {
        b.tx = ox + b.ux * k; b.ty = oy + b.uy * k; b.ta = b.ang;
        b.px = b.size * Lpx;
        if (b.fresh) {
          b.fresh = false;
          if (phase !== 'waiting') { placeAtHome(b); if (phase === 'pouring') b.alpha = 0; }   // late arrivals fade in
        }
      }
      // a real resize while settled: snap home rather than fling everything across
      if (phase === 'live' && Math.abs(S - prevS) > 0.5) beans.forEach(placeAtHome);
      sized = true;
      if (reduce || !running) draw();
    }

    function placeAtHome(b) {
      b.x = b.tx; b.y = b.ty;
      b.a = b.ta + Math.PI * Math.round((b.a - b.ta) / Math.PI);   // keep which way round it lies
      b.f = TAU * Math.round(b.f / TAU);
      b.vx = b.vy = b.va = b.vz = b.vf = 0; b.z = 0;
      b.alpha = b.baseAlpha; b.live = true;
    }

    /* ---------- pour ---------- */
    function beginPour() {
      if (phase !== 'waiting' || !sized) return;
      phase = 'pouring';
      pourAt = time;
      const rand = mulberry32(7);
      for (const b of beans) {
        b.live = false; b.alpha = 0;
        b.delay = b.order * POUR_SPAN + rand() * 0.14;
        // each bean drops from just above the emblem (a little in from the sides) and falls into its place
        b.sux = b.ux + (500 - b.ux) * (0.06 + rand() * 0.12) + (rand() - 0.5) * 24;
        b.suy = -25 - rand() * 80;
        b.dur = 0.34 + 0.34 * Math.sqrt(Math.max(0, b.uy - b.suy) / 1000);
        b.ia = (rand() - 0.5) * 5;
        b.iff = (rand() < 0.5 ? -1 : 1) * TAU * (0.5 + rand() * 0.6);
        b.lv = (rand() - 0.5) * 3;
      }
      el.classList.add('beans-live', 'beans-on');
      setFallback(false);
      setState('pouring');
      wake();
    }

    function finishPour() {
      phase = 'live';
      sweepQueuedAt = time + 0.35;
      showHint();
    }

    /* ---------- hint ---------- */
    function showHint() {
      if (!hintEl || hintState !== 0 || reduce) return;
      const t = o.hintText || {};
      hintEl.textContent = mqFine.matches ? (t.fine || HINT.fine) : (t.touch || HINT.touch);
      hintState = 1;
      hintEl.classList.add('is-shown');
    }
    function doneHint() {
      if (!hintEl || hintState === 2) return;
      hintState = 2;
      hintEl.classList.remove('is-shown');
    }

    /* ---------- simulation ---------- */
    function step(dt) {
      const decay = Math.exp(-dt * 7);
      ptr.vx *= decay; ptr.vy *= decay;
      ptr.power += ((ptr.on ? 1 : 0) - ptr.power) * Math.min(1, dt * (ptr.on ? 10 : 4));
      if (!ptr.on && ptr.power < 0.003) ptr.power = 0;
      ptr.speed = Math.hypot(ptr.vx, ptr.vy);
      ptr.speedN = Math.min(1, ptr.speed / 1800);
      const R = R0 * (ptr.touch ? 1.2 : 1) * (1 + 1.4 * ptr.speedN);   // a fast swipe reaches wider
      ptr.r = R;
      const R2 = R * R;
      const influence = ptr.power > 0.01;

      const subs = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / subs;
      let flying = 0;

      for (const b of beans) {
        if (!b.live) {
          flying++;
          const u = (time - pourAt - b.delay) / b.dur;
          if (u <= 0) { b.alpha = 0; continue; }
          const sx = ox + b.sux * k, sy = oy + b.suy * k;
          if (u >= 1) {
            // land: hand over to the springs with a little of the fall left in it
            const vy = ((b.ty - sy) * 1.7) / b.dur;
            placeAtHome(b);
            b.a = b.ta;
            b.vx = ((b.tx - sx) / b.dur) * 0.06;
            b.vy = vy * 0.035;
            b.va = b.lv;
            b.vz = 1.4;
            flying--;
            continue;
          }
          const e = 1 - (1 - u) * (1 - u);
          b.x = sx + (b.tx - sx) * (0.25 * u + 0.75 * e);
          b.y = sy + (b.ty - sy) * (0.3 * u + 0.7 * u * u);
          b.a = b.ta + b.ia * (1 - e);
          b.f = b.iff * (1 - e);
          b.z = 0.6 * (1 - u) + 0.2 * Math.sin(Math.PI * u);
          b.alpha = b.baseAlpha * Math.min(1, u * 4);
          continue;
        }
        if (b.alpha < b.baseAlpha) b.alpha = Math.min(b.baseAlpha, b.alpha + dt * 2.5);
        const lo = b.px * 0.6, hiX = CW - lo, hiY = CH - lo;
        for (let s = 0; s < subs; s++) {
          let ax = (b.tx - b.x) * SPRING - b.vx * DAMP;
          let ay = (b.ty - b.y) * SPRING - b.vy * DAMP;
          if (influence) {
            const dx = b.x - ptr.x, dy = b.y - ptr.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d;
              let f = 1 - d / R; f *= f * ptr.power;
              ax += nx * f * REPEL + ptr.vx * f * DRAG;
              ay += ny * f * REPEL + ptr.vy * f * DRAG;
              b.va += ((nx * ptr.vy - ny * ptr.vx) * SPIN + b.spin * TWIRL * (0.25 + ptr.speedN)) * f * h * 10;
              b.vz += f * LIFT * (0.3 + ptr.speedN) * h * 10;
              b.vf += b.spin * f * FLIP * ptr.speedN * h * 10;
            }
          }
          b.vx += ax * h; b.vy += ay * h;
          b.x += b.vx * h; b.y += b.vy * h;
          // soft walls at the canvas edge, so no bean is ever cut in half
          if (b.x < lo) { b.x = lo; if (b.vx < 0) b.vx *= -0.35; } else if (b.x > hiX) { b.x = hiX; if (b.vx > 0) b.vx *= -0.35; }
          if (b.y < lo) { b.y = lo; if (b.vy < 0) b.vy *= -0.35; } else if (b.y > hiY) { b.y = hiY; if (b.vy > 0) b.vy *= -0.35; }

          let da = b.ta - b.a; da -= Math.PI * Math.round(da / Math.PI);
          b.va += (da * ASPRING - b.va * ADAMP) * h; b.a += b.va * h;
          const df = -(b.f - TAU * Math.round(b.f / TAU));
          b.vf += (df * FSPRING - b.vf * FDAMP) * h;
          if (b.vf > MAX_VF) b.vf = MAX_VF; else if (b.vf < -MAX_VF) b.vf = -MAX_VF;   // no blurry "slash" rolls
          b.f += b.vf * h;
          b.vz += (-b.z * ZSPRING - b.vz * ZDAMP) * h; b.z += b.vz * h;
          if (b.z < 0) { b.z = 0; if (b.vz < 0) b.vz *= -0.3; }
          if (b.z > 2.2) { b.z = 2.2; b.vz = Math.min(b.vz, 0); }
        }
        if (Math.abs(b.a - b.ta) > 40) b.a = b.ta + ((b.a - b.ta) % Math.PI);
        if (Math.abs(b.f) > 40) b.f %= TAU;
      }
      if (phase === 'pouring' && !flying) finishPour();
    }

    function burst(x, y, R, power) {
      for (const b of beans) {
        if (!b.live) continue;
        const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
        if (d > R) continue;
        const f = 1 - d / R, n = d || 1;
        b.vx += (dx / n) * f * power; b.vy += (dy / n) * f * power - f * power * 0.25;
        b.va += b.spin * f * 18; b.vz += f * 9; b.vf += b.spin * f * 12;
      }
    }

    // 0 = still moving, 1 = held still by a resting cursor, 2 = every bean home
    function quiet() {
      if (phase !== 'live' || sweepT >= 0 || sweepQueuedAt >= 0 || ptr.touching) return 0;
      const held = ptr.on;
      if (held) { if (ptr.speed > 3 || ptr.power < 0.995) return 0; }
      else if (ptr.power > 0) return 0;
      for (const b of beans) {
        if (!b.live || b.alpha < b.baseAlpha) return 0;
        if (Math.abs(b.vx) > 0.5 || Math.abs(b.vy) > 0.5 || Math.abs(b.va) > 0.02 || Math.abs(b.vf) > 0.02 || Math.abs(b.vz) > 0.02) return 0;
        if (!held) {
          if (Math.abs(b.x - b.tx) > 0.12 || Math.abs(b.y - b.ty) > 0.12 || b.z > 0.003) return 0;
          let da = b.a - b.ta; da -= Math.PI * Math.round(da / Math.PI);
          if (Math.abs(da) > 0.004) return 0;
          if (Math.abs(b.f - TAU * Math.round(b.f / TAU)) > 0.004) return 0;
        }
      }
      return held ? 1 : 2;
    }

    /* ---------- render ---------- */
    function glintFor(b) {
      // a constant soft gloss, plus the shimmer band while it travels across
      let band = 0;
      if (sweep > -1.5) {
        const p = ((b.x - ox - S / 2) * 0.72 + (b.y - oy - S / 2) * 0.69) / S;
        const d = (p - sweep) / 0.15;
        band = d > -3 && d < 3 ? Math.exp(-d * d) : 0;
      }
      return (b.tone === GOLD ? 0.42 : 0.3) + band * (b.tone === GOLD ? 0.9 : 0.7);
    }

    function setFor(px) {
      const sets = SP.sets;
      for (let i = 0; i < sets.length; i++) if (sets[i].len >= px * 0.92) return sets[i];
      return sets[sets.length - 1];
    }

    function drawBean(b, shadowPass) {
      const s = b.px * (1 + 0.3 * b.z);
      const set = setFor(s * dpr);
      const cf = Math.cos(b.f), fy = Math.max(0.55, Math.abs(cf));
      const c = Math.cos(b.a), sn = Math.sin(b.a);
      if (shadowPass) {
        const spr = set.shadow[b.variant];
        const sc = (s * (1 + 0.15 * b.z)) / set.len;
        const off = b.px * (0.1 + 0.75 * b.z);
        ctx.globalAlpha = b.alpha * (0.3 - 0.13 * Math.min(1, b.z));
        ctx.setTransform(dpr * c * sc, dpr * sn * sc, -dpr * sn * sc * fy, dpr * c * sc * fy, dpr * (b.x + off * 0.55), dpr * (b.y + off * 0.95 + b.px * 0.06));
        ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
        return;
      }
      const spr = set.bean[b.tone][b.variant][cf >= 0 ? 1 : 0];
      const sc = s / set.len;
      ctx.globalAlpha = b.alpha;
      ctx.setTransform(dpr * c * sc, dpr * sn * sc, -dpr * sn * sc * fy, dpr * c * sc * fy, dpr * b.x, dpr * b.y);
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      const g = glintFor(b) * b.alpha * fy * fy;
      if (g > 0.02) {
        const gl = b.tone === GOLD ? SP.glintWarm : SP.glint;
        const gs = (s * 0.4) / gl.width;
        ctx.globalAlpha = Math.min(1, g);
        ctx.setTransform(dpr * gs, 0, 0, dpr * gs, dpr * (b.x - s * 0.075), dpr * (b.y - s * 0.085));
        ctx.drawImage(gl, -gl.width / 2, -gl.height / 2);
      }
    }

    function draw() {
      if (!sized || lost) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (phase === 'waiting') return;
      // grounded beans + their shadows first, then lifted beans on top (their shadows fall across the others)
      for (const b of beans) if (b.alpha > 0.005 && b.z < 0.12) drawBean(b, true);
      for (const b of beans) if (b.alpha > 0.005 && b.z < 0.12) drawBean(b, false);
      for (const b of beans) if (b.alpha > 0.005 && b.z >= 0.12) drawBean(b, true);
      for (const b of beans) if (b.alpha > 0.005 && b.z >= 0.12) drawBean(b, false);
      // the cursor's force field: a faint gold ring, fine pointers only, only over the emblem
      if (!ptr.touch && ptr.on && ptr.power > 0.02 && !reduce) {
        const dc = Math.hypot(ptr.x - ox - S / 2, ptr.y - oy - S / 2) / (S / 2);
        const a = ptr.power * clamp((1.02 - dc) / 0.14, 0, 1);
        if (a > 0.01) {
          const r = (R0 + (ptr.r - R0) * 0.35) * 0.52;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.globalAlpha = 0.45 * a;
          ctx.strokeStyle = '#B79763';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(ptr.x, ptr.y, r, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 0.85 * a;
          ctx.fillStyle = '#A8884F';
          ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 2.5, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- loop ---------- */
    function frame(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      time += dt;
      if (sweepQueuedAt >= 0 && time >= sweepQueuedAt) { sweepQueuedAt = -1; sweepT = time; }
      if (sweepT >= 0) {
        const p = (time - sweepT) / SWEEP_DUR;
        if (p >= 1) { sweepT = -1; sweep = -2; } else sweep = -0.95 + p * 1.9;
      }
      step(dt);
      const q = quiet();
      quietFrames = q ? quietFrames + 1 : 0;
      if (q && quietFrames >= (q === 2 ? 2 : 10)) {
        if (q === 2) beans.forEach(placeAtHome);   // exact rest pose
        draw();
        halt('resting');
        return;
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function canRun() {
      return !destroyed && !reduce && !lost && sized && visible && !document.hidden && phase !== 'waiting';
    }
    function wake() {
      if (running || !canRun()) return;
      running = true;
      quietFrames = 0;
      last = performance.now();
      setState(phase === 'pouring' ? 'pouring' : 'active');
      raf = requestAnimationFrame(frame);
    }
    function halt(next) {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (next) setState(next);
    }
    function pause() {
      if (phase === 'waiting' || state === 'static' || state === 'fallback') { halt(); return; }
      halt('paused');
    }

    /* ---------- input ---------- */
    function local(cx, cy) {
      const r = el.getBoundingClientRect();
      const sx = r.width ? el.clientWidth / r.width : 1, sy = r.height ? el.clientHeight / r.height : 1;
      return [(cx - r.left) * sx + mL, (cy - r.top) * sy + mT];
    }
    function moveTo(x, y, t) {
      if (!ptr.on) { ptr.x = x; ptr.y = y; ptr.t = t; ptr.on = true; return; }
      const dt = Math.max(8, t - ptr.t) / 1000;
      const vx = (x - ptr.x) / dt, vy = (y - ptr.y) / dt;
      travel += Math.hypot(x - ptr.x, y - ptr.y);
      if (hintState === 1 && travel > S * 0.6) doneHint();
      ptr.vx = ptr.vx * 0.35 + clamp(vx, -5000, 5000) * 0.65;
      ptr.vy = ptr.vy * 0.35 + clamp(vy, -5000, 5000) * 0.65;
      ptr.x = x; ptr.y = y; ptr.t = t;
    }
    const interactive = () => !reduce && !lost && !destroyed && phase !== 'waiting';

    function onPointerMove(e) {
      if (e.pointerType === 'touch' || !interactive()) return;
      ptr.touch = false;
      const [x, y] = local(e.clientX, e.clientY);
      moveTo(x, y, e.timeStamp);
      wake();
    }
    function onPointerLeave(e) {
      if (e.pointerType === 'touch') return;
      ptr.on = false;
      wake();
    }
    function onPointerDown(e) {
      if (e.pointerType === 'touch' || e.button !== 0 || !interactive()) return;
      const [x, y] = local(e.clientX, e.clientY);
      burst(x, y, R0 * 2.2, 800);
      if (hintState === 1) doneHint();
      wake();
    }
    // touch: passive listeners, so a drag both scrolls the page and scatters the beans
    function onTouchStart(e) {
      if (!interactive() || !e.touches.length) return;
      const t = e.touches[0];
      ptr.touch = true; ptr.touching = true; ptr.on = false;
      const [x, y] = local(t.clientX, t.clientY);
      moveTo(x, y, e.timeStamp);
      burst(x, y, R0 * 1.6, 460);
      if (hintState === 1) doneHint();
      wake();
    }
    function onTouchMove(e) {
      if (!interactive() || !e.touches.length) return;
      const t = e.touches[0];
      const [x, y] = local(t.clientX, t.clientY);
      moveTo(x, y, e.timeStamp);
      wake();
    }
    function onTouchEnd(e) {
      if (e.touches && e.touches.length) return;
      ptr.touching = false; ptr.on = false;
      wake();
    }
    const passive = { passive: true };
    el.addEventListener('pointermove', onPointerMove, passive);
    el.addEventListener('pointerleave', onPointerLeave, passive);
    el.addEventListener('pointerdown', onPointerDown, passive);
    el.addEventListener('touchstart', onTouchStart, passive);
    el.addEventListener('touchmove', onTouchMove, passive);
    el.addEventListener('touchend', onTouchEnd, passive);
    el.addEventListener('touchcancel', onTouchEnd, passive);

    /* ---------- lifecycle ---------- */
    const onVisibility = () => { if (document.hidden) pause(); else wake(); };
    document.addEventListener('visibilitychange', onVisibility);

    let io = null;
    if ('IntersectionObserver' in window) {
      // ratio > 0, not isIntersecting: a box that only touches the viewport edge counts as hidden
      io = new IntersectionObserver((entries) => {
        const e = entries[entries.length - 1];
        const ratio = e.isIntersecting ? e.intersectionRatio : 0;
        visible = ratio > 0;
        if (!visible) { if (phase === 'live' && !leftAt) leftAt = performance.now(); pause(); return; }
        if (reduce) return;
        if (phase === 'waiting') {
          const rootH = e.rootBounds ? e.rootBounds.height : window.innerHeight;
          const need = Math.min(o.pourAt, (0.6 * rootH) / Math.max(1, e.boundingClientRect.height));
          if (ratio >= need) beginPour();
          return;
        }
        if (phase === 'live' && leftAt && ratio >= 0.35) {
          if (performance.now() - leftAt > SWEEP_AGAIN_MS && sweepT < 0) sweepQueuedAt = time + 0.15;
          leftAt = 0;
        }
        wake();
      }, { threshold: [0, 0.02, 0.1, 0.2, 0.35, 0.5, 0.75, 1] });
      io.observe(el);
    } else {
      visible = true;
    }

    let ro = null;
    const onWinResize = () => layout();
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => layout());
      ro.observe(el);
    }
    window.addEventListener('resize', onWinResize, passive);   // the side margins depend on where el sits

    const onLost = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      lost = true;
      halt('fallback');
      el.classList.remove('beans-live');
      setFallback(true);
    };
    const onRestored = () => {
      lost = false;
      if (phase === 'waiting') { setState('waiting'); return; }
      el.classList.add('beans-live');
      setFallback(false);
      if (phase === 'pouring') phase = 'live';
      beans.forEach(placeAtHome);
      layout(); draw();
      setState(reduce ? 'static' : 'resting');
    };
    canvas.addEventListener('contextlost', onLost);
    canvas.addEventListener('contextrestored', onRestored);

    function goStatic() {
      halt();
      phase = 'live';
      sweepT = -1; sweep = -2; sweepQueuedAt = -1;
      ptr.on = false; ptr.power = 0; ptr.touching = false;
      el.classList.remove('beans-interactive');
      el.classList.add('beans-live', 'beans-on');
      setFallback(false);
      if (hintEl) hintEl.classList.remove('is-shown');
      beans.forEach(placeAtHome);
      draw();
      setState('static');
    }
    const offReduce = onMedia(mqReduce, (e) => {
      reduce = e.matches;
      if (reduce) { goStatic(); return; }
      el.classList.add('beans-interactive');
      setState(visible ? 'resting' : 'paused');
      if (hintState === 1) hintEl.classList.add('is-shown'); else showHint();
    });

    setState('waiting');
    layout();
    if (reduce) goStatic();
    else el.classList.add('beans-interactive');
    if (!io && !reduce) beginPour();

    const api = {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        halt();
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        offReduce();
        window.removeEventListener('resize', onWinResize, passive);
        document.removeEventListener('visibilitychange', onVisibility);
        el.removeEventListener('pointermove', onPointerMove, passive);
        el.removeEventListener('pointerleave', onPointerLeave, passive);
        el.removeEventListener('pointerdown', onPointerDown, passive);
        el.removeEventListener('touchstart', onTouchStart, passive);
        el.removeEventListener('touchmove', onTouchMove, passive);
        el.removeEventListener('touchend', onTouchEnd, passive);
        el.removeEventListener('touchcancel', onTouchEnd, passive);
        canvas.removeEventListener('contextlost', onLost);
        canvas.removeEventListener('contextrestored', onRestored);
        made.forEach((n) => { if (n.parentNode) n.parentNode.removeChild(n); });
        fallbacks.forEach((img, i) => { img.style.opacity = savedImg[i][0]; img.style.transition = savedImg[i][1]; });
        el.classList.remove('beans-host', 'beans-live', 'beans-on', 'beans-interactive');
        el.removeAttribute('data-beans-state');
        registry.delete(el);
      },
      // play the pour again (the demo page uses it)
      replay() {
        if (destroyed || reduce || lost || !sized) return;
        halt();
        phase = 'waiting';
        sweepT = -1; sweep = -2; sweepQueuedAt = -1;
        beginPour();
      },
    };
    registry.set(el, api);
    return api;
  }

  window.WCHBeans = { mount, version: '1.0.0' };
})();
