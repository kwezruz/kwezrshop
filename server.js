require('dotenv').config();
const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const db = require('./db');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const ADMIN_IDS = (process.env.ADMIN_CHAT_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN topilmadi. .env faylini tekshiring (.env.example dan nusxa oling).');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

/* ===================== Yordamchi funksiyalar ===================== */

const STATUS_LABEL = {
  new: '🆕 Yangi',
  processing: '🧵 Tayyorlanmoqda',
  shipped: '🚚 Yo\'lda',
  delivered: '📦 Yetkazildi',
  cancelled: '❌ Bekor qilindi',
};

function isAdmin(ctx) {
  const id = String(ctx.from?.id || '');
  return ADMIN_IDS.includes(id);
}

function money(n) {
  return Number(n || 0).toLocaleString('ru-RU') + " so'm";
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function orderCaption(o) {
  const itemsText = (o.items || [])
    .map((it) => `• ${escapeHtml(it.name)}${it.size ? ' [' + escapeHtml(it.size) + ']' : ''} × ${it.qty} — ${money(it.price * it.qty)}`)
    .join('\n');

  const lines = [
    `<b>Buyurtma ${escapeHtml(o.id)}</b>`,
    '',
    `👤 ${escapeHtml(o.customerName || '-')} — ${escapeHtml(o.phone || '-')}`,
    `📍 ${escapeHtml(o.address || '-')}${o.deliveryRegion ? ' (' + escapeHtml(o.deliveryRegion) + ')' : ''}`,
    '',
    itemsText || '—',
    '',
    `💰 Mahsulotlar: ${money(o.itemsTotal)}`,
    `🚚 Yetkazish: ${o.deliveryFee ? money(o.deliveryFee) : 'Bepul'}`,
  ];
  if (o.discount) lines.push(`🏷 Chegirma${o.promoCode ? ' (' + escapeHtml(o.promoCode) + ')' : ''}: −${money(o.discount)}`);
  lines.push(`<b>Jami: ${money(o.total)}</b>`);
  lines.push('');
  lines.push(`Holat: <b>${STATUS_LABEL[o.status] || o.status}</b>`);
  lines.push(`To'lov: ${o.paymentConfirmed ? "✅ Tasdiqlangan" : '⏳ Tekshirilmoqda'}`);
  return lines.join('\n');
}

function orderKeyboard(o) {
  const rows = [];
  if (!o.paymentConfirmed && o.status !== 'cancelled') {
    rows.push([
      Markup.button.callback("✅ To'lovni tasdiqlash", `payok|${o.id}`),
      Markup.button.callback('❌ Rad etish', `payno|${o.id}`),
    ]);
  }
  if (o.status !== 'delivered' && o.status !== 'cancelled') {
    const statusRow = [];
    if (o.status !== 'processing') statusRow.push(Markup.button.callback('🧵 Tayyorlanmoqda', `st|processing|${o.id}`));
    if (o.status !== 'shipped') statusRow.push(Markup.button.callback("🚚 Yo'lda", `st|shipped|${o.id}`));
    if (o.status !== 'delivered') statusRow.push(Markup.button.callback('📦 Yetkazildi', `st|delivered|${o.id}`));
    rows.push(statusRow);
    rows.push([Markup.button.callback('❌ Buyurtmani bekor qilish', `st|cancelled|${o.id}`)]);
  }
  return rows.length ? Markup.inlineKeyboard(rows) : undefined;
}

async function sendOrderCard(chatId, order) {
  const caption = orderCaption(order);
  const kb = orderKeyboard(order);
  try {
    if (order.receiptImage && order.receiptImage.startsWith('data:image')) {
      const base64 = order.receiptImage.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      return await bot.telegram.sendPhoto(
        chatId,
        { source: buffer },
        { caption, parse_mode: 'HTML', ...(kb || {}) }
      );
    }
    return await bot.telegram.sendMessage(chatId, caption, { parse_mode: 'HTML', ...(kb || {}) });
  } catch (e) {
    console.error('Adminga xabar yuborishda xatolik:', chatId, e.message);
  }
}

async function notifyAdmins(order) {
  if (!ADMIN_IDS.length) {
    console.warn("⚠️ ADMIN_CHAT_IDS bo'sh — hech kimga bildirishnoma yuborilmadi. .env ni to'ldiring.");
    return;
  }
  for (const chatId of ADMIN_IDS) {
    await sendOrderCard(chatId, order);
  }
}

/* ===================== Bot buyruqlari ===================== */

bot.start((ctx) => {
  ctx.reply(
    `Salom! Sizning chat ID'ingiz: ${ctx.from.id}\n\n` +
      (isAdmin(ctx)
        ? "Siz admin sifatida ro'yxatdan o'tgansiz ✅\n/orders — faol buyurtmalar\n/stats — statistika"
        : "Bu ID'ni .env faylidagi ADMIN_CHAT_IDS ga qo'shsangiz, admin panel buyruqlaridan foydalana olasiz.")
  );
});

bot.command('id', (ctx) => ctx.reply(`Chat ID: ${ctx.from.id}`));

bot.command('orders', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Sizda ruxsat yo'q.");
  const orders = db.loadOrders().filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  if (!orders.length) return ctx.reply("Hozircha faol buyurtmalar yo'q.");
  await ctx.reply(`Faol buyurtmalar: ${orders.length} ta`);
  for (const o of orders.slice(0, 15)) {
    await sendOrderCard(ctx.chat.id, o);
  }
});

bot.command('stats', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Sizda ruxsat yo'q.");
  const orders = db.loadOrders();
  const counts = orders.reduce((acc, o) => {
    acc[o.status || 'new'] = (acc[o.status || 'new'] || 0) + 1;
    return acc;
  }, {});
  const total = orders.reduce((s, o) => s + (o.status !== 'cancelled' ? Number(o.total || 0) : 0), 0);
  const lines = [
    `📊 <b>Statistika</b>`,
    `Jami buyurtmalar: ${orders.length}`,
    ...Object.entries(counts).map(([k, v]) => `${STATUS_LABEL[k] || k}: ${v}`),
    `Umumiy summa (bekor qilinganlarsiz): ${money(total)}`,
  ];
  ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
});

