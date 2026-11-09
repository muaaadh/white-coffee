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
  var VERSION = 5;
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
    priceNote: 'All prices in MVR, subject to 10% service charge and 8% GST.',
    // Every day, 16:00 – 24:00 Malé time (UTC+5). Days: 0 = Sunday.
    hours: [0, 1, 2, 3, 4, 5, 6].map(function (d) { return { day: d, open: '16:00', close: '24:00' }; }),
    utcOffsetMinutes: 300
  };

  /* ------------------------------------------------------------------ */
  /* Menu (all prices are placeholders until the client sends theirs)    */
  /* ------------------------------------------------------------------ */
  var MENU_CATEGORIES = [
    { id: 'breakfast', name: 'Breakfast', group: 'food', photo: 'breakfast-spread' },
    { id: 'soups', name: 'Soups', group: 'food', photo: 'breakfast-spread' },
    { id: 'mains', name: 'Main dishes', group: 'food' },
    { id: 'specials', name: 'Special dishes', group: 'food', photo: 'fried-noodles-rice' },
    { id: 'pizza', name: 'Pizza', group: 'food' },
    { id: 'sandwiches', name: 'Sandwiches & bites', group: 'food', photo: 'wraps-sandwiches' },
    { id: 'salads', name: 'Salads', group: 'food', photo: 'fries-rings-salad' },
    { id: 'sides', name: 'Side dishes', group: 'food', photo: 'fries-rings-salad' },
    { id: 'desserts', name: 'Desserts', group: 'food', photo: 'cookies-brownie' },
    { id: 'hot', name: 'Hot beverages', group: 'drinks' },
    { id: 'cold', name: 'Cold beverages', group: 'drinks' },
    { id: 'juice', name: 'Fresh juice', group: 'drinks', photo: 'milkshake-juice' },
    { id: 'shakes', name: 'Milkshakes', group: 'drinks', photo: 'milkshake-juice' },
    { id: 'soft', name: 'Soft drinks', group: 'drinks' }
  ];

  // From the client's printed menu (Menu 2.2, Oct 2026). Prices in MVR, before 10% service charge + 8% GST.
  var MENU = [
    { id: 'maldivian-breakfast', cat: 'breakfast', name: 'Maldivian Breakfast', desc: "Kulhimas, mas'huni, choice of egg and roshi or huni-roshi", price: 115, photo: 'breakfast-spread', signature: true },
    { id: 'english-breakfast', cat: 'breakfast', name: 'English Breakfast', desc: 'Choice of egg, sausage, baked beans, hash browns, toast, butter and jam', price: 112 },
    { id: 'pancakes-set', cat: 'breakfast', name: 'Pancakes Set', desc: 'Three fluffy pancakes with syrups, butter, sausage and boiled egg', price: 110 },
    { id: 'waffles-set', cat: 'breakfast', name: 'Waffles Set', desc: 'Crispy waffle with syrups, butter, sausage and boiled egg', price: 110 },
    { id: 'big-breakfast', cat: 'breakfast', name: 'Grilled Big Breakfast Platter', desc: 'Toasted bread, grilled vegetables, beef bacon, sausages, hash browns, fries and dipping sauces', price: 120, photo: 'breakfast-spread' },
    { id: 'chicken-mushroom-soup', cat: 'soups', name: 'Chicken and Mushroom Soup', desc: 'Velvety chicken and mushroom soup with toasted croutons, fresh herbs and a swirl of cream', price: 95, photo: 'breakfast-spread' },
    { id: 'butternut-soup', cat: 'soups', name: 'Butternut Soup', desc: 'Roasted butternut squash blended with herbs and spices, finished with cream and croutons', price: 90 },
    { id: 'peri-peri-chicken', cat: 'mains', name: 'Peri Peri Chicken with Couscous', desc: 'Fluffy couscous, fresh vegetables, homemade sauce and peri peri chicken', price: 125 },
    { id: 'thai-green-curry', cat: 'mains', name: 'Thai Green Curry', desc: 'Chicken in a fragrant green curry with vegetables, served with jasmine rice', price: 115 },
    { id: 'aglio-olio', cat: 'mains', name: 'Spaghetti Aglio e Olio', desc: 'Spaghetti with garlic, olive oil, chilli flakes and herbs, finished with parmesan', price: 99 },
    { id: 'carbonara', cat: 'mains', name: 'Spaghetti Carbonara', desc: 'Creamy spaghetti with beef bacon, parmesan, egg yolk and black pepper', price: 105 },
    { id: 'valhoamas-pasta', cat: 'mains', name: 'Cheesy Valhoamas Pasta', desc: 'Creamy pasta with valhoamas and a rich house-made cheese sauce', price: 95 },
    { id: 'butter-chicken', cat: 'mains', name: 'Butter Chicken', desc: 'Creamy butter chicken with parata, salad and papadum', price: 135 },
    { id: 'nasi-goreng', cat: 'mains', name: 'Nasi Goreng', desc: 'Wok-fried spiced rice with vegetables and mixed meat, topped with a fried egg', price: 98 },
    { id: 'special-noodles', cat: 'specials', name: 'White Coffee House Special Fried Noodles', desc: 'With house salad, papadum and chilli. Choice of chicken, beef, tuna or seafood', price: 98, photo: 'fried-noodles-rice', signature: true },
    { id: 'special-rice', cat: 'specials', name: 'White Coffee House Special Fried Rice', desc: 'Wok-fried rice with Maldivian spices, vegetables and mixed proteins, topped with an omelette', price: 98, photo: 'fried-noodles-rice', signature: true },
    { id: 'chicken-mushroom-pizza', cat: 'pizza', name: 'Chicken and Mushroom Pizza', desc: '', price: 130 },
    { id: 'margherita', cat: 'pizza', name: 'Margherita Pizza', desc: '', price: 110 },
    { id: 'tuna-pizza', cat: 'pizza', name: 'Tuna Pizza', desc: '', price: 120 },
    { id: 'pepperoni', cat: 'pizza', name: 'Pepperoni Pizza', desc: '', price: 130 },
    { id: 'tandoori-pizza', cat: 'pizza', name: 'Chicken Tandoori Pizza', desc: '', price: 130 },
    { id: 'sandwich-platter', cat: 'sandwiches', name: 'Sandwich Platter (Tuna or Chicken)', desc: 'Triangle sandwiches with creamy chicken or tuna, cheese and vegetables, with dipping sauces and fries', price: 115, photo: 'wraps-sandwiches', signature: true },
    { id: 'wraps', cat: 'sandwiches', name: 'Wraps', desc: 'Tortilla filled with chicken or beef, fresh vegetables and cheese', price: 95, photo: 'wraps-sandwiches' },
    { id: 'burger', cat: 'sandwiches', name: 'Burger', desc: 'Grilled chicken or beef burger with spicy fries and coleslaw', price: 115 },
    { id: 'fish-chips', cat: 'sandwiches', name: 'Fish & Chips', desc: 'Crumb-fried fish with fries, coleslaw and tartar sauce', price: 85 },
    { id: 'chicken-chips', cat: 'sandwiches', name: 'Chicken & Chips', desc: 'Crumb-fried chicken with fries, coleslaw and tartar sauce', price: 85 },
    { id: 'caesar-salad', cat: 'salads', name: 'Caesar Salad', desc: 'Iceberg lettuce, garlic croutons, grilled chicken and a creamy dressing', price: 110 },
    { id: 'chickpea-salad', cat: 'salads', name: 'Mediterranean Chickpea Salad', desc: 'Chickpeas and crisp vegetables with a tangy dressing', price: 110 },
    { id: 'tuna-egg-salad', cat: 'salads', name: 'Tuna & Egg Salad', desc: 'Fresh tuna, boiled eggs, crisp greens, olives and vinaigrette', price: 100, photo: 'fries-rings-salad' },
    { id: 'french-fries', cat: 'sides', name: 'French Fries', desc: '', price: 35, photo: 'fries-rings-salad' },
    { id: 'onion-rings', cat: 'sides', name: 'Onion Rings', desc: '', price: 40, photo: 'fries-rings-salad' },
    { id: 'mashed-potatoes', cat: 'sides', name: 'Mashed Potatoes', desc: '', price: 45 },
    { id: 'garden-salad', cat: 'sides', name: 'Garden Salad', desc: '', price: 50 },
    { id: 'waffles-ice-cream', cat: 'desserts', name: 'Waffles with Ice Cream', desc: '', price: 110 },
    { id: 'pancakes-ice-cream', cat: 'desserts', name: 'Pancakes with Ice Cream', desc: '', price: 110 },
    { id: 'brownie', cat: 'desserts', name: 'Chocolate Brownie', desc: '', price: 45, photo: 'cookies-brownie' },
    { id: 'creme-brulee', cat: 'desserts', name: 'Crème Brûlée', desc: '', price: 50 },
    { id: 'fruit-platter', cat: 'desserts', name: 'Fresh Fruit Platter', desc: '', price: 50 },
    { id: 'caramel-pudding', cat: 'desserts', name: 'Caramel Pudding', desc: '', price: 50 },
    { id: 'cookies', cat: 'desserts', name: 'Chocolate Chip Cookies', desc: '', price: 30, photo: 'cookies-brownie' },
    { id: 'milk-coffee', cat: 'hot', name: 'Milk Coffee', desc: '', price: 35 },
    { id: 'black-coffee', cat: 'hot', name: 'Black Coffee', desc: '', price: 38 },
    { id: 'espresso-single', cat: 'hot', name: 'Espresso Single', desc: '', price: 30 },
    { id: 'espresso-double', cat: 'hot', name: 'Espresso Double', desc: '', price: 42 },
    { id: 'americano', cat: 'hot', name: 'Americano', desc: '', price: 45 },
    { id: 'cappuccino', cat: 'hot', name: 'Cappuccino', desc: '', price: 50 },
    { id: 'cafe-latte', cat: 'hot', name: 'Café Latte', desc: '', price: 45 },
    { id: 'hot-chocolate', cat: 'hot', name: 'Hot Chocolate', desc: '', price: 55 },
    { id: 'milk-tea', cat: 'hot', name: 'Milk Tea', desc: '', price: 35 },
    { id: 'ginger-honey-lime', cat: 'hot', name: 'Ginger Honey & Lime Tea', desc: '', price: 40 },
    { id: 'green-tea', cat: 'hot', name: 'Green Tea', desc: '', price: 20 },
    { id: 'black-tea', cat: 'hot', name: 'Black Tea', desc: '', price: 15 },
    { id: 'iced-latte', cat: 'cold', name: 'Iced Latte', desc: '', price: 50 },
    { id: 'iced-milo', cat: 'cold', name: 'Iced Milo', desc: '', price: 55 },
    { id: 'iced-lemon-tea', cat: 'cold', name: 'Iced Lemon Tea', desc: '', price: 45 },
    { id: 'iced-coffee', cat: 'cold', name: 'Iced Coffee', desc: '', price: 60 },
    { id: 'coke-float', cat: 'cold', name: 'Coke Float', desc: '', price: 40 },
    { id: 'melon-float', cat: 'cold', name: 'Melon Float', desc: '', price: 55 },
    { id: 'affogato', cat: 'cold', name: 'Affogato', desc: '', price: 80 },
    { id: 'water', cat: 'cold', name: 'Mineral Water (500 ml)', desc: '', price: 7 },
    { id: 'watermelon-juice', cat: 'juice', name: 'Watermelon Juice', desc: '', price: 65 },
    { id: 'orange-juice', cat: 'juice', name: 'Orange Juice', desc: '', price: 65 },
    { id: 'mango-juice', cat: 'juice', name: 'Mango Juice', desc: '', price: 65 },
    { id: 'pineapple-juice', cat: 'juice', name: 'Pineapple Juice', desc: '', price: 65 },
    { id: 'passionfruit-juice', cat: 'juice', name: 'Passionfruit Juice', desc: '', price: 65, photo: 'milkshake-juice' },
    { id: 'lime-juice', cat: 'juice', name: 'Lime Juice', desc: '', price: 65 },
    { id: 'mixed-juice', cat: 'juice', name: 'Mixed Juice', desc: '', price: 65 },
    { id: 'strawberry-shake', cat: 'shakes', name: 'Strawberry Milkshake', desc: '', price: 75 },
    { id: 'vanilla-shake', cat: 'shakes', name: 'Vanilla Milkshake', desc: '', price: 75 },
    { id: 'chocolate-shake', cat: 'shakes', name: 'Chocolate Milkshake', desc: '', price: 75, photo: 'milkshake-juice' },
    { id: 'oreo-shake', cat: 'shakes', name: 'Oreo Milkshake', desc: '', price: 75 },
    { id: 'avocado-shake', cat: 'shakes', name: 'Avocado Milkshake', desc: '', price: 75 },
    { id: 'coke', cat: 'soft', name: 'Coke', desc: '', price: 28 },
    { id: 'diet-coke', cat: 'soft', name: 'Diet Coke', desc: '', price: 28 },
    { id: 'sprite', cat: 'soft', name: 'Sprite', desc: '', price: 28 },
    { id: 'fanta', cat: 'soft', name: 'Fanta', desc: '', price: 28 },
    { id: 'soda-water', cat: 'soft', name: 'Soda Water', desc: '', price: 28 },
    { id: 'ginger-beer', cat: 'soft', name: 'Ginger Beer', desc: '', price: 56 },
    { id: 'xl-energy', cat: 'soft', name: 'XL Energy Drink', desc: '', price: 58 },
    { id: 'red-bull', cat: 'soft', name: 'Red Bull', desc: '', price: 60 }
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
      { id: 'white', name: 'White', min: 1000, mult: 1.5, perks: ['1.5× beans on everything', 'One free drink every month', 'Invites to tasting evenings'] }
    ]
  };

  var REWARDS = [
    { id: 'r-cookies', name: 'Chocolate chip cookies', cost: 80, kind: 'food', active: true },
    { id: 'r-hot', name: 'Any hot coffee', cost: 120, kind: 'drink', active: true },
    { id: 'r-brownie', name: 'Chocolate brownie', cost: 120, kind: 'food', active: true },
    { id: 'r-iced', name: 'Any iced drink', cost: 150, kind: 'drink', active: true },
    { id: 'r-juice', name: 'Any fresh juice', cost: 170, kind: 'drink', active: true },
    { id: 'r-shake', name: 'Any milkshake', cost: 190, kind: 'drink', active: true },
    { id: 'r-special', name: 'Special fried rice or noodles', cost: 260, kind: 'food', active: true },
    { id: 'r-karaoke', name: 'One hour in the Cosy karaoke room', cost: 700, kind: 'karaoke', active: true }
  ];

  var OFFERS = [
    { id: 'o-double', title: 'Double beans from 4 to 6 PM', body: 'On weekdays, every bean you earn in the first two hours counts twice.', active: true },
    { id: 'o-bday', title: 'Birthday on us', body: 'Members get 100 beans and a free drink in their birthday week.', active: true },
    { id: 'o-friend', title: 'Bring a friend', body: 'Invite a friend to White Rewards. You both get 50 beans after their first visit.', active: true }
  ];

  /* ------------------------------------------------------------------ */
  /* Karaoke rooms (names, sizes and rates are placeholders)            */
  /* ------------------------------------------------------------------ */
  var KARAOKE = {
    open: 16, close: 24,          // bookable hours, Malé time (last start = close - 1)
    maxHours: 4,
    daysAhead: 30,
    rooms: [
      { id: 'cosy', name: 'Cosy room', capacity: 6, rate: 300, blurb: 'Sofa seating for up to 6. Good for birthdays and duets.', active: true },
      { id: 'party', name: 'Party room', capacity: 12, rate: 500, blurb: 'Space for 12, for office nights and big birthdays.', active: true },
      { id: 'vip', name: 'VIP room', capacity: 20, rate: 800, blurb: 'Our biggest room, up to 20 people.', active: true }
    ],
    statuses: ['confirmed', 'checked-in', 'completed', 'cancelled', 'no-show']
  };

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
    ['Aisha Ibrahim', '+960 771 2408', 'aisha.ibrahim@example.mv', '03-14', 'Iced Coffee'],
    ['Mohamed Shifaz', '+960 790 1123', 'shifaz@example.mv', '07-02', 'Cappuccino'],
    ['Fathimath Zeena', '+960 762 8841', 'zeena.f@example.mv', '11-21', 'Café Latte'],
    ['Ahmed Rasheed', '+960 777 3390', 'a.rasheed@example.mv', '01-09', 'Americano'],
    ['Mariyam Shiuna', '+960 793 5512', 'shiuna@example.mv', '05-30', 'Mango Juice'],
    ['Hassan Nazeer', '+960 748 2205', 'hnazeer@example.mv', '09-17', 'Iced Latte'],
    ['Aminath Liusha', '+960 765 9034', 'liusha@example.mv', '12-03', 'Oreo Milkshake'],
    ['Ibrahim Shareef', '+960 772 6618', 'ishareef@example.mv', '04-25', 'Espresso Double'],
    ['Hawwa Nashfa', '+960 799 4470', 'nashfa@example.mv', '08-11', 'Iced Milo'],
    ['Ali Waheed', '+960 781 0956', 'ali.waheed@example.mv', '02-27', 'Cappuccino'],
    ['Zahra Adam', '+960 754 3381', 'zahra.adam@example.mv', '06-19', 'Passionfruit Juice'],
    ['Ismail Hameed', '+960 768 7723', 'ihameed@example.mv', '10-05', 'Café Latte'],
    ['Shaheema Ali', '+960 790 8812', 'shaheema@example.mv', '03-08', 'Ginger Honey & Lime Tea'],
    ['Yoosuf Naseem', '+960 777 5049', 'ynaseem@example.mv', '11-12', 'Iced Latte'],
    ['Mariyam Hana', '+960 762 1187', 'hana.m@example.mv', '07-23', 'Hot Chocolate'],
    ['Abdulla Zuhair', '+960 795 6630', 'zuhair@example.mv', '01-31', 'Cappuccino'],
    ['Aishath Raya', '+960 749 2268', 'raya@example.mv', '09-02', 'Café Latte'],
    ['Hussain Faisal', '+960 783 4415', 'hfaisal@example.mv', '05-14', 'Americano'],
    ['Nuha Moosa', '+960 771 9902', 'nuha@example.mv', '12-24', 'Iced Coffee'],
    ['Imran Latheef', '+960 766 3357', 'imran.l@example.mv', '04-04', 'Iced Latte'],
    ['Sara Ahmed', '+960 797 0841', 'sara.ahmed@example.mv', '08-29', 'Oreo Milkshake'],
    ['Moosa Fahmy', '+960 758 6624', 'mfahmy@example.mv', '06-06', 'Espresso Double'],
    ['Lamya Hassan', '+960 774 1196', 'lamya@example.mv', '02-10', 'Mango Juice'],
    ['Riyaz Mohamed', '+960 789 5573', 'riyaz@example.mv', '10-28', 'Cappuccino']
  ];
  var STAFF = ['Shazna', 'Ameen', 'Rifa', 'Nadheem'];
  function groupOf(cat) { for (var i = 0; i < MENU_CATEGORIES.length; i++) if (MENU_CATEGORIES[i].id === cat) return MENU_CATEGORIES[i].group; return 'food'; }
  var DRINK_IDS = MENU.filter(function (m) { return groupOf(m.cat) === 'drinks' && m.cat !== 'soft' && m.id !== 'water'; }).map(function (m) { return m.id; });
  var FOOD_IDS = MENU.filter(function (m) { return groupOf(m.cat) === 'food'; }).map(function (m) { return m.id; });

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
      karaoke: { rooms: clone(KARAOKE.rooms), bookings: [], nextBookingNo: 2101 },
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
          if (m.beans >= 150 && rnd() < (i === 0 ? 0.05 : 0.12)) {
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
    seedKaraoke(doc, now, rnd);
    doc.activity.sort(function (a, b) { return b.ts - a.ts; });
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
    if (freeEarned) pushActivity(doc, { type: 'stamp', memberId: m.id, beans: 0, note: freeEarned === 1 ? 'Coffee card full, a free drink is waiting' : freeEarned + ' free drinks unlocked' }, ts + 500);
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
    var alphabet = 'ACDEFGHJKLMNPQRTUVXY3479';   // no W, so codes never read W-W...
    var x = (ts ^ (doc.redemptions.length * 2654435761)) >>> 0, s = '';
    var rnd = mulberry32(x);
    for (var i = 0; i < 4; i++) s += alphabet[Math.floor(rnd() * alphabet.length)];
    return 'W-' + s;
  }

  /* ------------------------------------------------------------------ */
  /* Karaoke helpers                                                     */
  /* ------------------------------------------------------------------ */
  function maleDateKey(ts) { var p = maleParts(ts); return p.y + '-' + String(p.mo + 1).padStart(2, '0') + '-' + String(p.d).padStart(2, '0'); }
  function dateKeyToTs(key, hour) {   // Malé wall-clock -> UTC ms
    var a = key.split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2], hour || 0) - INFO.utcOffsetMinutes * 6e4;
  }
  function dateLabel(key) { var p = maleParts(dateKeyToTs(key, 12)); return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][p.day] + ' ' + p.d + ' ' + MONTHS[p.mo]; }
  function roomOf(doc, id) { return doc.karaoke.rooms.filter(function (r) { return r.id === id; })[0] || null; }
  function overlaps(b, roomId, date, start, hours) {
    return b.roomId === roomId && b.date === date && b.status !== 'cancelled' && b.status !== 'no-show' &&
      start < b.start + b.hours && b.start < start + hours;
  }
  function makeBooking(doc, p, ts) {
    var room = roomOf(doc, p.roomId);
    var b = {
      id: 'K-' + doc.karaoke.nextBookingNo++, roomId: room.id, roomName: room.name, date: p.date, start: p.start, hours: p.hours,
      guests: p.guests, name: p.name, phone: p.phone, email: p.email || '', notes: p.notes || '', memberId: p.memberId || null,
      rate: room.rate, total: room.rate * p.hours, status: p.status || 'confirmed', source: p.source || 'Online', createdAt: ts
    };
    doc.karaoke.bookings.push(b);
    return b;
  }
  function seedKaraoke(doc, now, rnd) {
    var names = SEED_MEMBERS.map(function (r) { return r; });
    var today = maleDateKey(now);
    for (var d = -10; d <= 12; d++) {
      var key = maleDateKey(dateKeyToTs(today, 12) + d * DAY);
      var n = 1 + Math.floor(rnd() * (d >= 0 && d < 3 ? 4 : 3));
      for (var k = 0; k < n; k++) {
        var room = doc.karaoke.rooms[Math.floor(rnd() * 3)];
        var hours = 1 + Math.floor(rnd() * 3), start = KARAOKE.open + Math.floor(rnd() * (KARAOKE.close - KARAOKE.open - hours + 1));
        var forced = d === -4 && k === 0;           // the demo account (Aisha) gets one completed, linked hour in the Cosy room
        if (forced) { room = doc.karaoke.rooms[0]; hours = 1; }
        var clash = doc.karaoke.bookings.some(function (b) { return overlaps(b, room.id, key, start, hours); });
        if (clash) continue;
        var who = names[Math.floor(rnd() * names.length)], mi = SEED_MEMBERS.indexOf(who);
        if (forced) { who = SEED_MEMBERS[0]; mi = 0; }
        var member = doc.members[mi];
        var startTs = dateKeyToTs(key, start), endTs = startTs + hours * 36e5;
        var status = endTs < now ? (rnd() < 0.9 || forced ? 'completed' : 'no-show') : (startTs < now ? 'checked-in' : 'confirmed');
        var linked = rnd() < 0.7 || forced;
        var b = makeBooking(doc, { roomId: room.id, date: key, start: start, hours: hours, guests: Math.max(2, Math.floor(room.capacity * (0.4 + rnd() * 0.6))),
          name: who[0], phone: who[1], email: who[2], memberId: linked ? member.id : null, status: status, source: rnd() < 0.75 ? 'Online' : 'Phone' }, startTs - (2 + rnd() * 5) * DAY);
        if (rnd() < 0.15) b.notes = 'Birthday, please add candles';
        if (b.createdAt > now - 36e5) b.createdAt = now - (2 + (b.start % 5)) * 36e5;   // never booked in the future
        if (b.memberId) {
          pushActivity(doc, { type: 'booking', memberId: b.memberId, beans: 0, note: 'Karaoke booked: ' + b.roomName + ', ' + dateLabel(b.date) + ' at ' + fmtClock(String(b.start).padStart(2, '0') + ':00'), code: b.id }, b.createdAt);
          if (b.status === 'completed') {
            var lastVisit = member.lastVisit;
            earnInto(doc, member, { amount: b.total, drinks: 0, items: ['Karaoke: ' + b.roomName + ', ' + b.hours + ' h'], staff: STAFF[b.start % STAFF.length], note: b.id }, endTs);
            member.lastVisit = Math.max(lastVisit || 0, endTs);
            b.beansAwarded = true; b.updatedAt = endTs; b.updatedBy = STAFF[b.start % STAFF.length];
          }
        }
      }
    }
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
    doc.redemptions.forEach(function (r) {
      if (r.status === 'ready' && r.expires < now) {
        r.status = 'expired'; changed = true;
        var m = doc.members.filter(function (x) { return x.id === r.memberId; })[0];
        if (m && !r.refunded) { m.beans += r.cost; r.refunded = true; pushActivity(doc, { type: 'refund', memberId: m.id, beans: r.cost, note: r.rewardName + ' code expired, beans returned', code: r.code }, r.expires); }
      }
    });
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
      pushActivity(doc, { type: 'refund', memberId: r.memberId, beans: r.cost, note: r.rewardName + ' cancelled, beans returned', code: r.code }, Date.now());
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
      doc.members.forEach(function (m) { while (m.stamps >= p.stampsForFree) { m.stamps -= p.stampsForFree; m.freeDrinks += 1; } });
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
      var rewardCount = {}, voided = {};
      doc.redemptions.forEach(function (r) { if (r.status === 'cancelled' || r.status === 'expired') voided[r.code] = true; });
      doc.activity.forEach(function (a) {
        var idx = Math.floor((startOfMaleDay(a.ts) - series[0].day) / DAY);
        var row = idx >= 0 && idx < series.length ? series[idx] : null;
        if (a.type === 'earn') {
          if (row) { row.visits++; row.beans += a.beans; row.sales += a.amount; }
          if (a.ts >= today) { s.visitsToday++; s.salesToday += a.amount; s.beansToday += a.beans; }
          if (a.ts >= weekAgo) { s.visitsWeek++; s.beansWeek += a.beans; s.salesWeek += a.amount; }
        } else if (a.type === 'redeem' && !voided[a.code]) {
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

    // Karaoke
    karaokeRules: function () { return { open: KARAOKE.open, close: KARAOKE.close, maxHours: KARAOKE.maxHours, daysAhead: KARAOKE.daysAhead, statuses: KARAOKE.statuses.slice() }; },
    karaokeRooms: function (all) { return doc.karaoke.rooms.filter(function (r) { return all || r.active; }); },
    karaokeRoom: function (id) { return roomOf(doc, id); },
    /** Admin: change a room's name, capacity, hourly rate, blurb or active flag. */
    saveKaraokeRoom: function (id, patch) {
      var r = roomOf(doc, id); if (!r) throw new Error('Unknown room');
      if ('rate' in patch) { var v = Math.round(Number(patch.rate)); if (!(v > 0)) throw new Error('Rate must be more than 0'); r.rate = v; }
      if ('capacity' in patch) { var c = Math.round(Number(patch.capacity)); if (!(c >= 1)) throw new Error('Capacity must be at least 1'); r.capacity = c; }
      if ('name' in patch && String(patch.name).trim()) r.name = String(patch.name).trim();
      if ('blurb' in patch) r.blurb = String(patch.blurb);
      if ('active' in patch) r.active = !!patch.active;
      commit('karaoke-room'); return r;
    },
    /** Today's date key in Malé (YYYY-MM-DD) and helpers to move between days. */
    karaokeToday: function () { return maleDateKey(Date.now()); },
    karaokeAddDays: function (key, n) { return maleDateKey(dateKeyToTs(key, 12) + n * DAY); },
    karaokeDateLabel: function (key) { return dateLabel(key); },
    /** Availability for one room on one date: [{hour, label, free, past, bookingId}] for every bookable start hour. */
    karaokeSlots: function (date, roomId) {
      var out = [], now = Date.now();
      for (var h = KARAOKE.open; h < KARAOKE.close; h++) {
        var hit = doc.karaoke.bookings.filter(function (b) { return overlaps(b, roomId, date, h, 1); })[0];
        var past = dateKeyToTs(date, h) < now;
        out.push({ hour: h, label: fmtClock(String(h).padStart(2, '0') + ':00'), free: !hit && !past, past: past, bookingId: hit ? hit.id : null });
      }
      return out;
    },
    /** Longest booking (hours) that fits from this start without a clash or running past close. */
    karaokeMaxHours: function (date, roomId, start) {
      var n = 0;
      for (var h = start; h < KARAOKE.close && n < KARAOKE.maxHours; h++) {
        if (doc.karaoke.bookings.some(function (b) { return overlaps(b, roomId, date, h, 1); })) break;
        n++;
      }
      return n;
    },
    /** Create a booking: { roomId, date 'YYYY-MM-DD', start (hour 16-23), hours, guests, name, phone, email, notes, memberId, source, status } */
    bookKaraoke: function (p) {
      var fresh = read(); if (fresh) doc = fresh;   // re-read so a booking made in another tab a moment ago counts
      var room = roomOf(doc, p.roomId); if (!room || !room.active) throw new Error('Please choose a room');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''))) throw new Error('Please choose a date');
      var start = Math.round(Number(p.start)), hours = Math.round(Number(p.hours)), guests = Math.round(Number(p.guests));
      if (!(start >= KARAOKE.open && start < KARAOKE.close)) throw new Error('Please choose a start time');
      if (!(hours >= 1 && hours <= KARAOKE.maxHours)) throw new Error('Bookings are 1 to ' + KARAOKE.maxHours + ' hours');
      if (start + hours > KARAOKE.close) throw new Error('The room has to be free by midnight');
      if (!(guests >= 1)) throw new Error('How many people are coming?');
      if (guests > room.capacity) throw new Error('The ' + room.name + ' fits up to ' + room.capacity + ' people');
      var today = maleDateKey(Date.now()), last = maleDateKey(Date.now() + KARAOKE.daysAhead * DAY);
      if (p.date < today) throw new Error('That date has passed');
      if (p.date > last) throw new Error('You can book up to ' + KARAOKE.daysAhead + ' days ahead');
      if (dateKeyToTs(p.date, start) < Date.now() && p.source !== 'Walk-in') throw new Error('That time has already started');
      if (!String(p.name || '').trim()) throw new Error('Please enter your name');
      if (String(p.phone || '').replace(/\D/g, '').length < 7) throw new Error('Please enter a phone number we can call');
      if (doc.karaoke.bookings.some(function (b) { return overlaps(b, room.id, p.date, start, hours); })) throw new Error('Someone just booked that time. Please pick another slot.');
      var b = makeBooking(doc, { roomId: room.id, date: p.date, start: start, hours: hours, guests: guests, name: String(p.name).trim(), phone: String(p.phone).trim(),
        email: String(p.email || '').trim(), notes: String(p.notes || '').trim(), memberId: p.memberId || null, source: p.source || 'Online', status: p.status || 'confirmed' }, Date.now());
      if (b.memberId) pushActivity(doc, { type: 'booking', memberId: b.memberId, beans: 0, note: 'Karaoke booked: ' + b.roomName + ', ' + WCH.karaokeDateLabel(b.date) + ' at ' + fmtClock(String(b.start).padStart(2, '0') + ':00'), code: b.id }, Date.now());
      commit('karaoke-book'); return b;
    },
    karaokeBooking: function (id) { var digits = String(id || '').replace(/\D/g, ''); id = digits ? 'K-' + digits : ''; return doc.karaoke.bookings.filter(function (b) { return b.id === id; })[0] || null; },
    /** Filter: { date, roomId, status, memberId, phone, from, to } — sorted by date + start. */
    karaokeBookings: function (f) {
      f = f || {}; var digits = f.phone ? String(f.phone).replace(/\D/g, '') : '';
      return doc.karaoke.bookings.filter(function (b) {
        return (!f.date || b.date === f.date) && (!f.roomId || b.roomId === f.roomId) && (!f.status || b.status === f.status) &&
          (!f.memberId || b.memberId === f.memberId) && (!digits || b.phone.replace(/\D/g, '').slice(-7) === digits.slice(-7)) &&
          (!f.from || b.date >= f.from) && (!f.to || b.date <= f.to);
      }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.start - b.start; });
    },
    /** Staff: confirmed -> checked-in -> completed, or cancelled / no-show. Completing a member's booking earns beans on the room total. */
    setKaraokeStatus: function (id, status, staff) {
      var b = WCH.karaokeBooking(id); if (!b) throw new Error('No booking with that reference');
      if (KARAOKE.statuses.indexOf(status) < 0) throw new Error('Unknown status');
      if (b.status === 'completed' && status !== 'completed') throw new Error('This booking is already completed');
      b.status = status; b.updatedAt = Date.now(); b.updatedBy = staff || 'Counter';
      if (status === 'completed' && b.memberId && !b.beansAwarded) {
        var m = WCH.member(b.memberId);
        if (m) { earnInto(doc, m, { amount: b.total, drinks: 0, items: ['Karaoke: ' + b.roomName + ', ' + b.hours + ' h'], staff: b.updatedBy, note: b.id }, Date.now()); b.beansAwarded = true; }
      }
      commit('karaoke-status'); return b;
    },
    /** Customer or staff cancels a future booking. */
    cancelKaraoke: function (id, by) {
      var b = WCH.karaokeBooking(id); if (!b) throw new Error('No booking with that reference');
      if (b.status !== 'confirmed') throw new Error('Only upcoming bookings can be cancelled');
      b.status = 'cancelled'; b.updatedAt = Date.now(); b.updatedBy = by || 'Guest';
      if (b.memberId) pushActivity(doc, { type: 'booking', memberId: b.memberId, beans: 0, note: 'Karaoke cancelled: ' + b.roomName + ', ' + WCH.karaokeDateLabel(b.date), code: b.id }, Date.now());
      commit('karaoke-cancel'); return b;
    },
    /** Move a booking (staff). */
    moveKaraoke: function (id, p) {
      var fresh = read(); if (fresh) doc = fresh;
      var b = WCH.karaokeBooking(id); if (!b) throw new Error('No booking with that reference');
      var roomId = p.roomId || b.roomId, date = p.date || b.date, start = p.start != null ? Math.round(Number(p.start)) : b.start, hours = p.hours != null ? Math.round(Number(p.hours)) : b.hours;
      if (start + hours > KARAOKE.close || start < KARAOKE.open || hours < 1 || hours > KARAOKE.maxHours) throw new Error('That time does not fit');
      var clash = doc.karaoke.bookings.some(function (x) { return x !== b && overlaps(x, roomId, date, start, hours); });
      if (clash) throw new Error('That room is taken at that time');
      var room = roomOf(doc, roomId); if (roomId !== b.roomId) b.rate = room.rate;   // same room keeps the rate it was booked at
      b.roomId = roomId; b.roomName = room.name; b.date = date; b.start = start; b.hours = hours; b.total = b.rate * hours;
      b.updatedAt = Date.now(); commit('karaoke-move'); return b;
    },
    karaokeStats: function () {
      var today = maleDateKey(Date.now()), weekEnd = maleDateKey(Date.now() + 6 * DAY), s = { today: 0, todayHours: 0, upcomingWeek: 0, revenueWeek: 0, occupancyToday: 0 };
      var bookable = doc.karaoke.rooms.filter(function (r) { return r.active; }).length * (KARAOKE.close - KARAOKE.open);
      doc.karaoke.bookings.forEach(function (b) {
        if (b.status === 'cancelled' || b.status === 'no-show') return;
        if (b.date === today) { s.today++; s.todayHours += b.hours; }
        if (b.date >= today && b.date <= weekEnd) { s.upcomingWeek++; s.revenueWeek += b.total; }
      });
      s.occupancyToday = bookable ? s.todayHours / bookable : 0;
      return s;
    },

    // Formatting
    fmt: { mvr: fmtMVR, num: fmtNum, date: fmtDate, shortDate: fmtShortDate, time: fmtTime, dateTime: fmtDateTime, ago: fmtAgo, birthday: fmtBirthday, clock: fmtClock, initials: initials, esc: escapeHTML }
  };

  window.WCH = WCH;
})();
