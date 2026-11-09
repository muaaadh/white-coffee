/* ==========================================================================
   White Coffee House — hero: "a latte you can stir"
   Ships as assets/js/hero.js (defer). Everything is scoped to [data-hero];
   the only global is window.WCHHero (a small control/debug hook).

   - Entrance: the cup fades in and its gold rims draw (hero.css), then the
     latte is poured (rosetta) — WebGL starts after first paint.
   - WebGL latte: stable-fluids sim (velocity 256² / dye 512², lighter on
     phones) inside a circle, procedural latte art, cursor / finger stirring,
     taps leave a milk drop, re-pours 8 s after the last stir.
   - Steam leans and gusts with the cursor anywhere in the hero.
   - Idle: a slow swirl or a re-pour every ~20 s (desktop, never stirred),
     a faint glint across the gold rims every ~9 s.
   - Performance: no sim work when settled and the display pass drops to
     30 fps (20 on phones) for the slow steam / sway, loop stops off-screen
     (intersectionRatio > 0) / hidden tab, sizes cached via ResizeObserver,
     GL starts after first paint with shaders compiled in parallel
     (KHR_parallel_shader_compile) or one per task, context loss -> SVG
     fallback, restore -> re-init.
   - Reduced motion: no loop; a finished rosetta painted once.
   The open / closed pill in the hero belongs to site.js ([data-open-status]).
   Asset URLs are resolved against data-root on the hero (absent = the page's
   own folder, i.e. the site root for index.html).
   ========================================================================== */
