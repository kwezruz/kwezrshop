require('dotenv').config();
const express = require('express');
const path = require('path');
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

bot.start(async (ctx) => {
  if (isAdmin(ctx)) {
    return ctx.reply(
      `Salom! Sizning chat ID'ingiz: ${ctx.from.id}\n\n` +
        "Siz admin sifatida ro'yxatdan o'tgansiz ✅\n/orders — faol buyurtmalar\n/users — ro'yxatdan o'tgan mijozlar\n/stats — statistika"
    );
  }
  const existing = db.getUser(ctx.from.id);
  if (existing && existing.phone) {
    return ctx.reply(
      `Xush kelibsiz, ${existing.firstName}! Siz allaqachon ro'yxatdan o'tgansiz ✅\n\n` +
        "Savol yoki murojaatingiz bo'lsa, shu yerga yozing — adminimiz tez orada javob beradi.",
      Markup.removeKeyboard()
    );
  }
  await ctx.reply(
    "Assalomu alaykum! KWEZR botiga xush kelibsiz 👋\n\n" +
      "Ro'yxatdan o'tish uchun telefon raqamingizni yuboring:",
    Markup.keyboard([Markup.button.contactRequest('📱 Raqamni yuborish')])
      .oneTime()
      .resize()
  );
});

bot.command('id', (ctx) => ctx.reply(`Chat ID: ${ctx.from.id}`));

bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact;
  if (contact.user_id && contact.user_id !== ctx.from.id) {
    return ctx.reply("Iltimos, o'zingizning raqamingizni yuboring.");
  }
  const user = db.upsertUser({
    telegramId: ctx.from.id,
    firstName: ctx.from.first_name || '',
    lastName: ctx.from.last_name || '',
    username: ctx.from.username || '',
    phone: contact.phone_number,
  });
  await ctx.reply(
    `Rahmat, ${user.firstName}! Siz muvaffaqiyatli ro'yxatdan o'tdingiz ✅\n\n` +
      "Endi savol yoki murojaatingiz bo'lsa, shunchaki shu yerga yozing — adminimiz tez orada javob beradi.",
    Markup.removeKeyboard()
  );
  if (ADMIN_IDS.length) {
    for (const chatId of ADMIN_IDS) {
      bot.telegram
        .sendMessage(chatId, `🆕 Yangi ro'yxatdan o'tgan mijoz: ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)} — ${escapeHtml(user.phone)}${user.username ? ' (@' + user.username + ')' : ''}`, { parse_mode: 'HTML' })
        .catch(() => {});
    }
  }
});

bot.command('users', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Sizda ruxsat yo'q.");
  const users = db.loadUsers();
  if (!users.length) return ctx.reply("Hozircha ro'yxatdan o'tgan mijozlar yo'q.");
  const lines = users
    .slice(0, 30)
    .map((u) => `• ${u.firstName || ''} ${u.lastName || ''} — ${u.phone || '-'}${u.username ? ' (@' + u.username + ')' : ''}`);
  ctx.reply(`👥 Ro'yxatdan o'tganlar: ${users.length} ta\n\n${lines.join('\n')}`);
});

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

/* ===================== Admin ↔ mijoz yozishmasi ===================== */

async function relayCustomerMessage(ctx) {
  const user = db.getUser(ctx.from.id);
  if (!user || !user.phone) {
    return ctx.reply(
      "Yozishmani boshlash uchun avval ro'yxatdan o'ting: /start ni bosing va telefon raqamingizni yuboring."
    );
  }
  if (!ADMIN_IDS.length) {
    return ctx.reply("Kechirasiz, hozircha adminlar ulanmagan. Birozdan so'ng qayta urinib ko'ring.");
  }
  const header = `✉️ <b>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName || '')}</b> — ${escapeHtml(user.phone)}${user.username ? ' (@' + user.username + ')' : ''}:`;
  for (const chatId of ADMIN_IDS) {
    try {
      await bot.telegram.sendMessage(chatId, header, { parse_mode: 'HTML' });
      const forwarded = await ctx.forwardMessage(chatId);
      db.setRelay(chatId, forwarded.message_id, ctx.from.id);
    } catch (e) {
      console.error('Mijoz xabarini adminga yuborishda xatolik:', e.message);
    }
  }
  await ctx.reply("✅ Xabaringiz adminga yuborildi, tez orada javob beramiz.");
}

async function relayAdminReply(ctx) {
  const replyTo = ctx.message.reply_to_message;
  if (!replyTo) return; // admin oddiy yozgan, buyruq emas — e'tiborsiz qoldiramiz
  const customerId = db.getRelay(ctx.chat.id, replyTo.message_id);
  if (!customerId) return;
  try {
    await ctx.copyMessage(customerId);
    await ctx.reply('✅ Mijozga yuborildi.');
  } catch (e) {
    console.error('Mijozga javob yuborishda xatolik:', e.message);
    await ctx.reply("❌ Yuborib bo'lmadi (mijoz botni bloklagan bo'lishi mumkin).");
  }
}

bot.on(['text', 'photo', 'document', 'voice', 'video'], async (ctx, next) => {
  // Buyruqlar (/start, /orders va h.k.) alohida qayta ishlanadi
  if (ctx.message.text && ctx.message.text.startsWith('/')) return next();

  if (isAdmin(ctx)) {
    return relayAdminReply(ctx);
  }
  return relayCustomerMessage(ctx);
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

// Saytning o'zini shu manzilda ko'rsatamiz: http://localhost:3000
app.use(express.static(path.join(__dirname, 'public')));

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
