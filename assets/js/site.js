/* ==========================================================================
   White Coffee House — website one-pager (index.html)
   - header: solid after 24px, hides on scroll down / returns on scroll up,
     active-section highlight, mobile sheet with focus trap + Escape
   - live data from window.WCH (store.js): menu tabs, favourites, White Rewards
     rules, tiers, rewards, hours, open/closed status; re-renders on
     WCH.subscribe, so admin-portal edits appear here live
   - motion: ONE rAF scroll driver (scrollY read once per frame; layout is
     measured on resize only), IntersectionObserver reveals, image parallax,
     word-fill scrub, coffee-card scrub, membership-card tilt
   - prefers-reduced-motion: everything visible, nothing moves
   The hero (hero.js/hero.css) and the bean emblem (beans.js) are separate.
   ========================================================================== */
(() => {
  'use strict';

  const W = window.WCH || null;
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };

  const IC = {
    cup: '<path d="M4.5 9.5h11.5v3.75a5 5 0 0 1-5 5H9.5a5 5 0 0 1-5-5V9.5Z"/><path d="M16 10.75h1.4a2.35 2.35 0 0 1 0 4.7H15.6"/><path d="M3.5 21h14"/><path d="M8 3.25c-.7.9.7 1.85 0 2.75M11.75 3.25c-.7.9.7 1.85 0 2.75"/>',
    food: '<path d="M6.5 3v6.25a2 2 0 0 0 2 2V21M10.5 3v6.25a2 2 0 0 1-2 2M8.5 3v5"/><path d="M17.5 21V3c-2.2 1.4-3.25 4-3.25 7.25v3.25h3.25"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M12 8.5v12M12 8.5C10.5 5 6.5 4.5 6.5 7c0 1.5 2.5 1.5 5.5 1.5Zm0 0C13.5 5 17.5 4.5 17.5 7c0 1.5-2.5 1.5-5.5 1.5Z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
  };
  const icon = (name) => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (IC[name] || '') + '</svg>';

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
  const SECTIONS = ['menu', 'rewards', 'space', 'visit'];
  let menuOpen = false;
  let headerHidden = false;

  function setHidden(h) {
    if (h === headerHidden) return;
    headerHidden = h;
    header.classList.toggle('is-hidden', h);
  }

  if (header) {
    let tops = [], docH = 0, lastY = window.scrollY, solid = null, active;
    tasks.push({
      measure() {
        tops = SECTIONS.map((id) => { const el = document.getElementById(id); return el ? docTop(el) : Infinity; });
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
        for (let i = 0; i < tops.length; i++) if (line >= tops[i]) cur = SECTIONS[i];
        if (cur && y + h >= docH - 2) cur = SECTIONS[SECTIONS.length - 1];
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
  // toggle or the nav itself (the hero prototype binds its own), and stops them,
  // so the header has exactly one owner.
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
  /* Reveals (IntersectionObserver)                                         */
  /* ====================================================================== */
  const groups = $$('[data-reveal]');
  for (const g of groups) { let i = 0; for (const el of $$('.mask__in, .rv', g)) el.style.setProperty('--i', i++); }
  function revealAll() { for (const g of groups) g.classList.add('is-in'); }
  if (REDUCED || !('IntersectionObserver' in window)) revealAll();
  else {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        if (en.intersectionRatio >= 0.15 || en.intersectionRect.height >= window.innerHeight * 0.3) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      }
    }, { threshold: [0, 0.15, 0.3], rootMargin: '0px 0px -8% 0px' });
    for (const g of groups) io.observe(g);
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
          // starts as the line rises past 78% of the viewport, done once its last line passes 42%
          const start = top - vh * 0.78, end = top + h - vh * 0.42;
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
    for (const el of $$('[data-parallax]')) {
      const frameEl = el.parentElement;
      const amp = 24;
      let top = 0, h = 0, last = null;
      tasks.push({
        measure() { top = docTop(frameEl); h = frameEl.offsetHeight; },
        update(y, vh) {
          if (!h || top > y + vh + 80 || top + h < y - 80) return false;
          const p = clamp((y + vh - top) / (vh + h), 0, 1);
          const ty = Math.round((p - 0.5) * 2 * amp * 10) / 10;
          if (ty !== last) { last = ty; el.style.transform = 'translate3d(0,' + ty + 'px,0)'; }
          return false;
        }
      });
    }
  }

  /* ====================================================================== */
  /* Live data                                                              */
  /* ====================================================================== */
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const clock = (hhmm) => { const s = W.fmtClock(hhmm); return s === 'midnight' ? '12 AM' : s; };

  /* ---------------- open / closed + hours ---------------- */
  let shownDay = -1;
  function renderStatus() {
    const s = W.openStatus();
    for (const el of $$('[data-open-status]')) {
      el.classList.toggle('is-open', !!s.open);
      el.classList.toggle('is-closed', !s.open);
      const txt = $('[data-status-text]', el);
      if (txt) txt.textContent = s.label + (s.detail ? ' · ' + s.detail : '');
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
        '<td>' + (h ? clock(h.open) + ' – ' + clock(h.close) : 'Closed') + '</td></tr>';
    }
    body.innerHTML = html;
    const note = $('[data-hours-note]');
    if (note) note.textContent = W.info.hoursNote ? W.info.hoursNote + ' hours' : 'Opening hours';
  }
  function bindInfo() {
    for (const el of $$('[data-info]')) { const v = W.info[el.dataset.info]; if (v) el.textContent = v; }
    for (const el of $$('[data-info-href]')) { const v = W.info[el.dataset.infoHref]; if (v) el.setAttribute('href', v); }
  }

  /* ---------------- favourites ---------------- */
  function renderFavs() {
    for (const li of $$('[data-fav]')) {
      const m = W.menuItem(li.dataset.fav);
      if (!m) continue;
      const out = m.available === false;
      $('[data-f="name"]', li).textContent = m.name;
      $('[data-f="price"]', li).innerHTML = out ? '<s>' + esc(W.fmt.mvr(m.price)) + '</s>' : esc(W.fmt.mvr(m.price));
      let note = $('.fav__note', li);
      if (out && !note) { note = document.createElement('p'); note.className = 'fav__note'; note.textContent = 'Sold out today'; $('.fav__link', li).appendChild(note); }
      if (!out && note) note.remove();
    }
  }

  /* ---------------- menu ---------------- */
  const tabsEl = $('[data-menu-tabs]');
  const panelsEl = $('[data-menu-panels]');
  const photosEl = $('[data-menu-photos]');
  let activeCat = null, tabsSig = '';

  function itemHTML(m) {
    const out = m.available === false;
    const price = '<span class="visually-hidden">MVR </span>' + esc(num(m.price));
    return '<li class="mi' + (out ? ' is-out' : '') + '">' +
      '<div class="mi__top"><h4 class="mi__name">' + esc(m.name) + '</h4>' +
      (m.signature ? '<span class="chip mi__chip">Signature</span>' : '') +
      '<span class="mi__price">' + (out ? '<s>' + price + '</s>' : price) + '</span></div>' +
      (m.desc ? '<p class="mi__desc">' + esc(m.desc) + '</p>' : '') +
      (out ? '<p class="mi__out">Sold out today</p>' : '') +
      '</li>';
  }
  function panelHTML(c) {
    const items = W.menu(c.id);
    return '<h3 class="menu__cat">' + esc(c.name) + '</h3>' +
      (c.blurb ? '<p class="menu__blurb">' + esc(c.blurb) + '</p>' : '') +
      '<ul class="menu__list" role="list">' + items.map(itemHTML).join('') + '</ul>';
  }
  function renderMenu() {
    if (!tabsEl || !panelsEl) return;
    const cats = W.categories();
    if (!cats.length) return;
    if (!activeCat || !cats.some((c) => c.id === activeCat)) activeCat = cats[0].id;
    const sig = cats.map((c) => c.id + ':' + c.name).join('|');
    if (sig !== tabsSig) {
      const focused = document.activeElement && tabsEl.contains(document.activeElement) ? document.activeElement.dataset.tab : null;
      tabsSig = sig;
      tabsEl.innerHTML = cats.map((c) =>
        '<button class="mtab" type="button" role="tab" id="mtab-' + esc(c.id) + '" aria-controls="mpanel-' + esc(c.id) + '" aria-selected="false" tabindex="-1" data-tab="' + esc(c.id) + '">' + esc(c.name) + '</button>').join('');
      panelsEl.innerHTML = cats.map((c) =>
        '<div class="menu__panel" role="tabpanel" id="mpanel-' + esc(c.id) + '" aria-labelledby="mtab-' + esc(c.id) + '" tabindex="0" data-panel="' + esc(c.id) + '"></div>').join('');
      if (focused) { const b = $('[data-tab="' + focused + '"]', tabsEl); if (b) b.focus(); }
    }
    for (const c of cats) { const p = document.getElementById('mpanel-' + c.id); if (p) p.innerHTML = panelHTML(c); }
    selectTab(activeCat, false);
  }
  function selectTab(id, focus) {
    activeCat = id;
    for (const b of $$('.mtab', tabsEl)) {
      const on = b.dataset.tab === id;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on) {
        if (focus) b.focus();
        // keep the active pill in view in the phone pill row (horizontal only; never scrolls the page)
        if (tabsEl.scrollWidth > tabsEl.clientWidth + 1) {
          const left = b.offsetLeft - tabsEl.offsetLeft, right = left + b.offsetWidth;
          if (left < tabsEl.scrollLeft + 16) tabsEl.scrollTo({ left: Math.max(0, left - 16), behavior: REDUCED ? 'auto' : 'smooth' });
          else if (right > tabsEl.scrollLeft + tabsEl.clientWidth - 16) tabsEl.scrollTo({ left: right - tabsEl.clientWidth + 16, behavior: REDUCED ? 'auto' : 'smooth' });
        }
      }
    }
    for (const p of $$('.menu__panel', panelsEl)) p.classList.toggle('is-active', p.dataset.panel === id);
    if (photosEl) {
      const imgs = $$('img', photosEl);
      const has = imgs.some((img) => img.dataset.cat === id);
      for (const img of imgs) img.classList.toggle('is-active', has ? img.dataset.cat === id : img === imgs[0]);
    }
  }
  if (tabsEl) {
    tabsEl.addEventListener('click', (e) => { const b = e.target.closest('.mtab'); if (b) selectTab(b.dataset.tab, false); });
    tabsEl.addEventListener('keydown', (e) => {
      const tabs = $$('.mtab', tabsEl);
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      selectTab(tabs[j].dataset.tab, true);
    });
  }
  // A favourite card opens its category, then the normal #menu jump happens.
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[data-cat]') : null;
    if (a && W) selectTab(a.dataset.cat, false);
  });

  /* ---------------- White Rewards ---------------- */
  const stampsEl = $('[data-stamps]');
  let stampSlots = [], stampTotal = 0, stampShown = -1;

  function renderStampSlots() {
    const n = Math.max(1, W.program.stampsForFree | 0);
    if (n === stampTotal) return;
    stampTotal = n;
    stampShown = -1;
    const list = $('[data-stamp-slots]', stampsEl);
    list.style.setProperty('--cols', n <= 6 ? n : Math.ceil(n / 2));
    let html = '';
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      html += '<li class="slot' + (last ? ' slot--free' : '') + '"><span class="slot__ring">' + icon(last ? 'gift' : 'cup') +
        (last ? '<span class="slot__free">Free</span>' : '') + '</span></li>';
    }
    list.innerHTML = html;
    stampSlots = $$('.slot', list);
    $('[data-stamp-total]', stampsEl).textContent = n;
    applyStamps(REDUCED ? n : 0);
  }
  function applyStamps(count) {
    if (count === stampShown) return;
    stampShown = count;
    stampSlots.forEach((s, i) => s.classList.toggle('is-filled', i < count));
    $('[data-stamp-count]', stampsEl).textContent = count;
    const toGo = stampTotal - count;
    $('[data-stamp-line]', stampsEl).textContent =
      count === 0 ? 'Every handcrafted drink earns a stamp.' :
      toGo === 0 ? 'Card full. Your next drink is on us.' :
      toGo === 1 ? 'One more stamp to go.' :
      toGo + ' more stamps to a free drink.';
  }

  function renderRewards() {
    const p = W.program;
    const lede = $('[data-program-lede]');
    if (lede) lede.textContent = 'Earn beans every time you visit — 1 bean for every MVR ' + num(p.mvrPerBean) + '. Every ' + ordinal(p.stampsForFree) + ' drink is on us.';
    for (const el of $$('[data-welcome]')) el.textContent = num(p.welcomeBonus);
    for (const el of $$('[data-earn-rule]')) el.textContent = '1 bean for every MVR ' + num(p.mvrPerBean);
    for (const el of $$('[data-stamps-ordinal]')) el.textContent = ordinal(p.stampsForFree);
    const rewards = W.rewards();
    if (rewards.length) for (const el of $$('[data-min-reward]')) el.textContent = num(rewards[0].cost) + ' beans';

    const tiersEl = $('[data-tiers]');
    if (tiersEl) {
      tiersEl.innerHTML = p.tiers.map((t, i) =>
        '<li class="tier tier--' + esc(t.id) + ' rv" style="--i:' + (i + 1) + '">' +
          '<h4 class="tier__name">' + esc(t.name) + '</h4>' +
          '<p class="tier__min">' + (t.min > 0 ? 'From ' + num(t.min) + ' beans earned' : 'From your first visit') + '</p>' +
          '<ul class="tier__perks" role="list">' + (t.perks || []).map((x) => '<li>' + icon('check') + '<span>' + esc(x) + '</span></li>').join('') + '</ul>' +
        '</li>').join('');
    }
    const listEl = $('[data-rewards-list]');
    if (listEl) {
      listEl.innerHTML = rewards.map((r, i) =>
        '<li class="rlist__item rv" style="--i:' + (i + 1) + '">' +
          '<span class="rlist__icon">' + icon(r.kind === 'food' ? 'food' : 'cup') + '</span>' +
          '<span class="rlist__name">' + esc(r.name) + '</span>' +
          '<span class="rlist__cost num">' + num(r.cost) + ' beans</span>' +
        '</li>').join('');
    }
    if (stampsEl) {
      renderStampSlots();
      stampsEl.setAttribute('aria-label', 'Example coffee card: ' + stampTotal + ' stamps, then a free drink');
    }
    const card = $('[data-tilt-card]');
    if (card) card.setAttribute('aria-label', 'Example White Rewards card for a House member with ' + num(p.welcomeBonus) + ' welcome beans');
  }

  // Coffee card fills one stamp at a time as it scrolls through the viewport.
  if (stampsEl && !REDUCED) {
    let top = 0, h = 0;
    tasks.push({
      measure() { top = docTop(stampsEl); h = stampsEl.offsetHeight; },
      update(y, vh) {
        if (!stampTotal) return false;
        const start = top - vh * 0.86, end = top + h * 0.5 - vh * 0.42;
        const p = clamp((y - start) / Math.max(1, end - start), 0, 1);
        applyStamps(Math.round(p * stampTotal));
        return false;
      }
    });
  }

  /* ---------------- membership card tilt ---------------- */
  const card = $('[data-tilt-card]');
  if (card && !REDUCED) {
    const inner = $('[data-tilt-inner]', card);
    const sheen = $('[data-sheen]', card);
    const zone = card.closest('.rw-card__visual') || card;
    const MAX = 8;
    let tx = 0, ty = 0, rx = 0, ry = 0, tmx = 32, tmy = 18, mx = 32, my = 18, written = '';
    let dragging = false;

    const aim = (cx, cy) => {
      const r = card.getBoundingClientRect();
      const nx = clamp(((cx - r.left) / r.width) * 2 - 1, -1.2, 1.2);
      const ny = clamp(((cy - r.top) / r.height) * 2 - 1, -1.2, 1.2);
      tx = clamp(-ny * MAX, -MAX, MAX);     // the side under the pointer dips away
      ty = clamp(nx * MAX, -MAX, MAX);
      tmx = clamp((nx + 1) * 50, -10, 110);
      tmy = clamp((ny + 1) * 50, -10, 110);
      kick();
    };
    const rest = () => { tx = 0; ty = 0; tmx = 32; tmy = 18; kick(); };

    if (FINE) {
      zone.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') aim(e.clientX, e.clientY); });
      zone.addEventListener('pointerleave', rest);
    }
    // touch: drag across the card to tilt it (vertical swipes still scroll the page)
    card.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { dragging = true; aim(e.clientX, e.clientY); } });
    card.addEventListener('pointermove', (e) => { if (dragging && e.pointerType === 'touch') aim(e.clientX, e.clientY); });
    const end = () => { if (dragging) { dragging = false; rest(); } };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
    card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') end(); });

    tasks.push({
      update(y, vh, dt) {
        const k = 1 - Math.exp(-dt * 9);
        rx += (tx - rx) * k; ry += (ty - ry) * k; mx += (tmx - mx) * k; my += (tmy - my) * k;
        const moving = Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01 || Math.abs(tmx - mx) > 0.05 || Math.abs(tmy - my) > 0.05;
        if (!moving) { rx = tx; ry = ty; mx = tmx; my = tmy; }
        const tf = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        if (tf !== written) {
          written = tf;
          inner.style.transform = (rx === 0 && ry === 0) ? '' : tf;
          if (sheen) { sheen.style.setProperty('--mx', mx.toFixed(1) + '%'); sheen.style.setProperty('--my', my.toFixed(1) + '%'); }
        }
        return moving;
      }
    });
  }

  /* ---------------- render all + stay live ---------------- */
  function renderAll() {
    safe(renderMenu);
    safe(renderFavs);
    safe(renderRewards);
    scheduleMeasure();
  }
  if (W) {
    safe(bindInfo);
    renderAll();
    safe(renderStatus);
    safe(() => renderHours(true));
    W.subscribe(renderAll);               // admin edits in another tab arrive here live
    const minute = () => { safe(renderStatus); safe(() => renderHours(false)); };
    setTimeout(() => { minute(); setInterval(minute, 60e3); }, 60e3 - (Date.now() % 60e3) + 250);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) minute(); });
  }

  /* ---------------- bean emblem (separate module) ---------------- */
  const beansEl = $('[data-beans]');
  if (beansEl && window.WCHBeans) safe(() => window.WCHBeans.mount(beansEl));

  root.classList.add('site-ready');
  kick();
})();
