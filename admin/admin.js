/* ==========================================================================
   White Coffee House — Admin portal (staff back office)
   Runs entirely on window.WCH (assets/js/store.js). Business rules live in
   the store; this file only renders and calls its API. Every view re-renders
   from WCH.subscribe, so changes from the customer portal (or another admin
   tab) show up live.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.WCH;
  if (!W) { document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">The demo data store did not load. Refresh the page to try again.</p>'; return; }
  var F = W.fmt, esc = F.esc;

  var STAFF = ['Shazna', 'Ameen', 'Rifa', 'Nadheem'];          // TODO(store): expose WCH.staff()
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DRINK_CATS = ['coffee', 'cold', 'notcoffee'];
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
    cake: '<path d="M4.5 20.5h15M5.5 20.5v-6.3a1.7 1.7 0 0 1 1.7-1.7h9.6a1.7 1.7 0 0 1 1.7 1.7v6.3"/><path d="M5.5 16.2c1.1 1 2.1 1 3.2 0s2.1-1 3.3 0 2.1 1 3.2 0 2.1-1 3.3 0M12 12.5V9.5M12 6.6c-.6-.6-.6-1.4 0-2.1.6.7.6 1.5 0 2.1z"/>'
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
  function phonePretty(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.indexOf('960') === 0 && d.length === 10) d = d.slice(3);
    if (d.length === 7) return '+960 ' + d.slice(0, 3) + ' ' + d.slice(3);
    return String(raw || '').trim();
  }
  function avatar(name, cls) { return '<span class="avatar' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + esc(F.initials(name)) + '</span>'; }
  function tierChip(t) { return '<span class="tier tier--' + esc(t.id) + '"><i aria-hidden="true"></i>' + esc(t.name) + '</span>'; }
  function mvrHTML(n) { return '<span class="unit">MVR</span>' + F.num(Math.round(Number(n) || 0)); }
  function parseMoney(v) { var s = String(v == null ? '' : v).replace(/[^\d.]/g, ''); if (!s) return 0; var n = parseFloat(s); return isFinite(n) ? n : 0; }
  function staffName() { return W.currentStaff() || 'Counter'; }
  function memberName(id) { var m = W.member(id); return m ? m.name : 'A former member'; }
  function isDrink(item) { return item && DRINK_CATS.indexOf(item.cat) > -1; }
  function errMsg(e) { return (e && e.message) || 'Something went wrong. Please try again.'; }

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

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var state = {
    seededAt: W.doc.seededAt,
    counter: { memberId: null, tab: 'visit', amount: '', drinks: 0, items: [], double: false, cat: 'coffee', success: null, code: '', query: '' },
    members: { q: '', tier: 'all', sort: 'lastVisit', dir: -1 },
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
  var canPopover = typeof toastHost.showPopover === 'function';
  if (canPopover) toastHost.setAttribute('popover', 'manual');
  function raiseToasts() {
    if (!canPopover) return;
    try { if (toastHost.matches(':popover-open')) toastHost.hidePopover(); toastHost.showPopover(); } catch (e) { /* ignore */ }
  }
  function toast(msg, opts) {
    opts = opts || {};
    var kind = opts.kind || 'ok';
    var ic = opts.icon || { ok: 'check', error: 'alert', live: 'bean', info: 'info' }[kind];
    var t = document.createElement('div');
    t.className = 'toast toast--' + kind;
    t.innerHTML = '<span class="toast-ic">' + icon(ic) + '</span>' +
      '<div class="toast-txt">' + (kind === 'live' ? '<span class="toast-live">Live</span>' : '') + '<strong>' + esc(msg) + '</strong>' + (opts.sub ? '<span>' + esc(opts.sub) + '</span>' : '') + '</div>' +
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
    while (toastHost.children.length > 3) toastHost.firstElementChild.remove();
    raiseToasts();
    arm();
  }

  /* ------------------------------------------------------------------ */
  /* Dialogs (native <dialog>: focus is trapped, Escape closes)          */
  /* ------------------------------------------------------------------ */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function openDialog(o) {
    var d = document.createElement('dialog');
    d.className = 'dlg ' + (o.cls || '');
    if (o.labelledby) d.setAttribute('aria-labelledby', o.labelledby);
    d.innerHTML = o.html;
    var ret = document.activeElement;
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
      if (ret && document.contains(ret)) { try { ret.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    });
    d.showModal();
    var af = d.querySelector('[autofocus]');
    if (af) af.focus();
    if (o.onMount) o.onMount(d);
    return d;
  }
  function closeDialog(d, now) {
    if (!d || !d.open || d._closing) return;
    d._closing = true;
    if (now || reduced.matches) { d.close(); return; }
    d.classList.add('is-closing');
    setTimeout(function () { if (d.open) d.close(); }, 170);
  }
  function closeAllDialogs() { $$('dialog[open]').forEach(function (d) { closeDialog(d, true); }); }

  function confirmBox(o) {
    return new Promise(function (resolve) {
      var ok = false;
      var d = openDialog({
        cls: 'dlg--confirm', labelledby: 'cf-title',
        html: '<div class="dlg-box">' +
          '<span class="dlg-ic' + (o.danger ? ' is-danger' : '') + '">' + icon(o.icon || (o.danger ? 'alert' : 'info')) + '</span>' +
          '<h2 class="dlg-title" id="cf-title">' + esc(o.title) + '</h2>' +
          '<p class="dlg-text">' + esc(o.body) + '</p>' +
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
    var r = { icon: 'bean', what: a.note || '', meta: '', beans: a.beans || 0, tone: '' };
    switch (a.type) {
      case 'earn':
        r.icon = 'cup';
        r.what = 'Visit · ' + F.mvr(a.amount);
        r.meta = (a.items && a.items.length ? a.items.join(', ') : '') ;
        if (a.multiplier && a.multiplier > 1) r.meta = (r.meta ? r.meta + ' · ' : '') + a.multiplier + '× beans';
        if (a.staff) r.meta = (r.meta ? r.meta + ' · ' : '') + 'by ' + a.staff;
        break;
      case 'join':
        r.icon = 'userPlus'; r.what = 'Joined White Rewards'; r.meta = a.staff === 'Online' ? 'Signed up in the app' : a.staff === 'Seed' ? '' : 'Signed up at the counter by ' + a.staff; break;
      case 'bonus':
        r.icon = 'sparkle'; r.what = a.note || 'Bonus beans'; r.meta = a.staff ? 'by ' + a.staff : ''; break;
      case 'adjust':
        r.icon = 'adjust'; r.what = a.note || 'Adjustment'; r.meta = a.staff ? 'by ' + a.staff : ''; r.tone = 'neg'; break;
      case 'redeem':
        r.icon = 'ticket'; r.what = 'Redeemed ' + (a.note || 'a reward'); r.meta = a.code ? 'Code ' + a.code : ''; break;
      case 'served':
        r.icon = 'check'; r.what = a.note || 'Reward handed over'; r.meta = (a.code ? a.code + ' · ' : '') + (a.staff ? 'by ' + a.staff : ''); break;
      case 'refund':
        r.icon = 'undo'; r.what = a.note || 'Beans returned'; r.meta = a.code ? 'Code ' + a.code : ''; break;
      case 'free':
        r.icon = 'cup'; r.what = 'Free drink from the coffee card'; r.meta = a.staff ? 'by ' + a.staff : ''; r.tone = 'gold'; break;
      case 'stamp':
        r.icon = 'star'; r.what = a.note || 'Coffee card full'; r.tone = 'gold'; break;
    }
    return r;
  }
  function beansCell(n) {
    if (!n) return '<span class="amt amt--zero" aria-hidden="true">—</span>';
    return '<span class="amt ' + (n > 0 ? 'amt--pos' : 'amt--neg') + '">' + signed(n) + '<span class="visually-hidden"> beans</span></span>';
  }

  function remoteToast(a) {
    var who = firstName(memberName(a.memberId));
    var d = describe(a);
    switch (a.type) {
      case 'redeem':
        toast(who + ' redeemed ' + (a.note || 'a reward'), { kind: 'live', icon: 'ticket', sub: 'Code ' + a.code + ' is waiting at the counter', action: { label: 'View code', fn: function () { showCodeAtCounter(a.code); } } });
        break;
      case 'join':
        toast(memberName(a.memberId) + ' joined White Rewards', { kind: 'live', icon: 'userPlus', sub: a.staff === 'Online' ? 'Signed up in the customer app' : 'Added by ' + a.staff });
        break;
      case 'refund':
        toast(who + ' cancelled ' + (a.code || 'a reward code'), { kind: 'live', icon: 'undo', sub: 'Beans went back to their card' });
        break;
      case 'earn':
        toast(signed(a.beans) + ' beans for ' + who, { kind: 'live', icon: 'cup', sub: 'Visit added by ' + (a.staff || 'another tab') });
        break;
      case 'served':
        toast((a.code || 'A code') + ' served', { kind: 'live', icon: 'check', sub: d.what + (a.staff ? ' · by ' + a.staff : '') });
        break;
      case 'free':
        toast(who + ' used a free drink', { kind: 'live', icon: 'cup', sub: a.staff ? 'by ' + a.staff : '' });
        break;
      case 'bonus': case 'adjust':
        if (a.note === 'Welcome bonus') return;
        toast(signed(a.beans) + ' beans for ' + who, { kind: 'live', icon: a.type === 'bonus' ? 'sparkle' : 'adjust', sub: a.note || '' });
        break;
    }
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
    return '<ol class="cups' + (cls ? ' ' + cls : '') + '" role="img" aria-label="Coffee card: ' + s + ' of ' + n + ' stamps">' + out + '</ol>';
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
    return '<div class="empty"><span class="empty-ic">' + icon(ic) + '</span><p class="empty-title">' + esc(title) + '</p>' + (text ? '<p class="empty-text">' + esc(text) + '</p>' : '') + (extra || '') + '</div>';
  }
  function timelineHTML(list, withName) {
    if (!list.length) return emptyState('clock', 'Nothing here yet', '');
    return list.map(function (a) {
      var d = describe(a);
      return '<li class="tl-row' + (d.tone ? ' tl-row--' + d.tone : '') + '"><span class="tl-ic">' + icon(d.icon) + '</span>' +
        '<div class="tl-txt"><p class="tl-what">' + (withName ? '<strong>' + esc(memberName(a.memberId)) + '</strong> ' : '') + esc(d.what) + '</p>' +
        '<p class="tl-meta">' + esc(F.dateTime(a.ts)) + (d.meta ? ' · ' + esc(d.meta) : '') + '</p></div>' + beansCell(d.beans) + '</li>';
    }).join('');
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
  function readBirthday(root, prefix) {
    var d = $('#' + prefix + '-bd', root).value, m = $('#' + prefix + '-bm', root).value;
    if (!d && !m) return '';
    if (!d || !m) throw new Error('Pick both the day and the month of the birthday, or leave both empty');
    return m + '-' + d;
  }

  /* ------------------------------------------------------------------ */
  /* Shell: sign in, sidebar, top bar, tab bar                           */
  /* ------------------------------------------------------------------ */
  var NAV = [
    { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: 'dashboard', title: 'Dashboard' },
    { id: 'counter', label: 'Counter', icon: 'cup', title: 'Counter' },
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
    $('#side-site').innerHTML = icon('globe') + '<span>Open website</span>' + icon('external', 'ic-sm');
    $('#side-portal').innerHTML = icon('phone') + '<span>Open customer portal</span>' + icon('external', 'ic-sm');
    $('#side-signout').innerHTML = icon('logout');
    $('#tabbar').innerHTML =
      '<a class="tab" href="#dashboard" data-nav="dashboard">' + icon('dashboard') + '<span>Home</span></a>' +
      '<a class="tab" href="#members" data-nav="members">' + icon('members') + '<span>Members</span></a>' +
      '<a class="tab tab--primary" href="#counter" data-nav="counter"><span class="tab-disc">' + icon('cup') + '<span class="tab-badge" data-codes-badge hidden></span></span><span>Counter</span></a>' +
      '<a class="tab" href="#rewards" data-nav="rewards">' + icon('gift') + '<span>Rewards</span></a>' +
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
    var u = $('#topbar-user'); u.textContent = F.initials(staff); u.setAttribute('aria-label', 'More options — signed in as ' + staff);
    var ready = W.redemptions('ready').length;
    $$('[data-codes-badge]').forEach(function (el) { el.textContent = ready; el.hidden = !ready; el.setAttribute('aria-label', plural(ready, 'code') + ' waiting'); });
    var pill = $('#codes-pill');
    pill.hidden = !ready || view === 'counter';
    pill.innerHTML = icon('ticket') + '<span>' + plural(ready, 'code') + '</span>';
    pill.setAttribute('aria-label', plural(ready, 'reward code') + ' waiting — open the counter');
    if (view) {
      $$('[data-nav]').forEach(function (a) { var on = a.dataset.nav === view; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      var more = $('[data-nav-more]'); if (more) more.classList.toggle('is-active', ['menu', 'offers', 'settings'].indexOf(view) > -1);
    }
  }

  function openMore() {
    var staff = W.currentStaff();
    var d = openDialog({
      cls: 'dlg--sheet', labelledby: 'more-title',
      html: '<div class="dlg-box">' +
        '<header class="dlg-head"><div class="more-user">' + avatar(staff) + '<div><h2 class="dlg-title" id="more-title">' + esc(staff) + '</h2><p class="muted">On shift · White Coffee House</p></div></div>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close">' + icon('x') + '</button></header>' +
        '<nav class="more-list" aria-label="More sections">' +
        ['menu', 'offers', 'settings'].map(function (id) { var n = NAV.filter(function (x) { return x.id === id; })[0]; return '<a class="more-item" href="#' + id + '" data-close>' + icon(n.icon) + '<span>' + n.label + '</span>' + icon('chevronRight', 'ic-sm') + '</a>'; }).join('') +
        '</nav><div class="more-list">' +
        '<a class="more-item" href="../" target="_blank" rel="noopener">' + icon('globe') + '<span>Open website</span>' + icon('external', 'ic-sm') + '</a>' +
        '<a class="more-item" href="../portal/" target="_blank" rel="noopener">' + icon('phone') + '<span>Open customer portal</span>' + icon('external', 'ic-sm') + '</a>' +
        '</div><button class="btn btn--ghost btn--block" type="button" data-act="signout">' + icon('logout') + 'Sign out</button></div>'
    });
    return d;
  }

  function showSignin() {
    closeAllDialogs();
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
    var parts = h.split('/');
    return { view: parts[0] || 'dashboard', id: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
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
      if (r.view === 'members' && r.id) state.drawerReturn = fromHash && fromHash.indexOf('#members') !== 0 ? fromHash : null;
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
      if (r.view === 'members' && r.id && fromHash.indexOf('#members/') !== 0) state.drawerReturn = null;
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
    markSeen();
    tick();
  }
  function scheduleRefresh() { if (queued) return; queued = true; Promise.resolve().then(refresh); }

  W.subscribe(function (doc, info) {
    if (info.remote) {
      if (doc.seededAt !== state.seededAt) {
        state.seededAt = doc.seededAt;
        markSeen();
        resetLocalState();
        var me = state.staffName;
        toast('Demo data was reset', { kind: 'info', icon: 'undo', sub: 'Another tab put the original demo data back.' });
        if (!W.currentStaff() && me) { W.signInStaff(me); return; }
      } else if (!W.currentStaff() && state.staffName) {
        state.staffName = null;
        toast('Signed out', { kind: 'info', icon: 'logout', sub: 'You signed out in another tab.' });
      } else {
        unseenActivity().slice(0, 3).reverse().forEach(remoteToast);
      }
    }
    if (W.currentStaff()) state.staffName = W.currentStaff();
    scheduleRefresh();
  });

  function resetLocalState() {
    var c = state.counter;
    c.success = null; c.code = ''; c.items = []; c.amount = ''; c.drinks = 0; c.double = false;
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
      toast('Signed out', { kind: 'info', icon: 'logout', sub: name ? 'See you next shift, ' + name + '.' : '' });
    },
    serve: function (el) { serveCode(el.dataset.code); },
    'cancel-code': function (el) { cancelCode(el.dataset.code); },
    scan: function () { openScan(); },
    'add-member': function (el) { openAddMember({}, el.dataset.from === 'counter'); },
    'open-member': function (el) { location.hash = '#members/' + encodeURIComponent(el.dataset.id); },
    'counter-member': function (el) { location.hash = '#counter/' + encodeURIComponent(el.dataset.id); },
    'adjust-dialog': function (el) { openAdjustDialog(el.dataset.id); },
    'free-drink': function (el) { useFree(el.dataset.id); },
    'chart-table': function (el) {
      state.chartTable = !state.chartTable;
      el.setAttribute('aria-expanded', String(state.chartTable));
      el.innerHTML = state.chartTable ? icon('chart') + 'Show chart' : icon('table') + 'Show table';
      $('#d-chart-table').hidden = !state.chartTable;
      $('#d-chart').hidden = state.chartTable;
    }
  };
  document.addEventListener('click', function (e) {
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
      closeDialog(d);
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
        '<div class="field span-2"><label for="am-name">Full name</label><input class="input" id="am-name" autocomplete="off" value="' + esc(prefill.name || '') + '" autofocus></div>' +
        '<div class="field"><label for="am-phone">Mobile number</label><div class="prefix-input"><span aria-hidden="true">+960</span><input class="input" id="am-phone" inputmode="tel" autocomplete="off" placeholder="771 2408" value="' + esc(prefill.phone || '') + '"></div></div>' +
        '<div class="field"><label for="am-email">Email <span class="opt">optional</span></label><input class="input" id="am-email" type="email" autocomplete="off" spellcheck="false"></div>' +
        '<div class="field span-2"><span class="field-label" id="am-bd-l">Birthday <span class="opt">optional, for the birthday bonus</span></span>' + birthdaySelects('am') + '</div>' +
        '</div>' +
        '<p class="form-error" id="am-error" role="alert" hidden></p>' +
        '<div class="dlg-actions"><button class="btn btn--ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">' + icon('userPlus') + 'Add member</button></div>' +
        '</form>'
    });
    $('#am-form', d).addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#am-error', d);
      try {
        var name = $('#am-name', d).value.trim();
        var digits = $('#am-phone', d).value.replace(/\D/g, '');
        if (!name) throw new Error('Please enter a name');
        if (!digits) throw new Error('Please enter a phone number');
        if (digits.length < 7) throw new Error('Maldives mobile numbers have 7 digits');
        var m = W.join({ name: name, phone: phonePretty(digits), email: $('#am-email', d).value.trim(), birthday: readBirthday(d, 'am'), staff: staffName() });
        closeDialog(d, true);
        toast(m.name + ' joined White Rewards', { icon: 'userPlus', sub: beans(W.program.welcomeBonus) + ' welcome bonus · ' + m.id });
        location.hash = (fromCounter ? '#counter/' : '#members/') + encodeURIComponent(m.id);
      } catch (ex) { setError(err, errMsg(ex)); }
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
      '<div class="field"><label for="' + p + '-n">Number of beans</label><input class="input input--big" id="' + p + '-n" inputmode="numeric" autocomplete="off" placeholder="0"></div>' +
      '<div class="field"><span class="field-label" id="' + p + '-rl">Reason</span><div class="chips" role="group" aria-labelledby="' + p + '-rl">' +
      reasons.map(function (x) { return '<button type="button" class="chip-btn" data-reason="' + esc(x.r) + '" data-n="' + x.n + '" aria-pressed="false">' + esc(x.r) + (x.n ? ' <span class="chip-sub">+' + x.n + '</span>' : '') + '</button>'; }).join('') +
      '</div><label class="visually-hidden" for="' + p + '-r">Reason in your own words</label><input class="input" id="' + p + '-r" autocomplete="off" placeholder="Or type a reason"></div>' +
      '<p class="adjust-preview" id="' + p + '-pv" aria-live="polite"></p>' +
      '<p class="form-error" id="' + p + '-err" role="alert" hidden></p>' +
      '<button class="btn btn--block" type="submit" id="' + p + '-go">Add beans</button>';
  }
  function bindAdjust(form, p, memberId, done) {
    var dir = 1;
    var n = $('#' + p + '-n', form), r = $('#' + p + '-r', form), pv = $('#' + p + '-pv', form), go = $('#' + p + '-go', form);
    function val() { return Math.round(parseMoney(n.value)); }
    function sync() {
      var m = W.member(memberId); if (!m) return;
      var v = val(), after = m.beans + dir * v;
      $$('.seg-btn', form).forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.dir) === dir)); });
      $$('[data-reason]', form).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.reason === r.value.trim())); });
      if (!v) pv.innerHTML = 'Balance now: <strong>' + beans(m.beans) + '</strong>';
      else if (after < 0) pv.innerHTML = '<span class="is-bad">' + esc(firstName(m.name)) + ' only has ' + beans(m.beans) + '.</span>';
      else pv.innerHTML = 'New balance: <strong>' + beans(after) + '</strong> <span class="muted">(now ' + F.num(m.beans) + ')</span>';
      go.textContent = (dir > 0 ? 'Add ' : 'Remove ') + (v ? beans(v) : 'beans');
      go.classList.toggle('btn--danger', dir < 0);
    }
    form._sync = sync;
    form.addEventListener('click', function (e) {
      var b = e.target.closest('.seg-btn');
      if (b) { dir = Number(b.dataset.dir); sync(); return; }
      var c = e.target.closest('[data-reason]');
      if (c) { r.value = c.dataset.reason; if (c.dataset.n) { n.value = c.dataset.n; dir = 1; } sync(); }
    });
    n.addEventListener('input', sync); r.addEventListener('input', sync);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = W.member(memberId), err = $('#' + p + '-err', form), v = val();
      setError(err, '');
      if (!m) return;
      if (!v) { setError(err, 'Enter a number of beans'); n.focus(); return; }
      var reason = r.value.trim() || (dir > 0 ? 'Bonus beans' : 'Adjustment');
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
      host.innerHTML =
        '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><p class="page-meta" id="d-meta"></p><h1 class="display dash-hello" id="page-h1" tabindex="-1"></h1></div>' +
        '<div class="page-actions"><a class="btn" href="#counter">' + icon('cup') + 'Open the counter</a></div></header>' +
        '<section class="kpis" id="d-kpis" aria-label="Today at a glance"></section>' +
        '<div class="dash-grid"><div class="dash-col dash-col--main">' +
        '<section class="card panel p-chart" aria-labelledby="h-chart"><header class="panel-head"><div><h2 class="panel-title" id="h-chart">Visits, last 14 days</h2><p class="panel-sub" id="d-chart-sub"></p></div>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-act="chart-table" aria-expanded="' + state.chartTable + '" aria-controls="d-chart-table">' + (state.chartTable ? icon('chart') + 'Show chart' : icon('table') + 'Show table') + '</button></header>' +
        '<div class="chart" id="d-chart"' + (state.chartTable ? ' hidden' : '') + '></div><div class="chart-table" id="d-chart-table"' + (state.chartTable ? '' : ' hidden') + '></div></section>' +
        '<section class="card panel p-feed" aria-labelledby="h-feed"><header class="panel-head"><div><h2 class="panel-title" id="h-feed">Live activity</h2><p class="panel-sub">Everything that happens at the counter and in the app</p></div><span class="live-badge"><i aria-hidden="true"></i>Live</span></header><ol class="tl feed" id="d-feed" role="list"></ol></section>' +
        '</div><div class="dash-col dash-col--side">' +
        '<section class="card panel p-codes" aria-labelledby="h-codes"><header class="panel-head"><div><h2 class="panel-title" id="h-codes">Codes waiting</h2><p class="panel-sub">Rewards customers are about to collect</p></div><span class="count-pill" id="d-codes-n"></span></header><div id="d-codes"></div></section>' +
        '<section class="card panel p-tiers" aria-labelledby="h-tiers"><header class="panel-head"><div><h2 class="panel-title" id="h-tiers">Members by tier</h2><p class="panel-sub" id="d-tiers-sub"></p></div></header><div id="d-tiers"></div></section>' +
        '<section class="card panel p-top" aria-labelledby="h-top"><header class="panel-head"><div><h2 class="panel-title" id="h-top">Top rewards</h2><p class="panel-sub">Most redeemed, all time</p></div></header><div id="d-top"></div></section>' +
        '</div></div></div>';
      var self = this, chart = $('#d-chart'), lastW = 0;
      this.ro = new ResizeObserver(function () { var w = chart.clientWidth; if (w && Math.abs(w - lastW) > 2) { lastW = w; self.chartKey = ''; self.renderChart(); } });
      this.ro.observe(chart);
    },
    unmount: function () { if (this.ro) this.ro.disconnect(); this.ro = null; },
    update: function () {
      var s = W.stats(14), staff = W.currentStaff(), p = W.maleParts(), open = W.openStatus();
      var greet = p.h < 12 ? 'Good morning' : p.h < 17 ? 'Good afternoon' : 'Good evening';
      patch($('#page-h1'), esc(greet + ', ' + staff));
      patch($('#d-meta'), '<span>' + esc(DAYS[p.day] + ' ' + p.d + ' ' + MONTHS[p.mo]) + '</span><span class="meta-open"><span class="status-dot' + (open.open ? ' is-open' : '') + '" aria-hidden="true"></span>' + esc(open.label + ', ' + open.detail) + '</span>');
      this.renderKpis(s);
      this.series = s.series;
      this.renderChart();
      // Codes waiting
      var ready = W.redemptions('ready');
      patch($('#d-codes-n'), ready.length ? String(ready.length) : '');
      $('#d-codes-n').hidden = !ready.length;
      var served = W.redemptions('served').slice().sort(function (a, b) { return (b.servedAt || 0) - (a.servedAt || 0); }).slice(0, ready.length ? 3 : 4);
      patch($('#d-codes'), (ready.length ? '<ul class="code-list" role="list">' + ready.map(function (r) { return codeRow(r); }).join('') + '</ul>' :
        '<div class="codes-empty">' + icon('ticket') + '<div><p class="empty-title">No codes waiting</p><p class="empty-text">When a member redeems a reward in the app, the code appears here and on the counter.</p></div></div>') +
        (served.length ? '<h3 class="sub-title served-title">Recently served</h3><ul class="served-list" role="list">' + served.map(function (r) {
          return '<li class="served-row"><span class="code-tag code-tag--done">' + esc(r.code) + '</span><div class="code-row-txt"><p class="code-row-title">' + esc(r.rewardName) + '</p>' +
            '<p class="code-row-meta">' + esc(memberName(r.memberId)) + ' · ' + esc(F.ago(r.servedAt)) + (r.servedBy ? ' by ' + esc(r.servedBy) : '') + '</p></div></li>';
        }).join('') + '</ul>' : ''));
      // Feed
      var feed = W.activity(null, 10);
      var prev = this.prevFeed, ids = {};
      var html = feed.map(function (a) {
        ids[a.id] = 1;
        var d = describe(a), isNew = prev && !prev[a.id];
        return '<li class="tl-row' + (d.tone ? ' tl-row--' + d.tone : '') + (isNew ? ' is-new' : '') + '"><span class="tl-ic">' + icon(d.icon) + '</span>' +
          '<div class="tl-txt"><p class="tl-what"><button class="link-btn" type="button" data-act="open-member" data-id="' + esc(a.memberId) + '" data-key="f-' + esc(a.id) + '">' + esc(memberName(a.memberId)) + '</button> <span class="tl-sep">·</span> ' + esc(d.what) + '</p>' +
          '<p class="tl-meta">' + esc(F.ago(a.ts)) + (d.meta ? ' · ' + esc(d.meta) : '') + '</p></div>' + beansCell(d.beans) + '</li>';
      }).join('');
      patch($('#d-feed'), html);
      this.prevFeed = ids;
      // Tiers
      var tiers = W.program.tiers, total = s.members || 1;
      patch($('#d-tiers-sub'), esc(tiers.slice(1).map(function (t) { return t.name + ' from ' + F.num(t.min); }).join(', ') + ' lifetime beans'));
      patch($('#d-tiers'), '<ul class="hbars" role="list">' + tiers.map(function (t) {
        var n = s.tiers[t.id] || 0, pct = Math.round(n / total * 100);
        return '<li class="hbar"><div class="hbar-top">' + tierChip(t) + '<span class="hbar-val"><strong>' + F.num(n) + '</strong> <span class="muted">· ' + pct + '%</span></span></div>' +
          '<div class="hbar-track" aria-hidden="true"><i class="hbar-fill hbar-fill--' + esc(t.id) + '" style="width:' + Math.max(n ? 2 : 0, pct) + '%"></i></div></li>';
      }).join('') + '</ul>');
      // Top rewards
      var top = s.topRewards, max = top.length ? top[0].count : 1;
      patch($('#d-top'), top.length ? '<ol class="hbars hbars--rank" role="list">' + top.map(function (r, i) {
        return '<li class="hbar"><div class="hbar-top"><span class="rank">' + (i + 1) + '</span><span class="hbar-name">' + esc(r.name) + '</span><span class="hbar-val"><strong>' + F.num(r.count) + '</strong><span class="visually-hidden"> times</span>×</span></div>' +
          '<div class="hbar-track" aria-hidden="true"><i class="hbar-fill" style="width:' + Math.round(r.count / max * 100) + '%"></i></div></li>';
      }).join('') + '</ol>' : emptyState('gift', 'No rewards redeemed yet', ''));
    },
    renderKpis: function (s) {
      var y = s.series[s.series.length - 2] || { visits: 0, sales: 0 };
      var vals = { visits: s.visitsToday, sales: s.salesToday, beans: s.beansWeek, members: s.members, redeemed: s.redemptionsWeek, codes: s.readyCodes };
      var tiles = [
        { k: 'visits', label: 'Visits today', ic: 'cup', v: F.num(s.visitsToday), sub: 'Yesterday ' + F.num(y.visits) },
        { k: 'sales', label: 'Sales today', ic: 'chart', v: mvrHTML(s.salesToday), sub: 'Yesterday ' + F.mvr(y.sales) },
        { k: 'beans', label: 'Beans earned', ic: 'bean', v: F.num(s.beansWeek), sub: 'Last 7 days · ' + F.num(s.beansToday) + ' today' },
        { k: 'members', label: 'Members', ic: 'members', v: F.num(s.members), sub: s.newThisWeek ? '+' + F.num(s.newThisWeek) + ' this week' : 'None new this week' },
        { k: 'redeemed', label: 'Redeemed', ic: 'gift', v: F.num(s.redemptionsWeek), sub: 'Rewards, last 7 days' },
        { k: 'codes', label: 'Codes waiting', ic: 'ticket', v: F.num(s.readyCodes), sub: s.readyCodes ? 'Ready to serve' : 'None right now', link: s.readyCodes > 0 }
      ];
      var prev = this.prevKpi;
      var html = tiles.map(function (t) {
        var tag = t.link ? 'a' : 'div';
        return '<' + tag + ' class="kpi card' + (t.link ? ' kpi--alert' : '') + '"' + (t.link ? ' href="#counter"' : '') + ' data-k="' + t.k + '">' +
          '<p class="kpi-label">' + icon(t.ic) + '<span>' + t.label + '</span></p>' +
          '<p class="kpi-value">' + t.v + '</p><p class="kpi-sub">' + esc(t.sub) + (t.link ? ' ' + icon('arrowRight', 'ic-sm') : '') + '</p></' + tag + '>';
      }).join('');
      patch($('#d-kpis'), html);
      if (prev) Object.keys(vals).forEach(function (k) { if (prev[k] !== vals[k]) { var el = $('#d-kpis [data-k="' + k + '"]'); if (el) { el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash'); } } });
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
    var m = { l: 30, r: 6, t: 30, b: 46 };
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
    series.forEach(function (d, i) {
      var cx = m.l + band * i + band / 2, x = cx - bw / 2, hgt = (d.visits / top) * ih, y0 = m.t + ih;
      var r = Math.min(4, hgt, bw / 2);
      var path = hgt > 0 ? 'M' + x + ',' + y0 + 'V' + (y0 - hgt + r) + 'Q' + x + ',' + (y0 - hgt) + ' ' + (x + r) + ',' + (y0 - hgt) + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + (y0 - hgt) + ' ' + (x + bw) + ',' + (y0 - hgt + r) + 'V' + y0 + 'Z' : '';
      var label = (i === last ? 'Today, ' : '') + DAYS[W.maleParts(d.day).day] + ' ' + F.shortDate(d.day) + ': ' + plural(d.visits, 'visit') + ', ' + F.mvr(d.sales) + ' in sales';
      out += '<g class="bar' + (i === last ? ' bar--today' : '') + '" style="--i:' + i + '" data-i="' + i + '" tabindex="' + (i === last ? 0 : -1) + '" role="img" aria-label="' + esc(label) + '">' +
        '<rect class="bar-hit" x="' + (m.l + band * i) + '" y="' + m.t + '" width="' + band + '" height="' + (ih + m.b) + '"/>' +
        (path ? '<path class="bar-mark" d="' + path + '"/>' : '') +
        '<rect class="bar-focus" x="' + (x - 3) + '" y="' + (y0 - hgt - 3) + '" width="' + (bw + 6) + '" height="' + (hgt + 3) + '" rx="5"/>';
      if ((i === last || i === maxI) && d.visits > 0) out += '<text class="cap" x="' + cx + '" y="' + (y0 - hgt - 7) + '" text-anchor="middle">' + d.visits + '</text>';
      var p = W.maleParts(d.day);
      if (narrow) {
        out += '<text class="axis axis--x' + (i === last ? ' is-today' : '') + '" x="' + cx + '" y="' + (H - 26) + '" text-anchor="middle">' + p.d + '</text>';
        if (i === 0 || p.d === 1) out += '<text class="axis axis--x axis--sub" x="' + cx + '" y="' + (H - 9) + '" text-anchor="middle">' + F.shortDate(d.day).split(' ')[1] + '</text>';
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
        '<input class="input" id="ct-q" type="search" placeholder="Name, phone or ID" autocomplete="off" spellcheck="false" enterkeyhint="search" value="' + esc(state.counter.query) + '"></div>' +
        '<button class="btn btn--ghost scan-btn" type="button" data-act="scan">' + icon('scan') + '<span>Scan card</span></button></form>' +
        '<div class="card results" id="ct-results"></div></div>' +
        '<div class="ct-member" id="ct-member"></div>' +
        '<section class="card panel ct-code" aria-labelledby="h-code">' +
        '<header class="panel-head"><div><h2 class="panel-title" id="h-code">Serve a reward code</h2><p class="panel-sub">Members show a code like W-K9PF in their app</p></div></header>' +
        '<form class="code-form" id="code-form" novalidate><label class="visually-hidden" for="code-q">Reward code</label>' +
        '<div class="code-field"><span aria-hidden="true">W-</span><input class="input" id="code-q" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="K9PF" value="' + esc(state.counter.code) + '"></div>' +
        '<button class="btn" type="submit">Find</button></form>' +
        '<div id="code-result" aria-live="polite"></div>' +
        '<h3 class="sub-title">Waiting now</h3><div id="code-list"></div>' +
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
        var v = cq.value.toUpperCase().replace(/^W-?/, '').replace(/[^A-Z0-9]/g, '').slice(0, 4);
        if (cq.value !== v) cq.value = v;
        state.counter.code = v.length === 4 ? v : '';
        self.renderCode();
      });
      $('#code-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var v = cq.value.toUpperCase().replace(/^W-?/, '').replace(/[^A-Z0-9]/g, '');
        state.counter.code = v; self.renderCode(true);
      });
      this.memberId = undefined;
      this.route(id);
    },
    focusOnEnter: function () { return finePointer.matches && !state.counter.memberId ? $('#ct-q') : null; },
    route: function (id) {
      var c = state.counter;
      if (id && !W.member(id)) { toast('No member with ID ' + id, { kind: 'error' }); history.replaceState(null, '', '#counter'); id = null; }
      if (id !== c.memberId) { c.memberId = id || null; c.success = null; c.tab = 'visit'; c.amount = ''; c.drinks = 0; c.items = []; c.double = false; }
      if (id && c.query) { c.query = ''; var q = $('#ct-q'); if (q) q.value = ''; }
      this.mountMember();
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
      var html = (head ? '<p class="results-head">' + esc(head) + '</p>' : '');
      if (!list.length) {
        var digits = q.replace(/\D/g, '');
        html += emptyState('search', 'No member matches “' + q + '”', 'Check the spelling, or add them now — it takes 20 seconds.',
          '<button class="btn btn--sm" type="button" data-act="add-member-q" data-key="add-q">' + icon('userPlus') + 'Add as a new member</button>');
        this._prefill = digits.length >= 3 && digits.length === q.replace(/[\s+-]/g, '').length ? { phone: digits.replace(/^960/, '') } : { name: q };
      } else {
        html += '<ul class="res-list" role="list">' + list.map(function (m) {
          var t = W.tier(m), on = m.id === c.memberId;
          return '<li><button class="res-btn' + (on ? ' is-on' : '') + '" type="button" data-act="counter-member" data-id="' + esc(m.id) + '" data-key="r-' + esc(m.id) + '"' + (on ? ' aria-current="true"' : '') + '>' +
            avatar(m.name) + '<span class="res-main"><span class="res-name">' + esc(m.name) + '</span><span class="res-meta">' + esc(m.id) + ' · ' + esc(m.phone) + '</span></span>' +
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
        host.innerHTML = '<div class="card ct-empty"><img src="../assets/img/logo-mark.svg" alt="" width="64" height="64"><h2 class="ct-empty-title">Ready for the next customer</h2>' +
          '<p class="muted">Search by name, phone or member ID, or scan the QR code on their White Rewards card.</p>' +
          '<div class="ct-empty-actions"><button class="btn" type="button" data-act="scan">' + icon('scan') + 'Scan card</button><button class="btn btn--ghost" type="button" data-act="add-member" data-from="counter">' + icon('userPlus') + 'New member</button></div></div>';
        this.memberId = null;
        this.layout();
        return;
      }
      host.innerHTML = '<section class="card mp" aria-labelledby="mp-name"><div id="mp-sum"></div>' +
        '<div class="mp-tabs" id="mp-tabs" role="group" aria-label="What would you like to do?"></div><div class="mp-body" id="mp-body"></div></section>';
      this.memberId = c.memberId;
      this.mountBody();
      this.layout();
    },
    renderMember: function () {
      var c = state.counter, m = c.memberId && W.member(c.memberId); if (!m || !$('#mp-sum')) return;
      var t = W.tier(m), tp = W.tierProgress(m), ready = W.redemptions('ready').filter(function (r) { return r.memberId === m.id; });
      var bd = birthdaySoon(m.birthday);
      patch($('#mp-sum'),
        '<header class="mp-head">' + avatar(m.name, 'avatar--lg') +
        '<div class="mp-who"><div class="mp-name-row"><h2 class="mp-name" id="mp-name">' + esc(m.name) + '</h2>' + tierChip(t) + '</div><p class="mp-meta">' + esc(m.id) + ' · <span class="nowrap">' + esc(m.phone) + '</span></p></div>' +
        '<button class="icon-btn" type="button" data-act="clear-member" data-key="mp-clear" aria-label="Done with ' + esc(m.name) + '">' + icon('x') + '</button></header>' +
        '<div class="mp-stats">' +
        '<div class="mp-stat mp-stat--beans"><span class="mp-stat-l">Beans</span><strong class="mp-stat-v">' + F.num(m.beans) + '</strong><span class="mp-stat-s">' + (tp.next ? F.num(tp.need) + ' to ' + esc(tp.next.name) : 'Top tier') + '</span></div>' +
        '<div class="mp-stat"><span class="mp-stat-l">Coffee card</span>' + cupsHTML(m, 'cups--sm') + '<span class="mp-stat-s">' + Math.min(m.stamps, W.program.stampsForFree) + ' of ' + W.program.stampsForFree + '</span></div>' +
        '<div class="mp-stat"><span class="mp-stat-l">Free drinks</span><strong class="mp-stat-v' + (m.freeDrinks ? ' is-gold' : '') + '">' + m.freeDrinks + '</strong></div>' +
        '</div>' +
        '<p class="mp-notes">' +
        (m.favourite ? '<span>' + icon('cup', 'ic-sm') + 'Usually has <strong>' + esc(m.favourite) + '</strong></span>' : '') +
        (bd ? '<span class="mp-bday">' + icon('cake', 'ic-sm') + esc(bd) + '</span>' : '') +
        (m.note ? '<span class="mp-note">' + icon('info', 'ic-sm') + esc(m.note) + '</span>' : '') +
        '<a class="mp-profile" href="#members/' + esc(encodeURIComponent(m.id)) + '">Full profile' + icon('chevronRight', 'ic-sm') + '</a></p>');
      var tabs = [
        { id: 'visit', label: 'Add visit', ic: 'plus' },
        { id: 'codes', label: 'Rewards', ic: 'ticket', n: ready.length },
        { id: 'free', label: 'Free drink', ic: 'cup', n: m.freeDrinks },
        { id: 'adjust', label: 'Adjust beans', ic: 'adjust' }
      ];
      patch($('#mp-tabs'), tabs.map(function (x) {
        return '<button type="button" class="mp-tab" data-act="mp-tab" data-tab="' + x.id + '" data-key="tab-' + x.id + '" aria-pressed="' + (c.tab === x.id) + '">' + icon(x.ic) + '<span>' + x.label + '</span>' + (x.n ? '<span class="mp-tab-n">' + x.n + '</span>' : '') + '</button>';
      }).join(''));
      this.renderBody();
    },
    mountBody: function () {
      var c = state.counter, body = $('#mp-body'); if (!body) return;
      body._html = null;
      var m = W.member(c.memberId); if (!m) return;
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
          (s.free ? '<p class="success-free">' + icon('cup') + 'Coffee card full — ' + (s.free === 1 ? 'a free drink is' : s.free + ' free drinks are') + ' waiting</p>' : '') +
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
        '<div class="field"><label for="v-amount">Bill amount</label><div class="money"><span aria-hidden="true">MVR</span><input class="input input--big" id="v-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="' + esc(c.amount) + '" aria-describedby="v-amount-h"></div><p class="hint" id="v-amount-h">Total on the receipt</p></div>' +
        '<div class="field"><span class="field-label" id="v-dr-l">Handcrafted drinks</span><div class="stepper" role="group" aria-labelledby="v-dr-l">' +
        '<button type="button" class="step-btn" data-act="drinks" data-d="-1" aria-label="One drink fewer">' + icon('minus') + '</button>' +
        '<output class="step-val num" id="v-drinks" aria-live="polite">' + c.drinks + '</output>' +
        '<button type="button" class="step-btn" data-act="drinks" data-d="1" aria-label="One drink more">' + icon('plus') + '</button></div><p class="hint">One stamp per drink</p></div>' +
        '</div>' +
        '<div class="quick"><div class="quick-head"><span class="field-label" id="v-q-l">Quick add from the menu</span></div>' +
        '<div class="cat-tabs" id="v-cats" role="group" aria-label="Menu category"></div>' +
        '<div class="chips quick-chips" id="v-chips" role="group" aria-labelledby="v-q-l"></div>' +
        '<div class="order" id="v-order"></div></div>' +
        '<div class="switch-row"><button type="button" class="switch" role="switch" id="v-double" aria-checked="' + c.double + '" aria-labelledby="v-double-l" aria-describedby="v-double-h"><i></i></button>' +
        '<div><span class="switch-label" id="v-double-l">Double beans</span><span class="hint" id="v-double-h">For double-bean hours and special days</span></div></div>' +
        '<div class="earn-preview" id="v-preview" aria-live="polite"></div>' +
        '<p class="form-error" id="v-error" role="alert" hidden></p>' +
        '<div class="visit-go"><button class="btn btn--lg btn--block" type="submit" id="v-submit">' + icon('check') + 'Add visit</button></div>' +
        '</form>';
    },
    bindVisit: function () {
      var c = state.counter, self = this, amt = $('#v-amount');
      amt.addEventListener('input', function () {
        var v = amt.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
        if (v !== amt.value) amt.value = v;
        c.amount = v; setError($('#v-error'), ''); self.renderVisitLive();
      });
      $('#v-double').addEventListener('click', function () { c.double = !c.double; this.setAttribute('aria-checked', String(c.double)); self.renderVisitLive(); });
      $('#visit-form').addEventListener('submit', function (e) { e.preventDefault(); self.submitVisit(); });
    },
    renderVisitLive: function () {
      var c = state.counter, m = W.member(c.memberId); if (!m || !$('#v-preview')) return;
      var cats = W.categories();
      patch($('#v-cats'), cats.map(function (k) { return '<button type="button" class="cat-tab" data-act="quick-cat" data-cat="' + esc(k.id) + '" data-key="cat-' + esc(k.id) + '" aria-pressed="' + (c.cat === k.id) + '">' + esc(k.name) + '</button>'; }).join(''));
      patch($('#v-chips'), W.menu(c.cat).map(function (it) {
        return '<button type="button" class="chip-btn quick-chip" data-act="quick" data-id="' + esc(it.id) + '" data-key="q-' + esc(it.id) + '"' + (it.available ? '' : ' disabled') + '>' +
          '<span>' + esc(it.name) + '</span><span class="chip-sub num">' + (it.available ? F.num(it.price) : 'Sold out') + '</span></button>';
      }).join(''));
      var counts = {}; c.items.forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
      var ids = Object.keys(counts);
      patch($('#v-order'), ids.length ? '<ul class="order-list" role="list">' + ids.map(function (id) {
        var it = W.menuItem(id); if (!it) return '';
        return '<li class="order-tag"><span>' + esc(it.name) + (counts[id] > 1 ? ' ×' + counts[id] : '') + '</span><button type="button" class="order-x" data-act="unquick" data-id="' + esc(id) + '" data-key="ux-' + esc(id) + '" aria-label="Remove one ' + esc(it.name) + '">' + icon('x') + '</button></li>';
      }).join('') + '<li><button type="button" class="link-btn" data-act="clear-order" data-key="clear-order">Clear</button></li></ul>' : '');
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
      if (c.drinks) pv += '<p class="pv-sub">' + (free ? icon('cup', 'ic-sm') + 'Completes the coffee card — ' + plural(free, 'free drink') : '+' + plural(c.drinks, 'stamp') + ' · coffee card ' + after + ' of ' + per) + '</p>';
      patch($('#v-preview'), pv);
      $('#v-submit').innerHTML = icon('check') + (amount ? 'Add visit · ' + beans(earn) : 'Add visit');
    },
    submitVisit: function () {
      var c = state.counter, m = W.member(c.memberId), err = $('#v-error'); if (!m) return;
      var amount = parseMoney(c.amount);
      setError(err, '');
      var freeBefore = m.freeDrinks;
      try {
        var mult = c.double ? 2 : 1;
        var a = W.earn(m.id, { amount: amount, drinks: c.drinks, items: c.items.map(function (id) { var it = W.menuItem(id); return it ? it.name : id; }), staff: staffName(), multiplier: mult });
        c.success = { beans: a.beans, amount: amount, multiplier: mult, free: m.freeDrinks - freeBefore };
        c.amount = ''; c.drinks = 0; c.items = []; c.double = false;
        toast('+' + beans(a.beans) + ' for ' + firstName(m.name), { icon: 'cup', sub: F.mvr(amount) + ' visit · balance ' + beans(m.beans) });
        this.mountBody();
        this.renderBody();
        var nx = $('#sx-next'); if (nx) nx.focus({ preventScroll: true });
      } catch (e) { setError(err, errMsg(e)); var f = $('#v-amount'); if (f) f.focus(); }
    },
    codesHTML: function (m) {
      var ready = W.redemptions('ready').filter(function (r) { return r.memberId === m.id; });
      var rewards = W.rewards();
      var out = '<div class="mp-sec"><h3 class="sub-title">Codes waiting for ' + esc(firstName(m.name)) + '</h3>' +
        (ready.length ? '<ul class="code-list" role="list">' + ready.map(function (r) { return codeRow(r, { noName: true }); }).join('') + '</ul>' :
          '<p class="muted mp-none">No codes waiting. Members redeem in the White Rewards app and show you the code.</p>') + '</div>';
      out += '<div class="mp-sec"><h3 class="sub-title">Redeem at the counter</h3><p class="hint">For members without their phone — the beans come off now and the reward is marked as served.</p>' +
        '<ul class="redeem-list" role="list">' + rewards.map(function (r) {
          var ok = m.beans >= r.cost;
          return '<li class="redeem-row' + (ok ? '' : ' is-off') + '"><span class="redeem-name">' + esc(r.name) + '</span><span class="redeem-cost num">' + F.num(r.cost) + ' beans</span>' +
            '<button class="btn btn--sm' + (ok ? '' : ' btn--ghost') + '" type="button" data-act="redeem-now" data-id="' + esc(r.id) + '" data-key="rn-' + esc(r.id) + '"' + (ok ? '' : ' disabled aria-disabled="true"') + '>' + (ok ? 'Redeem' : F.num(r.cost - m.beans) + ' short') + '</button></li>';
        }).join('') + '</ul></div>';
      return out;
    },
    freeHTML: function (m) {
      var per = W.program.stampsForFree, s = Math.min(m.stamps, per);
      return '<div class="free-box">' + cupsHTML(m, 'cups--lg') +
        '<p class="free-line">' + s + ' of ' + per + ' stamps · ' + (per - s) + ' more ' + (per - s === 1 ? 'drink' : 'drinks') + ' until the next free one</p>' +
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
      patch($('#code-list'), ready.length ? '<ul class="code-list" role="list">' + ready.map(function (r) { return codeRow(r); }).join('') + '</ul>' : '<p class="muted code-none">None right now.</p>');
    },
    act: function (el) {
      var c = state.counter, a = el.dataset.act, self = this, m;
      switch (a) {
        case 'clear-member': case 'next-customer':
          c.success = null; location.hash = '#counter';
          setTimeout(function () { var q = $('#ct-q'); if (q) q.focus(); }, 0);
          return true;
        case 'success-done': c.success = null; this.mountBody(); this.renderBody(); var f = $('#v-amount'); if (f) f.focus(); return true;
        case 'mp-tab':
          if (c.tab === el.dataset.tab && !c.success) return true;
          c.tab = el.dataset.tab; c.success = null; this.mountBody(); this.renderMember();
          return true;
        case 'quick-cat': c.cat = el.dataset.cat; this.renderVisitLive(); return true;
        case 'quick':
          var it = W.menuItem(el.dataset.id); if (!it || !it.available) return true;
          c.items.push(it.id); c.amount = String(Math.round((parseMoney(c.amount) + it.price) * 100) / 100);
          if (isDrink(it)) c.drinks += 1;
          $('#v-amount').value = c.amount; setError($('#v-error'), '');
          this.renderVisitLive(); return true;
        case 'unquick':
          var i = c.items.lastIndexOf(el.dataset.id), it2 = W.menuItem(el.dataset.id); if (i < 0) return true;
          c.items.splice(i, 1);
          if (it2) { c.amount = String(Math.max(0, Math.round((parseMoney(c.amount) - it2.price) * 100) / 100)); if (c.amount === '0') c.amount = ''; if (isDrink(it2)) c.drinks = Math.max(0, c.drinks - 1); }
          $('#v-amount').value = c.amount; this.renderVisitLive();
          if (!document.activeElement || document.activeElement === document.body) { var nx = $('#v-order .order-x') || $('#v-amount'); if (nx) nx.focus(); }
          return true;
        case 'clear-order': c.items = []; c.amount = ''; c.drinks = 0; $('#v-amount').value = ''; this.renderVisitLive(); $('#v-amount').focus(); return true;
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
        '<div class="card m-table-wrap"><table class="table m-table"><caption class="visually-hidden">White Rewards members</caption><thead id="m-thead"></thead><tbody id="m-tbody"></tbody></table></div>' +
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
    route: function (id) { if (id) openDrawer(id); else if (drawer) closeDialog(drawer.dlg); },
    act: function (el) {
      var ms = state.members;
      if (el.dataset.act === 'm-tier') { ms.tier = el.dataset.tier; this.update(); return true; }
      if (el.dataset.act === 'm-sort') { var k = el.dataset.sort; if (ms.sort === k) ms.dir = -ms.dir; else { ms.sort = k; ms.dir = SORTS[k].dir; } $('#m-sort').value = k; this.update(); return true; }
      if (el.dataset.act === 'm-clear') { ms.q = ''; ms.tier = 'all'; $('#m-q').value = ''; this.update(); $('#m-q').focus(); return true; }
      return false;
    },
    update: function () {
      var ms = state.members, all = W.members(), s = W.stats(7);
      patch($('#m-desc'), esc(plural(all.length, 'member') + ' · ' + F.num(s.newThisWeek) + ' new this week · ' + F.num(s.outstandingBeans) + ' beans unspent'));
      var counts = { all: all.length }; W.program.tiers.forEach(function (t) { counts[t.id] = 0; });
      all.forEach(function (m) { counts[W.tier(m).id]++; });
      patch($('#m-tiers'), [{ id: 'all', name: 'All' }].concat(W.program.tiers).map(function (t) {
        return '<button type="button" class="seg-btn" data-act="m-tier" data-tier="' + esc(t.id) + '" data-key="mt-' + esc(t.id) + '" aria-pressed="' + (ms.tier === t.id) + '">' + esc(t.name) + ' <span class="seg-n">' + (counts[t.id] || 0) + '</span></button>';
      }).join(''));
      var list = W.findMembers(ms.q).filter(function (m) { return ms.tier === 'all' || W.tier(m).id === ms.tier; });
      var sd = SORTS[ms.sort] || SORTS.lastVisit, dir = ms.dir;
      list.sort(function (a, b) { var x = sd.get(a), y = sd.get(b); return (x < y ? -1 : x > y ? 1 : 0) * dir || a.name.localeCompare(b.name); });
      var cols = [['name', 'Member'], [null, 'Phone'], ['tier', 'Tier'], ['beans', 'Beans', 'r'], ['visits', 'Visits', 'r'], ['lastVisit', 'Last visit']];
      patch($('#m-thead'), '<tr>' + cols.map(function (c) {
        if (!c[0]) return '<th scope="col" class="m-col-phone">' + c[1] + '</th>';
        var on = ms.sort === c[0];
        return '<th scope="col" class="' + (c[2] || '') + '"' + (on ? ' aria-sort="' + (dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" class="th-btn' + (on ? ' is-on' : '') + '" data-act="m-sort" data-sort="' + c[0] + '" data-key="th-' + c[0] + '">' + c[1] + (on ? icon(dir > 0 ? 'chevronUp' : 'chevronDown', 'ic-sm') : '<span class="th-ghost">' + icon('chevronDown', 'ic-sm') + '</span>') + '</button></th>';
      }).join('') + '</tr>');
      patch($('#m-tbody'), list.map(function (m) {
        var t = W.tier(m);
        return '<tr data-id="' + esc(m.id) + '"><td><a class="m-name" href="#members/' + esc(encodeURIComponent(m.id)) + '" data-key="mn-' + esc(m.id) + '">' + avatar(m.name) + '<span><span class="m-name-txt">' + esc(m.name) + '</span><span class="m-sub">' + esc(m.id) + '<span class="m-sub-phone"> · ' + esc(m.phone) + '</span></span></span></a></td>' +
          '<td class="num nowrap m-col-phone">' + esc(m.phone) + '</td><td>' + tierChip(t) + '</td>' +
          '<td class="r num strong">' + F.num(m.beans) + '</td><td class="r num">' + F.num(m.visits) + '</td><td class="nowrap">' + (m.lastVisit ? esc(F.ago(m.lastVisit)) : '<span class="muted">No visits yet</span>') + '</td></tr>';
      }).join(''));
      patch($('#m-cards'), list.map(function (m) {
        var t = W.tier(m);
        return '<li><a class="card m-card" href="#members/' + esc(encodeURIComponent(m.id)) + '" data-key="mc-' + esc(m.id) + '">' +
          '<span class="m-card-top">' + avatar(m.name) + '<span class="m-card-who"><span class="m-name-txt">' + esc(m.name) + '</span><span class="m-sub">' + esc(m.id) + ' · ' + esc(m.phone) + '</span></span>' + tierChip(t) + '</span>' +
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
    if (drawer) closeDialog(drawer.dlg, true);
    var dlg = openDialog({
      cls: 'dlg--drawer', labelledby: 'md-name',
      html: '<div class="drawer">' +
        '<header class="drawer-head"><button class="icon-btn" type="button" data-close aria-label="Close member details">' + icon('x') + '</button><div class="drawer-head-main" id="md-head"></div></header>' +
        '<div class="drawer-body">' +
        '<div class="md-actions" id="md-actions"></div>' +
        '<div class="md-stats" id="md-stats"></div>' +
        '<section class="md-sec" aria-labelledby="md-h-tier"><h3 class="sub-title" id="md-h-tier">Tier</h3><div id="md-tier"></div></section>' +
        '<section class="md-sec" aria-labelledby="md-h-card"><h3 class="sub-title" id="md-h-card">Coffee card</h3><div id="md-card"></div></section>' +
        '<section class="md-sec" aria-labelledby="md-h-prof"><h3 class="sub-title" id="md-h-prof">Profile</h3><form class="md-form" id="md-form" novalidate><div id="md-fields"></div>' +
        '<p class="form-error" id="md-err" role="alert" hidden></p><div class="md-form-actions"><button class="btn btn--ghost" type="button" data-act="md-undo" disabled>Undo changes</button><button class="btn" type="submit" id="md-save" disabled>Save profile</button></div></form></section>' +
        '<section class="md-sec" aria-labelledby="md-h-tl"><h3 class="sub-title" id="md-h-tl">Activity</h3><ol class="tl" id="md-tl" role="list"></ol><div id="md-more"></div></section>' +
        '</div></div>',
      onClose: function () {
        drawer = null;
        var r = parseHash();
        if (r.view === 'members' && r.id) { var back = state.drawerReturn; state.drawerReturn = null; location.hash = back || '#members'; }
      }
    });
    drawer = { dlg: dlg, id: id, dirty: false, limit: 30 };
    var form = $('#md-form', dlg);
    form.addEventListener('input', function () { drawer.dirty = true; $('#md-save', dlg).disabled = false; $('[data-act="md-undo"]', dlg).disabled = false; });
    form.addEventListener('change', function () { drawer.dirty = true; $('#md-save', dlg).disabled = false; $('[data-act="md-undo"]', dlg).disabled = false; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#md-err', dlg); setError(err, '');
      try {
        var name = $('#md-name-i', dlg).value.trim(), phone = $('#md-phone-i', dlg).value.trim();
        if (!name) throw new Error('Please enter a name');
        if (phone.replace(/\D/g, '').length < 7) throw new Error('Enter a phone number with at least 7 digits');
        var digits = phone.replace(/\D/g, ''), dup = W.members().filter(function (x) { return x.id !== drawer.id && x.phone.replace(/\D/g, '') === phonePretty(digits).replace(/\D/g, ''); })[0];
        if (dup) throw new Error('That phone number belongs to ' + dup.name);
        drawer.dirty = false;
        W.updateMember(drawer.id, { name: name, phone: phonePretty(phone), email: $('#md-email-i', dlg).value.trim(), birthday: readBirthday(dlg, 'md'), favourite: $('#md-fav-i', dlg).value, note: $('#md-note-i', dlg).value.trim() });
        toast('Profile saved', { sub: name });
      } catch (ex) { drawer.dirty = true; setError(err, errMsg(ex)); }
    });
    updateDrawer();
  }
  function drawerAct(el) {
    if (!drawer) return;
    var a = el.dataset.act;
    if (a === 'md-undo') { drawer.dirty = false; $('#md-fields', drawer.dlg)._html = null; setError($('#md-err', drawer.dlg), ''); updateDrawer(); }
    if (a === 'md-more') { drawer.limit += 50; updateDrawer(); }
  }
  function updateDrawer() {
    if (!drawer) return;
    var d = drawer.dlg, m = W.member(drawer.id);
    if (!m) { closeDialog(d, true); return; }
    var t = W.tier(m), tp = W.tierProgress(m), per = W.program.stampsForFree;
    patch($('#md-head', d), avatar(m.name, 'avatar--lg') + '<div><h2 class="drawer-title" id="md-name">' + esc(m.name) + '</h2><p class="drawer-sub">' + tierChip(t) + '<span class="muted">' + esc(m.id) + ' · since ' + esc(F.shortDate(m.joined)) + ' ' + W.maleParts(m.joined).y + '</span></p></div>');
    patch($('#md-actions', d),
      '<a class="btn" href="#counter/' + esc(encodeURIComponent(m.id)) + '" data-key="md-visit">' + icon('plus') + 'Add visit</a>' +
      '<button class="btn btn--ghost" type="button" data-act="adjust-dialog" data-id="' + esc(m.id) + '" data-key="md-adj">' + icon('adjust') + 'Adjust beans</button>' +
      '<button class="btn btn--ghost" type="button" data-act="free-drink" data-id="' + esc(m.id) + '" data-key="md-free"' + (m.freeDrinks ? '' : ' disabled') + '>' + icon('cup') + 'Use free drink' + (m.freeDrinks ? ' (' + m.freeDrinks + ')' : '') + '</button>');
    var avg = m.visits ? m.spend / m.visits : 0;
    patch($('#md-stats', d), [
      ['Beans balance', F.num(m.beans), 'big'], ['Lifetime beans', F.num(m.lifetimeBeans)], ['Visits', F.num(m.visits)],
      ['Total spend', F.mvr(m.spend)], ['Average bill', m.visits ? F.mvr(Math.round(avg)) : '—'], ['Last visit', m.lastVisit ? F.ago(m.lastVisit) : 'No visits yet']
    ].map(function (x) { return '<div class="md-stat' + (x[2] ? ' md-stat--' + x[2] : '') + '"><span class="md-stat-l">' + x[0] + '</span><strong class="md-stat-v">' + esc(x[1]) + '</strong></div>'; }).join(''));
    patch($('#md-tier', d), '<div class="tierbar"><div class="tierbar-top"><span>' + tierChip(t) + '</span><span class="muted">' + (tp.next ? F.num(tp.need) + ' lifetime beans to ' + esc(tp.next.name) : 'Top tier') + '</span></div>' +
      '<div class="hbar-track"><i class="hbar-fill" style="width:' + Math.round(tp.pct * 100) + '%"></i></div>' +
      '<ul class="perks" role="list">' + t.perks.map(function (p) { return '<li>' + icon('check', 'ic-sm') + esc(p) + '</li>'; }).join('') + '</ul></div>');
    patch($('#md-card', d), '<div class="md-cardbox">' + cupsHTML(m) + '<p class="muted">' + Math.min(m.stamps, per) + ' of ' + per + ' stamps · ' + (m.freeDrinks ? '<strong class="gold-ink">' + plural(m.freeDrinks, 'free drink') + ' ready</strong>' : 'no free drink waiting') + '</p></div>');
    if (!drawer.dirty) {
      var drinks = W.menu().filter(isDrink).map(function (x) { return x.name; });
      if (m.favourite && drinks.indexOf(m.favourite) < 0) drinks.unshift(m.favourite);
      var changed = patch($('#md-fields', d), '<div class="form-grid">' +
        '<div class="field span-2"><label for="md-name-i">Full name</label><input class="input" id="md-name-i" value="' + esc(m.name) + '" autocomplete="off"></div>' +
        '<div class="field"><label for="md-phone-i">Mobile number</label><input class="input" id="md-phone-i" inputmode="tel" value="' + esc(m.phone) + '" autocomplete="off"></div>' +
        '<div class="field"><label for="md-email-i">Email</label><input class="input" id="md-email-i" type="email" value="' + esc(m.email) + '" autocomplete="off" spellcheck="false"></div>' +
        '<div class="field"><span class="field-label">Birthday</span>' + birthdaySelects('md', m.birthday) + '</div>' +
        '<div class="field"><label for="md-fav-i">Favourite drink</label><select class="select" id="md-fav-i"><option value="">Not set</option>' + drinks.map(function (n) { return '<option' + (n === m.favourite ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field span-2"><label for="md-note-i">Staff note <span class="opt">only staff see this</span></label><textarea class="textarea" id="md-note-i" rows="2" placeholder="e.g. Oat milk, less sugar">' + esc(m.note) + '</textarea></div>' +
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
  var Rewards = {
    mount: function (host) {
      host.innerHTML = '<div class="page">' +
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Rewards</h1><p class="page-desc">What members can spend their beans on. Active rewards show in the White Rewards app, cheapest first.</p></div>' +
        '<div class="page-actions"><button class="btn" type="button" data-act="rw-new">' + icon('plus') + 'Add reward</button></div></header>' +
        '<div class="mini-stats" id="rw-sum"></div>' +
        '<div class="card list-card" id="rw-list"></div></div>';
      var self = this;
      $('#rw-list').addEventListener('submit', function (e) { e.preventDefault(); self.save(e.target); });
      $('#rw-list').addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.rwEdit) { e.preventDefault(); e.stopPropagation(); var id = state.rwEdit; state.rwEdit = null; self.update(); var b = $('[data-key="rwe-' + id + '"]') || $('[data-act="rw-new"]'); if (b) b.focus(); } });
    },
    counts: function () {
      var c = {}; W.redemptions().forEach(function (r) { if (r.status === 'cancelled') return; var k = r.rewardId; c[k] = c[k] || { n: 0, ready: 0 }; c[k].n++; if (r.status === 'ready') c[k].ready++; });
      return c;
    },
    update: function () {
      var all = W.rewards(true), counts = this.counts(), active = all.filter(function (r) { return r.active; }).length, total = 0;
      Object.keys(counts).forEach(function (k) { total += counts[k].n; });
      patch($('#rw-sum'), '<div class="mini-stat"><span>Active rewards</span><strong>' + active + ' <span class="muted">of ' + all.length + '</span></strong></div>' +
        '<div class="mini-stat"><span>Redeemed, all time</span><strong>' + F.num(total) + '</strong></div>' +
        '<div class="mini-stat"><span>Codes waiting</span><strong>' + F.num(W.redemptions('ready').length) + '</strong></div>');
      var ed = state.rwEdit, html = '';
      if (ed === 'new') html += this.editRow({ id: '', name: '', cost: '', kind: 'drink', active: true });
      html += all.map(function (r) {
        if (ed === r.id) return Rewards.editRow(r);
        var c = counts[r.id] || { n: 0, ready: 0 };
        return '<div class="rw-row' + (r.active ? '' : ' is-off') + '">' +
          '<span class="rw-ic">' + icon(r.kind === 'food' ? 'bagel' : 'cup') + '</span>' +
          '<div class="rw-main"><p class="rw-name">' + esc(r.name) + '</p><p class="rw-meta">' + (r.kind === 'food' ? 'Food' : 'Drink') + ' · redeemed ' + (c.n === 1 ? 'once' : F.num(c.n) + ' times') + (c.ready ? ' · <span class="gold-ink">' + c.ready + ' waiting</span>' : '') + '</p></div>' +
          '<p class="rw-cost"><strong class="num">' + F.num(r.cost) + '</strong> beans</p>' +
          '<div class="rw-toggle"><button class="switch" type="button" role="switch" aria-checked="' + r.active + '" data-act="rw-toggle" data-id="' + esc(r.id) + '" data-key="rwt-' + esc(r.id) + '" aria-label="Show ' + esc(r.name) + ' in the app"><i></i></button><span class="switch-state">' + (r.active ? 'Active' : 'Paused') + '</span></div>' +
          '<button class="btn btn--ghost btn--sm rw-edit-btn" type="button" data-act="rw-edit" data-id="' + esc(r.id) + '" data-key="rwe-' + esc(r.id) + '">' + icon('edit') + 'Edit</button></div>';
      }).join('');
      patch($('#rw-list'), html);
    },
    editRow: function (r) {
      var k = r.id || 'new';
      return '<form class="rw-row rw-edit" data-id="' + esc(r.id) + '" novalidate>' +
        '<div class="rw-edit-fields">' +
        '<div class="field rw-f-name"><label for="rw-n-' + k + '">' + (r.id ? 'Reward' : 'New reward') + '</label><input class="input" id="rw-n-' + k + '" value="' + esc(r.name) + '" placeholder="e.g. Any cold brew" autocomplete="off"></div>' +
        '<div class="field rw-f-cost"><label for="rw-c-' + k + '">Cost in beans</label><input class="input" id="rw-c-' + k + '" inputmode="numeric" value="' + esc(r.cost) + '" placeholder="150" autocomplete="off"></div>' +
        '<div class="field rw-f-kind"><label for="rw-k-' + k + '">Type</label><select class="select" id="rw-k-' + k + '"><option value="drink"' + (r.kind !== 'food' ? ' selected' : '') + '>Drink</option><option value="food"' + (r.kind === 'food' ? ' selected' : '') + '>Food</option></select></div>' +
        '</div><p class="form-error" role="alert" hidden></p>' +
        '<div class="rw-edit-actions"><button class="btn btn--ghost" type="button" data-act="rw-cancel">Cancel</button><button class="btn" type="submit">' + (r.id ? 'Save' : 'Add reward') + '</button></div></form>';
    },
    save: function (form) {
      var id = form.dataset.id || '', k = id || 'new', err = $('.form-error', form);
      var cur = id ? W.reward(id) : null;
      try {
        var r = W.saveReward({ id: id || undefined, name: $('#rw-n-' + k, form).value, cost: $('#rw-c-' + k, form).value.replace(/[^\d.]/g, ''), kind: $('#rw-k-' + k, form).value, active: cur ? cur.active : true });
        state.rwEdit = null;
        toast(id ? 'Reward updated' : 'Reward added', { icon: 'gift', sub: r.name + ' · ' + beans(r.cost) + (id ? '' : ' · now showing in the app') });
        this.update();
        var b = $('[data-key="rwe-' + r.id + '"]'); if (b) b.focus();
      } catch (e) { setError(err, errMsg(e)); }
    },
    act: function (el) {
      var a = el.dataset.act, self = this;
      if (a === 'rw-new') { state.rwEdit = 'new'; this.update(); var n = $('#rw-n-new'); if (n) { n.focus(); n.scrollIntoView({ block: 'center', behavior: reduced.matches ? 'auto' : 'smooth' }); } return true; }
      if (a === 'rw-edit') { state.rwEdit = el.dataset.id; this.update(); var f = $('#rw-n-' + el.dataset.id); if (f) { f.focus(); f.select(); } return true; }
      if (a === 'rw-cancel') { var id = state.rwEdit; state.rwEdit = null; this.update(); var b = $('[data-key="rwe-' + id + '"]') || $('[data-act="rw-new"]'); if (b) b.focus(); return true; }
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
        '<header class="page-head"><div class="page-head-txt"><h1 class="page-title" id="page-h1" tabindex="-1">Menu</h1><p class="page-desc">Prices and what\'s available today.</p></div>' +
        '<div class="page-actions"><a class="btn btn--ghost" href="../#menu" target="_blank" rel="noopener">' + icon('eye') + 'View on website' + icon('external', 'ic-sm') + '</a></div></header>' +
        '<p class="note">' + icon('info') + '<span>The website menu reads this list. A new price, or an item marked sold out, shows on the site straight away.</span></p>' +
        '<div class="toolbar toolbar--menu"><div class="search"><label class="visually-hidden" for="mn-q">Search the menu</label>' + icon('search') + '<input class="input" id="mn-q" type="search" placeholder="Search the menu" autocomplete="off" value="' + esc(state.menuQ) + '"></div>' +
        '<div class="jump" id="mn-jump" role="group" aria-label="Jump to a category"></div></div>' +
        '<div class="mn-list" id="mn-list"></div></div>';
      var self = this, list = $('#mn-list');
      $('#mn-q').addEventListener('input', function () { state.menuQ = this.value; self.update(); });
      list.addEventListener('change', function (e) { var inp = e.target.closest('.mn-price-input'); if (inp) self.savePrice(inp); });
      list.addEventListener('keydown', function (e) {
        var inp = e.target.closest('.mn-price-input'); if (!inp) return;
        if (e.key === 'Enter') { e.preventDefault(); self.savePrice(inp); }
        if (e.key === 'Escape') { var it = W.menuItem(inp.dataset.id); if (it) { inp.value = it.price; self.showErr(inp.dataset.id, ''); } }
      });
    },
    showErr: function (id, msg) { var e = $('#mn-err-' + id); if (e) setError(e, msg); var i = $('#mp-' + id); if (i) i.setAttribute('aria-invalid', msg ? 'true' : 'false'); },
    savePrice: function (inp) {
      var it = W.menuItem(inp.dataset.id); if (!it) return;
      var raw = inp.value.trim();
      if (raw === String(it.price)) { this.showErr(it.id, ''); return; }
      try {
        if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('Enter a price in MVR, like 65 or 65.50');
        var old = it.price;
        W.updateMenuItem(it.id, { price: Number(raw) });
        this.showErr(it.id, '');
        toast(it.name + ' is now ' + F.mvr(it.price), { icon: 'menu', sub: 'Was ' + F.mvr(old) + ' · updated on the website' });
      } catch (e) { this.showErr(it.id, errMsg(e)); }
    },
    update: function () {
      var q = state.menuQ.trim().toLowerCase(), cats = W.categories();
      patch($('#mn-jump'), cats.map(function (c) { return '<button type="button" class="cat-tab" data-act="mn-jump" data-cat="' + esc(c.id) + '" data-key="mj-' + esc(c.id) + '">' + esc(c.name) + '</button>'; }).join(''));
      var any = false;
      var html = cats.map(function (c) {
        var items = W.menu(c.id), shown = items.filter(function (it) { return !q || it.name.toLowerCase().indexOf(q) > -1 || (it.desc || '').toLowerCase().indexOf(q) > -1; });
        if (!shown.length) return '';
        any = true;
        var out = items.filter(function (it) { return !it.available; }).length;
        return '<section class="card panel mn-cat" id="mn-' + esc(c.id) + '" aria-labelledby="mn-h-' + esc(c.id) + '"><header class="panel-head"><div><h2 class="panel-title" id="mn-h-' + esc(c.id) + '">' + esc(c.name) + '</h2>' +
          '<p class="panel-sub">' + plural(items.length, 'item') + ' · ' + (out ? '<span class="warn-ink">' + out + ' sold out</span>' : 'all available') + '</p></div></header>' +
          '<ul class="mn-items" role="list">' + shown.map(function (it) {
            return '<li class="mn-item' + (it.available ? '' : ' is-out') + '">' +
              '<div class="mn-main"><p class="mn-name">' + esc(it.name) + (it.signature ? ' <span class="chip">Signature</span>' : '') + '</p><p class="mn-desc">' + esc(it.desc || '') + '</p></div>' +
              '<div class="mn-price"><label class="visually-hidden" for="mp-' + esc(it.id) + '">Price of ' + esc(it.name) + ' in MVR</label><span class="mn-cur" aria-hidden="true">MVR</span>' +
              '<input class="input mn-price-input num" id="mp-' + esc(it.id) + '" data-id="' + esc(it.id) + '" inputmode="decimal" autocomplete="off" value="' + esc(it.price) + '" aria-describedby="mn-err-' + esc(it.id) + '"></div>' +
              '<div class="mn-avail"><button class="switch" type="button" role="switch" aria-checked="' + !!it.available + '" data-act="mn-avail" data-id="' + esc(it.id) + '" data-key="ma-' + esc(it.id) + '" aria-label="' + esc(it.name) + ' available today"><i></i></button><span class="switch-state">' + (it.available ? 'Available' : 'Sold out') + '</span></div>' +
              '<p class="form-error mn-err" id="mn-err-' + esc(it.id) + '" role="alert" hidden></p></li>';
          }).join('') + '</ul></section>';
      }).join('');
      patch($('#mn-list'), any ? html : '<div class="card">' + emptyState('search', 'Nothing on the menu matches “' + state.menuQ + '”', '') + '</div>');
    },
    act: function (el) {
      if (el.dataset.act === 'mn-avail') {
        var it = W.menuItem(el.dataset.id); if (!it) return true;
        try { W.updateMenuItem(it.id, { available: !it.available }); toast(it.available ? it.name + ' is back on' : it.name + ' marked sold out', { icon: 'menu', sub: it.available ? 'Available again on the website and at the counter' : 'Shown as sold out on the website for today' }); }
        catch (e) { toast(errMsg(e), { kind: 'error' }); }
        return true;
      }
      if (el.dataset.act === 'mn-jump') {
        var sec = $('#mn-' + el.dataset.cat);
        if (!sec) { state.menuQ = ''; $('#mn-q').value = ''; this.update(); sec = $('#mn-' + el.dataset.cat); }
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
      $('#of-list').addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.ofEdit) { e.preventDefault(); var id = state.ofEdit; state.ofEdit = null; self.update(); var b = $('[data-key="ofe-' + id + '"]') || $('[data-act="of-new"]'); if (b) b.focus(); } });
    },
    update: function () {
      var all = W.offers(true), ed = state.ofEdit, html = '';
      if (ed === 'new') html += this.editCard({ id: '', title: '', body: '' });
      html += all.map(function (o) {
        if (ed === o.id) return Offers.editCard(o);
        return '<article class="card of-card' + (o.active ? '' : ' is-off') + '">' +
          '<div class="of-main"><span class="of-ic">' + icon('tag') + '</span><div><h2 class="of-title">' + esc(o.title) + '</h2><p class="of-body">' + esc(o.body || '') + '</p></div></div>' +
          '<div class="of-foot"><div class="rw-toggle"><button class="switch" type="button" role="switch" aria-checked="' + o.active + '" data-act="of-toggle" data-id="' + esc(o.id) + '" data-key="oft-' + esc(o.id) + '" aria-label="Show ' + esc(o.title) + ' to members"><i></i></button><span class="switch-state">' + (o.active ? 'Showing to members' : 'Hidden') + '</span></div>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-act="of-edit" data-id="' + esc(o.id) + '" data-key="ofe-' + esc(o.id) + '">' + icon('edit') + 'Edit</button></div></article>';
      }).join('');
      patch($('#of-list'), html || '<div class="card">' + emptyState('tag', 'No offers yet', 'Add one to show it on every member\'s card.') + '</div>');
    },
    editCard: function (o) {
      var k = o.id || 'new';
      return '<form class="card of-card of-edit" data-id="' + esc(o.id) + '" novalidate>' +
        '<div class="field"><label for="of-t-' + k + '">' + (o.id ? 'Title' : 'New offer title') + '</label><input class="input" id="of-t-' + k + '" value="' + esc(o.title) + '" maxlength="60" placeholder="e.g. Free cookie with any latte" autocomplete="off"></div>' +
        '<div class="field"><label for="of-b-' + k + '">Details</label><textarea class="textarea" id="of-b-' + k + '" rows="3" maxlength="180" placeholder="One or two short sentences members will see.">' + esc(o.body) + '</textarea></div>' +
        '<p class="form-error" role="alert" hidden></p>' +
        '<div class="rw-edit-actions"><button class="btn btn--ghost" type="button" data-act="of-cancel">Cancel</button><button class="btn" type="submit">' + (o.id ? 'Save' : 'Add offer') + '</button></div></form>';
    },
    save: function (form) {
      var id = form.dataset.id || '', k = id || 'new', err = $('.form-error', form);
      var cur = id ? W.offers(true).filter(function (x) { return x.id === id; })[0] : null;
      try {
        var o = W.saveOffer({ id: id || undefined, title: $('#of-t-' + k, form).value, body: $('#of-b-' + k, form).value.trim(), active: cur ? cur.active : true });
        state.ofEdit = null;
        toast(id ? 'Offer updated' : 'Offer added', { icon: 'tag', sub: o.active ? 'Showing in the White Rewards app' : 'Hidden until you turn it on' });
        this.update();
        var b = $('[data-key="ofe-' + o.id + '"]'); if (b) b.focus();
      } catch (e) { setError(err, errMsg(e)); }
    },
    act: function (el) {
      var a = el.dataset.act;
      if (a === 'of-new') { state.ofEdit = 'new'; this.update(); var n = $('#of-t-new'); if (n) n.focus(); return true; }
      if (a === 'of-edit') { state.ofEdit = el.dataset.id; this.update(); var f = $('#of-t-' + el.dataset.id); if (f) f.focus(); return true; }
      if (a === 'of-cancel') { var id = state.ofEdit; state.ofEdit = null; this.update(); var b = $('[data-key="ofe-' + id + '"]') || $('[data-act="of-new"]'); if (b) b.focus(); return true; }
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
        '<form class="card panel set-form" id="set-form" novalidate aria-label="White Rewards rules"><div id="set-fields"></div></form>' +
        '<aside class="card panel set-aside" aria-labelledby="h-pv">' +
        '<h2 class="panel-title" id="h-pv">What members get</h2>' +
        '<div class="field set-bill"><label for="set-bill">Example bill</label><div class="money money--sm"><span aria-hidden="true">MVR</span><input class="input" id="set-bill" inputmode="decimal" value="120" autocomplete="off"></div></div>' +
        '<div class="set-pv" id="set-pv" aria-live="polite"></div>' +
        '<p class="form-error" id="set-err" role="alert" hidden></p>' +
        '<div class="form-actions"><button class="btn btn--ghost" type="button" data-act="set-undo" disabled>Undo changes</button><button class="btn" type="submit" form="set-form" id="set-save" disabled>Save rules</button></div>' +
        '<p class="hint set-saved" id="set-state" aria-live="polite"></p></aside>' +
        '<section class="card panel set-sec set-shift" aria-labelledby="h-sess"><header class="panel-head"><div><h2 class="panel-title" id="h-sess">Your shift</h2><p class="panel-sub" id="set-staff"></p></div><button class="btn btn--ghost btn--sm" type="button" data-act="signout">' + icon('logout') + 'Sign out</button></header></section>' +
        '<section class="card panel set-sec set-danger" aria-labelledby="h-demo"><header class="panel-head"><div><h2 class="panel-title" id="h-demo">Demo data</h2>' +
        '<p class="panel-sub">This mockup keeps everything in this browser. Resetting puts back the original members, history, menu, rewards and rules — in every open tab.</p></div></header>' +
        '<button class="btn btn--danger-ghost" type="button" data-act="reset">' + icon('undo') + 'Reset demo data</button></section>' +
        '</div></div>';
      var self = this, form = $('#set-form');
      form.addEventListener('input', function () { self.dirty = true; $('#set-save').disabled = false; $('[data-act="set-undo"]').disabled = false; self.preview(); });
      form.addEventListener('submit', function (e) { e.preventDefault(); self.save(); });
      $('#set-bill').addEventListener('input', function () { self.preview(); });
    },
    read: function () {
      var g = function (id) { return $('#' + id).value.trim(); };
      return {
        mvrPerBean: g('s-mvr'), welcomeBonus: g('s-welcome'), birthdayBonus: g('s-bday'), referralBonus: g('s-ref'), stampsForFree: g('s-stamps'),
        tiers: W.program.tiers.map(function (t, i) { return { id: t.id, min: i === 0 ? 0 : g('s-min-' + t.id), mult: g('s-mult-' + t.id) }; })
      };
    },
    validate: function (v) {
      function num(x, label, min) { var n = Number(x); if (x === '' || !isFinite(n)) throw new Error(label + ' must be a number'); if (n < min) throw new Error(label + ' must be ' + min + ' or more'); return n; }
      num(v.mvrPerBean, 'MVR per bean', 0.01); num(v.welcomeBonus, 'Welcome bonus', 0); num(v.birthdayBonus, 'Birthday bonus', 0); num(v.referralBonus, 'Referral bonus', 0); num(v.stampsForFree, 'Stamps for a free drink', 2);
      var prev = -1;
      v.tiers.forEach(function (t, i) {
        var name = W.program.tiers[i].name, min = i === 0 ? 0 : num(t.min, name + ' threshold', 1);
        num(t.mult, name + ' multiplier', 1);
        if (min <= prev) throw new Error(name + ' must start above ' + W.program.tiers[i - 1].name + ' (' + F.num(prev) + ' beans)');
        prev = min;
      });
    },
    update: function () {
      var p = W.program;
      patch($('#set-staff'), 'Signed in as <strong>' + esc(W.currentStaff()) + '</strong>. Visits and rewards you serve are recorded under your name.');
      if (!this.dirty) {
        // unit: [text, 'pre'|'suf'] — shown inside the field so a bare number always reads plainly.
        var f = function (id, label, val, hint, unit, mode) {
          return '<div class="field"><label for="' + id + '">' + label + '</label><div class="unit-input unit-input--' + unit[1] + '"><input class="input" id="' + id + '" inputmode="' + (mode || 'numeric') + '" value="' + esc(val) + '" autocomplete="off" aria-describedby="' + id + '-h"><span aria-hidden="true">' + unit[0] + '</span></div><p class="hint" id="' + id + '-h">' + hint + '</p></div>';
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
              '<span role="cell">' + (i === 0 ? '<span class="fixed num">0</span><span class="hint">Everyone starts here</span>' : '<label class="visually-hidden" for="s-min-' + t.id + '">' + esc(t.name) + ' from lifetime beans</label><input class="input" id="s-min-' + t.id + '" inputmode="numeric" value="' + t.min + '" autocomplete="off">') + '</span>' +
              '<span role="cell"><label class="visually-hidden" for="s-mult-' + t.id + '">' + esc(t.name) + ' beans multiplier</label><div class="unit-input unit-input--suf"><input class="input" id="s-mult-' + t.id + '" inputmode="decimal" value="' + t.mult + '" autocomplete="off"><span aria-hidden="true">×</span></div></span></div>';
          }).join('') + '</div>');
        if (changed) { $('#set-save').disabled = true; $('[data-act="set-undo"]').disabled = true; }
      }
      this.preview();
    },
    preview: function () {
      var v = this.read(), bill = parseMoney($('#set-bill').value), err = '';
      try { this.validate(v); } catch (e) { err = errMsg(e); }
      var st = $('#set-state'); if (st) st.textContent = this.dirty ? 'Unsaved changes. The preview shows them; members get them once you save.' : 'These are the rules in use now.';
      if (err) { patch($('#set-pv'), '<p class="pv-main is-bad">' + esc(err) + '</p>'); return; }
      // Mirrors the store's earn formula for unsaved values (see store_requests: WCH.previewBill).
      var tiers = W.program.tiers.map(function (t, i) { return { name: t.name, beans: Math.round(Math.floor(bill / Number(v.mvrPerBean)) * Number(v.tiers[i].mult)) }; });
      var list = tiers.map(function (t, i) { return '<strong>' + F.num(t.beans) + (i === 0 ? ' ' + (t.beans === 1 ? 'bean' : 'beans') : '') + '</strong> for ' + esc(t.name); });
      var sentence = list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0];
      patch($('#set-pv'), '<p class="pv-main">A ' + esc(F.mvr(bill)) + ' bill earns ' + sentence + '.</p>' +
        '<p class="pv-sub">New members start with ' + beans(Number(v.welcomeBonus)) + '. Every ' + ordinal(Number(v.stampsForFree)) + ' handcrafted drink is free. ' +
        W.program.tiers.slice(1).map(function (t, i) { return esc(t.name) + ' from ' + F.num(Number(v.tiers[i + 1].min)) + ' lifetime beans'; }).join(', ') + '.</p>');
    },
    save: function () {
      var v = this.read(), err = $('#set-err');
      setError(err, '');
      try {
        this.validate(v);
        this.dirty = false;
        W.updateProgram({ mvrPerBean: Number(v.mvrPerBean), welcomeBonus: Number(v.welcomeBonus), birthdayBonus: Number(v.birthdayBonus), referralBonus: Number(v.referralBonus), stampsForFree: Number(v.stampsForFree), tiers: v.tiers.map(function (t) { return { id: t.id, min: Number(t.min), mult: Number(t.mult) }; }) });
        toast('Programme rules saved', { icon: 'settings', sub: 'They apply from the next visit' });
        $('#set-save').disabled = true; $('[data-act="set-undo"]').disabled = true; this.preview();
      } catch (e) { this.dirty = true; setError(err, errMsg(e)); }
    },
    act: function (el) {
      if (el.dataset.act === 'set-undo') { this.dirty = false; $('#set-fields')._html = null; setError($('#set-err'), ''); this.update(); return true; }
      if (el.dataset.act === 'reset') {
        confirmBox({ title: 'Reset all demo data?', body: 'Members, visits, codes, menu prices, rewards, offers and rules go back to the original demo. Anything added today is removed — in every open tab.', ok: 'Reset demo data', danger: true }).then(function (ok) {
          if (!ok) return;
          var me = W.currentStaff();
          W.reset();
          state.seededAt = W.doc.seededAt;
          resetLocalState(); markSeen();
          Settings.dirty = false;
          if (me) W.signInStaff(me);
          toast('Demo data reset', { icon: 'undo', sub: 'Everything is back to the original demo' });
        });
        return true;
      }
      return false;
    }
  };

  var VIEWS = { dashboard: Dash, counter: Counter, members: Members, rewards: Rewards, menu: Menu, offers: Offers, settings: Settings };

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  buildShell();
  bindSignin();
  state.staffName = W.currentStaff();
  markSeen();
  window.addEventListener('hashchange', route);
  route();
  booted = true;
})();
