/* ==========================================================================
   White Rewards, customer portal (mockup)
   Runs entirely on window.WCH (assets/js/store.js). No business rules here:
   earning, tiers, stamps, rewards, codes and karaoke bookings all come from
   the store. Views are hash-routed: #signin #join #card #rewards #karaoke
   #activity #profile and #code/W-XXXX for a redeemed reward.
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
  var DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var FULL_MS = 2600;   // how long a just-filled coffee card stays full on screen
  var AUTH_VIEWS = { signin: 1, join: 1 };
  var APP_VIEWS = { card: 1, rewards: 1, karaoke: 1, activity: 1, profile: 1, code: 1 };
  var IMG = '../assets/img/';
  var KARAOKE_PAGE = '../karaoke/';
  // A hand-pressed look for the coffee-card stamps: each lands a few degrees off square.
  var STAMP_ROT = [-8, 5, -3, 9, -6, 3, -10, 7, -4, 1];

  /* ------------------------------------------------------------------ */
  /* Icons (24px grid, 1.6 stroke, styled by .ic in CSS)                 */
  /* ------------------------------------------------------------------ */
  var IC = {
    card: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3 10h18M7 14.5h4"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M12 8.5v12M12 8.5C10.5 5 6.5 4.5 6.5 7c0 1.5 2.5 1.5 5.5 1.5Zm0 0C13.5 5 17.5 4.5 17.5 7c0 1.5-2.5 1.5-5.5 1.5Z"/>',
    cup: '<path d="M4.5 9.5h11.5v3.75a5 5 0 0 1-5 5H9.5a5 5 0 0 1-5-5V9.5Z"/><path d="M16 10.75h1.4a2.35 2.35 0 0 1 0 4.7H15.6"/><path d="M3.5 21h14"/><path d="M8 3.25c-.7.9.7 1.85 0 2.75M11.75 3.25c-.7.9.7 1.85 0 2.75"/>',
    bean: '<g transform="rotate(40 12 12)"><ellipse cx="12" cy="12" rx="6.6" ry="8.6"/><path d="M12 6c-1.8 1.9-1.8 4 0 6s1.8 4.1 0 6"/></g>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.75 11a6.25 6.25 0 0 0 12.5 0M12 17.25V21M8.75 21h6.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevron: '<path d="M9.5 6l6 6-6 6"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h1.5M20 14v1.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    logout: '<path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 16l-4-4 4-4M6 12h9.5"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    history: '<path d="M3.75 12a8.25 8.25 0 1 0 2.4-5.83"/><path d="M4 3.75v3.5h3.5"/><path d="M12 7.75V12l2.75 1.75"/>',
    returnArrow: '<path d="M9 14 4.5 9.5 9 5"/><path d="M4.5 9.5h10a5 5 0 0 1 0 10H11"/>',
    user: '<circle cx="12" cy="8.5" r="3.75"/><path d="M4.75 20c.9-3.6 3.8-5.5 7.25-5.5s6.35 1.9 7.25 5.5"/>',
    stamp: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 10.5h7v2.25a3.5 3.5 0 0 1-7 0V10.5ZM15.5 11.25h.75a1.25 1.25 0 0 1 0 2.5h-.9"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.25M12 7.9v.1"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.25M12 15.9v.1"/>',
    phone: '<path d="M7.5 3.5h9a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="M10.5 17.75h3"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'
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
  /** Store and admin text can carry dashes ("Coffee card full — a free drink…", "4–6 PM"); the portal reads plainer. */
  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2')
      .replace(/\s+[—–]\s+/g, ', ')
      .replace(/[—–]/g, ', ');
  }
  function digitsOf(s) { return String(s || '').replace(/\D/g, ''); }
  /** Length of a +960 / 00960 country code at the start of more than 7 digits (0 if none). */
  function ccLen(d) { return d.length > 7 ? (d.indexOf('00960') === 0 ? 5 : d.indexOf('960') === 0 ? 3 : 0) : 0; }
  /** Whatever was typed or pasted ("+960 771 2408", "009607712408", "771-2408") -> the 7 local digits. */
  function localDigits(v) { var d = digitsOf(v); return d.slice(ccLen(d)).slice(0, 7); }
  /** "7712408" -> "771 2408" (Maldives numbers are 7 digits). */
  function prettyLocal(v) { var d = localDigits(v); return d.length > 3 ? d.slice(0, 3) + ' ' + d.slice(3) : d; }
  /** Field-error content: icon + one text run (the error row is a flex row, so text and links stay together). */
  function errHTML(msg, extra) { return msg ? icon('alert') + '<span>' + esc(msg) + (extra || '') + '</span>' : ''; }
  function localPart(phone) { var d = digitsOf(phone); if (d.length > 7 && d.indexOf('960') === 0) d = d.slice(3); return d.slice(-7); }
  function fullPhone(local) { return '+960 ' + prettyLocal(local); }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function tierClass(m) { return 'tier-' + W.tier(m).id; }
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
  /** Drinks come from the menu's "drinks" group (water and soft drinks are not favourites). */
  function drinkCategories() {
    return W.categories().filter(function (c) { return c.group === 'drinks' && c.id !== 'soft'; });
  }
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

  /* ---------- Reward pictures (their own menu photography) ---------- */
  // [match, photo, zoom, focus]: a square crop into the dish the reward names.
  var THUMBS = [
    [/cookie/i, 'menu/cookies-brownie', '205%', '88% 13%'],
    [/brownie/i, 'menu/cookies-brownie', '190%', '22% 72%'],
    [/shake/i, 'menu/milkshake-juice', '200%', '96% 30%'],
    [/juice/i, 'menu/milkshake-juice', '200%', '6% 62%'],
    [/rice|noodle/i, 'menu/fried-noodles-rice', '185%', '14% 74%'],
    [/breakfast|kulhimas|mas.huni/i, 'menu/breakfast-spread', '170%', '62% 30%'],
    [/sandwich|wrap|burger/i, 'menu/wraps-sandwiches', '175%', '30% 78%'],
    [/fries|onion|salad/i, 'menu/fries-rings-salad', '170%', '62% 22%'],
    [/iced|cold|float|milo/i, 'photos/fav-iced-spanish', '150%', '50% 42%'],
    [/coffee|latte|cappuccino|espresso|americano|tea|chocolate|drink/i, 'photos/menu-coffee', '128%', '40% 36%']
  ];
  function rewardPhoto(r) {
    var name = String(r.name || '');
    for (var i = 0; i < THUMBS.length; i++) if (THUMBS[i][0].test(name)) return THUMBS[i];
    // A reward named after a dish on the menu borrows that dish's photo.
    var hit = W.menu().filter(function (it) { return it.photo && name.toLowerCase().indexOf(it.name.toLowerCase()) > -1; })[0];
    return hit ? [null, 'menu/' + hit.photo, '150%', '50% 45%'] : null;
  }
  function isKaraokeReward(r) { return r.kind === 'karaoke' || /karaoke/i.test(r.name || ''); }
  function thumbHTML(r) {
    if (isKaraokeReward(r)) return '<span class="rthumb rthumb--leather" aria-hidden="true">' + icon('mic') + '</span>';
    var t = rewardPhoto(r);
    if (t) return '<span class="rthumb" aria-hidden="true" style="background-image:url(' + IMG + t[1] + '-800.webp);background-size:' + t[2] + ';background-position:' + t[3] + '"></span>';
    return '<span class="rthumb rthumb--plain" aria-hidden="true"><span class="rthumb__mark"></span></span>';
  }

  /* ---------- Karaoke (bookings live in the store; this only reads + formats) ---------- */
  var OFFSET_MS = (W.info.utcOffsetMinutes || 300) * 6e4;
  function keyTs(key, hour) { var a = String(key).split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2], hour || 0) - OFFSET_MS; }
  function keyParts(key) { var a = String(key).split('-'), d = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); return { y: +a[0], mo: +a[1] - 1, d: +a[2], day: d.getUTCDay() }; }
  function hourLabel(h) { return W.fmt.clock(String(h).padStart(2, '0') + ':00'); }   // 24 -> "midnight"
  /** "8:15 PM" never breaks between the time and AM/PM in a wrapping title. */
  function keepTimes(s) { return String(s).replace(/(\d) (AM|PM)\b/g, '$1\u00a0$2'); }
  function bookingTimes(b) { return hourLabel(b.start) + ' to ' + hourLabel(b.start + b.hours); }
  function relDay(key) {
    var t = W.karaokeToday();
    return key === t ? 'Today' : key === W.karaokeAddDays(t, 1) ? 'Tomorrow' : '';
  }
  function shortDate(key) { var p = keyParts(key); return DAYS_SHORT[p.day] + ' ' + p.d + ' ' + MONTHS_SHORT[p.mo]; }
  function longDate(key) { var p = keyParts(key); return DAYS_FULL[p.day] + ' ' + p.d + ' ' + MONTHS_FULL[p.mo]; }
  /** The member's bookings: linked to the card, or made with the card's phone number. */
  function memberBookings(m) {
    var seen = {}, out = [];
    var list = W.karaokeBookings({ memberId: m.id });
    if (localPart(m.phone).length === 7) list = list.concat(W.karaokeBookings({ phone: m.phone }));
    list.forEach(function (b) { if (!seen[b.id]) { seen[b.id] = 1; out.push(b); } });
    return out;
  }
  function isUpcoming(b) { return (b.status === 'confirmed' || b.status === 'checked-in') && keyTs(b.date, b.start + b.hours) > Date.now(); }
  function hasStarted(b) { return keyTs(b.date, b.start) <= Date.now(); }
  // House rule on the booking page: a room is held 15 minutes past the start time.
  var HOLD_MIN = 15;
  function holdLabel(b) { return W.fmt.clock(String(b.start).padStart(2, '0') + ':' + String(HOLD_MIN).padStart(2, '0')); }
  /** Where a booking stands inside its own hours: 'in-room' (staff checked them in), 'starting' (start passed,
      room still held), 'late' (hold over, not checked in). Empty outside its hours. Only check-in means "in the room". */
  function phase(b) {
    var now = Date.now(), s = keyTs(b.date, b.start), e = keyTs(b.date, b.start + b.hours);
    if (now < s || now >= e) return '';
    if (b.status === 'checked-in') return 'in-room';
    if (b.status === 'confirmed') return now < s + HOLD_MIN * 6e4 ? 'starting' : 'late';
    return '';
  }
  function inRoomNow(b) { return phase(b) === 'in-room'; }
  function byWhen(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.start - b.start; }
  function splitBookings(m) {
    var all = memberBookings(m);
    return {
      upcoming: all.filter(isUpcoming).sort(byWhen),
      past: all.filter(function (b) { return !isUpcoming(b); }).sort(function (a, b) { return byWhen(b, a); })
    };
  }
  function nextBooking(m) { return splitBookings(m).upcoming[0] || null; }
  function bookingBeans(m, b) {
    var a = W.activity(m.id).filter(function (x) { return x.type === 'earn' && x.note === b.id; })[0];
    return a ? a.beans : 0;
  }
  function statusText(b) {
    if (isUpcoming(b)) {
      var ph = phase(b);
      return ph === 'in-room' ? 'In the room now' : ph === 'starting' ? 'Starting now' : ph === 'late' ? 'Not checked in yet' :
        b.status === 'checked-in' ? 'Checked in' : 'Confirmed';
    }
    return { completed: 'Completed', cancelled: 'Cancelled', 'no-show': 'Missed', confirmed: 'Time passed', 'checked-in': 'Finished' }[b.status] || b.status;
  }
  function isKaraokeEarn(a) { return a.type === 'earn' && ((a.items && /^Karaoke:/i.test(a.items[0] || '')) || /^K-\d+$/.test(a.note || '')); }
  /** The member's activity, plus a "booked" line for any booking on their card that the log has no entry for
      (the demo seed creates bookings without one). Bookings are the record; the log only mirrors them. */
  function memberActivity(m, limit) {
    var list = W.activity(m.id), logged = {};
    list.forEach(function (a) { if (a.code) logged[a.code] = 1; if (/^K-\d+$/.test(a.note || '')) logged[a.note] = 1; });
    var cap = W.doc.seededAt || Date.now();
    var extra = W.karaokeBookings({ memberId: m.id }).filter(function (b) { return !logged[b.id]; }).map(function (b) {
      return { id: 'kb-' + b.id, type: 'booking', memberId: m.id, beans: 0, code: b.id, derived: true,
        ts: Math.min(b.createdAt || cap, cap), note: 'Karaoke booked: ' + b.roomName + ', ' + W.karaokeDateLabel(b.date) + ' at ' + hourLabel(b.start) };
    });
    if (extra.length) list = list.concat(extra).sort(function (a, b) { return b.ts - a.ts; });
    return limit ? list.slice(0, limit) : list;
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
    shownFree: null,
    fullUntil: 0,
    fullTimer: 0,
    signin: { step: 'phone', local: '', error: '', notFound: false, busy: false },
    joinPrefill: '',
    filter: 'all',
    activityLimit: 40,
    profileDirty: false,
    codeStatus: {},
    welcome: false
  };

  /* ------------------------------------------------------------------ */
  /* Membership card: their leather menu cover, gold foil                 */
  /* ------------------------------------------------------------------ */
  /** Card markup. Without a member it renders a sample card (sign-in page). */
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
              '<span class="mcard__top">' +
                '<span class="mcard__logo" aria-hidden="true"></span>' +
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

  /** New beans: the foil figure catches the light once. */
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

  /* A small tilt under the pointer (or finger). The tilt lives on .mcard__tilt, the flip on .mcard__flip
     (two wrappers, so the two transforms never fight). */
  function bindTilt(host) {
    var card = $('.mcard', host);
    if (!card) return;
    var tiltEl = $('.mcard__tilt', card);
    var cur = { x: 0, y: 0 }, target = { x: 0, y: 0 }, raf = 0, dragging = false, downAt = null;
    card._moved = false;

    function apply() {
      tiltEl.style.setProperty('--rx', (-cur.y * 8).toFixed(2) + 'deg');
      tiltEl.style.setProperty('--ry', (cur.x * 11).toFixed(2) + 'deg');
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
  /* Side column (open status, card, waiting reward)                     */
  /* ------------------------------------------------------------------ */
  function renderSide(m, fresh) {
    var side = $('#side');
    if (!m) { side.innerHTML = ''; return; }
    if (fresh || !$('#side-card', side)) {
      side.innerHTML =
        '<div class="side__head" id="side-head"></div>' +
        '<div class="side__card" id="side-card"></div>' +
        '<div class="side__under">' +
          '<button class="card-hint" id="card-hint" type="button" data-act="flip"></button>' +
          '<span class="side__hinttext">Staff scan it to add your beans</span>' +
        '</div>' +
        '<div id="side-wait"></div>' +
        '<div id="side-next"></div>';
      buildSideCard(m);
    }
    // No greeting: the card carries the name. The column opens on a plain line about the café, then the card.
    var status = W.openStatus();
    $('#side-head').innerHTML =
      (S.view === 'card' ? '<h1 class="visually-hidden" tabindex="-1" data-focus>Your White Rewards card</h1>' : '') +
      '<p class="open-status ' + (status.open ? 'is-open' : 'is-closed') + '"><span class="open-status__dot" aria-hidden="true"></span>' +
        '<span>' + esc(status.label) + (status.detail ? (status.open ? ' ' : ', ') + esc(status.detail) : '') + '</span></p>';
    // The Rewards view lists ready codes itself; the code view is the code.
    var ready = S.view === 'rewards' ? [] : readyCodes(m).filter(function (r) { return !(S.view === 'code' && r.code === S.arg); });
    $('#side-wait').innerHTML = ready.map(function (r) {
      return '<a class="waiting" href="#code/' + encodeURIComponent(r.code) + '">' +
        '<span class="waiting__main"><span class="waiting__title">Your reward is ready</span>' +
        '<span class="waiting__sub">' + esc(r.rewardName) + ', <span class="nowrap"><span class="num" data-until="' + r.expires + '">' + mmss(r.expires - Date.now()) + '</span> left</span></span></span>' +
        '<span class="waiting__go">Show code' + icon('arrowRight') + '</span></a>';
    }).join('') +
    // A free drink from the coffee card is used by showing the card, so the row turns the card to its QR code.
    (m.freeDrinks > 0 ?
      '<button class="waiting waiting--free" type="button" data-act="show-qr">' +
        '<span class="waiting__main"><span class="waiting__title">' + (m.freeDrinks === 1 ? 'A free drink is ready' : F.num(m.freeDrinks) + ' free drinks are ready') + '</span>' +
        '<span class="waiting__sub">Show your QR code at the counter</span></span>' +
        '<span class="waiting__go">Show QR' + icon('qr') + '</span></button>' : '');
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
      '</span>' + icon('arrowRight', 'nextup__chev') + '</span>';
    if (next) {
      var pct = Math.max(2, Math.min(100, m.beans / next.cost * 100));
      html += '<span class="nextup__goal"><span class="nextup__name">' + (can.length ? 'Next: ' : '') + esc(next.name) + '</span>' +
        '<span class="nextup__need num">' + F.num(next.cost - m.beans) + ' to go</span></span>' +
        '<span class="meter" aria-hidden="true"><span class="meter__fill" style="--pct:' + pct.toFixed(1) + '%"></span></span>';
    } else {
      html += '<span class="nextup__goal"><span class="nextup__name">Every reward on the list is yours to pick.</span></span>';
    }
    return html + '</a>';
  }

  /* ------------------------------------------------------------------ */
  /* Views                                                               */
  /* ------------------------------------------------------------------ */
  var VIEWS = {};

  /* ---------- Sign in ---------- */
  VIEWS.signin = function () {
    var st = S.signin;
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
          '<p class="field-error" id="otp-err" role="alert">' + errHTML(st.error) + '</p>' +
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
              '<input class="input num" id="si-phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="771 2408" maxlength="20" value="' + esc(prettyLocal(st.local)) + '" aria-describedby="si-phone-err">' +
            '</div>' +
            '<p class="field-error" id="si-phone-err" role="alert">' + errHTML(st.error) + '</p>' +
            (st.notFound ? '<a class="btn btn--ghost btn--sm notfound-join" href="#join" data-act="join-with-number">Join free with this number</a>' : '') +
          '</div>' +
          '<button class="btn btn--block" type="submit">Send code</button>' +
        '</form>';
    }
    return '' +
      '<div class="auth">' +
        '<div class="auth__head">' +
          '<h1 class="auth__title" tabindex="-1" data-focus>White Rewards</h1>' +
          '<p class="auth__lede">The loyalty card for White Coffee House in Hulhumalé. Beans on every bill, a stamp for every drink.</p>' +
        '</div>' +
        '<div class="auth__show">' +
          authStageHTML() +
          perksListHTML() +
        '</div>' +
        '<div class="auth__panel">' +
          panel +
          '<div class="or" aria-hidden="true"><span>or</span></div>' +
          '<button class="btn btn--ghost btn--block" type="button" data-act="demo">Explore with a demo account</button>' +
          '<p class="auth-row">New here? <a class="link" href="#join">Join free</a></p>' +
          '<p class="demo-note auth-demo"><span>Demo: any 4-digit code works. Try <span class="nowrap"><button class="link-btn num" type="button" data-act="fill-demo">+960 771 2408</button>.</span></span></p>' +
        '</div>' +
      '</div>';
  };

  /** One of their menu photographs with a sample card laid on it. */
  function authStageHTML() {
    return '<div class="auth__stage">' +
      '<img class="auth__photo" src="' + IMG + 'menu/breakfast-spread-800.webp" srcset="' + IMG + 'menu/breakfast-spread-800.webp 800w, ' + IMG + 'menu/breakfast-spread-1086.webp 1086w" sizes="(min-width: 900px) 300px, 60vw" width="800" height="1131" alt="Maldivian breakfast, chicken and mushroom soup and the grilled breakfast platter, from the White Coffee House menu">' +
      '<div class="auth__preview" aria-hidden="true">' + cardHTML(null, {}) + '</div>' +
    '</div>';
  }

  function perksListHTML() {
    var p = W.program;
    return '<dl class="facts">' +
      '<div><dt class="num">' + F.num(1) + ' bean</dt><dd>for every MVR ' + esc(p.mvrPerBean) + ' you spend</dd></div>' +
      '<div><dt>Every ' + ordinal(p.stampsForFree) + '</dt><dd>drink is free on your coffee card</dd></div>' +
      '<div><dt class="num">' + F.num(p.birthdayBonus) + ' beans</dt><dd>in your birthday week</dd></div>' +
      '<div><dt>Karaoke</dt><dd>room bookings earn beans too</dd></div>' +
    '</dl>';
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
          '<h1 class="auth__title" tabindex="-1" data-focus>Join White Rewards</h1>' +
          '<p class="auth__lede">It’s free. ' + F.num(p.welcomeBonus) + ' beans go on your card the moment you join.</p>' +
        '</div>' +
        '<div class="auth__show">' +
          authStageHTML() +
          perksListHTML() +
        '</div>' +
        '<div class="auth__panel">' +
          (cur ? '<p class="notice">You’re signed in as ' + esc(cur.name) + '. Joining switches to the new card.</p>' : '') +
          '<form class="auth-form" data-form="join" novalidate>' +
            '<h2 class="panel-title">Create your card</h2>' +
            '<div class="field"><label for="j-name">Full name</label>' +
              '<input class="input" id="j-name" name="name" autocomplete="name" placeholder="e.g. Aminath Ali" aria-describedby="j-name-err">' +
              '<p class="field-error" id="j-name-err" role="alert"></p></div>' +
            '<div class="field"><label for="j-phone">Phone number</label>' +
              '<div class="phone-input"><span class="phone-input__cc" aria-hidden="true">+960</span>' +
              '<input class="input num" id="j-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="771 2408" maxlength="20" value="' + esc(prettyLocal(S.joinPrefill)) + '" aria-describedby="j-phone-err j-phone-hint"></div>' +
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
          '<p class="demo-note auth-demo"><span>Demo: nothing is sent anywhere.</span></p>' +
        '</div>' +
      '</div>';
  };

  /* ---------- Card (home) ---------- */
  /** The next karaoke booking, as a strip of their leather. */
  function bookingStripHTML(b) {
    var p = keyParts(b.date), ph = phase(b), rel = relDay(b.date);
    var label = ph === 'in-room' ? 'Karaoke, in the room now' : ph === 'starting' ? 'Karaoke, starting now' : ph === 'late' ? 'Karaoke, running late?' :
      'Karaoke' + (rel ? ', ' + rel.toLowerCase() : '') + (b.status === 'checked-in' ? ', checked in' : '');
    var when = ph === 'in-room' ? 'until ' + hourLabel(b.start + b.hours) : ph === 'starting' ? 'held until ' + holdLabel(b) : bookingTimes(b);
    return '<a class="kstrip on-leather" href="#karaoke">' +
      '<span class="kstrip__when" aria-hidden="true"><span class="kstrip__dow">' + DAYS_SHORT[p.day] + '</span><span class="kstrip__d num">' + p.d + '</span><span class="kstrip__mo">' + MONTHS_SHORT[p.mo] + '</span></span>' +
      '<span class="kstrip__main">' +
        '<span class="kstrip__label">' + esc(label) + '</span>' +
        '<span class="kstrip__title">' + esc(b.roomName) + ', ' + esc(keepTimes(when)) + '</span>' +
        '<span class="kstrip__sub"><span class="visually-hidden">' + esc(longDate(b.date)) + ', </span><span class="num">' + esc(b.id) + '</span>, ' + plural(b.guests, 'guest') + '</span>' +
      '</span>' +
      '<span class="kstrip__go">Manage' + icon('arrowRight') + '</span>' +
    '</a>';
  }

  VIEWS.card = function (m) {
    var p = W.program, tp = W.tierProgress(m), tier = tp.tier, next = tp.next;
    var n = p.stampsForFree;
    // The store wraps a full card straight back to 0 and adds a free drink. When that happens while this card
    // is on screen (staff at the counter), show the full card for a moment, then the fresh one.
    var live = $('#view').getAttribute('data-v') === 'card';
    if (live && !reduced() && S.shownStamps != null && S.shownFree != null && m.freeDrinks > S.shownFree) {
      S.fullUntil = Date.now() + FULL_MS;
      clearTimeout(S.fullTimer);
      S.fullTimer = setTimeout(function () {
        S.fullUntil = 0;
        S.shownStamps = 0;               // stamps carried over onto the new card land too
        if (S.view === 'card') refresh();
      }, FULL_MS);
    }
    S.shownFree = m.freeDrinks;
    var showFull = S.fullUntil > Date.now();
    var stamps = showFull ? n : Math.min(m.stamps, n);
    var cols = n <= 6 ? n : Math.ceil(n / 2);
    // Stamps added since the card was last drawn (e.g. by staff at the counter) land with a small press.
    var prevStamps = S.shownStamps;
    S.shownStamps = stamps;
    var slots = '';
    for (var i = 0; i < n; i++) {
      var last = i === n - 1, filled = i < stamps;
      var landed = filled && prevStamps != null && i >= prevStamps;
      slots += '<li class="slot' + (filled ? ' is-filled' : '') + (landed ? ' is-new' : '') + (last ? ' is-free' : '') + '" style="--i:' + i + ';--rot:' + STAMP_ROT[i % STAMP_ROT.length] + 'deg">' +
        '<span class="slot__ring">' + (filled ? '<span class="slot__stamp"></span>' : '<span class="slot__num num" aria-hidden="true">' + (last ? 'Free' : i + 1) + '</span>') + '</span>' +
        '<span class="visually-hidden">' + (filled ? 'Stamped' : last ? 'Free drink' : 'Empty') + '</span></li>';
    }
    var toGo = n - stamps;
    var stampLine =
      showFull ? 'Your card is full.' :
      // "Stamps for a free drink" was lowered below what is already on this card: the store turns it
      // into a free drink on the next visit.
      m.stamps >= n ? 'Card full. Your free drink is added at your next visit.' :
      stamps === 0 ? (m.freeDrinks > 0 ? 'Card complete. New stamps start with your next drink.' : 'Every handcrafted drink earns a stamp.') :
      toGo === 1 ? 'One more drink and the next one is free.' :
      plural(toGo, 'more drink') + ' until a free one.';

    var kb = nextBooking(m);
    var karaokeBlock = kb ? bookingStripHTML(kb) : '';

    var stampBlock = '' +
      '<section class="sect stamps" aria-labelledby="stamps-h">' +
        '<div class="sect__head">' +
          '<h2 class="sect__h" id="stamps-h">Coffee card</h2>' +
          '<span class="sect__aside num">' + stamps + ' of ' + n + '</span>' +
        '</div>' +
        '<ol class="slots" role="list" style="--cols:' + cols + ';--first:' + (prevStamps || 0) + '" aria-label="' + stamps + ' of ' + n + ' stamps">' + slots + '</ol>' +
        '<p class="stamps__line">' + esc(stampLine) + '</p>' +
        (m.freeDrinks > 0 ?
          '<p class="free-line"><strong>' + (m.freeDrinks === 1 ? 'A free drink is ready.' : F.num(m.freeDrinks) + ' free drinks are ready.') + '</strong> Show your card at the counter to use it.</p>' : '') +
      '</section>';

    var tierBlock = '' +
      '<section class="sect tierp" aria-labelledby="tier-h">' +
        '<div class="sect__head">' +
          '<h2 class="sect__h" id="tier-h">' + esc(tier.name) + ' member</h2>' +
          '<span class="sect__aside num">' + esc(F.num(m.lifetimeBeans)) + ' beans earned</span>' +
        '</div>' +
        (next ?
          '<p class="tierp__goal"><strong class="num">' + F.num(tp.need) + ' beans</strong> to ' + esc(next.name) + '</p>' :
          '<p class="tierp__goal"><strong>You’re on the top tier.</strong> Thank you for being a regular.</p>') +
        '<div class="meter meter--tier" role="progressbar" aria-label="Progress to ' + esc(next ? next.name : tier.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(tp.pct * 100) + '">' +
          '<span class="meter__fill" style="--pct:' + (tp.pct * 100).toFixed(1) + '%"></span></div>' +
        '<div class="tierp__ends num"><span>' + esc(tier.name) + ' · ' + F.num(tier.min) + '</span>' + (next ? '<span>' + esc(next.name) + ' · ' + F.num(next.min) + '</span>' : '') + '</div>' +
        '<div class="perks-cols">' +
          '<div><h3 class="perks-h">Your perks</h3><ul class="perks" role="list">' + tier.perks.map(function (x) { return '<li>' + esc(clean(x)) + '</li>'; }).join('') + '</ul></div>' +
          (next ? '<div class="perks-next"><h3 class="perks-h">At ' + esc(next.name) + '</h3><ul class="perks" role="list">' + next.perks.map(function (x) { return '<li>' + esc(clean(x)) + '</li>'; }).join('') + '</ul></div>' : '') +
        '</div>' +
      '</section>';

    var offers = W.offers();
    var offersBlock = offers.length ? '' +
      '<section class="sect" aria-labelledby="offers-h">' +
        '<div class="sect__head"><h2 class="sect__h" id="offers-h">Member offers</h2></div>' +
        '<ul class="offers" role="list">' + offers.map(function (o) {
          return '<li class="offer"><h3 class="offer__title">' + esc(clean(o.title)) + '</h3>' +
            (o.body ? '<p class="offer__body">' + esc(clean(o.body)) + '</p>' : '') + '</li>';
        }).join('') + '</ul>' +
      '</section>' : '';

    var recent = memberActivity(m, 3);
    var recentBlock = '' +
      '<section class="sect" aria-labelledby="recent-h">' +
        '<div class="sect__head"><h2 class="sect__h" id="recent-h">Recent activity</h2><a class="link-more" href="#activity">All activity' + icon('arrowRight') + '</a></div>' +
        (recent.length ? '<ul class="acts" role="list">' + recent.map(actRow).join('') + '</ul>' : '<p class="empty">Your visits will show up here.</p>') +
      '</section>';

    return '<h2 class="visually-hidden">Your card details</h2>' + karaokeBlock + stampBlock + tierBlock + offersBlock + recentBlock;
  };

  /* ---------- Rewards ---------- */
  VIEWS.rewards = function (m) {
    var list = W.rewards();
    var ready = readyCodes(m);
    var readyBlock = ready.length ? '' +
      '<section class="sect sect--first" aria-labelledby="ready-h"><div class="sect__head"><h2 class="sect__h" id="ready-h">Ready to collect</h2></div>' +
      '<div class="ready-list">' + ready.map(function (r) {
        return '<a class="waiting" href="#code/' + encodeURIComponent(r.code) + '">' +
          '<span class="waiting__main"><span class="waiting__title">' + esc(r.rewardName) + '</span>' +
          '<span class="waiting__sub"><span class="nowrap">Code <span class="num">' + esc(r.code) + '</span></span>, <span class="nowrap"><span class="num" data-until="' + r.expires + '">' + mmss(r.expires - Date.now()) + '</span> left</span></span></span>' +
          '<span class="waiting__go">Show code' + icon('arrowRight') + '</span></a>';
      }).join('') + '</div></section>' : '';

    var items = list.map(function (r) {
      var can = m.beans >= r.cost, short = r.cost - m.beans;
      return '<li class="reward' + (can ? ' is-afford' : '') + '">' +
        thumbHTML(r) +
        '<div class="reward__main">' +
          '<h3 class="reward__name">' + esc(r.name) + '</h3>' +
          (can ? '' : '<p class="reward__state"><span class="num">' + F.num(short) + '</span> more ' + (short === 1 ? 'bean' : 'beans') + ' to go</p>') +
          (isKaraokeReward(r) ? '<p class="reward__note">Book the room first, then redeem at the counter on the night.</p>' : '') +
        '</div>' +
        '<span class="reward__cost num"><span class="visually-hidden">Costs </span>' + F.num(r.cost) + '<span class="visually-hidden"> beans</span></span>' +
        (can ? '<button class="btn btn--ghost btn--sm reward__btn" type="button" data-act="redeem" data-id="' + esc(r.id) + '" aria-label="Redeem ' + esc(r.name) + ' for ' + F.num(r.cost) + ' beans">Redeem</button>' : '') +
      '</li>';
    }).join('');

    return '' +
      '<header class="vhead">' +
        '<h1 class="vhead__title" tabindex="-1" data-focus>Rewards</h1>' +
        '<p class="vhead__sub">You have <strong class="num" data-f="balance">' + F.num(m.beans) + ' beans</strong> to spend.</p>' +
      '</header>' +
      readyBlock +
      (list.length ?
        '<section class="sect' + (ready.length ? '' : ' sect--first') + '" aria-labelledby="all-h">' +
          '<div class="rewards-head"><h2 class="rewards-head__h" id="all-h">' + 'All rewards' + '</h2><span class="rewards-head__col" aria-hidden="true">Beans</span></div>' +
          '<ul class="rewards" role="list">' + items + '</ul></section>' :
        '<p class="empty">No rewards right now. Check back soon.</p>') +
      '<p class="footnote">Redeem when you’re at the café. Your code stays valid for ' + plural(W.program.redemptionMinutes, 'minute') + '.</p>';
  };

  /* ---------- Code screen ---------- */
  VIEWS.code = function (m, code) {
    var r = W.redemption(code);
    var back = '<a class="link-back" href="#rewards">' + icon('arrowLeft') + 'Rewards</a>';
    if (!r || r.memberId !== m.id) {
      return back + '<div class="codebox codebox--state">' +
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
        '<span class="served-mark" aria-hidden="true"></span>' +
        '<h1 class="state-title state-title--big" tabindex="-1" data-focus>Served</h1>' +
        '<p class="state-text"><strong>' + esc(r.rewardName) + '</strong> was handed over' + (r.servedBy ? ' by ' + esc(r.servedBy) : '') + (r.servedAt ? ' at ' + esc(F.time(r.servedAt)) : '') + '. Enjoy it.</p>' +
        '<p class="state-small num">' + esc(r.code) + ', ' + F.num(r.cost) + ' beans</p>' +
        '<a class="btn" href="#card">Back to my card</a></div>';
    }
    if (status === 'expired') {
      return back + '<div class="codebox codebox--state">' +
        '<h1 class="state-title" tabindex="-1" data-focus>This code has expired</h1>' +
        '<p class="state-text">' + esc(r.code) + ' for ' + esc(r.rewardName) + ' was valid until ' + esc(F.time(r.expires)) + '. Ask at the counter and the team will sort it out.</p>' +
        '<a class="btn" href="#rewards">Back to rewards</a></div>';
    }
    if (status === 'cancelled') {
      return back + '<div class="codebox codebox--state">' +
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

  /* ---------- Karaoke ---------- */
  function bookingRowHTML(m, b) {
    var p = keyParts(b.date), up = isUpcoming(b), st = statusText(b);
    var beans = b.status === 'completed' && b.memberId === m.id ? bookingBeans(m, b) : 0;
    var sub = ['<span class="num">' + esc(b.id) + '</span>', plural(b.guests, 'guest'), '<span class="num">' + esc(F.mvr(b.total)) + '</span>'];
    // Why a booking earns no beans: its own line, so it wraps instead of being clipped with the meta row.
    var note = b.memberId === m.id ? '' :
      up ? 'Made with your number, not your card. Ask the team to link it for beans.' :
      b.status === 'completed' ? 'Made with your number, not your card, so it earned no beans.' :
      'Made with your number, not your card.';
    return '<li class="kbook' + (up ? ' is-up' : ' is-past') + ' is-' + esc(b.status) + '">' +
      '<span class="kbook__date num"><span class="kbook__dow">' + DAYS_SHORT[p.day] + '</span><span class="kbook__d">' + p.d + ' ' + MONTHS_SHORT[p.mo] + '</span></span>' +
      '<span class="kbook__main">' +
        '<span class="kbook__title">' + esc(b.roomName) + ', ' + esc(keepTimes(bookingTimes(b))) + '</span>' +
        '<span class="act__sub"><span class="act__subin">' + sub.map(function (s) { return '<span class="si">' + s + '</span>'; }).join('') + '</span></span>' +
        (note ? '<span class="kbook__note">' + esc(note) + '</span>' : '') +
      '</span>' +
      '<span class="kbook__end">' +
        '<span class="kbook__status">' + esc(st) + '</span>' +
        (beans ? '<span class="kbook__beans num">+' + F.num(beans) + ' beans</span>' : '') +
        (up && b.status === 'confirmed' && !hasStarted(b) ? '<button class="link-btn kbook__cancel" type="button" data-act="cancel-booking" data-id="' + esc(b.id) + '" aria-label="Cancel booking ' + esc(b.id) + '">Cancel</button>' : '') +
      '</span>' +
    '</li>';
  }

  function ticketHTML(m, b) {
    var p = keyParts(b.date), rel = relDay(b.date), ph = phase(b);
    var linked = b.memberId === m.id;
    var pay = linked ?
      'Pay at the café, plus 10% service charge and 8% GST. You earn beans on the room bill.' :
      'Booked with your phone number. Pay at the café, plus 10% service charge and 8% GST. Ask the team to link it to your card for beans.';
    // Start time passed but staff have not checked them in: say what that means, not "in the room".
    var timing = ph === 'starting' ? 'We hold the room until ' + holdLabel(b) + '. Show the reference ' + b.id + ' at the counter. ' :
      ph === 'late' ? 'We held the room until ' + holdLabel(b) + '. On your way? Ask at the counter when you arrive. ' : '';
    return '<section class="ticket on-leather" aria-labelledby="ticket-h">' +
      '<div class="ticket__top">' +
        '<p class="ticket__label">' + (ph === 'in-room' ? 'In the room now' : ph === 'starting' ? 'Starting now' : ph === 'late' ? 'Running late?' :
          b.status === 'checked-in' ? 'Checked in' : 'Your next booking') + '</p>' +
        '<p class="ticket__ref num">' + esc(b.id) + '</p>' +
      '</div>' +
      '<h2 class="ticket__room" id="ticket-h">' + esc(b.roomName) + '</h2>' +
      '<p class="ticket__when">' + (rel ? '<span class="ticket__rel">' + rel + ', </span>' : '') + esc(DAYS_FULL[p.day] + ' ' + p.d + ' ' + MONTHS_FULL[p.mo]) + '</p>' +
      '<dl class="ticket__facts">' +
        '<div><dt>Time</dt><dd>' + esc(bookingTimes(b)) + '</dd></div>' +
        '<div><dt>Length</dt><dd>' + plural(b.hours, 'hour') + '</dd></div>' +
        '<div><dt>Guests</dt><dd class="num">' + F.num(b.guests) + '</dd></div>' +
        '<div><dt>Room bill</dt><dd class="num">' + esc(F.mvr(b.total)) + '</dd></div>' +
      '</dl>' +
      '<p class="ticket__note">' + (timing ? '<strong>' + esc(timing) + '</strong>' : '') + esc(pay) + '</p>' +
      '<div class="ticket__actions">' +
        '<a class="btn btn--foil btn--sm" href="' + KARAOKE_PAGE + '?ref=' + encodeURIComponent(b.id) + '">Booking details</a>' +
        (b.status === 'confirmed' && !hasStarted(b) ? '<button class="btn btn--leather-ghost btn--sm" type="button" data-act="cancel-booking" data-id="' + esc(b.id) + '">Cancel booking</button>' : '') +
      '</div>' +
    '</section>';
  }

  VIEWS.karaoke = function (m) {
    var bk = splitBookings(m);
    var first = bk.upcoming[0], rest = bk.upcoming.slice(1);
    var rooms = W.karaokeRooms();
    var rules = W.karaokeRules();
    var kr = W.rewards().filter(isKaraokeReward)[0];

    var roomsBlock = rooms.length ? '' +
      '<section class="sect" aria-labelledby="rooms-h">' +
        '<div class="sect__head"><h2 class="sect__h" id="rooms-h">The rooms</h2><span class="sect__aside">' + esc(hourLabel(rules.open)) + ' to ' + esc(hourLabel(rules.close)) + ', every day</span></div>' +
        '<table class="rooms"><thead><tr><th scope="col">Room</th><th scope="col">Fits</th><th scope="col" class="rooms__rate">Per hour</th></tr></thead><tbody>' +
          rooms.map(function (r) { return '<tr><th scope="row">' + esc(r.name) + '</th><td class="num">' + F.num(r.capacity) + ' people</td><td class="num rooms__rate">' + esc(F.mvr(r.rate)) + '</td></tr>'; }).join('') +
        '</tbody></table>' +
        (kr ? '<p class="rooms__reward">' +
          (m.beans >= kr.cost ?
            'You have enough beans for <a class="link" href="#rewards">' + esc(kr.name.charAt(0).toLowerCase() + kr.name.slice(1)) + '</a> (' + F.num(kr.cost) + ' beans). Book the room, then redeem it at the counter on the night.' :
            esc(kr.name) + ' is a reward for ' + F.num(kr.cost) + ' beans. You have <span class="num">' + F.num(m.beans) + '</span>.') +
          '</p>' : '') +
      '</section>' : '';

    return '' +
      '<header class="vhead vhead--row">' +
        '<div><h1 class="vhead__title" tabindex="-1" data-focus>Karaoke</h1>' +
        '<p class="vhead__sub">Your room bookings at White Coffee House, made with your card or your phone number.</p></div>' +
        '<a class="btn vhead__cta" href="' + KARAOKE_PAGE + '#book">Book a room</a>' +
      '</header>' +
      (first ? ticketHTML(m, first) :
        '<section class="sect sect--first kempty"><p class="kempty__text">No karaoke booked.</p><p class="kempty__sub">Pick a room and a time on the booking page. It fills in your name and number from your card, so the room bill earns beans.</p></section>') +
      (rest.length ? '<section class="sect" aria-labelledby="kup-h"><div class="sect__head"><h2 class="sect__h" id="kup-h">Also coming up</h2></div><ul class="kbooks" role="list">' + rest.map(function (b) { return bookingRowHTML(m, b); }).join('') + '</ul></section>' : '') +
      (bk.past.length ? '<section class="sect" aria-labelledby="kpast-h"><div class="sect__head"><h2 class="sect__h" id="kpast-h">Past bookings</h2></div><ul class="kbooks" role="list">' + bk.past.slice(0, 12).map(function (b) { return bookingRowHTML(m, b); }).join('') + '</ul></section>' : '') +
      roomsBlock;
  };

  /* ---------- Activity ---------- */
  var FILTERS = {
    all: function () { return true; },
    earned: function (a) { return a.type === 'earn' || a.type === 'bonus' || (a.type === 'adjust' && a.beans > 0); },
    redeemed: function (a) { return a.type === 'redeem' || a.type === 'served' || a.type === 'refund' || a.type === 'free'; },
    karaoke: function (a) { return a.type === 'booking' || isKaraokeEarn(a); }
  };

  function itemsTitle(items) {
    return items.map(function (x) {
      var k = /^Karaoke:\s*(.+?),\s*(\d+)\s*h$/i.exec(x);
      return k ? 'Karaoke, ' + k[1] + ', ' + plural(+k[2], 'hour') : x;
    }).join(', ');
  }

  /** What a row says: a short kind word and a title. */
  function actMeta(a) {
    switch (a.type) {
      case 'earn': return { kind: isKaraokeEarn(a) ? 'Karaoke bill' : 'Visit', title: a.items && a.items.length ? itemsTitle(a.items) : 'Visit' };
      case 'bonus': return { kind: 'Bonus', title: clean(a.note) || 'Bonus beans' };
      case 'redeem': return { kind: 'Redeemed', title: clean(a.note) || 'Reward' };
      case 'served': return { kind: 'Collected', title: clean(String(a.note || 'Reward').replace(/ handed over$/, '')) };
      case 'refund': return { kind: 'Beans returned', title: clean(String(a.note || 'Reward cancelled').replace(/\s*[—–-]\s*beans returned$/i, '')) };
      case 'free': return { kind: 'Coffee card', title: clean(a.note) || 'Free drink' };
      case 'stamp': return { kind: 'Coffee card', title: clean(a.note) || 'Coffee card full' };
      case 'join': return { kind: 'Welcome', title: clean(a.note) || 'Joined White Rewards' };
      case 'adjust': return { kind: 'Adjustment', title: clean(a.note) || 'Adjustment' };
      case 'booking': return { kind: 'Karaoke', title: clean(a.note) || 'Karaoke booking' };
      default: return { kind: 'Update', title: clean(a.note) || 'Update' };
    }
  }

  /** Where a redeemed code stands now: ready (with time left), expired or cancelled. */
  function readyRedemption(a) {
    var r = a.type === 'redeem' && a.code ? W.redemption(a.code) : null;
    return r && r.status === 'ready' && r.expires > Date.now() ? r : null;
  }
  function redeemState(a) {
    var r = a.code ? W.redemption(a.code) : null;
    if (!r) return '';
    // The whole row links to the code (see actRow), so this is a label, not a tiny tap target.
    if (r.status === 'ready' && r.expires > Date.now()) return '<span class="act__flag">Ready, show code</span>';
    if (r.status === 'ready' || r.status === 'expired') return 'Code expired';
    if (r.status === 'cancelled') return 'Cancelled';
    return '';
  }

  function actRow(a) {
    var meta = actMeta(a);
    var p = W.maleParts(a.ts);
    var sub = [esc(meta.kind)];
    if (a.type === 'earn') {
      sub.push('<span class="num">' + esc(F.mvr(a.amount)) + '</span>');
      if (a.stamps) sub.push(plural(a.stamps, 'stamp'));
      if (a.multiplier > 1) sub.push(a.multiplier === 2 ? 'Double beans' : a.multiplier + '× beans');
      if (/^K-\d+$/.test(a.note || '')) sub.push('<span class="num">' + esc(a.note) + '</span>');
    }
    if ((a.type === 'redeem' || a.type === 'served' || a.type === 'booking') && a.code) sub.push('<span class="num">' + esc(a.code) + '</span>');
    if (a.type === 'redeem') { var st = redeemState(a); if (st) sub.push(st); }
    if (a.staff && (a.type === 'served' || a.type === 'free')) sub.push('by ' + esc(a.staff));
    var right = '';
    if (a.beans) right = '<span class="act__beans num ' + (a.beans > 0 ? 'is-plus' : 'is-minus') + '">' + (a.beans > 0 ? '+' : '−') + F.num(Math.abs(a.beans)) + '<span class="visually-hidden"> beans</span></span>';
    else if (a.type === 'free') right = '<span class="act__tag">Free</span>';
    else if (a.type === 'served') right = '<span class="act__tag">Served</span>';
    var ready = readyRedemption(a);
    var href = ready ? '#code/' + encodeURIComponent(ready.code) : a.type === 'booking' ? '#karaoke' : '';
    var hit = href ? '<a class="act__hit" href="' + href + '" aria-label="' + (ready ? 'Show code ' + esc(ready.code) + ' for ' + esc(ready.rewardName) : esc(meta.title) + ', open karaoke bookings') + '"></a>' : '';
    // Each meta item carries its own leading separator; .act__sub clips the one that lands at the start of a line.
    return '<li class="act' + (href ? ' act--link' : '') + '">' + hit +
      '<span class="act__date num"><span>' + p.d + ' ' + MONTHS_SHORT[p.mo] + '</span><span class="act__time">' + esc(F.time(a.ts)) + '</span></span>' +
      '<span class="act__main"><span class="act__title">' + esc(meta.title) + '</span>' +
      '<span class="act__sub"><span class="act__subin">' + sub.map(function (s) { return '<span class="si">' + s + '</span>'; }).join('') + '</span></span></span>' +
      right + '</li>';
  }

  /** What an empty filter means for this member, and where to go next. */
  function emptyActivityHTML(m) {
    if (S.filter === 'redeemed') {
      var list = W.rewards(), first = list[0];
      var line = 'No rewards yet.';
      if (first) {
        line += m.beans >= first.cost ?
          ' You have ' + plural(m.beans, 'bean') + ', enough to redeem one now.' :
          ' You have ' + plural(m.beans, 'bean') + '. ' + plural(first.cost - m.beans, 'more bean') + ' for your first reward, ' + first.name + '.';
      }
      return '<div class="empty"><p>' + esc(line) + '</p>' + (first ? '<a class="btn btn--ghost empty__btn" href="#rewards">See rewards</a>' : '') + '</div>';
    }
    if (S.filter === 'karaoke') return '<div class="empty"><p>Karaoke bookings and room bills on your card show up here.</p><a class="btn btn--ghost empty__btn" href="#karaoke">Karaoke</a></div>';
    if (S.filter === 'earned') return '<div class="empty"><p>Your visits will show up here after your first order.</p></div>';
    return '<div class="empty"><p>Your visits, bonuses and rewards will show up here.</p></div>';
  }

  VIEWS.activity = function (m) {
    var all = memberActivity(m);
    var list = all.filter(FILTERS[S.filter] || FILTERS.all);
    var now = W.maleParts();
    var month = all.filter(function (a) { var p = W.maleParts(a.ts); return p.y === now.y && p.mo === now.mo; });
    var visits = month.filter(function (a) { return a.type === 'earn'; }).length;
    var earned = month.reduce(function (s, a) { return s + (a.beans > 0 && a.type !== 'refund' ? a.beans : 0); }, 0);
    // Rewards the customer actually received: reward codes that were served, plus free coffee-card drinks.
    // A cancelled, expired or still-waiting code is not a reward collected.
    var collected = month.filter(function (a) {
      if (a.type === 'free') return true;
      if (a.type !== 'redeem') return false;
      var r = a.code && W.redemption(a.code);
      return !!r && r.status === 'served';
    }).length;

    var shown = list.slice(0, S.activityLimit);
    var groups = [], cur = null;
    shown.forEach(function (a) {
      var p = W.maleParts(a.ts), key = p.y + '-' + p.mo;
      if (!cur || cur.key !== key) { cur = { key: key, label: MONTHS_FULL[p.mo] + ' ' + p.y, rows: [] }; groups.push(cur); }
      cur.rows.push(a);
    });

    var seg = [['all', 'All'], ['earned', 'Earned'], ['redeemed', 'Redeemed'], ['karaoke', 'Karaoke']].map(function (f) {
      return '<button class="seg__btn" type="button" data-act="filter" data-f="' + f[0] + '" aria-pressed="' + (S.filter === f[0]) + '">' + f[1] + '</button>';
    }).join('');

    return '' +
      '<header class="vhead">' +
        '<h1 class="vhead__title" tabindex="-1" data-focus>Activity</h1>' +
        '<p class="vhead__sub">Every visit, bonus, reward and booking on your card.</p>' +
      '</header>' +
      '<section class="summary" aria-labelledby="sum-h"><h2 class="summary__cap" id="sum-h">' + MONTHS_FULL[now.mo] + ' so far</h2><dl class="summary__grid">' +
        '<div><dt>Visits</dt><dd class="num">' + F.num(visits) + '</dd></div>' +
        '<div><dt>Beans earned</dt><dd class="num">+' + F.num(earned) + '</dd></div>' +
        '<div><dt>Rewards collected</dt><dd class="num">' + F.num(collected) + '</dd></div>' +
      '</dl></section>' +
      '<div class="seg" role="group" aria-label="Filter activity">' + seg + '</div>' +
      (groups.length ? groups.map(function (g) {
        return '<section class="month"><h2 class="month__h">' + esc(g.label) + '</h2><ul class="acts" role="list">' + g.rows.map(actRow).join('') + '</ul></section>';
      }).join('') : emptyActivityHTML(m)) +
      (list.length > shown.length ? '<button class="btn btn--ghost btn--block more-btn" type="button" data-act="more">Show older activity</button>' : '');
  };

  /* ---------- Profile ---------- */
  function profileHeadHTML(m) {
    var tier = W.tier(m);
    return '<div class="phead__main"><h1 class="vhead__title" tabindex="-1" data-focus>' + esc(m.name) + '</h1>' +
      '<p class="phead__meta"><span>' + esc(tier.name) + ' member</span><span class="num">' + esc(m.id) + '</span></p></div>';
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
    var favFound = false;
    var favOpts = '<option value="">No favourite yet</option>' + drinkCategories().map(function (c) {
      var items = W.menu(c.id).filter(function (it) { return it.id !== 'water'; });
      if (!items.length) return '';
      return '<optgroup label="' + esc(c.name) + '">' + items.map(function (it) {
        var sel = it.name === m.favourite; if (sel) favFound = true;
        return '<option' + (sel ? ' selected' : '') + '>' + esc(it.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    if (m.favourite && !favFound) favOpts += '<option selected>' + esc(m.favourite) + '</option>';

    var tiersRows = p.tiers.map(function (t) {
      return '<tr><th scope="row">' + esc(t.name) + '</th><td class="num">' + (t.min ? F.num(t.min) + '+' : 'From joining') + '</td><td class="num">' + esc(t.mult) + '× beans</td></tr>';
    }).join('');

    return '' +
      '<header class="vhead phead" id="p-head">' + profileHeadHTML(m) + '</header>' +
      '<dl class="stats" id="p-stats">' + profileStatsHTML(m) + '</dl>' +

      '<section class="sect" aria-labelledby="edit-h">' +
        '<div class="sect__head"><h2 class="sect__h" id="edit-h">Your details</h2></div>' +
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

      '<section class="sect how" aria-labelledby="how-h">' +
        '<div class="sect__head"><h2 class="sect__h" id="how-h">How White Rewards works</h2></div>' +
        '<dl class="rules">' +
          '<div><dt>Earning</dt><dd>1 bean for every MVR ' + esc(p.mvrPerBean) + ' you spend. Higher tiers earn more on every bill.</dd></div>' +
          '<div><dt>Coffee card</dt><dd>Each handcrafted drink adds a stamp. Every ' + ordinal(p.stampsForFree) + ' drink is free.</dd></div>' +
          '<div><dt>Karaoke</dt><dd>Book a room with your card and the room bill earns beans like any other visit.</dd></div>' +
          '<div><dt>Bonuses</dt><dd>' + F.num(p.welcomeBonus) + ' beans when you join, ' + F.num(p.birthdayBonus) + ' in your birthday week, and ' + F.num(p.referralBonus) + ' each when a friend you invite makes a first visit.</dd></div>' +
          '<div><dt>Rewards</dt><dd>Spend beans on rewards. You get a code that stays valid for ' + plural(p.redemptionMinutes, 'minute') + '. Show it at the counter.</dd></div>' +
        '</dl>' +
        '<h3 class="perks-h how__tiers-h">Tiers</h3>' +
        '<div class="table-wrap"><table class="tiers-table"><thead><tr><th scope="col">Tier</th><th scope="col">Beans earned</th><th scope="col">Earn rate</th></tr></thead><tbody>' + tiersRows + '</tbody></table></div>' +
        '<p class="hint">Your tier is based on all the beans you’ve earned since joining, so spending beans never lowers it.</p>' +
      '</section>' +

      '<section class="sect account" aria-labelledby="acct-h">' +
        '<div class="sect__head"><h2 class="sect__h" id="acct-h">Account</h2></div>' +
        '<div class="account__row">' +
          '<button class="btn btn--ghost" type="button" data-act="signout">' + icon('logout') + 'Sign out</button>' +
          '<button class="btn btn--ghost btn--danger" type="button" data-act="reset">' + icon('refresh') + 'Reset demo data</button>' +
        '</div>' +
        '<p class="demo-note">Demo: resetting puts every member, visit, reward and booking back to the starting data, in this portal, the admin portal and on the website.</p>' +
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
  /** Navigate without adding a history entry (sign-in and join share one entry, which the card then takes over). */
  function replaceHash(hash) {
    if (location.hash === hash) { route(); return; }
    try { history.replaceState(null, '', hash); } catch (e) { location.replace(hash); return; }   // file:// fallback fires hashchange
    route();
  }

  function syncMember(m) {
    var id = m ? m.id : null;
    if (id === S.memberId) return false;
    S.memberId = id;
    S.flipped = false;
    S.shownBeans = null;
    S.shownStamps = null;
    S.shownFree = null;
    S.fullUntil = 0;
    clearTimeout(S.fullTimer);
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
    if (!m) {
      // A link to a tab (e.g. ../portal/#karaoke from the booking page) opens it after sign-in.
      if (APP_VIEWS[v] && v !== 'code' && v !== 'card') S.after = v;
      if (v !== 'join') v = 'signin';
    }
    else if (!v || v === 'signin' || (!APP_VIEWS[v] && v !== 'join')) v = 'card';
    if (v !== h.view) { try { history.replaceState(null, '', '#' + v); } catch (e) { /* file:// */ } }
    var entering = v !== S.view || arg !== S.arg || memberChanged;
    if (AUTH_VIEWS[v] && AUTH_VIEWS[S.view] && v !== S.view) clearToasts();   // "Code sent…" belongs to sign-in, not Join
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
    if (m && !isAuth) { av.hidden = false; av.textContent = m.name; av.className = 'whoami'; }
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

  function focusHeading(force) {
    if (!S.booted && !force) return;  // keep the first paint calm; focus moves on navigation
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
      case 'show-qr': {
        setFlip(true);
        var qc = $('#side-card');
        if (qc) {
          var rect = qc.getBoundingClientRect();
          if (rect.bottom > window.innerHeight - 80 || rect.top < 60) qc.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
        }
        break;
      }
      case 'demo':
        W.signInMember(W.demoMemberId());
        afterSignIn('Signed in as ' + W.currentMember().name, 'Demo account. Look around freely.');
        break;
      case 'fill-demo': {
        S.signin = { step: 'phone', local: '7712408', error: '', notFound: false, busy: false };
        render(false, false);
        var inp = $('#si-phone'); if (inp) inp.focus();
        break;
      }
      case 'change-number':
        clearToasts();   // the "Code sent to…" toast is about the number being changed
        S.signin.step = 'phone'; S.signin.error = ''; render(false, false);
        var pi = $('#si-phone'); if (pi) pi.focus();
        break;
      case 'resend':
        S.signin.error = '';
        toast('We sent a new code to ' + fullPhone(S.signin.local), { icon: 'phone', sub: 'Demo: any 4 digits work.' });
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
      case 'cancel-booking':
        if (m) confirmCancelBooking(t.getAttribute('data-id'), t);
        break;
    }
  });

  /* Sign in and Join are two sides of one step: moving between them replaces the history entry
     instead of stacking one per switch. After sign-in that single entry becomes #card (afterSignIn),
     so Back from the card leaves the portal rather than landing on a form for a signed-in visitor. */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !AUTH_VIEWS[S.view]) return;
    var href = a.getAttribute('href'), target = href.replace(/^#\/?/, '').split('/')[0].toLowerCase();
    if (!AUTH_VIEWS[target]) return;
    e.preventDefault();
    replaceHash(href);
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
        // Keep the caret after the same digit; a stripped +960 / 00960 prefix no longer counts.
        var digitsBefore = Math.max(0, digitsOf(before.slice(0, pos)).length - ccLen(digitsOf(before)));
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
    // Replace the sign-in / join entry, so Back from the card leaves the portal instead of
    // reopening a sign-in or join form for someone who is already signed in.
    // A new member always lands on the card (the welcome sheet opens there).
    var dest = !S.welcome && S.after ? '#' + S.after : '#card';
    S.after = null;
    replaceHash(dest);
    if (msg) toast(msg, { icon: 'card', sub: sub });
  }

  /* ---------- Sign in ---------- */
  function findByPhone(local) {
    // Look the number up before "sending" a code (signInByPhone signs in immediately).
    var hits = W.findMembers(local).filter(function (x) { return localPart(x.phone) === local; });
    return hits[0] || null;
  }

  function submitPhone(form) {
    var raw = digitsOf($('#si-phone', form).value);
    var local = raw.slice(ccLen(raw));   // the input handler already normalised it; this covers autofill without an input event
    S.signin.local = local;
    S.signin.notFound = false;
    if (local.length !== 7) {
      S.signin.error = local.length ? 'Maldives numbers have 7 digits. Check the number and try again.' : 'Enter your phone number.';
    } else if (!findByPhone(local)) {
      S.signin.error = 'We couldn’t find a White Rewards card with ' + fullPhone(local) + '.';
      S.signin.notFound = true;
    } else {
      S.signin.error = '';
      S.signin.step = 'code';
      render(false, false);
      toast('Code sent to ' + fullPhone(local), { icon: 'phone', sub: 'Demo: any 4 digits work.' });
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
      var er = $('#otp-err'); if (er) er.innerHTML = errHTML(S.signin.error);
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
  function setFieldError(id, msg, extraHTML) {
    var el = $('#' + id + '-err'), inp = $('#' + id);
    if (el) el.innerHTML = errHTML(msg, extraHTML);
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
    var rawPhone = digitsOf($('#j-phone').value);
    var local = rawPhone.slice(ccLen(rawPhone));
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
        if (/already/i.test(err.message)) {
          setFieldError('j-phone', 'This number already has a White Rewards card.', ' <a class="link" href="#signin">Sign in instead</a>');
          S.signin = { step: 'phone', local: local, error: '', notFound: false, busy: false };
        } else setFieldError('j-phone', err.message + '.');
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
        '<div class="sheet__body">' + (opts.body || '') + '</div>' +
        '<p class="field-error sheet__err" role="alert"></p>' +
        '<div class="sheet__actions">' + sheetActionsHTML(opts.actions) + '</div>' +
      '</div>';
    var sheet = $('.sheet', layer);
    var opener = opts.opener || document.activeElement;
    openSheetState = { opener: opener, openerKey: focusKey(opener), opts: opts, sheet: sheet, sig: sheetSig(opts) };
    ['#topbar', '#main', '#tabbar'].forEach(function (s) { var el = $(s); if (el) el.setAttribute('inert', ''); });
    document.body.classList.add('has-sheet');
    requestAnimationFrame(function () { layer.classList.add('is-open'); });
    // Destructive confirms pass focus: 1 so Enter lands on the safe choice ("Keep it", "Keep my data").
    var focusBtn = $('[data-sheet-btn="' + (opts.focus || 0) + '"]', sheet) || $('[data-sheet-btn="0"]', sheet) || sheet;
    setTimeout(function () { if (openSheetState && openSheetState.sheet === sheet) focusBtn.focus(); }, 30);
    layer.onclick = function (e) {
      if (e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
      var b = e.target.closest('[data-sheet-btn]');
      if (b) {
        var a = opts.actions[+b.getAttribute('data-sheet-btn')];
        if (a && a.run) {
          try { var keep = a.run(); if (keep !== true) closeSheet(); }
          catch (err) { var er = $('.sheet__err', sheet); er.innerHTML = errHTML(err.message); }
        } else closeSheet();
      }
    };
  }

  function sheetActionsHTML(actions) {
    return (actions || []).map(function (a, i) {
      return '<button class="btn ' + (a.cls || '') + '" type="button" data-sheet-btn="' + i + '">' + a.label + '</button>';
    }).join('');
  }
  function sheetSig(o) { return [o.title, o.body || '', (o.actions || []).map(function (a) { return a.label; }).join('|')].join('\u0001'); }

  /** Redraw the open sheet in place (title, body, buttons) when live data changed what it should say. */
  function updateSheet(parts) {
    var st = openSheetState;
    if (!st || !parts) return;
    var sig = sheetSig(parts);
    if (sig === st.sig) return;
    st.sig = sig;
    var sheet = st.sheet, opts = st.opts;
    var actionsEl = $('.sheet__actions', sheet);
    var focusInActions = actionsEl.contains(document.activeElement);
    var labelsChanged = (opts.actions || []).map(function (a) { return a.label; }).join('|') !== (parts.actions || []).map(function (a) { return a.label; }).join('|');
    opts.title = parts.title; opts.body = parts.body; opts.actions = parts.actions;   // the click handler reads opts.actions
    $('.sheet__title', sheet).innerHTML = parts.title;
    $('.sheet__body', sheet).innerHTML = parts.body || '';
    $('.sheet__err', sheet).innerHTML = '';
    if (labelsChanged) {
      actionsEl.innerHTML = sheetActionsHTML(parts.actions);
      if (focusInActions || !sheet.contains(document.activeElement)) { var b0 = $('[data-sheet-btn="0"]', sheet); if (b0) b0.focus(); }
    }
  }

  /** Let an open sheet react to a data change (another tab, staff at the counter, a code timing out). */
  function syncSheet() {
    if (openSheetState && openSheetState.opts.onData) openSheetState.opts.onData();
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
      // The view may have re-rendered underneath (live sync), so fall back to the opener's replacement,
      // and to the view heading when the opener is gone (e.g. the code was served while the sheet was open).
      if (st.opener && document.contains(st.opener)) { try { st.opener.focus(); } catch (e) { /* noop */ } }
      else restoreFocus(st.openerKey);
      if (!document.activeElement || document.activeElement === document.body || st.sheet.contains(document.activeElement)) focusHeading(true);
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

  /** The redeem sheet's content for the member's balance right now (rebuilt when the balance changes live). */
  function redeemSheetParts(rewardId) {
    var m = W.currentMember(), r = W.reward(rewardId);
    if (!m) return null;
    if (!r || !r.active) {
      return {
        title: 'This reward isn’t available right now',
        body: '<p class="sheet-note sheet-note--warn" role="alert">The café just paused or changed it. Your beans haven’t been touched.</p>',
        actions: [{ label: 'OK', cls: 'btn--ghost' }]
      };
    }
    var can = m.beans >= r.cost;
    var body = '<div class="sheet-reward">' + thumbHTML(r) +
        '<div><p class="sheet-reward__name">' + esc(r.name) + '</p><p class="sheet-reward__cost num">' + F.num(r.cost) + ' beans</p></div></div>' +
      '<dl class="sheet-sum"><div><dt>Your balance now</dt><dd class="num">' + F.num(m.beans) + ' beans</dd></div>' +
        (can ? '<div><dt>After redeeming</dt><dd class="num">' + F.num(m.beans - r.cost) + ' beans</dd></div>' :
               '<div><dt>Still needed</dt><dd class="num">' + plural(r.cost - m.beans, 'bean') + '</dd></div>') + '</dl>' +
      (can ?
        '<p class="sheet-note">' + (isKaraokeReward(r) ?
          'Redeem this at the counter on the night of your booking, so the team can take the hour off your room bill. The code stays valid for ' + plural(W.program.redemptionMinutes, 'minute') + '.' :
          'You’ll get a code to show at the counter. It stays valid for ' + plural(W.program.redemptionMinutes, 'minute') + ', so redeem when you’re at the café.') + '</p>' :
        '<p class="sheet-note sheet-note--warn" role="alert">Your balance just changed. You now have ' + plural(m.beans, 'bean') + ', and need ' + plural(r.cost - m.beans, 'more bean') + ' for this reward.</p>');
    return {
      title: (can ? 'Redeem ' : 'Not enough beans for ') + esc(r.name.charAt(0).toLowerCase() + r.name.slice(1)) + (can ? '?' : ' yet'),
      body: body,
      actions: can ? [
        { label: 'Redeem for ' + F.num(r.cost) + ' beans', cls: 'btn--gold', run: function () {
          var red = W.redeem(W.currentMember().id, rewardId);
          S.codeStatus[red.code] = 'ready';
          setTimeout(function () { go('#code/' + encodeURIComponent(red.code)); }, 0);
        } },
        { label: 'Not now', cls: 'btn--ghost' }
      ] : [{ label: 'OK', cls: 'btn--ghost' }]
    };
  }

  function confirmRedeem(m, rewardId, opener) {
    var parts = redeemSheetParts(rewardId); if (!parts || !W.reward(rewardId)) return;
    parts.opener = opener;
    parts.onData = function () { updateSheet(redeemSheetParts(rewardId)); };
    openSheet(parts);
  }

  function confirmCancel(code, opener) {
    var r = W.redemption(code); if (!r) return;
    openSheet({
      opener: opener,
      focus: 1,
      title: 'Cancel this reward?',
      desc: '<p>' + esc(r.rewardName) + ' (' + esc(r.code) + ') will be cancelled and <strong>' + F.num(r.cost) + ' beans</strong> go back on your card.</p>',
      // Served, expired or cancelled elsewhere while this was open: the screen behind already says what happened.
      onData: function () {
        var now = W.redemption(code);
        if (!now || now.status !== 'ready' || now.expires <= Date.now()) closeSheet();
      },
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

  /** Customer cancels an upcoming karaoke booking. Closes itself if staff check them in or someone else cancels first. */
  function confirmCancelBooking(id, opener) {
    var b = W.karaokeBooking(id); if (!b || b.status !== 'confirmed') return;
    openSheet({
      opener: opener,
      focus: 1,
      title: 'Cancel this booking?',
      desc: '<p><strong>' + esc(b.roomName) + ', ' + esc(shortDate(b.date)) + ', ' + esc(bookingTimes(b)) + '</strong> (' + esc(b.id) + '). The room goes back on the schedule for someone else.</p>',
      onData: function () {
        var now = W.karaokeBooking(id);
        if (!now || now.status !== 'confirmed') closeSheet();
      },
      actions: [
        { label: 'Cancel booking', cls: 'btn--danger-solid', run: function () {
          var m = W.currentMember();
          W.cancelKaraoke(id, m ? m.name : 'Guest');
          toast('Booking cancelled', { icon: 'mic', sub: b.roomName + ', ' + shortDate(b.date) + ', ' + b.id });
        } },
        { label: 'Keep it', cls: 'btn--ghost' }
      ]
    });
  }

  function confirmReset(opener) {
    openSheet({
      opener: opener,
      focus: 1,
      title: 'Reset demo data?',
      desc: '<p>Every member, visit, reward, booking and setting goes back to the starting demo: here, in the admin portal and on the website. You’ll be signed out.</p>',
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
          toast('+' + F.num(a.beans) + ' beans added', { icon: 'bean', sub: cardFull ? 'Coffee card full. Your next drink is on us.' :
            (isKaraokeEarn(a) ? itemsTitle(a.items || []) + ', ' : 'Visit, ') + F.mvr(a.amount) + (a.stamps ? ', ' + plural(a.stamps, 'stamp') : '') + (a.multiplier > 1 ? ', double beans' : '') });
          break;
        case 'bonus': toast('+' + F.num(a.beans) + ' beans', { icon: 'bean', sub: clean(a.note) }); break;
        case 'adjust': toast('Your balance changed by −' + F.num(Math.abs(a.beans)) + ' beans', { icon: 'info', sub: clean(a.note) }); break;
        case 'served': {
          var r = a.code ? W.redemption(a.code) : null;
          toast('Your reward was served' + (a.staff ? ' by ' + a.staff : ''), { icon: 'cup', sub: r ? r.rewardName : String(a.note || '').replace(/ handed over$/, '') });
          break;
        }
        case 'free': toast('Free drink used', { icon: 'cup', sub: a.staff ? 'Served by ' + a.staff : '' }); break;
        case 'booking': toast(/cancel/i.test(a.note || '') ? 'Karaoke booking cancelled' : 'Karaoke room booked', { icon: 'mic', sub: clean(String(a.note || '').replace(/^Karaoke (booked|cancelled):\s*/i, '')) + (a.code ? ', ' + a.code : '') }); break;
        case 'stamp': toast(clean(a.note) || 'Your coffee card is full', { icon: 'stamp', sub: 'Your next drink is on us.' }); break;
        case 'refund': toast('+' + F.num(a.beans) + ' beans returned', { icon: 'returnArrow', sub: clean(a.note) }); break;
        case 'redeem': toast('−' + F.num(Math.abs(a.beans)) + ' beans', { icon: 'gift', sub: a.note }); break;
      }
    });
    var t = W.tier(m);
    if (S.tierId && t.id !== S.tierId) {
      var up = W.program.tiers.indexOf(t) > W.program.tiers.map(function (x) { return x.id; }).indexOf(S.tierId);
      if (up) toast('You’re now a ' + t.name + ' member', { icon: 'card', sub: clean(t.perks[0] || '') });
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
      // A reset from the admin portal arrives as several writes (reset, then staff and member sessions put back),
      // so wait for them before saying whether the visitor still has to sign in.
      clearTimeout(S.resetToast);
      S.resetToast = setTimeout(function () {
        var who = W.currentMember();
        toast(info.remote ? 'The demo data was reset' : 'Demo data reset', { icon: 'refresh', sub: who ? 'You’re still signed in as ' + who.name + '.' : 'Sign in again to explore.' });
      }, info.remote ? 350 : 0);
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
    // Local changes come from the sheet's own button (it closes right after); remote ones can make it stale.
    if (info.remote) syncSheet();
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
    if (expired) { W.redemptions(); refresh(); syncSheet(); }
  }, 1000);

  /* Keep the open status and karaoke timing fresh */
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
