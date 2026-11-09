/* ==========================================================================
   White Coffee House — shared demo data store (window.WCH)
   --------------------------------------------------------------------------
   One localStorage document shared by the website, the customer portal and
   the admin portal. Everything is a MOCKUP: no server, no real accounts.
   Changes made in one tab reach the others live through the `storage` event,
   so you can open /admin/ and /portal/ side by side and watch beans land.

   Single source of truth for: menu + prices, opening hours, contact,
   White Rewards rules (earning, tiers, stamps, rewards), members, activity.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'wch.v1';
  var VERSION = 3;
  var DAY = 864e5;

  /* ------------------------------------------------------------------ */
  /* Business facts                                                      */
  /* ------------------------------------------------------------------ */
  var INFO = {
    name: 'White Coffee House',
    tagline: 'Good coffee. Great food. Better vibes.',
    city: 'Hulhumalé, Maldives',
    address: 'Hulhumalé, Maldives',            // TODO(client): exact street + building
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=White+Coffee+House+Hulhumal%C3%A9',
    phone: '+960 000 0000',                     // TODO(client)
    phoneHref: 'tel:+9600000000',
    whatsapp: 'https://wa.me/9600000000',        // TODO(client)
    email: 'hello@whitecoffeehouse.mv',          // TODO(client): placeholder
    instagram: 'https://www.instagram.com/whitecoffeehousemv/',
    instagramHandle: '@whitecoffeehousemv',
    tiktok: 'https://www.tiktok.com/@whitecoffeehouse.mv',
    tiktokHandle: '@whitecoffeehouse.mv',
    hoursNote: 'Soft opening',
    // Every day, 16:00 – 24:00 Malé time (UTC+5). Days: 0 = Sunday.
    hours: [0, 1, 2, 3, 4, 5, 6].map(function (d) { return { day: d, open: '16:00', close: '24:00' }; }),
    utcOffsetMinutes: 300
  };

  /* ------------------------------------------------------------------ */
  /* Menu (all prices are placeholders until the client sends theirs)    */
  /* ------------------------------------------------------------------ */
  var MENU_CATEGORIES = [
    { id: 'coffee', name: 'Coffee', blurb: 'Espresso drinks, pulled to order.' },
    { id: 'cold', name: 'Iced & cold', blurb: 'For Hulhumalé afternoons.' },
    { id: 'notcoffee', name: 'Not coffee', blurb: 'Matcha, chocolate, chai and fresh coolers.' },
    { id: 'food', name: 'Food', blurb: 'Bagels, toasts and plates, served until close.' },
    { id: 'sweets', name: 'Sweets', blurb: 'Baked every afternoon.' }
  ];

  var MENU = [
    // Coffee
    { id: 'espresso', cat: 'coffee', name: 'Espresso', desc: 'A short, syrupy double shot.', price: 35 },
    { id: 'americano', cat: 'coffee', name: 'Americano', desc: 'Double shot, hot water, clean finish.', price: 45 },
    { id: 'cappuccino', cat: 'coffee', name: 'Cappuccino', desc: 'Equal parts espresso, milk and foam.', price: 55 },
    { id: 'latte', cat: 'coffee', name: 'Café latte', desc: 'Silky steamed milk over a double shot.', price: 60 },
    { id: 'flatwhite', cat: 'coffee', name: 'Flat white', desc: 'Less milk, more coffee, fine microfoam.', price: 60 },
    { id: 'spanish', cat: 'coffee', name: 'Spanish latte', desc: 'Condensed milk sweetness, slow-poured.', price: 70 },
    { id: 'whitelatte', cat: 'coffee', name: 'The White Latte', desc: 'House signature: white chocolate, vanilla bean, double shot.', price: 75, signature: true },
    { id: 'pistachio', cat: 'coffee', name: 'Pistachio latte', desc: 'Roasted pistachio cream and espresso.', price: 80 },
    // Iced & cold
    { id: 'icedlatte', cat: 'cold', name: 'Iced latte', desc: 'Double shot over cold milk and ice.', price: 65 },
    { id: 'icedspanish', cat: 'cold', name: 'Iced Spanish latte', desc: 'Our most-ordered cold coffee.', price: 75, signature: true },
    { id: 'coldbrew', cat: 'cold', name: 'Cold brew', desc: 'Steeped for 18 hours. Smooth and bright.', price: 60 },
    { id: 'icedmatcha', cat: 'cold', name: 'Iced matcha latte', desc: 'Ceremonial-grade matcha, milk, ice.', price: 75 },
    { id: 'affogato', cat: 'cold', name: 'Affogato', desc: 'Vanilla gelato drowned in espresso.', price: 70 },
    // Not coffee
    { id: 'matcha', cat: 'notcoffee', name: 'Matcha latte', desc: 'Whisked to order, lightly sweet.', price: 70 },
    { id: 'chocolate', cat: 'notcoffee', name: 'Hot chocolate', desc: 'Dark chocolate melted into steamed milk.', price: 60 },
    { id: 'chai', cat: 'notcoffee', name: 'Chai latte', desc: 'Warm spice, black tea, steamed milk.', price: 65 },
    { id: 'minlime', cat: 'notcoffee', name: 'Mint lime cooler', desc: 'Fresh lime, mint, soda, crushed ice.', price: 50 },
    { id: 'juice', cat: 'notcoffee', name: 'Fresh juice', desc: 'Watermelon, pineapple or orange.', price: 55 },
    // Food
    { id: 'salmonbagel', cat: 'food', name: 'Smoked salmon bagel', desc: 'Cream cheese, capers, red onion, dill.', price: 125, signature: true },
    { id: 'chickenbagel', cat: 'food', name: 'Chicken pesto bagel', desc: 'Grilled chicken, basil pesto, rocket, tomato.', price: 110 },
    { id: 'eggbagel', cat: 'food', name: 'Egg & cheese bagel', desc: 'Soft scrambled eggs, cheddar, chives.', price: 85 },
    { id: 'avotoast', cat: 'food', name: 'Avocado toast', desc: 'Sourdough, smashed avocado, poached egg, chilli.', price: 115 },
    { id: 'benedict', cat: 'food', name: 'Eggs Benedict', desc: 'Poached eggs, hollandaise, toasted muffin.', price: 125 },
    { id: 'noodles', cat: 'food', name: 'Wok-fried noodles', desc: 'Egg noodles, vegetables, chicken, house sambal.', price: 110 },
    { id: 'club', cat: 'food', name: 'Club sandwich', desc: 'Chicken, egg, lettuce, tomato, fries on the side.', price: 120 },
    // Sweets
    { id: 'croissant', cat: 'sweets', name: 'Butter croissant', desc: 'Flaky, golden, best with a flat white.', price: 45 },
    { id: 'almondcroissant', cat: 'sweets', name: 'Almond croissant', desc: 'Twice-baked with almond cream.', price: 60 },
    { id: 'cheesecake', cat: 'sweets', name: 'Basque cheesecake', desc: 'Burnt top, creamy centre.', price: 75, signature: true },
    { id: 'cinnamon', cat: 'sweets', name: 'Cinnamon roll', desc: 'Brown sugar swirl, cream cheese glaze.', price: 50 },
    { id: 'cookie', cat: 'sweets', name: 'Chocolate chip cookie', desc: 'Crisp edge, soft middle, sea salt.', price: 35 }
  ];

  /* ------------------------------------------------------------------ */
  /* White Rewards rules                                                 */
  /* ------------------------------------------------------------------ */
  var PROGRAM = {
    name: 'White Rewards',
    unit: 'beans',                 // points are called beans
    mvrPerBean: 5,                 // 1 bean for every MVR 5 spent
    welcomeBonus: 50,
    birthdayBonus: 100,
    referralBonus: 50,
    stampsForFree: 10,             // every 10th handcrafted drink is free
    redemptionMinutes: 15,         // a redemption code stays valid this long
    tiers: [
      { id: 'house', name: 'House', min: 0, mult: 1, perks: ['1 bean for every MVR 5', 'A free drink on your birthday', 'Member-only offers'] },
      { id: 'gold', name: 'Gold', min: 500, mult: 1.25, perks: ['1.25× beans on everything', 'Free size upgrade, every visit', 'Early taste of new menu items'] },
      { id: 'white', name: 'White', min: 1200, mult: 1.5, perks: ['1.5× beans on everything', 'One free drink every month', 'Invites to tasting evenings'] }
    ]
  };

  var REWARDS = [
    { id: 'r-espresso', name: 'Espresso or Americano', cost: 100, kind: 'drink', active: true },
    { id: 'r-pastry', name: 'Croissant or cookie', cost: 120, kind: 'food', active: true },
    { id: 'r-hot', name: 'Any hot drink', cost: 150, kind: 'drink', active: true },
    { id: 'r-iced', name: 'Any iced drink', cost: 180, kind: 'drink', active: true },
    { id: 'r-cake', name: 'Slice of Basque cheesecake', cost: 200, kind: 'food', active: true },
    { id: 'r-friend', name: 'Two drinks — bring a friend', cost: 280, kind: 'drink', active: true },
    { id: 'r-brunch', name: 'Any bagel or brunch plate', cost: 400, kind: 'food', active: true }
  ];

  var OFFERS = [
    { id: 'o-double', title: 'Double beans, 4–6 PM', body: 'Every weekday at opening, every bean counts twice.', active: true },
    { id: 'o-bday', title: 'Birthday on us', body: 'Members get 100 beans and a free drink in their birthday week.', active: true },
    { id: 'o-friend', title: 'Bring a friend', body: 'Invite a friend to White Rewards — you both get 50 beans after their first visit.', active: true }
  ];

  /* ------------------------------------------------------------------ */
  /* Deterministic demo seed                                             */
  /* ------------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var SEED_MEMBERS = [
    ['Aisha Ibrahim', '+960 771 2408', 'aisha.ibrahim@example.mv', '03-14', 'Iced Spanish latte'],
    ['Mohamed Shifaz', '+960 790 1123', 'shifaz@example.mv', '07-02', 'Flat white'],
    ['Fathimath Zeena', '+960 762 8841', 'zeena.f@example.mv', '11-21', 'The White Latte'],
    ['Ahmed Rasheed', '+960 777 3390', 'a.rasheed@example.mv', '01-09', 'Americano'],
    ['Mariyam Shiuna', '+960 793 5512', 'shiuna@example.mv', '05-30', 'Matcha latte'],
    ['Hassan Nazeer', '+960 748 2205', 'hnazeer@example.mv', '09-17', 'Cold brew'],
    ['Aminath Liusha', '+960 765 9034', 'liusha@example.mv', '12-03', 'Pistachio latte'],
    ['Ibrahim Shareef', '+960 772 6618', 'ishareef@example.mv', '04-25', 'Espresso'],
    ['Hawwa Nashfa', '+960 799 4470', 'nashfa@example.mv', '08-11', 'Spanish latte'],
    ['Ali Waheed', '+960 781 0956', 'ali.waheed@example.mv', '02-27', 'Cappuccino'],
    ['Zahra Adam', '+960 754 3381', 'zahra.adam@example.mv', '06-19', 'Iced matcha latte'],
    ['Ismail Hameed', '+960 768 7723', 'ihameed@example.mv', '10-05', 'Café latte'],
    ['Shaheema Ali', '+960 790 8812', 'shaheema@example.mv', '03-08', 'Chai latte'],
    ['Yoosuf Naseem', '+960 777 5049', 'ynaseem@example.mv', '11-12', 'Iced latte'],
    ['Mariyam Hana', '+960 762 1187', 'hana.m@example.mv', '07-23', 'Hot chocolate'],
    ['Abdulla Zuhair', '+960 795 6630', 'zuhair@example.mv', '01-31', 'Flat white'],
    ['Aishath Raya', '+960 749 2268', 'raya@example.mv', '09-02', 'The White Latte'],
    ['Hussain Faisal', '+960 783 4415', 'hfaisal@example.mv', '05-14', 'Americano'],
    ['Nuha Moosa', '+960 771 9902', 'nuha@example.mv', '12-24', 'Iced Spanish latte'],
    ['Imran Latheef', '+960 766 3357', 'imran.l@example.mv', '04-04', 'Cold brew'],
    ['Sara Ahmed', '+960 797 0841', 'sara.ahmed@example.mv', '08-29', 'Pistachio latte'],
    ['Moosa Fahmy', '+960 758 6624', 'mfahmy@example.mv', '06-06', 'Espresso'],
    ['Lamya Hassan', '+960 774 1196', 'lamya@example.mv', '02-10', 'Matcha latte'],
    ['Riyaz Mohamed', '+960 789 5573', 'riyaz@example.mv', '10-28', 'Cappuccino']
  ];
  var STAFF = ['Shazna', 'Ameen', 'Rifa', 'Nadheem'];
  var DRINK_IDS = MENU.filter(function (m) { return m.cat !== 'food' && m.cat !== 'sweets'; }).map(function (m) { return m.id; });
  var FOOD_IDS = MENU.filter(function (m) { return m.cat === 'food' || m.cat === 'sweets'; }).map(function (m) { return m.id; });

  function menuById(id) { for (var i = 0; i < MENU.length; i++) if (MENU[i].id === id) return MENU[i]; return null; }

  function seed(now) {
    var rnd = mulberry32(20261109);
    var start = startOfMaleDay(now) - 100 * DAY;  // ~3 months of demo history
    var doc = {
      version: VERSION,
      seededAt: now,
      program: clone(PROGRAM),
      menuCategories: clone(MENU_CATEGORIES),
      menu: MENU.map(function (m) { var c = clone(m); c.available = true; return c; }),
      rewards: clone(REWARDS),
      offers: clone(OFFERS),
      members: [],
      activity: [],
      redemptions: [],
      nextMemberNo: 100001,
      session: { memberId: null, staff: null }
    };
    // Members join over the first weeks, then visit 0–4 times a week.
    SEED_MEMBERS.forEach(function (row, i) {
      var joined = Math.round(start + (i === 0 ? 2 : Math.floor(rnd() * 70)) * DAY + (16 + rnd() * 7) * 36e5);
      var m = newMember(doc, { name: row[0], phone: row[1], email: row[2], birthday: row[3] }, joined, 'Seed');
      m.favourite = row[4];
      var heavy = i === 0 ? 0.3 : 0.08 + rnd() * 0.5;     // Aisha (demo account) is a regular
      for (var t = joined + DAY; t < now - 36e5; t += DAY) {
        if (rnd() < heavy) {
          var ts = Math.round(startOfMaleDay(t) + (16 + rnd() * 7.8) * 36e5);   // 4 PM – ~11:50 PM Malé
          if (ts > now - 6e5) break;
          var drinks = 1 + (rnd() < 0.3 ? 1 : 0);
          var items = [];
          for (var d = 0; d < drinks; d++) items.push(DRINK_IDS[Math.floor(rnd() * DRINK_IDS.length)]);
          if (rnd() < 0.55) items.push(FOOD_IDS[Math.floor(rnd() * FOOD_IDS.length)]);
          var amount = items.reduce(function (s, id) { return s + menuById(id).price; }, 0);
          earnInto(doc, m, { amount: amount, drinks: drinks, items: items.map(function (id) { return menuById(id).name; }), staff: STAFF[Math.floor(rnd() * STAFF.length)] }, ts);
          // Occasionally redeem something they can afford
          if (m.freeDrinks > 0 && rnd() < 0.6) {
            m.freeDrinks -= 1;
            pushActivity(doc, { type: 'free', memberId: m.id, beans: 0, note: 'Free drink from coffee card', staff: STAFF[Math.floor(rnd() * STAFF.length)] }, ts + 3e4);
          }
          if (m.beans >= 150 && rnd() < (i === 0 ? 0.16 : 0.12)) {
            var affordable = doc.rewards.filter(function (r) { return r.cost <= m.beans; });
            var r = affordable[Math.floor(rnd() * affordable.length)];
            var red = redeemInto(doc, m, r, ts + 6e4);
            red.status = 'served'; red.servedAt = ts + 4 * 6e4; red.servedBy = STAFF[Math.floor(rnd() * STAFF.length)];
          }
        }
      }
    });
    // The demo customer (Aisha) is a regular mid-way through her coffee card.
    var demo = doc.members[0];
    if (demo.stamps < 6) demo.stamps = 6;
    doc.activity.sort(function (a, b) { return b.ts - a.ts; });
    doc.redemptions.sort(function (a, b) { return b.ts - a.ts; });
    return doc;
  }

  /* ------------------------------------------------------------------ */
  /* Core mutations (operate on a doc)                                   */
  /* ------------------------------------------------------------------ */
  function newMember(doc, p, ts, staff) {
    var id = 'WCH-' + doc.nextMemberNo++;
    var m = {
      id: id,
      name: (p.name || '').trim() || 'Guest',
      phone: (p.phone || '').trim(),
      email: (p.email || '').trim(),
      birthday: p.birthday || '',
      joined: ts,
      beans: 0,
      lifetimeBeans: 0,
      stamps: 0,
      freeDrinks: 0,
      visits: 0,
      spend: 0,
      lastVisit: null,
      favourite: p.favourite || '',
      note: ''
    };
    doc.members.push(m);
    pushActivity(doc, { type: 'join', memberId: id, beans: 0, note: 'Joined White Rewards', staff: staff || 'Online' }, ts);
    if (doc.program.welcomeBonus) {
      m.beans += doc.program.welcomeBonus; m.lifetimeBeans += doc.program.welcomeBonus;
      pushActivity(doc, { type: 'bonus', memberId: id, beans: doc.program.welcomeBonus, note: 'Welcome bonus' }, ts + 1000);
    }
    return m;
  }

  function tierOf(doc, m) {
    var tiers = doc.program.tiers, t = tiers[0];
    for (var i = 0; i < tiers.length; i++) if (m.lifetimeBeans >= tiers[i].min) t = tiers[i];
    return t;
  }
  function nextTierOf(doc, m) {
    var tiers = doc.program.tiers;
    for (var i = 0; i < tiers.length; i++) if (m.lifetimeBeans < tiers[i].min) return tiers[i];
    return null;
  }

  function earnInto(doc, m, p, ts) {
    var amount = Math.max(0, Number(p.amount) || 0);
    var drinks = Math.max(0, Math.floor(Number(p.drinks) || 0));
    var tier = tierOf(doc, m);
    var base = Math.floor(amount / doc.program.mvrPerBean);
    var beans = Math.round(base * tier.mult);
    var multiplier = Number(p.multiplier) || 1;      // e.g. double-beans offer
    beans = Math.round(beans * multiplier);
    m.beans += beans; m.lifetimeBeans += beans;
    m.visits += 1; m.spend += amount; m.lastVisit = ts;
    var freeEarned = 0;
    m.stamps += drinks;
    while (m.stamps >= doc.program.stampsForFree) { m.stamps -= doc.program.stampsForFree; m.freeDrinks += 1; freeEarned++; }
    var a = pushActivity(doc, {
      type: 'earn', memberId: m.id, amount: amount, beans: beans, stamps: drinks,
      items: p.items || [], note: p.note || '', staff: p.staff || 'Counter', tier: tier.id, multiplier: multiplier
    }, ts);
    if (freeEarned) pushActivity(doc, { type: 'stamp', memberId: m.id, beans: 0, note: freeEarned === 1 ? 'Coffee card full — a free drink is waiting' : freeEarned + ' free drinks unlocked' }, ts + 500);
    return a;
  }

  function redeemInto(doc, m, r, ts) {
    if (!r) throw new Error('Unknown reward');
    if (!r.active) throw new Error('This reward is paused');
    if (m.beans < r.cost) throw new Error('Not enough beans yet');
    m.beans -= r.cost;
    var code = makeCode(doc, ts);
    var red = { code: code, memberId: m.id, rewardId: r.id, rewardName: r.name, cost: r.cost, ts: ts, expires: ts + doc.program.redemptionMinutes * 6e4, status: 'ready' };
    doc.redemptions.unshift(red);
    pushActivity(doc, { type: 'redeem', memberId: m.id, beans: -r.cost, note: r.name, code: code }, ts);
    return red;
  }

  function makeCode(doc, ts) {
    var alphabet = 'ACDEFGHJKLMNPQRTUVWXY3479';
    var x = (ts ^ (doc.redemptions.length * 2654435761)) >>> 0, s = '';
    var rnd = mulberry32(x);
    for (var i = 0; i < 4; i++) s += alphabet[Math.floor(rnd() * alphabet.length)];
    return 'W-' + s;
  }

  function pushActivity(doc, a, ts) {
    a.id = 'a' + ts.toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    a.ts = ts;
    doc.activity.unshift(a);
    if (doc.activity.length > 4000) doc.activity.length = 4000;
    return a;
  }

  /* ------------------------------------------------------------------ */
  /* Persistence + live sync                                             */
  /* ------------------------------------------------------------------ */
  var doc = null;
  var listeners = [];

  function read() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var d = JSON.parse(raw); if (d && d.version === VERSION) return d; } } catch (e) { /* storage blocked or corrupt */ }
    return null;
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(doc)); } catch (e) { /* private mode: keep in memory */ }
  }
  function load() {
    doc = read();
    if (!doc) { doc = seed(Date.now()); write(); }
    expireRedemptions();
    return doc;
  }
  function commit(reason) {
    write();
    emit(reason || 'change', false);
  }
  function emit(reason, remote) {
    for (var i = 0; i < listeners.length; i++) { try { listeners[i](doc, { reason: reason, remote: !!remote }); } catch (e) { console.error(e); } }
  }
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    var d = read();
    if (d) { doc = d; emit('remote', true); }
    else if (e.newValue === null) { load(); emit('reset', true); }
  });
  function expireRedemptions() {
    var now = Date.now(), changed = false;
    doc.redemptions.forEach(function (r) { if (r.status === 'ready' && r.expires < now) { r.status = 'expired'; changed = true; } });
    if (changed) write();
  }

  /* ------------------------------------------------------------------ */
  /* Time helpers (Malé is UTC+5, no DST)                                */
  /* ------------------------------------------------------------------ */
  function maleParts(ts) {
    var d = new Date((ts == null ? Date.now() : ts) + INFO.utcOffsetMinutes * 6e4);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), day: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
  }
  function startOfMaleDay(ts) {
    var p = maleParts(ts);
    return Date.UTC(p.y, p.mo, p.d) - INFO.utcOffsetMinutes * 6e4;
  }
  function toMinutes(hhmm) { var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function openStatus(ts) {
    var p = maleParts(ts), mins = p.h * 60 + p.mi;
    var today = INFO.hours.filter(function (h) { return h.day === p.day; })[0];
    if (today) {
      var o = toMinutes(today.open), c = toMinutes(today.close);
      if (mins >= o && mins < c) return { open: true, label: 'Open now', detail: 'until ' + fmtClock(today.close) };
      if (mins < o) return { open: false, label: 'Closed now', detail: 'opens today at ' + fmtClock(today.open) };
    }
    var tomorrow = INFO.hours.filter(function (h) { return h.day === (p.day + 1) % 7; })[0];
    return { open: false, label: 'Closed now', detail: tomorrow ? 'opens tomorrow at ' + fmtClock(tomorrow.open) : '' };
  }
  function fmtClock(hhmm) {
    var m = toMinutes(hhmm) % (24 * 60), h = Math.floor(m / 60), mi = m % 60;
    if (h === 0 && mi === 0) return 'midnight';
    var suf = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return h12 + (mi ? ':' + String(mi).padStart(2, '0') : '') + ' ' + suf;
  }

  /* ------------------------------------------------------------------ */
  /* Formatting                                                          */
  /* ------------------------------------------------------------------ */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtMVR(n) { return 'MVR ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function fmtNum(n) { return Number(n || 0).toLocaleString('en-US'); }
  function fmtDate(ts) { var p = maleParts(ts); return p.d + ' ' + MONTHS[p.mo] + ' ' + p.y; }
  function fmtShortDate(ts) { var p = maleParts(ts); return p.d + ' ' + MONTHS[p.mo]; }
  function fmtTime(ts) { var p = maleParts(ts); return fmtClock(String(p.h).padStart(2, '0') + ':' + String(p.mi).padStart(2, '0')).replace('midnight', '12 AM'); }
  function fmtDateTime(ts) { return fmtShortDate(ts) + ', ' + fmtTime(ts); }
  function fmtAgo(ts) {
    var s = Math.round((Date.now() - ts) / 1000);
    if (s < 45) return 'just now';
    var m = Math.round(s / 60); if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    var d = Math.round(h / 24); if (d < 7) return d === 1 ? 'yesterday' : d + ' days ago';
    return fmtShortDate(ts);
  }
  function fmtBirthday(mmdd) { if (!mmdd) return ''; var p = mmdd.split('-'); return (+p[1]) + ' ' + MONTHS[(+p[0]) - 1]; }
  function initials(name) { return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(''); }
  function escapeHTML(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */
  load();

  var WCH = {
    info: INFO,
    get doc() { return doc; },
    get program() { return doc.program; },

    /** Subscribe to every change (local or from another tab). Returns an unsubscribe fn. */
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    /** Wipe everything and reseed the demo data. */
    reset: function () { doc = seed(Date.now()); write(); emit('reset', false); },

    // Menu
    categories: function () { return doc.menuCategories; },
    menu: function (cat) { return doc.menu.filter(function (m) { return !cat || m.cat === cat; }); },
    menuItem: function (id) { return doc.menu.filter(function (m) { return m.id === id; })[0] || null; },
    updateMenuItem: function (id, patch) {
      var m = WCH.menuItem(id); if (!m) throw new Error('Unknown menu item');
      if ('price' in patch) { var p = Number(patch.price); if (!(p >= 0)) throw new Error('Price must be a number'); m.price = Math.round(p * 100) / 100; }
      if ('available' in patch) m.available = !!patch.available;
      if ('name' in patch && String(patch.name).trim()) m.name = String(patch.name).trim();
      if ('desc' in patch) m.desc = String(patch.desc);
      commit('menu'); return m;
    },

    // Hours
    openStatus: openStatus,
    maleParts: maleParts,
    fmtClock: fmtClock,

    // Members
    members: function () { return doc.members; },
    member: function (id) { return doc.members.filter(function (m) { return m.id === id; })[0] || null; },
    findMembers: function (q) {
      q = String(q || '').trim().toLowerCase(); if (!q) return doc.members.slice();
      var digits = q.replace(/\D/g, '');
      return doc.members.filter(function (m) {
        return m.name.toLowerCase().indexOf(q) > -1 || m.id.toLowerCase().indexOf(q) > -1 || m.email.toLowerCase().indexOf(q) > -1 ||
          (digits.length >= 3 && m.phone.replace(/\D/g, '').indexOf(digits) > -1);
      });
    },
    join: function (p) {
      if (!p || !String(p.name || '').trim()) throw new Error('Please enter a name');
      if (!String(p.phone || '').trim()) throw new Error('Please enter a phone number');
      var digits = String(p.phone).replace(/\D/g, '');
      var existing = doc.members.filter(function (m) { return m.phone.replace(/\D/g, '') === digits; })[0];
      if (existing) throw new Error('That phone number is already a member');
      var m = newMember(doc, p, Date.now(), p.staff);
      commit('join'); return m;
    },
    updateMember: function (id, patch) {
      var m = WCH.member(id); if (!m) throw new Error('Unknown member');
      ['name', 'phone', 'email', 'birthday', 'favourite', 'note'].forEach(function (k) { if (k in patch) m[k] = String(patch[k]); });
      commit('member'); return m;
    },
    tier: function (m) { return tierOf(doc, m); },
    nextTier: function (m) { return nextTierOf(doc, m); },
    /** Progress toward the next tier: {tier, next, have, need, pct} */
    tierProgress: function (m) {
      var t = tierOf(doc, m), n = nextTierOf(doc, m);
      if (!n) return { tier: t, next: null, have: m.lifetimeBeans, need: 0, pct: 1 };
      var span = n.min - t.min, have = m.lifetimeBeans - t.min;
      return { tier: t, next: n, have: m.lifetimeBeans, need: n.min - m.lifetimeBeans, pct: Math.max(0, Math.min(1, have / span)) };
    },
    /** Preview beans for a bill without saving. */
    previewEarn: function (memberId, amount, multiplier) {
      var m = WCH.member(memberId); if (!m) return 0;
      return Math.round(Math.round(Math.floor((Number(amount) || 0) / doc.program.mvrPerBean) * tierOf(doc, m).mult) * (Number(multiplier) || 1));
    },
    /** Staff records a visit: { amount (MVR), drinks, items[], note, staff, multiplier } */
    earn: function (memberId, p) {
      var m = WCH.member(memberId); if (!m) throw new Error('Unknown member');
      if (!(Number(p.amount) > 0)) throw new Error('Enter the bill amount');
      var a = earnInto(doc, m, p, Date.now()); commit('earn'); return a;
    },
    /** Manual adjustment (+/- beans) with a reason. */
    adjust: function (memberId, beans, note, staff) {
      var m = WCH.member(memberId); if (!m) throw new Error('Unknown member');
      beans = Math.round(Number(beans) || 0); if (!beans) throw new Error('Enter a number of beans');
      if (m.beans + beans < 0) throw new Error('Balance cannot go below zero');
      m.beans += beans; if (beans > 0) m.lifetimeBeans += beans;
      var a = pushActivity(doc, { type: beans > 0 ? 'bonus' : 'adjust', memberId: m.id, beans: beans, note: note || 'Adjustment', staff: staff || 'Admin' }, Date.now());
      commit('adjust'); return a;
    },
    /** Use one free drink from a full coffee card. */
    useFreeDrink: function (memberId, staff) {
      var m = WCH.member(memberId); if (!m) throw new Error('Unknown member');
      if (m.freeDrinks < 1) throw new Error('No free drink available');
      m.freeDrinks -= 1;
      var a = pushActivity(doc, { type: 'free', memberId: m.id, beans: 0, note: 'Free drink from coffee card', staff: staff || 'Counter' }, Date.now());
      commit('free'); return a;
    },

    // Rewards
    rewards: function (all) { return doc.rewards.filter(function (r) { return all || r.active; }).slice().sort(function (a, b) { return a.cost - b.cost; }); },
    reward: function (id) { return doc.rewards.filter(function (r) { return r.id === id; })[0] || null; },
    saveReward: function (r) {
      var cost = Math.round(Number(r.cost)); if (!(cost > 0)) throw new Error('Cost must be more than 0 beans');
      if (!String(r.name || '').trim()) throw new Error('Give the reward a name');
      var ex = r.id && WCH.reward(r.id);
      if (ex) { ex.name = String(r.name).trim(); ex.cost = cost; ex.kind = r.kind || ex.kind; if ('active' in r) ex.active = !!r.active; }
      else { ex = { id: 'r-' + Date.now().toString(36), name: String(r.name).trim(), cost: cost, kind: r.kind || 'drink', active: r.active !== false }; doc.rewards.push(ex); }
      commit('reward'); return ex;
    },
    redeem: function (memberId, rewardId) {
      var m = WCH.member(memberId); if (!m) throw new Error('Unknown member');
      var red = redeemInto(doc, m, WCH.reward(rewardId), Date.now()); commit('redeem'); return red;
    },
    redemptions: function (status) { expireRedemptions(); return doc.redemptions.filter(function (r) { return !status || r.status === status; }); },
    redemption: function (code) { code = String(code || '').trim().toUpperCase(); if (code && code.indexOf('W-') !== 0) code = 'W-' + code; return doc.redemptions.filter(function (r) { return r.code === code; })[0] || null; },
    /** Staff marks a reward code as handed over. */
    serve: function (code, staff) {
      var r = WCH.redemption(code); if (!r) throw new Error('No reward with that code');
      expireRedemptions();
      if (r.status === 'served') throw new Error('Already served');
      if (r.status === 'expired') throw new Error('This code has expired');
      r.status = 'served'; r.servedAt = Date.now(); r.servedBy = staff || 'Counter';
      pushActivity(doc, { type: 'served', memberId: r.memberId, beans: 0, note: r.rewardName + ' handed over', code: r.code, staff: r.servedBy }, Date.now());
      commit('serve'); return r;
    },
    /** Cancel a ready code and refund the beans. */
    cancelRedemption: function (code) {
      var r = WCH.redemption(code); if (!r || r.status !== 'ready') throw new Error('Only a ready code can be cancelled');
      var m = WCH.member(r.memberId); r.status = 'cancelled'; if (m) m.beans += r.cost;
      pushActivity(doc, { type: 'refund', memberId: r.memberId, beans: r.cost, note: r.rewardName + ' cancelled — beans returned', code: r.code }, Date.now());
      commit('cancel'); return r;
    },

    // Offers
    offers: function (all) { return doc.offers.filter(function (o) { return all || o.active; }); },
    saveOffer: function (o) {
      if (!String(o.title || '').trim()) throw new Error('Give the offer a title');
      var ex = o.id && doc.offers.filter(function (x) { return x.id === o.id; })[0];
      if (ex) { ex.title = String(o.title).trim(); ex.body = String(o.body || ''); if ('active' in o) ex.active = !!o.active; }
      else { ex = { id: 'o-' + Date.now().toString(36), title: String(o.title).trim(), body: String(o.body || ''), active: o.active !== false }; doc.offers.unshift(ex); }
      commit('offer'); return ex;
    },

    // Program settings
    updateProgram: function (patch) {
      var p = doc.program;
      if ('mvrPerBean' in patch) { var v = Number(patch.mvrPerBean); if (!(v > 0)) throw new Error('MVR per bean must be more than 0'); p.mvrPerBean = v; }
      ['welcomeBonus', 'birthdayBonus', 'referralBonus', 'stampsForFree'].forEach(function (k) { if (k in patch) { var n = Math.round(Number(patch[k])); if (!(n >= 0)) throw new Error(k + ' must be 0 or more'); p[k] = n; } });
      if (p.stampsForFree < 2) p.stampsForFree = 2;
      if (patch.tiers) patch.tiers.forEach(function (t) { var ex = p.tiers.filter(function (x) { return x.id === t.id; })[0]; if (ex) { if ('min' in t) ex.min = Math.max(0, Math.round(Number(t.min) || 0)); if ('mult' in t) ex.mult = Math.max(1, Number(t.mult) || 1); } });
      p.tiers.sort(function (a, b) { return a.min - b.min; }); p.tiers[0].min = 0;
      commit('program'); return p;
    },

    // Activity + stats
    activity: function (memberId, limit) {
      var list = memberId ? doc.activity.filter(function (a) { return a.memberId === memberId; }) : doc.activity;
      return limit ? list.slice(0, limit) : list;
    },
    /** Dashboard numbers. days = window for the daily series (default 14). */
    stats: function (days) {
      days = days || 14;
      var now = Date.now(), today = startOfMaleDay(now), weekAgo = now - 7 * DAY;
      var series = [];
      for (var i = days - 1; i >= 0; i--) series.push({ day: today - i * DAY, visits: 0, beans: 0, sales: 0, redemptions: 0 });
      var s = { members: doc.members.length, newThisWeek: 0, visitsToday: 0, salesToday: 0, beansToday: 0, visitsWeek: 0, beansWeek: 0, salesWeek: 0, redemptionsWeek: 0, outstandingBeans: 0, readyCodes: 0, series: series, tiers: {}, topRewards: [] };
      doc.program.tiers.forEach(function (t) { s.tiers[t.id] = 0; });
      doc.members.forEach(function (m) { s.outstandingBeans += m.beans; s.tiers[tierOf(doc, m).id]++; if (m.joined >= weekAgo) s.newThisWeek++; });
      var rewardCount = {};
      doc.activity.forEach(function (a) {
        var idx = Math.floor((startOfMaleDay(a.ts) - series[0].day) / DAY);
        var row = idx >= 0 && idx < series.length ? series[idx] : null;
        if (a.type === 'earn') {
          if (row) { row.visits++; row.beans += a.beans; row.sales += a.amount; }
          if (a.ts >= today) { s.visitsToday++; s.salesToday += a.amount; s.beansToday += a.beans; }
          if (a.ts >= weekAgo) { s.visitsWeek++; s.beansWeek += a.beans; s.salesWeek += a.amount; }
        } else if (a.type === 'redeem') {
          if (row) row.redemptions++;
          if (a.ts >= weekAgo) s.redemptionsWeek++;
          rewardCount[a.note] = (rewardCount[a.note] || 0) + 1;
        }
      });
      s.readyCodes = WCH.redemptions('ready').length;
      s.topRewards = Object.keys(rewardCount).map(function (k) { return { name: k, count: rewardCount[k] }; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
      return s;
    },

    // Sessions (mock sign-in)
    session: function () { return doc.session; },
    signInMember: function (memberId) { if (!WCH.member(memberId)) throw new Error('Unknown member'); doc.session.memberId = memberId; commit('session'); },
    signInByPhone: function (phone) {
      var digits = String(phone || '').replace(/\D/g, ''); if (digits.length < 7) throw new Error('Enter your phone number');
      var m = doc.members.filter(function (x) { var d = x.phone.replace(/\D/g, ''); return d === digits || d.slice(-7) === digits.slice(-7); })[0];
      if (!m) throw new Error('We could not find a member with that number');
      doc.session.memberId = m.id; commit('session'); return m;
    },
    signOutMember: function () { doc.session.memberId = null; commit('session'); },
    currentMember: function () { return doc.session.memberId ? WCH.member(doc.session.memberId) : null; },
    demoMemberId: function () { return doc.members[0] && doc.members[0].id; },
    signInStaff: function (name) { doc.session.staff = String(name || 'Manager'); commit('session'); },
    signOutStaff: function () { doc.session.staff = null; commit('session'); },
    currentStaff: function () { return doc.session.staff; },

    // Formatting
    fmt: { mvr: fmtMVR, num: fmtNum, date: fmtDate, shortDate: fmtShortDate, time: fmtTime, dateTime: fmtDateTime, ago: fmtAgo, birthday: fmtBirthday, clock: fmtClock, initials: initials, esc: escapeHTML }
  };

  window.WCH = WCH;
})();
