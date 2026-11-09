/* ==========================================================================
   White Coffee House: karaoke room booking (public page).
   Everything runs on window.WCH (assets/js/store.js). Bookings sync live
   across tabs through WCH.subscribe, so the grid changes the moment someone
   else books a slot.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.WCH;
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  initHeader();
  if (!W) {
    var f = $('#k-form');
    if (f) f.insertAdjacentHTML('beforebegin', '<p class="k-noscript">Online booking is not available right now. You can still book at the counter.</p>');
    return;
  }

  var R = W.karaokeRules();
  var esc = W.fmt.esc;
  var STRIP_DAYS = 14;
  var MINE_KEY = 'wch.karaoke.mine';

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var S = {
    date: W.karaokeToday(),
    dateChosen: false,     // guest picked a date or a time: never move the date for them
    roomId: null,
    guests: 4,
    start: null,
    hours: null,
    tried: false,          // show every error after the first submit
    touched: {},           // per-field: show errors after blur
    unlinked: false,       // member chose to book without their card
    memberId: null,        // member we last prefilled for
    noteRoom: '',
    noteTime: '',
    flashHour: null,
    doneId: null,          // confirmation on screen
    foundId: null,         // find-my-booking result on screen
    ask: { done: false, found: false },   // inline "cancel?" open
    cancelled: { done: false, found: false },
    urlSync: false
  };
  var booking = false;     // true while our own bookKaraoke() commits

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function pad(n) { return String(n).padStart(2, '0'); }
  function clock(h) { return W.fmtClock(pad(h % 24) + ':00').replace(' ', '\u00a0'); }   // "8 PM" never splits
  function today() { return W.karaokeToday(); }
  function lastDay() { return W.karaokeAddDays(today(), R.daysAhead); }
  function dayLabel(key) { return W.karaokeDateLabel(key); }
  function rooms() { return W.karaokeRooms(); }
  function room() { return S.roomId ? W.karaokeRoom(S.roomId) : null; }
  function money(n) { return W.fmt.mvr(n); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function slots(date, roomId) { return W.karaokeSlots(date, roomId); }
  function slotAt(h) { var r = room(); if (!r) return null; return slots(S.date, r.id).filter(function (s) { return s.hour === h; })[0] || null; }
  function maxHours(start) { var r = room(); return r ? W.karaokeMaxHours(S.date, r.id, start) : 0; }
  function maxGuests() { return rooms().reduce(function (m, r) { return Math.max(m, r.capacity); }, 1); }
  /** Every start time on this date has gone (only ever true for today, late at night). */
  function nightOver(date) { var r = W.karaokeRooms(true)[0]; return !!r && slots(date, r.id).every(function (s) { return s.past; }); }
  function smallestFit(n) { return rooms().filter(function (r) { return r.capacity >= n; }).sort(function (a, b) { return a.capacity - b.capacity; })[0] || null; }
  function startTs(date, hour) { var a = date.split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2], hour) - 5 * 36e5; }
  function validDate(key) { return /^\d{4}-\d{2}-\d{2}$/.test(key || '') && key >= today() && key <= lastDay(); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function last7(s) { return digits(s).slice(-7); }
  function normRef(s) { var d = digits(s); return d ? 'K-' + d : ''; }
  function member() { return W.currentMember(); }
  function linkedMember() { var m = member(); return m && !S.unlinked ? m : null; }
  function localPhone(full) { return String(full || '').replace(/^\+960\s*/, ''); }
  function phoneValue(raw) {
    raw = String(raw || '').trim(); var d = digits(raw);
    if (raw.charAt(0) === '+') return raw;
    if (d.length === 10 && d.indexOf('960') === 0) d = d.slice(3);
    return '+960 ' + (d.length === 7 ? d.slice(0, 3) + ' ' + d.slice(3) : d);
  }
  function phoneOk(raw) { var d = digits(raw); if (String(raw).trim().charAt(0) !== '+' && d.indexOf('960') === 0 && d.length === 10) d = d.slice(3); return d.length >= 7; }
  function emailOk(s) { s = String(s || '').trim(); return !s || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }
  function mine() { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') || []; } catch (e) { return []; } }
  function remember(id) { try { var a = mine().filter(function (x) { return x !== id; }); a.unshift(id); localStorage.setItem(MINE_KEY, JSON.stringify(a.slice(0, 20))); } catch (e) { /* storage blocked */ } }

  /** Re-render a container's HTML and keep keyboard focus on the same control. */
  function swap(el, html) {
    if (!el || el.__kHtml === html) return;     // unchanged: leave the DOM (and any animation) alone
    el.__kHtml = html;
    var a = doc.activeElement, key = a && el.contains(a) ? a.getAttribute('data-key') : null;
    var sl = el.scrollLeft;
    el.innerHTML = html;
    el.scrollLeft = sl;
    if (key) { var n = el.querySelector('[data-key="' + key + '"]'); if (n && !n.disabled) n.focus({ preventScroll: true }); }
  }

  /* ------------------------------------------------------------------ */
  /* Keep the selection valid (after user changes, remote bookings,      */
  /* the clock moving on, or an admin editing rooms)                     */
  /* ------------------------------------------------------------------ */
  function reconcile(why) {
    if (!validDate(S.date)) S.date = S.date < today() ? today() : lastDay();
    // After the last start time tonight, open on tomorrow instead of a grid of "Past".
    if (!S.dateChosen && S.start == null && S.date === today() && nightOver(today())) S.date = W.karaokeAddDays(today(), 1);

    var mg = maxGuests();
    if (S.guests > mg) S.guests = mg;
    if (S.guests < 1) S.guests = 1;

    var r = room(), moved = false;
    if (!r || !r.active) {
      var was = r, alt0 = smallestFit(S.guests);
      S.roomId = alt0 ? alt0.id : null; r = room();
      if (was && why !== 'init') {          // staff paused the room the guest had picked: say so
        S.noteRoom = alt0 ? 'The ' + was.name + ' just stopped taking bookings, so we moved you to the ' + alt0.name + '.'
                          : 'The ' + was.name + ' just stopped taking bookings, and no other room fits ' + S.guests + '. Talk to us at the café.';
        moved = true;
      }
    }
    if (r && r.capacity < S.guests) {
      var alt = smallestFit(S.guests);
      if (alt) { S.noteRoom = 'The ' + r.name + ' fits up to ' + r.capacity + ', so we moved you to the ' + alt.name + '.'; S.roomId = alt.id; r = alt; moved = true; }
    }

    var remote = why !== 'user' && why !== 'init' && !moved;   // the change came from another tab, not from this guest
    if (S.start != null && r) {
      var s = slotAt(S.start);
      if (!s || !s.free) {
        if (s && s.past) S.noteTime = clock(S.start) + ' has passed. Pick a later time.';
        else if (remote) S.noteTime = 'Someone just booked ' + clock(S.start) + ' in the ' + r.name + '. Pick another time.';
        else S.noteTime = clock(S.start) + ' is already booked in the ' + r.name + '. Pick another time.';
        S.flashHour = S.start; S.start = null; S.hours = null;
      } else {
        var mx = maxHours(S.start);
        if (S.hours && S.hours > mx) {
          S.noteTime = (remote ? 'Someone just booked the ' + r.name + ' from ' : 'The ' + r.name + ' is booked from ') + clock(S.start + mx) + ', so your booking is now ' + plural(mx, 'hour') + '.';
          S.hours = mx;
        }
        if (!S.hours) S.hours = Math.min(2, mx);
      }
    } else if (!r) { S.start = null; S.hours = null; }
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  function render() {
    renderCount();
    renderRoomList();
    renderDates();
    renderRooms();
    renderGrid();
    renderHours();
    renderMember();
    renderSummary();
    renderErrors();
    renderDone();
    renderFound();
    renderBar();
  }

  var WORDS = ['Our', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
  function renderCount() {
    var n = rooms().length, t = (WORDS[n] || String(n)) + ' private room' + (n === 1 ? '' : 's');
    $$('[data-k-count]').forEach(function (el) { if (el.textContent !== t) el.textContent = t; });
  }

  function renderRoomList() {
    var html = W.karaokeRooms(true).map(function (r) {
      return '<li class="k-mrow' + (r.active ? '' : ' is-off') + '">' +
        '<div class="k-mrow__top"><h3 class="k-mrow__name">' + esc(r.name) + '</h3>' +
        '<span class="k-mrow__fit"><span class="visually-hidden">Fits </span>' + esc(r.capacity) + ' people</span>' +
        '<span class="k-mrow__rate num"><span class="visually-hidden">MVR </span>' + W.fmt.num(r.rate) + '<span class="visually-hidden"> an hour</span></span></div>' +
        (r.blurb ? '<p class="k-mrow__blurb">' + esc(r.blurb) + '</p>' : '') +
        (r.active ? '<a class="k-link k-mrow__book" href="?room=' + encodeURIComponent(r.id) + '#book" data-pick-room="' + esc(r.id) + '" data-key="pick-' + esc(r.id) + '">Book the ' + esc(r.name) + '</a>'
                  : '<p class="k-mrow__blurb">Not taking bookings right now.</p>') +
        '</li>';
    }).join('');
    swap($('#k-roomlist'), html);
  }

  function renderDates() {
    var t = today(), r = room(), html = '', inStrip = false;
    for (var i = 0; i < STRIP_DAYS; i++) {
      var key = W.karaokeAddDays(t, i), lab = dayLabel(key).split(' ');   // ["Fri","14","Nov"]
      var sl = r ? slots(key, r.id) : [], free = sl.filter(function (s) { return s.free; }).length;
      var on = key === S.date; if (on) inStrip = true;
      var dow = i === 0 ? 'Today' : lab[0];
      var meter = r ? (free ? '<span class="k-day__av" aria-hidden="true">' + sl.map(function (s) { return '<i' + (s.free ? '' : ' class="is-off"') + '></i>'; }).join('') + '</span>'
                            : '<span class="k-day__full" aria-hidden="true">' + (sl.every(function (s) { return s.past; }) ? 'Past' : 'Full') + '</span>') : '';
      var aria = (i === 0 ? 'Today, ' : '') + dayLabel(key) + (r ? ', ' + (free ? plural(free, 'hour') + ' free in the ' + r.name : 'no free times in the ' + r.name) : '');
      html += '<button type="button" class="k-day" data-date="' + key + '" data-key="d-' + key + '" aria-pressed="' + on + '" aria-label="' + esc(aria) + '">' +
        '<span class="k-day__dow">' + dow + '</span><span class="k-day__num">' + lab[1] + '</span><span class="k-day__mon">' + lab[2] + '</span>' + meter + '</button>';
    }
    swap($('#k-dates'), html);
    var inp = $('#f-date');
    inp.min = t; inp.max = lastDay();
    if (doc.activeElement !== inp) inp.value = inStrip ? '' : S.date;
    inp.classList.toggle('is-active', !inStrip);
    $('#v-date').textContent = (S.date === t ? 'Today, ' : '') + dayLabel(S.date);
    var nd = !S.dateChosen && S.date === W.karaokeAddDays(t, 1) && nightOver(t) ? 'The last start time tonight has passed, so this shows tomorrow.' : '';
    var ne = $('#n-date'); if (ne.textContent !== nd) ne.textContent = nd;
  }

  function renderRooms() {
    var g = S.guests, mg = maxGuests();
    $('#k-guests').textContent = plural(g, 'person', 'people');
    $('[data-guests="-1"]').disabled = g <= 1;
    $('[data-guests="1"]').disabled = g >= mg;
    var html = rooms().map(function (r) {
      var fits = r.capacity >= g, on = r.id === S.roomId;
      var sl = slots(S.date, r.id), free = sl.filter(function (s) { return s.free; }).length;
      var av = !fits ? 'Too small for ' + g : free ? plural(free, 'hour') + ' free'
             : sl.every(function (s) { return s.past; }) ? 'No times left today' : 'Full on this date';
      return '<button type="button" class="k-opt" data-room="' + esc(r.id) + '" data-key="r-' + esc(r.id) + '" aria-pressed="' + on + '"' + (fits ? '' : ' disabled') + '>' +
        '<span class="k-opt__name">' + esc(r.name) + '</span>' +
        '<span class="k-opt__meta"><span>Up to ' + r.capacity + ' people</span><span>' + money(r.rate) + ' an hour</span></span>' +
        '<span class="k-opt__av">' + av + '</span></button>';
    }).join('');
    swap($('#k-opts'), html);
    var hint = g >= mg ? 'Our largest room fits ' + mg + '. For a bigger group, talk to us at the café.' : '';
    $('#n-room').textContent = S.noteRoom || hint;
    var r = room();
    $('#v-room').textContent = (r ? r.name + ', ' : '') + plural(g, 'person', 'people');
  }

  function renderGrid() {
    var r = room(), grid = $('#k-grid');
    var over = r && !S.noteTime && nightOver(S.date) ? 'The last start time tonight has passed. Pick another day.' : '';
    $('#n-time').textContent = S.noteTime || over;
    if (!r) { swap(grid, '<p class="k-hint">Pick a room to see free times.</p>'); $('#v-time').textContent = ''; return; }
    var end = S.start != null && S.hours ? S.start + S.hours : null;
    var html = slots(S.date, r.id).map(function (s) {
      var cls = 'k-slot', state, dis = false;
      var isStart = s.hour === S.start, inRange = end != null && s.hour > S.start && s.hour < end;
      if (isStart) { cls += ' is-start'; state = 'Start'; }
      else if (inRange) { cls += ' is-range'; state = 'Yours'; }
      else if (s.past) { cls += ' is-past'; state = 'Past'; dis = true; }
      else if (!s.free) { cls += ' is-taken'; state = 'Booked'; dis = true; }
      else state = 'Free';
      if (S.flashHour === s.hour) cls += ' is-flash';
      var aria = s.label + ', ' + (isStart ? 'your start time' : inRange ? 'part of your booking' : state.toLowerCase());
      return '<button type="button" class="' + cls + '" data-hour="' + s.hour + '" data-key="h-' + s.hour + '" aria-pressed="' + isStart + '" aria-label="' + esc(aria) + '"' + (dis ? ' disabled' : '') + '>' +
        '<span class="k-slot__t">' + s.label + '</span><span class="k-slot__s">' + state + '</span></button>';
    }).join('');
    swap(grid, html);
    S.flashHour = null;
    $('#v-time').textContent = S.start != null ? clock(S.start) : '';
  }

  function renderHours() {
    var box = $('#k-hours'), hint = '', mx = S.start != null ? maxHours(S.start) : 0, html = '';
    for (var h = 1; h <= R.maxHours; h++) {
      var ok = S.start != null && h <= mx, on = ok && h === S.hours;
      var to = S.start == null ? '' : S.start + h > R.close ? 'past midnight' : 'to ' + clock(S.start + h);
      html += '<button type="button" class="k-hr" data-hours="' + h + '" data-key="n-' + h + '" aria-pressed="' + on + '"' + (ok ? '' : ' disabled') + '>' +
        '<span class="k-hr__n">' + plural(h, 'hour') + '</span><span class="k-hr__to">' + to + '</span></button>';
    }
    swap(box, html);
    if (S.start == null) hint = 'Pick a start time first.';
    else if (mx < R.maxHours) hint = S.start + mx >= R.close ? 'We close the rooms at midnight, so the longest from ' + clock(S.start) + ' is ' + plural(mx, 'hour') + '.'
                                                              : 'The ' + room().name + ' is booked from ' + clock(S.start + mx) + ', so the longest from ' + clock(S.start) + ' is ' + plural(mx, 'hour') + '.';
    $('#h-hours').textContent = hint;
    $('#v-hours').textContent = S.start != null && S.hours ? plural(S.hours, 'hour') + ', to ' + clock(S.start + S.hours) : '';
  }

  function renderMember() {
    var m = member(), box = $('#k-member');
    if (m && m.id !== S.memberId) {             // newly signed in: prefill empty fields
      S.memberId = m.id; S.unlinked = false;
      if (!$('#f-name').value) $('#f-name').value = m.name;
      if (!$('#f-phone').value) $('#f-phone').value = localPhone(m.phone);
      if (!$('#f-email').value) $('#f-email').value = m.email || '';
    }
    if (!m) S.memberId = null;
    var html;
    if (m && !S.unlinked) {
      box.className = 'k-member is-linked';
      html = '<div class="k-member__row"><strong>Linked to your White Rewards card, you\'ll earn beans.</strong>' +
        '<button type="button" class="k-link k-link--quiet" data-act="unlink" data-key="unlink">Book as a guest</button></div>' +
        '<p class="k-member__sub">' + esc(m.name) + ', card ' + esc(m.id) + '. Beans go on the room total when we complete your booking at the café.</p>';
    } else if (m) {
      box.className = 'k-member';
      html = '<div class="k-member__row"><span>Booking as a guest. No beans for this one.</span>' +
        '<button type="button" class="k-link" data-act="link" data-key="link">Use my White Rewards card</button></div>';
    } else {
      box.className = 'k-member';
      html = '<div class="k-member__row"><span>White Rewards member? Sign in first and earn beans on your booking.</span>' +
        '<a class="k-link" href="../portal/">Sign in</a></div>';
    }
    swap(box, html);
    var n = $('#f-name').value.trim();
    $('#v-you').textContent = n;
  }

  function renderSummary() {
    var r = room(), line, d = (S.date === today() ? 'today, ' : '') + dayLabel(S.date);
    if (!r) line = '<span class="is-todo">Pick a room.</span>';
    else if (S.start == null) line = esc(r.name) + ' for ' + S.guests + ', ' + d + '. <span class="is-todo">Pick a start time.</span>';
    else {
      var h = S.hours || 1;
      line = esc(r.name) + ' for ' + S.guests + ', ' + d + ', ' + clock(S.start) + ' to ' + clock(S.start + h) + ', ' + plural(h, 'hour') + ', <b>' + money(r.rate * h) + '</b>.';
    }
    var el = $('#k-sumline');
    if (el.innerHTML !== line) el.innerHTML = line;
  }

  /* Phone: a slim bar so the total and the button are never far away. */
  function renderBar() {
    var r = room(), line = $('#k-barline'), btn = $('#k-barbtn'), html;
    if (!r) html = '<strong>Pick a room</strong>' + esc(dayLabel(S.date));
    else if (S.start == null) html = '<strong>' + esc(r.name) + ', ' + esc(dayLabel(S.date)) + '</strong>Pick a start time';
    else html = '<strong>' + esc(r.name) + ', ' + esc(dayLabel(S.date)) + '</strong>' + clock(S.start) + ' to ' + clock(S.start + S.hours) + ', <b>' + money(r.rate * S.hours) + '</b>';
    if (line.innerHTML !== html) line.innerHTML = html;
    var ready = !Object.keys(errors()).length;
    var lab = ready ? 'Book the room' : 'Continue';
    if (btn.textContent !== lab) btn.textContent = lab;
    barVisibility();
  }
  var barRaf = 0;
  function barVisibility() {
    if (barRaf) return;
    barRaf = requestAnimationFrame(function () {
      barRaf = 0;
      var bar = $('#k-bar'), form = $('#k-form'), sum = $('.k-sum');
      var on = false;
      if (innerWidth < 1024 && !form.hidden) {
        var fr = form.getBoundingClientRect(), sr = sum.getBoundingClientRect();
        on = fr.top < innerHeight * 0.55 && sr.top > innerHeight - 24;
      }
      bar.classList.toggle('is-on', on);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Validation                                                          */
  /* ------------------------------------------------------------------ */
  function errors() {
    var e = {}, r = room();
    if (!r) e.room = 'Pick a room.';
    else if (r.capacity < S.guests) e.room = 'The ' + r.name + ' fits up to ' + r.capacity + '.';
    if (S.start == null) e.time = 'Pick a start time.';
    else if (!S.hours) e.hours = 'Pick how long you want the room.';
    if (!$('#f-name').value.trim()) e.name = 'Please enter your name.';
    var ph = $('#f-phone').value;
    if (!ph.trim()) e.phone = 'Enter a phone number we can call.';
    else if (!phoneOk(ph)) e.phone = 'That number looks short. Maldives numbers have 7 digits, like 771 2408.';
    if (!emailOk($('#f-email').value)) e.email = 'That email doesn\'t look right. Leave it empty if you prefer.';
    return e;
  }
  function renderErrors() {
    var e = errors();
    function put(field, inputSel, show) {
      var msg = show ? (e[field] || '') : '', el = $('#e-' + field);
      if (el && el.textContent !== msg) el.textContent = msg;
      if (inputSel) { var i = $(inputSel); if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); }
    }
    put('room', null, S.tried);
    put('time', null, S.tried);
    put('hours', null, S.tried);
    put('name', '#f-name', S.tried || S.touched.name);
    put('phone', '#f-phone', S.tried || S.touched.phone);
    put('email', '#f-email', S.tried || S.touched.email);
    if (S.tried && $('#k-formerr').dataset.kind === 'check') setFormError(summary(e), 'check');   // keep it in step with the fields
    return e;
  }
  var LABELS = { room: 'room', time: 'start time', hours: 'how long', name: 'name', phone: 'phone', email: 'email' };
  function summary(e) {
    var keys = Object.keys(e);
    return !keys.length ? '' : keys.length === 1 ? e[keys[0]] : 'A few things to fix above: ' + keys.map(function (k) { return LABELS[k]; }).join(', ') + '.';
  }
  function setFormError(msg, kind) { var el = $('#k-formerr'); if (el.textContent !== msg) el.textContent = msg; el.dataset.kind = msg ? (kind || '') : ''; }

  /* ------------------------------------------------------------------ */
  /* Receipt (confirmation + find-my-booking)                            */
  /* ------------------------------------------------------------------ */
  var shownId = { done: null, found: null };   // entrance animation only on first show
  var STATUS = { confirmed: 'Confirmed', 'checked-in': 'Checked in', completed: 'Completed', cancelled: 'Cancelled', 'no-show': 'Missed' };
  function canCancel(b) { return b.status === 'confirmed' && startTs(b.date, b.start) > Date.now(); }

  function receipt(b, ctx) {
    var fresh = ctx === 'done', st = b.status, void_ = st === 'cancelled' || st === 'no-show';
    var title = fresh && st === 'confirmed' ? 'You\'re booked'
              : st === 'confirmed' ? 'Booking confirmed'
              : st === 'cancelled' ? 'Booking cancelled'
              : st === 'checked-in' ? 'You\'re checked in'
              : st === 'completed' ? 'Thanks for singing with us'
              : 'We missed you';
    var status = fresh && st === 'confirmed' ? 'Confirmed' : STATUS[st] || st;
    var m = b.memberId ? W.member(b.memberId) : null;
    var rows = [
      ['Room', esc(b.roomName) + '<small>For ' + plural(b.guests, 'person', 'people') + '</small>'],
      ['Date', (b.date === today() ? 'Today, ' : '') + esc(dayLabel(b.date))],
      ['Time', clock(b.start) + ' to ' + clock(b.start + b.hours) + '<small>' + plural(b.hours, 'hour') + ', Malé time</small>'],
      ['Name', esc(b.name)],
      ['Phone', esc(b.phone)]
    ];
    if (b.email) rows.push(['Email', esc(b.email)]);
    if (b.notes) rows.push(['Notes', esc(b.notes)]);
    rows.push(['Total', money(b.total) + '<small>' + money(b.rate) + ' an hour. Pay at the café, plus 10% service charge and 8% GST.</small>']);
    if (m) rows.push(['White Rewards', 'Linked to your White Rewards card, you\'ll earn beans.<small>Card ' + esc(m.id) + '. ' + (b.beansAwarded ? 'Beans added.' : 'Beans land when we complete your booking.') + ' <a href="../portal/">Open White Rewards</a></small>']);

    var enter = shownId[ctx] !== b.id; shownId[ctx] = b.id;
    var html = '<article class="k-rcpt' + (enter ? ' is-enter' : '') + '" aria-labelledby="rc-' + ctx + '">' +
      '<div class="k-rcpt__top"><div><p class="k-rcpt__status' + (void_ ? ' is-bad' : '') + '">' + esc(status) + '</p>' +
      '<h3 class="k-rcpt__title" id="rc-' + ctx + '" tabindex="-1" data-key="title-' + ctx + '">' + esc(title) + '</h3>' +
      '<p class="k-rcpt__sub">' + esc(b.roomName) + ', ' + (b.date === today() ? 'today, ' : '') + esc(dayLabel(b.date)) + ', ' + clock(b.start) + ' to ' + clock(b.start + b.hours) + '</p></div>' +
      '<p class="k-rcpt__ref' + (void_ ? ' is-void' : '') + '"><span>Reference</span><strong data-ref>' + esc(b.id) + '</strong></p></div>' +
      '<dl class="k-rcpt__dl">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';

    if (st === 'confirmed') html += '<p class="k-rcpt__note">Show the reference at the counter. Please arrive 10 minutes early. We hold the room until ' + W.fmtClock(pad(b.start) + ':15') + '.</p>';
    if (S.cancelled[ctx] && st === 'cancelled') html += '<p class="k-rcpt__note">Done. The ' + esc(b.roomName) + ' is free again for ' + clock(b.start) + ' on ' + esc(dayLabel(b.date)) + '.</p>';

    var acts = [];
    if (st === 'confirmed' || st === 'checked-in') acts.push('<button type="button" class="kbtn kbtn--gold" data-act="ics" data-id="' + esc(b.id) + '" data-key="ics-' + ctx + '">Add to calendar</button>');
    acts.push('<a class="kbtn kbtn--line" href="../portal/#karaoke">Manage in the customer portal</a>');
    if (canCancel(b) && !S.ask[ctx]) acts.push('<button type="button" class="k-link" data-act="ask" data-ctx="' + ctx + '" data-key="ask-' + ctx + '">Cancel booking</button>');
    if (fresh) acts.push('<button type="button" class="k-link k-link--quiet" data-act="again" data-key="again">Book another room</button>');
    html += '<div class="k-rcpt__actions">' + acts.join('') + '</div>';

    if (canCancel(b) && S.ask[ctx]) {
      html += '<div class="k-rcpt__ask" role="group" aria-labelledby="ask-' + ctx + '"><p id="ask-' + ctx + '">Cancel ' + esc(b.id) + ', the ' + esc(b.roomName) + ' on ' + esc(dayLabel(b.date)) + ' at ' + clock(b.start) + '? The room goes back on sale straight away.</p>' +
        '<div><button type="button" class="kbtn kbtn--danger" data-act="cancel" data-ctx="' + ctx + '" data-id="' + esc(b.id) + '" data-key="cancel-' + ctx + '">Yes, cancel it</button>' +
        '<button type="button" class="k-link" data-act="keep" data-ctx="' + ctx + '" data-key="keep-' + ctx + '">Keep my booking</button></div>' +
        '<p class="k-err" data-cancel-err></p></div>';
    }
    return html + '</article>';
  }

  function renderDone() {
    var form = $('#k-form'), done = $('#k-done');
    var b = S.doneId ? W.karaokeBooking(S.doneId) : null;
    if (!b) { S.doneId = null; shownId.done = null; form.hidden = false; done.hidden = true; swap(done, ''); return; }
    form.hidden = true; done.hidden = false;
    swap(done, receipt(b, 'done'));
  }
  function renderFound() {
    var box = $('#k-found');
    var b = S.foundId ? W.karaokeBooking(S.foundId) : null;
    if (!b) shownId.found = null;
    swap(box, b ? receipt(b, 'found') : '');
  }

  /* ------------------------------------------------------------------ */
  /* Calendar file                                                       */
  /* ------------------------------------------------------------------ */
  function icsFor(b) {
    var s = startTs(b.date, b.start), e = s + b.hours * 36e5;
    var f = function (ts) { return new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var x = function (v) { return String(v).replace(/\u00a0/g, ' ').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); };
    var desc = 'Booking ' + b.id + '. ' + b.roomName + ' for ' + plural(b.guests, 'person', 'people') + ', ' + clock(b.start) + ' to ' + clock(b.start + b.hours) + ' (Malé time). ' +
      money(b.total) + ', pay at the café, plus 10% service charge and 8% GST. Please arrive 10 minutes early. Manage or cancel: ' + new URL('./?ref=' + b.id + '#find', location.href).href;
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//White Coffee House//Karaoke booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', 'UID:' + b.id + '-' + b.createdAt + '@whitecoffeehouse.mv', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(s), 'DTEND:' + f(e),
      'SUMMARY:' + x('Karaoke at White Coffee House, ' + b.roomName + ' (' + b.id + ')'),
      'LOCATION:' + x('White Coffee House, Hulhumalé, Maldives'), 'DESCRIPTION:' + x(desc), 'STATUS:CONFIRMED',
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:' + x('Karaoke at White Coffee House in an hour'), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'];
    // Fold long lines at 73 characters (RFC 5545 asks for 75 octets).
    return lines.map(function (l) { var out = []; while (l.length > 73) { out.push(l.slice(0, 73)); l = ' ' + l.slice(73); } out.push(l); return out.join('\r\n'); }).join('\r\n') + '\r\n';
  }
  function downloadIcs(id) {
    var b = W.karaokeBooking(id); if (!b) return;
    var blob = new Blob([icsFor(b)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = doc.createElement('a');
    a.href = url; a.download = 'white-coffee-house-' + b.id + '.ics'; a.rel = 'noopener';
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ------------------------------------------------------------------ */
  /* URL: deep links in, quiet sync out                                  */
  /* ------------------------------------------------------------------ */
  function readURL() {
    var q = new URLSearchParams(location.search), note = '';
    var g = parseInt(q.get('guests'), 10); if (g >= 1) S.guests = Math.min(g, maxGuests());
    var rid = (q.get('room') || '').toLowerCase();
    if (rid) {
      var r = W.karaokeRoom(rid);
      if (r && r.active) { S.roomId = r.id; if (!q.get('guests') && S.guests > r.capacity) S.guests = Math.min(S.guests, r.capacity); }
    }
    var d = q.get('date');
    if (d) { if (validDate(d)) { S.date = d; S.dateChosen = true; } else note = d < today() ? 'That date has passed, so we picked the first date you can book.' : 'Online booking opens ' + R.daysAhead + ' days ahead, so we picked the first date you can book.'; }
    var st = parseInt(q.get('start'), 10);
    if (st >= R.open && st < R.close) { S.start = st; S.dateChosen = true; var hh = parseInt(q.get('hours'), 10); if (hh >= 1) S.hours = hh; }
    if (note) $('#e-date').textContent = note;
    return q;
  }
  function syncURL() {
    if (!S.urlSync || !history.replaceState) return;
    var q = new URLSearchParams();
    if (S.roomId) q.set('room', S.roomId);
    q.set('date', S.date);
    try { history.replaceState(null, '', '?' + q.toString() + '#book'); } catch (e) { /* file:// or sandbox */ }
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */
  function changed(urlToo) {
    if ($('#k-formerr').dataset.kind === 'store') setFormError('');
    reconcile('user'); render(); if (urlToo) { S.urlSync = true; syncURL(); } }

  $('#k-dates').addEventListener('click', function (e) {
    var b = e.target.closest('[data-date]'); if (!b) return;
    S.date = b.getAttribute('data-date'); S.dateChosen = true; S.noteTime = ''; S.noteRoom = ''; $('#e-date').textContent = '';
    changed(true);
  });
  $('#f-date').addEventListener('change', function () {
    var v = this.value, err = $('#e-date');
    if (!v) return;
    if (!validDate(v)) { err.textContent = 'Pick a date from ' + dayLabel(today()) + ' to ' + dayLabel(lastDay()) + '.'; return; }
    err.textContent = ''; S.date = v; S.dateChosen = true; S.noteTime = ''; S.noteRoom = '';
    changed(true);
  });
  $('.k-step').addEventListener('click', function (e) {
    var b = e.target.closest('[data-guests]'); if (!b || b.disabled) return;
    S.guests += +b.getAttribute('data-guests'); S.noteRoom = '';
    changed(false);
  });
  $('#k-opts').addEventListener('click', function (e) {
    var b = e.target.closest('[data-room]'); if (!b || b.disabled) return;
    S.roomId = b.getAttribute('data-room'); S.noteRoom = ''; S.noteTime = '';
    changed(true);
  });
  $('#k-grid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-hour]'); if (!b || b.disabled) return;
    var h = +b.getAttribute('data-hour'); S.noteTime = ''; S.dateChosen = true;
    if (S.start !== h) { S.start = h; var mx = maxHours(h); S.hours = Math.min(S.hours || 2, mx) || Math.min(2, mx); }
    changed(false);
  });
  $('#k-hours').addEventListener('click', function (e) {
    var b = e.target.closest('[data-hours]'); if (!b || b.disabled) return;
    S.hours = +b.getAttribute('data-hours'); S.noteTime = '';
    changed(false);
  });
  $('#k-roomlist').addEventListener('click', function (e) {
    var a = e.target.closest('[data-pick-room]'); if (!a) return;
    e.preventDefault();
    var r = W.karaokeRoom(a.getAttribute('data-pick-room')); if (!r) return;
    if (S.guests > r.capacity) S.guests = r.capacity;
    S.roomId = r.id; S.noteRoom = ''; S.noteTime = ''; S.doneId = null;
    changed(true);
    $('#book').scrollIntoView({ behavior: smooth(), block: 'start' });
    var opt = $('#k-opts [data-room="' + r.id + '"]'); if (opt) opt.focus({ preventScroll: true });
  });
  ['name', 'phone', 'email'].forEach(function (k) {
    var i = $('#f-' + k);
    i.addEventListener('blur', function () { if (i.value.trim()) { S.touched[k] = true; renderErrors(); } });
    i.addEventListener('input', function () { if (S.tried || S.touched[k]) renderErrors(); if (k === 'name') $('#v-you').textContent = i.value.trim(); });
  });
  $('#k-member').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    S.unlinked = b.getAttribute('data-act') === 'unlink';
    renderMember();
  });

  $('#k-form').addEventListener('submit', function (e) {
    e.preventDefault();
    S.tried = true; setFormError('');
    reconcile('user'); render();
    var errs = errors(), keys = Object.keys(errs);
    if (keys.length) {
      setFormError(summary(errs), 'check');
      var first = { room: '#k-opts .k-opt:not([disabled])', time: '#k-grid .k-slot:not([disabled])', hours: '#k-hours .k-hr:not([disabled])', name: '#f-name', phone: '#f-phone', email: '#f-email' }[keys[0]];
      var el = $(first); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: smooth(), block: 'center' }); }
      return;
    }
    var m = linkedMember(), r = room(), b;
    booking = true;
    try {
      b = W.bookKaraoke({ roomId: r.id, date: S.date, start: S.start, hours: S.hours, guests: S.guests,
        name: $('#f-name').value.trim(), phone: phoneValue($('#f-phone').value), email: $('#f-email').value.trim(),
        notes: $('#f-notes').value.trim(), memberId: m ? m.id : null, source: 'Online' });
    } catch (err) {
      booking = false;
      var msg = err && err.message ? err.message : 'Something went wrong. Please try again.';
      setFormError(msg, 'store');
      if (/booked|taken/i.test(msg)) { reconcile('store'); render(); var g = $('#k-grid'); g.scrollIntoView({ behavior: smooth(), block: 'center' }); }
      else render();
      return;
    }
    booking = false;
    remember(b.id);
    S.doneId = b.id; S.ask.done = false; S.cancelled.done = false;
    S.start = null; S.hours = null; S.tried = false; S.touched = {}; S.noteTime = '';
    $('#f-notes').value = '';
    setFormError('');
    render();
    var bookTop = $('#book');
    bookTop.scrollIntoView({ behavior: smooth(), block: 'start' });
    var h = $('#rc-done'); if (h) h.focus({ preventScroll: true });
  });

  function onReceipt(e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), ctx = b.getAttribute('data-ctx');
    if (act === 'ics') downloadIcs(b.getAttribute('data-id'));
    else if (act === 'ask') { S.ask[ctx] = true; render(); var y = $('[data-key="cancel-' + ctx + '"]'); if (y) y.focus(); }
    else if (act === 'keep') { S.ask[ctx] = false; render(); var k = $('[data-key="ask-' + ctx + '"]'); if (k) k.focus(); }
    else if (act === 'cancel') {
      try { W.cancelKaraoke(b.getAttribute('data-id'), 'Guest'); S.ask[ctx] = false; S.cancelled[ctx] = true; render(); var t = $('#rc-' + ctx); if (t) t.focus(); }
      catch (err) { var p = b.closest('.k-rcpt__ask').querySelector('[data-cancel-err]'); if (p) p.textContent = err.message; }
    } else if (act === 'again') {
      S.doneId = null; render();
      var day = $('#k-dates [aria-pressed="true"]') || $('#k-dates .k-day');
      $('#book').scrollIntoView({ behavior: smooth(), block: 'start' });
      if (day) day.focus({ preventScroll: true });
    }
  }
  $('#k-done').addEventListener('click', onReceipt);
  $('#k-found').addEventListener('click', onReceipt);

  $('#k-findform').addEventListener('submit', function (e) {
    e.preventDefault();
    var refIn = $('#f-ref'), phIn = $('#f-fphone'), ref = normRef(refIn.value), ok = true;
    var out = $('#k-finderr'); out.textContent = '';
    $('#e-ref').textContent = ''; $('#e-fphone').textContent = '';
    refIn.removeAttribute('aria-invalid'); phIn.removeAttribute('aria-invalid');
    if (!ref) { $('#e-ref').textContent = 'Enter your reference, like K-2146.'; refIn.setAttribute('aria-invalid', 'true'); ok = false; }
    if (digits(phIn.value).length < 7) { $('#e-fphone').textContent = 'Enter the phone number you booked with.'; phIn.setAttribute('aria-invalid', 'true'); ok = false; }
    if (!ok) { S.foundId = null; renderFound(); (refIn.getAttribute('aria-invalid') ? refIn : phIn).focus(); return; }
    var b = W.karaokeBooking(ref);
    if (!b || last7(b.phone) !== last7(phIn.value)) {
      S.foundId = null; renderFound();
      out.textContent = 'We couldn\'t find ' + ref + ' with that phone number. Check both and try again, or ask us at the counter.';
      return;
    }
    refIn.value = b.id;
    S.foundId = b.id; S.ask.found = false; S.cancelled.found = false;
    renderFound();
    var t = $('#rc-found'); if (t) t.focus();
  });

  $('#k-barbtn').addEventListener('click', function () {
    var errs = errors(), keys = Object.keys(errs);
    if (!keys.length) { var f = $('#k-form'); if (f.requestSubmit) f.requestSubmit(); else $('#k-submit').click(); return; }
    var target = { room: '#k-opts', time: '#k-grid', hours: '#k-hours', name: '#f-name', phone: '#f-phone', email: '#f-email' }[keys[0]];
    var el = $(target); if (!el) return;
    el.scrollIntoView({ behavior: smooth(), block: 'center' });
    var focusable = el.matches('input, textarea') ? el : el.querySelector('button:not([disabled])');
    if (focusable) focusable.focus({ preventScroll: true });
  });
  addEventListener('scroll', barVisibility, { passive: true });
  addEventListener('resize', barVisibility);

  function smooth() { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }

  /* ------------------------------------------------------------------ */
  /* Live: other tabs, staff, the clock                                  */
  /* ------------------------------------------------------------------ */
  W.subscribe(function (d, info) {
    if (booking) return;
    reconcile(info && info.remote ? 'remote' : 'local');
    render();
  });
  setInterval(function () { reconcile('tick'); render(); }, 30000);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) { reconcile('tick'); render(); } });

  /* ------------------------------------------------------------------ */
  /* Start                                                               */
  /* ------------------------------------------------------------------ */
  var q = readURL();
  if (!S.roomId) { var first = smallestFit(S.guests); S.roomId = first ? first.id : null; }
  reconcile('init');
  render();

  // Selected day visible in the strip without moving the page.
  (function () {
    var strip = $('#k-dates'), on = strip.querySelector('[aria-pressed="true"]');
    if (on && on.offsetLeft + on.offsetWidth > strip.clientWidth) strip.scrollLeft = on.offsetLeft - 16;
  })();

  var ref = q.get('ref');
  if (ref) {
    var id = normRef(ref), bk = W.karaokeBooking(id), m = member();
    $('#f-ref').value = id || ref;
    if (bk && (mine().indexOf(bk.id) > -1 || (m && bk.memberId === m.id))) { S.foundId = bk.id; renderFound(); }
    requestAnimationFrame(function () {
      $('#find').scrollIntoView({ block: 'start' });
      var target = S.foundId ? $('#rc-found') : $('#f-fphone'); if (target) target.focus({ preventScroll: true });
    });
  } else if (location.hash && location.hash.length > 1) {
    var tgt = doc.getElementById(location.hash.slice(1));
    if (tgt) requestAnimationFrame(function () { tgt.scrollIntoView({ block: 'start' }); });
  }

  /* ------------------------------------------------------------------ */
  /* Header: the website's mobile sheet (site.js), same behaviour:       */
  /* focus moves in, Tab is trapped, the page behind is inert and does   */
  /* not scroll, Escape closes and returns focus to the toggle.          */
  /* ------------------------------------------------------------------ */
  function initHeader() {
    var root = doc.documentElement, header = $('#site-header'), toggle = $('#menu-btn'), sheet = $('#menu-sheet');
    if (!header || !toggle || !sheet) return;
    var open = false, outside = [$('#main'), $('.kfoot'), $('.k-skip')].filter(Boolean);
    function sync() {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    }
    function set(o, returnFocus) {
      if (o === open) return;
      open = o; sync();
      header.classList.toggle('is-open', o); sheet.classList.toggle('is-open', o);
      root.classList.toggle('menu-locked', o);
      outside.forEach(function (el) { el.inert = o; });
      if (o) { var first = sheet.querySelector('.sheet__link'); if (first) requestAnimationFrame(function () { first.focus({ preventScroll: true }); }); }
      else if (returnFocus) toggle.focus({ preventScroll: true });
    }
    toggle.addEventListener('click', function () { set(!open); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    doc.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); set(false, true); return; }
      if (e.key !== 'Tab') return;
      var list = $$('a[href], button:not([disabled])', header).concat($$('a[href], button:not([disabled])', sheet))
        .filter(function (el) { return el.getClientRects().length > 0; });
      if (!list.length) return;
      // Move focus ourselves on every Tab: Safari skips links by default, so leaving it to the
      // browser would let focus fall out of the sheet onto the (inert) page.
      e.preventDefault();
      var i = list.indexOf(doc.activeElement), n = list.length;
      list[i === -1 ? (e.shiftKey ? n - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + n) % n].focus();
    }, true);
    var mq = matchMedia('(min-width: 821px)');
    var onMq = function (e) { if (e.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
    sync();
  }
})();
