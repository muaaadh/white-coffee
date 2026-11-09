/* ==========================================================================
   White Coffee House — website one-pager (index.html), v2
   - header: solid after 24px, hides on scroll down / returns on scroll up
     (html.hdr-hidden lets the sticky menu bar follow it), active-section
     highlight, mobile sheet with focus trap + Escape
   - live data from window.WCH (store.js): the printed menu (Food / Drinks
     tabs, category bar with scroll-spy, photo spreads), house specials,
     karaoke rooms with tonight's next free slot, White Rewards numbers,
     tiers and rewards, hours, open / closed. Re-renders on WCH.subscribe,
     so admin-portal edits (prices, sold out, rooms) appear here live.
   - motion: ONE rAF scroll driver (scrollY read once per frame; layout is
     measured on resize only), IntersectionObserver reveals, image parallax,
     word-fill scrub
   - prefers-reduced-motion: everything visible, nothing moves
   The hero (hero.js/hero.css) and the bean emblem (beans.js) are separate.
   Every block is guarded, so a page that reuses the header (karaoke/) can
   load this file without the homepage sections.
   ========================================================================== */
(() => {
  'use strict';

  const W = window.WCH || null;
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const andList = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };

  /* ====================================================================== */
  /* Scroll driver: one rAF loop, on demand                                 */
  /* ====================================================================== */
  const tasks = [];               // { measure?(), update(y, vh, dt) -> wantsAnotherFrame }
  let vh = window.innerHeight;
  let framePending = false, measurePending = true, lastT = 0;

  function kick() { if (!framePending) { framePending = true; requestAnimationFrame(frame); } }
  function scheduleMeasure() { measurePending = true; kick(); }
  function frame(t) {
    framePending = false;
    if (measurePending) { measurePending = false; vh = window.innerHeight; for (const task of tasks) if (task.measure) safe(() => task.measure()); }
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
    const y = window.scrollY;                       // the one scroll read per frame
    let more = false;
    for (const task of tasks) { try { if (task.update(y, vh, dt)) more = true; } catch (e) { console.error(e); } }
    if (more) { lastT = t; kick(); } else lastT = 0;
  }
  /** Document offset that ignores CSS transforms (so reveals/parallax never skew it). */
  function docTop(el) { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', scheduleMeasure);
  window.addEventListener('load', scheduleMeasure);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleMeasure).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure);

  /* ====================================================================== */
  /* Header                                                                 */
  /* ====================================================================== */
  const header = $('#site-header');
  const toggle = $('#menu-btn');
  const sheet = $('#menu-sheet');
  const navLinks = $$('[data-nav]');
  const SECTIONS = ['menu', 'karaoke', 'rewards', 'visit'];
  let menuOpen = false;
  let headerHidden = false;
  let headerH = header ? header.offsetHeight : 0;

  function setHidden(h) {
    if (h === headerHidden) return;
    headerHidden = h;
    if (header) header.classList.toggle('is-hidden', h);
    root.classList.toggle('hdr-hidden', h);
  }

  if (header) {
    let ranges = [], docH = 0, lastY = window.scrollY, solid = null, active;
    tasks.push({
      measure() {
        headerH = header.offsetHeight;
        ranges = SECTIONS.map((id) => {
          const el = document.getElementById(id);
          if (!el) return { id, top: Infinity, bottom: -Infinity };
          const top = docTop(el);
          return { id, top, bottom: top + el.offsetHeight };
        });
        docH = root.scrollHeight;
      },
      update(y, h) {
        const s = y > 24;
        if (s !== solid) { solid = s; header.classList.toggle('is-solid', s); }

        const dy = y - lastY;
        lastY = y;
        if (REDUCED || menuOpen || header.contains(document.activeElement) || y < h * 0.4) setHidden(false);
        else if (dy > 3) setHidden(true);
        else if (dy < -3) setHidden(false);

        const line = y + h * 0.38;
        let cur = null;
        for (const r of ranges) if (line >= r.top && line < r.bottom) cur = r.id;
        const last = ranges[ranges.length - 1];
        if (last && last.bottom > -Infinity && y + h >= docH - 2) cur = last.id;
        if (cur !== active) {
          active = cur;
          for (const a of navLinks) {
            const on = a.dataset.nav === cur;
            a.classList.toggle('is-active', on);
            if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
          }
        }
        return false;
      }
    });
    header.addEventListener('focusin', () => setHidden(false));
  }

  /* ---------------- mobile sheet ---------------- */
  const outside = [$('#main'), $('.footer'), $('.skip-link')].filter(Boolean);

  function syncToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(menuOpen));
    toggle.setAttribute('aria-label', menuOpen ? 'Close navigation' : 'Open navigation');
  }
  function setMenu(open, returnFocus) {
    if (!sheet || !toggle) return;
    const changed = open !== menuOpen;
    menuOpen = open;
    syncToggle();
    if (!changed) return;
    header.classList.toggle('is-open', open);
    sheet.classList.toggle('is-open', open);
    root.classList.toggle('menu-locked', open);
    for (const el of outside) el.inert = open;
    if (open) {
      setHidden(false);
      const first = $('.sheet__link', sheet);
      if (first) requestAnimationFrame(() => first.focus({ preventScroll: true }));
    } else if (returnFocus) {
      toggle.focus({ preventScroll: true });
    }
  }
  function trapList() {
    return [...$$('a[href], button:not([disabled])', header), ...$$('a[href], button:not([disabled])', sheet)]
      .filter((el) => el.getClientRects().length > 0);
  }

  // Capture phase on document: our handler runs before any handler bound on the
  // toggle or the nav itself, and stops them, so the header has exactly one owner.
  document.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.closest('[data-menu-btn]')) { e.stopPropagation(); setMenu(!menuOpen); return; }
    if (t.closest('#site-nav')) { e.stopPropagation(); return; }
    if (sheet && t.closest('#menu-sheet a')) setMenu(false);        // close before the jump happens
  }, true);

  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setMenu(false, true); return; }
    if (e.key !== 'Tab') return;
    const list = trapList();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); list[list.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === list.length - 1)) { e.preventDefault(); list[0].focus(); }
  }, true);

  matchMedia('(min-width: 821px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); else syncToggle(); });
  syncToggle();

  /* ====================================================================== */
  /* Reveals (IntersectionObserver). Re-entrant: rendered blocks call it.   */
  /* ====================================================================== */
  const revealIO = (REDUCED || !('IntersectionObserver' in window)) ? null : new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      if (en.intersectionRatio >= 0.12 || en.intersectionRect.height >= window.innerHeight * 0.3) {
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      }
    }
  }, { threshold: [0, 0.12, 0.3], rootMargin: '0px 0px -8% 0px' });

  function observeReveals(scope) {
    for (const g of $$('[data-reveal]', scope || document)) {
      if (g.dataset.revealBound) continue;
      g.dataset.revealBound = '1';
      let i = 0;
      for (const el of $$('.mask__in, .rv', g)) el.style.setProperty('--i', i++);
      if (revealIO) revealIO.observe(g); else g.classList.add('is-in');
    }
  }

  /* ====================================================================== */
  /* Intro: scroll-scrubbed word fill                                       */
  /* ====================================================================== */
  const statement = $('[data-wordfill]');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map((w) => '<span class="wf">' + esc(w) + '</span>').join(' ');
    const spans = $$('.wf', statement);
    if (REDUCED) spans.forEach((s) => s.classList.add('is-lit'));
    else {
      statement.classList.add('is-ready');
      let top = 0, h = 0, lit = -1;
      tasks.push({
        measure() { top = docTop(statement); h = statement.offsetHeight; },
        update(y, vh) {
          // starts as the line rises past 80% of the viewport, done once its last line passes 45%
          const start = top - vh * 0.8, end = top + h - vh * 0.45;
          const p = clamp((y - start) / Math.max(1, end - start), 0, 1);
          const n = Math.round(p * spans.length);
          if (n !== lit) { lit = n; spans.forEach((s, i) => s.classList.toggle('is-lit', i < n)); }
          return false;
        }
      });
    }
  }

  /* ====================================================================== */
  /* Parallax (inner wrapper only; the frame clips it)                      */
  /* ====================================================================== */
  if (!REDUCED) {
    let items = [];
    const AMP = 24;
    tasks.push({
      measure() {
        items = $$('[data-parallax]').map((el) => {
          const f = el.parentElement;
          return { el, top: docTop(f), h: f.offsetHeight, last: null };
        }).filter((p) => p.h > 0);
      },
      update(y, vh) {
        for (const p of items) {
          if (p.top > y + vh + 80 || p.top + p.h < y - 80) continue;
          const k = clamp((y + vh - p.top) / (vh + p.h), 0, 1);
          const ty = Math.round((k - 0.5) * 2 * AMP * 10) / 10;
          if (ty !== p.last) { p.last = ty; p.el.style.transform = 'translate3d(0,' + ty + 'px,0)'; }
        }
        return false;
      }
    });
  }

  /* ====================================================================== */
  /* Live data                                                              */
  /* ====================================================================== */
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const NUM_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  const span = (a, b) => W.fmtClock(a) + ' to ' + W.fmtClock(b);       // '4 PM to midnight'

  /* ---------------- open / closed + hours ---------------- */
  let shownDay = -1;
  function renderStatus() {
    const s = W.openStatus();
    for (const el of $$('[data-open-status]')) {
      el.classList.toggle('is-open', !!s.open);
      el.classList.toggle('is-closed', !s.open);
      const txt = $('[data-status-text]', el);
      if (txt) txt.textContent = s.label + (s.detail ? ', ' + s.detail : '');
    }
  }
  function renderHours(force) {
    const body = $('[data-hours]');
    if (!body) return;
    const today = W.maleParts().day;
    if (!force && today === shownDay) return;
    shownDay = today;
    const byDay = {};
    for (const h of W.info.hours) byDay[h.day] = h;
    let html = '';
    for (let d = 0; d < 7; d++) {
      const h = byDay[d], isToday = d === today;
      html += '<tr' + (isToday ? ' class="is-today"' : '') + '>' +
        '<th scope="row">' + DAYS[d] + (isToday ? '<span class="hours__today">Today</span>' : '') + '</th>' +
        '<td>' + (h ? span(h.open, h.close) : 'Closed') + '</td></tr>';
    }
    body.innerHTML = html;
    const note = $('[data-hours-note]');
    if (note) note.textContent = (W.info.hoursNote ? W.info.hoursNote + ', ' : '') + 'Malé time';
  }
  function bindInfo() {
    for (const el of $$('[data-info]')) { const v = W.info[el.dataset.info]; if (v) el.textContent = v; }
    for (const el of $$('[data-info-href]')) { const v = W.info[el.dataset.infoHref]; if (v) el.setAttribute('href', v); }
  }

  /* ---------------- house specials (labels on the photo) ---------------- */
  function renderSpecials() {
    const box = $('[data-specials]');
    if (!box) return;
    const shown = [];
    for (const li of $$('[data-item]', box)) {
      const m = W.menuItem(li.dataset.item);
      li.hidden = !m;
      if (!m) continue;
      const out = m.available === false;
      li.classList.toggle('is-out', out);
      $('[data-f="name"]', li).textContent = m.name;
      $('[data-f="price"]', li).innerHTML = (out ? '<span class="visually-hidden">Sold out today, </span>' : '') + 'MVR ' + esc(num(m.price));
      let note = $('.stag__out', li);
      if (out && !note) { note = document.createElement('span'); note.className = 'stag__out'; note.setAttribute('aria-hidden', 'true'); note.textContent = 'Sold out today'; li.appendChild(note); }
      if (!out && note) note.remove();
      shown.push(m);
    }
    const priceEl = $('[data-specials-price]');
    if (priceEl && shown.length) {
      const prices = [...new Set(shown.map((m) => m.price))];
      priceEl.textContent = prices.length === 1 ? 'MVR ' + num(prices[0]) + (shown.length > 1 ? ' each' : '') : andList(shown.map((m) => 'MVR ' + num(m.price)));
    }
  }

  /* ---------------- menu ---------------- */
  const menuBook = $('[data-menu]');
  const mbar = $('[data-mbar]');
  const tabs = $$('[data-menu-tabs] [role="tab"]');
  const GROUPS = tabs.map((t) => t.dataset.group);
  // The House specials section above already shows this photo big.
  const FEATURED_PHOTOS = new Set($('[data-specials]') ? ['fried-noodles-rice'] : []);
  const PHOTO_ALT = {
    'breakfast-spread': "A Maldivian breakfast of mas'huni with roshi, a grilled breakfast platter and a bowl of chicken and mushroom soup, on white plates with gold rims",
    'fried-noodles-rice': 'Special fried noodles and special fried rice topped with a fried egg, with gold cutlery',
    'wraps-sandwiches': 'Chicken wraps with fries, and a sandwich platter of triangle sandwiches with fries and salad',
    'fries-rings-salad': 'French fries and onion rings with dips, and a tuna and egg salad',
    'cookies-brownie': 'Chocolate chip cookies, and chocolate brownies with strawberries and blueberries',
    'milkshake-juice': 'A passionfruit juice with lime and mint, next to a chocolate milkshake'
  };
  let activeGroup = GROUPS[0] || 'food';
  let menuSig = '';
  let spyActive;
  let spyHold = null;
  const catSigs = {};

  const groupOf = (c) => c.group || 'food';
  function itemHTML(m) {
    const out = m.available === false;
    return '<li class="mi' + (out ? ' is-out' : '') + '" data-item="' + esc(m.id) + '">' +
      '<span class="mi__name">' + esc(m.name) + '</span>' +
      '<span class="mi__price"><span class="visually-hidden">' + (out ? 'Sold out today, ' : '') + 'MVR </span>' + esc(num(m.price)) + '</span>' +
      (m.desc ? '<span class="mi__desc">' + esc(m.desc) + '</span>' : '') +
      (out ? '<span class="mi__out" aria-hidden="true">Sold out today</span>' : '') +
      '</li>';
  }
  function catItemsSig(id) { return W.menu(id).map((m) => [m.name, m.price, m.available !== false, m.desc].join('~')).join('|'); }
  function catHTML(c) {
    const id = esc(c.id);
    catSigs[c.id] = catItemsSig(c.id);
    return '<section class="mcat" id="cat-' + id + '" aria-labelledby="cat-' + id + '-h" data-cat="' + id + '">' +
      '<h3 class="mcat__title" id="cat-' + id + '-h">' + esc(c.name) + '</h3>' +
      '<ul class="mcat__items" role="list" data-cat-items="' + id + '">' + W.menu(c.id).map(itemHTML).join('') + '</ul>' +
      '</section>';
  }
  /** Consecutive categories that share a photo become one photo spread (the way the printed menu pairs a photo page
      with a list page); the rest are set as text spreads in two columns. */
  function spreadsFor(group) {
    const used = new Set(FEATURED_PHOTOS), blocks = [];
    let cur = null;
    for (const c of W.categories().filter((x) => groupOf(x) === group)) {
      if (c.photo && !used.has(c.photo)) { used.add(c.photo); cur = { photo: c.photo, cats: [c] }; blocks.push(cur); }
      else if (c.photo && cur && cur.photo === c.photo) cur.cats.push(c);
      else { if (!cur || cur.photo) { cur = { photo: null, cats: [] }; blocks.push(cur); } cur.cats.push(c); }
    }
    return blocks;
  }
  function pictured(b) {
    const ids = b.cats.map((c) => c.id);
    return W.menu().filter((m) => m.photo === b.photo && ids.indexOf(m.cat) >= 0).map((m) => m.name);
  }
  function spreadHTML(b, flip) {
    if (!b.photo) {
      return '<div class="spread spread--text' + (b.cats.length === 1 ? ' spread--single' : '') + '" data-reveal>' +
        '<div class="spread__cols rv">' + b.cats.map(catHTML).join('') + '</div></div>';
    }
    const src = 'assets/img/menu/' + b.photo;
    const names = pictured(b);
    return '<div class="spread spread--photo' + (flip ? ' spread--flip' : '') + '" data-reveal>' +
      '<figure class="spread__photo rv"><span class="ph ph--menu"><span class="ph__in">' +
        '<img src="' + src + '-800.webp" srcset="' + src + '-800.webp 800w, ' + src + '-1086.webp 1086w" sizes="(min-width: 900px) 470px, 100vw" width="1086" height="1448" alt="' + esc(PHOTO_ALT[b.photo] || '') + '" loading="lazy" decoding="async">' +
      '</span></span>' +
      (names.length ? '<figcaption class="spread__cap" data-cap="' + esc(b.photo) + '">Pictured: ' + esc(andList(names)) + '</figcaption>' : '') +
      '</figure>' +
      '<div class="spread__list rv">' + b.cats.map(catHTML).join('') + '</div>' +
      '</div>';
  }
  function structureSig() {
    return W.categories().map((c) => [c.id, c.name, groupOf(c), c.photo || '', W.menu(c.id).map((m) => m.id).join(',')].join(':')).join('|');
  }
  function buildMenu() {
    for (const g of GROUPS) {
      const panel = $('[data-menu-panel="' + g + '"]');
      const nav = $('[data-menu-cats="' + g + '"]');
      if (!panel || !nav) continue;
      let flip = false;
      panel.innerHTML = spreadsFor(g).map((b) => { const h = spreadHTML(b, b.photo ? flip : false); if (b.photo) flip = !flip; return h; }).join('') +
        '<p class="mnote" data-price-note>' + esc(W.info.priceNote) + '</p>';
      nav.innerHTML = W.categories().filter((c) => groupOf(c) === g)
        .map((c) => '<a class="mcat-link" href="#cat-' + esc(c.id) + '" data-cat-link="' + esc(c.id) + '">' + esc(c.name) + '</a>').join('');
    }
    observeReveals(menuBook);
    spyActive = undefined;
  }
  function renderMenu() {
    if (!menuBook || !GROUPS.length) return;
    const sig = structureSig();
    if (sig !== menuSig) { menuSig = sig; buildMenu(); return; }
    // same structure: patch only the lists (and photo captions) that changed
    for (const c of W.categories()) {
      const s = catItemsSig(c.id);
      if (catSigs[c.id] === s) continue;
      catSigs[c.id] = s;
      const list = $('[data-cat-items="' + c.id + '"]', menuBook);
      if (list) list.innerHTML = W.menu(c.id).map(itemHTML).join('');
    }
    for (const g of GROUPS) for (const b of spreadsFor(g)) {
      if (!b.photo) continue;
      const cap = $('[data-cap="' + b.photo + '"]', menuBook);
      const names = pictured(b);
      if (cap && names.length) cap.textContent = 'Pictured: ' + andList(names);
    }
    for (const n of $$('[data-price-note]', menuBook)) n.textContent = W.info.priceNote;
  }

  /* tabs: Food / Drinks (automatic activation, roving tabindex) */
  function selectGroup(g, opts) {
    opts = opts || {};
    if (GROUPS.indexOf(g) < 0) return;
    activeGroup = g;
    for (const t of tabs) {
      const on = t.dataset.group === g;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && opts.focus) t.focus();
    }
    for (const p of $$('[data-menu-panel]')) p.hidden = p.dataset.menuPanel !== g;
    for (const n of $$('[data-menu-cats]')) n.hidden = n.dataset.menuCats !== g;
    spyActive = undefined;
    spyHold = null;
    if (opts.scroll && menuBook) {
      // when the bar is stuck deep inside the other list, bring the new list's first page into view
      const target = docTop(menuBook) - headerH;
      if (window.scrollY > target + 2) window.scrollTo({ top: target, behavior: REDUCED ? 'auto' : 'smooth' });
    }
    scheduleMeasure();
  }
  if (tabs.length) {
    const tablist = $('[data-menu-tabs]');
    tablist.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) selectGroup(t.dataset.group, { scroll: true }); });
    tablist.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      selectGroup(tabs[j].dataset.group, { focus: true });
    });
  }

  /* category bar: scroll-spy + keep the active link in view (horizontally only) */
  function revealLink(link) {
    const box = link.parentElement;
    if (!box || box.scrollWidth <= box.clientWidth + 1) return;
    const left = link.offsetLeft - box.offsetLeft, right = left + link.offsetWidth;
    const pad = 24;
    if (left < box.scrollLeft + pad) box.scrollTo({ left: Math.max(0, left - pad), behavior: REDUCED ? 'auto' : 'smooth' });
    else if (right > box.scrollLeft + box.clientWidth - pad) box.scrollTo({ left: right - box.clientWidth + pad, behavior: REDUCED ? 'auto' : 'smooth' });
  }
  function setSpy(id) {
    if (id === spyActive) return;
    spyActive = id;
    const nav = $('[data-menu-cats="' + activeGroup + '"]');
    if (!nav) return;
    for (const a of $$('.mcat-link', nav)) {
      const on = a.dataset.catLink === id;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'true'); revealLink(a); } else a.removeAttribute('aria-current');
    }
    if (!id && nav.scrollLeft) nav.scrollTo({ left: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  }
  if (menuBook && GROUPS.length) {
    let marks = [], bookBottom = 0, barH = 0;
    tasks.push({
      measure() {
        barH = mbar ? mbar.offsetHeight : 0;
        bookBottom = docTop(menuBook) + menuBook.offsetHeight;
        marks = [];
        const panel = $('[data-menu-panel="' + activeGroup + '"]');
        if (!panel) return;
        const sy = window.scrollY;
        for (const spread of $$('.spread', panel)) {
          const cats = $$('.mcat', spread);
          const cols = $('.spread__cols', spread);
          // in a two-column text spread the second column starts level with the first: place each category's mark
          // at its share of the reading order (column one top to bottom, then column two), weighted by its height
          const columned = cols && cats.length > 1 && parseInt(getComputedStyle(cols).columnCount, 10) > 1;
          const sTop = spread.getBoundingClientRect().top + sy, sH = spread.offsetHeight;
          const hs = cats.map((el) => el.offsetHeight), total = hs.reduce((a, b) => a + b, 0) || 1;
          let acc = 0;
          cats.forEach((el, i) => { marks.push({ id: el.dataset.cat, top: columned ? sTop + (sH * acc) / total : el.getBoundingClientRect().top + sy }); acc += hs[i]; });
        }
      },
      update(y) {
        if (!marks.length) return false;
        if (spyHold) { setSpy(spyHold); return false; }
        const line = y + (headerHidden ? 0 : headerH) + barH + 56;
        let cur = null;
        if (y < bookBottom) for (const m of marks) if (m.top <= line) cur = m.id;
        setSpy(cur);
        return false;
      }
    });
    // a clicked category stays lit until the visitor scrolls by hand
    menuBook.addEventListener('click', (e) => {
      const a = e.target instanceof Element ? e.target.closest('[data-cat-link]') : null;
      if (a) { spyHold = a.dataset.catLink; setSpy(spyHold); }
    });
    const release = (e) => {
      if (!spyHold) return;
      const t = e && e.target instanceof Element ? e.target : null;
      if (t && t.closest('[data-cat-link]') && (e.type === 'pointerdown' || e.key === 'Enter' || e.key === ' ')) return;
      spyHold = null; kick();
    };
    for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.addEventListener(ev, release, { passive: true });
  }
  /** #cat-xyz deep links open the right tab first. */
  function openHash(smooth) {
    const id = decodeURIComponent((location.hash || '').slice(1));
    if (!id || id.indexOf('cat-') !== 0 || !W) return;
    const c = W.categories().filter((x) => 'cat-' + x.id === id)[0];
    if (!c) return;
    if (groupOf(c) !== activeGroup) selectGroup(groupOf(c));
    const el = document.getElementById(id);
    if (el) requestAnimationFrame(() => { el.scrollIntoView({ behavior: smooth && !REDUCED ? 'smooth' : 'auto' }); spyHold = c.id; setSpy(c.id); });
  }
  window.addEventListener('hashchange', () => openHash(true));

  /* ---------------- karaoke rooms ---------------- */
  function roomHTML(r, today) {
    let tonight = '';
    try {
      const slots = W.karaokeSlots(today, r.id);
      const free = slots.filter((s) => s.free);
      tonight = free.length ? 'Next free tonight: ' + free[0].label
        : slots.every((s) => s.past) ? 'Free again tomorrow from ' + (slots[0] ? slots[0].label : '4 PM')
        : 'Fully booked tonight';
    } catch (e) { tonight = ''; }
    const short = r.name.replace(/\s+room$/i, '');
    return '<li class="room rv">' +
      '<div class="room__head"><h3 class="room__name">' + esc(r.name) + '</h3>' +
        '<p class="room__rate"><span class="visually-hidden">MVR </span><span class="room__num">' + esc(num(r.rate)) + '</span> an hour</p></div>' +
      '<p class="room__meta"><span>Up to ' + esc(num(r.capacity)) + ' people</span>' + (tonight ? '<span class="room__tonight">' + esc(tonight) + '</span>' : '') + '</p>' +
      (r.blurb ? '<p class="room__blurb">' + esc(r.blurb) + '</p>' : '') +
      '<a class="room__book" href="karaoke/?room=' + encodeURIComponent(r.id) + '#book">Book the ' + esc(short) + ' room</a>' +
      '</li>';
  }
  function renderKaraoke() {
    const list = $('[data-rooms]');
    if (!list || typeof W.karaokeRooms !== 'function') return;
    const rooms = W.karaokeRooms();
    const today = W.karaokeToday();
    const html = rooms.map((r) => roomHTML(r, today)).join('');
    if (list.dataset.sig !== html) { list.dataset.sig = html; list.innerHTML = html; }
    for (const el of $$('[data-room-count]')) el.textContent = NUM_WORDS[rooms.length] || String(rooms.length);
  }

  /* ---------------- White Rewards ---------------- */
  function renderRewards() {
    const p = W.program;
    const lede = $('[data-program-lede]');
    if (lede) lede.textContent = 'Join free with your phone number and we add ' + num(p.welcomeBonus) + ' beans to your card. You earn 1 bean for every MVR ' + num(p.mvrPerBean) +
      ' you spend, every ' + ordinal(p.stampsForFree) + ' drink is on us, and there are ' + num(p.birthdayBonus) + ' beans waiting on your birthday.';

    const tiersEl = $('[data-tiers]');
    if (tiersEl) {
      const head = $('thead tr', tiersEl.parentElement);
      if (head) head.innerHTML = '<th scope="col">Tier</th><th scope="col">Unlocks at</th><th scope="col">Beans per MVR ' + esc(num(p.mvrPerBean)) + '</th>';
      tiersEl.innerHTML = p.tiers.map((t) => {
        const perk = (t.perks || []).filter((x) => !/bean/i.test(x))[0] || '';
        return '<tr><th scope="row"><span class="tiers__name">' + esc(t.name) + '</span>' + (perk ? '<span class="tiers__perk">' + esc(perk) + '</span>' : '') + '</th>' +
          '<td>' + (t.min > 0 ? esc(num(t.min)) + ' beans earned' : 'Joining') + '</td>' +
          '<td>' + esc(num(t.mult || 1)) + '</td></tr>';
      }).join('');
    }

    const listEl = $('[data-rewards-list]');
    if (listEl) {
      const PICK = ['r-cookies', 'r-hot', 'r-special', 'r-karaoke'];
      let list = PICK.map((id) => W.reward(id)).filter((r) => r && r.active);
      if (list.length < 3) list = W.rewards().slice(0, 4);
      if (!list.some((r) => r.kind === 'karaoke')) { const k = W.rewards().filter((r) => r.kind === 'karaoke')[0]; if (k) list = list.slice(0, 3).concat(k); }
      listEl.innerHTML = list.map((r) =>
        '<li class="rlist__item"><span class="rlist__name">' + esc(r.name) + '</span>' +
        '<span class="rlist__cost">' + esc(num(r.cost)) + '<span class="rlist__unit">beans</span></span></li>').join('');
    }
  }

  /* ---------------- render all + stay live ---------------- */
  function renderAll() {
    safe(renderMenu);
    safe(renderSpecials);
    safe(renderKaraoke);
    safe(renderRewards);
    scheduleMeasure();
  }
  if (W) {
    safe(bindInfo);
    renderAll();
    safe(renderStatus);
    safe(() => renderHours(true));
    if (tabs.length) selectGroup(activeGroup);
    W.subscribe(renderAll);               // admin edits in another tab arrive here live
    const minute = () => { safe(renderStatus); safe(() => renderHours(false)); safe(renderKaraoke); };
    setTimeout(() => { minute(); setInterval(minute, 60e3); }, 60e3 - (Date.now() % 60e3) + 250);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) minute(); });
  }
  observeReveals(document);
  if (W) safe(() => openHash(false));

  /* ---------------- bean emblem (separate module) ---------------- */
  const beansEl = $('[data-beans]');
  if (beansEl && window.WCHBeans) safe(() => window.WCHBeans.mount(beansEl));

  root.classList.add('site-ready');
  kick();
})();