(() => {
  'use strict';

  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const $ = (s) => hero.querySelector(s);
  const visual = $('[data-latte-visual]');
  const scrollEl = $('[data-latte-scroll]');
  const stage = $('[data-latte-stage]');
  const tiltEl = $('[data-latte-tilt]');
  const layerCup = $('[data-latte-layer="cup"]');
  const layerCupShadow = $('[data-latte-layer="cupshadow"]');
  const layerTable = $('[data-latte-layer="table"]');
  const canvas = $('[data-latte-coffee]');
  const cursorEl = $('[data-latte-cursor]');
  const copyEl = $('.hero__copy');
  if (!visual || !scrollEl || !stage || !tiltEl || !layerCup || !canvas) return;

  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  let REDUCED = mqReduce.matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const HAS_TOUCH = 'ontouchstart' in window;
  const LITE = !FINE || Math.min(screen.width, screen.height) < 700;     // phones + tablets: lighter sim
  hero.classList.add(FINE ? 'is-fine' : 'is-touch');
  hero.classList.toggle('is-reduced', REDUCED);

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const damp = (k, dt) => 1 - Math.exp(-k * dt);       // frame-rate independent smoothing
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const now = () => performance.now();

  /* ------------------------------------------------------------ Assets (relative to the site root) */
  const ROOT = new URL(hero.getAttribute('data-root') || '', document.baseURI);
  const asset = (p) => new URL(p, ROOT).href;
  hero.style.setProperty('--wch-hero-mark', `url("${asset('assets/img/logo-mark-mono.svg')}")`);
  hero.classList.add('has-mark');

  /* ------------------------------------------------------------ Geometry (cached, never read per frame) */
  const K = 62 / 52;                 // canvas half-extent in coffee radii (coffee r 52, rim r 62 of the 240 viewBox)
  const G = { x: 0, y: 0, size: 0, vw: innerWidth, vh: innerHeight };   // stage top-left in page px, untransformed
  const par = { y: 0 };              // current parallax translate (px)
  const lay = { x: 0, y: 0 };        // current cup-layer translate (px)
  // scroll offsets, read ONCE at the start of each frame (before any style writes: in Blink a
  // scrollX/Y read after a write forces a style recalc)
  const SCR = { x: window.scrollX, y: window.scrollY };
  let canvasCss = 0;

  function measure() {
    const vr = visual.getBoundingClientRect();
    let x = 0, y = 0, el = stage;
    while (el && el !== visual) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    if (el !== visual) {             // unexpected offsetParent chain: fall back to the rendered box
      const r = stage.getBoundingClientRect();
      x = r.left - vr.left; y = r.top - vr.top - par.y;
    }
    G.x = vr.left + window.scrollX + x;
    G.y = vr.top + window.scrollY + y;
    G.size = stage.offsetWidth;
    G.vw = innerWidth; G.vh = innerHeight;
    canvasCss = canvas.offsetWidth;
    if (R) R.size();
    dirty = true;
  }
  // centre + radius of the coffee, in client px (frame-time only: uses this frame's SCR)
  function cup() {
    return {
      x: G.x - SCR.x + G.size / 2 + lay.x,
      y: G.y - SCR.y + par.y + G.size / 2 + lay.y,
      r: G.size * (52 / 240),
    };
  }
  // client px -> coffee units (radius 1, y up), sway undone so stirring lands under the pointer
  function toCoffee(cx, cy) {
    const c = cup();
    const px = (cx - c.x) / c.r, py = -(cy - c.y) / c.r;
    const co = Math.cos(look.sway), si = Math.sin(look.sway);
    return { x: co * px - si * py, y: si * px + co * py, r: Math.hypot(px, py) };
  }

  /* ------------------------------------------------------------ Input (scoped to the hero) */
  const P = {
    has: false, cx: 0, cy: 0,                 // fine pointer inside the hero, last client position
    vx: 0, vy: 0, lt: 0, lx: 0, ly: 0,        // smoothed pointer velocity (px/s)
    touchId: null, down: false, t0: 0, sx: 0, sy: 0, travel: 0,
    queue: [], taps: [],                      // [pageX, pageY, ms, isTouch], [pageX, pageY]
    lastU: null, active: -1e9,
  };
  function trackVelocity(x, y, t) {
    const dt = (t - P.lt) / 1000;
    if (P.lt && dt > 0.001 && dt < 0.25) {
      const k = Math.min(1, dt / 0.06);
      P.vx += ((x - P.lx) / dt - P.vx) * k;
      P.vy += ((y - P.ly) / dt - P.vy) * k;
    }
    P.lt = t; P.lx = x; P.ly = y;
  }
  function queue(px, py, t, touch) {
    P.queue.push([px, py, t, touch]);
    if (P.queue.length > 96) P.queue.splice(0, P.queue.length - 96);
  }
  const isFinePointer = (e) => e.pointerType === 'mouse' || (e.pointerType === 'pen' && !HAS_TOUCH);

  hero.addEventListener('pointermove', (e) => {
    if (!isFinePointer(e)) return;
    const t = e.timeStamp || now();
    P.has = true; P.cx = e.clientX; P.cy = e.clientY; P.active = now();
    trackVelocity(e.clientX, e.clientY, t);
    const sx = window.scrollX, sy = window.scrollY;
    const list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
    if (list && list.length > 1) for (const ce of list) queue(ce.clientX + sx, ce.clientY + sy, ce.timeStamp || t, false);
    else queue(e.clientX + sx, e.clientY + sy, t, false);
    wake();
  }, { passive: true });
  hero.addEventListener('pointerleave', (e) => {
    if (!isFinePointer(e)) return;
    P.has = false; P.lastU = null;
  }, { passive: true });
  stage.addEventListener('pointerdown', (e) => {          // a click on the coffee leaves a milk drop
    if (!isFinePointer(e) || e.button !== 0) return;
    P.taps.push([e.clientX + window.scrollX, e.clientY + window.scrollY]);
    P.active = now();
    wake();
  });

  // Touch: passive touch events on the whole stage, so a drag that starts on the saucer still stirs,
  // and a vertical-ish stir keeps stirring while the page scrolls (pan-y hands vertical moves to the page).
  const findTouch = (list) => { for (let i = 0; i < list.length; i++) if (list[i].identifier === P.touchId) return list[i]; return null; };
  stage.addEventListener('touchstart', (e) => {
    if (P.touchId !== null) return;
    const t = e.changedTouches[0];
    P.touchId = t.identifier; P.down = true; P.lastU = null;
    P.t0 = now(); P.sx = t.clientX; P.sy = t.clientY; P.travel = 0;
    P.cx = t.clientX; P.cy = t.clientY; P.active = now(); P.lt = 0;
    queue(t.pageX, t.pageY, e.timeStamp || now(), true);
    wake();
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    const t = findTouch(e.changedTouches);
    if (!t) return;
    P.travel = Math.max(P.travel, Math.hypot(t.clientX - P.sx, t.clientY - P.sy));
    P.cx = t.clientX; P.cy = t.clientY; P.active = now();
    trackVelocity(t.clientX, t.clientY, e.timeStamp || now());
    queue(t.pageX, t.pageY, e.timeStamp || now(), true);
    wake();
  }, { passive: true });
  const touchEnd = (e) => {
    const t = findTouch(e.changedTouches);
    if (!t) return;
    if (e.type === 'touchend' && now() - P.t0 < 380 && P.travel < 12) P.taps.push([t.pageX, t.pageY]);
    P.touchId = null; P.down = false; P.lastU = null; P.active = now();
    wake();
  };
  stage.addEventListener('touchend', touchEnd, { passive: true });
  stage.addEventListener('touchcancel', touchEnd, { passive: true });

  /* ------------------------------------------------------------ Shaders */
  const VS = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform vec2 texelSize;
    void main () {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;

  const NOISE = `
    float hash (vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vnoise (vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm (vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
      return v;
    }
    float fbm4 (vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
      return v / 0.9375;
    }`;

  const FS_CLEAR = `
    precision mediump float;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

  // add (dye) or lerp (velocity, like a spoon imposing its speed) a gaussian blob, or a thin ring
  const FS_SPLAT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform vec3 color;
    uniform vec2 point;
    uniform vec2 radius;      // sigma^2 in x and y (uv units)
    uniform float ring;       // > 0: paint a ring of this radius instead of a blob
    uniform float mode;       // 0 add, 1 lerp
    uniform float strength;
    void main () {
      vec2 p = vUv - point;
      float g;
      if (ring > 0.0) { float dd = length(p) - ring; g = exp(-dd * dd / radius.x); }
      else g = exp(-(p.x * p.x / radius.x + p.y * p.y / radius.y));
      g *= strength;
      vec4 base = texture2D(uTarget, vUv);
      vec3 added = base.xyz + g * color;
      added.x = clamp(added.x, 0.0, 1.0);
      vec3 lerped = mix(base.xyz, color, clamp(g, 0.0, 1.0));
      vec3 v = mix(added, lerped, mode);
      float inside = step(length(vUv * 2.0 - 1.0), 1.0);
      gl_FragColor = vec4(mix(base.xyz, v, inside), base.w);
    }`;

  const FS_ADVECT = (manual) => `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform vec4 decay;
    uniform float maskOut;
    uniform float diffuse;    // 0..1: blend toward a 4-tap neighbourhood (silky stirred milk)
    ${manual ? '#define MANUAL_FILTERING' : ''}
    #ifdef MANUAL_FILTERING
    vec4 bilerp (sampler2D sam, vec2 uv, vec2 ts) {
      vec2 st = uv / ts - 0.5;
      vec2 iuv = floor(st); vec2 fuv = fract(st);
      vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * ts);
      vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * ts);
      vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * ts);
      vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * ts);
      return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }
    #endif
    void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
      if (diffuse > 0.0) {
        vec2 o = dyeTexelSize;
        vec4 nb = bilerp(uSource, coord + vec2(o.x, 0.0), dyeTexelSize) + bilerp(uSource, coord - vec2(o.x, 0.0), dyeTexelSize)
                + bilerp(uSource, coord + vec2(0.0, o.y), dyeTexelSize) + bilerp(uSource, coord - vec2(0.0, o.y), dyeTexelSize);
        result = mix(result, nb * 0.25, diffuse);
      }
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy;
      vec4 result = texture2D(uSource, coord);
      if (diffuse > 0.0) {
        vec2 o = dyeTexelSize;
        vec4 nb = texture2D(uSource, coord + vec2(o.x, 0.0)) + texture2D(uSource, coord - vec2(o.x, 0.0))
                + texture2D(uSource, coord + vec2(0.0, o.y)) + texture2D(uSource, coord - vec2(0.0, o.y));
        result = mix(result, nb * 0.25, diffuse);
      }
    #endif
      result *= decay;
      float r = length(vUv * 2.0 - 1.0);
      float wall = mix(1.0, 1.0 - smoothstep(0.93, 0.995, r), maskOut);
      result.xy *= mix(1.0, wall, maskOut);
      result.x = mix(clamp(result.x, 0.0, 1.0), result.x, maskOut);
      gl_FragColor = result;
    }`;

  const FS_DIVERGENCE = `
    precision mediump float;
    varying highp vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }`;

  const FS_CURL = `
    precision mediump float;
    varying highp vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
    }`;

  const FS_VORTICITY = `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main () {
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C;
      force.y *= -1.0;
      vec2 v = texture2D(uVelocity, vUv).xy + force * dt;
      gl_FragColor = vec4(clamp(v, -8.0, 8.0), 0.0, 1.0);
    }`;

  const FS_PRESSURE = `
    precision mediump float;
    varying highp vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float div = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
    }`;

  const FS_GRADIENT = `
    precision mediump float;
    varying highp vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 v = texture2D(uVelocity, vUv).xy - 0.5 * vec2(R - L, T - B);
      float r = length(vUv * 2.0 - 1.0);
      v *= 1.0 - smoothstep(0.93, 0.995, r);
      gl_FragColor = vec4(v, 0.0, 1.0);
    }`;

  // Latte-art targets. p is in coffee units (radius 1, y up).
  const FS_PATTERN = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uDye;
    uniform float uPattern;   // 0 none (settle), 1 rosetta, 2 heart, 3 tulip
    uniform float uProg;      // 0..1 growth of the pour
    uniform vec2 uRate;       // blend factors for milk (x) and crema (y) this frame
    uniform float uSeed;
    ${NOISE}

    float crema (vec2 p) {
      vec2 q = vec2(fbm(p * 2.2 + uSeed), fbm(p * 2.2 - uSeed + 4.2));
      float broad = fbm(p * 1.6 + q * 0.8 + uSeed * 1.7);
      float fine = fbm(p * vec2(9.0, 7.0) + q * 2.4 + uSeed);
      return 0.5 + (broad - 0.5) * 0.55 + (fine - 0.5) * 0.45;
    }
    float soft (float d, float e) { return 1.0 - smoothstep(-e, e, d); }   // inside when d < 0
    float ease (float t) { t = clamp(t, 0.0, 1.0); return 1.0 - pow(1.0 - t, 3.0); }

    // Rosetta as it is poured: a small rippled blob that spreads while each wiggle pushes a new
    // crescent into the last one (outer leaves first); the pull-through then drags their centres into V's.
    float rosetta (vec2 p, float prog) {
      vec2 w = vec2(fbm(p * 3.2 + uSeed * 3.1), fbm(p * 3.2 - uSeed * 2.3 + 7.3)) - 0.5;
      p += w * 0.02;
      float ang = (fract(uSeed * 7.13) - 0.5) * 0.10;
      p = vec2(cos(ang) * p.x - sin(ang) * p.y, sin(ang) * p.x + cos(ang) * p.y);
      // the first milk lands as a round drop; the rippled blob grows out of it
      float landing = soft(length(p - vec2(0.0, -0.10)) - 0.17 * ease(prog / 0.05), 0.012) * (1.0 - smoothstep(0.06, 0.2, prog));
      float spread = mix(0.36, 1.0, ease(prog / 0.82));
      p = (p - vec2(0.0, 0.02)) / spread + vec2(0.0, 0.02);
      p = p * 0.93 + vec2(0.0, -0.035);
      float ax = abs(p.x);
      p.y += 0.05 * exp(-ax * ax / 0.005);                       // V from the pull-through
      p.y += 0.010 * sin(p.x * 21.0 + uSeed * 5.0) * smoothstep(0.05, 0.3, ax);   // hand-poured ripple
      const int N = 9;
      float yb = -0.70, yt = 0.10;
      float R0 = 0.76, R1 = 0.15;
      float cap = 0.27 - 0.42 * ax - 0.95 * ax * ax;
      float dCap = (p.y - cap) / sqrt(1.0 + pow(0.42 + 1.9 * ax, 2.0));
      float d0 = length(p - vec2(0.0, yb + R0)) - R0;
      float k = 0.09;
      float h = clamp(0.5 - 0.5 * (dCap - d0) / k, 0.0, 1.0);
      float envD = mix(dCap, d0, h) + k * h * (1.0 - h);       // smooth max(d0, dCap)
      float inCap = soft(envD, 0.010);
      float nearCap = smoothstep(-0.15, -0.01, dCap);
      float milk = 0.0;
      float dPrev = 1e3;
      for (int i = N - 1; i >= 0; i--) {                         // innermost first
        float t = float(i) / float(N - 1);
        float g = ease(prog * (float(N) + 3.0) - float(i) * 1.12);
        if (g <= 0.001) { continue; }
        float b = mix(yb, yt, pow(t, 0.95));
        float R = mix(R0, R1, pow(t, 0.78)) * mix(0.55, 1.0, g);
        float d = length(p - vec2(0.0, b + R)) - R;
        float gap = mix(0.030, 0.004, nearCap) * mix(1.0, 0.75, t);
        float leaf = soft(d, 0.010) * (1.0 - soft(dPrev - gap, 0.008));
        milk = max(milk, leaf);
        dPrev = min(dPrev, d);
      }
      milk *= inCap;
      float stem = (1.0 - smoothstep(0.005, 0.015, ax)) * step(yb - 0.08, p.y) * step(p.y, 0.34) * step(0.97, prog);
      float hg = ease((prog - 0.80) / 0.2);
      vec2 hc = vec2(0.0, 0.40);
      float heart = soft(length((p - hc) * vec2(1.0, 1.08)) - 0.105 * hg, 0.012) * step(0.001, hg);
      return clamp(max(max(max(milk, heart), stem * 0.9), landing), 0.0, 1.0);
    }

    float dot2 (vec2 v) { return dot(v, v); }
    float sdHeart (vec2 p) {          // Inigo Quilez' heart, point at the origin, top at y ~ 1
      p.x = abs(p.x);
      if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
      return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
    }
    float heart (vec2 p, float prog) {
      vec2 w = vec2(fbm(p * 2.4 + uSeed), fbm(p * 2.4 - uSeed + 3.1)) - 0.5;
      p += w * 0.03;
      float ang = (fract(uSeed * 3.71) - 0.5) * 0.10;
      p = vec2(cos(ang) * p.x - sin(ang) * p.y, sin(ang) * p.x + cos(ang) * p.y);
      float grow = ease(prog / 0.72);
      float morph = smoothstep(0.70, 1.0, prog);
      vec2 c = vec2(0.0, 0.08);
      float dCircle = length((p - c) * vec2(0.98, 1.04)) - 0.46 * grow;
      vec2 hp = (p - vec2(0.0, -0.46)) / 0.94;
      hp.x *= 0.80;
      float dHeart = sdHeart(hp) * 0.94;
      dHeart = mix(dHeart, dCircle, 0.30);
      float d = mix(dCircle, dHeart, morph);
      return soft(d, 0.012);
    }

    float tulip (vec2 p, float prog) {
      vec2 w = vec2(fbm(p * 2.8 + uSeed), fbm(p * 2.8 - uSeed + 5.7)) - 0.5;
      p += w * 0.03;
      float g1 = ease(prog * 3.0);
      float g2 = ease(prog * 3.0 - 1.0);
      float g3 = ease(prog * 3.0 - 2.0);
      vec2 c1 = vec2(0.0, -0.22), c2 = vec2(0.0, 0.07), c3 = vec2(0.0, 0.31);
      float r1 = 0.44 * g1, r2 = 0.30 * g2, r3 = 0.15 * g3;
      float gap = 0.035;
      float b3 = soft(length(p - c3) - r3, 0.012) * step(0.001, g3);
      float b2 = soft(length(p - c2) - r2, 0.012) * (1.0 - soft(length(p - c3) - (r3 + gap) * step(0.001, g3), 0.012));
      float b1 = soft(length(p - c1) - r1, 0.012) * (1.0 - soft(length(p - c2) - (r2 + gap) * step(0.001, g2), 0.012));
      return clamp(max(max(b1 * step(0.001, g1), b2 * step(0.001, g2)), b3), 0.0, 1.0);
    }

    void main () {
      vec2 p = vUv * 2.0 - 1.0;
      vec4 d = texture2D(uDye, vUv);
      float target = 0.0;
      if (uPattern > 0.5 && uPattern < 1.5) target = rosetta(p, uProg);
      else if (uPattern > 1.5 && uPattern < 2.5) target = heart(p, uProg);
      else if (uPattern > 2.5) target = tulip(p, uProg);
      d.x = mix(d.x, target, uRate.x);
      d.y = mix(d.y, crema(p), uRate.y);
      gl_FragColor = d;
    }`;

  // Final look: crema, foam, relief, wall shadow, meniscus, sheen, steam.
  const FS_DISPLAY = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uDye;
    uniform vec2 dyeTexel;
    uniform float uK;          // canvas half-extent in coffee radii
    uniform float uTime;
    uniform vec2 uTilt;        // -1..1 pointer tilt
    uniform float uSway;       // radians
    uniform float uSteam;      // 0..1
    uniform float uPx;         // one canvas pixel in coffee units
    uniform vec2 uWind;        // steam lean (coffee units, y up)
    uniform vec2 uDrift;       // accumulated wind drift
    uniform float uGust;       // 0..1
    ${NOISE}

    vec2 rot (vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

    // steam seen from above: ribbons drift slowly; higher wisps lean further with the wind
    float steam (vec2 p, float t) {
      vec2 q0 = p * 1.05 - uDrift;
      float n = fbm4(q0 * 1.35 + vec2(0.0, -t * 0.03));
      vec2 q = q0 - uWind * (0.5 + 1.5 * n);
      q.y -= t * 0.035;
      q.x += 0.12 * sin(q.y * 2.3 + t * 0.21);
      float n2 = fbm4(q * vec2(1.6, 0.9) + vec2(n * 1.9, t * 0.025) + 3.7);
      float ribbon = 1.0 - abs(n2 * 2.0 - 1.0);
      ribbon = pow(ribbon, mix(4.2, 3.2, uGust));
      float field = smoothstep(0.34, 0.66, n);
      return ribbon * field;
    }

    void main () {
      vec2 p = (vUv * 2.0 - 1.0) * uK;
      float r = length(p);
      float aa = uPx * 1.25;
      float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);

      vec2 ps = rot(p, uSway);
      vec2 duv = clamp(ps * 0.5 + 0.5, 0.0, 1.0);
      vec4 d = texture2D(uDye, duv);

      // a touch of blur on the milk keeps stirred edges silky instead of torn
      float nearWall = smoothstep(0.78, 0.98, r);
      vec2 o = dyeTexel * mix(1.1, 2.4, nearWall);
      float mb = texture2D(uDye, duv + vec2(o.x, o.y)).x + texture2D(uDye, duv + vec2(-o.x, o.y)).x
               + texture2D(uDye, duv + vec2(o.x, -o.y)).x + texture2D(uDye, duv - o).x;
      float milk = mix(d.x, mb * 0.25, mix(0.65, 0.9, nearWall));

      // foam relief from the (wider) milk gradient
      vec2 e = dyeTexel * 2.5;
      float mx = texture2D(uDye, duv + vec2(e.x, 0.0)).x - texture2D(uDye, duv - vec2(e.x, 0.0)).x;
      float my = texture2D(uDye, duv + vec2(0.0, e.y)).x - texture2D(uDye, duv - vec2(0.0, e.y)).x;

      // neighbourhood average for the darker crema "halo" hugging the foam
      float halo = 0.0;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.785398 + 0.39;
        halo += texture2D(uDye, duv + vec2(cos(a), sin(a)) * 0.024).x;
      }
      halo = halo / 8.0;
      float ring = clamp((halo - milk) * 2.0, 0.0, 1.0);

      // crema
      float g = clamp(0.5 + (d.y - 0.5) * 1.6, 0.0, 1.0);
      vec3 cremaDeep = vec3(0.400, 0.235, 0.120);
      vec3 cremaMid  = vec3(0.600, 0.395, 0.225);
      vec3 cremaLite = vec3(0.755, 0.545, 0.330);
      vec3 crema = mix(cremaMid, cremaLite, g);
      crema = mix(crema, cremaDeep, smoothstep(0.62, 1.0, r) * 0.75);
      crema = mix(crema, cremaLite, (1.0 - smoothstep(0.0, 0.55, r)) * 0.18);
      crema = mix(crema, cremaDeep * 1.05, ring * 0.5);

      // milk: thin streaks read as latte, thick milk as foam (wide, soft thresholds)
      vec3 latte = vec3(0.835, 0.690, 0.520);
      vec3 foam = vec3(0.992, 0.968, 0.925);
      float thin = smoothstep(0.05, 0.36, milk);
      float thick = smoothstep(0.30, 0.68, milk);
      vec3 col = mix(crema, latte, thin * 0.75);

      vec3 n = normalize(vec3(-mx * 1.5, -my * 1.5, 1.0));
      float lit = dot(n, normalize(vec3(-0.55, 0.6, 0.75)));
      vec3 foamLit = foam * (0.935 + 0.08 * lit);
      float grain = vnoise(ps * 180.0) * 0.022 - 0.011;
      foamLit += grain;
      foamLit = mix(foamLit, vec3(0.93, 0.86, 0.76), (1.0 - smoothstep(0.6, 0.92, milk)) * 0.22);
      col = mix(col, foamLit, thick);

      // soft window sheen on the glossy crema
      vec2 hl = vec2(-0.38, 0.42) + uTilt * vec2(0.10, -0.08);
      float sheen = exp(-dot((p - hl) * vec2(1.0, 1.55), (p - hl) * vec2(1.0, 1.55)) / 0.075);
      col += vec3(1.0, 0.95, 0.88) * sheen * 0.13 * (1.0 - thick * 0.8);

      // rim shadow on the upper-left of the surface, meniscus glint on the lit side
      vec2 L = normalize(vec2(-0.62, 0.78));
      float wallShadow = smoothstep(0.93, 1.05, length(p + L * 0.115));
      col *= 1.0 - wallShadow * 0.30;
      float men = smoothstep(0.955, 0.997, r) * (1.0 - smoothstep(0.997, 1.0, r));
      float lightSide = clamp(dot(normalize(p + 1e-4), -L) * 0.5 + 0.5, 0.0, 1.0);
      col = mix(col, vec3(0.97, 0.90, 0.80), men * (0.15 + 0.45 * lightSide));
      col *= 1.0 - smoothstep(0.975, 1.0, r) * 0.18;

      // steam rising off the coffee (kept over the dark surface: white on porcelain disappears)
      float sA = 0.0;
      float stMask = 1.0 - smoothstep(0.58, 1.06, length(p - uWind * 0.8));
      if (stMask > 0.0 && uSteam > 0.0) {
        float st = steam(p, uTime) * uSteam;
        sA = clamp(st * stMask * (0.40 + 0.16 * uGust), 0.0, 0.46);
      }
      col = mix(col, vec3(1.0, 0.99, 0.97), sA * inside);

      float outA = sA * (1.0 - inside) * 0.5;
      vec3 premul = col * inside + vec3(1.0) * outA;
      gl_FragColor = vec4(premul, inside + outA);
    }`;

  /* ------------------------------------------------------------ Renderer (rebuilt after a context restore) */
  const CFG = LITE
    ? { sim: 128, dye: 384, iters: 12 }
    : { sim: 256, dye: 512, iters: 20 };

  function getContext(cv) {
    // 'default' keeps dual-GPU laptops on the integrated GPU: the sim is light, a hero should not wake the dGPU
    const params = { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'default' };
    let gl = null; let isGL2 = false;
    try {
      gl = cv.getContext('webgl2', params); isGL2 = !!gl;
      if (!gl) gl = cv.getContext('webgl', params) || cv.getContext('experimental-webgl', params);
    } catch (e) { gl = null; }
    if (!gl || gl.isContextLost()) return null;
    let halfType; let linear;
    if (isGL2) {
      gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('EXT_color_buffer_half_float');
      halfType = gl.HALF_FLOAT; linear = true;
    } else {
      const hf = gl.getExtension('OES_texture_half_float');
      if (!hf) return null;
      halfType = hf.HALF_FLOAT_OES;
      linear = !!gl.getExtension('OES_texture_half_float_linear');
    }
    const fmt = isGL2 ? fboFormat(gl, gl.RGBA16F, gl.RGBA, halfType) : fboFormat(gl, gl.RGBA, gl.RGBA, halfType);
    if (!fmt) return null;
    return { gl, isGL2, halfType, linear, fmt };
  }
  function fboFormat(gl, internal, format, type) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb); gl.deleteTexture(tex);
    return ok ? { internal, format } : null;
  }

  // Compile every program without blocking: KHR_parallel_shader_compile when available,
  // otherwise one program per task so no single task holds the main thread for long.
  function buildPrograms(gl, frags) {
    const par = gl.getExtension('KHR_parallel_shader_compile');
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VS); gl.compileShader(vs);
    const items = Object.keys(frags).map((name) => {
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, frags[name]); gl.compileShader(fs);
      const p = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, 'aPosition');
      gl.linkProgram(p);
      return { name, p, fs };
    });
    const finalize = (it) => {
      if (!gl.getProgramParameter(it.p, gl.LINK_STATUS)) {
        if (!gl.isContextLost()) console.warn('[WCHHero] shader', it.name, gl.getShaderInfoLog(it.fs) || gl.getProgramInfoLog(it.p));
        return null;
      }
      const u = {};
      const n = gl.getProgramParameter(it.p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(it.p, i).name; u[name] = gl.getUniformLocation(it.p, name); }
      return { p: it.p, u };
    };
    return new Promise((resolve, reject) => {
      const out = {};
      const lost = () => gl.isContextLost() && (reject(new Error('context lost')), true);
      if (par) {
        const poll = () => {
          if (lost()) return;
          if (!items.every((it) => gl.getProgramParameter(it.p, par.COMPLETION_STATUS_KHR))) { setTimeout(poll, 20); return; }
          for (const it of items) { const pr = finalize(it); if (!pr) { reject(new Error(it.name)); return; } out[it.name] = pr; }
          resolve(out);
        };
        setTimeout(poll, 0);
      } else {
        let i = 0;
        const next = () => {
          if (lost()) return;
          const pr = finalize(items[i]);
          if (!pr) { reject(new Error(items[i].name)); return; }
          out[items[i].name] = pr;
          if (++i < items.length) setTimeout(next, 0); else resolve(out);
        };
        setTimeout(next, 0);
      }
    });
  }

  async function createRenderer() {
    const ctx = getContext(canvas);
    if (!ctx) return null;
    const { gl } = ctx;
    const progs = await buildPrograms(gl, {
      clear: FS_CLEAR, splat: FS_SPLAT, advect: FS_ADVECT(!ctx.linear), divergence: FS_DIVERGENCE,
      curl: FS_CURL, vorticity: FS_VORTICITY, pressure: FS_PRESSURE, gradient: FS_GRADIENT,
      pattern: FS_PATTERN, display: FS_DISPLAY,
    });
    if (gl.isContextLost()) return null;

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.disable(gl.BLEND);

    const blit = (target) => {
      if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
      else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
    const fbo = (w, h, filter) => {
      gl.activeTexture(gl.TEXTURE0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, ctx.fmt.internal, w, h, 0, ctx.fmt.format, ctx.halfType, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { fbo: fb, w, h, tx: 1 / w, ty: 1 / h, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
    };
    const doubleFbo = (w, h, filter) => {
      let a = fbo(w, h, filter); let b = fbo(w, h, filter);
      return { w, h, tx: a.tx, ty: a.ty, get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; } };
    };

    const LIN = ctx.linear ? gl.LINEAR : gl.NEAREST;
    const velocity = doubleFbo(CFG.sim, CFG.sim, LIN);
    const dye = doubleFbo(CFG.dye, CFG.dye, LIN);
    const pressure = doubleFbo(CFG.sim, CFG.sim, gl.NEAREST);
    const divergence = fbo(CFG.sim, CFG.sim, gl.NEAREST);
    const curlTex = fbo(CFG.sim, CFG.sim, gl.NEAREST);
    const simTexel = [1 / CFG.sim, 1 / CFG.sim];
    const dyeTexel = [1 / CFG.dye, 1 / CFG.dye];
    const use = (pr, texel) => { gl.useProgram(pr.p); if (pr.u.texelSize) gl.uniform2f(pr.u.texelSize, texel[0], texel[1]); return pr.u; };

    let pxUnit = 0.004;
    const api = {
      gl, isGL2: ctx.isGL2, linear: ctx.linear,
      size() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(2, Math.round(canvasCss * dpr));
        if (canvas.width !== w || canvas.height !== w) { canvas.width = w; canvas.height = w; }
        pxUnit = (2 * K) / w;
      },
      splat(target, x, y, c, rx, ry, mode, strength, ringR) {
        const t = target === 'dye' ? dye : velocity;
        const u = use(progs.splat, [t.tx, t.ty]);
        gl.uniform1i(u.uTarget, t.read.attach(0));
        gl.uniform3f(u.color, c[0], c[1], c[2]);
        gl.uniform2f(u.point, x, y);
        gl.uniform2f(u.radius, rx, ry);
        gl.uniform1f(u.ring, ringR || 0);
        gl.uniform1f(u.mode, mode);
        gl.uniform1f(u.strength, strength);
        blit(t.write); t.swap();
      },
      pattern(pattern, prog, rateMilk, rateCrema, seed) {
        const u = use(progs.pattern, dyeTexel);
        gl.uniform1i(u.uDye, dye.read.attach(0));
        gl.uniform1f(u.uPattern, pattern);
        gl.uniform1f(u.uProg, prog);
        gl.uniform2f(u.uRate, rateMilk, rateCrema);
        gl.uniform1f(u.uSeed, seed);
        blit(dye.write); dye.swap();
      },
      clearVelocity() {
        const u = use(progs.clear, simTexel);
        gl.uniform1i(u.uTexture, velocity.read.attach(0));
        gl.uniform1f(u.value, 0);
        blit(velocity.write); velocity.swap();
      },
      step(dt, cfg) {
        let u;
        if (cfg.curl > 0) {
          u = use(progs.curl, simTexel);
          gl.uniform1i(u.uVelocity, velocity.read.attach(0));
          blit(curlTex);
          u = use(progs.vorticity, simTexel);
          gl.uniform1i(u.uVelocity, velocity.read.attach(0));
          gl.uniform1i(u.uCurl, curlTex.attach(1));
          gl.uniform1f(u.curl, cfg.curl);
          gl.uniform1f(u.dt, dt);
          blit(velocity.write); velocity.swap();
        }
        u = use(progs.divergence, simTexel);
        gl.uniform1i(u.uVelocity, velocity.read.attach(0));
        blit(divergence);

        u = use(progs.clear, simTexel);
        gl.uniform1i(u.uTexture, pressure.read.attach(0));
        gl.uniform1f(u.value, 0.8);
        blit(pressure.write); pressure.swap();

        u = use(progs.pressure, simTexel);
        gl.uniform1i(u.uDivergence, divergence.attach(0));
        for (let i = 0; i < CFG.iters; i++) {
          gl.uniform1i(u.uPressure, pressure.read.attach(1));
          blit(pressure.write); pressure.swap();
        }

        u = use(progs.gradient, simTexel);
        gl.uniform1i(u.uPressure, pressure.read.attach(0));
        gl.uniform1i(u.uVelocity, velocity.read.attach(1));
        blit(velocity.write); velocity.swap();

        u = use(progs.advect, simTexel);
        gl.uniform2f(u.dyeTexelSize, simTexel[0], simTexel[1]);
        gl.uniform1i(u.uVelocity, velocity.read.attach(0));
        gl.uniform1i(u.uSource, velocity.read.attach(0));
        gl.uniform1f(u.dt, dt);
        const vd = Math.exp(-cfg.velDecay * dt);
        gl.uniform4f(u.decay, vd, vd, 1, 1);
        gl.uniform1f(u.maskOut, 1);
        gl.uniform1f(u.diffuse, 0);
        blit(velocity.write); velocity.swap();

        u = use(progs.advect, simTexel);
        gl.uniform2f(u.dyeTexelSize, dyeTexel[0], dyeTexel[1]);
        gl.uniform1i(u.uVelocity, velocity.read.attach(0));
        gl.uniform1i(u.uSource, dye.read.attach(1));
        gl.uniform1f(u.dt, dt);
        gl.uniform4f(u.decay, Math.exp(-0.004 * dt), 1, 1, 1);
        gl.uniform1f(u.maskOut, 0);
        gl.uniform1f(u.diffuse, cfg.diffuse || 0);
        blit(dye.write); dye.swap();
      },
      draw(time) {
        const u = use(progs.display, dyeTexel);
        gl.uniform1i(u.uDye, dye.read.attach(0));
        gl.uniform2f(u.dyeTexel, dyeTexel[0], dyeTexel[1]);
        gl.uniform1f(u.uK, K);
        gl.uniform1f(u.uTime, time);
        gl.uniform2f(u.uTilt, look.tiltX, look.tiltY);
        gl.uniform1f(u.uSway, look.sway);
        gl.uniform1f(u.uSteam, look.steam);
        gl.uniform1f(u.uPx, pxUnit);
        gl.uniform2f(u.uWind, look.windX, look.windY);
        gl.uniform2f(u.uDrift, look.driftX, look.driftY);
        gl.uniform1f(u.uGust, look.gust);
        gl.clearColor(0, 0, 0, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        blit(null);
      },
    };
    api.size();
    return api;
  }

  /* ------------------------------------------------------------ Choreography */
  // phases: 'wait' (entrance), 'pour', 'rest', 'swirl' (idle cue), 'settle' (milk sinks before a re-pour)
  const PATTERNS = { rosetta: 1, heart: 2, tulip: 3 };
  const POUR = {
    rosetta: { grow: 2.4, pullAt: 2.52, pullFrom: 0.46, pullTo: -0.84, pull: 0.55, drag: 0.36, line: 0.18 },
    heart:   { grow: 1.7, pullAt: 1.20, pullFrom: 0.62, pullTo: -0.76, pull: 0.55, drag: 0.7, line: 0.22 },
    tulip:   { grow: 2.0, pullAt: 2.12, pullFrom: 0.50, pullTo: -0.78, pull: 0.55, drag: 0.8, line: 0.25 },
  };
  const NEXT = ['heart', 'tulip', 'rosetta'];
  let nextIdx = 0;
  const nextPattern = () => NEXT[nextIdx++ % NEXT.length];
  const CUE_EVERY = FINE ? 20 : 12;          // seconds of calm before an idle cue
  const S = {
    phase: 'wait', t: 0, pattern: 'rosetta', seed: Math.random() * 10 + 1,
    stirring: false, everStirred: false, lastInput: -1e9, energy: 0,
    cueAt: Infinity, cueKind: 'swirl', hinted: false, pullPrev: null, swirl: null, next: null,
  };
  let clock = 0;                               // simulation seconds
  const drops = [];

  function startPour(name) { S.phase = 'pour'; S.t = 0; S.pattern = name; S.pullPrev = null; }
  function startSettle(next) { S.phase = 'settle'; S.t = 0; S.next = next; S.seed = Math.random() * 10 + 1; }
  function startSwirl() {
    S.phase = 'swirl'; S.t = 0;
    S.swirl = { a0: Math.random() * Math.PI * 2, dir: Math.random() < 0.5 ? 1 : -1 };
  }
  function poured() {
    S.phase = 'rest'; S.t = 0;
    if (!FINE || !S.everStirred) { S.cueKind = 'swirl'; S.cueAt = clock + CUE_EVERY; } else S.cueAt = Infinity;
    if (!S.hinted && !REDUCED) { S.hinted = true; hero.classList.add('is-hinting'); }
  }

  function choreograph(dt) {
    const cfg = { curl: 1.2, velDecay: 1.6, diffuse: S.stirring ? 0.14 : 0 };
    if (S.phase === 'pour') {
      const P0 = POUR[S.pattern];
      S.t += dt;
      const growT = S.t / P0.grow;
      if (growT <= 1.08) R.pattern(PATTERNS[S.pattern], Math.min(1, growT), damp(14, dt), 0, S.seed);
      cfg.curl = 0; cfg.velDecay = S.t > P0.pullAt + P0.pull * 0.8 ? 6 : 3.2;
      // pull-through: a narrow, fast drag through the middle; the physics makes the points
      const pt = (S.t - P0.pullAt) / P0.pull;
      if (pt >= 0 && pt <= 1) {
        const e = easeInOut(pt);
        const y = P0.pullFrom + (P0.pullTo - P0.pullFrom) * e;
        const speed = Math.abs(P0.pullTo - P0.pullFrom) / P0.pull * 0.5;
        const ux = 0.5, uy = 0.5 + y * 0.5;
        const fade = Math.sin(Math.PI * Math.min(1, pt * 1.15));
        R.splat('vel', ux, uy, [0, -speed * P0.drag, 0], 0.00012, 0.0007, 1, 0.65 * fade);
        if (S.pullPrev !== null && P0.line > 0) {
          for (let i = 1; i <= 3; i++) {
            const yy = S.pullPrev + (uy - S.pullPrev) * (i / 3);
            R.splat('dye', ux, yy, [P0.line, 0, 0], 0.000012, 0.00004, 0, 1);
          }
        }
        S.pullPrev = uy;
        S.energy = 3;
      }
      if (pt > 1.6 && growT > 1.08) poured();
    } else if (S.phase === 'settle') {
      S.t += dt;
      R.pattern(0, 0, damp(2.6, dt), damp(1.8, dt), S.seed);
      cfg.velDecay = 2.5;
      if (S.t > 1.5) startPour(S.next);
    } else if (S.phase === 'swirl') {
      // one slow loop of an invisible spoon: the art drifts into a soft spiral
      S.t += dt;
      const T = 3.6; const k = S.t / T;
      if (k <= 1) {
        const sw = S.swirl;
        const turn = Math.PI * 2 * 1.05;
        const a = sw.a0 + sw.dir * turn * easeInOut(k);
        const da = sw.dir * turn * (k < 0.5 ? 4 * k : 4 * (1 - k)) / T;     // d(angle)/dt
        const rho = 0.40 + 0.08 * Math.sin(Math.PI * k);
        const x = 0.5 + Math.cos(a) * rho * 0.5, y = 0.5 + Math.sin(a) * rho * 0.5;
        const v = da * rho * 0.5 * 0.9;
        R.splat('vel', x, y, [-Math.sin(a) * v, Math.cos(a) * v, 0], 0.0026, 0.0026, 1, 0.4 * Math.sin(Math.PI * k));
        S.energy = 2.5;
      } else {
        S.phase = 'rest'; S.cueKind = 'repour'; S.cueAt = clock + 6.5;
      }
    } else if (S.phase === 'rest') {
      if (S.stirring) {
        if (clock - S.lastInput > 8) { S.stirring = false; startSettle(nextPattern()); }
      } else if (clock >= S.cueAt) {
        if (S.cueKind === 'swirl') startSwirl(); else startSettle(nextPattern());
      }
    }
    return cfg;
  }

  function userStirred() {
    if (S.phase === 'pour' || S.phase === 'settle' || S.phase === 'swirl') S.phase = 'rest';
    S.stirring = true; S.everStirred = true; S.lastInput = clock; S.energy = 4;
    if (!hero.classList.contains('is-stirred')) hero.classList.add('is-stirred');
  }

  /* ------------------------------------------------------------ Turning input into stirring */
  const SPLAT_R = 0.0011;
  function processInput() {
    const sx = SCR.x, sy = SCR.y;
    let stirred = false;
    const q = P.queue; P.queue = [];
    if (S.phase === 'wait') { P.taps.length = 0; return; }
    for (let i = 0; i < q.length; i++) {
      const [px, py, t, touch] = q[i];
      const c = toCoffee(px - sx, py - sy);
      let x = c.x, y = c.y;
      if (!touch) {
        if (c.r > 1.02) { P.lastU = null; continue; }
      } else if (c.r > 0.8) {
        // a finger anywhere on the cup or saucer: project it softly into the coffee's outer band
        const r2 = 0.8 + 0.17 * Math.tanh((c.r - 0.8) / 0.17);
        x *= r2 / c.r; y *= r2 / c.r;
      }
      const u = { x: 0.5 + x * 0.5, y: 0.5 + y * 0.5, t };
      const lu = P.lastU;
      if (lu) {
        const dx = u.x - lu.x, dy = u.y - lu.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.0004) {
          const dts = clamp((t - lu.t) / 1000, 1 / 240, 0.12);
          const speed = dist / dts;                              // uv per second
          const gain = touch ? 0.85 : 0.55;
          const vx = clamp(dx / dts * gain, -2.6, 2.6);
          const vy = clamp(dy / dts * gain, -2.6, 2.6);
          const rad = SPLAT_R * clamp(0.45 + speed * 0.55, 0.45, 2.4);   // slow = fine trail, fast = wide swirl
          const n = Math.min(10, Math.ceil(dist / 0.01));
          for (let j = 1; j <= n; j++) R.splat('vel', lu.x + dx * (j / n), lu.y + dy * (j / n), [vx, vy, 0], rad, rad, 1, 0.55);
          stirred = true;
        }
      }
      P.lastU = u;
    }
    for (const [px, py] of P.taps) {
      const c = toCoffee(px - sx, py - sy);
      if (c.r < 0.92) { drops.push({ x: 0.5 + c.x * 0.5, y: 0.5 + c.y * 0.5, t: 0 }); stirred = true; }
    }
    P.taps.length = 0;
    if (stirred) userStirred();
  }

  // a tap / click: a drop of milk lands, then a thin ring opens around it
  function updateDrops(dt) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (d.t === 0) R.splat('dye', d.x, d.y, [0.97, 0, 0], 0.00009, 0.00009, 1, 1);
      d.t += dt;
      const k = Math.min(1, d.t / 0.6);
      const e = 1 - Math.pow(1 - k, 3);
      R.splat('dye', d.x, d.y, [0.94, 0, 0], 0.000016, 0, 1, 0.12 + 0.5 * k * k, 0.012 + 0.036 * e);
      if (k >= 1) drops.splice(i, 1);
      S.energy = Math.max(S.energy, 0.5);
    }
  }

  /* ------------------------------------------------------------ Tilt, parallax, steam wind, cursor ring */
  const look = { tiltX: 0, tiltY: 0, sway: 0, steam: 1, windX: 0, windY: 0, driftX: 0, driftY: 0, gust: 0 };
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const written = { tilt: '', cup: '', shadow: '', table: '', par: '', cursor: '' };
  let ringOn = false;

  function setStyle(el, key, value) { if (written[key] !== value) { written[key] = value; el.style.transform = value; } }

  function updateMotion(dt, time) {
    const c = cup();
    // tilt toward the pointer (whole hero on desktop, the finger on touch), else a slow ambient drift
    if (FINE && P.has) {
      tilt.tx = clamp((P.cx - c.x) / (G.vw * 0.45), -1, 1);
      tilt.ty = clamp((P.cy - c.y) / (G.vh * 0.5), -1, 1);
    } else if (!FINE && P.down) {
      tilt.tx = clamp((P.cx - c.x) / (c.r * 4), -0.6, 0.6);
      tilt.ty = clamp((P.cy - c.y) / (c.r * 4), -0.6, 0.6);
    } else {
      tilt.tx = Math.sin(time * 0.23) * 0.22;
      tilt.ty = Math.cos(time * 0.17) * 0.16;
    }
    const k = damp(4.5, dt);
    tilt.x += (tilt.tx - tilt.x) * k;
    tilt.y += (tilt.ty - tilt.y) * k;
    const s = G.size / 600;
    lay.x = tilt.x * 5 * s; lay.y = tilt.y * 5 * s;
    setStyle(tiltEl, 'tilt', `rotateX(${(-tilt.y * 6).toFixed(2)}deg) rotateY(${(tilt.x * 6).toFixed(2)}deg)`);
    setStyle(layerCup, 'cup', `translate3d(${lay.x.toFixed(1)}px, ${lay.y.toFixed(1)}px, 0)`);
    if (layerCupShadow) setStyle(layerCupShadow, 'shadow', `translate3d(${(-tilt.x * 3 * s).toFixed(1)}px, ${(-tilt.y * 3 * s).toFixed(1)}px, 0)`);
    if (layerTable) setStyle(layerTable, 'table', `translate3d(${(-tilt.x * 6 * s).toFixed(1)}px, ${(-tilt.y * 6 * s).toFixed(1)}px, 0)`);
    look.tiltX = tilt.x; look.tiltY = tilt.y;
    look.sway = Math.sin(time * 0.31) * 0.035 + tilt.x * 0.05;

    // steam: leans toward the pointer anywhere in the hero, gusts with its speed
    let wx = Math.sin(time * 0.11) * 0.03, wy = Math.cos(time * 0.08) * 0.02;
    const pointing = (FINE && P.has) || P.down;
    if (pointing) {
      const dx = P.cx - c.x, dy = P.cy - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const lean = 0.13 * Math.min(1, d / (c.r * 3.5));
      wx = dx / d * lean; wy = -dy / d * lean;
    }
    const gx = clamp(P.vx / (c.r * 9), -0.3, 0.3), gy = clamp(-P.vy / (c.r * 9), -0.3, 0.3);
    const decay = Math.exp(-3.5 * dt);
    P.vx *= decay; P.vy *= decay;
    const kw = damp(2.4, dt);
    look.windX += (wx + gx - look.windX) * kw;
    look.windY += (wy + gy - look.windY) * kw;
    look.gust += (clamp(Math.hypot(gx, gy) * 3, 0, 1) - look.gust) * damp(3, dt);
    look.driftX += look.windX * 0.5 * dt;
    look.driftY += look.windY * 0.5 * dt;
  }

  function updateCursor() {
    if (!FINE || !cursorEl) return;
    let over = false;
    if (P.has && R && S.phase !== 'wait') over = toCoffee(P.cx, P.cy).r < 1.03;
    if (over !== ringOn) {
      ringOn = over;
      cursorEl.classList.toggle('is-on', over);
      stage.classList.toggle('is-stirring', over);
    }
    if (over) {
      const lx = P.cx - (G.x - SCR.x), ly = P.cy - (G.y - SCR.y + par.y);
      setStyle(cursorEl, 'cursor', `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`);
    }
  }

  function updateParallax() {
    const y = REDUCED ? 0 : Math.min(SCR.y, G.vh * 1.2) * 0.14;
    if (Math.abs(y - par.y) > 0.05 || (y === 0 && par.y !== 0)) {
      par.y = y;
      setStyle(scrollEl, 'par', y ? `translate3d(0, ${y.toFixed(1)}px, 0)` : '');
    }
  }

  /* ------------------------------------------------------------ Loop */
  let R = null;                 // renderer, null until GL is ready (or after a context loss)
  const IDLE_GAP = LITE ? 48 : 32;   // ms between display passes when settled
  let running = false, rafId = 0, lastTs = 0, lastMotion = 0, lastDraw = -1e9, dirty = true;
  let inView = true, pageVisible = !document.hidden;
  let glintAt = now() + 9000, glintTimer = 0;
  const T0 = now();
  let entranceDone = false;

  function frame(ts) {
    rafId = 0;
    if (!running) return;
    const dt = Math.min((ts - lastTs) / 1000, 1 / 30);
    if (!(dt > 0)) { rafId = requestAnimationFrame(frame); return; }   // no time has passed: nothing to step
    lastTs = ts;
    const time = (ts - T0) / 1000;
    SCR.x = window.scrollX; SCR.y = window.scrollY;   // the frame's only scroll read, before any writes

    updateParallax();
    let simmed = false;
    if (R) {
      clock += dt;
      processInput();
      updateDrops(dt);
      const cfg = choreograph(dt);
      if (S.energy > 0 || S.phase === 'pour' || S.phase === 'settle' || S.phase === 'swirl') {
        R.step(dt, cfg); S.energy -= dt; simmed = true;
      }
    } else {
      P.queue.length = 0; P.taps.length = 0;
    }

    // Full rate while the milk moves or a pointer is (or was, 1.5 s ago: the tilt is still easing) active.
    // Settled, only the slow steam and the ambient sway change: the display pass runs at 30 fps (20 on phones).
    const live = simmed || drops.length > 0 || dirty || P.down || ts - P.active < 1500;
    if (live || ts - lastDraw >= IDLE_GAP) {
      updateMotion(clamp((ts - lastMotion) / 1000, 0, 0.1), time);
      lastMotion = ts;
      if (R) R.draw(time);
      lastDraw = ts; dirty = false;
    }
    updateCursor();

    // idle glint across the gold rims
    if (ts > glintAt && S.phase === 'rest' && ts - P.active > 4000 && !P.down) {
      glintAt = ts + 9000 + Math.random() * 2000;
      hero.classList.add('is-glint');
      clearTimeout(glintTimer);
      glintTimer = setTimeout(() => hero.classList.remove('is-glint'), 1750);
    }
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || REDUCED || !inView || !pageVisible) return;
    running = true; lastTs = now(); lastMotion = lastTs; dirty = true;
    if (!rafId) rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (ringOn) { ringOn = false; cursorEl.classList.remove('is-on'); stage.classList.remove('is-stirring'); }
  }
  function wake() { if (!running) start(); }

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) start(); else stop();
  });
  if ('IntersectionObserver' in window) {
    // ratio > 0 (not isIntersecting): edge contact at the viewport top counts as off-screen.
    // The tiny second threshold makes "a sliver visible" -> "edge contact" (ratio 0, still
    // isIntersecting) a threshold crossing, so the callback fires and the loop stops there too.
    new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].intersectionRatio > 0;
      if (inView) start(); else stop();
    }, { threshold: [0, 1e-4] }).observe(hero);
  }

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => { measure(); if (REDUCED && R) R.draw(4); });
    ro.observe(hero); ro.observe(visual); if (copyEl) ro.observe(copyEl);
  } else {
    window.addEventListener('resize', () => { measure(); if (REDUCED && R) R.draw(4); });
  }
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  /* ------------------------------------------------------------ Boot: after first paint, never blocking */
  function maybePour() {
    if (S.phase === 'wait' && R && entranceDone && !REDUCED) { startPour('rosetta'); wake(); }
  }
  const rimCup = $('.latte__rim--cup');
  if (rimCup) rimCup.addEventListener('animationend', () => { entranceDone = true; maybePour(); }, { once: true });
  setTimeout(() => { entranceDone = true; maybePour(); }, 1900);   // no animation (no .js class, hidden tab)

  // Reduced motion: pour the rosetta off-screen in small chunks, then paint one still frame.
  let stillToken = 0;
  function paintStill() {
    if (!R) return;
    const token = ++stillToken;
    R.clearVelocity();
    R.pattern(0, 0, 1, 1, S.seed);
    startPour('rosetta');
    const dt = 1 / 60;
    let i = 0;
    const chunk = () => {
      if (token !== stillToken || !R) return;
      for (let n = 0; n < 45; n++, i++) {
        if (S.phase === 'pour') { clock += dt; R.step(dt, choreograph(dt)); }
        else if (i < 400) R.step(dt, { curl: 0, velDecay: 5 });
      }
      if (S.phase === 'pour' || i < 360) { setTimeout(chunk, 0); return; }
      S.phase = 'rest'; S.cueAt = Infinity;
      look.sway = 0; look.windX = look.windY = 0;
      R.draw(4.0);
      canvas.classList.add('is-ready');       // shown only once the finished rosetta is on it
    };
    setTimeout(chunk, 0);
  }

  async function bootGL() {
    let r = null;
    try { r = await createRenderer(); } catch (e) { r = null; }
    if (!r) { if (!R) fail(); return; }
    R = r;
    hero.classList.remove('no-gl');
    hero.classList.add('has-gl');
    R.pattern(0, 0, 0, 1, S.seed);            // fresh crema
    if (REDUCED) { paintStill(); return; }
    R.draw((now() - T0) / 1000); dirty = true;
    canvas.classList.add('is-ready');
    maybePour(); wake();
  }
  function fail() {
    R = null;
    hero.classList.remove('has-gl', 'is-hinting');
    hero.classList.add('no-gl');
    canvas.classList.remove('is-ready');
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();                       // allows webglcontextrestored
    S.phase = 'wait'; S.energy = 0; drops.length = 0;
    fail();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    S.phase = 'wait'; S.seed = Math.random() * 10 + 1;
    bootGL();
  });

  // GL starts in the task right after the first frame is painted. Creating the context is one
  // synchronous call (tens of ms on a cold GPU process) that cannot be split; here it lands before the
  // rims start drawing (stroke-dashoffset runs on the main thread from 0.3 s), never in the middle of
  // them, and the shaders then compile in parallel / one per task.
  const afterFirstPaint = (fn) => requestAnimationFrame(() => setTimeout(fn, 0));
  afterFirstPaint(bootGL);
  start();

  // live changes to the reduced-motion setting
  const onReduce = (e) => {
    REDUCED = e.matches;
    hero.classList.toggle('is-reduced', REDUCED);
    if (REDUCED) {
      stop();
      for (const key of ['tilt', 'cup', 'shadow', 'table', 'par']) written[key] = '';
      [tiltEl, layerCup, layerCupShadow, layerTable, scrollEl].forEach((el) => { if (el) el.style.transform = ''; });
      par.y = 0; lay.x = lay.y = 0;
      if (R) paintStill();
    } else {
      stillToken++;
      if (R && S.phase !== 'pour') { S.phase = 'rest'; S.stirring = true; S.lastInput = clock - 7; }
      entranceDone = true;
      start();
    }
  };
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onReduce);
  else if (mqReduce.addListener) mqReduce.addListener(onReduce);

  /* ------------------------------------------------------------ Small control hook (QA + integrator) */
  window.WCHHero = {
    pour(name) { if (!R) return false; entranceDone = true; startSettle(PATTERNS[name] ? name : 'heart'); wake(); return true; },
    swirl() { if (!R || S.phase === 'wait') return false; startSwirl(); wake(); return true; },
    drop(x, y) { if (!R) return false; drops.push({ x: 0.5 + (x || 0) * 0.5, y: 0.5 + (y || 0) * 0.5, t: 0 }); wake(); return true; },
    glint() { glintAt = 0; wake(); },
    state() {
      return {
        phase: S.phase, pattern: S.pattern, running, inView, gl: !!R, gl2: !!(R && R.isGL2), linear: !!(R && R.linear),
        lite: LITE, sim: CFG.sim, dye: CFG.dye, iters: CFG.iters, everStirred: S.everStirred, cueIn: +(S.cueAt - clock).toFixed(1),
      };
    },
  };
})();
