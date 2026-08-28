const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'kwezr.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL'); // bir vaqtda o'qish/yozish tezroq va xavfsizroq bo'lishi uchun

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id                TEXT PRIMARY KEY,
    phone             TEXT,
    status            TEXT,
    paymentConfirmed  INTEGER DEFAULT 0,
    total             REAL DEFAULT 0,
    createdAt         TEXT DEFAULT (datetime('now')),
    data              TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_phone  ON orders(phone);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

  CREATE TABLE IF NOT EXISTS users (
    telegramId    TEXT PRIMARY KEY,
    phone         TEXT,
    registeredAt  TEXT,
    data          TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

  CREATE TABLE IF NOT EXISTS relay (
    relayKey    TEXT PRIMARY KEY,
    customerId  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS store (
    storeKey  TEXT PRIMARY KEY,
    value     TEXT
  );
`);

/* ===================== Bir martalik ko'chirish: eski JSON fayllar bo'lsa ===================== */
/* (avvalgi versiyadagi data/kwezr_orders.json, kwezr_users.json,               */
/* kwezr_relay.json, kwezr_store.json) — ularni SQLite bazasiga import qilamiz, */
/* so'ng .old qilib nomlaymiz, hech qanday ma'lumot yo'qolmasligi uchun.        */
function migrateLegacyJsonIfPresent() {
  const legacy = {
    orders: path.join(DATA_DIR, 'kwezr_orders.json'),
    users: path.join(DATA_DIR, 'kwezr_users.json'),
    relay: path.join(DATA_DIR, 'kwezr_relay.json'),
    store: path.join(DATA_DIR, 'kwezr_store.json'),
  };

  const ordersCount = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  if (ordersCount === 0 && fs.existsSync(legacy.orders)) {
    try {
      const arr = JSON.parse(fs.readFileSync(legacy.orders, 'utf8'));
      if (Array.isArray(arr) && arr.length) {
        // eski faylda eng yangisi boshda turadi (unshift bilan qo'shilgan) —
        // teskari tartibda yozamiz, shunda rowid tartibi ham to'g'ri bo'ladi
        for (const o of [...arr].reverse()) addOrder(o);
        console.log(`↪️  ${arr.length} ta eski buyurtma SQLite bazasiga ko'chirildi.`);
      }
      fs.renameSync(legacy.orders, legacy.orders + '.old');
    } catch (e) {
      console.error("Eski buyurtmalarni ko'chirishda xatolik:", e.message);
    }
  }

  const usersCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (usersCount === 0 && fs.existsSync(legacy.users)) {
    try {
      const arr = JSON.parse(fs.readFileSync(legacy.users, 'utf8'));
      if (Array.isArray(arr) && arr.length) {
        for (const u of [...arr].reverse()) upsertUser(u);
        console.log(`↪️  ${arr.length} ta eski foydalanuvchi SQLite bazasiga ko'chirildi.`);
      }
      fs.renameSync(legacy.users, legacy.users + '.old');
    } catch (e) {
      console.error("Eski foydalanuvchilarni ko'chirishda xatolik:", e.message);
    }
  }

  if (fs.existsSync(legacy.relay)) {
    try {
      const map = JSON.parse(fs.readFileSync(legacy.relay, 'utf8'));
      const keys = Object.keys(map || {});
      for (const key of keys) {
        const [adminChatId, messageId] = key.split(':');
        setRelay(adminChatId, messageId, map[key]);
      }
      if (keys.length) console.log(`↪️  ${keys.length} ta eski yozishma havolasi ko'chirildi.`);
      fs.renameSync(legacy.relay, legacy.relay + '.old');
    } catch (e) {
      console.error("Eski relay ma'lumotini ko'chirishda xatolik:", e.message);
    }
  }

  if (fs.existsSync(legacy.store)) {
    try {
      const map = JSON.parse(fs.readFileSync(legacy.store, 'utf8'));
      const keys = Object.keys(map || {});
      for (const key of keys) storeSet(key, map[key]);
      if (keys.length) console.log(`↪️  ${keys.length} ta umumiy xotira kaliti ko'chirildi.`);
      fs.renameSync(legacy.store, legacy.store + '.old');
    } catch (e) {
      console.error("Eski store ma'lumotini ko'chirishda xatolik:", e.message);
    }
  }
}

/* ===================== Buyurtmalar ===================== */

function addOrder(order) {
  db.prepare(
    `INSERT INTO orders (id, phone, status, paymentConfirmed, total, data)
     VALUES (@id, @phone, @status, @paymentConfirmed, @total, @data)`
  ).run({
    id: String(order.id),
    phone: order.phone || null,
    status: order.status || 'new',
    paymentConfirmed: order.paymentConfirmed ? 1 : 0,
    total: Number(order.total || 0),
    data: JSON.stringify(order),
  });
  return order;
}

function loadOrders() {
  const rows = db.prepare('SELECT data FROM orders ORDER BY rowid DESC').all();
  return rows.map((r) => JSON.parse(r.data));
}

