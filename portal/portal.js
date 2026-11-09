/* ==========================================================================
   White Rewards — customer portal (mockup)
   Runs entirely on window.WCH (assets/js/store.js). No business rules here:
   earning, tiers, stamps, rewards and codes all come from the store.
   Views are hash-routed: #signin #join #card #rewards #activity #profile
   and #code/W-XXXX for a redeemed reward.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.WCH;
  if (!W) return;
  var F = W.fmt;
  var esc = F.esc;

  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopMQ = window.matchMedia('(min-width: 900px)');
  var hoverMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  function reduced() { return reducedMQ.matches; }

  var MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var AUTH_VIEWS = { signin: 1, join: 1 };
  var APP_VIEWS = { card: 1, rewards: 1, activity: 1, profile: 1, code: 1 };

  /* ------------------------------------------------------------------ */
  /* Icons (24px grid, 1.6 stroke — styled by .ic in CSS)                */
  /* ------------------------------------------------------------------ */
  var IC = {
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 14.5h4"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M12 8.5v12M12 8.5C10.5 5 6.5 4.5 6.5 7c0 1.5 2.5 1.5 5.5 1.5Zm0 0C13.5 5 17.5 4.5 17.5 7c0 1.5-2.5 1.5-5.5 1.5Z"/>',
    cup: '<path d="M4.5 9.5h11.5v3.75a5 5 0 0 1-5 5H9.5a5 5 0 0 1-5-5V9.5Z"/><path d="M16 10.75h1.4a2.35 2.35 0 0 1 0 4.7H15.6"/><path d="M3.5 21h14"/><path d="M8 3.25c-.7.9.7 1.85 0 2.75M11.75 3.25c-.7.9.7 1.85 0 2.75"/>',
    food: '<path d="M6.5 3v6.25a2 2 0 0 0 2 2V21M10.5 3v6.25a2 2 0 0 1-2 2M8.5 3v5"/><path d="M17.5 21V3c-2.2 1.4-3.25 4-3.25 7.25v3.25h3.25"/>',
    iced: '<path d="M6.25 8h11.5l-1.3 11.4a1.75 1.75 0 0 1-1.74 1.55H9.29a1.75 1.75 0 0 1-1.74-1.55L6.25 8Z"/><path d="M12.75 8l1.6-5h2.9"/><path d="M7 12.6c1.65-.85 3.35-.85 5 0s3.35.85 5 0"/>',
    cookie: '<circle cx="12" cy="12" r="8.5"/><path d="M9.2 9.1h.01M14.6 8.6h.01M15.4 13.9h.01M9.9 15.2h.01M12.3 12h.01" stroke-width="2.4"/>',
    bean: '<g transform="rotate(40 12 12)"><ellipse cx="12" cy="12" rx="6.6" ry="8.6"/><path d="M12 6c-1.8 1.9-1.8 4 0 6s1.8 4.1 0 6"/></g>',
    sparkle: '<path d="M11 3.5l1.7 4.8 4.8 1.7-4.8 1.7L11 16.5l-1.7-4.8L4.5 10l4.8-1.7L11 3.5Z"/><path d="M18 14.5v5M15.5 17h5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8.25 12.25l2.5 2.5 5-5"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevron: '<path d="M9.5 6l6 6-6 6"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h1.5M20 14v1.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    logout: '<path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 16l-4-4 4-4M6 12h9.5"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    history: '<path d="M3.75 12a8.25 8.25 0 1 0 2.4-5.83"/><path d="M4 3.75v3.5h3.5"/><path d="M12 7.75V12l2.75 1.75"/>',
    receipt: '<path d="M6 3.5h12v17l-2.4-1.5-1.9 1.5-1.7-1.3-1.7 1.3-1.9-1.5L6 20.5v-17Z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    returnArrow: '<path d="M9 14 4.5 9.5 9 5"/><path d="M4.5 9.5h10a5 5 0 0 1 0 10H11"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    userPlus: '<circle cx="10" cy="8.5" r="3.75"/><path d="M3 20c.9-3.6 3.6-5.5 7-5.5 1.6 0 3 .4 4.2 1.2M18 14v6M15 17h6"/>',
    user: '<circle cx="12" cy="8.5" r="3.75"/><path d="M4.75 20c.9-3.6 3.8-5.5 7.25-5.5s6.35 1.9 7.25 5.5"/>',
    users: '<circle cx="9" cy="8.5" r="3.25"/><path d="M3 19.5c.75-3 3.1-4.75 6-4.75s5.25 1.75 6 4.75"/><path d="M15.5 5.6a3.25 3.25 0 0 1 0 6M17.5 14.9c1.8.6 3 2.2 3.5 4.6"/>',
    cake: '<path d="M4.5 20.5h15M5.5 20.5v-6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6"/><path d="M5.5 16.25c1.45.95 2.9.95 4.3 0s2.9-.95 4.3 0 2.85.95 4.4 0"/><path d="M12 12.5V9.25"/><path d="M12 7c-.85-.8-.85-1.75 0-3.25.85 1.5.85 2.45 0 3.25Z"/>',
    layers: '<path d="M12 4 3.5 8.5 12 13l8.5-4.5L12 4Z"/><path d="M3.5 12.5 12 17l8.5-4.5M3.5 16.25 12 20.75l8.5-4.5"/>',
    stamp: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 10.5h7v2.25a3.5 3.5 0 0 1-7 0V10.5ZM15.5 11.25h.75a1.25 1.25 0 0 1 0 2.5h-.9"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.25M12 7.9v.1"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.25M12 15.9v.1"/>',
    phone: '<path d="M7.5 3.5h9a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="M10.5 17.75h3"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10" r="2.25"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (IC[name] || '') + '</svg>';
  }

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || 'there'; }
  function plural(n, one, many) { return F.num(n) + ' ' + (n === 1 ? one : (many || one + 's')); }
  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function digitsOf(s) { return String(s || '').replace(/\D/g, ''); }
  /** "7712408" -> "771 2408" (Maldives numbers are 7 digits). */
  function prettyLocal(d) { d = digitsOf(d).slice(0, 7); return d.length > 3 ? d.slice(0, 3) + ' ' + d.slice(3) : d; }
  function localPart(phone) { var d = digitsOf(phone); if (d.length > 7 && d.indexOf('960') === 0) d = d.slice(3); return d.slice(-7); }
  function fullPhone(local) { return '+960 ' + prettyLocal(local); }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function greeting() {
    var h = W.maleParts().h;
    return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
  function tierClass(m) { return 'tier-' + W.tier(m).id; }
  /** A picture for a reward, read from its name (rewards carry only kind: drink|food). */
  function rewardIcon(r) {
    var n = String(r.name || '');
    if (/friend|two drinks/i.test(n)) return 'users';
    if (/iced|cold/i.test(n)) return 'iced';
    if (/cake|cheesecake/i.test(n)) return 'cake';
    if (/croissant|cookie|pastry|roll/i.test(n)) return 'cookie';
    return r.kind === 'food' ? 'food' : 'cup';
  }
  /* Keep keyboard focus across re-renders: describe the focused control by a
     stable selector, then find its replacement after the HTML is rebuilt. */
  function focusKey(el) {
    if (!el || el === document.body || !el.getAttribute) return null;
    if (el.id) return '#' + CSS.escape(el.id);
    // Scope to the region it lives in, so e.g. a #rewards link in the view never resolves to the top tab.
    var host = el.closest('#view, #side, #topbar, #tabbar');
    var scope = host ? '#' + host.id + ' ' : '';
    var act = el.getAttribute('data-act');
    if (act) {
      var sel = '[data-act="' + CSS.escape(act) + '"]';
      ['data-id', 'data-f', 'data-code'].forEach(function (a) { var v = el.getAttribute(a); if (v != null) sel += '[' + a + '="' + CSS.escape(v) + '"]'; });
      return scope + sel;
    }
    var href = el.getAttribute('href');
    if (href) return scope + '[href="' + CSS.escape(href) + '"]';
    return null;
  }
  function restoreFocus(key) {
    if (!key) return;
    var n = document.querySelector(key);
    if (n) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }
  }
  function isDrink(item) { return item.cat !== 'food' && item.cat !== 'sweets'; }
  function readyCodes(m) {
    var now = Date.now();
    return W.redemptions('ready').filter(function (r) { return r.memberId === m.id && r.expires > now; });
  }
  function qrSvg(text) {
    try {
      var q = window.qrcode(0, 'M'); q.addData(String(text)); q.make();
      return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: 'QR code ' + text });
    } catch (e) { return ''; }
  }

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var S = {
    view: null,
    arg: '',
    memberId: undefined,
    seededAt: W.doc.seededAt,
    seen: {},
    tierId: null,
    flipped: false,
    shownBeans: null,
    shownStamps: null,
    signin: { step: 'phone', local: '', error: '', notFound: false, busy: false },
    joinPrefill: '',
    filter: 'all',
    activityLimit: 40,
    profileDirty: false,
    codeStatus: {},
    welcome: false
  };

  /* ------------------------------------------------------------------ */
  /* Membership card                                                     */
  /* ------------------------------------------------------------------ */
  /** Card markup. opts.sample renders a placeholder card (sign-in page). */
  function cardHTML(m, opts) {
    opts = opts || {};
    var tier = m ? W.tier(m) : W.program.tiers[0];
    var name = m ? m.name : 'Your name';
    var id = m ? m.id : 'WCH-000000';
    var beans = m ? m.beans : W.program.welcomeBonus;
    var tag = opts.interactive ? 'button' : 'span';
    var attrs = opts.interactive ? ' type="button" data-act="flip" aria-pressed="false"' : ' aria-hidden="true"';
    return '' +
      '<' + tag + ' class="mcard tier-' + tier.id + (opts.interactive ? ' is-live' : '') + '"' + attrs + '>' +
        '<span class="mcard__tilt">' +
          '<span class="mcard__flip">' +
            '<span class="mcard__face mcard__front">' +
              '<span class="mcard__wm" aria-hidden="true"></span>' +
              '<span class="mcard__sheen" aria-hidden="true"></span>' +
              '<span class="mcard__glint" aria-hidden="true"></span>' +
              '<span class="mcard__top">' +
                '<img class="mcard__logo" src="../assets/img/logo-mark.svg" alt="" width="44" height="44">' +
                '<span class="mcard__brand"><span class="mcard__word">White Coffee House</span><span class="mcard__prog">White Rewards</span></span>' +
                '<span class="mcard__tier" data-f="tier">' + esc(tier.name) + '</span>' +
              '</span>' +
              '<span class="mcard__bal">' +
                '<span class="mcard__beans num" data-f="beans">' + F.num(beans) + '</span>' +
                '<span class="mcard__unit">beans</span>' +
              '</span>' +
              '<span class="mcard__foot">' +
                '<span class="mcard__name" data-f="name">' + esc(name) + '</span>' +
                '<span class="mcard__id num" data-f="id">' + esc(id) + '</span>' +
              '</span>' +
            '</span>' +
            (opts.interactive ?
            '<span class="mcard__face mcard__back">' +
              '<span class="mcard__qr" data-f="qr"></span>' +
              '<span class="mcard__backtext">' +
                '<span class="mcard__show">Show this at the counter</span>' +
                '<span class="mcard__backid num" data-f="backid">' + esc(id) + '</span>' +
              '</span>' +
            '</span>' : '') +
          '</span>' +
        '</span>' +
      '</' + tag + '>';
  }

  function cardLabel(m) {
    return 'Membership card: ' + m.name + ', ' + W.tier(m).name + ' member, ' + F.num(m.beans) + ' beans, member ID ' + m.id + '. ' +
      (S.flipped ? 'Showing QR code. Press to show the card front.' : 'Press to show your QR code.');
  }

  function buildSideCard(m) {
    var host = $('#side-card');
    if (!host) return;
    host.innerHTML = cardHTML(m, { interactive: true });
    var qr = $('[data-f="qr"]', host);
    qr.innerHTML = qrSvg(m.id);
    S.shownBeans = m.beans;
    setFlip(S.flipped, true);
    bindTilt(host);
  }

  function updateSideCard(m) {
    var card = $('#side-card .mcard');
    if (!card) return;
    var tierId = W.tier(m).id;
    W.program.tiers.forEach(function (t) { card.classList.toggle('tier-' + t.id, t.id === tierId); });
    $('[data-f="tier"]', card).textContent = W.tier(m).name;
    $('[data-f="name"]', card).textContent = m.name;
    var beansEl = $('[data-f="beans"]', card);
    if (S.shownBeans !== m.beans) {
      var from = S.shownBeans == null ? m.beans : S.shownBeans;
      countTo(beansEl, from, m.beans);
      if (m.beans > from) glint(card);
      S.shownBeans = m.beans;
    }
    card.setAttribute('aria-label', cardLabel(m));
  }

  function setFlip(on, instant) {
    S.flipped = !!on;
    var card = $('#side-card .mcard');
    if (!card) return;
    if (instant) card.classList.add('no-anim');
    card.classList.toggle('is-flipped', S.flipped);
    card.setAttribute('aria-pressed', S.flipped ? 'true' : 'false');
    var m = W.currentMember();
    if (m) card.setAttribute('aria-label', cardLabel(m));
    var hint = $('#card-hint');
    if (hint) hint.innerHTML = S.flipped ? icon('card') + '<span>Show card front</span>' : icon('qr') + '<span>Show QR code</span>';
    if (instant) { void card.offsetWidth; card.classList.remove('no-anim'); }
  }

  function glint(card) {
    if (reduced()) return;
    card.classList.remove('is-glint'); void card.offsetWidth; card.classList.add('is-glint');
    setTimeout(function () { card.classList.remove('is-glint'); }, 1400);
  }

  function countTo(el, from, to) {
    if (!el) return;
    if (reduced() || from === to) { el.textContent = F.num(to); return; }
    var start = performance.now(), dur = 900;
    el._tween = (el._tween || 0) + 1;
    var token = el._tween;
    function step(now) {
      if (token !== el._tween) return;
      var t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
      el.textContent = F.num(Math.round(from + (to - from) * e));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Tilt + foil sheen. The tilt lives on .mcard__tilt, the flip on .mcard__flip
     (two wrappers, so the two transforms never fight). */
  function bindTilt(host) {
    var card = $('.mcard', host);
    if (!card) return;
    var tiltEl = $('.mcard__tilt', card);
    var cur = { x: 0, y: 0 }, target = { x: 0, y: 0 }, raf = 0, dragging = false, downAt = null;
    card._moved = false;

    function apply() {
      tiltEl.style.setProperty('--rx', (-cur.y * 12).toFixed(2) + 'deg');
      tiltEl.style.setProperty('--ry', (cur.x * 16).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (50 + cur.x * 90).toFixed(1) + '%');
      card.style.setProperty('--my', (50 + cur.y * 90).toFixed(1) + '%');
    }
    function step() {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;
      apply();
      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) raf = requestAnimationFrame(step);
      else { cur.x = target.x; cur.y = target.y; apply(); raf = 0; }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(step); }
    function fromEvent(e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      target.x = Math.max(-0.5, Math.min(0.5, px - 0.5));
      target.y = Math.max(-0.5, Math.min(0.5, py - 0.5));
      kick();
    }
    card.addEventListener('pointermove', function (e) {
      if (reduced()) return;
      if (e.pointerType === 'mouse' || dragging) {
        if (dragging && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) card._moved = true;
        fromEvent(e);
      }
    });
    card.addEventListener('pointerdown', function (e) {
      card._moved = false;
      if (e.pointerType !== 'mouse') { dragging = true; downAt = { x: e.clientX, y: e.clientY }; if (!reduced()) fromEvent(e); }
    });
    function release() { dragging = false; downAt = null; target.x = 0; target.y = 0; kick(); }
    card.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') release(); });
    card.addEventListener('pointercancel', release);
    card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') release(); });
    card._tilt = function (x, y) { if (dragging || reduced()) return; target.x = x; target.y = y; kick(); };
  }

  /* Gentle gyro tilt where the browser gives it without a permission prompt (Android). */
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
    var baseBeta = null;
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null || hoverMQ.matches) return;
      var card = $('#side-card .mcard');
      if (!card || !card._tilt || card.offsetParent === null) return;
      if (baseBeta == null) baseBeta = e.beta;
      card._tilt(Math.max(-0.5, Math.min(0.5, e.gamma / 50)), Math.max(-0.5, Math.min(0.5, (e.beta - baseBeta) / 50)));
    });
  }

  /* ------------------------------------------------------------------ */
  /* Side column (greeting, waiting reward, card)                        */
  /* ------------------------------------------------------------------ */
  function renderSide(m, fresh) {
    var side = $('#side');
    if (!m) { side.innerHTML = ''; return; }
    if (fresh || !$('#side-card', side)) {
      side.innerHTML =
        '<div class="side__head" id="side-head"></div>' +
        '<div id="side-wait"></div>' +
        '<div class="side__card" id="side-card"></div>' +
        '<div class="side__under">' +
          '<button class="card-hint" id="card-hint" type="button" data-act="flip"></button>' +
          '<span class="side__hinttext">Staff scan it to add your beans</span>' +
        '</div>' +
        '<div id="side-next"></div>';
      buildSideCard(m);
    }
    var status = W.openStatus();
    var heading = S.view === 'card' ? 'h1' : 'p';
    $('#side-head').innerHTML =
      '<' + heading + ' class="greet"' + (heading === 'h1' ? ' tabindex="-1" data-focus' : '') + '>' + esc(greeting()) + ', ' + esc(firstName(m.name)) + '</' + heading + '>' +
      '<p class="open-status ' + (status.open ? 'is-open' : 'is-closed') + '"><span class="open-status__dot" aria-hidden="true"></span>' +
        esc(status.label) + (status.detail ? ' · ' + esc(status.detail) : '') + '</p>';
    var ready = readyCodes(m).filter(function (r) { return !(S.view === 'code' && r.code === S.arg); });
    $('#side-wait').innerHTML = ready.map(function (r) {
      return '<a class="waiting" href="#code/' + encodeURIComponent(r.code) + '">' +
        '<span class="waiting__ic">' + icon('gift') + '</span>' +
        '<span class="waiting__main"><span class="waiting__title">You have a reward waiting</span>' +
        '<span class="waiting__sub">' + esc(r.rewardName) + ' · <span class="nowrap"><span class="num" data-until="' + r.expires + '">' + mmss(r.expires - Date.now()) + '</span> left</span></span></span>' +
        icon('chevron', 'waiting__chev') + '</a>';
    }).join('');
    $('#side-next').innerHTML = nextRewardHTML(m);
    updateSideCard(m);
  }

  /** "What can I get?" summary under the card. */
  function nextRewardHTML(m) {
    var list = W.rewards();
    if (!list.length) return '';
    var can = list.filter(function (r) { return r.cost <= m.beans; });
    var next = list.filter(function (r) { return r.cost > m.beans; })[0];
    var html = '<a class="nextup" href="#rewards">';
    html += '<span class="nextup__top"><span class="nextup__title">' +
      (can.length ? (can.length === list.length ? 'You can get any reward' : plural(can.length, 'reward') + ' you can get now') : 'Your next reward') +
      '</span>' + icon('chevron', 'nextup__chev') + '</span>';
    if (next) {
      var pct = Math.max(3, Math.min(100, m.beans / next.cost * 100));
      html += '<span class="nextup__goal"><span class="nextup__name">' + (can.length ? 'Next: ' : '') + esc(next.name) + '</span>' +
        '<span class="nextup__need num">' + F.num(next.cost - m.beans) + ' to go</span></span>' +
        '<span class="meter meter--sm" aria-hidden="true"><span class="meter__fill" style="--pct:' + pct.toFixed(1) + '%"></span></span>';
    } else {
      html += '<span class="nextup__goal"><span class="nextup__name">Treat yourself — every reward is within reach.</span></span>';
    }
    return html + '</a>';
  }

  /* ------------------------------------------------------------------ */
  /* Views                                                               */
  /* ------------------------------------------------------------------ */
  var VIEWS = {};

  /* ---------- Sign in ---------- */
  VIEWS.signin = function () {
    var st = S.signin, p = W.program;
    var panel;
    if (st.step === 'code') {
      panel =
        '<form class="auth-form" data-form="code" novalidate>' +
          '<button class="link-back" type="button" data-act="change-number">' + icon('arrowLeft') + 'Change number</button>' +
          '<h2 class="panel-title">Enter your code</h2>' +
          '<p class="panel-sub">We sent a 4-digit code to <strong class="num">' + esc(fullPhone(st.local)) + '</strong>.</p>' +
          '<div class="otp" role="group" aria-label="4-digit code" aria-describedby="otp-err">' +
            [0, 1, 2, 3].map(function (i) {
              return '<input class="otp__box num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" ' +
                (i === 0 ? 'autocomplete="one-time-code" ' : 'autocomplete="off" ') +
                'aria-label="Digit ' + (i + 1) + ' of 4" data-otp="' + i + '">';
            }).join('') +
          '</div>' +
          '<p class="field-error" id="otp-err" role="alert">' + (st.error ? icon('alert') + esc(st.error) : '') + '</p>' +
          '<button class="btn btn--block" type="submit"' + (st.busy ? ' disabled' : '') + '>' + (st.busy ? '<span class="spinner" aria-hidden="true"></span>Checking…' : 'Verify and sign in') + '</button>' +
          '<p class="auth-row">Didn’t get it? <button class="link-btn" type="button" data-act="resend">Send a new code</button></p>' +
        '</form>';
    } else {
      panel =
        '<form class="auth-form" data-form="phone" novalidate>' +
          '<h2 class="panel-title">Sign in</h2>' +
          '<p class="panel-sub">Use the phone number on your White Rewards card. We’ll text you a 4-digit code.</p>' +
          '<div class="field">' +
            '<label for="si-phone">Phone number</label>' +
            '<div class="phone-input">' +
              '<span class="phone-input__cc" aria-hidden="true">+960</span>' +
              '<input class="input num" id="si-phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="771 2408" maxlength="8" value="' + esc(prettyLocal(st.local)) + '" aria-describedby="si-phone-err">' +
            '</div>' +
            '<p class="field-error" id="si-phone-err" role="alert">' + (st.error ? icon('alert') + esc(st.error) : '') + '</p>' +
            (st.notFound ? '<a class="btn btn--ghost btn--sm notfound-join" href="#join" data-act="join-with-number">Join free with this number</a>' : '') +
          '</div>' +
          '<button class="btn btn--block" type="submit">Send code</button>' +
        '</form>';
    }
    return '' +
      '<div class="auth">' +
        '<div class="auth__head">' +
          '<h1 class="auth__title display" tabindex="-1" data-focus>White Rewards</h1>' +
          '<p class="auth__lede">Earn beans on every visit to White Coffee House. Every ' + ordinal(p.stampsForFree) + ' drink is on us.</p>' +
        '</div>' +
        '<div class="auth__show">' +
          '<div class="auth__preview" aria-hidden="true">' + cardHTML(null, {}) + '</div>' +
          perksListHTML() +
        '</div>' +
        '<div class="auth__panel">' +
          panel +
          '<div class="or" aria-hidden="true"><span>or</span></div>' +
          '<button class="btn btn--demo btn--block" type="button" data-act="demo">' + icon('sparkle') + 'Explore with a demo account</button>' +
          '<p class="auth-row">New here? <a class="link" href="#join">Join free</a></p>' +
          '<p class="demo-note auth-demo">' + icon('info') + '<span>This is a demo — any code works. Try <button class="link-btn num" type="button" data-act="fill-demo">+960 771 2408</button>.</span></p>' +
        '</div>' +
      '</div>';
  };

  function perksListHTML() {
    var p = W.program;
    return '<ul class="perks-list" role="list">' +
      '<li>' + icon('bean') + '<span><strong>1 bean for every MVR ' + esc(p.mvrPerBean) + '</strong> you spend</span></li>' +
      '<li>' + icon('stamp') + '<span><strong>Every ' + ordinal(p.stampsForFree) + ' drink free</strong> on your coffee card</span></li>' +
      '<li>' + icon('cake') + '<span><strong>' + F.num(p.birthdayBonus) + ' beans</strong> in your birthday week</span></li>' +
    '</ul>';
  }

  /* ---------- Join ---------- */
  VIEWS.join = function () {
    var cur = W.currentMember(), p = W.program;
    var dayOpts = '<option value="">Day</option>';
    for (var d = 1; d <= 31; d++) dayOpts += '<option value="' + d + '">' + d + '</option>';
    var monOpts = '<option value="">Month</option>' + MONTHS_FULL.map(function (n, i) { return '<option value="' + (i + 1) + '">' + n + '</option>'; }).join('');
    return '' +
      '<div class="auth auth--join">' +
        '<div class="auth__head">' +
          '<h1 class="auth__title display" tabindex="-1" data-focus>Join White Rewards</h1>' +
          '<p class="auth__lede">It’s free. ' + F.num(p.welcomeBonus) + ' beans land on your card the moment you join.</p>' +
        '</div>' +
        '<div class="auth__show">' +
          '<div class="auth__preview" aria-hidden="true">' + cardHTML(null, {}) + '</div>' +
          perksListHTML() +
        '</div>' +
        '<div class="auth__panel">' +
          (cur ? '<p class="notice">' + icon('info') + '<span>You’re signed in as ' + esc(cur.name) + '. Joining switches to the new card.</span></p>' : '') +
          '<form class="auth-form" data-form="join" novalidate>' +
            '<h2 class="panel-title">Create your card</h2>' +
            '<div class="field"><label for="j-name">Full name</label>' +
              '<input class="input" id="j-name" name="name" autocomplete="name" placeholder="e.g. Aminath Ali" aria-describedby="j-name-err">' +
              '<p class="field-error" id="j-name-err" role="alert"></p></div>' +
            '<div class="field"><label for="j-phone">Phone number</label>' +
              '<div class="phone-input"><span class="phone-input__cc" aria-hidden="true">+960</span>' +
              '<input class="input num" id="j-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="771 2408" maxlength="8" value="' + esc(prettyLocal(S.joinPrefill)) + '" aria-describedby="j-phone-err j-phone-hint"></div>' +
              '<p class="hint" id="j-phone-hint">You’ll sign in with this number.</p>' +
              '<p class="field-error" id="j-phone-err" role="alert"></p></div>' +
            '<div class="field"><label for="j-email">Email <span class="optional">optional</span></label>' +
              '<input class="input" id="j-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="j-email-err">' +
              '<p class="field-error" id="j-email-err" role="alert"></p></div>' +
            '<fieldset class="field fieldset"><legend>Birthday <span class="optional">optional</span></legend>' +
              '<div class="bday"><label class="visually-hidden" for="j-bday-d">Birthday day</label>' +
              '<select class="select" id="j-bday-d" name="bdayDay" autocomplete="bday-day">' + dayOpts + '</select>' +
              '<label class="visually-hidden" for="j-bday-m">Birthday month</label>' +
              '<select class="select" id="j-bday-m" name="bdayMonth" autocomplete="bday-month">' + monOpts + '</select></div>' +
              '<p class="hint">For your ' + F.num(p.birthdayBonus) + ' birthday beans.</p>' +
              '<p class="field-error" id="j-bday-err" role="alert"></p></fieldset>' +
            '<button class="btn btn--gold btn--block" type="submit">Join free</button>' +
          '</form>' +
          '<p class="auth-row">Already a member? <a class="link" href="#signin">Sign in</a></p>' +
          '<p class="demo-note auth-demo">' + icon('info') + '<span>This is a demo — nothing is sent anywhere.</span></p>' +
        '</div>' +
      '</div>';
  };

  /* ---------- Card (home) ---------- */
  VIEWS.card = function (m) {
    var p = W.program, tp = W.tierProgress(m), tier = tp.tier, next = tp.next;
    var n = p.stampsForFree, stamps = Math.min(m.stamps, n);
    var cols = n <= 6 ? n : Math.ceil(n / 2);
    // Stamps added since the card was last drawn (e.g. by staff at the counter) land with a small press.
    var prevStamps = S.shownStamps;
    S.shownStamps = stamps;
    var slots = '';
    for (var i = 0; i < n; i++) {
      var last = i === n - 1, filled = i < stamps;
      var landed = filled && prevStamps != null && i >= prevStamps;
      slots += '<li class="slot' + (filled ? ' is-filled' : '') + (landed ? ' is-new' : '') + (last ? ' is-free' : '') + '" style="--i:' + i + '">' +
        '<span class="slot__ring">' + (last && !filled ? icon('gift') : icon('cup')) + '</span>' +
        '<span class="visually-hidden">' + (filled ? 'Stamped' : last ? 'Free drink' : 'Empty') + '</span></li>';
    }
    var toGo = n - stamps;
    var stampLine = stamps === 0 ? 'Every handcrafted drink earns a stamp.' :
      toGo === 1 ? 'One more drink and the next one is free.' :
      plural(toGo, 'more drink') + ' until a free one.';

    var tierBlock = '' +
      '<section class="panel tierp" aria-labelledby="tier-h">' +
        '<div class="panel-head">' +
          '<h2 class="panel-h" id="tier-h">' + esc(tier.name) + ' member</h2>' +
          '<span class="chip">' + icon('layers') + esc(F.num(m.lifetimeBeans)) + ' beans earned</span>' +
        '</div>' +
        (next ?
          '<p class="tierp__goal"><strong class="num">' + F.num(tp.need) + ' beans</strong> to ' + esc(next.name) + '</p>' :
          '<p class="tierp__goal"><strong>You’re at the top tier.</strong> Thank you for being a regular.</p>') +
        '<div class="meter meter--tier" role="progressbar" aria-label="Progress to ' + esc(next ? next.name : tier.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(tp.pct * 100) + '">' +
          '<span class="meter__fill" style="--pct:' + (tp.pct * 100).toFixed(1) + '%"></span></div>' +
        '<div class="tierp__ends"><span>' + esc(tier.name) + ' · ' + F.num(tier.min) + '</span>' + (next ? '<span>' + esc(next.name) + ' · ' + F.num(next.min) + '</span>' : '') + '</div>' +
        '<div class="perks-cols">' +
          '<div><h3 class="perks-h">Your perks</h3><ul class="perks" role="list">' + tier.perks.map(function (x) { return '<li>' + icon('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div>' +
          (next ? '<div class="perks-next"><h3 class="perks-h">Unlocks at ' + esc(next.name) + '</h3><ul class="perks" role="list">' + next.perks.map(function (x) { return '<li>' + icon('plus') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div>' : '') +
        '</div>' +
      '</section>';

    var stampBlock = '' +
      '<section class="panel stamps" aria-labelledby="stamps-h">' +
        '<div class="panel-head">' +
          '<h2 class="panel-h" id="stamps-h">Coffee card</h2>' +
          '<span class="stamps__count num">' + stamps + ' of ' + n + '</span>' +
        '</div>' +
        '<ol class="slots" role="list" style="--cols:' + cols + ';--first:' + (prevStamps || 0) + '" aria-label="' + stamps + ' of ' + n + ' stamps">' + slots + '</ol>' +
        '<p class="stamps__line">' + esc(stampLine) + '</p>' +
        (m.freeDrinks > 0 ?
          '<div class="free-badge">' + icon('cup') + '<div><strong>' + (m.freeDrinks === 1 ? 'A free drink is ready' : F.num(m.freeDrinks) + ' free drinks are ready') + '</strong>' +
          '<span>Show your card at the counter to use it.</span></div></div>' : '') +
      '</section>';

    var offers = W.offers();
    var offersBlock = offers.length ? '' +
      '<section class="section" aria-labelledby="offers-h">' +
        '<div class="section-head"><h2 class="section-h" id="offers-h">Member offers</h2></div>' +
        '<ul class="offers" role="list">' + offers.map(function (o) {
          return '<li class="offer"><span class="offer__ic">' + icon(offerIcon(o)) + '</span><div><h3 class="offer__title">' + esc(o.title) + '</h3>' +
            (o.body ? '<p class="offer__body">' + esc(o.body) + '</p>' : '') + '</div></li>';
        }).join('') + '</ul>' +
      '</section>' : '';

    var recent = W.activity(m.id, 3);
    var recentBlock = '' +
      '<section class="section" aria-labelledby="recent-h">' +
        '<div class="section-head"><h2 class="section-h" id="recent-h">Recent activity</h2><a class="link-more" href="#activity">See all' + icon('chevron') + '</a></div>' +
        (recent.length ? '<ul class="acts panel" role="list">' + recent.map(actRow).join('') + '</ul>' : '<p class="empty">Your visits will show up here.</p>') +
      '</section>';

    return '<h2 class="visually-hidden">Your card details</h2>' + tierBlock + stampBlock + offersBlock + recentBlock;
  };

  function offerIcon(o) {
    var t = (o.title + ' ' + o.body);
    return /birthday/i.test(t) ? 'cake' : /friend|refer/i.test(t) ? 'users' : /double|bean/i.test(t) ? 'bean' : 'sparkle';
  }

  /* ---------- Rewards ---------- */
  VIEWS.rewards = function (m) {
    var list = W.rewards();
    var ready = readyCodes(m);
    var readyBlock = ready.length ? '' +
      '<section class="section" aria-labelledby="ready-h"><div class="section-head"><h2 class="section-h" id="ready-h">Ready to collect</h2></div>' +
      '<div class="ready-list">' + ready.map(function (r) {
        return '<a class="waiting" href="#code/' + encodeURIComponent(r.code) + '"><span class="waiting__ic">' + icon('qr') + '</span>' +
          '<span class="waiting__main"><span class="waiting__title">' + esc(r.rewardName) + '</span>' +
          '<span class="waiting__sub"><span class="nowrap">Code <span class="num">' + esc(r.code) + '</span></span> · <span class="nowrap"><span class="num" data-until="' + r.expires + '">' + mmss(r.expires - Date.now()) + '</span> left</span> · <span class="nowrap">tap to show it</span></span></span>' + icon('chevron', 'waiting__chev') + '</a>';
      }).join('') + '</div></section>' : '';

    var items = list.map(function (r) {
      var can = m.beans >= r.cost, short = r.cost - m.beans;
      var pct = Math.max(4, Math.min(100, (m.beans / r.cost) * 100));
      return '<li class="reward' + (can ? ' is-afford' : '') + '">' +
        '<span class="reward__ic">' + icon(rewardIcon(r)) + '</span>' +
        '<div class="reward__main">' +
          '<h3 class="reward__name">' + esc(r.name) + '</h3>' +
          '<p class="reward__cost num">' + F.num(r.cost) + ' beans</p>' +
          (can ?
            '<p class="reward__state is-ok">' + icon('checkCircle') + 'You can get this</p>' :
            '<div class="reward__progress"><div class="meter meter--sm" aria-hidden="true"><span class="meter__fill" style="--pct:' + pct.toFixed(1) + '%"></span></div>' +
            '<p class="reward__state"><span><span class="num">' + F.num(short) + '</span> more beans to go</span></p></div>') +
        '</div>' +
        (can ? '<button class="btn btn--sm reward__btn" type="button" data-act="redeem" data-id="' + esc(r.id) + '" aria-label="Redeem ' + esc(r.name) + ' for ' + F.num(r.cost) + ' beans">Redeem</button>' : '') +
      '</li>';
    }).join('');

    return '' +
      '<header class="vhead">' +
        '<h1 class="vhead__title" tabindex="-1" data-focus>Rewards</h1>' +
        '<p class="vhead__sub">You have <strong class="num" data-f="balance">' + F.num(m.beans) + ' beans</strong> to spend.</p>' +
      '</header>' +
      readyBlock +
      (list.length ? '<ul class="rewards" role="list">' + items + '</ul>' : '<p class="empty">No rewards right now — check back soon.</p>') +
      '<p class="hint rewards-hint">' + icon('clock') + 'Redeem when you’re at the café — your code stays valid for ' + plural(W.program.redemptionMinutes, 'minute') + '.</p>';
  };

  /* ---------- Code screen ---------- */
  VIEWS.code = function (m, code) {
    var r = W.redemption(code);
    var back = '<a class="link-back" href="#rewards">' + icon('arrowLeft') + 'Rewards</a>';
    if (!r || r.memberId !== m.id) {
      return back + '<div class="codebox codebox--state"><span class="state-ic">' + icon('alert') + '</span>' +
        '<h1 class="state-title" tabindex="-1" data-focus>We couldn’t find that code</h1><p class="state-text">It may belong to another card. Your ready rewards are on the Rewards tab.</p>' +
        '<a class="btn" href="#rewards">Go to rewards</a></div>';
    }
    var status = r.status;
    if (status === 'ready' && r.expires <= Date.now()) status = 'expired';
    var prev = S.codeStatus[r.code];
    var changed = prev && prev !== status;
    S.codeStatus[r.code] = status;

    if (status === 'served') {
      return back + '<div class="codebox codebox--served' + (changed ? ' is-new' : '') + '">' +
        '<span class="served-mark">' + icon('check') + '</span>' +
        '<h1 class="enjoy display" tabindex="-1" data-focus>Enjoy!</h1>' +
        '<p class="state-text"><strong>' + esc(r.rewardName) + '</strong> was served' + (r.servedBy ? ' by ' + esc(r.servedBy) : '') + (r.servedAt ? ' at ' + esc(F.time(r.servedAt)) : '') + '.</p>' +
        '<p class="state-small num">' + esc(r.code) + ' · ' + F.num(r.cost) + ' beans</p>' +
        '<a class="btn" href="#card">Back to my card</a></div>';
    }
    if (status === 'expired') {
      return back + '<div class="codebox codebox--state"><span class="state-ic">' + icon('clock') + '</span>' +
        '<h1 class="state-title" tabindex="-1" data-focus>This code has expired</h1>' +
        '<p class="state-text">' + esc(r.code) + ' for ' + esc(r.rewardName) + ' was valid until ' + esc(F.time(r.expires)) + '. Ask at the counter and the team will sort it out.</p>' +
        '<a class="btn" href="#rewards">Back to rewards</a></div>';
    }
    if (status === 'cancelled') {
      return back + '<div class="codebox codebox--state"><span class="state-ic">' + icon('returnArrow') + '</span>' +
        '<h1 class="state-title" tabindex="-1" data-focus>Reward cancelled</h1>' +
        '<p class="state-text">' + F.num(r.cost) + ' beans are back on your card.</p>' +
        '<a class="btn" href="#rewards">Back to rewards</a></div>';
    }
    var total = r.expires - r.ts, left = r.expires - Date.now();
    return back +
      '<div class="codebox">' +
        '<p class="codebox__label">Your reward</p>' +
        '<h1 class="codebox__reward" tabindex="-1" data-focus>' + esc(r.rewardName) + '</h1>' +
        '<p class="codebox__code num" aria-label="Code ' + esc(r.code.split('').join(' ')) + '">' + esc(r.code) + '</p>' +
        '<div class="codebox__qr">' + qrSvg(r.code) + '</div>' +
        '<p class="codebox__timer">Show this to the barista within <strong class="num" data-until="' + r.expires + '">' + mmss(left) + '</strong></p>' +
        '<div class="meter meter--time" aria-hidden="true"><span class="meter__fill" data-until-bar="' + r.expires + '" data-total="' + total + '" style="--pct:' + Math.max(0, Math.min(100, left / total * 100)).toFixed(2) + '%"></span></div>' +
        '<p class="codebox__live"><span class="live-dot" aria-hidden="true"></span>This screen updates when your reward is served.</p>' +
        '<button class="link-btn codebox__cancel" type="button" data-act="cancel-code" data-code="' + esc(r.code) + '">Cancel and return ' + F.num(r.cost) + ' beans</button>' +
      '</div>';
  };

  /* ---------- Activity ---------- */
  var FILTERS = {
    all: function () { return true; },
    earned: function (a) { return a.type === 'earn' || a.type === 'bonus' || (a.type === 'adjust' && a.beans > 0); },
    redeemed: function (a) { return a.type === 'redeem' || a.type === 'served' || a.type === 'refund' || a.type === 'free'; }
  };

  function actMeta(a) {
    switch (a.type) {
      case 'earn': return { ic: 'receipt', tone: 'gold', title: 'Visit' + (a.items && a.items.length ? ' — ' + a.items.join(' + ') : '') };
      case 'bonus': return { ic: /birthday/i.test(a.note) ? 'cake' : /refer|friend/i.test(a.note) ? 'users' : 'sparkle', tone: 'gold', title: a.note || 'Bonus beans' };
      case 'redeem': return { ic: 'gift', tone: 'ink', title: 'Redeemed — ' + (a.note || 'Reward') };
      case 'served': return { ic: 'checkCircle', tone: 'ok', title: 'Collected — ' + String(a.note || 'Reward').replace(/ handed over$/, '') };
      case 'refund': return { ic: 'returnArrow', tone: 'ink', title: a.note || 'Beans returned' };
      case 'free': return { ic: 'cup', tone: 'ok', title: a.note || 'Free drink' };
      case 'stamp': return { ic: 'stamp', tone: 'gold', title: a.note || 'Coffee card full' };
      case 'join': return { ic: 'userPlus', tone: 'gold', title: a.note || 'Joined White Rewards' };
      case 'adjust': return { ic: 'minus', tone: 'ink', title: a.note || 'Adjustment' };
      default: return { ic: 'info', tone: 'ink', title: a.note || 'Update' };
    }
  }

  /** Where a redeemed code stands now: ready (with time left), expired or cancelled. */
  function redeemState(a) {
    var r = a.code ? W.redemption(a.code) : null;
    if (!r) return '';
    if (r.status === 'ready' && r.expires > Date.now()) return '<a class="mini-chip mini-chip--link" href="#code/' + encodeURIComponent(r.code) + '">Ready — show code</a>';
    if (r.status === 'ready' || r.status === 'expired') return '<span class="mini-chip mini-chip--muted">Code expired</span>';
    if (r.status === 'cancelled') return '<span class="mini-chip mini-chip--muted">Cancelled</span>';
    return '';
  }

  function actRow(a) {
    var meta = actMeta(a);
    var sub = ['<span class="num">' + esc(F.dateTime(a.ts)) + '</span>'];
    if (a.type === 'earn') {
      sub.push('<span class="num">' + esc(F.mvr(a.amount)) + '</span>');
      if (a.stamps) sub.push(plural(a.stamps, 'stamp'));
      if (a.multiplier > 1) sub.push('<span class="mini-chip">' + (a.multiplier === 2 ? 'Double beans' : a.multiplier + '× beans') + '</span>');
    }
    if ((a.type === 'redeem' || a.type === 'served') && a.code) sub.push('<span class="num">' + esc(a.code) + '</span>');
    if (a.type === 'redeem') { var st = redeemState(a); if (st) sub.push(st); }
    if (a.staff && (a.type === 'served' || a.type === 'free')) sub.push('by ' + esc(a.staff));
    var right = '';
    if (a.beans) right = '<span class="act__beans num ' + (a.beans > 0 ? 'is-plus' : 'is-minus') + '">' + (a.beans > 0 ? '+' : '−') + F.num(Math.abs(a.beans)) + '<small>beans</small></span>';
    else if (a.type === 'free') right = '<span class="act__tag">Free</span>';
    else if (a.type === 'served') right = '<span class="act__tag">Served</span>';
    // Each meta item carries its own leading dot; .act__sub clips the dot that lands at the start of a line.
    return '<li class="act">' +
      '<span class="act__ic tone-' + meta.tone + '">' + icon(meta.ic) + '</span>' +
      '<span class="act__main"><span class="act__title">' + esc(meta.title) + '</span>' +
      '<span class="act__sub"><span class="act__subin">' + sub.map(function (s) { return '<span class="si">' + s + '</span>'; }).join('') + '</span></span></span>' +
      right + '</li>';
  }

  VIEWS.activity = function (m) {
    var all = W.activity(m.id);
    var list = all.filter(FILTERS[S.filter] || FILTERS.all);
    var now = W.maleParts();
    var month = all.filter(function (a) { var p = W.maleParts(a.ts); return p.y === now.y && p.mo === now.mo; });
    var visits = month.filter(function (a) { return a.type === 'earn'; }).length;
    var earned = month.reduce(function (s, a) { return s + (a.beans > 0 && a.type !== 'refund' ? a.beans : 0); }, 0);
    var redeemed = month.filter(function (a) { return a.type === 'redeem'; }).length;

    var shown = list.slice(0, S.activityLimit);
    var groups = [], cur = null;
    shown.forEach(function (a) {
      var p = W.maleParts(a.ts), key = p.y + '-' + p.mo;
      if (!cur || cur.key !== key) { cur = { key: key, label: MONTHS_FULL[p.mo] + ' ' + p.y, rows: [] }; groups.push(cur); }
      cur.rows.push(a);
    });

    var seg = [['all', 'All'], ['earned', 'Earned'], ['redeemed', 'Redeemed']].map(function (f) {
      return '<button class="seg__btn" type="button" data-act="filter" data-f="' + f[0] + '" aria-pressed="' + (S.filter === f[0]) + '">' + f[1] + '</button>';
    }).join('');

    return '' +
      '<header class="vhead">' +
        '<h1 class="vhead__title" tabindex="-1" data-focus>Activity</h1>' +
        '<p class="vhead__sub">Every visit, bonus and reward on your card.</p>' +
      '</header>' +
      '<section class="summary" aria-labelledby="sum-h"><h2 class="summary__cap" id="sum-h">' + MONTHS_FULL[now.mo] + ' so far</h2><dl class="summary__grid">' +
        '<div><dt>Visits</dt><dd class="num">' + F.num(visits) + '</dd></div>' +
        '<div><dt>Beans earned</dt><dd class="num">+' + F.num(earned) + '</dd></div>' +
        '<div><dt>Rewards</dt><dd class="num">' + F.num(redeemed) + '</dd></div>' +
      '</dl></section>' +
      '<div class="seg" role="group" aria-label="Filter activity">' + seg + '</div>' +
      (groups.length ? groups.map(function (g) {
        return '<section class="month"><h2 class="month__h">' + esc(g.label) + '</h2><ul class="acts panel" role="list">' + g.rows.map(actRow).join('') + '</ul></section>';
      }).join('') : '<p class="empty">Nothing here yet.</p>') +
      (list.length > shown.length ? '<button class="btn btn--ghost btn--block more-btn" type="button" data-act="more">Show older activity</button>' : '');
  };

  /* ---------- Profile ---------- */
  function profileHeadHTML(m) {
    var tier = W.tier(m);
    return '<span class="pavatar ' + tierClass(m) + '" aria-hidden="true">' + esc(F.initials(m.name)) + '</span>' +
      '<div class="phead__main"><h1 class="vhead__title" tabindex="-1" data-focus>' + esc(m.name) + '</h1>' +
      '<p class="phead__meta"><span class="chip">' + esc(tier.name) + ' member</span><span class="num">' + esc(m.id) + '</span></p></div>';
  }
  function profileStatsHTML(m) {
    return '<div><dt>Member since</dt><dd>' + esc(F.date(m.joined)) + '</dd></div>' +
      '<div><dt>Visits</dt><dd class="num">' + F.num(m.visits) + '</dd></div>' +
      '<div><dt>Total spend</dt><dd class="num">' + esc(F.mvr(m.spend)) + '</dd></div>' +
      '<div><dt>Beans earned</dt><dd class="num">' + F.num(m.lifetimeBeans) + '</dd></div>';
  }

  VIEWS.profile = function (m) {
    var p = W.program;
    var bd = (m.birthday || '').split('-');
    var bMonth = bd.length === 2 ? +bd[0] : 0, bDay = bd.length === 2 ? +bd[1] : 0;
    var dayOpts = '<option value="">Day</option>';
    for (var d = 1; d <= 31; d++) dayOpts += '<option value="' + d + '"' + (d === bDay ? ' selected' : '') + '>' + d + '</option>';
    var monOpts = '<option value="">Month</option>' + MONTHS_FULL.map(function (n, i) { return '<option value="' + (i + 1) + '"' + (i + 1 === bMonth ? ' selected' : '') + '>' + n + '</option>'; }).join('');
    var cats = W.categories();
    var favFound = false;
    var favOpts = '<option value="">No favourite yet</option>' + cats.map(function (c) {
      var items = W.menu(c.id).filter(isDrink);
      if (!items.length) return '';
      return '<optgroup label="' + esc(c.name) + '">' + items.map(function (it) {
        var sel = it.name === m.favourite; if (sel) favFound = true;
        return '<option' + (sel ? ' selected' : '') + '>' + esc(it.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    if (m.favourite && !favFound) favOpts += '<option selected>' + esc(m.favourite) + '</option>';

    var tiersRows = p.tiers.map(function (t) {
      return '<tr><th scope="row">' + esc(t.name) + '</th><td class="num">' + (t.min ? F.num(t.min) + '+' : 'From joining') + '</td><td class="num">' + esc(t.mult) + '×</td></tr>';
    }).join('');

    return '' +
      '<header class="vhead phead" id="p-head">' + profileHeadHTML(m) + '</header>' +
      '<dl class="stats" id="p-stats">' + profileStatsHTML(m) + '</dl>' +

      '<section class="panel" aria-labelledby="edit-h">' +
        '<div class="panel-head"><h2 class="panel-h" id="edit-h">Your details</h2></div>' +
        '<form class="pform" data-form="profile" novalidate>' +
          '<div class="field"><label for="p-name">Full name</label><input class="input" id="p-name" name="name" autocomplete="name" value="' + esc(m.name) + '" aria-describedby="p-name-err"><p class="field-error" id="p-name-err" role="alert"></p></div>' +
          '<div class="field"><label for="p-phone">Phone number</label><input class="input num" id="p-phone" value="' + esc(m.phone) + '" readonly aria-describedby="p-phone-hint"><p class="hint" id="p-phone-hint">This is how you sign in. Ask the team to change it.</p></div>' +
          '<div class="field"><label for="p-email">Email <span class="optional">optional</span></label><input class="input" id="p-email" name="email" type="email" autocomplete="email" value="' + esc(m.email) + '" aria-describedby="p-email-err"><p class="field-error" id="p-email-err" role="alert"></p></div>' +
          '<fieldset class="field fieldset"><legend>Birthday</legend><div class="bday">' +
            '<label class="visually-hidden" for="p-bday-d">Birthday day</label><select class="select" id="p-bday-d" name="bdayDay">' + dayOpts + '</select>' +
            '<label class="visually-hidden" for="p-bday-m">Birthday month</label><select class="select" id="p-bday-m" name="bdayMonth">' + monOpts + '</select></div>' +
            '<p class="field-error" id="p-bday-err" role="alert"></p></fieldset>' +
          '<div class="field"><label for="p-fav">Favourite drink</label><select class="select" id="p-fav" name="favourite">' + favOpts + '</select><p class="hint">So the team can have it ready.</p></div>' +
          '<div class="pform__actions"><button class="btn" type="submit">Save changes</button><span class="pform__saved" id="p-saved" aria-live="polite"></span></div>' +
        '</form>' +
      '</section>' +

      '<section class="panel how" aria-labelledby="how-h">' +
        '<div class="panel-head"><h2 class="panel-h" id="how-h">How White Rewards works</h2></div>' +
        '<ul class="rules" role="list">' +
          '<li>' + icon('bean') + '<span><strong>Earn 1 bean for every MVR ' + esc(p.mvrPerBean) + '</strong> you spend. Higher tiers earn more on every bill.</span></li>' +
          '<li>' + icon('stamp') + '<span><strong>Every ' + ordinal(p.stampsForFree) + ' drink is free.</strong> Each handcrafted drink adds a stamp to your coffee card.</span></li>' +
          '<li>' + icon('sparkle') + '<span><strong>' + F.num(p.welcomeBonus) + ' beans</strong> the day you join.</span></li>' +
          '<li>' + icon('cake') + '<span><strong>' + F.num(p.birthdayBonus) + ' beans</strong> in your birthday week.</span></li>' +
          '<li>' + icon('users') + '<span><strong>' + F.num(p.referralBonus) + ' beans each</strong> when a friend you invite makes their first visit.</span></li>' +
          '<li>' + icon('gift') + '<span><strong>Spend beans on rewards.</strong> You get a code that stays valid for ' + plural(p.redemptionMinutes, 'minute') + ' — show it at the counter.</span></li>' +
        '</ul>' +
        '<h3 class="perks-h how__tiers-h">Tiers</h3>' +
        '<div class="table-wrap"><table class="tiers-table"><thead><tr><th scope="col">Tier</th><th scope="col">Beans earned</th><th scope="col">Beans per bill</th></tr></thead><tbody>' + tiersRows + '</tbody></table></div>' +
        '<p class="hint">Your tier is based on all the beans you’ve earned since joining, so spending beans never lowers it.</p>' +
      '</section>' +

      '<section class="panel account" aria-labelledby="acct-h">' +
        '<div class="panel-head"><h2 class="panel-h" id="acct-h">Account</h2></div>' +
        '<div class="account__row">' +
          '<button class="btn btn--ghost" type="button" data-act="signout">' + icon('logout') + 'Sign out</button>' +
          '<button class="btn btn--ghost btn--danger" type="button" data-act="reset">' + icon('refresh') + 'Reset demo data</button>' +
        '</div>' +
        '<p class="demo-note">' + icon('info') + '<span>This is a demo. Resetting puts every member, visit and reward back to the starting data — in this portal, the admin portal and the website.</span></p>' +
      '</section>';
  };

  /* ------------------------------------------------------------------ */
  /* Router + rendering                                                  */
  /* ------------------------------------------------------------------ */
  function parseHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var i = h.indexOf('/');
    return { view: (i > -1 ? h.slice(0, i) : h).toLowerCase(), arg: i > -1 ? decodeURIComponent(h.slice(i + 1)) : '' };
  }

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function syncMember(m) {
    var id = m ? m.id : null;
    if (id === S.memberId) return false;
    S.memberId = id;
    S.flipped = false;
    S.shownBeans = null;
    S.shownStamps = null;
    S.seen = {};
    S.codeStatus = {};
    S.filter = 'all';
    S.activityLimit = 40;
    S.profileDirty = false;
    if (m) {
      W.activity(m.id).forEach(function (a) { S.seen[a.id] = 1; });
      S.tierId = W.tier(m).id;
    }
    return true;
  }

  function route() {
    var h = parseHash();
    var m = W.currentMember();
    var memberChanged = syncMember(m);
    var v = h.view, arg = h.arg;
    if (!m) { if (v !== 'join') v = 'signin'; }
    else if (!v || v === 'signin' || (!APP_VIEWS[v] && v !== 'join')) v = 'card';
    if (v !== h.view) { try { history.replaceState(null, '', '#' + v); } catch (e) { /* file:// */ } }
    var entering = v !== S.view || arg !== S.arg || memberChanged;
    if (v !== 'signin' && S.view === 'signin') { S.signin = { step: 'phone', local: S.signin.local, error: '', notFound: false, busy: false }; }
    S.view = v; S.arg = arg;
    if (v !== 'profile') S.profileDirty = false;
    render(entering, memberChanged);
    if (S.welcome && v === 'card' && m) {            // the moment after joining
      S.welcome = false;
      setTimeout(function () { showWelcome(W.currentMember() || m); }, reduced() ? 0 : 250);
    }
  }

  function render(entering, fresh) {
    var m = W.currentMember();
    var v = S.view;
    var isAuth = !!AUTH_VIEWS[v];
    document.body.setAttribute('data-view', v);
    document.body.setAttribute('data-auth', isAuth ? '1' : '0');

    // Tabs
    var tabKey = v === 'code' ? 'rewards' : v;
    $all('[data-tab]').forEach(function (a) {
      if (a.getAttribute('data-tab') === tabKey && !isAuth) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var hasReady = m ? readyCodes(m).length > 0 : false;
    $all('.tab-dot').forEach(function (d) { d.hidden = !hasReady; });
    var av = $('#top-avatar');
    if (m && !isAuth) { av.hidden = false; av.textContent = F.initials(m.name); av.className = 'avatar ' + tierClass(m); }
    else av.hidden = true;
    $('.plogo').setAttribute('href', m ? '#card' : '#signin');

    // Side column
    if (m && !isAuth) renderSide(m, fresh || !$('#side-card'));
    else $('#side').innerHTML = '';

    // View
    var viewEl = $('#view');
    // A live refresh must not replay the entrance animation on the freshly inserted children.
    if (!entering) viewEl.classList.remove('is-entering');
    viewEl.innerHTML = VIEWS[v](m, S.arg);
    viewEl.setAttribute('data-v', v);
    if (entering) {
      viewEl.classList.remove('is-entering'); void viewEl.offsetWidth; viewEl.classList.add('is-entering');
      window.scrollTo(0, 0);
      focusHeading();
    }
    afterRender(v);
  }

  function focusHeading() {
    if (!S.booted) return;  // keep the first paint calm; focus moves on navigation
    var h = $('#view [data-focus]') || $('#side [data-focus]');
    if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  }

  /** Soft refresh after a data change: keep forms the visitor is typing in. */
  function refresh() {
    var m = W.currentMember();
    if (!m || AUTH_VIEWS[S.view]) return;
    var ae = document.activeElement;
    var key = ae && ae.closest && ae.closest('#view, #side') ? focusKey(ae) : null;
    if (S.view === 'profile' && S.profileDirty) {
      renderSide(m, false);
      var head = $('#p-head'), stats = $('#p-stats');
      if (head) head.innerHTML = profileHeadHTML(m);
      if (stats) stats.innerHTML = profileStatsHTML(m);
    } else {
      var y = window.scrollY;
      render(false, false);
      window.scrollTo(0, y);
    }
    if (key && !document.contains(ae) && !openSheetState) restoreFocus(key);
  }

  function afterRender(v) {
    if (v === 'signin' && S.signin.step === 'code') {
      var first = $('[data-otp="0"]');
      if (first && S.booted) first.focus();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    var m = W.currentMember();
    switch (act) {
      case 'flip': {
        var card = $('#side-card .mcard');
        if (t === card && card._moved) { card._moved = false; return; }
        setFlip(!S.flipped);
        break;
      }
      case 'demo':
        W.signInMember(W.demoMemberId());
        afterSignIn('Signed in as ' + W.currentMember().name, 'Demo account — explore freely.');
        break;
      case 'fill-demo': {
        S.signin = { step: 'phone', local: '7712408', error: '', notFound: false, busy: false };
        render(false, false);
        var inp = $('#si-phone'); if (inp) inp.focus();
        break;
      }
      case 'change-number':
        S.signin.step = 'phone'; S.signin.error = ''; render(false, false);
        var pi = $('#si-phone'); if (pi) pi.focus();
        break;
      case 'resend':
        S.signin.error = '';
        toast('We sent a new code to ' + fullPhone(S.signin.local), { icon: 'phone', sub: 'Demo — any 4 digits work.' });
        $all('[data-otp]').forEach(function (b) { b.value = ''; });
        var f0 = $('[data-otp="0"]'); if (f0) f0.focus();
        break;
      case 'join-with-number':
        S.joinPrefill = S.signin.local;
        break;   // the href does the navigation
      case 'redeem':
        if (m) confirmRedeem(m, t.getAttribute('data-id'), t);
        break;
      case 'cancel-code':
        if (m) confirmCancel(t.getAttribute('data-code'), t);
        break;
      case 'filter':
        S.filter = t.getAttribute('data-f'); S.activityLimit = 40;
        refresh();
        var pressed = $('.seg__btn[data-f="' + S.filter + '"]'); if (pressed) pressed.focus();
        break;
      case 'more':
        S.activityLimit += 60; refresh();
        break;
      case 'signout':
        W.signOutMember();
        clearToasts();
        S.signin = { step: 'phone', local: '', error: '', notFound: false, busy: false };
        go('#signin');
        toast('You’re signed out', { icon: 'logout' });
        break;
      case 'reset':
        confirmReset(t);
        break;
    }
  });

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    var kind = form.getAttribute('data-form');
    if (kind === 'phone') submitPhone(form);
    else if (kind === 'code') submitCode();
    else if (kind === 'join') submitJoin(form);
    else if (kind === 'profile') submitProfile(form);
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'si-phone' || t.id === 'j-phone') {
      var before = t.value, pos = t.selectionStart;
      var pretty = prettyLocal(t.value);
      if (pretty !== before) {
        var digitsBefore = digitsOf(before.slice(0, pos)).length;
        t.value = pretty;
        var p = 0, seen = 0;
        while (p < pretty.length && seen < digitsBefore) { if (/\d/.test(pretty[p])) seen++; p++; }
        try { t.setSelectionRange(p, p); } catch (err) { /* type=tel supports it, guard anyway */ }
      }
      if (t.id === 'si-phone') { S.signin.local = digitsOf(t.value); if (S.signin.error) { S.signin.error = ''; S.signin.notFound = false; var er = $('#si-phone-err'); if (er) er.innerHTML = ''; var nj = $('.notfound-join'); if (nj) nj.remove(); } }
    }
    if (t.closest && t.closest('form[data-form="profile"]')) { S.profileDirty = true; var sv = $('#p-saved'); if (sv) sv.textContent = ''; }
    if (t.matches && t.matches('[data-otp]')) otpInput(t);
    if (t.closest && t.closest('form[data-form="join"]')) { var fe = t.closest('.field'); if (fe) { var errEl = $('.field-error', fe); if (errEl) errEl.innerHTML = ''; t.removeAttribute('aria-invalid'); } }
  });
  document.addEventListener('change', function (e) {
    if (e.target.closest && e.target.closest('form[data-form="profile"]')) S.profileDirty = true;
  });

  function clearToasts() { var host = $('#toasts'); if (host) host.innerHTML = ''; }

  function afterSignIn(msg, sub) {
    var m = W.currentMember();
    clearToasts();   // "Code sent…" belongs to the sign-in screen, not the card
    S.signin = { step: 'phone', local: '', error: '', notFound: false, busy: false };
    syncMember(m);
    go('#card');
    if (msg) toast(msg, { icon: 'card', sub: sub });
  }

  /* ---------- Sign in ---------- */
  function findByPhone(local) {
    // Look the number up before "sending" a code (signInByPhone signs in immediately).
    var hits = W.findMembers(local).filter(function (x) { return localPart(x.phone) === local; });
    return hits[0] || null;
  }

  function submitPhone(form) {
    var local = digitsOf($('#si-phone', form).value);
    if (local.length > 7 && local.indexOf('960') === 0) local = local.slice(3);
    S.signin.local = local;
    S.signin.notFound = false;
    if (local.length !== 7) {
      S.signin.error = local.length ? 'Maldives numbers have 7 digits — check the number and try again.' : 'Enter your phone number.';
    } else if (!findByPhone(local)) {
      S.signin.error = 'We couldn’t find a White Rewards card with ' + fullPhone(local) + '.';
      S.signin.notFound = true;
    } else {
      S.signin.error = '';
      S.signin.step = 'code';
      render(false, false);
      toast('Code sent to ' + fullPhone(local), { icon: 'phone', sub: 'Demo — any 4 digits work.' });
      var b = $('[data-otp="0"]'); if (b) b.focus();
      return;
    }
    render(false, false);
    var inp = $('#si-phone');
    if (inp) { inp.setAttribute('aria-invalid', 'true'); inp.focus(); }
  }

  function otpBoxes() { return $all('[data-otp]'); }
  function otpInput(box) {
    var boxes = otpBoxes(), i = +box.getAttribute('data-otp');
    var d = digitsOf(box.value);
    if (d.length > 1) {          // autofill / paste into one box
      for (var k = 0; k < d.length && i + k < boxes.length; k++) boxes[i + k].value = d[k];
      var nextIdx = Math.min(boxes.length - 1, i + d.length);
      boxes[nextIdx].focus();
    } else {
      box.value = d;
      if (d && i < boxes.length - 1) boxes[i + 1].focus();
    }
    if (S.signin.error) { S.signin.error = ''; var er = $('#otp-err'); if (er) er.innerHTML = ''; }
    if (boxes.every(function (b) { return b.value.length === 1; })) submitCode();
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t.matches || !t.matches('[data-otp]')) return;
    var boxes = otpBoxes(), i = +t.getAttribute('data-otp');
    if (e.key === 'Backspace' && !t.value && i > 0) { e.preventDefault(); boxes[i - 1].value = ''; boxes[i - 1].focus(); }
    else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); boxes[i - 1].focus(); }
    else if (e.key === 'ArrowRight' && i < boxes.length - 1) { e.preventDefault(); boxes[i + 1].focus(); }
  });
  document.addEventListener('paste', function (e) {
    var t = e.target;
    if (!t.matches || !t.matches('[data-otp]')) return;
    var text = digitsOf((e.clipboardData || window.clipboardData).getData('text')).slice(0, 4);
    if (!text) return;
    e.preventDefault();
    var boxes = otpBoxes();
    for (var k = 0; k < boxes.length; k++) boxes[k].value = text[k] || '';
    boxes[Math.min(text.length, boxes.length) - 1].focus();
    if (text.length === boxes.length) submitCode();
  });
  document.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches('[data-otp]')) { try { e.target.select(); } catch (err) { /* noop */ } }
  });

  function submitCode() {
    if (S.signin.busy) return;
    var code = otpBoxes().map(function (b) { return b.value; }).join('');
    if (code.length !== 4) {
      S.signin.error = 'Enter all 4 digits of the code.';
      var er = $('#otp-err'); if (er) er.innerHTML = icon('alert') + esc(S.signin.error);
      var empty = otpBoxes().filter(function (b) { return !b.value; })[0]; if (empty) empty.focus();
      return;
    }
    S.signin.busy = true;
    var btn = $('form[data-form="code"] button[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Checking…'; }
    setTimeout(function () {
      S.signin.busy = false;
      try {
        var m = W.signInByPhone(S.signin.local);
        afterSignIn('Welcome back, ' + firstName(m.name));
      } catch (err) {
        S.signin.error = err.message; render(false, false);
      }
    }, reduced() ? 50 : 650);
  }

  /* ---------- Join ---------- */
  function setFieldError(id, msg) {
    var el = $('#' + id + '-err'), inp = $('#' + id);
    if (el) el.innerHTML = msg ? icon('alert') + esc(msg) : '';
    if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
  }

  function readBirthday(prefix) {
    var d = +$('#' + prefix + '-bday-d').value, mo = +$('#' + prefix + '-bday-m').value;
    if (!d && !mo) return { value: '' };
    if (!d || !mo) return { error: 'Choose both a day and a month.' };
    if (d > DAYS_IN_MONTH[mo - 1]) return { error: MONTHS_FULL[mo - 1] + ' only has ' + DAYS_IN_MONTH[mo - 1] + ' days.' };
    return { value: String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0') };
  }
  function validEmail(s) { return !s || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }

  function submitJoin(form) {
    var name = $('#j-name').value.trim();
    var local = digitsOf($('#j-phone').value);
    var email = $('#j-email').value.trim();
    var bd = readBirthday('j');
    var bad = null;
    ['j-name', 'j-phone', 'j-email', 'j-bday'].forEach(function (id) { setFieldError(id, ''); });
    if (!name) { setFieldError('j-name', 'Please enter your name.'); bad = bad || '#j-name'; }
    if (local.length !== 7) { setFieldError('j-phone', local.length ? 'Maldives numbers have 7 digits.' : 'Please enter your phone number.'); bad = bad || '#j-phone'; }
    if (!validEmail(email)) { setFieldError('j-email', 'That email doesn’t look right.'); bad = bad || '#j-email'; }
    if (bd.error) { setFieldError('j-bday', bd.error); bad = bad || '#j-bday-d'; }
    if (bad) { $(bad).focus(); return; }
    try {
      var m = W.join({ name: name, phone: fullPhone(local), email: email, birthday: bd.value });
      W.signInMember(m.id);
      S.joinPrefill = '';
      S.welcome = true;
      afterSignIn(null);
    } catch (err) {
      if (/phone/i.test(err.message)) {
        setFieldError('j-phone', err.message + '.');
        var el = $('#j-phone-err');
        if (el && /already/i.test(err.message)) { el.innerHTML += ' <a class="link" href="#signin" data-act="signin-with-number">Sign in instead</a>'; S.signin.local = local; }
        $('#j-phone').focus();
      } else { setFieldError('j-name', err.message); $('#j-name').focus(); }
    }
  }

  /* ---------- Profile ---------- */
  function submitProfile(form) {
    var m = W.currentMember(); if (!m) return;
    var name = $('#p-name').value.trim(), email = $('#p-email').value.trim(), bd = readBirthday('p');
    var bad = null;
    ['p-name', 'p-email', 'p-bday'].forEach(function (id) { setFieldError(id, ''); });
    if (!name) { setFieldError('p-name', 'Your name can’t be empty.'); bad = bad || '#p-name'; }
    if (!validEmail(email)) { setFieldError('p-email', 'That email doesn’t look right.'); bad = bad || '#p-email'; }
    if (bd.error) { setFieldError('p-bday', bd.error); bad = bad || '#p-bday-d'; }
    if (bad) { $(bad).focus(); return; }
    try {
      W.updateMember(m.id, { name: name, email: email, birthday: bd.value, favourite: $('#p-fav').value });
      S.profileDirty = false;
      refresh();
      var sv = $('#p-saved'); if (sv) sv.innerHTML = icon('check') + 'Saved';
      toast('Profile saved', { icon: 'check' });
    } catch (err) { toast(err.message, { icon: 'alert', tone: 'bad' }); }
  }

  /* ------------------------------------------------------------------ */
  /* Sheets (dialogs)                                                    */
  /* ------------------------------------------------------------------ */
  var openSheetState = null;

  function openSheet(opts) {
    closeSheet(true);
    var layer = $('#layer');
    var id = 'sheet-' + Date.now();
    layer.innerHTML =
      '<div class="sheet-backdrop" data-sheet-close></div>' +
      '<div class="sheet' + (opts.cls ? ' ' + opts.cls : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-t"' + (opts.desc ? ' aria-describedby="' + id + '-d"' : '') + '>' +
        '<div class="sheet__grip" aria-hidden="true"></div>' +
        '<button class="sheet__x" type="button" data-sheet-close aria-label="Close">' + icon('x') + '</button>' +
        '<h2 class="sheet__title" id="' + id + '-t">' + opts.title + '</h2>' +
        (opts.desc ? '<div class="sheet__desc" id="' + id + '-d">' + opts.desc + '</div>' : '') +
        (opts.body || '') +
        '<p class="field-error sheet__err" role="alert"></p>' +
        '<div class="sheet__actions">' + (opts.actions || []).map(function (a, i) {
          return '<button class="btn ' + (a.cls || '') + '" type="button" data-sheet-btn="' + i + '">' + a.label + '</button>';
        }).join('') + '</div>' +
      '</div>';
    var sheet = $('.sheet', layer);
    var opener = opts.opener || document.activeElement;
    openSheetState = { opener: opener, openerKey: focusKey(opener), opts: opts, sheet: sheet };
    ['#topbar', '#main', '#tabbar'].forEach(function (s) { var el = $(s); if (el) el.setAttribute('inert', ''); });
    document.body.classList.add('has-sheet');
    requestAnimationFrame(function () { layer.classList.add('is-open'); });
    var focusBtn = $('[data-sheet-btn="0"]', sheet) || sheet;
    setTimeout(function () { focusBtn.focus(); }, 30);
    layer.onclick = function (e) {
      if (e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
      var b = e.target.closest('[data-sheet-btn]');
      if (b) {
        var a = opts.actions[+b.getAttribute('data-sheet-btn')];
        if (a && a.run) {
          try { var keep = a.run(); if (keep !== true) closeSheet(); }
          catch (err) { var er = $('.sheet__err', sheet); er.innerHTML = icon('alert') + esc(err.message); }
        } else closeSheet();
      }
    };
  }

  function closeSheet(silent) {
    if (!openSheetState) return;
    var st = openSheetState; openSheetState = null;
    var layer = $('#layer');
    ['#topbar', '#main', '#tabbar'].forEach(function (s) { var el = $(s); if (el) el.removeAttribute('inert'); });
    document.body.classList.remove('has-sheet');
    layer.classList.remove('is-open');
    layer.onclick = null;
    var done = function () { if (!openSheetState) layer.innerHTML = ''; };
    if (silent || reduced()) done(); else setTimeout(done, 260);
    if (!silent) {
      // The view may have re-rendered underneath (live sync), so fall back to the opener's replacement.
      if (st.opener && document.contains(st.opener)) { try { st.opener.focus(); } catch (e) { /* noop */ } }
      else restoreFocus(st.openerKey);
    }
    if (st.opts.onClose) st.opts.onClose();
  }

  document.addEventListener('keydown', function (e) {
    if (!openSheetState) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
    if (e.key === 'Tab') {
      var f = $all('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', openSheetState.sheet)
        .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !openSheetState.sheet.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !openSheetState.sheet.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });

  function confirmRedeem(m, rewardId, opener) {
    var r = W.reward(rewardId); if (!r) return;
    var after = m.beans - r.cost;
    openSheet({
      opener: opener,
      title: 'Redeem ' + esc(r.name) + '?',
      body: '<div class="sheet-reward"><span class="reward__ic">' + icon(rewardIcon(r)) + '</span>' +
        '<div><p class="sheet-reward__name">' + esc(r.name) + '</p><p class="sheet-reward__cost num">' + F.num(r.cost) + ' beans</p></div></div>' +
        '<dl class="sheet-sum"><div><dt>Your balance now</dt><dd class="num">' + F.num(m.beans) + ' beans</dd></div>' +
        '<div><dt>After redeeming</dt><dd class="num">' + F.num(after) + ' beans</dd></div></dl>' +
        '<p class="sheet-note">' + icon('clock') + '<span>You’ll get a code to show at the counter. It stays valid for ' + plural(W.program.redemptionMinutes, 'minute') + ', so redeem when you’re at the café.</span></p>',
      actions: [
        { label: 'Redeem for ' + F.num(r.cost) + ' beans', cls: 'btn--gold', run: function () {
          var red = W.redeem(m.id, r.id);
          S.codeStatus[red.code] = 'ready';
          setTimeout(function () { go('#code/' + encodeURIComponent(red.code)); }, 0);
        } },
        { label: 'Not now', cls: 'btn--ghost' }
      ]
    });
  }

  function confirmCancel(code, opener) {
    var r = W.redemption(code); if (!r) return;
    openSheet({
      opener: opener,
      title: 'Cancel this reward?',
      desc: '<p>' + esc(r.rewardName) + ' (' + esc(r.code) + ') will be cancelled and <strong>' + F.num(r.cost) + ' beans</strong> go back on your card.</p>',
      actions: [
        { label: 'Cancel reward', cls: 'btn--danger-solid', run: function () {
          W.cancelRedemption(r.code);
          toast(F.num(r.cost) + ' beans are back on your card', { icon: 'returnArrow' });
          setTimeout(function () { go('#rewards'); }, 0);
        } },
        { label: 'Keep it', cls: 'btn--ghost' }
      ]
    });
  }

  function confirmReset(opener) {
    openSheet({
      opener: opener,
      title: 'Reset demo data?',
      desc: '<p>Every member, visit, reward and setting goes back to the starting demo — here, in the admin portal and on the website. You’ll be signed out.</p>',
      actions: [
        { label: 'Reset demo data', cls: 'btn--danger-solid', run: function () { W.reset(); } },
        { label: 'Keep my data', cls: 'btn--ghost' }
      ]
    });
  }

  function showWelcome(m) {
    var p = W.program;
    openSheet({
      cls: 'sheet--welcome',
      title: 'Welcome to White Rewards',
      body: '<div class="welcome__card">' + cardHTML(m, {}) + '</div>' +
        '<p class="welcome__text"><strong>' + F.num(p.welcomeBonus) + ' beans are already on your card.</strong> Show your card at the counter on your next visit to start earning.</p>',
      actions: [{ label: 'See my card', cls: 'btn--gold' }]
    });
  }

  /* ------------------------------------------------------------------ */
  /* Toasts                                                              */
  /* ------------------------------------------------------------------ */
  function toast(msg, o) {
    o = o || {};
    var host = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (o.tone ? ' toast--' + o.tone : '');
    el.innerHTML = '<span class="toast__ic">' + icon(o.icon || 'check') + '</span><span class="toast__text"><span class="toast__msg">' + esc(msg) + '</span>' +
      (o.sub ? '<span class="toast__sub">' + esc(o.sub) + '</span>' : '') + '</span>';
    host.appendChild(el);
    while (host.children.length > 3) host.removeChild(host.firstChild);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () {
      el.classList.remove('is-in'); el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, reduced() ? 0 : 320);
    }, o.ms || 4200);
  }

  /** Toasts for changes made somewhere else (admin at the counter, another tab). */
  function notifyRemote(m) {
    var fresh = W.activity(m.id, 30).filter(function (a) { return !S.seen[a.id]; }).reverse();
    fresh.forEach(function (a) { S.seen[a.id] = 1; });
    // A visit that fills the coffee card arrives as earn + stamp: say it in one toast.
    var cardFull = fresh.some(function (a) { return a.type === 'stamp'; }) && fresh.some(function (a) { return a.type === 'earn'; });
    if (cardFull) fresh = fresh.filter(function (a) { return a.type !== 'stamp'; });
    fresh.slice(-3).forEach(function (a) {
      switch (a.type) {
        case 'earn':
          toast('+' + F.num(a.beans) + ' beans added', { icon: 'bean', sub: cardFull ? 'Coffee card full — your next drink is on us' :
            'Visit · ' + F.mvr(a.amount) + (a.stamps ? ' · ' + plural(a.stamps, 'stamp') : '') + (a.multiplier > 1 ? ' · double beans' : '') });
          break;
        case 'bonus': toast('+' + F.num(a.beans) + ' beans', { icon: 'sparkle', sub: a.note }); break;
        case 'adjust': toast('Your balance changed by −' + F.num(Math.abs(a.beans)) + ' beans', { icon: 'info', sub: a.note }); break;
        case 'served': {
          var r = a.code ? W.redemption(a.code) : null;
          toast('Enjoy your reward' + (a.staff ? ' — served by ' + a.staff : ''), { icon: 'cup', sub: r ? r.rewardName : String(a.note || '').replace(/ handed over$/, '') });
          break;
        }
        case 'free': toast('Free drink used — enjoy!', { icon: 'cup', sub: a.staff ? 'Served by ' + a.staff : '' }); break;
        case 'stamp': toast(a.note || 'Your coffee card is full', { icon: 'stamp', sub: 'Your next drink is on us.' }); break;
        case 'refund': toast('+' + F.num(a.beans) + ' beans returned', { icon: 'returnArrow', sub: a.note }); break;
        case 'redeem': toast('−' + F.num(Math.abs(a.beans)) + ' beans', { icon: 'gift', sub: a.note }); break;
      }
    });
    var t = W.tier(m);
    if (S.tierId && t.id !== S.tierId) {
      var up = W.program.tiers.indexOf(t) > W.program.tiers.map(function (x) { return x.id; }).indexOf(S.tierId);
      if (up) toast('You’re now a ' + t.name + ' member', { icon: 'layers', sub: t.perks[0] || '' });
    }
    S.tierId = t.id;
  }

  function markSeen(m) {
    W.activity(m.id, 30).forEach(function (a) { S.seen[a.id] = 1; });
    S.tierId = W.tier(m).id;
  }

  /* ------------------------------------------------------------------ */
  /* Live sync                                                           */
  /* ------------------------------------------------------------------ */
  W.subscribe(function (doc, info) {
    var m = W.currentMember();
    var wasReset = info.reason === 'reset' || doc.seededAt !== S.seededAt;
    S.seededAt = doc.seededAt;
    if (wasReset) {
      closeSheet(true);
      S.signin = { step: 'phone', local: '', error: '', notFound: false, busy: false };
      S.memberId = undefined;
      go(m ? '#card' : '#signin');
      toast(info.remote ? 'The demo data was reset' : 'Demo data reset', { icon: 'refresh', sub: m ? '' : 'Sign in again to explore.' });
      return;
    }
    if (!info.remote && info.reason === 'session') return;   // the action that signed in/out navigates itself
    if ((m ? m.id : null) !== S.memberId) {                   // signed in or out in another tab
      closeSheet(true);
      route();
      return;
    }
    if (!m) return;
    if (info.remote) notifyRemote(m); else markSeen(m);
    refresh();
  });

  /* Countdown ticker for ready codes */
  setInterval(function () {
    var now = Date.now(), expired = false;
    $all('[data-until]').forEach(function (el) {
      var left = +el.getAttribute('data-until') - now;
      el.textContent = mmss(left);
      if (left <= 0) expired = true;
    });
    $all('[data-until-bar]').forEach(function (el) {
      var left = +el.getAttribute('data-until-bar') - now, total = +el.getAttribute('data-total') || 1;
      el.style.setProperty('--pct', Math.max(0, Math.min(100, left / total * 100)).toFixed(2) + '%');
    });
    if (expired) { W.redemptions(); refresh(); }
  }, 1000);

  /* Keep the greeting / open status fresh */
  setInterval(function () { if (!AUTH_VIEWS[S.view] && W.currentMember() && !openSheetState) refresh(); }, 60000);

  window.addEventListener('hashchange', route);

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  (function boot() {
    var params = new URLSearchParams(location.search);
    if (params.get('join') === '1') {
      try { history.replaceState(null, '', location.pathname + '#join'); } catch (e) { location.hash = '#join'; }
    }
    route();
    S.booted = true;
    document.documentElement.classList.add('is-ready');
  })();

})();
