/* ==========================================================================
   White Coffee House: back office (staff)
   Runs entirely on window.WCH (assets/js/store.js). Business rules live in
   the store; this file only renders and calls its API. Every view re-renders
   from WCH.subscribe, so changes from the customer portal, the karaoke
   booking page or another admin tab show up live.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.WCH;
  if (!W) { document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">The demo data store did not load. Refresh the page to try again.</p>'; return; }
  var F = W.fmt, esc = F.esc;

  var STAFF = ['Shazna', 'Ameen', 'Rifa', 'Nadheem'];          // TODO(store): expose WCH.staff()
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // What the counter offers first: the drinks people order most, plus the house dishes.
  var POPULAR = ['cappuccino', 'cafe-latte', 'iced-latte', 'iced-coffee', 'americano', 'milk-coffee', 'hot-chocolate', 'iced-milo',
    'mango-juice', 'watermelon-juice', 'oreo-shake', 'chocolate-shake', 'maldivian-breakfast', 'special-noodles', 'special-rice',
    'sandwich-platter', 'brownie', 'cookies'];
  var STATUS = {
    confirmed: 'Confirmed', 'checked-in': 'In the room', completed: 'Completed', cancelled: 'Cancelled', 'no-show': 'No-show',
    ready: 'Ready', served: 'Served', expired: 'Expired'
  };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ------------------------------------------------------------------ */
  /* Icons — 24px grid, 1.6 stroke                                       */
  /* ------------------------------------------------------------------ */
  var I = {
    dashboard: '<rect x="3.5" y="3.5" width="7" height="8" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.6"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.6"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.6"/>',
    cup: '<path d="M4.5 9.5h11.5v4.2a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.6a2.6 2.6 0 0 1 0 5.2H16"/><path d="M8.5 3.6c-.7.9-.7 1.9 0 2.8M12 3.6c-.7.9-.7 1.9 0 2.8"/><path d="M4 21h13"/>',
    members: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0"/><path d="M15.6 5.3a3.4 3.4 0 0 1 0 6.4M17.6 14.2a6.2 6.2 0 0 1 3.6 5.3"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v6.8a1.2 1.2 0 0 0 1.2 1.2h11.6a1.2 1.2 0 0 0 1.2-1.2v-6.8M12 8.5v12"/><path d="M12 8.5S10.6 4 8.1 4a2.25 2.25 0 0 0 0 4.5M12 8.5S13.4 4 15.9 4a2.25 2.25 0 0 1 0 4.5"/>',
    menu: '<path d="M5 5.2A1.7 1.7 0 0 1 6.7 3.5h11.8v14H6.7A1.7 1.7 0 0 0 5 19.2z"/><path d="M5 19.2a1.7 1.7 0 0 0 1.7 1.7h11.8v-3.4M9 8h6M9 11h4"/>',
    tag: '<path d="M3.5 12.4V5A1.5 1.5 0 0 1 5 3.5h7.4a1.5 1.5 0 0 1 1.06.44l6.6 6.6a1.5 1.5 0 0 1 0 2.12l-7.4 7.4a1.5 1.5 0 0 1-2.12 0l-6.6-6.6a1.5 1.5 0 0 1-.44-1.06z"/><circle cx="8.3" cy="8.3" r="1.4"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    scan: '<path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5M7.5 12h9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
    chevronUp: '<path d="m6 15 6-6 6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    external: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M17.5 14v4a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4"/>',
    logout: '<path d="M14.5 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-3.5M10 8l-4 4 4 4M6 12h9.5"/>',
    bean: '<ellipse cx="12" cy="12" rx="6" ry="8.6" transform="rotate(32 12 12)"/><path d="M15.4 5.6c-2.9 1.6-1.3 4.6-3.4 6.4s-4.9 1.2-5.6 4.4"/>',
    ticket: '<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"/><path d="M14.5 6.5v1.5M14.5 11.2v1.6M14.5 16v1.5"/>',
    userPlus: '<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 19.5a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
    edit: '<path d="M4.5 19.5h3.8L18.6 9.2a2.1 2.1 0 0 0-3-3L5.3 16.5z"/><path d="m13.8 8 3 3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    sparkle: '<path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5z"/><path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z"/>',
    adjust: '<path d="M7.5 4.5v6M4.5 7.5h6M14 16.5h6"/><path d="M18 5 6 19"/>',
    undo: '<path d="M9 6.5 4.5 11 9 15.5"/><path d="M5 11h9.5a5 5 0 0 1 0 10H11"/>',
    star: '<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5z"/>',
    phone: '<rect x="6.5" y="3" width="11" height="18" rx="2.4"/><path d="M10.5 17.5h3"/>',
    more: '<circle cx="5.5" cy="12" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="18.5" cy="12" r="1.1"/>',
    bagel: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6"/><path d="M7.2 8.4c.8-.9 1.8-1.5 3-1.8"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.9v.1"/>',
    alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.2M12 16.9v.1"/>',
    table: '<rect x="3.5" y="5" width="17" height="14" rx="1.6"/><path d="M3.5 10h17M3.5 14.5h17M9.5 10v9"/>',
    chart: '<path d="M4 4.5v15.5h16"/><path d="M8.5 16.5v-4M12.5 16.5V8.5M16.5 16.5v-6"/>',
    eye: '<path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.8"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    cake: '<path d="M4.5 20.5h15M5.5 20.5v-6.3a1.7 1.7 0 0 1 1.7-1.7h9.6a1.7 1.7 0 0 1 1.7 1.7v6.3"/><path d="M5.5 16.2c1.1 1 2.1 1 3.2 0s2.1-1 3.3 0 2.1 1 3.2 0 2.1-1 3.3 0M12 12.5V9.5M12 6.6c-.6-.6-.6-1.4 0-2.1.6.7.6 1.5 0 2.1z"/>',
    mic: '<rect x="9" y="3.5" width="6" height="10" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M8.5 20.5h7"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
    call: '<path d="M6.6 3.8h2.7l1.4 4-2 1.4a10.5 10.5 0 0 0 6.1 6.1l1.4-2 4 1.4v2.7a1.8 1.8 0 0 1-1.9 1.8A15.6 15.6 0 0 1 4.8 5.7a1.8 1.8 0 0 1 1.8-1.9z"/>',
    door: '<path d="M5 20.5h14M7 20.5V4.5h10v16"/><path d="M14 12.5v.1"/>',
    move: '<path d="M4 12h16M16 8l4 4-4 4M8 8l-4 4 4 4"/>',
    moon: '<path d="M19.6 14.6A7.9 7.9 0 0 1 9.4 4.4a8.2 8.2 0 1 0 10.2 10.2z"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (I[name] || '') + '</svg>';
  }
  // A small filled/empty cup used on the coffee card.
  function cupSlot(filled) {
    return '<svg class="cup-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 8.5h11.5v4.6a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-5-5z" class="cup-body"' + (filled ? '' : ' fill="none"') + '/><path d="M16.5 9.6h1.5a2.6 2.6 0 0 1 0 5.2h-1.5" fill="none" class="cup-handle"/></svg>';
  }

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */
  function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || 'Guest'; }
  function plural(n, one, many) { return F.num(n) + ' ' + (n === 1 ? one : (many || one + 's')); }
  function beans(n) { return plural(n, 'bean'); }
  function signed(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + F.num(Math.abs(n)); }
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function weekdayShort(ts) { return DAYS[W.maleParts(ts).day].slice(0, 3); }
  function avatar(name, cls) { return '<span class="avatar' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + esc(F.initials(name)) + '</span>'; }
  function tierChip(t) { return '<span class="tier tier--' + esc(t.id) + '"><i aria-hidden="true"></i>' + esc(t.name) + '</span>'; }
  function mvrHTML(n) { return '<span class="unit">MVR</span>' + F.num(Math.round(Number(n) || 0)); }
  function parseMoney(v) { var s = String(v == null ? '' : v).replace(/[^\d.]/g, ''); if (!s) return 0; var n = parseFloat(s); return isFinite(n) ? n : 0; }
  function staffName() { return W.currentStaff() || 'Counter'; }
  function memberName(id) { var m = W.member(id); return m ? m.name : 'A former member'; }
  function catOf(id) { return W.categories().filter(function (c) { return c.id === id; })[0] || null; }
  /** A handcrafted drink earns a coffee-card stamp: anything in the drinks group except canned soft drinks and water (same rule as the store's seed). */
  function isDrink(item) { var c = item && catOf(item.cat); return !!c && c.group === 'drinks' && item.cat !== 'soft' && item.id !== 'water'; }
  function errMsg(e) { return nd((e && e.message) || 'Something went wrong. Please try again.'); }
  /** House style has no em or en dashes in copy. Store-written notes still contain some, so soften them on the way out. */
  function nd(s) { return String(s == null ? '' : s).replace(/\s*[—]\s*/g, ', ').replace(/(\d)\s*[–]\s*(\d)/g, '$1 to $2').replace(/\s*[–]\s*/g, ', '); }
  function statusHTML(st) { return '<span class="st st--' + esc(st) + '">' + esc(STATUS[st] || st) + '</span>'; }
  function hourLabel(h) { return h === 24 || h === 0 ? 'midnight' : W.fmtClock(String(h).padStart(2, '0') + ':00'); }
  /** "8 to 10 PM", "11 PM to midnight", "4 to 5 PM" */
  function hourRange(start, hours) {
    var a = hourLabel(start), b = hourLabel(start + hours);
    if (b !== 'midnight' && a.slice(-2) === b.slice(-2)) a = a.slice(0, -3);
    return a + ' to ' + b;
  }
  /** "40 minutes", "about 5 hours" */
  function untilText(ms) {
    var min = Math.max(1, Math.round(ms / 6e4));
    if (min < 60) return plural(min, 'minute');
    var h = Math.round(min / 60); return h === 1 ? 'about an hour' : 'about ' + h + ' hours';
  }

  /** Replace an element's HTML only when it changed; keep focus + caret on the same control. */
  function patch(el, html) {
    if (!el || el._html === html) return false;
    var ae = document.activeElement, key = null, caret = null;
    if (ae && ae !== document.body && el.contains(ae)) {
      key = ae.id ? '#' + CSS.escape(ae.id) : (ae.dataset && ae.dataset.key) ? '[data-key="' + CSS.escape(ae.dataset.key) + '"]' : null;
      if (key && typeof ae.selectionStart === 'number') { try { caret = [ae.selectionStart, ae.selectionEnd, ae.value]; } catch (e) { caret = null; } }
    }
    el.innerHTML = html; el._html = html;
    if (html.indexOf('data-expires') > -1) tick();
    if (key) {
      var n = el.querySelector(key);
      if (n) { n.focus({ preventScroll: true }); if (caret && n.value === caret[2]) { try { n.setSelectionRange(caret[0], caret[1]); } catch (e) { /* not a text field */ } } }
    }
    return true;
  }

  function setError(el, msg) { if (!el) return; el.textContent = msg || ''; el.hidden = !msg; }
  /** Rebuild a select's options only when they changed (the caller sets .value after). */
  function setOptions(sel, html) { if (sel && sel._opts !== html) { sel.innerHTML = html; sel._opts = html; } }

  /** A validation error that belongs to one field (its id). */
  function fail(field, msg) { var e = new Error(msg); e.field = field; throw e; }
  /** Show (or clear) a message under one control, mark it invalid and link it for screen readers. */
  function fieldErr(input, msg) {
    if (!input) return;
    var field = input.closest('.field, [role="cell"]') || input.parentNode;
    var pid = (input.id || 'fld') + '-e', p = field.querySelector('#' + CSS.escape(pid));
    if (!p) { if (!msg) return; p = document.createElement('p'); p.className = 'field-error'; p.id = pid; field.appendChild(p); }
    p.textContent = msg || ''; p.hidden = !msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    var db = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== pid; });
    if (msg) db.push(pid);
    if (db.length) input.setAttribute('aria-describedby', db.join(' ')); else input.removeAttribute('aria-describedby');
  }
  function clearFieldErrs(root) { $$('[aria-invalid="true"]', root).forEach(function (i) { fieldErr(i, ''); }); }
  /** Route an error to its field when it has one (focus it), else to the form-level message. */
  function showFormError(root, ex, fallbackEl, fieldMap) {
    var f = ex && ex.field, msg = errMsg(ex);
    if (!f && fieldMap) Object.keys(fieldMap).forEach(function (k) { if (msg.indexOf(k) > -1) f = fieldMap[k]; });
    var input = f && $('#' + CSS.escape(f), root);
    if (input) { setError(fallbackEl, ''); fieldErr(input, msg); input.focus(); return; }
    setError(fallbackEl, msg);
  }

  /** One phone format for the whole admin: "+960 771 2408" for Maldives numbers, "+<digits>" for numbers typed with another country code. */
  function normPhone(raw, field) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) fail(field, 'Please enter a phone number');
    if (/[^\d\s()+.\-]/.test(s)) fail(field, 'Phone numbers can only contain digits');
    var intl = /^(\+|00)/.test(s), d = s.replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('960') === 0 && d.length === 10) d = d.slice(3);
    if (d.length === 7) return '+960 ' + d.slice(0, 3) + ' ' + d.slice(3);
    if (intl && d.indexOf('960') !== 0 && d.length >= 8 && d.length <= 15) return '+' + d;
    fail(field, 'Maldives mobile numbers have 7 digits, like 771 2408');
  }
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }

  /** Horizontal chip rows: fade the edge that has more chips behind it. */
  function fadeEdges(el) {
    if (!el) return;
    if (!el._fade) { el._fade = true; el.addEventListener('scroll', function () { fadeEdges(el); }, { passive: true }); }
    var max = el.scrollWidth - el.clientWidth;
    el.classList.toggle('has-more-r', max > 2 && el.scrollLeft < max - 2);
    el.classList.toggle('has-more-l', max > 2 && el.scrollLeft > 2);
  }

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var state = {
    seededAt: W.doc.seededAt,
    counter: { memberId: null, tab: 'visit', amount: '', drinks: 0, items: [], double: false, cat: 'popular', qq: '', success: null, code: '', query: '' },
    members: { q: '', tier: 'all', sort: 'lastVisit', dir: -1 },
    karaoke: { tab: 'schedule', date: null, q: '', when: 'upcoming', status: '', roomEdit: null, flash: null },
    kNav: 'deep',
    rwEdit: null,
    ofEdit: null,
    menuQ: '',
    chartTable: false,
    drawerReturn: null,
    after: null
  };
  var seen = Object.create(null);
  function markSeen() { var a = W.doc.activity; for (var i = 0; i < Math.min(80, a.length); i++) seen[a[i].id] = 1; }
  function unseenActivity() { var out = [], a = W.doc.activity; for (var i = 0; i < Math.min(40, a.length); i++) if (!seen[a[i].id]) out.push(a[i]); return out; }

  /* ------------------------------------------------------------------ */
  /* Toasts                                                              */
  /* ------------------------------------------------------------------ */
  var toastHost = $('#toasts');
  var phoneMQ = window.matchMedia('(max-width: 1023.98px)');
  function clearToasts() { while (toastHost.firstChild) toastHost.firstChild.remove(); if (canPopover) { try { toastHost.hidePopover(); } catch (e) { /* ignore */ } } }
  var canPopover = typeof toastHost.showPopover === 'function';
  if (canPopover) toastHost.setAttribute('popover', 'manual');
  function raiseToasts() {
    if (!canPopover) return;
    try { if (toastHost.matches(':popover-open')) toastHost.hidePopover(); toastHost.showPopover(); } catch (e) { /* ignore */ }
  }
  function toast(msg, opts) {
    opts = opts || {};
    var kind = opts.kind || 'ok';
    var t = document.createElement('div');
    t.className = 'toast toast--' + kind;
    t.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    t.innerHTML = '<div class="toast-txt">' + (kind === 'live' ? '<span class="toast-live">' + esc(opts.from || 'Live') + '</span>' : '') + '<strong>' + esc(nd(msg)) + '</strong>' + (opts.sub ? '<span>' + esc(nd(opts.sub)) + '</span>' : '') + '</div>' +
      (opts.action ? '<button class="toast-act" type="button">' + esc(opts.action.label) + '</button>' : '') +
      '<button class="toast-x" type="button" aria-label="Dismiss">' + icon('x') + '</button>';
    var timer = null, gone = false;
    function dismiss() {
      if (gone) return; gone = true; clearTimeout(timer);
      t.classList.add('is-leaving');
      setTimeout(function () { t.remove(); if (!toastHost.children.length && canPopover) { try { toastHost.hidePopover(); } catch (e) { /* ignore */ } } }, reduced.matches ? 0 : 220);
    }
    function arm() { clearTimeout(timer); timer = setTimeout(dismiss, opts.action ? 8000 : 4600); }
    t.querySelector('.toast-x').addEventListener('click', dismiss);
    if (opts.action) t.querySelector('.toast-act').addEventListener('click', function () { dismiss(); opts.action.fn(); });
    t.addEventListener('mouseenter', function () { clearTimeout(timer); });
    t.addEventListener('mouseleave', arm);
    t.addEventListener('focusin', function () { clearTimeout(timer); });
    t.addEventListener('focusout', arm);
    toastHost.appendChild(t);
    // Phones show one toast at a time (a new one replaces the last) so they never stack over the screen.
    while (toastHost.children.length > (phoneMQ.matches ? 1 : 3)) toastHost.firstElementChild.remove();
    raiseToasts();
    arm();
  }

  /* ------------------------------------------------------------------ */
  /* Dialogs (native <dialog>: focus is trapped, Escape closes)          */
  /* ------------------------------------------------------------------ */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  // Safari does not focus a button on click, so remember what was clicked last to return focus to it.
  var lastOpener = null;
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button, a[href], [role="switch"]'); if (b) lastOpener = b; }, true);
  function openDialog(o) {
    var d = document.createElement('dialog');
    d.className = 'dlg ' + (o.cls || '');
    if (o.labelledby) d.setAttribute('aria-labelledby', o.labelledby);
    d.innerHTML = o.html;
    var ae = document.activeElement;
    var ret = o.opener || (ae && ae !== document.body && ae !== $('#main') ? ae : (lastOpener && document.contains(lastOpener) ? lastOpener : ae));
    if (o.guard) d._guard = o.guard;
    document.body.appendChild(d);
    var downOnBackdrop = false;
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(d); });
    // Keep Tab inside the dialog (a native modal lets focus slip out to the browser chrome).
    d.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$(FOCUSABLE, d).filter(function (el) { return el.getClientRects().length > 0; });
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || !d.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !d.contains(a))) { e.preventDefault(); first.focus(); }
    });
    d.addEventListener('pointerdown', function (e) { downOnBackdrop = e.target === d; });
    d.addEventListener('click', function (e) { if (e.target === d && downOnBackdrop) closeDialog(d); downOnBackdrop = false; });
    d.addEventListener('close', function () {
      if (o.onClose) o.onClose();
      d.remove();
      // _noReturn: the app moves focus itself (a scan opens the member and focuses the bill).
      if (!d._noReturn && ret && document.contains(ret)) { try { ret.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    });
    d.showModal();
    var af = d.querySelector('[autofocus]');
    if (af) af.focus();
    if (o.onMount) o.onMount(d);
    return d;
  }
  /** force skips the dialog's guard (used when the app itself navigates away). */
  function closeDialog(d, now, force) {
    if (!d || !d.open || d._closing) return;
    if (!force && d._guard) {
      if (d._asking) return;
      d._asking = true;
      Promise.resolve(d._guard()).then(function (ok) { d._asking = false; if (ok) closeDialog(d, now, true); });
      return;
    }
    d._closing = true;
    if (now || reduced.matches) { d.close(); return; }
    d.classList.add('is-closing');
    setTimeout(function () { if (d.open) d.close(); }, 170);
  }
  function closeAllDialogs() { $$('dialog[open]').forEach(function (d) { closeDialog(d, true, true); }); }
  /** Ask before throwing away typed changes. Resolves true when it is fine to continue. */
  function confirmDiscard(what) {
    return confirmBox({ title: 'Discard your changes?', body: 'You changed ' + (what || 'this form') + ' but did not save. Leaving now throws those changes away.', ok: 'Discard changes', danger: true });
  }

  function confirmBox(o) {
    return new Promise(function (resolve) {
      var ok = false;
      var d = openDialog({
        cls: 'dlg--confirm', labelledby: 'cf-title',
        html: '<div class="dlg-box' + (o.danger ? ' is-danger' : '') + '">' +
          '<h2 class="dlg-title" id="cf-title">' + esc(nd(o.title)) + '</h2>' +
          '<p class="dlg-text">' + esc(nd(o.body)) + '</p>' +
          '<div class="dlg-actions"><button class="btn btn--ghost" type="button" data-close>Cancel</button>' +
          '<button class="btn' + (o.danger ? ' btn--danger' : '') + '" type="button" data-ok>' + esc(o.ok || 'Confirm') + '</button></div></div>',
        onClose: function () { resolve(ok); }
      });
      d.querySelector('[data-ok]').addEventListener('click', function () { ok = true; closeDialog(d); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Activity wording (one place for feed, timelines and toasts)         */
  /* ------------------------------------------------------------------ */
  function describe(a) {
    var r = { what: nd(a.note || ''), meta: '', beans: a.beans || 0, tone: '' };
    switch (a.type) {
      case 'earn':
        r.what = 'Visit, ' + F.mvr(a.amount);
        r.meta = (a.items && a.items.length ? a.items.join(', ') : '');
        if (a.multiplier && a.multiplier > 1) r.meta = (r.meta ? r.meta + ' · ' : '') + a.multiplier + '× beans';
        if (a.staff) r.meta = (r.meta ? r.meta + ' · ' : '') + 'by ' + a.staff;
        break;
      case 'join':
        r.what = 'Joined White Rewards'; r.meta = a.staff === 'Online' ? 'Signed up in the app' : a.staff === 'Seed' ? '' : 'Signed up at the counter by ' + a.staff; break;
      case 'bonus':
        r.what = nd(a.note || 'Bonus beans'); r.meta = a.staff ? 'by ' + a.staff : ''; break;
      case 'adjust':
        r.what = nd(a.note || 'Adjustment'); r.meta = a.staff ? 'by ' + a.staff : ''; r.tone = 'neg'; break;
      case 'redeem':
        r.what = 'Redeemed ' + nd(a.note || 'a reward'); r.meta = a.code ? 'Code ' + a.code : ''; break;
      case 'served':
        r.what = nd(a.note || 'Reward handed over'); r.meta = (a.code ? a.code + ' · ' : '') + (a.staff ? 'by ' + a.staff : ''); break;
      case 'refund':
        r.what = nd(a.note || 'Beans returned'); r.meta = a.code ? 'Code ' + a.code : ''; break;
      case 'free':
        r.what = 'Free drink from the coffee card'; r.meta = a.staff ? 'by ' + a.staff : ''; r.tone = 'gold'; break;
      case 'stamp':
        r.what = nd(a.note || 'Coffee card full'); r.tone = 'gold'; break;
      case 'booking':
        r.what = nd(a.note || 'Karaoke booking'); r.meta = a.code || ''; r.tone = 'karaoke'; break;
    }
    return r;
  }
  function beansCell(n) {
    if (!n) return '<span class="amt amt--zero"><span class="visually-hidden">No beans</span></span>';
    return '<span class="amt ' + (n > 0 ? 'amt--pos' : 'amt--neg') + '">' + signed(n) + '<span class="visually-hidden"> beans</span></span>';
  }

  function remoteToast(a) {
    var who = firstName(memberName(a.memberId));
    var d = describe(a);
    switch (a.type) {
      case 'redeem':
        toast(who + ' redeemed ' + (a.note || 'a reward'), { kind: 'live', from: 'From the app', sub: 'Code ' + a.code + ' is waiting at the counter', action: { label: 'View code', fn: function () { showCodeAtCounter(a.code); } } });
        break;
      case 'join':
        toast(memberName(a.memberId) + ' joined White Rewards', { kind: 'live', from: a.staff === 'Online' ? 'From the app' : 'Live', sub: a.staff === 'Online' ? 'Signed up in the customer app' : 'Added by ' + a.staff });
        break;
      case 'refund':
        toast(who + ' cancelled ' + (a.code || 'a reward code'), { kind: 'live', from: 'From the app', sub: 'Beans went back to their card' });
        break;
      case 'earn':
        toast(signed(a.beans) + ' beans for ' + who, { kind: 'live', sub: 'Visit added by ' + (a.staff || 'another tab') });
        break;
      case 'served':
        toast((a.code || 'A code') + ' served', { kind: 'live', sub: d.what + (a.staff ? ' · by ' + a.staff : '') });
        break;
      case 'free':
        toast(who + ' used a free drink', { kind: 'live', sub: a.staff ? 'by ' + a.staff : '' });
        break;
      case 'bonus': case 'adjust':
        if (a.note === 'Welcome bonus') return;
        toast(signed(a.beans) + ' beans for ' + who, { kind: 'live', sub: a.note || '' });
        break;
    }
  }
  /** Karaoke bookings made or changed in another tab (the booking page, the portal or another admin). */
  var knownBookings = Object.create(null);
  function snapBookings() { var o = Object.create(null); W.karaokeBookings().forEach(function (b) { o[b.id] = b.status + '|' + b.date + '|' + b.start + '|' + b.hours + '|' + b.roomId; }); return o; }
  function bookingToasts(prev, now) {
    var out = [];
    Object.keys(now).forEach(function (id) {
      var b = W.karaokeBooking(id); if (!b) return;
      if (!prev[id]) out.push(function () {
        toast('New karaoke booking ' + b.id, { kind: 'live', from: b.source === 'Online' ? 'From the booking page' : 'Live',
          sub: b.roomName + ', ' + W.karaokeDateLabel(b.date) + ', ' + hourRange(b.start, b.hours) + ' · ' + b.name,
          action: { label: 'View', fn: function () { location.hash = '#karaoke/' + b.id; } } });
      });
      else if (prev[id].split('|')[0] !== 'cancelled' && b.status === 'cancelled') out.push(function () {
        toast(b.id + ' was cancelled', { kind: 'live', sub: b.name + ' · ' + b.roomName + ', ' + W.karaokeDateLabel(b.date) + ', ' + hourRange(b.start, b.hours) });
      });
    });
    out.slice(0, 3).forEach(function (f) { f(); });
  }

  function showCodeAtCounter(code) {
    state.counter.code = String(code || '').replace(/^W-/, '');
    if (current && current.name === 'counter') {
      var q = $('#code-q'); if (q) q.value = state.counter.code;
      Counter.renderCode();
      var box = $('#code-result'); if (box) box.scrollIntoView({ block: 'center', behavior: reduced.matches ? 'auto' : 'smooth' });
      var b = $('[data-key="cr-serve"]'); if (b) b.focus({ preventScroll: true });
    } else location.hash = '#counter';
  }

  /* ------------------------------------------------------------------ */
  /* Shared pieces                                                       */
  /* ------------------------------------------------------------------ */
  function cupsHTML(m, cls) {
    var n = W.program.stampsForFree, s = Math.min(m.stamps, n), out = '';
    for (var i = 0; i < n; i++) out += '<li class="cup' + (i < s ? ' is-on' : '') + '">' + cupSlot(i < s) + '</li>';
    // The big card is laid out like a paper stamp card: even rows (10 → 2 × 5), never one cup alone on a line.
    var cols = n <= 6 ? n : Math.ceil(n / Math.ceil(n / 6));
    return '<ol class="cups' + (cls ? ' ' + cls : '') + '" style="--cols:' + cols + '" role="img" aria-label="Coffee card: ' + s + ' of ' + n + ' stamps">' + out + '</ol>';
  }
  /** Redemptions per reward, leaving out cancelled codes (the Rewards page and the dashboard both use this). */
  function redeemCounts() {
    var c = {};
    W.redemptions().forEach(function (r) {
      if (r.status === 'cancelled') return;
      var k = r.rewardId; c[k] = c[k] || { n: 0, ready: 0, name: r.rewardName }; c[k].n++; if (r.status === 'ready') c[k].ready++;
    });
    return c;
  }
  function codeRow(r, opts) {
    opts = opts || {};
    return '<li class="code-row">' +
      '<span class="code-tag">' + esc(r.code) + '</span>' +
      '<div class="code-row-txt"><p class="code-row-title">' + esc(r.rewardName) + '</p>' +
      '<p class="code-row-meta">' + (opts.noName ? '' : esc(memberName(r.memberId)) + ' · ') + '<span class="countdown" data-expires="' + r.expires + '"></span></p></div>' +
      '<button class="btn btn--sm" type="button" data-act="serve" data-code="' + esc(r.code) + '" data-key="serve-' + esc(r.code) + '">Serve</button>' +
      '</li>';
  }
  function emptyState(ic, title, text, extra) {
    return '<div class="empty"><p class="empty-title">' + esc(nd(title)) + '</p>' + (text ? '<p class="empty-text">' + esc(nd(text)) + '</p>' : '') + (extra || '') + '</div>';
  }
  /** One activity line: when, what, beans. withName puts the member's name (a link) first. */
  function logRow(a, opts) {
    opts = opts || {};
    var d = describe(a);
    var who = opts.withName ? (opts.link ? '<button class="link-btn" type="button" data-act="open-member" data-id="' + esc(a.memberId) + '" data-key="f-' + esc(a.id) + '">' + esc(memberName(a.memberId)) + '</button> ' : '<strong>' + esc(memberName(a.memberId)) + '</strong> ') : '';
    return '<li class="log-row' + (d.tone ? ' log-row--' + d.tone : '') + (opts.isNew ? ' is-new' : '') + '">' +
      '<span class="log-when num">' + esc(opts.ago ? F.ago(a.ts) : F.dateTime(a.ts)) + '</span>' +
      '<div class="log-txt"><p class="log-what">' + who + esc(d.what) + '</p>' + (d.meta ? '<p class="log-meta">' + esc(d.meta) + '</p>' : '') + '</div>' +
      beansCell(d.beans) + '</li>';
  }
  function timelineHTML(list, withName) {
    if (!list.length) return '<li>' + emptyState('clock', 'Nothing here yet', '') + '</li>';
    return list.map(function (a) { return logRow(a, { withName: withName }); }).join('');
  }
  function birthdaySelects(prefix, value) {
    var mm = '', dd = '';
    if (value) { var p = value.split('-'); mm = p[0]; dd = p[1]; }
    var days = '<option value="">Day</option>';
    for (var i = 1; i <= 31; i++) { var v = String(i).padStart(2, '0'); days += '<option value="' + v + '"' + (v === dd ? ' selected' : '') + '>' + i + '</option>'; }
    var months = '<option value="">Month</option>';
    MONTHS.forEach(function (n, i) { var v = String(i + 1).padStart(2, '0'); months += '<option value="' + v + '"' + (v === mm ? ' selected' : '') + '>' + n + '</option>'; });
    return '<div class="bday"><label class="visually-hidden" for="' + prefix + '-bd">Birthday day</label><select class="select" id="' + prefix + '-bd">' + days + '</select>' +
      '<label class="visually-hidden" for="' + prefix + '-bm">Birthday month</label><select class="select" id="' + prefix + '-bm">' + months + '</select></div>';
  }
  var MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];   // 29 Feb is a real birthday
  function readBirthday(root, prefix) {
    var d = $('#' + prefix + '-bd', root).value, m = $('#' + prefix + '-bm', root).value;
    if (!d && !m) return '';
    if (!d || !m) fail(prefix + '-bd', 'Pick both the day and the month of the birthday, or leave both empty');
    if (+d > MONTH_DAYS[+m - 1]) fail(prefix + '-bd', MONTHS[+m - 1] + ' has only ' + MONTH_DAYS[+m - 1] + ' days');
    return m + '-' + d;
  }

  /* ------------------------------------------------------------------ */
  /* Shell: sign in, sidebar, top bar, tab bar                           */
  /* ------------------------------------------------------------------ */
  var NAV = [
    { id: 'dashboard', label: 'Tonight', short: 'Tonight', icon: 'moon', title: 'Tonight' },
    { id: 'counter', label: 'Counter', icon: 'cup', title: 'Counter' },
    { id: 'karaoke', label: 'Karaoke', icon: 'mic', title: 'Karaoke' },
    { id: 'members', label: 'Members', icon: 'members', title: 'Members' },
    { id: 'rewards', label: 'Rewards', icon: 'gift', title: 'Rewards' },
    { id: 'menu', label: 'Menu', icon: 'menu', title: 'Menu' },
    { id: 'offers', label: 'Offers', icon: 'tag', title: 'Offers' },
    { id: 'settings', label: 'Settings', icon: 'settings', title: 'Settings' }
  ];

  function buildShell() {
    $('#side-nav').innerHTML = NAV.map(function (n) {
      return '<a class="side-item" href="#' + n.id + '" data-nav="' + n.id + '">' + icon(n.icon) + '<span>' + n.label + '</span>' +
        (n.id === 'counter' ? '<span class="nav-badge" data-codes-badge hidden></span>' : '') + '</a>';
    }).join('');
    $('#side-site').innerHTML = '<span>Website</span>' + icon('external', 'ic-sm');
    $('#side-karaoke').innerHTML = '<span>Karaoke booking page</span>' + icon('external', 'ic-sm');
    $('#side-portal').innerHTML = '<span>Customer portal</span>' + icon('external', 'ic-sm');
    $('#side-signout').innerHTML = icon('logout');
    // Phones: the four screens used every night, the rest under More.
    $('#tabbar').innerHTML =
      '<a class="tab" href="#dashboard" data-nav="dashboard">' + icon('moon') + '<span>Tonight</span></a>' +
      '<a class="tab" href="#counter" data-nav="counter"><span class="tab-ic">' + icon('cup') + '<span class="tab-badge" data-codes-badge hidden></span></span><span>Counter</span></a>' +
      '<a class="tab" href="#karaoke" data-nav="karaoke">' + icon('mic') + '<span>Karaoke</span></a>' +
      '<a class="tab" href="#members" data-nav="members">' + icon('members') + '<span>Members</span></a>' +
      '<button class="tab" type="button" data-act="more" data-nav-more aria-haspopup="dialog">' + icon('more') + '<span>More</span></button>';
    // The skip link must not change the hash (the hash is the router).
    $('.skip-link').addEventListener('click', function (e) { e.preventDefault(); $('#main').focus(); });
    var opts = $('#si-staff');
    opts.innerHTML = STAFF.map(function (n, i) {
      return '<label class="staff-opt"><input type="radio" name="staff" value="' + n + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<span class="staff-opt-box">' + avatar(n) + '<span>' + n + '</span></span></label>';
    }).join('');
  }

  function updateShell(view) {
    var staff = W.currentStaff() || '';
    $$('[data-staff-name]').forEach(function (el) { el.textContent = staff; });
    $$('[data-staff-initials]').forEach(function (el) { el.textContent = F.initials(staff); });
    var u = $('#topbar-user'); u.textContent = F.initials(staff); u.setAttribute('aria-label', 'More options, signed in as ' + staff);
    var ready = W.redemptions('ready').length;
    $$('[data-codes-badge]').forEach(function (el) { el.textContent = ready; el.hidden = !ready; el.setAttribute('aria-label', plural(ready, 'code') + ' waiting'); });
    var pill = $('#codes-pill');
    pill.hidden = !ready || view === 'counter';
    pill.innerHTML = icon('ticket') + '<span>' + plural(ready, 'code') + '</span>';
    pill.setAttribute('aria-label', plural(ready, 'reward code') + ' waiting. Open the counter');
    if (view) {
      $$('[data-nav]').forEach(function (a) { var on = a.dataset.nav === view; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      var more = $('[data-nav-more]'); if (more) more.classList.toggle('is-active', MORE.indexOf(view) > -1);
    }
  }

  var MORE = ['rewards', 'menu', 'offers', 'settings'];
  function openMore() {
    var staff = W.currentStaff(), ready = W.redemptions('ready').length;
    var d = openDialog({
      cls: 'dlg--sheet', labelledby: 'more-title',
      html: '<div class="dlg-box">' +
        '<header class="dlg-head"><div class="more-user">' + avatar(staff) + '<div><h2 class="dlg-title" id="more-title">' + esc(staff) + '</h2><p class="muted">On shift</p></div></div>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + icon('x') + '</button></header>' +
        '<nav class="more-list" aria-label="More sections">' +
        MORE.map(function (id) {
          var n = NAV.filter(function (x) { return x.id === id; })[0];
          return '<a class="more-item' + (current && current.name === id ? ' is-active' : '') + '" href="#' + id + '" data-close' + (current && current.name === id ? ' aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + n.label + '</span>' +
            (id === 'rewards' && ready ? '<span class="nav-badge">' + ready + '</span>' : '') + icon('chevronRight', 'ic-sm') + '</a>';
        }).join('') +
        '</nav><div class="more-list more-list--out">' +
        '<a class="more-item" href="../" target="_blank" rel="noopener"><span>Website</span>' + icon('external', 'ic-sm') + '</a>' +
        '<a class="more-item" href="../karaoke/" target="_blank" rel="noopener"><span>Karaoke booking page</span>' + icon('external', 'ic-sm') + '</a>' +
        '<a class="more-item" href="../portal/" target="_blank" rel="noopener"><span>Customer portal</span>' + icon('external', 'ic-sm') + '</a>' +
        '</div><button class="btn btn--ghost btn--block" type="button" data-act="signout">' + icon('logout') + 'Sign out</button></div>'
    });
    return d;
  }

  function showSignin() {
    closeAllDialogs();
    // Toasts about the shift (live redemptions, saves) must not linger over the sign-in card.
    if (!$('#app').hidden || current) clearToasts();
    if (current) { if (current.v.unmount) current.v.unmount(); current = null; }
    $('#app').hidden = true;
    $('.skip-link').hidden = true;     // it points into the app, which is hidden here
    var s = $('#signin'); s.hidden = false;
    document.body.classList.add('is-signin');
  }
  function bindSignin() {
    var form = $('#signin-form');
    $('#si-pass-toggle').addEventListener('click', function () {
      var p = $('#si-pass'), show = p.type === 'password';
      p.type = show ? 'text' : 'password'; this.textContent = show ? 'Hide' : 'Show'; this.setAttribute('aria-pressed', String(show));
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#si-email').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { setError($('#si-error'), 'Enter your work email address'); $('#si-email').focus(); return; }
      setError($('#si-error'), '');
      var pick = form.querySelector('input[name="staff"]:checked');
      var name = pick ? pick.value : STAFF[0];
      var target = state.after && state.after !== '#signin' ? state.after : '#dashboard';
      state.after = null;
      W.signInStaff(name);
      if (location.hash !== target) location.hash = target; else route();
      toast('Welcome, ' + name, { sub: 'You are signed in for this shift' });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Router                                                              */
  /* ------------------------------------------------------------------ */
  var current = null, prevHash = '';
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/'), id = null;
    if (parts[1]) { try { id = decodeURIComponent(parts[1]); } catch (e) { id = parts[1]; } }   // a malformed %-escape is just an unknown ID
    return { view: parts[0] || 'dashboard', id: id };
  }
  /** Where a member drawer opened from: 'push' = an in-app link (close with Back), 'deep' = a fresh load or straight after sign-in. */
  function drawerNav(fromHash) { return fromHash && fromHash !== '#signin' && fromHash !== '#' ? 'push' : 'deep'; }
  function route() {
    var r = parseHash();
    if (!W.currentStaff()) {
      if (r.view !== 'signin') { state.after = location.hash || '#dashboard'; history.replaceState(null, '', '#signin'); }
      showSignin();
      prevHash = location.hash;
      return;
    }
    if (r.view === 'signin' || !VIEWS[r.view]) { history.replaceState(null, '', '#dashboard'); r = parseHash(); }
    document.body.classList.remove('is-signin');
    $('#signin').hidden = true;
    $('#app').hidden = false;
    $('.skip-link').hidden = false;
    var fromHash = prevHash;
    prevHash = location.hash;
    if (!current || current.name !== r.view) {
      closeAllDialogs();
      if (current && current.v.unmount) current.v.unmount();
      var host = $('#view');
      host.innerHTML = ''; host.className = 'view view--' + r.view;
      if (r.view === 'members' && r.id) {
        state.drawerReturn = fromHash && fromHash !== '#signin' && fromHash.indexOf('#members') !== 0 ? fromHash : null;
        state.drawerNav = drawerNav(fromHash);
      }
      if (r.view === 'karaoke' && r.id && /^K-/i.test(r.id)) { state.kNav = drawerNav(fromHash); state.kFrom = fromHash; }
      current = { name: r.view, v: VIEWS[r.view] };
      current.v.mount(host, r.id);
      updateShell(r.view);
      current.v.update();
      if (!reduced.matches) { host.classList.remove('is-entering'); void host.offsetWidth; host.classList.add('is-entering'); }
      window.scrollTo(0, 0);
      if (booted) {
        var f = current.v.focusOnEnter ? current.v.focusOnEnter() : null;
        (f || $('#page-h1') || $('#main')).focus({ preventScroll: true });
      }
    } else {
      if (r.view === 'members' && r.id && fromHash.indexOf('#members/') !== 0) { state.drawerReturn = null; state.drawerNav = drawerNav(fromHash); }
      if (r.view === 'karaoke' && r.id && /^K-/i.test(r.id) && !/^#karaoke\/K-/i.test(fromHash)) { state.kNav = drawerNav(fromHash); state.kFrom = fromHash; }
      if (current.v.route) current.v.route(r.id);
      updateShell(r.view);
      current.v.update();
    }
    tick();
  }

  /* ------------------------------------------------------------------ */
  /* Live sync                                                           */
  /* ------------------------------------------------------------------ */
  var queued = false, booted = false;
  function refresh() {
    queued = false;
    var signedIn = !!W.currentStaff();
    var appShown = !$('#app').hidden;
    if (signedIn !== appShown) { route(); markSeen(); return; }
    if (!signedIn) return;
    updateShell(current && current.name);
    if (current) current.v.update();
    if (drawer) updateDrawer();
    if (bk) updateBooking();
    markSeen();
    tick();
  }
  function scheduleRefresh() { if (queued) return; queued = true; Promise.resolve().then(refresh); }

  W.subscribe(function (doc, info) {
    var bnow = snapBookings();
    if (info.remote) {
      if (doc.seededAt !== state.seededAt) {
        state.seededAt = doc.seededAt;
        markSeen();
        resetLocalState();
        var me = state.staffName;
        toast('Demo data was reset', { kind: 'info', sub: 'Another tab put the original demo data back.' });
        if (!W.currentStaff() && me) { knownBookings = bnow; W.signInStaff(me); return; }
      } else if (!W.currentStaff() && state.staffName) {
        state.staffName = null;
        // After the sign-in screen has replaced the app (which clears old toasts).
        setTimeout(function () { toast('Signed out', { kind: 'info', sub: 'You signed out in another tab.' }); }, 0);
      } else if (W.currentStaff()) {
        unseenActivity().slice(0, 3).reverse().forEach(function (a) { if (a.type !== 'booking') remoteToast(a); });
        bookingToasts(knownBookings, bnow);
      }
    }
    knownBookings = bnow;
    if (nb && W.currentStaff()) nb.sync(true);
    if (W.currentStaff()) state.staffName = W.currentStaff();
    scheduleRefresh();
  });

  function resetLocalState() {
    var c = state.counter;
    c.success = null; c.code = ''; c.items = []; c.amount = ''; c.amountManual = false; c.drinks = 0; c.double = false;
    if (c.memberId && !W.member(c.memberId)) c.memberId = null;
    state.rwEdit = null; state.ofEdit = null;
  }

  /* Countdown ticker: codes expire after a few minutes. */
  var tickN = 0;
  function tick() {
    var now = Date.now(), expired = false;
    $$('[data-expires]').forEach(function (el) {
      var left = Number(el.dataset.expires) - now;
      if (left <= 0) { expired = true; el.textContent = 'Expired'; el.classList.add('is-soon'); return; }
      el.textContent = (el.dataset.prefix || 'Expires in ') + mmss(left);
      el.classList.toggle('is-soon', left < 120000);
    });
    return expired;
  }
  setInterval(function () {
    tickN++;
    if (!W.currentStaff() || !current) return;
    if (tick() || tickN % 30 === 0) refresh();
  }, 1000);

  /* ------------------------------------------------------------------ */
  /* Global click actions (delegated)                                    */
  /* ------------------------------------------------------------------ */
  var ACTIONS = {
    more: function () { openMore(); },
    signout: function (el) {
      var name = W.currentStaff();
      closeAllDialogs();
      state.staffName = null;
      W.signOutStaff();
      history.replaceState(null, '', '#signin');
      route();
      toast('Signed out', { kind: 'info', sub: name ? 'See you next shift, ' + name + '.' : '' });
    },
    serve: function (el) { serveCode(el.dataset.code); },
    'cancel-code': function (el) { cancelCode(el.dataset.code); },
    scan: function () { openScan(); },
    'add-member': function (el) { openAddMember({}, el.dataset.from === 'counter'); },
    'open-member': function (el) { location.hash = '#members/' + encodeURIComponent(el.dataset.id); },
    'counter-member': function (el) {
      // Route right away (not on hashchange) so the bill field is focused inside the tap: phones then open the keypad.
      var h = '#counter/' + encodeURIComponent(el.dataset.id);
      if (location.hash === h) { Counter.focusBill(); return; }
      history.pushState(null, '', h);
      route();
    },
    'demo-code': function () { demoCode(); },
    'k-new': function (el) { openNewBooking({ roomId: el.dataset.room, date: el.dataset.date, hour: el.dataset.hour != null ? Number(el.dataset.hour) : null, walkin: el.dataset.walkin === '1' }); },
    'k-new-member': function (el) { var m = W.member(el.dataset.id); if (m) openNewBooking({ memberId: m.id }); },
    'adjust-dialog': function (el) { openAdjustDialog(el.dataset.id); },
    'free-drink': function (el) { useFree(el.dataset.id); },
    'chart-table': function (el) {
      state.chartTable = !state.chartTable;
      el.setAttribute('aria-expanded', String(state.chartTable));
      el.textContent = state.chartTable ? 'Show chart' : 'Show as table';
      $('#d-chart-table').hidden = !state.chartTable;
      $('#d-chart').hidden = state.chartTable;
    }
  };
  /** Typed-but-unsaved changes on the screen: { what } or null. */
  function dirtyNow() {
    if (drawer && drawer.dirty) return { what: firstName(memberName(drawer.id)) + '\'s profile' };
    if (bk && bk.moveDirty) return { what: 'the booking move' };
    return current && current.v.isDirty ? current.v.isDirty() : null;
  }
  function discardDirty() {
    if (drawer) drawer.dirty = false;
    if (bk) { bk.moving = false; bk.moveDirty = false; }
    if (current && current.v.discard) current.v.discard();
  }
  document.addEventListener('click', function (e) {
    // In-app links: ask before leaving unsaved changes behind.
    var link = e.target.closest('a[href^="#"]');
    if (link && !link.target && !e.defaultPrevented && link.getAttribute('href') !== location.hash && link.getAttribute('href') !== '#main') {
      var dirty = dirtyNow();
      if (dirty) {
        e.preventDefault();
        var href = link.getAttribute('href'), inDlg = link.closest('dialog');
        confirmDiscard(dirty.what).then(function (ok) {
          if (!ok) return;
          discardDirty();
          if (inDlg) closeDialog(inDlg, true, true);
          location.hash = href;
        });
        return;
      }
    }
    var close = e.target.closest('[data-close]');
    if (close) { var dlg = close.closest('dialog'); if (dlg) closeDialog(dlg); }
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    var fn = ACTIONS[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); return; }
    if (current && current.v.act && current.v.act(el, e) !== false) return;
    if (drawer && drawer.dlg.contains(el)) drawerAct(el, e);
  });

  /* Mutations shared by several screens -------------------------------- */
  function serveCode(code) {
    try {
      var r = W.serve(code, staffName());
      toast(r.rewardName + ' served', { icon: 'check', sub: r.code + ' · ' + memberName(r.memberId) + ' · by ' + staffName() });
      if (state.counter.code && ('W-' + state.counter.code) === r.code) state.counter.code = r.code.slice(2);
    } catch (e) { toast(errMsg(e), { kind: 'error' }); scheduleRefresh(); }
  }
  function cancelCode(code) {
    var r = W.redemption(code); if (!r) return;
    confirmBox({ title: 'Cancel ' + r.code + '?', body: 'The code stops working and ' + beans(r.cost) + ' go back to ' + memberName(r.memberId) + '.', ok: 'Cancel code and refund', danger: true }).then(function (ok) {
      if (!ok) return;
      try { W.cancelRedemption(code); toast(r.code + ' cancelled', { icon: 'undo', sub: beans(r.cost) + ' returned to ' + firstName(memberName(r.memberId)) }); }
      catch (e) { toast(errMsg(e), { kind: 'error' }); }
    });
  }
  function useFree(id) {
    var m = W.member(id); if (!m) return;
    try { W.useFreeDrink(id, staffName()); toast('Free drink used', { icon: 'cup', sub: firstName(m.name) + ' has ' + plural(m.freeDrinks, 'free drink') + ' left' }); }
    catch (e) { toast(errMsg(e), { kind: 'error' }); }
  }
  /** Demo helper: redeem the cheapest reward for the member signed in to the customer portal (or the demo member), as if they did it in the app. */
  function demoMember() { var s = W.session(); return s.memberId && W.member(s.memberId) ? W.member(s.memberId) : W.member(W.demoMemberId()); }
  function demoCode() {
    var m = demoMember(); if (!m) return;
    var r = W.rewards().filter(function (x) { return x.cost <= m.beans; })[0];
    if (!r) { toast(firstName(m.name) + ' does not have enough beans for a reward', { kind: 'error', sub: 'Add a visit for them first, or turn on a cheaper reward.' }); return; }
    try {
      var red = W.redeem(m.id, r.id);
      toast('Demo code ' + red.code + ' is waiting', { icon: 'ticket', sub: firstName(m.name) + ' redeemed ' + r.name + ', as if in the app' });
    } catch (e) { toast(errMsg(e), { kind: 'error' }); }
  }
  function demoCodeBtn(cls) {
    var m = demoMember();
    return m ? '<button class="' + (cls || 'btn btn--ghost btn--sm') + '" type="button" data-act="demo-code" data-key="demo-code">' + (cls ? '' : icon('ticket')) + 'Try it: create a demo code</button>' : '';
  }

  /* ------------------------------------------------------------------ */
  /* Dialog: scan card (simulated camera)                                */
  /* ------------------------------------------------------------------ */
  function qrSVG(text, cell) {
    if (typeof window.qrcode !== 'function') return '';
    try { var q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell || 4, margin: 0, scalable: true }); }
    catch (e) { return ''; }
  }
  function openScan() {
    var sess = W.session();
    var target = sess.memberId && W.member(sess.memberId) ? sess.memberId : W.demoMemberId();
    var m = W.member(target);
    var timers = [];
    var d = openDialog({
      cls: 'dlg--scan', labelledby: 'scan-title',
      html: '<div class="dlg-box">' +
        '<header class="dlg-head"><div><h2 class="dlg-title" id="scan-title">Scan card</h2><p class="muted">Point the camera at the QR code on the customer\'s card.</p></div>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close scanner">' + icon('x') + '</button></header>' +
        '<div class="vf" id="vf"><div class="vf-float"><div class="vf-card"><div class="vf-card-top"><img src="../assets/img/logo-mark.svg" alt="" width="22" height="22"><span>White Rewards</span></div><div class="vf-qr">' + qrSVG(target, 4) + '</div><span class="vf-id">' + esc(target) + '</span></div></div>' +
        '<span class="vf-c vf-c--tl"></span><span class="vf-c vf-c--tr"></span><span class="vf-c vf-c--bl"></span><span class="vf-c vf-c--br"></span><span class="vf-line"></span>' +
        '<span class="vf-found" aria-hidden="true">' + icon('check') + '</span></div>' +
        '<p class="vf-status" id="vf-status" role="status">Looking for a White Rewards card…</p>' +
        '<p class="hint vf-hint">Demo camera: it finds ' + (sess.memberId && W.member(sess.memberId) ? 'the member signed in to the customer portal' : 'the demo member, ' + esc(m.name)) + '.</p></div>',
      onClose: function () { timers.forEach(clearTimeout); }
    });
    timers.push(setTimeout(function () {
      $('#vf', d).classList.add('is-found');
      $('#vf-status', d).innerHTML = icon('check', 'ic-sm') + ' Found <strong>' + esc(m.name) + '</strong>';
    }, 1200));
    timers.push(setTimeout(function () {
      // Close synchronously: the browser hands focus back to the opener on close, and that must happen before the bill is focused.
      d._noReturn = true;
      closeDialog(d, true, true);
      state.counter.query = '';
      location.hash = '#counter/' + encodeURIComponent(target);
    }, 1950));
  }

  /* ------------------------------------------------------------------ */
  /* Dialog: add member                                                  */
  /* ------------------------------------------------------------------ */
  function openAddMember(prefill, fromCounter) {
    prefill = prefill || {};
    var d = openDialog({
      cls: 'dlg--form', labelledby: 'am-title',
      html: '<form class="dlg-box" id="am-form" novalidate>' +
        '<header class="dlg-head"><div><h2 class="dlg-title" id="am-title">Add a member</h2><p class="muted">They get ' + beans(W.program.welcomeBonus) + ' on their card straight away.</p></div>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + icon('x') + '</button></header>' +
        '<div class="form-grid">' +
        '<div class="field span-2"><label for="am-name">Full name</label><input class="input" id="am-name" autocomplete="off" maxlength="60" value="' + esc(String(prefill.name || '').slice(0, 60)) + '" autofocus></div>' +
        '<div class="field"><label for="am-phone">Mobile number</label><div class="prefix-input"><span aria-hidden="true">+960</span><input class="input" id="am-phone" inputmode="tel" autocomplete="off" maxlength="20" placeholder="771 2408" value="' + esc(prefill.phone || '') + '"></div></div>' +
        '<div class="field"><label for="am-email">Email <span class="opt">optional</span></label><input class="input" id="am-email" type="email" autocomplete="off" spellcheck="false" maxlength="80"></div>' +
        '<div class="field span-2"><span class="field-label" id="am-bd-l">Birthday <span class="opt">optional, for the birthday bonus</span></span>' + birthdaySelects('am') + '</div>' +
        '</div>' +
        '<p class="form-error" id="am-error" role="alert" hidden></p>' +
        '<div class="dlg-actions"><button class="btn btn--ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">' + icon('userPlus') + 'Add member</button></div>' +
        '</form>'
    });
    var amForm = $('#am-form', d);
    amForm.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, ''); setError($('#am-error', d), ''); });
    amForm.addEventListener('change', function (e) { if (e.target.id === 'am-bd' || e.target.id === 'am-bm') fieldErr($('#am-bd', d), ''); });
    amForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#am-error', d);
      clearFieldErrs(d); setError(err, '');
      try {
        var name = $('#am-name', d).value.trim();
        if (!name) fail('am-name', 'Please enter a name');
        var phone = normPhone($('#am-phone', d).value, 'am-phone');
        var email = $('#am-email', d).value.trim();
        if (email && !isEmail(email)) fail('am-email', 'Check the email address, like name@example.mv');
        var m = W.join({ name: name, phone: phone, email: email, birthday: readBirthday(d, 'am'), staff: staffName() });
        closeDialog(d, true, true);
        toast(m.name + ' joined White Rewards', { icon: 'userPlus', sub: beans(W.program.welcomeBonus) + ' welcome bonus · ' + m.id });
        location.hash = (fromCounter ? '#counter/' : '#members/') + encodeURIComponent(m.id);
      } catch (ex) { showFormError(d, ex, err, { 'phone number': 'am-phone', 'name': 'am-name' }); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Adjust beans form (used at the counter and in a dialog)             */
  /* ------------------------------------------------------------------ */
  function adjustFormHTML(p) {
    var pr = W.program;
    var reasons = [
      { r: 'Goodwill', n: '' },
      { r: 'Birthday bonus', n: pr.birthdayBonus },
      { r: 'Referral bonus', n: pr.referralBonus },
      { r: 'Missed visit', n: '' },
      { r: 'Correction', n: '' }
    ];
    return '<div class="seg seg--2" role="group" aria-label="Add or remove beans">' +
      '<button type="button" class="seg-btn" data-dir="1" aria-pressed="true">' + icon('plus') + 'Add beans</button>' +
      '<button type="button" class="seg-btn" data-dir="-1" aria-pressed="false">' + icon('minus') + 'Remove beans</button></div>' +
      '<div class="field"><label for="' + p + '-n">Number of beans</label><input class="input input--big" id="' + p + '-n" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="0"></div>' +
      '<div class="field"><span class="field-label" id="' + p + '-rl">Reason</span><div class="chips" role="group" aria-labelledby="' + p + '-rl">' +
      reasons.map(function (x) { return '<button type="button" class="chip-btn" data-reason="' + esc(x.r) + '" data-n="' + x.n + '" aria-pressed="false">' + esc(x.r) + (x.n ? ' <span class="chip-sub">+' + x.n + '</span>' : '') + '</button>'; }).join('') +
      '</div><label class="visually-hidden" for="' + p + '-r">Reason in your own words</label><input class="input" id="' + p + '-r" autocomplete="off" maxlength="60" placeholder="Or type a reason"></div>' +
      '<p class="adjust-preview" id="' + p + '-pv" aria-live="polite"></p>' +
      '<p class="form-error" id="' + p + '-err" role="alert" hidden></p>' +
      '<button class="btn btn--block" type="submit" id="' + p + '-go">Add beans</button>';
  }
  function bindAdjust(form, p, memberId, done) {
    var dir = 1;
    var n = $('#' + p + '-n', form), r = $('#' + p + '-r', form), pv = $('#' + p + '-pv', form), go = $('#' + p + '-go', form);
    // Digits only, so what the field shows is exactly what gets applied.
    function val() { return Number(n.value) || 0; }
    function sync() {
      var m = W.member(memberId); if (!m) return;
      var v = val(), after = m.beans + dir * v, bad = after < 0;
      $$('.seg-btn', form).forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.dir) === dir)); });
      $$('[data-reason]', form).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.reason === r.value.trim())); });
      if (!v) pv.innerHTML = 'Balance now: <strong>' + beans(m.beans) + '</strong>';
      else if (bad) pv.innerHTML = '<span class="is-bad">' + esc(firstName(m.name)) + ' only has ' + beans(m.beans) + '.</span>';
      else pv.innerHTML = 'New balance: <strong>' + beans(after) + '</strong> <span class="muted">(now ' + F.num(m.beans) + ')</span>';
      go.textContent = (dir > 0 ? 'Add ' : 'Remove ') + (v ? beans(v) : 'beans');
      go.classList.toggle('btn--danger', dir < 0);
      go.disabled = bad;
      if (r.value.trim()) fieldErr(r, '');
    }
    form._sync = sync;
    form.addEventListener('click', function (e) {
      var b = e.target.closest('.seg-btn');
      if (b) { dir = Number(b.dataset.dir); sync(); return; }
      var c = e.target.closest('[data-reason]');
      if (c) { r.value = c.dataset.reason; if (c.dataset.n) { n.value = c.dataset.n; dir = 1; } sync(); }
    });
    n.addEventListener('input', function () {
      var clean = n.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 6);
      if (clean !== n.value) n.value = clean;
      fieldErr(n, ''); sync();
    });
    r.addEventListener('input', sync);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = W.member(memberId), err = $('#' + p + '-err', form), v = val();
      setError(err, '');
      if (!m) return;
      if (!v) { fieldErr(n, 'Enter a number of beans'); n.focus(); return; }
      if (dir < 0 && v > m.beans) { fieldErr(n, firstName(m.name) + ' only has ' + beans(m.beans)); n.focus(); return; }
      if (dir < 0 && !r.value.trim()) { fieldErr(r, 'Pick or type a reason for removing beans'); r.focus(); return; }
      var reason = r.value.trim() || 'Bonus beans';
      function apply() {
        try {
          W.adjust(memberId, dir * v, reason, staffName());
          toast((dir > 0 ? '+' : '−') + beans(v) + ' for ' + firstName(m.name), { icon: dir > 0 ? 'sparkle' : 'adjust', sub: reason + ' · balance ' + beans(m.beans) });
          n.value = ''; r.value = ''; dir = 1; sync();
          if (done) done();
        } catch (ex) { setError(err, errMsg(ex)); }
      }
      if (dir < 0) {
        confirmBox({ title: 'Remove ' + beans(v) + '?', body: firstName(m.name) + '\'s balance goes from ' + F.num(m.beans) + ' to ' + F.num(m.beans - v) + '. This shows in their activity as "' + reason + '".', ok: 'Remove beans', danger: true })
          .then(function (ok) { if (ok) apply(); });
      } else apply();
    });
    sync();
  }
  function openAdjustDialog(id) {
    var m = W.member(id); if (!m) return;
    var d = openDialog({
      cls: 'dlg--form', labelledby: 'adj-title',
      html: '<form class="dlg-box adjust" id="adj-form" novalidate>' +
        '<header class="dlg-head"><div><h2 class="dlg-title" id="adj-title">Adjust beans</h2><p class="muted">' + esc(m.name) + ' · ' + esc(m.id) + '</p></div>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + icon('x') + '</button></header>' +
        adjustFormHTML('adj') + '</form>'
    });
    bindAdjust($('#adj-form', d), 'adj', id, function () { closeDialog(d); });
    $('#adj-n', d).focus();
  }

  /* ================================================================== */
  /* VIEW: Dashboard                                                     */
  /* ================================================================== */
  var Dash = {
    prevKpi: null, prevFeed: null, chartKey: '', ro: null,
    mount: function (host) {
      this.prevKpi = null; this.prevFeed = null; this.chartKey = ''; this.chartDrawn = false;
      // The café opens 4 PM to midnight, so the home screen is tonight: the rooms, the codes at the counter, what just happened.
      host.innerHTML =
        '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Tonight</h1><p class="page-meta" id="d-meta"></p></div>' +
        '<div class="page-actions"><a class="btn" href="#counter">' + icon('cup') + 'Open the counter</a><button class="btn btn--ghost" type="button" data-act="k-new">' + icon('mic') + 'New karaoke booking</button></div></header>' +
        '<section class="kpis" id="d-kpis" aria-label="So far today"></section>' +
        '<div class="dash-grid"><div class="dash-col dash-col--main">' +
        '<section class="panel p-karaoke" aria-labelledby="h-kara"><header class="panel-head"><div><h2 class="panel-title" id="h-kara">Rooms tonight</h2><p class="panel-sub" id="d-k-sub"></p></div><a class="btn btn--ghost btn--sm" href="#karaoke">Full schedule</a></header>' +
        '<div class="kgrid-wrap kgrid-wrap--flush"><div class="kgrid kgrid--compact" id="d-kgrid" role="region" aria-label="Karaoke rooms tonight, by hour"></div></div>' +
        '<p class="kweek" id="d-kweek"></p></section>' +
        '<section class="panel p-feed" aria-labelledby="h-feed"><header class="panel-head"><div><h2 class="panel-title" id="h-feed">Activity</h2><p class="panel-sub">Visits, rewards, sign-ups and bookings, newest first</p></div></header><ol class="log feed" id="d-feed" role="list"></ol></section>' +
        '</div><div class="dash-col dash-col--side">' +
        '<section class="panel p-codes" aria-labelledby="h-codes"><header class="panel-head"><div><h2 class="panel-title" id="h-codes">Reward codes waiting</h2><p class="panel-sub">Members show these at the counter</p></div><span class="count" id="d-codes-n"></span></header><div class="panel-body" id="d-codes"></div></section>' +
        '<section class="panel p-chart" aria-labelledby="h-chart"><header class="panel-head"><div><h2 class="panel-title" id="h-chart">Visits, last 14 days</h2><p class="panel-sub" id="d-chart-sub"></p></div>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-act="chart-table" aria-expanded="' + state.chartTable + '" aria-controls="d-chart-table">' + (state.chartTable ? 'Show chart' : 'Show as table') + '</button></header>' +
        '<div class="panel-body"><div class="chart" id="d-chart"' + (state.chartTable ? ' hidden' : '') + '></div><div class="chart-table" id="d-chart-table"' + (state.chartTable ? '' : ' hidden') + '></div></div></section>' +
        '</div></div></div>';
      var self = this, chart = $('#d-chart'), lastW = 0;
      this.ro = new ResizeObserver(function () { var w = chart.clientWidth; if (w && Math.abs(w - lastW) > 2) { lastW = w; self.chartKey = ''; self.renderChart(); } });
      this.ro.observe(chart);
    },
    unmount: function () { if (this.ro) this.ro.disconnect(); this.ro = null; },
    update: function () {
      var s = W.stats(14), staff = W.currentStaff(), p = W.maleParts(), open = W.openStatus();
      patch($('#d-meta'), '<span>' + esc(DAYS[p.day] + ' ' + p.d + ' ' + MONTHS[p.mo]) + '</span><span class="meta-open"><span class="status-dot' + (open.open ? ' is-open' : '') + '" aria-hidden="true"></span>' + esc(open.label + ', ' + open.detail) + '</span><span>' + esc(staff) + ' on shift</span>');
      var k = this.renderKaraoke();
      this.renderKpis(s, k);
      this.series = s.series;
      this.renderChart();
      // Codes waiting
      var ready = W.redemptions('ready');
      patch($('#d-codes-n'), ready.length ? String(ready.length) : '');
      $('#d-codes-n').hidden = !ready.length;
      var served = W.redemptions('served').slice().sort(function (a, b) { return (b.servedAt || 0) - (a.servedAt || 0); }).slice(0, ready.length ? 3 : 4);
      patch($('#d-codes'), (ready.length ? '<ul class="code-list" role="list">' + ready.map(function (r) { return codeRow(r); }).join('') + '</ul>' :
        '<div class="codes-empty"><p class="empty-title">No codes waiting</p><p class="empty-text">When a member redeems a reward in the app, the code shows up here and at the counter.</p>' + demoCodeBtn() + '</div>') +
        (served.length ? '<h3 class="sub-title served-title">Recently served</h3><ul class="served-list" role="list">' + served.map(function (r) {
          return '<li class="served-row"><span class="code-tag code-tag--done">' + esc(r.code) + '</span><div class="code-row-txt"><p class="code-row-title">' + esc(r.rewardName) + '</p>' +
            '<p class="code-row-meta">' + esc(memberName(r.memberId)) + ' · ' + esc(F.ago(r.servedAt)) + (r.servedBy ? ' by ' + esc(r.servedBy) : '') + '</p></div></li>';
        }).join('') + '</ul>' : ''));
      // Feed
      var feed = W.activity(null, 12);
      var prev = this.prevFeed, ids = {};
      var html = feed.map(function (a) { ids[a.id] = 1; return logRow(a, { withName: true, link: true, ago: true, isNew: prev && !prev[a.id] }); }).join('');
      patch($('#d-feed'), html);
      this.prevFeed = ids;
    },
    /** Rooms tonight: the same schedule as Karaoke, compact. Returns tonight's numbers for the strip above. */
    renderKaraoke: function () {
      var ks = W.karaokeStats(), today = W.karaokeToday(), R = W.karaokeRules();
      var live = liveBookings(today), rooms = scheduleRooms(live), cap = W.karaokeRooms().length * (R.close - R.open);
      var hours = 0, total = 0, inRoom = 0;
      live.forEach(function (b) { hours += b.hours; total += b.total; if (b.status === 'checked-in') inRoom++; });
      patch($('#d-k-sub'), esc(W.karaokeDateLabel(today) + ' · ' + (live.length ? plural(live.length, 'booking') + ', ' + hours + ' of ' + cap + ' room hours' : 'no bookings yet')));
      var grid = $('#d-kgrid'); grid.style.setProperty('--rooms', rooms.length);
      patch(grid, kGridHTML(today, rooms, live, { compact: true, kp: 'dk' }));
      if (state.karaoke.flash) { var fl = state.karaoke.flash; setTimeout(function () { if (state.karaoke.flash === fl) state.karaoke.flash = null; }, 2200); }
      patch($('#d-kweek'), '<span>Next 7 days</span><strong class="num">' + plural(ks.upcomingWeek, 'booking') + '</strong><strong class="num">' + esc(F.mvr(ks.revenueWeek)) + '</strong><span class="kweek-hint">Tap a free hour to book it.</span>');
      return { n: live.length, hours: hours, cap: cap, total: total, inRoom: inRoom };
    },
    renderKpis: function (s, k) {
      var y = s.series[s.series.length - 2] || { visits: 0, sales: 0 };
      var vals = { visits: s.visitsToday, sales: s.salesToday, kara: k.n + ':' + k.hours };
      var tiles = [
        { k: 'visits', label: 'Visits today', v: F.num(s.visitsToday), sub: 'Yesterday ' + F.num(y.visits) },
        { k: 'sales', label: 'Sales today', v: mvrHTML(s.salesToday), sub: 'Yesterday ' + F.mvr(y.sales) },
        { k: 'kara', label: 'Karaoke tonight', v: F.num(k.n) + ' <span class="unit unit--after">' + (k.n === 1 ? 'booking' : 'bookings') + '</span>',
          sub: k.inRoom ? k.inRoom + ' in a room now' : k.hours + ' of ' + k.cap + ' room hours, ' + F.mvr(k.total) }
      ];
      var prev = this.prevKpi;
      patch($('#d-kpis'), tiles.map(function (t) {
        return '<div class="kpi" data-k="' + t.k + '"><p class="kpi-label">' + t.label + '</p><p class="kpi-value num">' + t.v + '</p><p class="kpi-sub">' + esc(t.sub) + '</p></div>';
      }).join(''));
      if (prev) Object.keys(vals).forEach(function (key) { if (prev[key] !== vals[key]) { var el = $('#d-kpis [data-k="' + key + '"]'); if (el) { el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash'); } } });
      this.prevKpi = vals;
    },
    renderChart: function () {
      var host = $('#d-chart'); if (!host || !this.series) return;
      var series = this.series, w = host.clientWidth || 600;
      var key = w + '|' + series.map(function (d) { return d.visits + ':' + d.sales; }).join(',');
      // table view (always kept in sync)
      var total = 0, best = series[0];
      series.forEach(function (d) { total += d.visits; if (d.visits >= best.visits) best = d; });
      patch($('#d-chart-sub'), esc(F.num(total) + ' visits · busiest day ' + weekdayShort(best.day) + ' ' + F.shortDate(best.day) + ' (' + best.visits + ')'));
      patch($('#d-chart-table'), '<table class="table table--compact"><caption class="visually-hidden">Visits per day, last 14 days</caption><thead><tr><th scope="col">Day</th><th scope="col" class="r">Visits</th><th scope="col" class="r">Sales</th><th scope="col" class="r">Beans earned</th></tr></thead><tbody>' +
        series.slice().reverse().map(function (d, i) { return '<tr><th scope="row">' + (i === 0 ? 'Today' : weekdayShort(d.day) + ' ' + F.shortDate(d.day)) + '</th><td class="r num">' + d.visits + '</td><td class="r num">' + F.mvr(d.sales) + '</td><td class="r num">' + F.num(d.beans) + '</td></tr>'; }).join('') + '</tbody></table>');
      if (key === this.chartKey) return;
      this.chartKey = key;
      var hadFocus = host.contains(document.activeElement) ? document.activeElement.getAttribute('data-i') : null;
      host.innerHTML = barChart(series, w);
      if (this.chartDrawn) host.firstElementChild.classList.add('no-anim');
      this.chartDrawn = true;
      bindChart(host);
      if (hadFocus != null) { var g = host.querySelector('[data-i="' + hadFocus + '"]'); if (g) g.focus({ preventScroll: true }); }
    }
  };

  function niceTicks(max) {
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
    var step = steps[steps.length - 1];
    for (var i = 0; i < steps.length; i++) { if (max / steps[i] <= 4) { step = steps[i]; break; } }
    var top = Math.max(step, Math.ceil(max / step) * step);
    var t = []; for (var v = 0; v <= top; v += step) t.push(v);
    return { ticks: t, top: top };
  }
  function barChart(series, w) {
    var narrow = w < 520;
    var H = narrow ? 236 : 258;
    var m = { l: 32, r: 6, t: 30, b: 46 };
    var iw = Math.max(100, w - m.l - m.r), ih = H - m.t - m.b;
    var max = 0; series.forEach(function (d) { max = Math.max(max, d.visits); });
    var nt = niceTicks(Math.max(1, max)), top = nt.top;
    var band = iw / series.length, bw = Math.min(24, Math.max(6, band * 0.58));
    function y(v) { return m.t + ih - (v / top) * ih; }
    var out = '<svg class="bars" width="' + w + '" height="' + H + '" viewBox="0 0 ' + w + ' ' + H + '" role="group" aria-label="Visits per day for the last 14 days. Use the arrow keys to move between days.">' +
      '<text class="axis axis--title" x="0" y="12" aria-hidden="true">Visits</text>';
    nt.ticks.forEach(function (t) {
      var yy = Math.round(y(t)) + 0.5;
      out += '<line class="grid' + (t === 0 ? ' grid--base' : '') + '" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + yy + '" y2="' + yy + '"/>';
      out += '<text class="axis axis--y" x="' + (m.l - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + t + '</text>';
    });
    var last = series.length - 1, maxI = 0;
    series.forEach(function (d, i) { if (d.visits >= series[maxI].visits) maxI = i; });
    // Narrow bars: label every other day (counting back from today) plus the 1st of a month, so numbers never run together.
    var every = band < 26 ? 2 : 1, show = {}, firstLabel = -1;
    series.forEach(function (d, i) { if ((last - i) % every === 0) show[i] = true; });
    // The 1st of a month is always labelled; on narrow charts its neighbours step aside so numbers never touch.
    series.forEach(function (d, i) { if (W.maleParts(d.day).d === 1) { show[i] = true; if (every > 1) { if (i - 1 >= 0) show[i - 1] = false; if (i + 1 < last) show[i + 1] = false; } } });
    series.forEach(function (d, i) { if (show[i] && firstLabel < 0) firstLabel = i; });
    series.forEach(function (d, i) {
      var cx = m.l + band * i + band / 2, x = cx - bw / 2, hgt = (d.visits / top) * ih, y0 = m.t + ih;
      var r = 0;   // square tops: printed, not bubbly
      var path = hgt > 0 ? 'M' + x + ',' + y0 + 'V' + (y0 - hgt + r) + 'Q' + x + ',' + (y0 - hgt) + ' ' + (x + r) + ',' + (y0 - hgt) + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + (y0 - hgt) + ' ' + (x + bw) + ',' + (y0 - hgt + r) + 'V' + y0 + 'Z' : '';
      var label = (i === last ? 'Today, ' : '') + DAYS[W.maleParts(d.day).day] + ' ' + F.shortDate(d.day) + ': ' + plural(d.visits, 'visit') + ', ' + F.mvr(d.sales) + ' in sales';
      out += '<g class="bar' + (i === last ? ' bar--today' : '') + '" style="--i:' + i + '" data-i="' + i + '" tabindex="' + (i === last ? 0 : -1) + '" role="img" aria-label="' + esc(label) + '">' +
        '<rect class="bar-hit" x="' + (m.l + band * i) + '" y="' + m.t + '" width="' + band + '" height="' + (ih + m.b) + '"/>' +
        (path ? '<path class="bar-mark" d="' + path + '"/>' : '') +
        '<rect class="bar-focus" x="' + (x - 3) + '" y="' + (y0 - hgt - 3) + '" width="' + (bw + 6) + '" height="' + (hgt + 3) + '" rx="5"/>';
      if ((i === last || i === maxI) && d.visits > 0) out += '<text class="cap" x="' + cx + '" y="' + (y0 - hgt - 7) + '" text-anchor="middle">' + d.visits + '</text>';
      var p = W.maleParts(d.day);
      if (narrow) {
        if (show[i]) out += '<text class="axis axis--x' + (i === last ? ' is-today' : '') + '" x="' + cx + '" y="' + (H - 26) + '" text-anchor="middle" aria-hidden="true">' + p.d + '</text>';
        if (i === firstLabel || (p.d === 1 && i !== firstLabel)) out += '<text class="axis axis--x axis--sub" x="' + cx + '" y="' + (H - 9) + '" text-anchor="middle" aria-hidden="true">' + F.shortDate(d.day).split(' ')[1] + '</text>';
      } else {
        out += '<text class="axis axis--x' + (i === last ? ' is-today' : '') + '" x="' + cx + '" y="' + (H - 26) + '" text-anchor="middle">' + (i === last ? 'Today' : DAYS[p.day].slice(0, 3)) + '</text>';
        out += '<text class="axis axis--x axis--sub" x="' + cx + '" y="' + (H - 9) + '" text-anchor="middle">' + p.d + (i === 0 || p.d === 1 ? ' ' + F.shortDate(d.day).split(' ')[1] : '') + '</text>';
      }
      out += '</g>';
    });
    out += '</svg><div class="tip" id="d-tip" role="presentation" hidden></div>';
    return out;
  }
  function bindChart(host) {
    var tip = $('#d-tip', host), svg = $('svg', host), series = Dash.series;
    function show(g) {
      var i = Number(g.dataset.i), d = series[i]; if (!d) return;
      $$('.bar.is-hover', host).forEach(function (b) { b.classList.remove('is-hover'); });
      g.classList.add('is-hover');
      tip.innerHTML = '<strong>' + plural(d.visits, 'visit') + '</strong><span>' + (i === series.length - 1 ? 'Today · ' : '') + esc(DAYS[W.maleParts(d.day).day] + ' ' + F.shortDate(d.day)) + '</span><span>' + esc(F.mvr(d.sales)) + ' sales · ' + esc(beans(d.beans)) + '</span>';
      tip.hidden = false;
      var mark = g.querySelector('.bar-mark') || g.querySelector('.bar-hit');
      var hb = host.getBoundingClientRect(), mb = mark.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = mb.left - hb.left + mb.width / 2 - tw / 2;
      left = Math.max(0, Math.min(hb.width - tw, left));
      var top = (g.querySelector('.bar-mark') ? mb.top : mb.bottom - 40) - hb.top - th - 10;
      tip.style.left = left + 'px'; tip.style.top = Math.max(-8, top) + 'px';
    }
    function hide() { tip.hidden = true; $$('.bar.is-hover', host).forEach(function (b) { b.classList.remove('is-hover'); }); }
    $$('.bar', host).forEach(function (g) {
      g.addEventListener('pointerenter', function () { show(g); });
      g.addEventListener('focus', function () { show(g); });
      g.addEventListener('blur', hide);
    });
    svg.addEventListener('pointerleave', function () { if (!host.contains(document.activeElement)) hide(); });
    svg.addEventListener('keydown', function (e) {
      var g = e.target.closest('.bar'); if (!g) return;
      var i = Number(g.dataset.i), n = series.length, j = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = Math.min(n - 1, i + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = Math.max(0, i - 1);
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1; else if (e.key === 'Escape') { hide(); return; } else return;
      e.preventDefault();
      var next = host.querySelector('.bar[data-i="' + j + '"]');
      $$('.bar', host).forEach(function (b) { b.setAttribute('tabindex', '-1'); });
      next.setAttribute('tabindex', '0'); next.focus();
    });
  }

  /* ================================================================== */
  /* VIEW: Counter                                                       */
  /* ================================================================== */
  var Counter = {
    mount: function (host, id) {
      host.innerHTML =
        '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Counter</h1><p class="page-desc">Find the customer, add their visit, hand over rewards.</p></div></header>' +
        '<div class="counter" id="ct">' +
        '<div class="ct-find">' +
        '<form class="find-bar" id="ct-find" role="search" novalidate>' +
        '<div class="search"><label class="visually-hidden" for="ct-q">Find a member by name, phone or member ID</label>' + icon('search') +
        '<input class="input" id="ct-q" type="search" placeholder="Name, phone or member ID" autocomplete="off" spellcheck="false" enterkeyhint="search" value="' + esc(state.counter.query) + '"></div></form>' +
        '<div class="find-actions"><button class="btn btn--ghost" type="button" data-act="scan">' + icon('scan') + 'Scan card</button>' +
        '<button class="btn btn--ghost" type="button" data-act="add-member" data-from="counter">' + icon('userPlus') + 'New member</button></div>' +
        '<div class="results" id="ct-results"></div></div>' +
        '<div class="ct-member" id="ct-member"></div>' +
        '<section class="panel ct-code" aria-labelledby="h-code">' +
        '<header class="panel-head"><div><h2 class="panel-title" id="h-code">Serve a reward code</h2><p class="panel-sub">Members show a code like W-K9PF in their app</p></div></header>' +
        '<div class="panel-body"><form class="code-form" id="code-form" novalidate><label class="visually-hidden" for="code-q">Reward code</label>' +
        '<div class="code-field"><span aria-hidden="true">W-</span><input class="input" id="code-q" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="K9PF" value="' + esc(state.counter.code) + '"></div>' +
        '<button class="btn" type="submit">Find</button></form>' +
        '<div id="code-result" aria-live="polite"></div>' +
        '<h3 class="sub-title">Waiting now</h3><div id="code-list"></div></div>' +
        '</section>' +
        '</div></div>';
      var self = this;
      var q = $('#ct-q');
      q.addEventListener('input', function () { state.counter.query = q.value; self.renderResults(); self.layout(); });
      q.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { var b = $('#ct-results .res-btn'); if (b) { e.preventDefault(); b.focus(); } }
        if (e.key === 'Escape' && q.value) { e.preventDefault(); q.value = ''; state.counter.query = ''; self.renderResults(); self.layout(); }
      });
      $('#ct-find').addEventListener('submit', function (e) {
        e.preventDefault();
        var b = $('#ct-results .res-btn'); if (b && state.counter.query.trim()) b.click();
      });
      $('#ct-results').addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        var list = $$('#ct-results .res-btn'), i = list.indexOf(document.activeElement); if (i < 0) return;
        e.preventDefault();
        if (e.key === 'ArrowUp' && i === 0) { q.focus(); return; }
        var n = list[Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]; if (n) n.focus();
      });
      var cq = $('#code-q');
      cq.addEventListener('input', function () {
        var v = Counter.cleanCode(cq.value);
        if (cq.value !== v) cq.value = v;
        state.counter.code = v.length === 4 ? v : '';
        self.renderCode();
      });
      $('#code-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var v = Counter.cleanCode(cq.value);
        if (cq.value !== v) cq.value = v;
        state.counter.code = v; self.renderCode(true);
      });
      this.memberId = undefined;
      this.route(id, true);
    },
    unmount: function () { state.counter.success = null; state.counter.successAt = 0; },
    /** "w-k9pf", " W-K9PF", "WK9PF" and "K9PF" all become K9PF. Codes can start with W themselves (W-WNFA), so only a 5th character makes a leading W a prefix. */
    cleanCode: function (raw) {
      var s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (s.length > 4 && s.charAt(0) === 'W') s = s.slice(1);
      return s.slice(0, 4);
    },
    focusOnEnter: function () {
      var c = state.counter;
      if (c.memberId && c.tab === 'visit' && !c.success) return $('#v-amount');
      return finePointer.matches && !c.memberId ? $('#ct-q') : null;
    },
    /** Put the cursor in the bill field (the next thing staff type) and make sure it is not under the top bar or the Add visit band. */
    focusBill: function () {
      var f = $('#v-amount'); if (!f) return;
      f.focus({ preventScroll: true });
      var r = f.getBoundingClientRect(), go = $('#mp-go'), top = phoneMQ.matches ? 72 : 16;
      var bottom = go && !go.hidden ? Math.min(innerHeight, go.getBoundingClientRect().top + 12) : innerHeight;
      if (r.top < top || r.bottom > bottom) f.scrollIntoView({ block: 'center', behavior: 'auto' });
    },
    route: function (id, fromMount) {
      var c = state.counter;
      if (id && !W.member(id)) { toast('No member with ID ' + id, { kind: 'error' }); history.replaceState(null, '', '#counter'); id = null; }
      var changed = (id || null) !== c.memberId;
      if (changed) { c.memberId = id || null; c.success = null; c.tab = 'visit'; c.amount = ''; c.amountManual = false; c.drinks = 0; c.items = []; c.double = false; }
      if (id && c.query) { c.query = ''; var q = $('#ct-q'); if (q) q.value = ''; }
      if (this.memberId !== c.memberId) this.mountMember();
      else this.layout();
      // Picking a member (search + Enter, a tap, or a scan) goes straight to the bill.
      if (changed && c.memberId && !fromMount) { this.update(); this.focusBill(); }
    },
    layout: function () {
      var ct = $('#ct'); if (!ct) return;
      ct.classList.toggle('has-member', !!state.counter.memberId);
      var pg = ct.closest('.page'); if (pg) pg.classList.toggle('has-member', !!state.counter.memberId);
      ct.classList.toggle('has-query', !!state.counter.query.trim());
    },
    update: function () {
      var c = state.counter;
      if (c.memberId && !W.member(c.memberId)) { c.memberId = null; history.replaceState(null, '', '#counter'); this.mountMember(); }
      this.renderResults();
      this.renderMember();
      this.renderCode();
      this.layout();
    },
    renderResults: function () {
      var c = state.counter, q = c.query.trim(), list, head;
      if (q) { list = W.findMembers(q).slice(0, 8); head = list.length ? plural(list.length, 'match', 'matches') : ''; }
      else {
        list = W.members().slice().sort(function (a, b) { return (b.lastVisit || b.joined) - (a.lastVisit || a.joined); }).slice(0, 6);
        head = 'Recent customers';
      }
      var html = head ? '<p class="results-head">' + esc(head) + '</p>' : '';
      if (!list.length) {
        var digits = q.replace(/\D/g, '');
        html += emptyState('search', 'No member matches “' + q + '”', 'Check the spelling, or add them now. It takes 20 seconds.',
          '<button class="btn btn--sm" type="button" data-act="add-member-q" data-key="add-q">' + icon('userPlus') + 'Add as a new member</button>');
        this._prefill = digits.length >= 3 && digits.length === q.replace(/[\s+-]/g, '').length ? { phone: digits.replace(/^960/, '') } : { name: q };
      } else {
        html += '<ul class="res-list" role="list">' + list.map(function (m) {
          var t = W.tier(m), on = m.id === c.memberId;
          return '<li><button class="res-btn' + (on ? ' is-on' : '') + '" type="button" data-act="counter-member" data-id="' + esc(m.id) + '" data-key="r-' + esc(m.id) + '"' + (on ? ' aria-current="true"' : '') + '>' +
            '<span class="res-main"><span class="res-name">' + esc(m.name) + '</span><span class="res-meta">' + esc(m.phone) + ' · ' + esc(m.id) + '</span></span>' +
            '<span class="res-side">' + tierChip(t) + '<span class="res-beans num">' + F.num(m.beans) + ' <span class="muted">beans</span></span></span></button></li>';
        }).join('') + '</ul>';
      }
      patch($('#ct-results'), html);
    },
    mountMember: function () {
      var host = $('#ct-member'); if (!host) return;
      var c = state.counter;
      host._html = null;
      if (!c.memberId) {
        host.innerHTML = '<div class="ct-empty"><h2 class="ct-empty-title">Ready for the next customer</h2>' +
          '<p class="muted">Search by name, phone or member ID, or scan the QR code on their White Rewards card. Their visit, rewards and coffee card open here.</p></div>';
        this.memberId = null;
        this.layout();
        return;
      }
      // The Add visit band is a direct child of the card (not of the form), so it can stay pinned above the
      // tab bar for as long as the card is on screen — a sticky element cannot rise above its own parent.
      host.innerHTML = '<section class="panel mp" aria-labelledby="mp-name"><div id="mp-sum"></div>' +
        '<div class="mp-tabs" id="mp-tabs" role="group" aria-label="What would you like to do?"></div><div class="mp-body" id="mp-body"></div>' +
        '<div class="visit-go" id="mp-go" hidden><button class="btn btn--lg btn--block" type="submit" form="visit-form" id="v-submit">' + icon('check') + 'Add visit</button></div></section>';
      this.memberId = c.memberId;
      this.mountBody();
      this.layout();
    },
    renderMember: function () {
      var c = state.counter, m = c.memberId && W.member(c.memberId); if (!m || !$('#mp-sum')) return;
      var t = W.tier(m), tp = W.tierProgress(m), ready = W.redemptions('ready').filter(function (r) { return r.memberId === m.id; });
      var bd = birthdaySoon(m.birthday);
      var kb = W.karaokeBookings({ memberId: m.id, date: W.karaokeToday() }).filter(function (b) { return b.status === 'confirmed' || b.status === 'checked-in'; })[0];
      patch($('#mp-sum'),
        '<header class="mp-head">' +
        '<div class="mp-who"><h2 class="mp-name" id="mp-name" title="' + esc(m.name) + '">' + esc(m.name) + '</h2><p class="mp-meta">' + tierChip(t) + '<span class="nowrap">' + esc(m.phone) + '</span><span class="mp-id">' + esc(m.id) + '</span></p></div>' +
        '<button class="icon-btn" type="button" data-act="clear-member" data-key="mp-clear" aria-label="Done with ' + esc(m.name) + '">' + icon('x') + '</button></header>' +
        '<div class="mp-stats">' +
        '<div class="mp-stat mp-stat--beans"><span class="mp-stat-l">Beans</span><strong class="mp-stat-v">' + F.num(m.beans) + '</strong><span class="mp-stat-s">' + (tp.next ? F.num(tp.need) + ' lifetime beans to ' + esc(tp.next.name) : 'Top tier') + '</span></div>' +
        '<div class="mp-stat"><span class="mp-stat-l">Coffee card</span>' + cupsHTML(m, 'cups--sm') + '<span class="mp-stat-s">' + Math.min(m.stamps, W.program.stampsForFree) + ' of ' + W.program.stampsForFree + '</span></div>' +
        '<div class="mp-stat"><span class="mp-stat-l">Free drinks</span><strong class="mp-stat-v' + (m.freeDrinks ? ' is-gold' : '') + '">' + m.freeDrinks + '</strong></div>' +
        '</div>' +
        '<p class="mp-notes">' +
        (m.favourite ? '<span>' + icon('cup', 'ic-sm') + 'Usually has <strong>' + esc(m.favourite) + '</strong></span>' : '') +
        (bd ? '<span class="mp-bday">' + icon('cake', 'ic-sm') + esc(bd) + '</span>' : '') +
        (m.note ? '<span class="mp-note">' + icon('info', 'ic-sm') + esc(m.note) + '</span>' : '') +
        (kb ? '<a class="mp-kara" href="#karaoke/' + esc(kb.id) + '">' + icon('mic', 'ic-sm') + 'Karaoke today, ' + esc(kb.roomName) + ' ' + esc(hourRange(kb.start, kb.hours)) + '</a>' : '') +
        '<a class="mp-profile" href="#members/' + esc(encodeURIComponent(m.id)) + '">Full profile' + icon('chevronRight', 'ic-sm') + '</a></p>');
      var tabs = [
        { id: 'visit', label: 'Add visit', ic: 'plus' },
        { id: 'codes', label: 'Rewards', ic: 'ticket', n: ready.length },
        { id: 'free', label: 'Free drink', ic: 'cup', n: m.freeDrinks },
        { id: 'adjust', label: 'Adjust', ic: 'adjust' }
      ];
      patch($('#mp-tabs'), tabs.map(function (x) {
        return '<button type="button" class="mp-tab" data-act="mp-tab" data-tab="' + x.id + '" data-key="tab-' + x.id + '" aria-pressed="' + (c.tab === x.id) + '"><span>' + x.label + '</span>' + (x.n ? '<span class="mp-tab-n">' + x.n + '</span>' : '') + '</button>';
      }).join(''));
      this.renderBody();
    },
    mountBody: function () {
      var c = state.counter, body = $('#mp-body'); if (!body) return;
      body._html = null;
      var m = W.member(c.memberId); if (!m) return;
      var go = $('#mp-go'); if (go) go.hidden = !!(c.success || c.tab !== 'visit');
      if (c.success) { body.innerHTML = '<div id="mp-success"></div>'; return; }
      if (c.tab === 'visit') body.innerHTML = this.visitHTML();
      else if (c.tab === 'adjust') body.innerHTML = '<form class="adjust" id="ct-adj" novalidate>' + adjustFormHTML('ca') + '</form>';
      else body.innerHTML = '<div id="mp-live"></div>';
      if (c.tab === 'visit') this.bindVisit();
      if (c.tab === 'adjust') bindAdjust($('#ct-adj'), 'ca', m.id);
    },
    renderBody: function () {
      var c = state.counter, m = W.member(c.memberId); if (!m) return;
      if (c.success) {
        var s = c.success;
        patch($('#mp-success'), '<div class="success" role="status"><span class="success-mark">' + icon('check') + '</span>' +
          '<p class="success-kicker">Visit added for ' + esc(firstName(m.name)) + '</p>' +
          '<p class="success-big"><strong>+' + F.num(s.beans) + '</strong> beans</p>' +
          '<p class="success-text">' + esc(F.mvr(s.amount)) + (s.multiplier > 1 ? ' · double beans' : '') + ' · balance now <strong>' + beans(m.beans) + '</strong> · coffee card ' + Math.min(m.stamps, W.program.stampsForFree) + ' of ' + W.program.stampsForFree + '</p>' +
          (s.free ? '<p class="success-free">Coffee card full: ' + (s.free === 1 ? 'a free drink is' : s.free + ' free drinks are') + ' waiting</p>' : '') +
          '<p class="hint success-hint">Typed the wrong bill? Remove the beans with Adjust beans (reason: Correction).</p>' +
          '<div class="success-actions"><button class="btn" type="button" data-act="next-customer" id="sx-next">' + icon('arrowRight') + 'Next customer</button>' +
          '<button class="btn btn--ghost" type="button" data-act="success-done">Back to ' + esc(firstName(m.name)) + '</button></div></div>');
        return;
      }
      if (c.tab === 'visit') this.renderVisitLive();
      else if (c.tab === 'codes') patch($('#mp-live'), this.codesHTML(m));
      else if (c.tab === 'free') patch($('#mp-live'), this.freeHTML(m));
      else if (c.tab === 'adjust') { var f = $('#ct-adj'); if (f && f._sync) f._sync(); }
    },
    visitHTML: function () {
      var c = state.counter;
      return '<form class="visit" id="visit-form" novalidate>' +
        '<div class="visit-top">' +
        '<div class="field"><label for="v-amount">Bill amount</label><div class="money"><span aria-hidden="true">MVR</span><input class="input input--big" id="v-amount" inputmode="decimal" maxlength="9" autocomplete="off" placeholder="0" value="' + esc(c.amount) + '" aria-describedby="v-amount-h"></div><p class="hint" id="v-amount-h">Total on the receipt, before service charge</p></div>' +
        '<div class="field"><span class="field-label" id="v-dr-l">Handcrafted drinks</span><div class="stepper" role="group" aria-labelledby="v-dr-l">' +
        '<button type="button" class="step-btn" data-act="drinks" data-d="-1" aria-label="One drink fewer">' + icon('minus') + '</button>' +
        '<output class="step-val num" id="v-drinks" aria-live="polite">' + c.drinks + '</output>' +
        '<button type="button" class="step-btn" data-act="drinks" data-d="1" aria-label="One drink more">' + icon('plus') + '</button></div><p class="hint">One coffee-card stamp each</p></div>' +
        '</div>' +
        // What makes up this bill sits right under the bill, not below the item list.
        '<div class="order" id="v-order" aria-live="polite"></div>' +
        '<div class="quick"><div class="quick-head"><span class="field-label" id="v-q-l">Add from the menu</span>' +
        '<div class="search search--sm"><label class="visually-hidden" for="v-qq">Find a menu item</label>' + icon('search') + '<input class="input" id="v-qq" type="search" placeholder="Find an item" autocomplete="off" enterkeyhint="done" value="' + esc(c.qq || '') + '"></div></div>' +
        '<div class="utabs" id="v-cats" role="group" aria-label="Menu section"></div>' +
        '<div class="qi-list" id="v-chips" role="group" aria-labelledby="v-q-l"></div></div>' +
        '<div class="switch-row"><button type="button" class="switch" role="switch" id="v-double" aria-checked="' + c.double + '" aria-labelledby="v-double-l" aria-describedby="v-double-h"><i></i></button>' +
        '<label class="switch-row-txt" for="v-double"><span class="switch-label" id="v-double-l">Double beans</span><span class="hint" id="v-double-h">For double-bean hours and special days</span></label></div>' +
        '<div class="earn-preview" id="v-preview" aria-live="polite"></div>' +
        '<p class="form-error" id="v-error" role="alert" hidden></p>' +
        '</form>';
    },
    bindVisit: function () {
      var c = state.counter, self = this, amt = $('#v-amount'), qq = $('#v-qq');
      amt.addEventListener('input', function () {
        var v = amt.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
        if (v !== amt.value) amt.value = v;
        c.amount = v; c.amountManual = true; setError($('#v-error'), ''); fieldErr(amt, ''); self.renderVisitLive();
      });
      qq.addEventListener('input', function () { c.qq = qq.value; self.renderVisitLive(); });
      // Enter in the item search adds the first match instead of submitting the visit.
      qq.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && qq.value) { e.preventDefault(); e.stopPropagation(); qq.value = ''; c.qq = ''; self.renderVisitLive(); return; }
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var first = $('#v-chips .qi:not(:disabled)'); if (first && c.qq.trim()) first.click();
      });
      $('#v-double').addEventListener('click', function () { c.double = !c.double; this.setAttribute('aria-checked', String(c.double)); self.renderVisitLive(); });
      $('#visit-form').addEventListener('submit', function (e) { e.preventDefault(); self.submitVisit(); });
    },
    /** The item buttons for the current section (or the search). */
    quickHTML: function (counts) {
      var c = state.counter, q = String(c.qq || '').trim().toLowerCase();
      function tile(it) {
        var n = counts[it.id] || 0;
        return '<button type="button" class="qi' + (n ? ' is-in' : '') + '" data-act="quick" data-id="' + esc(it.id) + '" data-key="q-' + esc(it.id) + '"' + (it.available ? '' : ' disabled') +
          ' aria-label="Add ' + esc(it.name) + (it.available ? ', ' + esc(F.mvr(it.price)) : ', sold out') + (n ? ', ' + n + ' in this bill' : '') + '">' +
          '<span class="qi-name">' + esc(it.name) + '</span><span class="qi-price num">' + (it.available ? F.num(it.price) : 'Sold out') + '</span>' + (n ? '<span class="qi-n" aria-hidden="true">×' + n + '</span>' : '') + '</button>';
      }
      if (q) {
        var hits = W.menu().filter(function (it) { return it.name.toLowerCase().indexOf(q) > -1; }).slice(0, 18);
        return hits.length ? '<div class="qi-grid">' + hits.map(tile).join('') + '</div>' : '<p class="muted qi-none">Nothing on the menu matches “' + esc(c.qq.trim()) + '”.</p>';
      }
      if (c.cat === 'popular') return '<div class="qi-grid">' + POPULAR.map(function (id) { return W.menuItem(id); }).filter(Boolean).map(tile).join('') + '</div>';
      return W.categories().filter(function (k) { return k.group === c.cat; }).map(function (k) {
        return '<h4 class="qi-cat">' + esc(k.name) + '</h4><div class="qi-grid">' + W.menu(k.id).map(tile).join('') + '</div>';
      }).join('');
    },
    renderVisitLive: function () {
      var c = state.counter, m = W.member(c.memberId); if (!m || !$('#v-preview')) return;
      if (['popular', 'drinks', 'food'].indexOf(c.cat) < 0) c.cat = 'popular';
      var counts = {}; c.items.forEach(function (x) { counts[x.id] = (counts[x.id] || 0) + 1; });
      var searching = !!String(c.qq || '').trim();
      patch($('#v-cats'), [['popular', 'Popular'], ['drinks', 'Drinks'], ['food', 'Food']].map(function (k) {
        return '<button type="button" class="utab" data-act="quick-cat" data-cat="' + k[0] + '" data-key="cat-' + k[0] + '" aria-pressed="' + (!searching && c.cat === k[0]) + '">' + k[1] + '</button>';
      }).join(''));
      patch($('#v-chips'), this.quickHTML(counts));
      var order = [], seenIds = {};
      c.items.forEach(function (x) { if (!seenIds[x.id]) { seenIds[x.id] = 1; order.push(x); } });
      var sum = 0; c.items.forEach(function (x) { sum += x.price; });
      patch($('#v-order'), order.length ? '<div class="order-head"><span class="field-label">In this bill</span><button type="button" class="link-btn" data-act="clear-order" data-key="clear-order">Clear</button></div><ul class="order-list" role="list">' + order.map(function (x) {
        var it = W.menuItem(x.id), name = it ? it.name : x.name, n = counts[x.id];
        return '<li class="order-row"><span class="order-name">' + esc(name) + (n > 1 ? ' <span class="muted">×' + n + '</span>' : '') + '</span><span class="order-price num">' + F.num(x.price * n) + '</span>' +
          '<button type="button" class="order-x" data-act="unquick" data-id="' + esc(x.id) + '" data-key="ux-' + esc(x.id) + '" aria-label="Remove one ' + esc(name) + '">' + icon('minus') + '</button></li>';
      }).join('') + '</ul>' + (c.amountManual && Math.abs(parseMoney(c.amount) - sum) > 0.001 ? '<p class="hint">Items add up to ' + F.mvr(sum) + '. The bill amount above is what counts.</p>' : '') : '');
      $('#v-drinks').textContent = c.drinks;
      var amount = parseMoney(c.amount), mult = c.double ? 2 : 1;
      var earn = W.previewEarn(m.id, amount, mult), t = W.tier(m), per = W.program.stampsForFree;
      var after = m.stamps + c.drinks, free = Math.floor(after / per);
      var pv;
      if (!amount) pv = '<p class="pv-main">Enter the bill to see the beans</p><p class="pv-sub">' + esc(t.name) + ' members earn ' + (t.mult === 1 ? '1 bean' : t.mult + '× beans') + ' for every ' + F.mvr(W.program.mvrPerBean) + '</p>';
      else {
        pv = '<p class="pv-main">This visit earns <strong>' + beans(earn) + '</strong></p>' +
          '<p class="pv-sub">' + esc(t.name) + (t.mult > 1 ? ' ' + t.mult + '×' : '') + (mult > 1 ? ' · double beans on' : '') + ' · balance after: ' + F.num(m.beans + earn) + '</p>';
      }
      if (c.drinks) pv += '<p class="pv-sub">' + (free ? 'Completes the coffee card: ' + plural(free, 'free drink') : '+' + plural(c.drinks, 'stamp') + ' · coffee card ' + after + ' of ' + per) + '</p>';
      patch($('#v-preview'), pv);
      var sb = $('#v-submit'); if (sb) sb.innerHTML = icon('check') + (amount ? 'Add visit · ' + beans(earn) : 'Add visit');
    },
    submitVisit: function () {
      var c = state.counter, m = W.member(c.memberId), err = $('#v-error'), f = $('#v-amount'); if (!m) return;
      var amount = parseMoney(c.amount), self = this;
      setError(err, ''); fieldErr(f, '');
      if (!(amount >= 1)) { fieldErr(f, 'Enter the bill amount in MVR'); if (f) f.focus(); return; }
      if (amount > 100000) { fieldErr(f, F.mvr(amount) + ' is more than one bill can be. Check the amount on the receipt.'); if (f) f.focus(); return; }
      var mult = c.double ? 2 : 1, avg = m.visits ? m.spend / m.visits : 0;
      function add() {
        var freeBefore = m.freeDrinks;
        try {
          var a = W.earn(m.id, { amount: amount, drinks: c.drinks, items: c.items.map(function (x) { var it = W.menuItem(x.id); return it ? it.name : x.name; }), staff: staffName(), multiplier: mult });
          c.success = { beans: a.beans, amount: amount, multiplier: mult, free: m.freeDrinks - freeBefore };
          c.successAt = Date.now();
          c.amount = ''; c.amountManual = false; c.drinks = 0; c.items = []; c.double = false;
          toast('+' + beans(a.beans) + ' for ' + firstName(m.name), { icon: 'cup', sub: F.mvr(amount) + ' visit · balance ' + beans(m.beans) });
          self.mountBody();
          self.renderBody();
          var nx = $('#sx-next'); if (nx) nx.focus({ preventScroll: true });
        } catch (e) { setError(err, errMsg(e)); if (f) f.focus(); }
      }
      // A mistyped bill (6500 for 650) cannot be undone, so an unusually large one gets a second look.
      if (amount >= 1000 && amount > avg * 4) {
        confirmBox({
          title: 'Add a ' + F.mvr(amount) + ' bill?', icon: 'alert',
          body: (avg ? 'That is much more than ' + firstName(m.name) + ' usually spends (about ' + F.mvr(Math.round(avg)) + ').' : 'That is a large first bill.') +
            ' It earns ' + beans(W.previewEarn(m.id, amount, mult)) + '. Check the receipt before you add it.',
          ok: 'Yes, add the visit'
        }).then(function (ok) { if (ok) add(); else if (f) { f.focus(); f.select(); } });
        return;
      }
      add();
    },
    codesHTML: function (m) {
      var ready = W.redemptions('ready').filter(function (r) { return r.memberId === m.id; });
      var rewards = W.rewards();
      var out = '<div class="mp-sec"><h3 class="sub-title">Codes waiting for ' + esc(firstName(m.name)) + '</h3>' +
        (ready.length ? '<ul class="code-list" role="list">' + ready.map(function (r) { return codeRow(r, { noName: true }); }).join('') + '</ul>' :
          '<p class="muted mp-none">No codes waiting. Members redeem in the White Rewards app and show you the code.</p>') + '</div>';
      out += '<div class="mp-sec"><h3 class="sub-title">Redeem at the counter</h3>' +
        (rewards.length ? '<p class="hint">For members without their phone: the beans come off now and the reward is marked as served.</p>' +
        '<ul class="redeem-list" role="list">' + rewards.map(function (r) {
          var ok = m.beans >= r.cost;
          return '<li class="redeem-row' + (ok ? '' : ' is-off') + '"><span class="redeem-name">' + esc(r.name) + '</span><span class="redeem-cost num">' + F.num(r.cost) + ' beans</span>' +
            '<button class="btn btn--sm' + (ok ? '' : ' btn--ghost') + '" type="button" data-act="redeem-now" data-id="' + esc(r.id) + '" data-key="rn-' + esc(r.id) + '"' + (ok ? '' : ' disabled aria-disabled="true"') + '>' + (ok ? 'Redeem' : F.num(r.cost - m.beans) + ' short') + '</button></li>';
        }).join('') + '</ul>' :
        '<p class="muted mp-none">No active rewards right now. Turn one on in <a href="#rewards">Rewards</a>.</p>') + '</div>';
      return out;
    },
    freeHTML: function (m) {
      var per = W.program.stampsForFree, s = Math.min(m.stamps, per), full = m.stamps >= per;
      return '<div class="free-box">' + cupsHTML(m, 'cups--lg') +
        '<p class="free-line">' + s + ' of ' + per + ' stamps · ' + (full ? 'card full, the free drink is added with the next visit' : (per - s) + ' more ' + (per - s === 1 ? 'drink' : 'drinks') + ' until the next free one') + '</p>' +
        (m.freeDrinks ? '<p class="free-big"><strong>' + m.freeDrinks + '</strong> ' + (m.freeDrinks === 1 ? 'free drink' : 'free drinks') + ' ready</p>' +
          '<button class="btn btn--lg btn--block" type="button" data-act="free-drink" data-id="' + esc(m.id) + '" data-key="use-free">' + icon('cup') + 'Use a free drink</button>' :
          '<p class="muted">No free drink yet. Every ' + ordinal(per) + ' handcrafted drink is free.</p>') + '</div>';
    },
    renderCode: function (explicit) {
      var c = state.counter, out = '';
      if (c.code) {
        var r = W.redemption(c.code);
        if (!r) out = '<div class="code-res code-res--none">' + icon('alert') + '<p>No reward with code <strong>W-' + esc(c.code) + '</strong>. Check the letters with the customer.</p></div>';
        else {
          var st = { ready: 'Ready', served: 'Served', expired: 'Expired', cancelled: 'Cancelled' }[r.status] || r.status;
          out = '<div class="code-res code-res--' + esc(r.status) + '"><div class="code-res-top"><span class="code-big">' + esc(r.code) + '</span><span class="status status--' + esc(r.status) + '">' + esc(st) + '</span></div>' +
            '<p class="code-res-reward">' + esc(r.rewardName) + '</p>' +
            '<p class="code-res-meta"><button class="link-btn" type="button" data-act="counter-member" data-id="' + esc(r.memberId) + '" data-key="cr-m">' + esc(memberName(r.memberId)) + '</button> · ' + beans(r.cost) +
            (r.status === 'ready' ? ' · <span class="countdown" data-expires="' + r.expires + '"></span>' : r.status === 'served' ? ' · served ' + esc(F.time(r.servedAt)) + (r.servedBy ? ' by ' + esc(r.servedBy) : '') : r.status === 'expired' ? ' · expired ' + esc(F.time(r.expires)) : '') + '</p>' +
            (r.status === 'ready' ? '<div class="code-res-actions"><button class="btn" type="button" data-act="serve" data-code="' + esc(r.code) + '" data-key="cr-serve">' + icon('check') + 'Mark as served</button><button class="btn btn--ghost" type="button" data-act="cancel-code" data-code="' + esc(r.code) + '" data-key="cr-cancel">Cancel and refund</button></div>' :
              r.status === 'expired' ? '<p class="hint">Expired codes refund nothing automatically. Ask the member to redeem again, or add the beans back with Adjust beans.</p>' : '') +
            '</div>';
        }
      } else if (explicit) out = '<p class="hint code-hint">Type the 4 letters after W-.</p>';
      patch($('#code-result'), out);
      var ready = W.redemptions('ready');
      patch($('#code-list'), ready.length ? '<ul class="code-list" role="list">' + ready.map(function (r) { return codeRow(r); }).join('') + '</ul>' :
        '<div class="code-none"><p class="muted">None right now.</p>' + demoCodeBtn('link-btn demo-link') + '</div>');
    },
    act: function (el) {
      var c = state.counter, a = el.dataset.act, self = this, m;
      switch (a) {
        case 'clear-member': case 'next-customer':
          // A quick double Enter on the bill must not skip past the success panel.
          if (a === 'next-customer' && c.successAt && Date.now() - c.successAt < 600) return true;
          c.success = null; location.hash = '#counter';
          setTimeout(function () { var q = $('#ct-q'); if (q) q.focus(); }, 0);
          return true;
        case 'success-done':
          if (c.successAt && Date.now() - c.successAt < 600) return true;
          c.success = null; this.mountBody(); this.renderBody(); this.focusBill(); return true;
        case 'mp-tab':
          if (c.tab === el.dataset.tab && !c.success) return true;
          c.tab = el.dataset.tab; c.success = null; this.mountBody(); this.renderMember();
          return true;
        case 'quick-cat': c.cat = el.dataset.cat; c.qq = ''; var qqi = $('#v-qq'); if (qqi) qqi.value = ''; this.renderVisitLive(); return true;
        case 'quick':
          var it = W.menuItem(el.dataset.id); if (!it || !it.available) return true;
          // Keep the price it was added at, so removing it later takes off exactly that amount.
          c.items.push({ id: it.id, name: it.name, price: it.price, drink: isDrink(it) });
          c.amount = String(Math.round((parseMoney(c.amount) + it.price) * 100) / 100); c.amountManual = false;
          if (isDrink(it)) c.drinks += 1;
          $('#v-amount').value = c.amount; setError($('#v-error'), ''); fieldErr($('#v-amount'), '');
          this.renderVisitLive(); return true;
        case 'unquick':
          var i = -1; for (var k = c.items.length - 1; k >= 0; k--) if (c.items[k].id === el.dataset.id) { i = k; break; }
          if (i < 0) return true;
          var gone = c.items.splice(i, 1)[0];
          // A total typed by hand after the last chip is the receipt total: leave it alone.
          if (!c.amountManual) { c.amount = String(Math.max(0, Math.round((parseMoney(c.amount) - gone.price) * 100) / 100)); if (c.amount === '0') c.amount = ''; }
          if (gone.drink) c.drinks = Math.max(0, c.drinks - 1);
          $('#v-amount').value = c.amount; this.renderVisitLive();
          if (!document.activeElement || document.activeElement === document.body) { var nx = $('#v-order .order-x') || $('#v-amount'); if (nx) nx.focus(); }
          return true;
        case 'clear-order': c.items = []; c.amount = ''; c.amountManual = false; c.drinks = 0; $('#v-amount').value = ''; this.renderVisitLive(); $('#v-amount').focus(); return true;
        case 'drinks': c.drinks = Math.max(0, Math.min(20, c.drinks + Number(el.dataset.d))); this.renderVisitLive(); return true;
        case 'add-member-q': openAddMember(this._prefill || {}, true); return true;
        case 'redeem-now':
          m = W.member(c.memberId); var rw = W.reward(el.dataset.id); if (!m || !rw) return true;
          confirmBox({ title: 'Redeem ' + rw.name + '?', body: beans(rw.cost) + ' come off ' + firstName(m.name) + '\'s card (' + F.num(m.beans) + ' → ' + F.num(m.beans - rw.cost) + ') and the reward is marked as served.', ok: 'Redeem and serve', icon: 'gift' }).then(function (ok) {
            if (!ok) return;
            try { var red = W.redeem(m.id, rw.id); W.serve(red.code, staffName()); toast(rw.name + ' for ' + firstName(m.name), { icon: 'gift', sub: '−' + beans(rw.cost) + ' · ' + red.code + ' served' }); }
            catch (e) { toast(errMsg(e), { kind: 'error' }); }
          });
          return true;
      }
      return false;
    }
  };
  /** "Birthday today" / "Birthday in 5 days" when it is close (Malé date), else ''. */
  function birthdaySoon(mmdd) {
    if (!mmdd) return '';
    var p = W.maleParts(), b = mmdd.split('-'), today = Date.UTC(p.y, p.mo, p.d);
    var next = Date.UTC(p.y, (+b[0]) - 1, +b[1]);
    var diff = Math.round((next - today) / 864e5);
    if (diff < -3) diff = Math.round((Date.UTC(p.y + 1, (+b[0]) - 1, +b[1]) - today) / 864e5);
    if (diff === 0) return 'Birthday today';
    if (diff < 0) return 'Birthday ' + (diff === -1 ? 'yesterday' : -diff + ' days ago');
    if (diff <= 14) return 'Birthday ' + (diff === 1 ? 'tomorrow' : 'in ' + diff + ' days');
    return '';
  }
  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  /* ================================================================== */
  /* VIEW: Members                                                       */
  /* ================================================================== */
  var SORTS = {
    lastVisit: { label: 'Last visit', get: function (m) { return m.lastVisit || 0; }, dir: -1 },
    name: { label: 'Name', get: function (m) { return m.name.toLowerCase(); }, dir: 1 },
    beans: { label: 'Beans', get: function (m) { return m.beans; }, dir: -1 },
    visits: { label: 'Visits', get: function (m) { return m.visits; }, dir: -1 },
    tier: { label: 'Tier', get: function (m) { return m.lifetimeBeans; }, dir: -1 },
    id: { label: 'Member ID', get: function (m) { return m.id; }, dir: 1 },
    joined: { label: 'Newest', get: function (m) { return m.joined; }, dir: -1 }
  };
  var Members = {
    mount: function (host, id) {
      var ms = state.members;
      host.innerHTML =
        '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Members</h1><p class="page-desc" id="m-desc"></p></div>' +
        '<div class="page-actions"><button class="btn" type="button" data-act="add-member">' + icon('userPlus') + 'Add member</button></div></header>' +
        '<div class="toolbar">' +
        '<div class="search"><label class="visually-hidden" for="m-q">Search members</label>' + icon('search') + '<input class="input" id="m-q" type="search" placeholder="Search name, phone, email or ID" autocomplete="off" spellcheck="false" value="' + esc(ms.q) + '"></div>' +
        '<div class="seg seg--tiers" id="m-tiers" role="group" aria-label="Filter by tier"></div>' +
        '<div class="sort-sel"><label for="m-sort">Sort by</label><select class="select" id="m-sort">' +
        Object.keys(SORTS).map(function (k) { return '<option value="' + k + '"' + (k === ms.sort ? ' selected' : '') + '>' + SORTS[k].label + '</option>'; }).join('') + '</select></div>' +
        '</div>' +
        '<div class="panel m-table-wrap"><table class="table m-table"><caption class="visually-hidden">White Rewards members</caption><thead id="m-thead"></thead><tbody id="m-tbody"></tbody></table></div>' +
        '<ul class="m-cards" id="m-cards" role="list"></ul>' +
        '<div id="m-empty"></div>' +
        '</div>';
      var self = this;
      $('#m-q').addEventListener('input', function () { ms.q = this.value; self.update(); });
      $('#m-sort').addEventListener('change', function () { ms.sort = this.value; ms.dir = SORTS[ms.sort].dir; self.update(); });
      $('#m-tbody').addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        var tr = e.target.closest('tr[data-id]'); if (tr) location.hash = '#members/' + encodeURIComponent(tr.dataset.id);
      });
      this.route(id);
    },
    route: function (id) { if (id) openDrawer(id); else if (drawer) closeDialog(drawer.dlg, false, true); },
    act: function (el) {
      var ms = state.members;
      if (el.dataset.act === 'm-tier') { ms.tier = el.dataset.tier; this.update(); return true; }
      if (el.dataset.act === 'm-sort') { var k = el.dataset.sort; if (ms.sort === k) ms.dir = -ms.dir; else { ms.sort = k; ms.dir = SORTS[k].dir; } $('#m-sort').value = k; this.update(); return true; }
      if (el.dataset.act === 'm-clear') { ms.q = ''; ms.tier = 'all'; $('#m-q').value = ''; this.update(); $('#m-q').focus(); return true; }
      return false;
    },
    update: function () {
      var ms = state.members, all = W.members(), s = W.stats(7);
      patch($('#m-desc'), esc(plural(all.length, 'member') + ' · ' + F.num(s.newThisWeek) + ' new this week · ' + F.num(s.outstandingBeans) + ' beans unspent. ' +
        W.program.tiers.slice(1).map(function (t) { return t.name + ' from ' + F.num(t.min); }).join(', ') + ' lifetime beans.'));
      var counts = { all: all.length }; W.program.tiers.forEach(function (t) { counts[t.id] = 0; });
      all.forEach(function (m) { counts[W.tier(m).id]++; });
      patch($('#m-tiers'), [{ id: 'all', name: 'All' }].concat(W.program.tiers).map(function (t) {
        return '<button type="button" class="seg-btn" data-act="m-tier" data-tier="' + esc(t.id) + '" data-key="mt-' + esc(t.id) + '" aria-pressed="' + (ms.tier === t.id) + '">' + esc(t.name) + ' <span class="seg-n">' + (counts[t.id] || 0) + '</span></button>';
      }).join(''));
      fadeEdges($('#m-tiers'));
      var list = W.findMembers(ms.q).filter(function (m) { return ms.tier === 'all' || W.tier(m).id === ms.tier; });
      var sd = SORTS[ms.sort] || SORTS.lastVisit, dir = ms.dir;
      list.sort(function (a, b) { var x = sd.get(a), y = sd.get(b); return (x < y ? -1 : x > y ? 1 : 0) * dir || a.name.localeCompare(b.name); });
      // Fixed column widths (table-layout: fixed) so one long name never pushes the other columns around.
      var cols = [['name', 'Member', 'c-name'], [null, 'Phone', 'm-col-phone'], ['tier', 'Tier', 'c-tier'], ['beans', 'Beans', 'r c-num'], ['visits', 'Visits', 'r c-num'], ['lastVisit', 'Last visit', 'c-last']];
      patch($('#m-thead'), '<tr>' + cols.map(function (c) {
        if (!c[0]) return '<th scope="col" class="' + c[2] + '">' + c[1] + '</th>';
        var on = ms.sort === c[0];
        return '<th scope="col" class="' + c[2] + '"' + (on ? ' aria-sort="' + (dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" class="th-btn' + (on ? ' is-on' : '') + '" data-act="m-sort" data-sort="' + c[0] + '" data-key="th-' + c[0] + '">' + c[1] + (on ? icon(dir > 0 ? 'chevronUp' : 'chevronDown', 'ic-sm') : '<span class="th-ghost">' + icon('chevronDown', 'ic-sm') + '</span>') + '</button></th>';
      }).join('') + '</tr>');
      patch($('#m-tbody'), list.map(function (m) {
        var t = W.tier(m);
        return '<tr data-id="' + esc(m.id) + '"><td><a class="m-name" href="#members/' + esc(encodeURIComponent(m.id)) + '" data-key="mn-' + esc(m.id) + '">' + avatar(m.name) + '<span class="m-name-main"><span class="m-name-txt" title="' + esc(m.name) + '">' + esc(m.name) + '</span><span class="m-sub">' + esc(m.id) + '<span class="m-sub-phone"> · ' + esc(m.phone) + '</span></span></span></a></td>' +
          '<td class="num nowrap m-col-phone">' + esc(m.phone) + '</td><td>' + tierChip(t) + '</td>' +
          '<td class="r num strong">' + F.num(m.beans) + '</td><td class="r num">' + F.num(m.visits) + '</td><td class="nowrap">' + (m.lastVisit ? esc(F.ago(m.lastVisit)) : '<span class="muted">No visits yet</span>') + '</td></tr>';
      }).join(''));
      patch($('#m-cards'), list.map(function (m) {
        var t = W.tier(m);
        return '<li><a class="m-card" href="#members/' + esc(encodeURIComponent(m.id)) + '" data-key="mc-' + esc(m.id) + '">' +
          '<span class="m-card-top">' + avatar(m.name) + '<span class="m-card-who"><span class="m-name-txt">' + esc(m.name) + '</span><span class="m-sub m-sub--wrap"><span class="nowrap">' + esc(m.id) + ' ·</span> <span class="nowrap">' + esc(m.phone) + '</span></span></span>' + tierChip(t) + '</span>' +
          '<span class="m-card-stats"><span><strong class="num">' + F.num(m.beans) + '</strong> ' + (m.beans === 1 ? 'bean' : 'beans') + '</span><span><strong class="num">' + F.num(m.visits) + '</strong> ' + (m.visits === 1 ? 'visit' : 'visits') + '</span><span>' + (m.lastVisit ? esc(F.ago(m.lastVisit)) : 'No visits yet') + '</span></span></a></li>';
      }).join(''));
      var empty = !list.length;
      $('.m-table-wrap').hidden = empty; $('#m-cards').hidden = empty;
      patch($('#m-empty'), empty ? '<div class="card">' + emptyState('search', 'No members match', ms.q ? 'Nobody matches “' + ms.q + '”' + (ms.tier !== 'all' ? ' in this tier' : '') + '.' : 'No members in this tier yet.',
        '<div class="empty-actions"><button class="btn btn--ghost btn--sm" type="button" data-act="m-clear">Clear filters</button><button class="btn btn--sm" type="button" data-act="add-member">' + icon('userPlus') + 'Add member</button></div>') + '</div>' : '');
    }
  };

  /* Member drawer ------------------------------------------------------ */
  var drawer = null;
  function openDrawer(id) {
    var m = W.member(id);
    if (!m) { toast('No member with ID ' + id, { kind: 'error' }); history.replaceState(null, '', '#members'); return; }
    if (drawer && drawer.id === id) { updateDrawer(); return; }
    if (drawer) closeDialog(drawer.dlg, true, true);
    var nav = state.drawerNav || 'deep';
    var dlg = openDialog({
      cls: 'dlg--drawer', labelledby: 'md-name',
      guard: function () { return drawer && drawer.dlg === dlg && drawer.dirty ? confirmDiscard(firstName(memberName(id)) + '\'s profile') : true; },
      html: '<div class="drawer">' +
        '<header class="drawer-head"><button class="icon-btn" type="button" data-close aria-label="Close member details">' + icon('x') + '</button><div class="drawer-head-main" id="md-head"></div></header>' +
        '<div class="drawer-body">' +
        '<div class="md-actions" id="md-actions"></div>' +
        '<div class="md-stats" id="md-stats"></div>' +
        '<section class="md-sec" aria-labelledby="md-h-tier"><h3 class="sub-title" id="md-h-tier">Tier</h3><div id="md-tier"></div></section>' +
        '<section class="md-sec" aria-labelledby="md-h-card"><h3 class="sub-title" id="md-h-card">Coffee card</h3><div id="md-card"></div></section>' +
        '<section class="md-sec" aria-labelledby="md-h-kara"><div class="md-sec-head"><h3 class="sub-title" id="md-h-kara">Karaoke bookings</h3><button class="btn btn--ghost btn--sm" type="button" data-act="k-new-member" data-id="' + esc(id) + '">' + icon('plus') + 'Book a room</button></div><div id="md-kara"></div></section>' +
        '<section class="md-sec" aria-labelledby="md-h-prof"><h3 class="sub-title" id="md-h-prof">Profile</h3><form class="md-form" id="md-form" novalidate><div id="md-fields"></div>' +
        '<p class="form-error" id="md-err" role="alert" hidden></p><div class="md-form-actions"><button class="btn btn--ghost" type="button" data-act="md-undo" disabled>Undo changes</button><button class="btn" type="submit" id="md-save" disabled>Save profile</button></div></form></section>' +
        '<section class="md-sec" aria-labelledby="md-h-tl"><h3 class="sub-title" id="md-h-tl">Activity</h3><ol class="log" id="md-tl" role="list"></ol><div id="md-more"></div></section>' +
        '</div></div>',
      onClose: function () {
        if (drawer && drawer.dlg === dlg) drawer = null;
        var r = parseHash();
        if (r.view !== 'members' || r.id !== id) return;          // the app already moved on
        var back = state.drawerReturn; state.drawerReturn = null;
        // Opened from a link in the app: step Back, so the browser's Back button does not reopen it.
        // Opened from a fresh link or right after sign-in: swap the entry instead.
        if (nav === 'push') history.back();
        else { history.replaceState(null, '', back || '#members'); route(); }
      }
    });
    drawer = { dlg: dlg, id: id, dirty: false, limit: 30 };
    var form = $('#md-form', dlg);
    function touched(e) {
      if (!drawer || drawer.dlg !== dlg) return;
      drawer.dirty = true; $('#md-save', dlg).disabled = false; $('[data-act="md-undo"]', dlg).disabled = false;
      if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, '');
      if (e.target.id === 'md-bm') fieldErr($('#md-bd', dlg), '');
    }
    form.addEventListener('input', touched);
    form.addEventListener('change', touched);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#md-err', dlg); setError(err, ''); clearFieldErrs(form);
      try {
        var name = $('#md-name-i', dlg).value.trim();
        if (!name) fail('md-name-i', 'Please enter a name');
        var phone = normPhone($('#md-phone-i', dlg).value, 'md-phone-i');
        var dup = W.members().filter(function (x) { return x.id !== drawer.id && x.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''); })[0];
        if (dup) fail('md-phone-i', 'That phone number belongs to ' + dup.name);
        var email = $('#md-email-i', dlg).value.trim();
        if (email && !isEmail(email)) fail('md-email-i', 'Check the email address, like name@example.mv');
        var bday = readBirthday(dlg, 'md');
        drawer.dirty = false;
        W.updateMember(drawer.id, { name: name, phone: phone, email: email, birthday: bday, favourite: $('#md-fav-i', dlg).value, note: $('#md-note-i', dlg).value.trim() });
        toast('Profile saved', { sub: name });
      } catch (ex) { drawer.dirty = true; showFormError(dlg, ex, err); }
    });
    updateDrawer();
  }
  function drawerAct(el) {
    if (!drawer) return;
    var a = el.dataset.act;
    if (a === 'md-undo') { drawer.dirty = false; $('#md-fields', drawer.dlg)._html = null; setError($('#md-err', drawer.dlg), ''); clearFieldErrs(drawer.dlg); updateDrawer(); }
    if (a === 'md-more') { drawer.limit += 50; updateDrawer(); }
  }
  function updateDrawer() {
    if (!drawer) return;
    var d = drawer.dlg, m = W.member(drawer.id);
    if (!m) { closeDialog(d, true, true); return; }
    var t = W.tier(m), tp = W.tierProgress(m), per = W.program.stampsForFree;
    patch($('#md-head', d), '<div><h2 class="drawer-title" id="md-name" title="' + esc(m.name) + '">' + esc(m.name) + '</h2><p class="drawer-sub">' + tierChip(t) + '<span class="muted">' + esc(m.id) + ' · member since ' + esc(F.shortDate(m.joined)) + ' ' + W.maleParts(m.joined).y + '</span></p></div>');
    patch($('#md-actions', d),
      '<a class="btn" href="#counter/' + esc(encodeURIComponent(m.id)) + '" data-key="md-visit">' + icon('plus') + 'Add visit</a>' +
      '<button class="btn btn--ghost" type="button" data-act="adjust-dialog" data-id="' + esc(m.id) + '" data-key="md-adj">' + icon('adjust') + 'Adjust beans</button>' +
      '<button class="btn btn--ghost" type="button" data-act="free-drink" data-id="' + esc(m.id) + '" data-key="md-free"' + (m.freeDrinks ? '' : ' disabled') + '>' + icon('cup') + 'Use free drink' + (m.freeDrinks ? ' (' + m.freeDrinks + ')' : '') + '</button>');
    var avg = m.visits ? m.spend / m.visits : 0;
    patch($('#md-stats', d), [
      ['Beans balance', F.num(m.beans), 'big'], ['Lifetime beans', F.num(m.lifetimeBeans)], ['Visits', F.num(m.visits)],
      ['Total spend', F.mvr(m.spend)], ['Average bill', m.visits ? F.mvr(Math.round(avg)) : 'No visits yet'], ['Last visit', m.lastVisit ? F.ago(m.lastVisit) : 'No visits yet']
    ].map(function (x) { return '<div class="md-stat' + (x[2] ? ' md-stat--' + x[2] : '') + '"><span class="md-stat-l">' + x[0] + '</span><strong class="md-stat-v">' + esc(x[1]) + '</strong></div>'; }).join(''));
    patch($('#md-tier', d), '<div class="tierbar"><div class="tierbar-top"><span>' + tierChip(t) + '</span><span class="muted">' + (tp.next ? F.num(tp.need) + ' lifetime beans to ' + esc(tp.next.name) : 'Top tier') + '</span></div>' +
      '<div class="hbar-track"><i class="hbar-fill" style="width:' + Math.round(tp.pct * 100) + '%"></i></div>' +
      '<p class="perks"><span class="muted">' + esc(t.name) + ' perks:</span> ' + esc(t.perks.join(', ')) + '</p></div>');
    patch($('#md-card', d), '<div class="md-cardbox">' + cupsHTML(m) + '<p class="muted">' + Math.min(m.stamps, per) + ' of ' + per + ' stamps · ' + (m.freeDrinks ? '<strong class="gold-ink">' + plural(m.freeDrinks, 'free drink') + ' ready</strong>' : 'no free drink waiting') + '</p></div>');
    var mine = memberBookings(m), today = W.karaokeToday();
    var up = mine.filter(function (b) { return b.date >= today && (b.status === 'confirmed' || b.status === 'checked-in'); });
    var past = mine.filter(function (b) { return up.indexOf(b) < 0; }).reverse().slice(0, 4);
    patch($('#md-kara', d), mine.length ? '<ul class="bk-mini" role="list">' + up.concat(past).map(function (b) {
      return '<li><a class="bk-mini-row" href="#karaoke/' + esc(b.id) + '" data-key="mk-' + esc(b.id) + '"><span class="bk-mini-when"><strong>' + esc(W.karaokeDateLabel(b.date)) + '</strong> ' + esc(hourRange(b.start, b.hours)) + '</span>' +
        '<span class="bk-mini-what">' + esc(b.roomName) + ' · ' + plural(b.guests, 'guest') + ' · ' + esc(b.id) + '</span>' + statusHTML(b.status) + '</a></li>';
    }).join('') + '</ul>' : '<p class="muted">No karaoke bookings yet.</p>');
    if (!drawer.dirty) {
      var drinks = W.menu().filter(isDrink).map(function (x) { return x.name; });
      if (m.favourite && drinks.indexOf(m.favourite) < 0) drinks.unshift(m.favourite);
      var changed = patch($('#md-fields', d), '<div class="form-grid">' +
        '<div class="field span-2"><label for="md-name-i">Full name</label><input class="input" id="md-name-i" maxlength="60" value="' + esc(m.name) + '" autocomplete="off"></div>' +
        '<div class="field"><label for="md-phone-i">Mobile number</label><input class="input" id="md-phone-i" inputmode="tel" maxlength="20" value="' + esc(m.phone) + '" autocomplete="off"></div>' +
        '<div class="field"><label for="md-email-i">Email</label><input class="input" id="md-email-i" type="email" maxlength="80" value="' + esc(m.email) + '" autocomplete="off" spellcheck="false"></div>' +
        '<div class="field"><span class="field-label">Birthday</span>' + birthdaySelects('md', m.birthday) + '</div>' +
        '<div class="field"><label for="md-fav-i">Favourite drink</label><select class="select" id="md-fav-i"><option value="">Not set</option>' + drinks.map(function (n) { return '<option' + (n === m.favourite ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field span-2"><label for="md-note-i">Staff note <span class="opt">only staff see this</span></label><textarea class="textarea" id="md-note-i" rows="2" maxlength="200" placeholder="e.g. Oat milk, less sugar">' + esc(m.note) + '</textarea></div>' +
        '</div>');
      if (changed) { $('#md-save', d).disabled = true; $('[data-act="md-undo"]', d).disabled = true; }
    }
    var acts = W.activity(m.id), lim = drawer.limit;
    patch($('#md-tl', d), timelineHTML(acts.slice(0, lim), false));
    patch($('#md-more', d), acts.length > lim ? '<button class="btn btn--ghost btn--sm btn--block" type="button" data-act="md-more">Show more (' + F.num(acts.length - lim) + ' older)</button>' : '');
    tick();
  }

  /* ================================================================== */
  /* VIEW: Rewards                                                       */
  /* ================================================================== */
  /* Inline edit forms (rewards, offers) --------------------------------- */
  /** Remember what was typed so a live re-render (another tab saving something) does not wipe it. */
  function captureForm(form) {
    if (!form) return null;
    var v = {}; $$('input, select, textarea', form).forEach(function (i) { if (i.id) v[i.id] = i.value; });
    return { id: form.dataset.id, vals: v };
  }
  function restoreForm(form, snap) {
    if (!form || !snap || form.dataset.id !== snap.id) return;
    Object.keys(snap.vals).forEach(function (id) { var i = form.querySelector('#' + CSS.escape(id)); if (i && i.value !== snap.vals[id]) i.value = snap.vals[id]; });
  }
  function formChanged(form, orig) {
    return !!form && $$('input, select, textarea', form).some(function (i) { return i.id in orig && String(orig[i.id]) !== i.value; });
  }
  /** Focus the first field without hiding its label under the sticky top bar. */
  function focusInline(form, field) {
    if (!form || !field) return;
    field.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'nearest', behavior: reduced.matches ? 'auto' : 'smooth' });
  }
  /** A switch with its state text as a tap target (the text is a <label> for the switch). */
  function switchHTML(o) {
    return '<button class="switch" type="button" role="switch" id="' + esc(o.id) + '" aria-checked="' + !!o.on + '" data-act="' + o.act + '" data-id="' + esc(o.dataId) + '" data-key="' + esc(o.id) + '" aria-label="' + esc(o.label) + '"><i></i></button>' +
      '<label class="switch-state" for="' + esc(o.id) + '">' + esc(o.on ? o.onText : o.offText) + '</label>';
  }

  var KINDS = { drink: 'Drink', food: 'Food', karaoke: 'Karaoke' };
  var Rewards = {
    mount: function (host) {
      host.innerHTML = '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Rewards</h1><p class="page-desc">What members can spend their beans on. Active rewards show in the White Rewards app, cheapest first.</p></div>' +
        '<div class="page-actions"><button class="btn" type="button" data-act="rw-new">' + icon('plus') + 'Add reward</button></div></header>' +
        '<div class="mini-stats" id="rw-sum"></div>' +
        '<div class="panel list-card" id="rw-list"></div></div>';
      var self = this;
      $('#rw-list').addEventListener('submit', function (e) { e.preventDefault(); self.save(e.target); });
      $('#rw-list').addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, ''); });
      $('#rw-list').addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.rwEdit) { e.preventDefault(); e.stopPropagation(); self.cancel(); } });
    },
    original: function () {
      var ed = state.rwEdit; if (!ed) return null;
      var r = ed === 'new' ? { name: '', cost: '', kind: 'drink' } : W.reward(ed); if (!r) return null;
      var k = ed === 'new' ? 'new' : ed, o = {};
      o['rw-n-' + k] = r.name; o['rw-c-' + k] = r.cost; o['rw-k-' + k] = KINDS[r.kind] ? r.kind : 'drink';
      return o;
    },
    isDirty: function () {
      var o = this.original(), f = $('#rw-list form.rw-edit');
      return o && formChanged(f, o) ? { what: state.rwEdit === 'new' ? 'the new reward' : 'this reward' } : null;
    },
    discard: function () { state.rwEdit = null; },
    /** Switch the open editor (or close it), asking first when it has unsaved typing. */
    edit: function (id) {
      var self = this, go = function () {
        state.rwEdit = id; self.update();
        if (id) { var k = id === 'new' ? 'new' : id, f = $('#rw-n-' + CSS.escape(k)); if (f) { focusInline(f.form, f); if (id !== 'new') f.select(); } }
      };
      var d = this.isDirty();
      if (d && state.rwEdit !== id) confirmDiscard(d.what).then(function (ok) { if (ok) go(); }); else go();
    },
    cancel: function () {
      var id = state.rwEdit; state.rwEdit = null; this.update();
      var b = $('[data-key="rwe-' + id + '"]') || $('[data-act="rw-new"]'); if (b) b.focus();
    },
    update: function () {
      var all = W.rewards(true), counts = redeemCounts(), active = all.filter(function (r) { return r.active; }).length, total = 0;
      Object.keys(counts).forEach(function (k) { total += counts[k].n; });
      patch($('#rw-sum'), '<div class="mini-stat"><span>Active rewards</span><strong>' + active + ' <span class="muted">of ' + all.length + '</span></strong></div>' +
        '<div class="mini-stat"><span>Redeemed, all time</span><strong>' + F.num(total) + '</strong></div>' +
        '<div class="mini-stat"><span>Codes waiting</span><strong>' + F.num(W.redemptions('ready').length) + '</strong></div>');
      var ed = state.rwEdit, html = '', topId = null, topN = 0;
      Object.keys(counts).forEach(function (k) { if (counts[k].n > topN) { topN = counts[k].n; topId = k; } });
      if (ed && ed !== 'new' && !W.reward(ed)) ed = state.rwEdit = null;
      if (ed === 'new') html += this.editRow({ id: '', name: '', cost: '', kind: 'drink', active: true });
      html += all.map(function (r) {
        if (ed === r.id) return Rewards.editRow(r);
        var c = counts[r.id] || { n: 0, ready: 0 };
        return '<div class="rw-row' + (r.active ? '' : ' is-off') + '">' +
          '<div class="rw-main"><p class="rw-name">' + esc(r.name) + '</p><p class="rw-meta">' + (KINDS[r.kind] || 'Drink') + ' · redeemed ' + (c.n === 1 ? 'once' : F.num(c.n) + ' times') + (r.id === topId ? ', the most of any reward' : '') + (c.ready ? ' · <span class="gold-ink">' + c.ready + ' waiting</span>' : '') + '</p></div>' +
          '<p class="rw-cost"><strong class="num">' + F.num(r.cost) + '</strong> beans</p>' +
          '<div class="rw-toggle">' + switchHTML({ id: 'rwt-' + r.id, on: r.active, act: 'rw-toggle', dataId: r.id, label: 'Show ' + r.name + ' in the app', onText: 'Active', offText: 'Paused' }) + '</div>' +
          '<button class="btn btn--ghost btn--sm rw-edit-btn" type="button" data-act="rw-edit" data-id="' + esc(r.id) + '" data-key="rwe-' + esc(r.id) + '">' + icon('edit') + 'Edit</button></div>';
      }).join('');
      var snap = captureForm($('#rw-list form.rw-edit'));
      if (patch($('#rw-list'), html)) restoreForm($('#rw-list form.rw-edit'), snap);
    },
    editRow: function (r) {
      var k = r.id || 'new';
      return '<form class="rw-row rw-edit" data-id="' + esc(r.id) + '" novalidate>' +
        '<div class="rw-edit-fields">' +
        '<div class="field rw-f-name"><label for="rw-n-' + k + '">' + (r.id ? 'Reward' : 'New reward') + '</label><input class="input" id="rw-n-' + k + '" maxlength="60" value="' + esc(r.name) + '" placeholder="e.g. Any cold brew" autocomplete="off"></div>' +
        '<div class="field rw-f-cost"><label for="rw-c-' + k + '">Cost in beans</label><input class="input" id="rw-c-' + k + '" inputmode="numeric" maxlength="7" value="' + esc(r.cost) + '" placeholder="150" autocomplete="off"></div>' +
        '<div class="field rw-f-kind"><label for="rw-k-' + k + '">Type</label><select class="select" id="rw-k-' + k + '">' + Object.keys(KINDS).map(function (x) { return '<option value="' + x + '"' + ((KINDS[r.kind] ? r.kind : 'drink') === x ? ' selected' : '') + '>' + KINDS[x] + '</option>'; }).join('') + '</select></div>' +
        '</div><p class="form-error" role="alert" hidden></p>' +
        '<div class="rw-edit-actions"><button class="btn btn--ghost" type="button" data-act="rw-cancel">Cancel</button><button class="btn" type="submit">' + (r.id ? 'Save' : 'Add reward') + '</button></div></form>';
    },
    save: function (form) {
      var id = form.dataset.id || '', k = id || 'new', err = $('.form-error', form);
      var cur = id ? W.reward(id) : null, nameId = 'rw-n-' + k, costId = 'rw-c-' + k;
      clearFieldErrs(form); setError(err, '');
      try {
        // Checked in the order the fields appear.
        var name = $('#' + CSS.escape(nameId), form).value.trim(), raw = $('#' + CSS.escape(costId), form).value.trim().replace(/[\s,]/g, '');
        if (!name) fail(nameId, 'Give the reward a name');
        var dup = W.rewards(true).filter(function (x) { return x.id !== id && x.name.trim().toLowerCase() === name.toLowerCase(); })[0];
        if (dup) fail(nameId, 'There is already a reward called “' + dup.name + '”');
        if (!raw) fail(costId, 'Enter the cost in beans');
        if (raw.indexOf('-') > -1) fail(costId, 'The cost cannot be negative');
        if (!/^\d+$/.test(raw)) fail(costId, 'Use a whole number of beans, like 150');
        var cost = Number(raw);
        if (cost < 1) fail(costId, 'A reward costs at least 1 bean');
        if (cost > 100000) fail(costId, 'Keep the cost at 100,000 beans or less');
        var r = W.saveReward({ id: id || undefined, name: name, cost: cost, kind: $('#rw-k-' + CSS.escape(k), form).value, active: cur ? cur.active : true });
        state.rwEdit = null;
        toast(id ? 'Reward updated' : 'Reward added', { icon: 'gift', sub: r.name + ' · ' + beans(r.cost) + (id ? '' : ' · now showing in the app') });
        this.update();
        var b = $('[data-key="rwe-' + r.id + '"]'); if (b) b.focus();
      } catch (e) { showFormError(form, e, err, { 'name': nameId, 'Cost': costId }); }
    },
    act: function (el) {
      var a = el.dataset.act;
      if (a === 'rw-new') { this.edit('new'); return true; }
      if (a === 'rw-edit') { this.edit(el.dataset.id); return true; }
      if (a === 'rw-cancel') { this.cancel(); return true; }
      if (a === 'rw-toggle') {
        var r = W.reward(el.dataset.id); if (!r) return true;
        try { W.saveReward({ id: r.id, name: r.name, cost: r.cost, kind: r.kind, active: !r.active }); toast(r.active ? r.name + ' is live' : r.name + ' paused', { icon: 'gift', sub: r.active ? 'Members can redeem it in the app' : 'Hidden from the app until you turn it back on' }); }
        catch (e) { toast(errMsg(e), { kind: 'error' }); }
        return true;
      }
      return false;
    }
  };

  /* ================================================================== */
  /* VIEW: Menu                                                          */
  /* ================================================================== */
  var Menu = {
    mount: function (host) {
      host.innerHTML = '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Menu</h1><p class="page-desc">Prices and what\'s available today. The website reads this list, so a new price or a sold-out item shows there straight away. Prices are before the 10% service charge and 8% GST.</p></div>' +
        '<div class="page-actions"><a class="btn btn--ghost" href="../#menu" target="_blank" rel="noopener">View on website' + icon('external', 'ic-sm') + '</a></div></header>' +
        '<div class="toolbar toolbar--menu"><div class="search"><label class="visually-hidden" for="mn-q">Search the menu</label>' + icon('search') + '<input class="input" id="mn-q" type="search" placeholder="Search the menu" autocomplete="off" value="' + esc(state.menuQ) + '"></div>' +
        '<div class="jump" id="mn-jump" role="group" aria-label="Jump to a section"></div></div>' +
        '<div class="mn-list" id="mn-list"></div></div>';
      this.shape = null;
      var self = this, list = $('#mn-list');
      $('#mn-q').addEventListener('input', function () { state.menuQ = this.value; self.update(); });
      list.addEventListener('change', function (e) { var inp = e.target.closest('.mn-price-input'); if (inp) self.savePrice(inp); });
      list.addEventListener('keydown', function (e) {
        var inp = e.target.closest('.mn-price-input'); if (!inp) return;
        if (e.key === 'Enter') { e.preventDefault(); self.savePrice(inp); }
        if (e.key === 'Escape') { var it = W.menuItem(inp.dataset.id); if (it) { inp.value = it.price; self.showErr(inp.dataset.id, ''); } }
      });
      // Pinned category bar: a hairline once it is stuck, and the chip of the section in view marked as current.
      var raf = 0;
      this.onScroll = function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; self.spy(); }); };
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll);
    },
    unmount: function () { if (this.onScroll) { window.removeEventListener('scroll', this.onScroll); window.removeEventListener('resize', this.onScroll); } this.onScroll = null; },
    spy: function () {
      var jump = $('#mn-jump'); if (!jump) return;
      var bar = phoneMQ.matches ? jump : jump.closest('.toolbar--menu');
      var r = bar.getBoundingClientRect(), stickTop = parseFloat(getComputedStyle(bar).top) || 0;
      bar.classList.toggle('is-stuck', window.scrollY > 4 && r.top <= stickTop + 1);
      var secs = $$('#mn-list .mn-cat'), cur = secs[0] || null, line = r.bottom + 24;
      secs.forEach(function (s) { if (s.getBoundingClientRect().top <= line) cur = s; });
      if (secs.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = secs[secs.length - 1];
      var id = cur ? cur.id.replace(/^mn-/, '') : null, chip = null;
      $$('.utab', jump).forEach(function (b) { var on = b.dataset.cat === id; if (on) { b.setAttribute('aria-current', 'true'); chip = b; } else b.removeAttribute('aria-current'); });
      if (chip && this.spyCur !== id) {
        this.spyCur = id;
        var cl = chip.offsetLeft - jump.offsetLeft, cr = cl + chip.offsetWidth;
        if (cl < jump.scrollLeft + 8 || cr > jump.scrollLeft + jump.clientWidth - 32) jump.scrollLeft = Math.max(0, cl - 16);
      }
      fadeEdges(jump);
    },
    showErr: function (id, msg) { var e = $('#mn-err-' + CSS.escape(id)); if (e) setError(e, msg); var i = $('#mp-' + CSS.escape(id)); if (i) { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); } },
    savePrice: function (inp) {
      var it = W.menuItem(inp.dataset.id); if (!it) return;
      var raw = inp.value.trim().replace(/^MVR\s*/i, '').replace(/,/g, '');
      if (raw === String(it.price)) { this.showErr(it.id, ''); return; }
      try {
        if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('Enter a price in MVR, like 65 or 65.50');
        var n = Number(raw);
        if (!(n > 0)) throw new Error('A price must be more than MVR 0. To take it off for today, mark it sold out.');
        if (n > 10000) throw new Error('Keep the price at MVR 10,000 or less');
        var old = it.price;
        W.updateMenuItem(it.id, { price: n });
        inp.value = it.price;
        this.showErr(it.id, '');
        toast(it.name + ' is now ' + F.mvr(it.price), { icon: 'menu', sub: 'Was ' + F.mvr(old) + ' · updated on the website' });
      } catch (e) { this.showErr(it.id, errMsg(e)); }
    },
    update: function () {
      var q = state.menuQ.trim().toLowerCase(), cats = W.categories();
      var groups = [['food', 'Food'], ['drinks', 'Drinks']];
      patch($('#mn-jump'), groups.map(function (g) {
        return '<span class="jump-row"><span class="jump-g">' + g[1] + '</span>' + cats.filter(function (c) { return c.group === g[0]; }).map(function (c) {
          return '<button type="button" class="utab" data-act="mn-jump" data-cat="' + esc(c.id) + '" data-key="mj-' + esc(c.id) + '">' + esc(c.name) + '</button>';
        }).join('') + '</span>';
      }).join(''));
      var any = false, shape = [q];
      function catSub(items) { var out = items.filter(function (it) { return !it.available; }).length; return plural(items.length, 'item') + ' · ' + (out ? '<span class="warn-ink">' + out + ' sold out</span>' : 'all available'); }
      var html = groups.map(function (g) {
        var inGroup = cats.filter(function (c) { return c.group === g[0]; }), n = 0;
        var body = inGroup.map(function (c) {
          var items = W.menu(c.id), shown = items.filter(function (it) { return !q || it.name.toLowerCase().indexOf(q) > -1 || (it.desc || '').toLowerCase().indexOf(q) > -1; });
          if (!shown.length) return '';
          any = true; n += shown.length;
          shape.push(c.id, c.name, c.photo || '', items.length);
          shown.forEach(function (it) { shape.push(it.id, it.name, it.desc || '', it.signature ? 1 : 0); });
          return '<section class="panel mn-cat' + (c.photo ? ' has-photo' : '') + '" id="mn-' + esc(c.id) + '" aria-labelledby="mn-h-' + esc(c.id) + '"><header class="panel-head mn-head">' +
            (c.photo ? '<img class="mn-photo" src="../assets/img/menu/' + esc(c.photo) + '-800.webp" alt="" width="72" height="96" loading="lazy" decoding="async">' : '') +
            '<div><h3 class="panel-title" id="mn-h-' + esc(c.id) + '">' + esc(c.name) + '</h3>' +
            '<p class="panel-sub" id="mn-sub-' + esc(c.id) + '">' + catSub(items) + '</p></div></header>' +
            '<ul class="mn-items" role="list">' + shown.map(function (it) {
              return '<li class="mn-item' + (it.available ? '' : ' is-out') + '" data-item="' + esc(it.id) + '">' +
                '<div class="mn-main"><p class="mn-name">' + esc(it.name) + (it.signature ? ' <span class="sig">House favourite</span>' : '') + '</p>' + (it.desc ? '<p class="mn-desc">' + esc(it.desc) + '</p>' : '') + '</div>' +
                '<div class="mn-price"><label class="visually-hidden" for="mp-' + esc(it.id) + '">Price of ' + esc(it.name) + ' in MVR</label><span class="mn-cur" aria-hidden="true">MVR</span>' +
                '<input class="input mn-price-input num" id="mp-' + esc(it.id) + '" data-id="' + esc(it.id) + '" inputmode="decimal" maxlength="9" autocomplete="off" value="' + esc(it.price) + '" aria-describedby="mn-err-' + esc(it.id) + '"></div>' +
                '<div class="mn-avail">' + switchHTML({ id: 'ma-' + it.id, on: it.available, act: 'mn-avail', dataId: it.id, label: it.name + ' available today', onText: 'Available', offText: 'Sold out' }) + '</div>' +
                '<p class="form-error mn-err" id="mn-err-' + esc(it.id) + '" role="alert" hidden></p></li>';
            }).join('') + '</ul></section>';
        }).join('');
        return body ? '<div class="mn-group"><h2 class="mn-group-h">' + g[1] + ' <span class="muted">' + plural(n, 'item') + '</span></h2>' + body + '</div>' : '';
      }).join('');
      var list = $('#mn-list'), key = shape.join('\u0001');
      if (any && this.shape === key && list.querySelector('.mn-item')) {
        // Same rows as on screen: change prices, switches and counts in place. Rebuilding the rows here would replace
        // the control under the pointer, and the click that follows a price save (change fires on blur) would be lost.
        cats.forEach(function (c) { var s = $('#mn-sub-' + CSS.escape(c.id)); if (s) patch(s, catSub(W.menu(c.id))); });
        $$('.mn-item', list).forEach(function (li) {
          var it = W.menuItem(li.dataset.item); if (!it) return;
          li.classList.toggle('is-out', !it.available);
          var inp = li.querySelector('.mn-price-input');
          if (inp && document.activeElement !== inp && inp.value !== String(it.price)) inp.value = it.price;
          var sw = li.querySelector('.switch'), lab = li.querySelector('.switch-state');
          if (sw && sw.getAttribute('aria-checked') !== String(!!it.available)) sw.setAttribute('aria-checked', String(!!it.available));
          if (lab) { var t = it.available ? 'Available' : 'Sold out'; if (lab.textContent !== t) lab.textContent = t; }
        });
        list._html = null;
      } else {
        patch(list, any ? html : '<div class="panel">' + emptyState('search', 'Nothing on the menu matches “' + state.menuQ + '”', 'Try a shorter word, or clear the search to see the whole menu.',
          '<button class="btn btn--ghost btn--sm" type="button" data-act="mn-clear" data-key="mn-clear">Clear search</button>') + '</div>');
      }
      this.shape = any ? key : null;
      this.spy();
    },
    act: function (el) {
      if (el.dataset.act === 'mn-avail') {
        var it = W.menuItem(el.dataset.id); if (!it) return true;
        try { W.updateMenuItem(it.id, { available: !it.available }); toast(it.available ? it.name + ' is back on' : it.name + ' marked sold out', { icon: 'menu', sub: it.available ? 'Available again on the website and at the counter' : 'Shown as sold out on the website for today' }); }
        catch (e) { toast(errMsg(e), { kind: 'error' }); }
        return true;
      }
      if (el.dataset.act === 'mn-clear') { state.menuQ = ''; $('#mn-q').value = ''; this.update(); $('#mn-q').focus(); return true; }
      if (el.dataset.act === 'mn-jump') {
        var sec = $('#mn-' + CSS.escape(el.dataset.cat));
        if (!sec) { state.menuQ = ''; $('#mn-q').value = ''; this.update(); sec = $('#mn-' + CSS.escape(el.dataset.cat)); }
        if (sec) { sec.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' }); var f = sec.querySelector('.mn-price-input'); if (f) f.focus({ preventScroll: true }); }
        return true;
      }
      return false;
    }
  };

  /* ================================================================== */
  /* VIEW: Offers                                                        */
  /* ================================================================== */
  var Offers = {
    mount: function (host) {
      host.innerHTML = '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Offers</h1><p class="page-desc">Short promotions shown on the member\'s card in White Rewards. Turn one off to hide it.</p></div>' +
        '<div class="page-actions"><button class="btn" type="button" data-act="of-new">' + icon('plus') + 'Add offer</button></div></header>' +
        '<div class="of-list" id="of-list"></div></div>';
      var self = this;
      $('#of-list').addEventListener('submit', function (e) { e.preventDefault(); self.save(e.target); });
      $('#of-list').addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, ''); });
      $('#of-list').addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.ofEdit) { e.preventDefault(); self.cancel(); } });
    },
    original: function () {
      var ed = state.ofEdit; if (!ed) return null;
      var o = ed === 'new' ? { title: '', body: '' } : W.offers(true).filter(function (x) { return x.id === ed; })[0]; if (!o) return null;
      var k = ed === 'new' ? 'new' : ed, v = {};
      v['of-t-' + k] = o.title; v['of-b-' + k] = o.body || '';
      return v;
    },
    isDirty: function () {
      var o = this.original(), f = $('#of-list form.of-edit');
      return o && formChanged(f, o) ? { what: state.ofEdit === 'new' ? 'the new offer' : 'this offer' } : null;
    },
    discard: function () { state.ofEdit = null; },
    edit: function (id) {
      var self = this, go = function () {
        state.ofEdit = id; self.update();
        var f = $('#of-t-' + CSS.escape(id === 'new' ? 'new' : id)); if (f) focusInline(f.form, f);
      };
      var d = this.isDirty();
      if (d && state.ofEdit !== id) confirmDiscard(d.what).then(function (ok) { if (ok) go(); }); else go();
    },
    cancel: function () {
      var id = state.ofEdit; state.ofEdit = null; this.update();
      var b = $('[data-key="ofe-' + id + '"]') || $('[data-act="of-new"]'); if (b) b.focus();
    },
    update: function () {
      var all = W.offers(true), ed = state.ofEdit, html = '';
      if (ed && ed !== 'new' && !all.some(function (o) { return o.id === ed; })) ed = state.ofEdit = null;
      if (ed === 'new') html += this.editCard({ id: '', title: '', body: '' });
      html += all.map(function (o) {
        if (ed === o.id) return Offers.editCard(o);
        return '<article class="of-card' + (o.active ? '' : ' is-off') + '">' +
          '<div class="of-main"><div><h2 class="of-title">' + esc(nd(o.title)) + '</h2><p class="of-body">' + esc(nd(o.body || '')) + '</p></div></div>' +
          '<div class="of-foot"><div class="rw-toggle">' + switchHTML({ id: 'oft-' + o.id, on: o.active, act: 'of-toggle', dataId: o.id, label: 'Show ' + o.title + ' to members', onText: 'Showing to members', offText: 'Hidden' }) + '</div>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-act="of-edit" data-id="' + esc(o.id) + '" data-key="ofe-' + esc(o.id) + '">' + icon('edit') + 'Edit</button></div></article>';
      }).join('');
      var snap = captureForm($('#of-list form.of-edit'));
      if (patch($('#of-list'), html || '<div class="panel">' + emptyState('tag', 'No offers yet', 'Add one to show it on every member\'s card.') + '</div>')) restoreForm($('#of-list form.of-edit'), snap);
    },
    editCard: function (o) {
      var k = o.id || 'new';
      return '<form class="of-card of-edit" data-id="' + esc(o.id) + '" novalidate>' +
        '<div class="field"><label for="of-t-' + k + '">' + (o.id ? 'Title' : 'New offer title') + '</label><input class="input" id="of-t-' + k + '" value="' + esc(o.title) + '" maxlength="60" placeholder="e.g. Free cookie with any latte" autocomplete="off"></div>' +
        '<div class="field"><label for="of-b-' + k + '">Details</label><textarea class="textarea" id="of-b-' + k + '" rows="3" maxlength="180" placeholder="One or two short sentences members will see.">' + esc(o.body) + '</textarea></div>' +
        '<p class="form-error" role="alert" hidden></p>' +
        '<div class="rw-edit-actions"><button class="btn btn--ghost" type="button" data-act="of-cancel">Cancel</button><button class="btn" type="submit">' + (o.id ? 'Save' : 'Add offer') + '</button></div></form>';
    },
    save: function (form) {
      var id = form.dataset.id || '', k = id || 'new', err = $('.form-error', form), titleId = 'of-t-' + k;
      var cur = id ? W.offers(true).filter(function (x) { return x.id === id; })[0] : null;
      clearFieldErrs(form); setError(err, '');
      try {
        var title = $('#' + CSS.escape(titleId), form).value.trim();
        if (!title) fail(titleId, 'Give the offer a title');
        var o = W.saveOffer({ id: id || undefined, title: title, body: $('#of-b-' + CSS.escape(k), form).value.trim(), active: cur ? cur.active : true });
        state.ofEdit = null;
        toast(id ? 'Offer updated' : 'Offer added', { icon: 'tag', sub: o.active ? 'Showing in the White Rewards app' : 'Hidden until you turn it on' });
        this.update();
        var b = $('[data-key="ofe-' + o.id + '"]'); if (b) b.focus();
      } catch (e) { showFormError(form, e, err, { 'title': titleId }); }
    },
    act: function (el) {
      var a = el.dataset.act;
      if (a === 'of-new') { this.edit('new'); return true; }
      if (a === 'of-edit') { this.edit(el.dataset.id); return true; }
      if (a === 'of-cancel') { this.cancel(); return true; }
      if (a === 'of-toggle') {
        var o = W.offers(true).filter(function (x) { return x.id === el.dataset.id; })[0]; if (!o) return true;
        try { W.saveOffer({ id: o.id, title: o.title, body: o.body, active: !o.active }); toast(o.active ? 'Offer is live' : 'Offer hidden', { icon: 'tag', sub: o.title }); }
        catch (e) { toast(errMsg(e), { kind: 'error' }); }
        return true;
      }
      return false;
    }
  };

  /* ================================================================== */
  /* VIEW: Settings                                                      */
  /* ================================================================== */
  var Settings = {
    dirty: false,
    mount: function (host) {
      this.dirty = false;
      host.innerHTML = '<div class="page page--settings">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Settings</h1><p class="page-desc">The rules of White Rewards. Changes apply from the next visit.</p></div></header>' +
        '<div class="set-layout">' +
        '<form class="panel set-form" id="set-form" novalidate aria-label="White Rewards rules"><div id="set-fields"></div></form>' +
        '<aside class="panel set-aside" aria-labelledby="h-pv">' +
        '<h2 class="panel-title" id="h-pv">What members get</h2>' +
        '<div class="field set-bill"><label for="set-bill">Example bill</label><div class="money money--sm"><span aria-hidden="true">MVR</span><input class="input" id="set-bill" inputmode="decimal" maxlength="7" value="120" autocomplete="off"></div></div>' +
        '<div class="set-pv" id="set-pv" aria-live="polite"></div>' +
        '<div class="form-actions"><button class="btn btn--ghost" type="button" data-act="set-undo" disabled>Undo changes</button><button class="btn" type="submit" form="set-form" id="set-save" disabled>Save rules</button></div>' +
        '<p class="hint set-saved" id="set-state" aria-live="polite"></p></aside>' +
        '<section class="panel set-sec set-shift" aria-labelledby="h-sess"><header class="panel-head"><div><h2 class="panel-title" id="h-sess">Your shift</h2><p class="panel-sub" id="set-staff"></p></div><button class="btn btn--ghost btn--sm" type="button" data-act="signout">' + icon('logout') + 'Sign out</button></header></section>' +
        '<section class="panel set-sec set-danger" aria-labelledby="h-demo"><header class="panel-head"><div><h2 class="panel-title" id="h-demo">Demo data</h2>' +
        '<p class="panel-sub">This mockup keeps everything in this browser. Resetting puts back the original members, history, karaoke bookings, menu, rewards and rules, in every open tab.</p></div></header>' +
        '<div class="panel-body"><button class="btn btn--danger-ghost" type="button" data-act="reset">' + icon('undo') + 'Reset demo data</button></div></section>' +
        '</div></div>';
      var self = this, form = $('#set-form');
      form.addEventListener('input', function (e) {
        self.dirty = true; $('[data-act="set-undo"]').disabled = false;
        if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, '');
        self.preview(true);
      });
      form.addEventListener('submit', function (e) { e.preventDefault(); self.save(); });
      $('#set-bill').addEventListener('input', function () {
        var v = this.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'); if (v !== this.value) this.value = v;
        self.preview();
      });
    },
    isDirty: function () { return this.dirty ? { what: 'the White Rewards rules' } : null; },
    discard: function () { this.dirty = false; },
    read: function () {
      var g = function (id) { var el = $('#' + id); return el ? el.value.trim() : ''; };
      return {
        mvrPerBean: g('s-mvr'), welcomeBonus: g('s-welcome'), birthdayBonus: g('s-bday'), referralBonus: g('s-ref'), stampsForFree: g('s-stamps'),
        tiers: W.program.tiers.map(function (t, i) { return { id: t.id, min: i === 0 ? '0' : g('s-min-' + t.id), mult: g('s-mult-' + t.id) }; })
      };
    },
    /** The first problem, in the order the fields appear: { field, msg } or null. */
    check: function (v) {
      var INT = /^\d+$/, DEC = /^\d+(\.\d+)?$/;
      function whole(id, x, label, min, max) {
        if (x === '') return { field: id, msg: 'Enter ' + label.toLowerCase() };
        if (!INT.test(x)) return { field: id, msg: label + ' must be a whole number' + (DEC.test(x) ? '' : ', like ' + Math.max(min, 1)) };
        var n = Number(x);
        if (n < min) return { field: id, msg: label + ' must be ' + F.num(min) + ' or more' };
        if (n > max) return { field: id, msg: label + ' can be at most ' + F.num(max) };
        return null;
      }
      function dec(id, x, label, min, max, eg) {
        if (x === '') return { field: id, msg: 'Enter ' + label.toLowerCase() };
        if (!DEC.test(x)) return { field: id, msg: label + ' must be a number, like ' + eg };
        var n = Number(x);
        if (n < min) return { field: id, msg: label + ' must be ' + min + ' or more' };
        if (n > max) return { field: id, msg: label + ' can be at most ' + max };
        return null;
      }
      var e = dec('s-mvr', v.mvrPerBean, 'MVR per bean', 0.5, 1000, '5') ||
        whole('s-stamps', v.stampsForFree, 'Drinks for a free drink', 2, 50) ||
        whole('s-welcome', v.welcomeBonus, 'Welcome bonus', 0, 10000) ||
        whole('s-bday', v.birthdayBonus, 'Birthday bonus', 0, 10000) ||
        whole('s-ref', v.referralBonus, 'Referral bonus', 0, 10000);
      if (e) return e;
      var prev = 0, tiers = W.program.tiers;
      for (var i = 0; i < v.tiers.length; i++) {
        var t = tiers[i], row = v.tiers[i];
        if (i > 0) {
          e = whole('s-min-' + t.id, row.min, t.name + ' threshold', 1, 1000000); if (e) return e;
          if (Number(row.min) <= prev) return { field: 's-min-' + t.id, msg: t.name + ' must start above ' + tiers[i - 1].name + ' (' + F.num(prev) + ' beans)' };
          prev = Number(row.min);
        }
        e = dec('s-mult-' + t.id, row.mult, t.name + ' multiplier', 1, 5, '1.25'); if (e) return e;
      }
      return null;
    },
    mark: function (problem) {
      var self = this;
      $$('#set-fields .input').forEach(function (i) { if (!problem || i.id !== problem.field) { if (i.getAttribute('aria-invalid') === 'true') fieldErr(i, ''); } });
      if (problem) fieldErr($('#' + problem.field), problem.msg);
      var save = $('#set-save'); if (save) save.disabled = !self.dirty || !!problem;
    },
    update: function () {
      var p = W.program;
      patch($('#set-staff'), 'Signed in as <strong>' + esc(W.currentStaff()) + '</strong>. Visits, rewards and bookings you handle are recorded under your name.');
      if (!this.dirty) {
        // unit: [text, 'pre'|'suf'], shown inside the field so a bare number always reads plainly.
        var f = function (id, label, val, hint, unit, mode) {
          return '<div class="field"><label for="' + id + '">' + label + '</label><div class="unit-input unit-input--' + unit[1] + '"><input class="input" id="' + id + '" inputmode="' + (mode || 'numeric') + '" maxlength="8" value="' + esc(val) + '" autocomplete="off" aria-describedby="' + id + '-h"><span aria-hidden="true">' + unit[0] + '</span></div><p class="hint" id="' + id + '-h">' + hint + '</p></div>';
        };
        var changed = patch($('#set-fields'),
          '<h2 class="panel-title">Earning beans</h2>' +
          '<div class="set-grid">' +
          f('s-mvr', 'MVR spent per bean', p.mvrPerBean, 'The bill divided by this, rounded down', ['MVR', 'pre'], 'decimal') +
          f('s-stamps', 'Drinks for a free drink', p.stampsForFree, 'Stamps on a full coffee card', ['drinks', 'suf']) +
          f('s-welcome', 'Welcome bonus', p.welcomeBonus, 'When someone joins', ['beans', 'suf']) +
          f('s-bday', 'Birthday bonus', p.birthdayBonus, 'In their birthday week', ['beans', 'suf']) +
          f('s-ref', 'Referral bonus', p.referralBonus, 'For each friend who joins', ['beans', 'suf']) +
          '</div>' +
          '<h2 class="panel-title set-h2">Tiers</h2><p class="panel-sub">Tiers follow lifetime beans, so spending beans never lowers a member\'s tier.</p>' +
          '<div class="tier-rows" role="table" aria-label="Tiers"><div class="tier-row tier-row--head" role="row"><span role="columnheader">Tier</span><span role="columnheader">From lifetime beans</span><span role="columnheader">Beans multiplier</span></div>' +
          p.tiers.map(function (t, i) {
            return '<div class="tier-row" role="row"><span role="cell">' + tierChip(t) + '</span>' +
              '<span role="cell">' + (i === 0 ? '<span class="fixed num">0</span><span class="hint">Everyone starts here</span>' : '<label class="visually-hidden" for="s-min-' + t.id + '">' + esc(t.name) + ' from lifetime beans</label><input class="input" id="s-min-' + t.id + '" inputmode="numeric" maxlength="8" value="' + t.min + '" autocomplete="off">') + '</span>' +
              '<span role="cell"><label class="visually-hidden" for="s-mult-' + t.id + '">' + esc(t.name) + ' beans multiplier</label><div class="unit-input unit-input--suf"><input class="input" id="s-mult-' + t.id + '" inputmode="decimal" maxlength="5" value="' + t.mult + '" autocomplete="off"><span aria-hidden="true">×</span></div></span></div>';
          }).join('') + '</div>');
        if (changed) { $('#set-save').disabled = true; $('[data-act="set-undo"]').disabled = true; }
      }
      this.preview();
    },
    /** The example uses the typed (unsaved) values; while a field is wrong it keeps the last good example. */
    preview: function (typing) {
      var v = this.read(), bill = parseMoney($('#set-bill').value), problem = this.check(v);
      if (typing || !problem) this.mark(problem);
      var st = $('#set-state'); if (st) st.textContent = problem ? 'Fix the highlighted field to save.' : this.dirty ? 'Unsaved changes. The example uses them; members get them once you save.' : 'These are the rules in use now.';
      if (problem) { if (!this.lastGood) patch($('#set-pv'), '<p class="pv-main">Fix the highlighted field to see the example.</p>'); return; }
      // Mirrors the store's earn formula for unsaved values (see store_requests: WCH.previewBill).
      var tiers = W.program.tiers.map(function (t, i) { return { name: t.name, beans: Math.round(Math.floor(bill / Number(v.mvrPerBean)) * Number(v.tiers[i].mult)) }; });
      var list = tiers.map(function (t, i) { return '<strong>' + F.num(t.beans) + (i === 0 ? ' ' + (t.beans === 1 ? 'bean' : 'beans') : '') + '</strong> for ' + esc(t.name); });
      var sentence = list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0];
      this.lastGood = true;
      patch($('#set-pv'), '<p class="pv-main">A ' + esc(F.mvr(bill)) + ' bill earns ' + sentence + '.</p>' +
        '<p class="pv-sub">New members start with ' + beans(Number(v.welcomeBonus)) + '. Every ' + ordinal(Number(v.stampsForFree)) + ' handcrafted drink is free. ' +
        W.program.tiers.slice(1).map(function (t, i) { return esc(t.name) + ' from ' + F.num(Number(v.tiers[i + 1].min)) + ' lifetime beans'; }).join(', ') + '.</p>');
    },
    save: function () {
      var v = this.read(), self = this, problem = this.check(v);
      this.mark(problem);
      if (problem) { var f = $('#' + problem.field); if (f) { f.focus({ preventScroll: true }); f.scrollIntoView({ block: 'center', behavior: reduced.matches ? 'auto' : 'smooth' }); } return; }
      var newStamps = Number(v.stampsForFree), full = W.members().filter(function (m) { return m.stamps >= newStamps; }).length;
      function apply() {
        try {
          W.updateProgram({ mvrPerBean: Number(v.mvrPerBean), welcomeBonus: Number(v.welcomeBonus), birthdayBonus: Number(v.birthdayBonus), referralBonus: Number(v.referralBonus), stampsForFree: newStamps, tiers: v.tiers.map(function (t) { return { id: t.id, min: Number(t.min), mult: Number(t.mult) }; }) });
          self.dirty = false;
          toast('White Rewards rules saved', { sub: 'They apply from the next visit' });
          $('#set-save').disabled = true; $('[data-act="set-undo"]').disabled = true; self.preview();
        } catch (e) { toast(errMsg(e), { kind: 'error' }); }
      }
      // A shorter coffee card leaves some cards already full; the store adds their free drink at their next visit.
      if (newStamps < W.program.stampsForFree && full) {
        confirmBox({ title: 'Make the coffee card ' + newStamps + ' drinks?', body: plural(full, 'member') + ' already ' + (full === 1 ? 'has' : 'have') + ' ' + newStamps + ' or more stamps. Their card shows as full, and the free drink is added at their next visit.', ok: 'Save rules' })
          .then(function (ok) { if (ok) apply(); });
      } else apply();
    },
    act: function (el) {
      if (el.dataset.act === 'set-undo') { this.dirty = false; $('#set-fields')._html = null; this.update(); this.mark(null); return true; }
      if (el.dataset.act === 'reset') {
        confirmBox({ title: 'Reset all demo data?', body: 'Members, visits, codes, karaoke bookings, menu prices, rewards, offers and rules go back to the original demo. Anything added today is removed, in every open tab.', ok: 'Reset demo data', danger: true }).then(function (ok) {
          if (!ok) return;
          var me = W.currentStaff(), mid = W.session().memberId;
          W.reset();
          state.seededAt = W.doc.seededAt;
          resetLocalState(); markSeen(); knownBookings = snapBookings();
          Settings.dirty = false;
          if (me) W.signInStaff(me);
          // Seed member IDs are stable, so a customer signed in to the portal stays signed in.
          if (mid && W.member(mid)) { try { W.signInMember(mid); } catch (e) { /* not a seed member */ } }
          toast('Demo data reset', { sub: 'Everything is back to the original demo' });
        });
        return true;
      }
      return false;
    }
  };

  /* ================================================================== */
  /* VIEW: Karaoke                                                       */
  /* ================================================================== */
  function isDateKey(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }
  /** Malé wall clock (date key + hour) to a timestamp. */
  function keyToTs(key, hour) { var a = key.split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2], hour || 0) - W.info.utcOffsetMinutes * 6e4; }
  function longDate(key) { var p = W.maleParts(keyToTs(key, 12)); return DAYS[p.day] + ' ' + p.d + ' ' + MONTHS[p.mo]; }
  function shortDay(key) { return W.karaokeDateLabel(key); }
  function roomLine(r) { return r.name + ', up to ' + r.capacity + ' people, ' + F.mvr(r.rate) + ' an hour'; }
  /** A member's bookings: linked to their card, or made with their phone number. */
  function memberBookings(m) {
    var digits = String(m.phone || '').replace(/\D/g, '').slice(-7);
    return W.karaokeBookings().filter(function (b) {
      return b.memberId === m.id || (!b.memberId && digits.length === 7 && String(b.phone).replace(/\D/g, '').slice(-7) === digits);
    });
  }
  function memberByPhone(raw) {
    var d = String(raw || '').replace(/\D/g, ''); if (d.length < 7) return null;
    d = d.slice(-7);
    return W.members().filter(function (m) { return m.phone.replace(/\D/g, '').slice(-7) === d; })[0] || null;
  }
  /** Hours taken in a room on a date, leaving one booking out (for moves). */
  function takenHours(roomId, date, exceptId) {
    var t = {};
    W.karaokeBookings({ roomId: roomId, date: date }).forEach(function (b) {
      if (b.id === exceptId || b.status === 'cancelled' || b.status === 'no-show') return;
      for (var h = b.start; h < b.start + b.hours; h++) t[h] = b.id;
    });
    return t;
  }
  function fitHours(roomId, date, start, exceptId) {
    var R = W.karaokeRules(), t = takenHours(roomId, date, exceptId), n = 0;
    for (var h = start; h < R.close && n < R.maxHours; h++) { if (t[h]) break; n++; }
    return n;
  }

  /** Bookings that hold a room on a date (cancelled and no-shows free it). */
  function liveBookings(date) { return W.karaokeBookings({ date: date }).filter(function (b) { return b.status !== 'cancelled' && b.status !== 'no-show'; }); }
  /** Rooms to draw for a date: the active ones, plus a paused room that still has bookings. */
  function scheduleRooms(live) { return W.karaokeRooms(true).filter(function (r) { return r.active || live.some(function (b) { return b.roomId === r.id; }); }); }
  /**
   * The day schedule: rooms across, hours down, bookings as blocks over their hours, free hours as buttons.
   * Used by Karaoke > Schedule and, compact (o.compact, keys prefixed o.kp), by Rooms tonight on the dashboard.
   */
  function kGridHTML(date, rooms, live, o) {
    o = o || {};
    var R = W.karaokeRules(), today = W.karaokeToday(), now = Date.now(), np = W.maleParts(now), max = W.karaokeAddDays(today, R.daysAhead);
    var kp = o.kp || 'k', flash = state.karaoke.flash, ids = rooms.map(function (r) { return r.id; });
    var html = '<div class="kg-corner" style="grid-row:1;grid-column:1"></div>';
    rooms.forEach(function (r, i) {
      html += '<div class="kg-room" style="grid-row:1;grid-column:' + (i + 2) + '"><strong>' + esc(r.name) + '</strong><span>' + r.capacity + ' people · ' + F.num(r.rate) + '/h</span>' + (r.active ? '' : '<span class="warn-ink">Paused</span>') + '</div>';
    });
    for (var j = 0; j < R.close - R.open; j++) html += '<div class="kg-hour" style="grid-row:' + (j + 2) + '"><span>' + esc(hourLabel(R.open + j)) + '</span></div>';
    rooms.forEach(function (r, i) {
      var t = takenHours(r.id, date);
      for (var h = R.open; h < R.close; h++) {
        if (t[h]) continue;
        var pos = 'grid-row:' + (h - R.open + 2) + ';grid-column:' + (i + 2);
        var startTs = keyToTs(date, h), endTs = keyToTs(date, h + 1);
        var nowHour = startTs <= now && now < endTs;
        if (r.active && (startTs > now || nowHour) && date <= max) {
          html += '<button type="button" class="kg-cell kg-free' + (nowHour ? ' is-now' : '') + '" style="' + pos + '" data-act="k-new" data-room="' + esc(r.id) + '" data-date="' + date + '" data-hour="' + h + '"' + (nowHour ? ' data-walkin="1"' : '') +
            ' data-key="' + kp + 'f-' + esc(r.id) + '-' + h + '" aria-label="' + esc((nowHour ? 'Walk-in now: ' : 'Book ') + r.name + ' at ' + hourLabel(h)) + '"><span>' + (nowHour ? 'Walk-in' : '+<span class="kg-fh"> ' + esc(hourLabel(h)) + '</span>') + '</span></button>';
        } else html += '<span class="kg-cell is-past" style="' + pos + '"></span>';
      }
    });
    live.forEach(function (b) {
      var i = ids.indexOf(b.roomId); if (i < 0) return;
      var label = b.id + ', ' + b.name + ', ' + b.roomName + ', ' + hourRange(b.start, b.hours) + ', ' + plural(b.guests, 'guest') + ', ' + (STATUS[b.status] || b.status);
      html += '<a class="kb kb--' + esc(b.status) + (b.hours === 1 ? ' kb--short' : '') + (flash === b.id ? ' is-flash' : '') + '" href="#karaoke/' + esc(b.id) + '" data-key="' + kp + 'b-' + esc(b.id) + '" style="grid-row:' + (b.start - R.open + 2) + ' / span ' + b.hours + ';grid-column:' + (i + 2) + '" aria-label="' + esc(label) + '">' +
        '<span class="kb-top"><span class="kb-time num">' + esc(hourRange(b.start, b.hours)) + '</span>' + (b.status !== 'confirmed' ? '<span class="kb-st">' + esc(STATUS[b.status]) + '</span>' : '') + '</span>' +
        '<strong class="kb-name">' + esc(b.name) + '</strong>' +
        (o.compact ? '' : '<span class="kb-meta">' + plural(b.guests, 'guest') + ' · ' + esc(b.id) + (b.memberId ? ' · member' : '') + '</span>' +
        (b.notes ? '<span class="kb-note">' + esc(b.notes) + '</span>' : '')) + '</a>';
    });
    if (date === today && np.h >= R.open && np.h < R.close) {
      html += '<div class="kg-now" style="grid-row:' + (np.h - R.open + 2) + ';grid-column:1 / -1;--at:' + (np.mi / 60 * 100).toFixed(1) + '%" aria-hidden="true"><i></i><span>' + esc(F.time(now)) + '</span></div>';
    }
    return html;
  }

  var Karaoke = {
    tabMounted: null,
    mount: function (host, id) {
      host.innerHTML = '<div class="page page--karaoke">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Karaoke</h1><p class="page-desc" id="k-desc"></p></div>' +
        '<div class="page-actions"><button class="btn" type="button" data-act="k-new" data-key="k-new-top">' + icon('plus') + 'New booking</button></div></header>' +
        '<nav class="utabs utabs--page" id="k-tabs" aria-label="Karaoke"></nav>' +
        '<div id="k-body"></div></div>';
      this.tabMounted = null;
      this.route(id, true);
    },
    unmount: function () { this.tabMounted = null; },
    baseHash: function () {
      var k = state.karaoke;
      if (k.tab !== 'schedule') return '#karaoke/' + k.tab;
      return k.date && k.date !== W.karaokeToday() ? '#karaoke/' + k.date : '#karaoke';
    },
    route: function (id) {
      var k = state.karaoke, bookingId = null;
      if (!k.date) k.date = W.karaokeToday();
      if (!id) { k.tab = 'schedule'; k.date = W.karaokeToday(); }   // plain #karaoke is always today
      else if (isDateKey(id)) { k.tab = 'schedule'; k.date = id; }
      else if (id === 'list' || id === 'rooms') k.tab = id;
      else if (/^K-?\d+$/i.test(id) && W.karaokeBooking(id)) {
        var b = W.karaokeBooking(id); bookingId = b.id;
        if (!this.tabMounted && k.tab === 'schedule') k.date = b.date;
      } else {
        toast('No booking with reference ' + id, { kind: 'error' });
        history.replaceState(null, '', '#karaoke'); k.tab = 'schedule';
      }
      if (this.tabMounted !== k.tab) this.mountTab();
      this.update();
      if (bookingId) openBooking(bookingId);
      else if (bk) closeDialog(bk.dlg, false, true);
    },
    mountTab: function () {
      var k = state.karaoke, body = $('#k-body'), self = this; if (!body) return;
      this.tabMounted = k.tab;
      body._html = null;
      patch($('#k-tabs'), [['schedule', 'Schedule', '#karaoke' + (k.date && k.date !== W.karaokeToday() ? '/' + k.date : '')], ['list', 'Bookings', '#karaoke/list'], ['rooms', 'Rooms', '#karaoke/rooms']].map(function (t) {
        return '<a class="utab" href="' + t[2] + '"' + (k.tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
      }).join(''));
      if (k.tab === 'schedule') {
        var R = W.karaokeRules(), today = W.karaokeToday();
        body.innerHTML = '<section class="k-day" aria-labelledby="k-date">' +
          '<div class="k-dayhead"><div class="k-datenav" role="group" aria-label="Change day">' +
          '<button class="btn btn--ghost k-nav" type="button" data-act="k-day" data-d="-1" aria-label="Previous day">' + icon('chevronLeft') + '</button>' +
          '<button class="btn btn--ghost" type="button" data-act="k-today" id="k-todaybtn">Today</button>' +
          '<button class="btn btn--ghost k-nav" type="button" data-act="k-day" data-d="1" aria-label="Next day" id="k-next">' + icon('chevronRight') + '</button></div>' +
          '<h2 class="k-date" id="k-date"></h2>' +
          '<label class="k-pick"><span>Go to date</span><input class="input" type="date" id="k-dpick" min="' + W.karaokeAddDays(today, -60) + '" max="' + W.karaokeAddDays(today, R.daysAhead) + '"></label></div>' +
          '<p class="k-sum" id="k-sum"></p>' +
          '<div class="kgrid-wrap"><div class="kgrid" id="k-grid" role="region" aria-label="Rooms and hours"></div></div>' +
          '<div id="k-off"></div>' +
          '<p class="hint k-hint">Tap a free hour to book it. Tap a booking to check in, complete, move, cancel or call.</p></section>';
        $('#k-dpick').addEventListener('change', function () { if (isDateKey(this.value)) self.go(this.value); });
      } else if (k.tab === 'list') {
        body.innerHTML = '<div class="k-list"><div class="toolbar">' +
          '<div class="search"><label class="visually-hidden" for="k-q">Search bookings</label>' + icon('search') + '<input class="input" id="k-q" type="search" placeholder="Name, phone or reference" autocomplete="off" spellcheck="false" value="' + esc(k.q) + '"></div>' +
          '<div class="sort-sel"><label for="k-when">Show</label><select class="select" id="k-when">' + [['upcoming', 'Today and later'], ['today', 'Today'], ['past', 'Past'], ['all', 'All dates']].map(function (o) { return '<option value="' + o[0] + '"' + (k.when === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
          '<div class="sort-sel"><label for="k-status">Status</label><select class="select" id="k-status"><option value="">Any</option>' + W.karaokeRules().statuses.map(function (st) { return '<option value="' + st + '"' + (k.status === st ? ' selected' : '') + '>' + STATUS[st] + '</option>'; }).join('') + '</select></div>' +
          '</div>' +
          '<p class="k-count" id="k-count" aria-live="polite"></p>' +
          '<div class="panel k-table-wrap"><table class="table k-table"><caption class="visually-hidden">Karaoke bookings</caption><thead><tr><th scope="col" class="c-ref">Reference</th><th scope="col" class="c-when">When</th><th scope="col" class="c-room">Room</th><th scope="col" class="c-guest">Booked by</th><th scope="col" class="r c-n">Guests</th><th scope="col" class="r c-total">Total</th><th scope="col" class="c-st">Status</th></tr></thead><tbody id="k-tbody"></tbody></table></div>' +
          '<ul class="k-cards" id="k-cards" role="list"></ul><div id="k-empty"></div></div>';
        $('#k-q').addEventListener('input', function () { k.q = this.value; self.update(); });
        $('#k-when').addEventListener('change', function () { k.when = this.value; self.update(); });
        $('#k-status').addEventListener('change', function () { k.status = this.value; self.update(); });
        $('#k-tbody').addEventListener('click', function (e) {
          if (e.target.closest('a,button')) return;
          var tr = e.target.closest('tr[data-id]'); if (tr) location.hash = '#karaoke/' + tr.dataset.id;
        });
      } else {
        body.innerHTML = '<p class="k-rooms-note">Names, sizes and hourly rates show on the booking page straight away. Bookings already made keep the rate they were booked at.</p>' +
          '<div class="panel list-card" id="k-rooms"></div>';
        var list = $('#k-rooms');
        list.addEventListener('submit', function (e) { e.preventDefault(); self.saveRoom(e.target); });
        list.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, ''); });
        list.addEventListener('keydown', function (e) { if (e.key === 'Escape' && k.roomEdit) { e.preventDefault(); e.stopPropagation(); self.cancelRoom(); } });
      }
    },
    /** Change the schedule day without piling up history entries. */
    go: function (date) {
      var k = state.karaoke, R = W.karaokeRules(), today = W.karaokeToday();
      var max = W.karaokeAddDays(today, R.daysAhead), min = W.karaokeAddDays(today, -60);
      if (date > max) date = max; if (date < min) date = min;
      k.date = date;
      history.replaceState(null, '', this.baseHash());
      prevHash = location.hash;
      this.mountTabsOnly();
      this.update();
    },
    mountTabsOnly: function () { var t = $('#k-tabs a'); if (t) t.setAttribute('href', state.karaoke.date !== W.karaokeToday() ? '#karaoke/' + state.karaoke.date : '#karaoke'); },
    update: function () {
      var k = state.karaoke, R = W.karaokeRules();
      patch($('#k-desc'), esc('Rooms are booked by the hour, 4 PM to midnight, 1 to ' + R.maxHours + ' hours, up to ' + R.daysAhead + ' days ahead. Guests pay at the café.'));
      if (k.tab === 'schedule') this.renderSchedule();
      else if (k.tab === 'list') this.renderList();
      else this.renderRooms();
    },
    renderSchedule: function () {
      var k = state.karaoke, R = W.karaokeRules(), today = W.karaokeToday(), date = k.date, now = Date.now(), np = W.maleParts(now);
      var max = W.karaokeAddDays(today, R.daysAhead);
      patch($('#k-date'), esc(longDate(date)) + (date === today ? ' <span class="k-tag">Today</span>' : date < today ? ' <span class="k-tag k-tag--past">Past</span>' : ''));
      var pick = $('#k-dpick'); if (pick && document.activeElement !== pick && pick.value !== date) pick.value = date;
      var nx = $('#k-next'); if (nx) nx.disabled = date >= max;
      var tb = $('#k-todaybtn'); if (tb) tb.disabled = date === today;
      var dayB = W.karaokeBookings({ date: date });
      var live = liveBookings(date), rooms = scheduleRooms(live);
      var paused = W.karaokeRooms(true).filter(function (r) { return rooms.indexOf(r) < 0; });
      var hours = R.close - R.open, booked = 0, total = 0, inRoom = 0;
      live.forEach(function (b) { booked += b.hours; total += b.total; if (b.status === 'checked-in') inRoom++; });
      var cap = W.karaokeRooms().length * hours;
      patch($('#k-sum'), live.length ?
        '<span><strong>' + plural(live.length, 'booking') + '</strong></span><span>' + booked + ' of ' + cap + ' room hours booked (' + (cap ? Math.round(booked / cap * 100) : 0) + '%)</span><span>' + esc(F.mvr(total)) + ' in room charges</span>' + (inRoom ? '<span class="ok-ink">' + inRoom + ' in a room now</span>' : '') :
        '<span>No bookings on this day yet.</span>');
      var html = kGridHTML(date, rooms, live);
      var grid = $('#k-grid');
      if (grid) grid.style.setProperty('--rooms', rooms.length);
      patch(grid, html);
      if (k.flash) { var fl = k.flash; setTimeout(function () { if (state.karaoke.flash === fl) state.karaoke.flash = null; }, 2200); }
      var off = dayB.filter(function (b) { return b.status === 'cancelled' || b.status === 'no-show'; });
      patch($('#k-off'), (off.length ? '<div class="k-off"><h3 class="sub-title">Not on the schedule</h3><ul class="bk-mini" role="list">' + off.map(function (b) {
        return '<li><a class="bk-mini-row" href="#karaoke/' + esc(b.id) + '" data-key="ko-' + esc(b.id) + '"><span class="bk-mini-when"><strong>' + esc(hourRange(b.start, b.hours)) + '</strong> ' + esc(b.roomName) + '</span><span class="bk-mini-what">' + esc(b.name) + ' · ' + esc(b.id) + '</span>' + statusHTML(b.status) + '</a></li>';
      }).join('') + '</ul></div>' : '') +
        (paused.length ? '<p class="hint">' + esc(paused.map(function (r) { return r.name; }).join(' and ')) + (paused.length === 1 ? ' is' : ' are') + ' paused. Turn ' + (paused.length === 1 ? 'it' : 'them') + ' back on under <a href="#karaoke/rooms">Rooms</a>.</p>' : ''));
    },
    filtered: function () {
      var k = state.karaoke, today = W.karaokeToday(), q = k.q.trim().toLowerCase(), digits = q.replace(/\D/g, '');
      var list = W.karaokeBookings().filter(function (b) {
        if (k.when === 'upcoming' && b.date < today) return false;
        if (k.when === 'today' && b.date !== today) return false;
        if (k.when === 'past' && b.date >= today) return false;
        if (k.status && b.status !== k.status) return false;
        if (!q) return true;
        return b.name.toLowerCase().indexOf(q) > -1 || b.id.toLowerCase().indexOf(q) > -1 || ('k' + b.id.slice(2)).indexOf(q.replace(/[^a-z0-9]/g, '')) === 0 ||
          (digits.length >= 3 && b.phone.replace(/\D/g, '').indexOf(digits) > -1) || b.roomName.toLowerCase().indexOf(q) > -1;
      });
      if (k.when === 'past' || k.when === 'all') list.reverse();
      return list;
    },
    renderList: function () {
      var k = state.karaoke, list = this.filtered();
      patch($('#k-count'), esc(list.length ? plural(list.length, 'booking') : ''));
      patch($('#k-tbody'), list.map(function (b) {
        return '<tr data-id="' + esc(b.id) + '"><td><a class="k-ref" href="#karaoke/' + esc(b.id) + '" data-key="kr-' + esc(b.id) + '">' + esc(b.id) + '</a><span class="m-sub">' + esc(b.source) + '</span></td>' +
          '<td><span class="strong">' + esc(shortDay(b.date)) + '</span><span class="m-sub num">' + esc(hourRange(b.start, b.hours)) + '</span></td>' +
          '<td>' + esc(b.roomName) + '</td>' +
          '<td><span class="m-name-txt" title="' + esc(b.name) + '">' + esc(b.name) + '</span><span class="m-sub num">' + esc(b.phone) + (b.memberId ? ' · member' : '') + '</span></td>' +
          '<td class="r num">' + b.guests + '</td><td class="r num">' + F.num(b.total) + '</td><td>' + statusHTML(b.status) + '</td></tr>';
      }).join(''));
      patch($('#k-cards'), list.map(function (b) {
        return '<li><a class="k-card" href="#karaoke/' + esc(b.id) + '" data-key="kc-' + esc(b.id) + '">' +
          '<span class="k-card-top"><span class="strong">' + esc(shortDay(b.date)) + ', ' + esc(hourRange(b.start, b.hours)) + '</span>' + statusHTML(b.status) + '</span>' +
          '<span class="k-card-name">' + esc(b.name) + '</span>' +
          '<span class="m-sub">' + esc(b.roomName) + ' · ' + plural(b.guests, 'guest') + ' · ' + esc(F.mvr(b.total)) + ' · ' + esc(b.id) + '</span></a></li>';
      }).join(''));
      var empty = !list.length;
      $('.k-table-wrap').hidden = empty; $('#k-cards').hidden = empty;
      patch($('#k-empty'), empty ? '<div class="panel">' + emptyState('search', 'No bookings match', k.q ? 'Nobody matches “' + k.q + '” with these filters.' : 'Nothing with these filters.',
        '<div class="empty-actions"><button class="btn btn--ghost btn--sm" type="button" data-act="k-clear">Clear filters</button></div>') + '</div>' : '');
    },
    renderRooms: function () {
      var k = state.karaoke, rooms = W.karaokeRooms(true), today = W.karaokeToday();
      if (k.roomEdit && !W.karaokeRoom(k.roomEdit)) k.roomEdit = null;
      var html = rooms.map(function (r) {
        if (k.roomEdit === r.id) return Karaoke.roomForm(r);
        var up = W.karaokeBookings({ roomId: r.id, from: today }).filter(function (b) { return b.status === 'confirmed' || b.status === 'checked-in'; }).length;
        return '<div class="rw-row kr-row' + (r.active ? '' : ' is-off') + '">' +
          '<div class="rw-main"><p class="rw-name">' + esc(r.name) + '</p><p class="rw-meta">Up to ' + r.capacity + ' people · ' + plural(up, 'upcoming booking') + '</p>' + (r.blurb ? '<p class="rw-blurb">' + esc(r.blurb) + '</p>' : '') + '</div>' +
          '<p class="rw-cost"><strong class="num">' + F.num(r.rate) + '</strong> MVR an hour</p>' +
          '<div class="rw-toggle">' + switchHTML({ id: 'krt-' + r.id, on: r.active, act: 'kr-toggle', dataId: r.id, label: 'Take bookings for the ' + r.name, onText: 'Taking bookings', offText: 'Paused' }) + '</div>' +
          '<button class="btn btn--ghost btn--sm rw-edit-btn" type="button" data-act="kr-edit" data-id="' + esc(r.id) + '" data-key="kre-' + esc(r.id) + '">' + icon('edit') + 'Edit</button></div>';
      }).join('');
      var snap = captureForm($('#k-rooms form.rw-edit'));
      if (patch($('#k-rooms'), html)) restoreForm($('#k-rooms form.rw-edit'), snap);
    },
    roomForm: function (r) {
      var k = r.id;
      return '<form class="rw-row rw-edit kr-edit" data-id="' + esc(r.id) + '" novalidate>' +
        '<div class="kr-fields">' +
        '<div class="field kr-f-name"><label for="kr-n-' + k + '">Room name</label><input class="input" id="kr-n-' + k + '" maxlength="40" value="' + esc(r.name) + '" autocomplete="off"></div>' +
        '<div class="field"><label for="kr-c-' + k + '">Fits up to</label><div class="unit-input unit-input--suf"><input class="input" id="kr-c-' + k + '" inputmode="numeric" maxlength="3" value="' + r.capacity + '" autocomplete="off"><span aria-hidden="true">people</span></div></div>' +
        '<div class="field"><label for="kr-r-' + k + '">Hourly rate</label><div class="unit-input unit-input--pre"><input class="input" id="kr-r-' + k + '" inputmode="numeric" maxlength="6" value="' + r.rate + '" autocomplete="off"><span aria-hidden="true">MVR</span></div></div>' +
        '<div class="field kr-f-blurb"><label for="kr-b-' + k + '">Line on the booking page</label><textarea class="textarea" id="kr-b-' + k + '" rows="2" maxlength="160">' + esc(r.blurb || '') + '</textarea></div>' +
        '</div><p class="form-error" role="alert" hidden></p>' +
        '<div class="rw-edit-actions"><button class="btn btn--ghost" type="button" data-act="kr-cancel">Cancel</button><button class="btn" type="submit">Save room</button></div></form>';
    },
    roomOriginal: function () {
      var r = state.karaoke.roomEdit && W.karaokeRoom(state.karaoke.roomEdit); if (!r) return null;
      var o = {}; o['kr-n-' + r.id] = r.name; o['kr-c-' + r.id] = r.capacity; o['kr-r-' + r.id] = r.rate; o['kr-b-' + r.id] = r.blurb || '';
      return o;
    },
    isDirty: function () {
      if (bk && bk.moving && bk.moveDirty) return { what: 'the booking move' };
      var o = this.roomOriginal(), f = $('#k-rooms form.rw-edit');
      return o && formChanged(f, o) ? { what: 'this room' } : null;
    },
    discard: function () { state.karaoke.roomEdit = null; if (bk) { bk.moving = false; bk.moveDirty = false; } },
    editRoom: function (id) {
      var self = this, go = function () {
        state.karaoke.roomEdit = id; self.update();
        var f = id && $('#kr-n-' + CSS.escape(id)); if (f) { focusInline(f.form, f); f.select(); }
      };
      var d = this.isDirty();
      if (d && state.karaoke.roomEdit !== id) confirmDiscard(d.what).then(function (ok) { if (ok) go(); }); else go();
    },
    cancelRoom: function () {
      var id = state.karaoke.roomEdit; state.karaoke.roomEdit = null; this.update();
      var b = $('[data-key="kre-' + id + '"]'); if (b) b.focus();
    },
    saveRoom: function (form) {
      var id = form.dataset.id, r = W.karaokeRoom(id), err = $('.form-error', form); if (!r) return;
      clearFieldErrs(form); setError(err, '');
      try {
        var name = $('#kr-n-' + CSS.escape(id), form).value.trim();
        var cap = $('#kr-c-' + CSS.escape(id), form).value.trim(), rate = $('#kr-r-' + CSS.escape(id), form).value.trim().replace(/[\s,]/g, '');
        if (!name) fail('kr-n-' + id, 'Give the room a name');
        if (W.karaokeRooms(true).some(function (x) { return x.id !== id && x.name.trim().toLowerCase() === name.toLowerCase(); })) fail('kr-n-' + id, 'Another room already has that name');
        if (!/^\d+$/.test(cap) || +cap < 1) fail('kr-c-' + id, 'Enter how many people fit, like 8');
        if (+cap > 60) fail('kr-c-' + id, 'Keep it at 60 people or fewer');
        if (!/^\d+$/.test(rate) || +rate < 1) fail('kr-r-' + id, 'Enter the hourly rate in whole MVR, like 400');
        if (+rate > 100000) fail('kr-r-' + id, 'Keep the rate at MVR 100,000 or less');
        var big = W.karaokeBookings({ roomId: id, from: W.karaokeToday() }).filter(function (b) { return (b.status === 'confirmed' || b.status === 'checked-in') && b.guests > +cap; }).length;
        W.saveKaraokeRoom(id, { name: name, capacity: +cap, rate: +rate, blurb: $('#kr-b-' + CSS.escape(id), form).value.trim() });
        state.karaoke.roomEdit = null;
        toast(name + ' saved', { sub: 'Up to ' + cap + ' people, ' + F.mvr(+rate) + ' an hour' + (big ? '. ' + plural(big, 'upcoming booking') + ' has more guests than that and stays as booked' : '') });
        this.update();
        var b = $('[data-key="kre-' + id + '"]'); if (b) b.focus();
      } catch (e) { showFormError(form, e, err); }
    },
    act: function (el) {
      var a = el.dataset.act, k = state.karaoke, self = this, r;
      switch (a) {
        case 'k-day': this.go(W.karaokeAddDays(k.date, Number(el.dataset.d))); return true;
        case 'k-today': this.go(W.karaokeToday()); return true;
        case 'k-clear': k.q = ''; k.when = 'upcoming'; k.status = ''; this.tabMounted = null; this.mountTab(); this.update(); var q = $('#k-q'); if (q) q.focus(); return true;
        case 'kr-edit': this.editRoom(el.dataset.id); return true;
        case 'kr-cancel': this.cancelRoom(); return true;
        case 'kr-toggle':
          r = W.karaokeRoom(el.dataset.id); if (!r) return true;
          var up = W.karaokeBookings({ roomId: r.id, from: W.karaokeToday() }).filter(function (b) { return b.status === 'confirmed'; }).length;
          var apply = function () {
            try { W.saveKaraokeRoom(r.id, { active: !r.active }); toast(r.active ? r.name + ' is taking bookings' : r.name + ' paused', { sub: r.active ? 'Shown on the booking page again' : 'Hidden from the booking page. Existing bookings stay.' }); }
            catch (e) { toast(errMsg(e), { kind: 'error' }); }
          };
          if (r.active && up) confirmBox({ title: 'Pause the ' + r.name + '?', body: 'New bookings stop, but its ' + plural(up, 'upcoming booking') + ' stay booked. Call those guests if the room will be closed.', ok: 'Pause room' }).then(function (ok) { if (ok) apply(); });
          else apply();
          return true;
      }
      if (bk && bk.dlg.contains(el)) return bookingAct(el);
      return false;
    }
  };

  /* Booking drawer ------------------------------------------------------ */
  var bk = null;
  function openBooking(id) {
    var b = W.karaokeBooking(id); if (!b) return;
    if (bk && bk.id === b.id) { updateBooking(); return; }
    if (bk) closeDialog(bk.dlg, true, true);
    var nav = state.kNav || 'deep', from = state.kFrom || '';
    var dlg = openDialog({
      cls: 'dlg--drawer', labelledby: 'bk-title',
      guard: function () { return bk && bk.dlg === dlg && bk.moving && bk.moveDirty ? confirmDiscard('the booking move') : true; },
      html: '<div class="drawer">' +
        '<header class="drawer-head"><button class="icon-btn" type="button" data-close aria-label="Close booking">' + icon('x') + '</button><div class="drawer-head-main" id="bk-head"></div></header>' +
        '<div class="drawer-body">' +
        '<div class="md-actions" id="bk-actions"></div>' +
        '<div id="bk-move"></div>' +
        '<section class="md-sec" aria-labelledby="bk-h-facts"><h3 class="sub-title" id="bk-h-facts">Booking</h3><dl class="facts" id="bk-facts"></dl></section>' +
        '<section class="md-sec" aria-labelledby="bk-h-guest"><h3 class="sub-title" id="bk-h-guest">Guest</h3><dl class="facts" id="bk-guest"></dl></section>' +
        '</div></div>',
      onClose: function () {
        var movedDay = bk && bk.dlg === dlg ? bk.movedDay : null;
        if (bk && bk.dlg === dlg) bk = null;
        var r = parseHash();
        if (r.view !== 'karaoke' || !r.id || r.id.toUpperCase() !== b.id) return;
        // Moved to another day while open over the schedule: land on that day. Going Back would show the old one.
        if (movedDay && state.karaoke.tab === 'schedule' && (nav === 'deep' || /^#karaoke(\/\d{4}-\d{2}-\d{2})?$/.test(from))) {
          state.karaoke.date = movedDay; history.replaceState(null, '', Karaoke.baseHash()); route(); return;
        }
        if (nav === 'push') history.back();
        else { history.replaceState(null, '', Karaoke.baseHash()); route(); }
      }
    });
    bk = { dlg: dlg, id: b.id, moving: false, moveDirty: false, mv: null };
    dlg.addEventListener('change', function (e) { if (e.target.closest('#bk-move-form')) moveChanged(e.target); });
    dlg.addEventListener('submit', function (e) { if (e.target.id === 'bk-move-form') { e.preventDefault(); saveMove(); } });
    updateBooking();
  }
  function updateBooking() {
    if (!bk) return;
    var d = bk.dlg, b = W.karaokeBooking(bk.id);
    if (!b) { closeDialog(d, true, true); return; }
    var today = W.karaokeToday(), now = Date.now(), startTs = keyToTs(b.date, b.start), room = W.karaokeRoom(b.roomId);
    var m = b.memberId && W.member(b.memberId), match = !m && memberByPhone(b.phone);
    if (bk.moving && b.status !== 'confirmed' && b.status !== 'checked-in') bk.moving = false;
    patch($('#bk-head', d), '<div><p class="bk-ref">' + esc(b.id) + '</p><h2 class="drawer-title" id="bk-title">' + esc(b.name) + '</h2>' +
      '<p class="drawer-sub">' + statusHTML(b.status) + '<span class="muted">' + esc(b.roomName + ', ' + shortDay(b.date) + ', ' + hourRange(b.start, b.hours)) + '</span></p></div>');
    var acts = [], tel = 'tel:' + String(b.phone).replace(/[^\d+]/g, '');
    if (b.status === 'confirmed') {
      if (b.date === today) acts.push('<button class="btn" type="button" data-act="bk-checkin" data-key="bk-in">' + icon('door') + 'Check in</button>');
      acts.push('<button class="btn btn--ghost" type="button" data-act="bk-move" data-key="bk-mv"' + (bk.moving ? ' aria-expanded="true"' : ' aria-expanded="false"') + '>' + icon('move') + 'Move</button>');
      acts.push('<a class="btn btn--ghost" href="' + esc(tel) + '" data-key="bk-call">' + icon('call') + 'Call</a>');
      if (startTs < now) acts.push('<button class="btn btn--ghost" type="button" data-act="bk-noshow" data-key="bk-ns">No-show</button>');
      acts.push('<button class="btn btn--danger-ghost" type="button" data-act="bk-cancel" data-key="bk-cx">Cancel booking</button>');
    } else if (b.status === 'checked-in') {
      acts.push('<button class="btn" type="button" data-act="bk-complete" data-key="bk-done">' + icon('check') + (startTs > now ? 'Complete early' : 'Complete') + (m ? ' · ' + beans(W.previewEarn(m.id, b.total)) : '') + '</button>');
      acts.push('<button class="btn btn--ghost" type="button" data-act="bk-move" data-key="bk-mv" aria-expanded="' + bk.moving + '">' + icon('move') + 'Change room or length</button>');
      acts.push('<a class="btn btn--ghost" href="' + esc(tel) + '" data-key="bk-call">' + icon('call') + 'Call</a>');
      acts.push('<button class="btn btn--ghost" type="button" data-act="bk-undo-in" data-key="bk-undo">' + icon('undo') + 'Undo check-in</button>');
    } else {
      acts.push('<a class="btn btn--ghost" href="' + esc(tel) + '" data-key="bk-call">' + icon('call') + 'Call</a>');
      if (b.status !== 'completed') acts.push('<button class="btn btn--ghost" type="button" data-act="bk-again" data-key="bk-again">' + icon('plus') + 'Book again</button>');
    }
    patch($('#bk-actions', d), acts.join(''));
    patch($('#bk-move', d), bk.moving ? moveHTML(b) : '');
    var facts = [
      ['Room', esc(b.roomName) + (room ? ' <span class="muted">(fits ' + room.capacity + ')</span>' : '')],
      ['Date', esc(longDate(b.date))],
      ['Time', esc(hourRange(b.start, b.hours)) + ' <span class="muted">(' + plural(b.hours, 'hour') + ')</span>'],
      ['Guests', esc(String(b.guests))],
      ['Total', '<strong>' + esc(F.mvr(b.total)) + '</strong> <span class="muted">' + esc(F.mvr(b.rate)) + ' an hour, paid at the café, plus 10% service charge and 8% GST</span>'],
      ['Booked', esc(b.source + ', ' + F.dateTime(b.createdAt))]
    ];
    if (b.updatedAt) facts.push(['Last change', esc((STATUS[b.status] || b.status) + ', ' + F.ago(b.updatedAt) + (b.updatedBy ? ' by ' + b.updatedBy : ''))]);
    if (b.notes) facts.push(['Notes', '<strong>' + esc(b.notes) + '</strong>']);
    if (b.status === 'completed' && b.beansAwarded && m) {
      var earned = W.activity(m.id).filter(function (a) { return a.type === 'earn' && a.note === b.id; })[0];
      facts.push(['Beans', esc(firstName(m.name) + ' earned ' + (earned ? beans(earned.beans) : 'beans') + ' on the room total')]);
    }
    patch($('#bk-facts', d), facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join(''));
    var g = [
      ['Name', esc(b.name)],
      ['Phone', '<a href="' + esc(tel) + '">' + esc(b.phone) + '</a>']
    ];
    if (b.email) g.push(['Email', '<a href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a>']);
    g.push(['White Rewards', m ? '<a href="#members/' + esc(encodeURIComponent(m.id)) + '">' + esc(m.name) + '</a> ' + tierChip(W.tier(m)) + '<span class="muted d-block">' + (b.status === 'completed' ? 'Card linked' : 'Earns ' + esc(beans(W.previewEarn(m.id, b.total))) + ' when the booking is completed') + '</span>' :
      match ? '<span class="muted">Not linked. The phone number matches </span><a href="#members/' + esc(encodeURIComponent(match.id)) + '">' + esc(match.name) + '</a>' : '<span class="muted">Not a member</span>']);
    patch($('#bk-guest', d), g.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join(''));
  }
  function moveHTML(b) {
    var mv = bk.mv, R = W.karaokeRules(), today = W.karaokeToday(), inRoom = b.status === 'checked-in', now = Date.now();
    var rooms = W.karaokeRooms(true).filter(function (r) { return r.active || r.id === b.roomId; });
    var t = takenHours(mv.roomId, mv.date, b.id), fit = fitHours(mv.roomId, mv.date, mv.start, b.id), room = W.karaokeRoom(mv.roomId);
    var starts = '';
    for (var h = R.open; h < R.close; h++) {
      var past = keyToTs(mv.date, h + 1) <= now && !(inRoom && h === b.start);
      starts += '<option value="' + h + '"' + (h === mv.start ? ' selected' : '') + (t[h] || past ? ' disabled' : '') + '>' + esc(hourLabel(h)) + (t[h] ? ' (booked)' : past ? ' (passed)' : '') + '</option>';
    }
    var lens = '';
    for (var n = 1; n <= R.maxHours; n++) lens += '<option value="' + n + '"' + (n === mv.hours ? ' selected' : '') + (n > fit ? ' disabled' : '') + '>' + plural(n, 'hour') + (n > fit ? ' (does not fit)' : '') + '</option>';
    var changed = mv.roomId !== b.roomId || mv.date !== b.date || mv.start !== b.start || mv.hours !== b.hours;
    // Same room keeps the rate it was booked at (the Rooms tab promises this); a new room takes that room's rate.
    var rate = mv.roomId === b.roomId ? b.rate : (room ? room.rate : 0);
    return '<form class="bk-move" id="bk-move-form" novalidate><h3 class="sub-title">' + (inRoom ? 'Change room or length' : 'Move booking') + '</h3><div class="form-grid">' +
      '<div class="field span-2"><label for="mv-room">Room</label><select class="select" id="mv-room">' + rooms.map(function (r) {
        return '<option value="' + esc(r.id) + '"' + (r.id === mv.roomId ? ' selected' : '') + (r.capacity < b.guests ? ' disabled' : '') + '>' + esc(r.name) + ', fits ' + r.capacity + ', ' + esc(F.mvr(r.rate)) + '/h' + (r.capacity < b.guests ? ' (too small)' : '') + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label for="mv-date">Date</label><input class="input" type="date" id="mv-date" value="' + mv.date + '" min="' + today + '" max="' + W.karaokeAddDays(today, R.daysAhead) + '"' + (inRoom ? ' disabled' : '') + '></div>' +
      '<div class="field"><label for="mv-start">Start</label><select class="select" id="mv-start"' + (inRoom ? ' disabled' : '') + '>' + starts + '</select></div>' +
      '<div class="field span-2"><label for="mv-hours">How long</label><select class="select" id="mv-hours">' + lens + '</select></div>' +
      '</div><p class="bk-move-sum" aria-live="polite">' + (changed ? esc((room ? room.name : '') + ', ' + shortDay(mv.date) + ', ' + hourRange(mv.start, mv.hours) + ', new total ' + F.mvr(rate * mv.hours)) : 'Pick a new room, date or time.') + '</p>' +
      '<p class="form-error" id="mv-err" role="alert" hidden></p>' +
      '<div class="form-actions"><button class="btn btn--ghost" type="button" data-act="bk-move-cancel">Keep as it is</button><button class="btn" type="submit"' + (changed ? '' : ' disabled') + '>Save the move</button></div></form>';
  }
  function moveChanged(el) {
    var b = W.karaokeBooking(bk.id), mv = bk.mv; if (!b) return;
    if (el.id === 'mv-room') mv.roomId = el.value;
    if (el.id === 'mv-date' && isDateKey(el.value)) mv.date = el.value;
    if (el.id === 'mv-start') mv.start = Number(el.value);
    if (el.id === 'mv-hours') mv.hours = Number(el.value);
    // Keep the start and length valid for the new room or date.
    var t = takenHours(mv.roomId, mv.date, b.id), R = W.karaokeRules(), now = Date.now();
    if (t[mv.start] || (b.status !== 'checked-in' && keyToTs(mv.date, mv.start + 1) <= now)) {
      for (var h = R.open; h < R.close; h++) if (!t[h] && keyToTs(mv.date, h + 1) > now) { mv.start = h; break; }
    }
    var fit = fitHours(mv.roomId, mv.date, mv.start, b.id); if (mv.hours > fit) mv.hours = Math.max(1, fit);
    bk.moveDirty = true;
    $('#bk-move', bk.dlg)._html = null;
    patch($('#bk-move', bk.dlg), moveHTML(b));
  }
  function saveMove() {
    var b = W.karaokeBooking(bk.id), mv = bk.mv, err = $('#mv-err', bk.dlg); if (!b) return;
    setError(err, '');
    var room = W.karaokeRoom(mv.roomId);
    if (room && room.capacity < b.guests) { setError(err, 'The ' + room.name + ' fits ' + room.capacity + ', and this booking is for ' + b.guests + '.'); return; }
    if (b.status === 'confirmed' && keyToTs(mv.date, mv.start + 1) <= Date.now()) { setError(err, 'That time has passed. Pick a later hour.'); return; }
    var was = b.roomName + ', ' + shortDay(b.date) + ', ' + hourRange(b.start, b.hours), wasDate = b.date, wasTotal = b.total;
    try {
      // moveKaraoke re-reads storage first, so `b` above is an old copy now. Everything after this uses what it returns.
      var moved = W.moveKaraoke(b.id, { roomId: mv.roomId, date: mv.date, start: mv.start, hours: mv.hours });
      bk.moving = false; bk.moveDirty = false;
      if (moved.date !== wasDate) bk.movedDay = moved.date;
      state.karaoke.flash = moved.id;
      if (state.karaoke.tab === 'schedule') state.karaoke.date = moved.date;
      toast(moved.id + ' moved', { sub: 'Now ' + moved.roomName + ', ' + shortDay(moved.date) + ', ' + hourRange(moved.start, moved.hours) + (moved.total !== wasTotal ? ', ' + F.mvr(moved.total) : '') + ' (was ' + was + ')' });
      updateBooking();
      var f = $('[data-key="bk-mv"]', bk.dlg); if (f) f.focus();
    } catch (e) { setError(err, errMsg(e)); }
  }
  function bookingAct(el) {
    var a = el.dataset.act, b = bk && W.karaokeBooking(bk.id); if (!b) return false;
    var m = b.memberId && W.member(b.memberId), who = firstName(b.name);
    function setStatus(st, msg, sub) {
      try { W.setKaraokeStatus(b.id, st, staffName()); toast(msg, { sub: sub }); updateBooking(); var f = $('#bk-actions .btn', bk && bk.dlg); if (f) f.focus(); }
      catch (e) { toast(errMsg(e), { kind: 'error' }); }
    }
    var startTs = keyToTs(b.date, b.start), early = startTs - Date.now();
    switch (a) {
      case 'bk-checkin':
        // Check in is offered all day; more than an hour early is usually a mis-tap, so ask.
        if (early > 36e5) {
          confirmBox({ title: 'Check in early?', body: 'This booking starts at ' + hourLabel(b.start) + ', ' + untilText(early) + ' from now. Check ' + who + '\'s group in only if they are here and the ' + b.roomName + ' is free.', ok: 'Check in now' })
            .then(function (ok) { if (ok) setStatus('checked-in', who + ' checked in', b.roomName + ' until ' + hourLabel(b.start + b.hours)); });
        } else setStatus('checked-in', who + ' checked in', b.roomName + ' until ' + hourLabel(b.start + b.hours));
        return true;
      case 'bk-undo-in': setStatus('confirmed', who + ' is no longer checked in', 'Back to confirmed, ' + b.roomName + ' ' + hourRange(b.start, b.hours)); return true;
      case 'bk-complete':
        confirmBox({ title: (early > 0 ? 'Complete ' + b.id + ' early?' : 'Complete ' + b.id + '?'),
          body: (early > 0 ? 'This booking runs ' + hourRange(b.start, b.hours) + ' and has not started yet. ' : '') + 'Use this once ' + who + '\'s group has left the ' + b.roomName + '. ' + (m ? m.name + ' earns ' + beans(W.previewEarn(m.id, b.total)) + ' on the ' + F.mvr(b.total) + ' room total.' : 'This booking is not linked to a White Rewards card, so no beans.') + ' A completed booking cannot be changed.', ok: early > 0 ? 'Complete early' : 'Complete booking' })
          .then(function (ok) { if (ok) setStatus('completed', b.id + ' completed', m ? beans(W.previewEarn(m.id, b.total)) + ' for ' + firstName(m.name) : b.roomName + ' is free again'); });
        return true;
      case 'bk-noshow':
        confirmBox({ title: 'Mark ' + b.id + ' as a no-show?', body: who + '\'s group did not come. The ' + b.roomName + ' frees up from now for walk-ins.', ok: 'Mark as no-show', danger: true })
          .then(function (ok) { if (ok) setStatus('no-show', b.id + ' marked as a no-show', b.roomName + ' is free for walk-ins'); });
        return true;
      case 'bk-cancel':
        confirmBox({ title: 'Cancel ' + b.id + '?', body: b.roomName + ', ' + shortDay(b.date) + ', ' + hourRange(b.start, b.hours) + ' for ' + b.name + '. The hours become free on the booking page straight away.', ok: 'Cancel booking', danger: true })
          .then(function (ok) {
            if (!ok) return;
            try { W.cancelKaraoke(b.id, staffName()); toast(b.id + ' cancelled', { sub: 'Let ' + who + ' know: ' + b.phone }); updateBooking(); }
            catch (e) { toast(errMsg(e), { kind: 'error' }); }
          });
        return true;
      case 'bk-move':
        if (bk.moving) { bk.moving = false; bk.moveDirty = false; updateBooking(); return true; }
        bk.moving = true; bk.moveDirty = false; bk.mv = { roomId: b.roomId, date: b.date, start: b.start, hours: b.hours };
        updateBooking();
        var f = $('#mv-room', bk.dlg); if (f) { f.focus(); f.closest('form').scrollIntoView({ block: 'nearest', behavior: reduced.matches ? 'auto' : 'smooth' }); }
        return true;
      case 'bk-move-cancel': bk.moving = false; bk.moveDirty = false; updateBooking(); var mb = $('[data-key="bk-mv"]', bk.dlg); if (mb) mb.focus(); return true;
      case 'bk-again': openNewBooking({ roomId: b.roomId, name: b.name, phone: b.phone, guests: b.guests, memberId: b.memberId, notes: b.notes }); return true;
    }
    return false;
  }

  /* New booking (phone or walk-in) -------------------------------------- */
  var nb = null;
  function openNewBooking(p) {
    p = p || {};
    var R = W.karaokeRules(), today = W.karaokeToday(), rooms = W.karaokeRooms();
    if (!rooms.length) { toast('Every room is paused', { kind: 'error', sub: 'Turn a room back on under Karaoke, Rooms.' }); return; }
    var mem = p.memberId && W.member(p.memberId);
    var st = {
      source: p.walkin ? 'Walk-in' : 'Phone',
      roomId: rooms.some(function (r) { return r.id === p.roomId; }) ? p.roomId : rooms[0].id,
      date: p.walkin ? today : (isDateKey(p.date) && p.date >= today ? p.date : (state.karaoke.date && state.karaoke.date >= today ? state.karaoke.date : today)),
      start: p.hour != null && !isNaN(p.hour) ? Number(p.hour) : null, hours: 1
    };
    var d = openDialog({
      cls: 'dlg--form', labelledby: 'nb-title',
      html: '<form class="dlg-box" id="nb-form" novalidate>' +
        '<header class="dlg-head"><div><h2 class="dlg-title" id="nb-title">New karaoke booking</h2><p class="muted">For a phone call, or a group at the counter right now.</p></div>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + icon('x') + '</button></header>' +
        '<div class="seg seg--2" role="group" aria-label="How they are booking"><button type="button" class="seg-btn" data-src="Phone" aria-pressed="false">Phone booking</button><button type="button" class="seg-btn" data-src="Walk-in" aria-pressed="false">Walk-in, starting now</button></div>' +
        '<div class="form-grid">' +
        '<div class="field span-2"><label for="nb-room">Room</label><select class="select" id="nb-room">' + rooms.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(roomLine(r)) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="nb-date">Date</label><input class="input" type="date" id="nb-date" min="' + today + '" max="' + W.karaokeAddDays(today, R.daysAhead) + '"></div>' +
        '<div class="field"><label for="nb-guests">Guests</label><input class="input" id="nb-guests" inputmode="numeric" maxlength="2" autocomplete="off" value="' + esc(String(p.guests || 2)) + '"></div>' +
        '<div class="field"><label for="nb-start">Start</label><select class="select" id="nb-start"></select></div>' +
        '<div class="field"><label for="nb-hours">How long</label><select class="select" id="nb-hours"></select></div>' +
        '<div class="field"><label for="nb-phone">Mobile number</label><div class="prefix-input"><span aria-hidden="true">+960</span><input class="input" id="nb-phone" inputmode="tel" autocomplete="off" maxlength="20" placeholder="771 2408" value="' + esc(String((mem ? mem.phone : p.phone) || '').replace(/^\+960\s*/, '')) + '"></div></div>' +
        '<div class="field"><label for="nb-name">Name</label><input class="input" id="nb-name" autocomplete="off" maxlength="60" value="' + esc(mem ? mem.name : (p.name || '')) + '"></div>' +
        '<p class="nb-member span-2" id="nb-member" aria-live="polite"></p>' +
        '<div class="field span-2"><label for="nb-notes">Notes <span class="opt">optional</span></label><input class="input" id="nb-notes" autocomplete="off" maxlength="160" placeholder="Birthday, cake, decorations" value="' + esc(p.notes || '') + '"></div>' +
        '</div>' +
        '<p class="nb-sum" id="nb-sum" aria-live="polite"></p>' +
        '<p class="form-error" id="nb-err" role="alert" hidden></p>' +
        '<div class="dlg-actions"><button class="btn btn--ghost" type="button" data-close>Cancel</button><button class="btn" type="submit" id="nb-go">Book room</button></div></form>',
      onClose: function () { if (nb && nb.dlg === d) nb = null; }
    });
    var form = $('#nb-form', d);
    nb = { dlg: d, st: st, sync: sync };
    function slotOk(h) { var t = takenHours(st.roomId, st.date); return !t[h] && keyToTs(st.date, h) > Date.now(); }
    function sync(fromStore) {
      var R2 = W.karaokeRules(), now = Date.now(), room = W.karaokeRoom(st.roomId);
      $$('.seg-btn', form).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.src === st.source)); });
      var walk = st.source === 'Walk-in', nowH = W.maleParts(now).h;
      if (walk) st.date = today;
      var t = takenHours(st.roomId, st.date);
      var di = $('#nb-date', form); di.value = st.date; di.disabled = walk;
      $('#nb-room', form).value = st.roomId;
      var opts = '';
      if (walk) {
        var open = nowH >= R2.open && nowH < R2.close;
        st.start = open && !t[nowH] ? nowH : null;
        st.walkMsg = !open ? 'Walk-ins can start between 4 PM and midnight' : 'The ' + (room ? room.name : 'room') + ' is in use right now. Try another room.';
        opts = st.start != null ? '<option value="' + st.start + '">Now (the ' + esc(hourLabel(st.start)) + ' hour)</option>' : '<option value="">' + esc(open ? 'In use now' : 'Rooms open at 4 PM') + '</option>';
      } else {
        var taken = st.start != null && (t[st.start] || keyToTs(st.date, st.start) <= now);
        if (fromStore && taken) fieldErr($('#nb-start', form), 'Someone just booked this hour. Pick another time.');
        if (st.start == null || (taken && !fromStore)) { st.start = null; for (var h = R2.open; h < R2.close; h++) if (!t[h] && keyToTs(st.date, h) > now) { st.start = h; break; } }
        if (st.start == null) opts = '<option value="">No free hours on this day</option>';
        for (var h2 = R2.open; h2 < R2.close; h2++) {
          var past = keyToTs(st.date, h2) <= now;
          opts += '<option value="' + h2 + '"' + (h2 === st.start ? ' selected' : '') + (t[h2] || past ? ' disabled' : '') + '>' + esc(hourLabel(h2)) + (t[h2] ? ' (booked)' : past ? ' (passed)' : '') + '</option>';
        }
      }
      var ss = $('#nb-start', form); setOptions(ss, opts); ss.disabled = walk; ss.value = st.start != null ? String(st.start) : '';
      var fit = st.start != null ? fitHours(st.roomId, st.date, st.start) : 0;
      if (st.hours > fit) st.hours = Math.max(1, fit);
      var hs = '';
      for (var n = 1; n <= R2.maxHours; n++) hs += '<option value="' + n + '"' + (n > fit ? ' disabled' : '') + '>' + plural(n, 'hour') + (room ? ', ' + esc(F.mvr(room.rate * n)) : '') + (n > fit ? ' (does not fit)' : '') + '</option>';
      var hsel = $('#nb-hours', form); setOptions(hsel, hs); hsel.value = String(st.hours);
      var mm = memberByPhone($('#nb-phone', form).value);
      st.memberId = mm ? mm.id : null;
      patch($('#nb-member', form), mm ? '<span class="nb-linked">White Rewards: <strong>' + esc(mm.name) + '</strong> · ' + esc(W.tier(mm).name) + '. Linked to their card, so they earn beans when the booking is completed.</span>' : '');
      var guests = Number($('#nb-guests', form).value) || 0;
      patch($('#nb-sum', form), room && st.start != null ? '<strong>' + esc(room.name + ', ' + shortDay(st.date) + ', ' + hourRange(st.start, st.hours)) + '</strong>, ' + plural(st.hours, 'hour') + (guests ? ', ' + plural(guests, 'guest') : '') + ', <strong>' + esc(F.mvr(room.rate * st.hours)) + '</strong>. Paid at the café, plus 10% service charge and 8% GST.' : 'Pick a day with a free hour.');
      // Write the label only when it changes: Safari drops a click whose text node is replaced between press and release.
      var go = $('#nb-go', form), lbl = walk ? 'Book and check in' : 'Book room';
      if (go.textContent !== lbl) go.textContent = lbl;
    }
    form.addEventListener('click', function (e) { var s = e.target.closest('.seg-btn'); if (s) { st.source = s.dataset.src; if (st.source === 'Phone') st.start = null; clearFieldErrs(form); setError($('#nb-err', form), ''); sync(); } });
    form.addEventListener('change', function (e) {
      var id = e.target.id;
      // Text fields already sync on input. Their change event fires on blur, often in the middle of a tap on Book room,
      // so it must not rebuild anything.
      if (!/^nb-(room|date|start|hours)$/.test(id)) return;
      if (id === 'nb-room') st.roomId = e.target.value;
      if (id === 'nb-date' && isDateKey(e.target.value)) { st.date = e.target.value; st.start = null; }
      if (id === 'nb-start') st.start = e.target.value === '' ? null : Number(e.target.value);
      if (id === 'nb-hours') st.hours = Number(e.target.value);
      if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, '');
      setError($('#nb-err', form), '');
      sync();
    });
    form.addEventListener('input', function (e) {
      if (e.target.id === 'nb-guests') { var v = e.target.value.replace(/\D/g, '').slice(0, 2); if (v !== e.target.value) e.target.value = v; }
      if (e.target.getAttribute('aria-invalid') === 'true') fieldErr(e.target, '');
      setError($('#nb-err', form), '');
      if (e.target.id === 'nb-phone') {
        var mm = memberByPhone(e.target.value), nm = $('#nb-name', form);
        if (mm && !nm.value.trim()) nm.value = mm.name;
      }
      if (e.target.id === 'nb-phone' || e.target.id === 'nb-guests') sync();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#nb-err', form); clearFieldErrs(form); setError(err, '');
      try {
        var room = W.karaokeRoom(st.roomId);
        if (!room || !room.active) fail('nb-room', 'Pick a room');
        if (st.source === 'Walk-in' && st.start == null) fail('nb-start', st.walkMsg || 'Walk-ins can start between 4 PM and midnight');
        if (st.start == null) fail('nb-start', 'Pick a start time');
        if (st.source !== 'Walk-in' && !slotOk(st.start)) fail('nb-start', 'That hour is taken or has passed. Pick another.');
        var g = $('#nb-guests', form).value.trim();
        if (!/^\d+$/.test(g) || +g < 1) fail('nb-guests', 'How many people are coming?');
        if (+g > room.capacity) fail('nb-guests', 'The ' + room.name + ' fits up to ' + room.capacity + '. Pick a bigger room or fewer guests.');
        var phone = normPhone($('#nb-phone', form).value, 'nb-phone');
        var name = $('#nb-name', form).value.trim();
        if (!name) fail('nb-name', 'Who is the booking for?');
        var mm = memberByPhone(phone);
        var b = W.bookKaraoke({ roomId: st.roomId, date: st.date, start: st.start, hours: st.hours, guests: +g, name: name, phone: phone, notes: $('#nb-notes', form).value.trim(),
          memberId: mm ? mm.id : null, source: st.source, status: st.source === 'Walk-in' ? 'checked-in' : 'confirmed' });
        closeDialog(d, true, true);
        state.karaoke.flash = b.id; state.karaoke.date = b.date; state.karaoke.tab = 'schedule';
        toast((st.source === 'Walk-in' ? 'Checked in: ' : 'Booked: ') + b.id, { sub: b.roomName + ', ' + shortDay(b.date) + ', ' + hourRange(b.start, b.hours) + ' · ' + b.name, action: { label: 'Open', fn: function () { location.hash = '#karaoke/' + b.id; } } });
        var h = '#karaoke' + (b.date !== W.karaokeToday() ? '/' + b.date : '');
        if (current && current.name === 'dashboard' && b.date === W.karaokeToday()) { /* it shows in Rooms tonight */ }
        else if (current && current.name === 'karaoke') { Karaoke.tabMounted = null; history.replaceState(null, '', h); prevHash = h; route(); }
        else location.hash = h;
      } catch (ex) {
        showFormError(form, ex, err, { 'booked that time': 'nb-start', 'start time': 'nb-start', 'people': 'nb-guests', 'phone': 'nb-phone', 'name': 'nb-name', 'midnight': 'nb-hours' });
        if (/just booked/.test(errMsg(ex))) sync();
      }
    });
    sync();
    var first = st.source === 'Walk-in' || st.start != null ? $('#nb-guests', form) : $('#nb-room', form);
    if (first) { first.focus(); if (first.select) first.select(); }
  }

  var VIEWS = { dashboard: Dash, counter: Counter, karaoke: Karaoke, members: Members, rewards: Rewards, menu: Menu, offers: Offers, settings: Settings };

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  buildShell();
  bindSignin();
  state.staffName = W.currentStaff();
  markSeen();
  knownBookings = snapBookings();
  window.addEventListener('hashchange', function () {
    var r = parseHash(), d = W.currentStaff() && current ? dirtyNow() : null;
    var leaving = current && (r.view !== current.name || (drawer && drawer.dirty && r.id !== drawer.id) || (bk && bk.moveDirty && r.id !== bk.id));
    if (d && leaving) {
      var target = location.hash;
      history.replaceState(null, '', prevHash);
      confirmDiscard(d.what).then(function (ok) { if (!ok) return; discardDirty(); location.hash = target; });
      return;
    }
    route();
  });
  route();
  booted = true;
})();
