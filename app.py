from flask import Flask, jsonify, request, render_template
import sqlite3, os

app = Flask(__name__)
DB = 'coffee_shop.db'


def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS menu_items (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                category    TEXT    NOT NULL,
                price       REAL    NOT NULL,
                description TEXT,
                available   INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS orders (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                customer    TEXT    NOT NULL,
                note        TEXT,
                total       REAL    NOT NULL DEFAULT 0,
                status      TEXT    NOT NULL DEFAULT 'pending',
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS order_items (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL REFERENCES orders(id),
                item_id  INTEGER NOT NULL REFERENCES menu_items(id),
                name     TEXT    NOT NULL,
                price    REAL    NOT NULL,
                qty      INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS daily_log (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                date      TEXT    NOT NULL,
                sector    TEXT    NOT NULL,
                sales     REAL    NOT NULL DEFAULT 0,
                customers INTEGER NOT NULL DEFAULT 0
            );
        ''')


# ── Pages ─────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/admin')
def admin():
    return render_template('admin.html')


# ── Menu API ──────────────────────────────────────────────────────────────────

@app.route('/api/menu')
def get_menu():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM menu_items ORDER BY category, name').fetchall()
    return jsonify([dict(r) for r in rows])


@app.route('/api/menu', methods=['POST'])
def add_menu_item():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO menu_items (name, category, price, description, available) VALUES (?,?,?,?,?)',
            (data['name'], data['category'], data['price'], data.get('description', ''), data.get('available', 1))
        )
        item_id = cur.lastrowid
    return jsonify({'id': item_id}), 201


@app.route('/api/menu/<int:item_id>', methods=['PUT'])
def update_menu_item(item_id):
    data = request.json
    with get_db() as conn:
        conn.execute(
            'UPDATE menu_items SET name=?, category=?, price=?, description=?, available=? WHERE id=?',
            (data['name'], data['category'], data['price'], data.get('description', ''), data.get('available', 1), item_id)
        )
    return jsonify({'ok': True})


@app.route('/api/menu/<int:item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    with get_db() as conn:
        conn.execute('DELETE FROM menu_items WHERE id=?', (item_id,))
    return jsonify({'ok': True})


# ── Orders API ────────────────────────────────────────────────────────────────

@app.route('/api/orders')
def get_orders():
    with get_db() as conn:
        orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
        result = []
        for o in orders:
            items = conn.execute(
                'SELECT name, price, qty FROM order_items WHERE order_id=?', (o['id'],)
            ).fetchall()
            result.append({**dict(o), 'items': [dict(i) for i in items]})
    return jsonify(result)


@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json
    with get_db() as conn:
        total = 0
        enriched = []
        for entry in data['items']:
            item = conn.execute('SELECT * FROM menu_items WHERE id=?', (entry['item_id'],)).fetchone()
            if item:
                enriched.append({'item': dict(item), 'qty': entry['qty']})
                total += item['price'] * entry['qty']

        cur = conn.execute(
            'INSERT INTO orders (customer, note, total) VALUES (?,?,?)',
            (data['customer'], data.get('note', ''), total)
        )
        order_id = cur.lastrowid

        for e in enriched:
            conn.execute(
                'INSERT INTO order_items (order_id, item_id, name, price, qty) VALUES (?,?,?,?,?)',
                (order_id, e['item']['id'], e['item']['name'], e['item']['price'], e['qty'])
            )

    return jsonify({'order_id': order_id, 'total': total}), 201


@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    data = request.json
    with get_db() as conn:
        conn.execute('UPDATE orders SET status=? WHERE id=?', (data['status'], order_id))
    return jsonify({'ok': True})


# ── Daily Log API ─────────────────────────────────────────────────────────────

@app.route('/api/log', methods=['POST'])
def add_log():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO daily_log (date, sector, sales, customers) VALUES (?,?,?,?)',
            (data['date'], data['sector'], data['sales'], data['customers'])
        )
    return jsonify({'id': cur.lastrowid}), 201


@app.route('/api/summary')
def get_summary():
    with get_db() as conn:
        totals = conn.execute(
            'SELECT sector, SUM(sales) as total_sales, SUM(customers) as total_customers FROM daily_log GROUP BY sector'
        ).fetchall()
        series = conn.execute(
            'SELECT date, sector, sales, customers FROM daily_log ORDER BY date'
        ).fetchall()
    return jsonify({
        'totals': [dict(r) for r in totals],
        'series': [dict(r) for r in series]
    })


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
