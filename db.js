const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'kwezr_orders.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

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

module.exports = { loadOrders, saveOrders, addOrder, getOrder, updateOrder };