function getOrder(id) {
  const row = db.prepare('SELECT data FROM orders WHERE id = ?').get(String(id));
  return row ? JSON.parse(row.data) : null;
}

function updateOrder(id, patch) {
  const existing = getOrder(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  db.prepare(
    `UPDATE orders SET phone=@phone, status=@status, paymentConfirmed=@paymentConfirmed, total=@total, data=@data
     WHERE id=@id`
  ).run({
    id: String(id),
    phone: updated.phone || null,
    status: updated.status || 'new',
    paymentConfirmed: updated.paymentConfirmed ? 1 : 0,
    total: Number(updated.total || 0),
    data: JSON.stringify(updated),
  });
  return updated;
}

function normalizePhone(phone) {
  // Turli formatlarni (+998901234567, 998901234567, 901234567 va h.k.)
  // solishtirish uchun faqat oxirgi 9 ta raqamni qoldiramiz.
  return String(phone || '').replace(/\D/g, '').slice(-9);
}

function getOrdersByPhone(phone) {
  const target = normalizePhone(phone);
  if (!target) return [];
  // SQLite'da LIKE bilan tezroq oldindan filtrlash, keyin JS'da aniq solishtirish
  const rows = db.prepare("SELECT data FROM orders WHERE phone LIKE '%' || ? ORDER BY rowid DESC").all(target);
  return rows.map((r) => JSON.parse(r.data)).filter((o) => normalizePhone(o.phone) === target);
}

/* ===================== Foydalanuvchilar (ro'yxatdan o'tish) ===================== */

function loadUsers() {
  const rows = db.prepare('SELECT data FROM users ORDER BY rowid DESC').all();
  return rows.map((r) => JSON.parse(r.data));
}

function getUser(telegramId) {
  const row = db.prepare('SELECT data FROM users WHERE telegramId = ?').get(String(telegramId));
  return row ? JSON.parse(row.data) : null;
}

function getUserByPhone(phone) {
  const target = normalizePhone(phone);
  if (!target) return null;
  const rows = db.prepare("SELECT data FROM users WHERE phone LIKE '%' || ?").all(target);
  const matches = rows.map((r) => JSON.parse(r.data)).filter((u) => normalizePhone(u.phone) === target);
  return matches[0] || null;
}

function upsertUser(data) {
  const telegramId = String(data.telegramId);
  const existing = getUser(telegramId);
  const merged = existing
    ? { ...existing, ...data }
    : { ...data, registeredAt: data.registeredAt || new Date().toISOString() };

  db.prepare(
    `INSERT INTO users (telegramId, phone, registeredAt, data)
     VALUES (@telegramId, @phone, @registeredAt, @data)
     ON CONFLICT(telegramId) DO UPDATE SET
       phone = excluded.phone,
       data  = excluded.data`
  ).run({
    telegramId,
    phone: merged.phone || null,
    registeredAt: merged.registeredAt,
    data: JSON.stringify(merged),
  });
  return merged;
}

/* ===================== Admin <-> mijoz xabar ko'prigi ===================== */
/* Admin forward qilingan xabarga "Reply" qilganda, qaysi mijozga
   yuborish kerakligini bilish uchun (adminChatId:messageId -> customerId) */

function setRelay(adminChatId, messageId, customerId) {
  const key = `${adminChatId}:${messageId}`;
  db.prepare(
    `INSERT INTO relay (relayKey, customerId) VALUES (?, ?)
     ON CONFLICT(relayKey) DO UPDATE SET customerId = excluded.customerId`
  ).run(key, String(customerId));
}

function getRelay(adminChatId, messageId) {
  const key = `${adminChatId}:${messageId}`;
  const row = db.prepare('SELECT customerId FROM relay WHERE relayKey = ?').get(key);
  return row ? row.customerId : null;
}

/* ===================== Umumiy xotira (sayt uchun: mahsulotlar, promokodlar, ===================== */
/* buyurtmalar ro'yxati, sozlamalar va h.k.) — barcha qurilma/brauzerlar shu     */
/* bitta bazani o'qib-yozadi, shuning uchun hamma bir xil ma'lumotni ko'radi.    */

function storeGet(key) {
  const row = db.prepare('SELECT value FROM store WHERE storeKey = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

function storeSet(key, value) {
  db.prepare(
    `INSERT INTO store (storeKey, value) VALUES (?, ?)
     ON CONFLICT(storeKey) DO UPDATE SET value = excluded.value`
  ).run(key, JSON.stringify(value === undefined ? null : value));
  return value;
}

function storeDelete(key) {
  db.prepare('DELETE FROM store WHERE storeKey = ?').run(key);
}

migrateLegacyJsonIfPresent();

module.exports = {
  loadOrders,
  addOrder,
  getOrder,
  updateOrder,
  getOrdersByPhone,
  loadUsers,
  getUser,
  getUserByPhone,
  normalizePhone,
  upsertUser,
  setRelay,
  getRelay,
  storeGet,
  storeSet,
  storeDelete,
};
