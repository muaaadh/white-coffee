/* ==========================================================================
   Prototype A — "A latte you can stir"
   - header (scrolled state, mobile menu)
   - scroll reveals + hero parallax
   - WebGL latte: stable-fluids sim (velocity 256², dye 512²) inside a circle,
     procedural latte art poured on load, cursor/touch stirring, re-forms
     after 8 s of no input, steam wisps, cup tilt toward the pointer.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add(FINE ? 'is-fine' : 'is-touch');
  if (REDUCED) root.classList.add('is-reduced');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const damp = (k, dt) => 1 - Math.exp(-k * dt);           // time-based smoothing factor

  /* ------------------------------------------------------------ Header */
  const header = document.querySelector('[data-header]');
  const menuBtn = document.querySelector('[data-menu-btn]');
  const nav = document.getElementById('site-nav');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.toggle('menu-open', open);
  }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 821px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ------------------------------------------------------------ Scroll: header state + hero parallax */
  const hero = document.querySelector('[data-hero]');
  const cupScroll = document.querySelector('[data-cup-scroll]');
  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      if (!REDUCED && y < window.innerHeight * 1.2) {
        cupScroll.style.transform = `translate3d(0, ${(y * 0.14).toFixed(1)}px, 0)`;
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ Reveals */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !REDUCED) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ============================================================ Latte */
  const canvas = document.querySelector('[data-coffee]');
  const stage = document.querySelector('[data-stage]');
  const tiltEl = document.querySelector('[data-tilt]');
  const layerCup = document.querySelector('[data-layer="cup"]');
  const layerCupShadow = document.querySelector('[data-layer="cupshadow"]');
  const layerTable = document.querySelector('[data-layer="table"]');
  const hint = document.querySelector('[data-hint]');
  const ring = document.querySelector('[data-cursor]');

  // geometry (SVG viewBox units): coffee radius 52, canvas half-size 62
  const K = 62 / 52;                 // canvas half-extent in coffee radii
  const SIM_RES = 256;
  const DYE_RES = 512;

  const gl = initGL(canvas);
  if (!gl) { root.classList.add('no-gl'); return; }
  root.classList.add('has-gl');

  /* ------------------------------------------------------------ GL helpers */
  function initGL(cv) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
    let g = null; let isGL2 = false;
    try { g = cv.getContext('webgl2', params); isGL2 = !!g; if (!g) g = cv.getContext('webgl', params) || cv.getContext('experimental-webgl', params); } catch (e) { g = null; }
    if (!g) return null;
    let halfType; let linear;
    if (isGL2) {
      g.getExtension('EXT_color_buffer_float');
      g.getExtension('EXT_color_buffer_half_float');
      halfType = g.HALF_FLOAT; linear = true;      // 16F is filterable in WebGL2
    } else {
      const hf = g.getExtension('OES_texture_half_float');
      if (!hf) return null;
      halfType = hf.HALF_FLOAT_OES;
      linear = !!g.getExtension('OES_texture_half_float_linear');
    }
    const fmt = isGL2
      ? supported(g, g.RGBA16F, g.RGBA, halfType)
      : supported(g, g.RGBA, g.RGBA, halfType);
    if (!fmt) return null;
    g.__ext = { isGL2, halfType, linear, fmt };
    return g;
  }
  function supported(g, internal, format, type) {
    const tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
    const fbo = g.createFramebuffer();
    g.bindFramebuffer(g.FRAMEBUFFER, fbo);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0);
    const ok = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
    g.bindFramebuffer(g.FRAMEBUFFER, null);
    g.deleteFramebuffer(fbo); g.deleteTexture(tex);
    return ok ? { internal, format } : null;
  }

  const EXT = gl.__ext;
  const MANUAL = EXT.linear ? '' : '#define MANUAL_FILTERING\n';

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  function program(vsSrc, fsSrc) {
    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPosition');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }

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
    }`;

  const FS_CLEAR = `
    precision mediump float;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

  // add (dye) or lerp (velocity, like a spoon imposing its speed) an anisotropic gaussian
  const FS_SPLAT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform vec3 color;
    uniform vec2 point;
    uniform vec2 radius;      // sigma^2 in x and y (uv units)
    uniform float mode;       // 0 add, 1 lerp
    uniform float strength;
    void main () {
      vec2 p = vUv - point;
      float g = exp(-(p.x * p.x / radius.x + p.y * p.y / radius.y)) * strength;
      vec4 base = texture2D(uTarget, vUv);
      vec3 added = base.xyz + g * color;
      added.x = clamp(added.x, 0.0, 1.0);
      vec3 lerped = mix(base.xyz, color, clamp(g, 0.0, 1.0));
      vec3 v = mix(added, lerped, mode);
      float inside = step(length(vUv * 2.0 - 1.0), 1.0);
      gl_FragColor = vec4(mix(base.xyz, v, inside), base.w);
    }`;

  const FS_ADVECT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform vec4 decay;
    uniform float maskOut;
    ${MANUAL}
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
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy;
      vec4 result = texture2D(uSource, coord);
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
      // fine tiger-flecks swirled slightly, around a calm mid value
      vec2 q = vec2(fbm(p * 2.2 + uSeed), fbm(p * 2.2 - uSeed + 4.2));
      float broad = fbm(p * 1.6 + q * 0.8 + uSeed * 1.7);
      float fine = fbm(p * vec2(9.0, 7.0) + q * 2.4 + uSeed);
      return 0.5 + (broad - 0.5) * 0.55 + (fine - 0.5) * 0.45;
    }
    float soft (float d, float e) { return 1.0 - smoothstep(-e, e, d); }   // inside when d < 0
    float ease (float t) { t = clamp(t, 0.0, 1.0); return 1.0 - pow(1.0 - t, 3.0); }

    // Rosetta as it is actually poured: each wiggle pushes a new blob of milk into the last one,
    // so the art is a stack of nested crescents; the pull-through then drags their centres into V's.
    float rosetta (vec2 p, float prog) {
      vec2 w = vec2(fbm(p * 3.2 + uSeed * 3.1), fbm(p * 3.2 - uSeed * 2.3 + 7.3)) - 0.5;
      p += w * 0.02;
      float ang = (fract(uSeed * 7.13) - 0.5) * 0.10;
      p = vec2(cos(ang) * p.x - sin(ang) * p.y, sin(ang) * p.x + cos(ang) * p.y);
      p = p * 0.93 + vec2(0.0, -0.035);
      float ax = abs(p.x);
      p.y += 0.05 * exp(-ax * ax / 0.005);                       // V from the pull-through
      p.y += 0.010 * sin(p.x * 21.0 + uSeed * 5.0) * smoothstep(0.05, 0.3, ax);   // hand-poured ripple
      const int N = 9;
      float yb = -0.70, yt = 0.10;
      float R0 = 0.76, R1 = 0.15;
      // domed cap where the leaf tips end, rising into the heart; corners rounded with a smooth max
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
        float R = mix(R0, R1, pow(t, 0.78)) * mix(0.6, 1.0, g);
        float d = length(p - vec2(0.0, b + R)) - R;
        float gap = mix(0.030, 0.004, nearCap) * mix(1.0, 0.75, t);
        float leaf = soft(d, 0.010) * (1.0 - soft(dPrev - gap, 0.008));
        milk = max(milk, leaf);
        dPrev = min(dPrev, d);
      }
      milk *= inCap;
      // stem left by the pull-through
      float stem = (1.0 - smoothstep(0.005, 0.015, ax)) * step(yb - 0.08, p.y) * step(p.y, 0.34) * step(0.97, prog);
      // little heart at the top, poured last
      float hg = ease((prog - 0.80) / 0.2);
      vec2 hc = vec2(0.0, 0.40);
      float heart = soft(length((p - hc) * vec2(1.0, 1.08)) - 0.105 * hg, 0.012) * step(0.001, hg);
      return clamp(max(max(milk, heart), stem * 0.9), 0.0, 1.0);
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
      // a circle of milk grows, then the pull-through turns it into a heart
      float grow = ease(prog / 0.72);
      float morph = smoothstep(0.70, 1.0, prog);
      vec2 c = vec2(0.0, 0.08);
      float dCircle = length((p - c) * vec2(0.98, 1.04)) - 0.46 * grow;
      // full, round latte heart (wide lobes, soft point)
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
    ${NOISE}

    vec2 rot (vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

    float steam (vec2 p, float t) {
      vec2 q = p * 1.05;
      q.y -= t * 0.035;
      q.x += 0.12 * sin(q.y * 2.3 + t * 0.21);
      float n = fbm(q * 1.35 + vec2(0.0, -t * 0.03));
      float n2 = fbm(q * vec2(1.6, 0.9) + vec2(n * 1.9, t * 0.025) + 3.7);
      float ribbon = 1.0 - abs(n2 * 2.0 - 1.0);
      ribbon = pow(ribbon, 5.5);
      float field = smoothstep(0.38, 0.72, n);
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
      float milk = d.x;

      // foam relief from the milk gradient
      vec2 e = dyeTexel * 1.5;
      float mx = texture2D(uDye, duv + vec2(e.x, 0.0)).x - texture2D(uDye, duv - vec2(e.x, 0.0)).x;
      float my = texture2D(uDye, duv + vec2(0.0, e.y)).x - texture2D(uDye, duv - vec2(0.0, e.y)).x;

      // neighbourhood average for the darker crema "halo" hugging the foam
      float halo = 0.0;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.785398 + 0.39;
        halo += texture2D(uDye, duv + vec2(cos(a), sin(a)) * 0.024).x;
      }
      halo = halo / 8.0;
      float ring = clamp((halo - milk) * 2.2, 0.0, 1.0);

      // crema
      float g = clamp(0.5 + (d.y - 0.5) * 1.6, 0.0, 1.0);
      vec3 cremaDeep = vec3(0.400, 0.235, 0.120);
      vec3 cremaMid  = vec3(0.600, 0.395, 0.225);
      vec3 cremaLite = vec3(0.755, 0.545, 0.330);
      vec3 crema = mix(cremaMid, cremaLite, g);
      crema = mix(crema, cremaDeep, smoothstep(0.62, 1.0, r) * 0.75);      // darker towards the wall
      crema = mix(crema, cremaLite, (1.0 - smoothstep(0.0, 0.55, r)) * 0.18);
      crema = mix(crema, cremaDeep * 1.05, ring * 0.55);

      // milk: thin streaks read as latte, thick milk as foam
      vec3 latte = vec3(0.835, 0.690, 0.520);
      vec3 foam = vec3(0.992, 0.968, 0.925);
      float thin = smoothstep(0.06, 0.32, milk);
      float thick = smoothstep(0.34, 0.62, milk);
      vec3 col = mix(crema, latte, thin * 0.75);

      // foam relief lighting (light from upper-left)
      vec3 n = normalize(vec3(-mx * 2.4, -my * 2.4, 1.0));
      float lit = dot(n, normalize(vec3(-0.55, 0.6, 0.75)));
      vec3 foamLit = foam * (0.93 + 0.085 * lit);
      float grain = vnoise(ps * 180.0) * 0.025 - 0.0125;
      foamLit += grain;
      foamLit = mix(foamLit, vec3(0.93, 0.86, 0.76), (1.0 - smoothstep(0.62, 0.9, milk)) * 0.25);
      col = mix(col, foamLit, thick);

      // light: soft window sheen on the glossy crema
      vec2 hl = vec2(-0.38, 0.42) + uTilt * vec2(0.10, -0.08);
      float sheen = exp(-dot((p - hl) * vec2(1.0, 1.55), (p - hl) * vec2(1.0, 1.55)) / 0.075);
      col += vec3(1.0, 0.95, 0.88) * sheen * 0.13 * (1.0 - thick * 0.8);

      // shadow of the rim on the upper-left of the surface, meniscus glint on the lit side
      vec2 L = normalize(vec2(-0.62, 0.78));
      float wallShadow = smoothstep(0.93, 1.05, length(p + L * 0.115));
      col *= 1.0 - wallShadow * 0.30;
      float men = smoothstep(0.955, 0.997, r) * (1.0 - smoothstep(0.997, 1.0, r));
      float lightSide = clamp(dot(normalize(p + 1e-4), -L) * 0.5 + 0.5, 0.0, 1.0);
      col = mix(col, vec3(0.97, 0.90, 0.80), men * (0.15 + 0.45 * lightSide));
      col *= 1.0 - smoothstep(0.975, 1.0, r) * 0.18;

      // steam drifting over the cup
      float st = steam(p, uTime) * uSteam;
      float stMask = 1.0 - smoothstep(0.75, 1.17, r);
      float sA = clamp(st * stMask * 0.24, 0.0, 0.26);
      col = mix(col, vec3(1.0, 0.99, 0.97), sA * inside);

      float outA = sA * (1.0 - inside) * 0.6;
      vec3 premul = col * inside + vec3(1.0) * outA;
      gl_FragColor = vec4(premul, inside + outA);
    }`;

  /* ------------------------------------------------------------ Programs + buffers */
  const progs = {
    clear: program(VS, FS_CLEAR),
    splat: program(VS, FS_SPLAT),
    advect: program(VS, FS_ADVECT),
    divergence: program(VS, FS_DIVERGENCE),
    curl: program(VS, FS_CURL),
    vorticity: program(VS, FS_VORTICITY),
    pressure: program(VS, FS_PRESSURE),
    gradient: program(VS, FS_GRADIENT),
    pattern: program(VS, FS_PATTERN),
    display: program(VS, FS_DISPLAY),
  };
  if (Object.values(progs).some((p) => !p)) { fail(); return; }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.disable(gl.BLEND);

  function blit(target) {
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  function fbo(w, h, filter) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, EXT.fmt.internal, w, h, 0, EXT.fmt.format, EXT.halfType, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo: fb, w, h, tx: 1 / w, ty: 1 / h, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
  }
  function doubleFbo(w, h, filter) {
    let a = fbo(w, h, filter); let b = fbo(w, h, filter);
    return { w, h, tx: a.tx, ty: a.ty, get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; } };
  }

  const LIN = EXT.linear ? gl.LINEAR : gl.NEAREST;
  const velocity = doubleFbo(SIM_RES, SIM_RES, LIN);
  const dye = doubleFbo(DYE_RES, DYE_RES, LIN);
  const pressure = doubleFbo(SIM_RES, SIM_RES, gl.NEAREST);
  const divergence = fbo(SIM_RES, SIM_RES, gl.NEAREST);
  const curlTex = fbo(SIM_RES, SIM_RES, gl.NEAREST);

  /* ------------------------------------------------------------ Sim steps */
  function use(pr, texel) { gl.useProgram(pr.p); if (pr.u.texelSize) gl.uniform2f(pr.u.texelSize, texel[0], texel[1]); return pr.u; }
  const simTexel = [1 / SIM_RES, 1 / SIM_RES];
  const dyeTexel = [1 / DYE_RES, 1 / DYE_RES];

  function splat(target, x, y, c, rx, ry, mode, strength) {
    const u = use(progs.splat, [target.tx, target.ty]);
    gl.uniform1i(u.uTarget, target.read.attach(0));
    gl.uniform3f(u.color, c[0], c[1], c[2]);
    gl.uniform2f(u.point, x, y);
    gl.uniform2f(u.radius, rx, ry);
    gl.uniform1f(u.mode, mode);
    gl.uniform1f(u.strength, strength);
    blit(target.write); target.swap();
  }

  function applyPattern(pattern, prog, rateMilk, rateCrema, seed) {
    const u = use(progs.pattern, dyeTexel);
    gl.uniform1i(u.uDye, dye.read.attach(0));
    gl.uniform1f(u.uPattern, pattern);
    gl.uniform1f(u.uProg, prog);
    gl.uniform2f(u.uRate, rateMilk, rateCrema);
    gl.uniform1f(u.uSeed, seed);
    blit(dye.write); dye.swap();
  }

  function step(dt, cfg) {
    let u;
    // vorticity confinement
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
    // projection
    u = use(progs.divergence, simTexel);
    gl.uniform1i(u.uVelocity, velocity.read.attach(0));
    blit(divergence);

    u = use(progs.clear, simTexel);
    gl.uniform1i(u.uTexture, pressure.read.attach(0));
    gl.uniform1f(u.value, 0.8);
    blit(pressure.write); pressure.swap();

    u = use(progs.pressure, simTexel);
    gl.uniform1i(u.uDivergence, divergence.attach(0));
    for (let i = 0; i < 22; i++) {
      gl.uniform1i(u.uPressure, pressure.read.attach(1));
      blit(pressure.write); pressure.swap();
    }

    u = use(progs.gradient, simTexel);
    gl.uniform1i(u.uPressure, pressure.read.attach(0));
    gl.uniform1i(u.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();

    // advect velocity
    u = use(progs.advect, simTexel);
    gl.uniform2f(u.dyeTexelSize, simTexel[0], simTexel[1]);
    gl.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(u.uSource, velocity.read.attach(0));
    gl.uniform1f(u.dt, dt);
    const vd = Math.exp(-cfg.velDecay * dt);
    gl.uniform4f(u.decay, vd, vd, 1, 1);
    gl.uniform1f(u.maskOut, 1);
    blit(velocity.write); velocity.swap();

    // advect dye (milk barely fades; crema shade never fades)
    u = use(progs.advect, simTexel);
    gl.uniform2f(u.dyeTexelSize, dyeTexel[0], dyeTexel[1]);
    gl.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(u.uSource, dye.read.attach(1));
    gl.uniform1f(u.dt, dt);
    gl.uniform4f(u.decay, Math.exp(-0.004 * dt), 1, 1, 1);
    gl.uniform1f(u.maskOut, 0);
    blit(dye.write); dye.swap();
  }

  /* ------------------------------------------------------------ Canvas sizing */
  let pxUnit = 0.004;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    pxUnit = (2 * K) / w;
    needsDraw = true;
  }

  /* ------------------------------------------------------------ Display */
  const look = { tiltX: 0, tiltY: 0, sway: 0, steam: REDUCED ? 0.85 : 1 };
  function draw(time) {
    const u = use(progs.display, dyeTexel);
    gl.uniform1i(u.uDye, dye.read.attach(0));
    gl.uniform2f(u.dyeTexel, dyeTexel[0], dyeTexel[1]);
    gl.uniform1f(u.uK, K);
    gl.uniform1f(u.uTime, time);
    gl.uniform2f(u.uTilt, look.tiltX, look.tiltY);
    gl.uniform1f(u.uSway, look.sway);
    gl.uniform1f(u.uSteam, look.steam);
    gl.uniform1f(u.uPx, pxUnit);
    gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    blit(null);
  }

  /* ------------------------------------------------------------ Choreography */
  // phases: 'idle' (nothing poured yet), 'pour', 'rest', 'settle'
  const PATTERNS = { rosetta: 1, heart: 2, tulip: 3 };
  const POUR = {
    rosetta: { grow: 2.4, pullAt: 2.52, pullFrom: 0.46, pullTo: -0.84, pull: 0.55, drag: 0.36, line: 0.18 },
    heart:   { grow: 1.7, pullAt: 1.20, pullFrom: 0.62, pullTo: -0.76, pull: 0.55, drag: 0.7, line: 0.22 },
    tulip:   { grow: 2.0, pullAt: 2.12, pullFrom: 0.50, pullTo: -0.78, pull: 0.55, drag: 0.8, line: 0.25 },
  };
  const ORDER_AFTER_STIR = ['heart', 'tulip', 'rosetta'];
  let reformIndex = 0;
  const S = {
    phase: 'idle', t: 0, pattern: 'rosetta', seed: Math.random() * 10 + 1,
    lastInput: -1e9, stirred: false, energy: 0, cycleAt: 0,
  };
  let simClock = 0;

  function startPour(name) {
    S.phase = 'pour'; S.t = 0; S.pattern = name; S.pullDone = false; S.pullPrev = null;
  }
  function startSettle(next) {
    S.phase = 'settle'; S.t = 0; S.next = next; S.seed = Math.random() * 10 + 1;
  }

  // initial crema
  applyPattern(0, 0, 0, 1, S.seed);

  function choreograph(dt) {
    const cfg = { curl: 7, velDecay: 1.5 };
    if (S.phase === 'pour') {
      const P = POUR[S.pattern];
      S.t += dt;
      const growT = S.t / P.grow;
      if (growT <= 1.08) {
        applyPattern(PATTERNS[S.pattern], Math.min(1, growT), damp(14, dt), 0, S.seed);
      }
      cfg.curl = 0; cfg.velDecay = S.t > P.pullAt + P.pull * 0.8 ? 6 : 3.2;
      // pull-through: a narrow, fast drag through the middle — the physics makes the points
      const pt = (S.t - P.pullAt) / P.pull;
      if (pt >= 0 && pt <= 1) {
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        const y = P.pullFrom + (P.pullTo - P.pullFrom) * e;
        const speed = Math.abs(P.pullTo - P.pullFrom) / P.pull * 0.5;       // uv per second
        const ux = 0.5;
        const uy = 0.5 + y * 0.5;
        const fade = Math.sin(Math.PI * Math.min(1, pt * 1.15));            // ease the drag in and out
        splat(velocity, ux, uy, [0, -speed * P.drag, 0], 0.00012, 0.0007, 1, 0.65 * fade);
        // thin milk line laid by the stream
        if (S.pullPrev !== null && P.line > 0) {
          const steps = 3;
          for (let i = 1; i <= steps; i++) {
            const yy = S.pullPrev + (uy - S.pullPrev) * (i / steps);
            splat(dye, ux, yy, [P.line, 0, 0], 0.000012, 0.00004, 0, 1);
          }
        }
        S.pullPrev = uy;
        S.energy = 3;
      }
      if (pt > 1.6 && growT > 1.08) { S.phase = 'rest'; S.t = 0; S.cycleAt = simClock; }
    } else if (S.phase === 'settle') {
      S.t += dt;
      applyPattern(0, 0, damp(2.6, dt), damp(1.8, dt), S.seed);
      cfg.velDecay = 2.5;
      if (S.t > 1.5) startPour(S.next);
    } else if (S.phase === 'rest') {
      if (S.stirred && simClock - S.lastInput > 8) {
        S.stirred = false;
        startSettle(ORDER_AFTER_STIR[reformIndex++ % ORDER_AFTER_STIR.length]);
      } else if (!FINE && !S.stirred && simClock - S.cycleAt > 13) {
        // touch devices: an ambient re-pour every so often keeps the cup alive
        startSettle(ORDER_AFTER_STIR[reformIndex++ % ORDER_AFTER_STIR.length]);
      }
    }
    return cfg;
  }

  /* ------------------------------------------------------------ Pointer */
  const ptr = { x: 0, y: 0, has: false, overCup: false, down: false, moved: [], lastU: null };
  let cupRect = null;         // read once per frame, before any writes
  let heroRect = null;

  function toCoffee(cx, cy) {
    if (!cupRect) return null;
    const ccx = cupRect.left + cupRect.width / 2;
    const ccy = cupRect.top + cupRect.height / 2;
    const rPx = (cupRect.width / 2) / K;
    const px = (cx - ccx) / rPx;
    const py = -(cy - ccy) / rPx;
    // undo the sway so stirring lands where the cursor is
    const c = Math.cos(look.sway), s = Math.sin(look.sway);
    return { x: c * px - s * py, y: s * px + c * py, r: Math.hypot(px, py) };
  }

  function onMove(e) {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true;
    if (e.pointerType === 'mouse' || e.pointerType === 'pen' || ptr.down) {
      ptr.moved.push([e.clientX, e.clientY]);
      if (ptr.moved.length > 24) ptr.moved.shift();
    }
    wake();
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerdown', (e) => {
    ptr.down = true; ptr.lastU = null; ptr.moved.length = 0;
    ptr.moved.push([e.clientX, e.clientY]);
    if (e.pointerType !== 'mouse') ptr.tap = { x: e.clientX, y: e.clientY };
    wake();
  });
  const up = () => { ptr.down = false; ptr.lastU = null; };
  window.addEventListener('pointerup', up, { passive: true });
  window.addEventListener('pointercancel', up, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { ptr.has = false; ptr.overCup = false; ptr.lastU = null; });

  function processPointer(dt) {
    const pts = ptr.moved.splice(0);
    let stirred = false;
    for (const [cx, cy] of pts) {
      const c = toCoffee(cx, cy);
      if (!c) continue;
      if (c.r > 1.02) { ptr.lastU = null; continue; }
      const u = { x: 0.5 + c.x * 0.5, y: 0.5 + c.y * 0.5 };
      if (ptr.lastU) {
        const dx = u.x - ptr.lastU.x, dy = u.y - ptr.lastU.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.0005) {
          const n = Math.min(8, Math.ceil(dist / 0.012));
          const gain = FINE ? 0.55 : 0.85;
          const vx = clamp(dx / Math.max(dt, 1 / 120) * gain, -2.6, 2.6);
          const vy = clamp(dy / Math.max(dt, 1 / 120) * gain, -2.6, 2.6);
          for (let i = 1; i <= n; i++) {
            const t = i / n;
            splat(velocity, ptr.lastU.x + dx * t, ptr.lastU.y + dy * t, [vx, vy, 0], 0.0011, 0.0011, 1, 0.55);
          }
          stirred = true;
        }
      }
      ptr.lastU = u;
    }
    if (ptr.tap) {
      const c = toCoffee(ptr.tap.x, ptr.tap.y);
      if (c && c.r < 1) {
        // a little swirl where the finger lands
        const ux = 0.5 + c.x * 0.5, uy = 0.5 + c.y * 0.5;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          splat(velocity, ux + Math.cos(a) * 0.05, uy + Math.sin(a) * 0.05, [-Math.sin(a) * 1.5, Math.cos(a) * 1.5, 0], 0.0008, 0.0008, 1, 0.8);
        }
        stirred = true;
      }
      ptr.tap = null;
    }
    if (stirred) {
      if (S.phase === 'pour' || S.phase === 'settle') { S.phase = 'rest'; }
      S.stirred = true; S.lastInput = simClock; S.energy = 4;
      if (hint && !hint.classList.contains('is-done')) hint.classList.add('is-done');
    }
  }

  /* ------------------------------------------------------------ Tilt + layers + cursor ring */
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let ringX = 0, ringY = 0, ringOn = false;
  function updateTilt(dt, time) {
    if (REDUCED) return;
    if (ptr.has && FINE && heroRect && ptr.y < heroRect.bottom) {
      const cx = cupRect ? cupRect.left + cupRect.width / 2 : innerWidth * 0.7;
      const cy = cupRect ? cupRect.top + cupRect.height / 2 : innerHeight * 0.5;
      tilt.tx = clamp((ptr.x - cx) / (innerWidth * 0.45), -1, 1);
      tilt.ty = clamp((ptr.y - cy) / (innerHeight * 0.5), -1, 1);
    } else if (!FINE && ptr.down) {
      const c = toCoffee(ptr.x, ptr.y);
      if (c) { tilt.tx = clamp(c.x * 0.6, -1, 1); tilt.ty = clamp(-c.y * 0.6, -1, 1); }
    } else {
      // ambient drift so the cup breathes when nobody is pointing at it
      tilt.tx = Math.sin(time * 0.23) * 0.22;
      tilt.ty = Math.cos(time * 0.17) * 0.16;
    }
    const k = damp(4.5, dt);
    tilt.x += (tilt.tx - tilt.x) * k;
    tilt.y += (tilt.ty - tilt.y) * k;
    const ry = (tilt.x * 6).toFixed(3), rx = (-tilt.y * 6).toFixed(3);
    tiltEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    const s = stage.clientWidth / 600;        // px per "unit" of parallax at this size
    layerCup.style.transform = `translate3d(${(tilt.x * 5 * s).toFixed(2)}px, ${(tilt.y * 5 * s).toFixed(2)}px, 0)`;
    layerCupShadow.style.transform = `translate3d(${(-tilt.x * 3 * s).toFixed(2)}px, ${(-tilt.y * 3 * s).toFixed(2)}px, 0)`;
    layerTable.style.transform = `translate3d(${(-tilt.x * 6 * s).toFixed(2)}px, ${(-tilt.y * 6 * s).toFixed(2)}px, 0)`;
    look.tiltX = tilt.x; look.tiltY = tilt.y;
    look.sway = Math.sin(time * 0.31) * 0.035 + tilt.x * 0.05;

    if (FINE && ring) {
      const c = ptr.has ? toCoffee(ptr.x, ptr.y) : null;
      const over = !!(c && c.r < 1.04);
      if (over !== ringOn) { ringOn = over; ring.classList.toggle('is-on', over); canvas.classList.toggle('is-over', over); }
      if (over) {
        ringX = ptr.x; ringY = ptr.y;
        ring.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`;
      }
    }
  }

  /* ------------------------------------------------------------ Loop control */
  let running = false; let visible = true; let inView = true; let needsDraw = true;
  let last = 0; let rafId = 0; let started = false;
  const t0 = performance.now();

  function frame(now) {
    rafId = 0;
    if (!running) return;
    const dt = Math.min((now - last) / 1000 || 1 / 60, 1 / 30);
    last = now;
    const time = (now - t0) / 1000;

    // reads first (no writes have happened yet this frame)
    cupRect = canvas.getBoundingClientRect();
    heroRect = hero.getBoundingClientRect();

    simClock += dt;
    if (started) processPointer(dt);
    const cfg = started ? choreograph(dt) : { curl: 0, velDecay: 2 };
    if (S.energy > 0 || S.phase === 'pour' || S.phase === 'settle') {
      step(dt, cfg);
      S.energy -= dt;
    }
    updateTilt(dt, time);
    draw(time);
    rafId = requestAnimationFrame(frame);
  }

  function wake() { if (!running && visible && inView && !REDUCED) start(); }
  function start() {
    if (running || REDUCED) return;
    running = true; last = performance.now();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && inView) start(); else stop();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView && visible) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); fail(); });

  let resizeQueued = false;
  window.addEventListener('resize', () => {
    if (resizeQueued) return; resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; resize(); if (REDUCED) draw(4.0); });
  });

  function fail() {
    root.classList.remove('has-gl');
    root.classList.add('no-gl');
  }

  resize();

  if (REDUCED) {
    // pour the whole rosetta off-screen, then paint one still frame
    startPour('rosetta');
    const dt = 1 / 60;
    for (let i = 0; i < 300 && S.phase === 'pour'; i++) { simClock += dt; const cfg = choreograph(dt); step(dt, cfg); }
    for (let i = 0; i < 40; i++) step(dt, { curl: 0, velDecay: 4 });
    S.phase = 'rest';
    draw(4.0);
  } else {
    draw(0);
    start();
    // begin the pour once the cup has settled in
    setTimeout(() => { started = true; startPour('rosetta'); wake(); }, 650);
  }

  // tiny hook for automated checks
  window.__latte = {
    pour: (name) => { started = true; startSettle(name || 'heart'); wake(); },
    state: () => ({ phase: S.phase, pattern: S.pattern, running, gl2: EXT.isGL2, linear: EXT.linear }),
  };
})();
