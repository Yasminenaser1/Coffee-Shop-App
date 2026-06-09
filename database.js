const { DatabaseSync } = require('node:sqlite');
const path = require('path');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(path.join(__dirname, 'daily_drip.db'));
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      price       REAL    NOT NULL,
      category    TEXT    NOT NULL,
      emoji       TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id      TEXT    PRIMARY KEY,
      customer_name TEXT    NOT NULL,
      customer_note TEXT,
      total         REAL    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'received',
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   TEXT    NOT NULL,
      item_id    INTEGER NOT NULL,
      item_name  TEXT    NOT NULL,
      quantity   INTEGER NOT NULL,
      price      REAL    NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS c FROM menu_items').get();
  if (count.c === 0) {
    const ins = db.prepare(
      'INSERT INTO menu_items (name, description, price, category, emoji) VALUES (?,?,?,?,?)'
    );

    const items = [
      // Hot Drinks
      ['Espresso',        'Bold and intense, our signature single shot',                  3.50, 'hot-drinks', '☕'],
      ['Americano',       'Espresso diluted with hot water, smooth and rich',             4.00, 'hot-drinks', '☕'],
      ['Cappuccino',      'Equal parts espresso, steamed milk, and velvety foam',         4.75, 'hot-drinks', '☕'],
      ['Latte',           'Espresso with silky steamed milk, lightly foamed',             5.25, 'hot-drinks', '☕'],
      ['Flat White',      'A stronger, creamier alternative to the latte',                5.25, 'hot-drinks', '☕'],
      ['Mocha',           'Espresso, dark chocolate sauce, and steamed milk',             5.75, 'hot-drinks', '☕'],
      ['Caramel Latte',   'Our classic latte topped with house-made caramel drizzle',     5.75, 'hot-drinks', '☕'],
      ['Cortado',         'Espresso balanced with an equal part of warm milk',            4.50, 'hot-drinks', '☕'],
      // Iced Drinks
      ['Cold Brew',              'Steeped for 20 hours — smooth, bold, never bitter',        5.00, 'iced-drinks', '🧊'],
      ['Iced Latte',             'Espresso shots poured over ice with cold milk',             5.50, 'iced-drinks', '🧊'],
      ['Iced Mocha',             'Rich chocolate espresso drink served over ice',             6.00, 'iced-drinks', '🧊'],
      ['Iced Caramel Macchiato', 'Layered espresso, milk, vanilla, and caramel over ice',    6.25, 'iced-drinks', '🧊'],
      ['Iced Matcha Latte',      'Ceremonial grade matcha whisked with oat milk over ice',   5.75, 'iced-drinks', '🧊'],
      // Tea
      ['Earl Grey',    'Classic black tea with floral bergamot',                          3.50, 'tea', '🍵'],
      ['Chamomile',    'Soothing herbal blend, naturally caffeine-free',                  3.50, 'tea', '🍵'],
      ['Chai Latte',   'Spiced black tea blended with frothy steamed milk',               5.00, 'tea', '🍵'],
      ['Matcha Latte', 'Premium Japanese matcha whisked with oat milk',                   5.50, 'tea', '🍵'],
      ['London Fog',   'Earl grey tea, steamed milk, and a touch of vanilla',             5.00, 'tea', '🍵'],
      // Pastries
      ['Butter Croissant',  'Flaky, golden, baked fresh each morning',                   3.75, 'pastries', '🥐'],
      ['Almond Croissant',  'Filled with almond cream, topped with toasted flakes',      4.50, 'pastries', '🥐'],
      ['Blueberry Muffin',  'Bursting with fresh blueberries, lightly sweetened',        3.25, 'pastries', '🫐'],
      ['Cinnamon Roll',     'Soft and gooey, finished with cream cheese glaze',          5.00, 'pastries', '🌀'],
      ['Chocolate Muffin',  'Double chocolate, rich and incredibly moist',               3.25, 'pastries', '🍫'],
      // Sandwiches
      ['Avocado Toast',   'Smashed avocado, feta, chili flakes on sourdough',            8.50, 'sandwiches', '🥑'],
      ['Egg & Cheese',    'Scrambled eggs with aged cheddar on toasted brioche',         7.50, 'sandwiches', '🍳'],
      ['Turkey & Brie',   'Sliced turkey, creamy brie, whole-grain dijon on ciabatta',   9.50, 'sandwiches', '🥪'],
      ['Caprese',         'Fresh mozzarella, heirloom tomato, basil pesto on focaccia',  8.75, 'sandwiches', '🍅'],
      // Sweets
      ['Chocolate Chip Cookie', 'Warm, gooey classic — baked fresh daily',              2.75, 'sweets', '🍪'],
      ['Brownie',               'Dense, fudgy dark chocolate square',                   3.75, 'sweets', '🍫'],
      ['Lemon Tart',            'Tangy lemon curd in a crisp buttery pastry shell',      4.75, 'sweets', '🍋'],
      ['Cheesecake Slice',      'New York style with seasonal berry compote',            5.50, 'sweets', '🍰'],
    ];

    for (const item of items) ins.run(...item);
    console.log(`✅  Seeded ${items.length} menu items`);
  }
}

module.exports = { getDb, initDb };
