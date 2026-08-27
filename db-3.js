const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'kwezr_orders.json');
const USERS_FILE = path.join(DATA_DIR, 'kwezr_users.json');
const RELAY_FILE = path.join(DATA_DIR, 'kwezr_relay.json');
const STORE_FILE = path.join(DATA_DIR, 'kwezr_store.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(RELAY_FILE)) fs.writeFileSync(RELAY_FILE, '{}');
if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '{}');

function loadOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function addOrder(order) {
  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

function getOrder(id) {
  return loadOrders().find((o) => o.id === id) || null;
}

function updateOrder(id, patch) {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch };
  saveOrders(orders);
  return orders[idx];
}

/* ===================== Foydalanuvchilar (ro'yxatdan o'tish) ===================== */

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUser(telegramId) {
  return loadUsers().find((u) => String(u.telegramId) === String(telegramId)) || null;
}

function upsertUser(data) {
  const users = loadUsers();
  const idx = users.findIndex((u) => String(u.telegramId) === String(data.telegramId));
  if (idx === -1) {
    const user = { ...data, registeredAt: new Date().toISOString() };
    users.unshift(user);
    saveUsers(users);
    return user;
  }
  users[idx] = { ...users[idx], ...data };
  saveUsers(users);
  return users[idx];
}

/* ===================== Admin <-> mijoz xabar ko'prigi ===================== */
/* Admin forward qilingan xabarga "Reply" qilganda, qaysi mijozga
   yuborish kerakligini bilish uchun (adminChatId:messageId -> customerId) */

function loadRelay() {
  try {
    return JSON.parse(fs.readFileSync(RELAY_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveRelay(map) {
  fs.writeFileSync(RELAY_FILE, JSON.stringify(map, null, 2));
}

function setRelay(adminChatId, messageId, customerId) {
  const map = loadRelay();
  map[`${adminChatId}:${messageId}`] = customerId;
  saveRelay(map);
}

function getRelay(adminChatId, messageId) {
  const map = loadRelay();
  return map[`${adminChatId}:${messageId}`] || null;
}

/* ===================== Umumiy xotira (sayt uchun: mahsulotlar, promokodlar, ===================== */
/* buyurtmalar, foydalanuvchilar va h.k.) — barcha qurilmalar/brauzerlar shu     */
/* bitta faylni o'qib-yozadi, shuning uchun hamma bir xil ma'lumotni ko'radi.    */

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveStoreAll(map) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(map, null, 2));
}

function storeGet(key) {
  const map = loadStore();
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}

function storeSet(key, value) {
  const map = loadStore();
  map[key] = value;
  saveStoreAll(map);
  return value;
}

function storeDelete(key) {
  const map = loadStore();
  delete map[key];
  saveStoreAll(map);
}

module.exports = {
  loadOrders,
  saveOrders,
  addOrder,
  getOrder,
  updateOrder,
  loadUsers,
  saveUsers,
  getUser,
  upsertUser,
  setRelay,
  getRelay,
  storeGet,
  storeSet,
  storeDelete,
};