bot.on('callback_query', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Sizda ruxsat yo'q");
  const data = ctx.callbackQuery.data || '';
  const parts = data.split('|');
  const action = parts[0];

  try {
    if (action === 'payok') {
      const id = parts[1];
      const order = db.updateOrder(id, { paymentConfirmed: true, status: 'processing' });
      await ctx.answerCbQuery("To'lov tasdiqlandi ✅");
      await refreshCard(ctx, order);
    } else if (action === 'payno') {
      const id = parts[1];
      const order = db.updateOrder(id, { paymentConfirmed: false, status: 'cancelled' });
      await ctx.answerCbQuery('Rad etildi ❌');
      await refreshCard(ctx, order);
    } else if (action === 'st') {
      const status = parts[1];
      const id = parts[2];
      const order = db.updateOrder(id, { status });
      await ctx.answerCbQuery(`Holat: ${STATUS_LABEL[status] || status}`);
      await refreshCard(ctx, order);
    } else {
      await ctx.answerCbQuery();
    }
  } catch (e) {
    console.error(e);
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
});

async function refreshCard(ctx, order) {
  if (!order) return;
  const caption = orderCaption(order);
  const kb = orderKeyboard(order);
  try {
    if (ctx.callbackQuery.message.photo) {
      await ctx.editMessageCaption(caption, { parse_mode: 'HTML', ...(kb || { reply_markup: { inline_keyboard: [] } }) });
    } else {
      await ctx.editMessageText(caption, { parse_mode: 'HTML', ...(kb || { reply_markup: { inline_keyboard: [] } }) });
    }
  } catch (e) {
    // Telegram "message not modified" kabi xatolarni e'tiborsiz qoldiramiz
  }
}

/* ===================== HTTP API (sayt shu yerga buyurtma yuboradi) ===================== */

const app = express();
app.use(express.json({ limit: '15mb' }));

// Sayt boshqa domenda/portda ishlasa CORS kerak bo'ladi
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/order', async (req, res) => {
  const order = req.body;
  if (!order || !order.id || !Array.isArray(order.items)) {
    return res.status(400).json({ ok: false, error: 'Noto\'g\'ri buyurtma formati' });
  }
  db.addOrder(order);
  await notifyAdmins(order);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ API server ishga tushdi: http://localhost:${PORT}`);
});

bot.launch().then(() => console.log('✅ Telegram bot ishga tushdi (polling)'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
