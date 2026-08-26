# KWEZR — Telegram bildirishnoma boti (admin panel bot ichida)

Bu bot KWEZR do'kon saytida yangi buyurtma tushganda sizga (adminga) Telegramda
xabar yuboradi — mijoz ismi, telefoni, mahsulotlar, summasi va to'lov cheki (rasm).
Xabar ostidagi tugmalar orqali to'g'ridan-to'g'ri Telegramdan:

- ✅ To'lovni tasdiqlash / ❌ Rad etish
- 🧵 Tayyorlanmoqda / 🚚 Yo'lda / 📦 Yetkazildi / ❌ Bekor qilish

qilishingiz mumkin — ya'ni **admin panel botning o'zi ichida** ishlaydi.

## 1. Bot yaratish

1. Telegramda **@BotFather** ga yozing.
2. `/newbot` buyrug'ini yuboring, nom va username bering.
3. Sizga bot **tokeni** beriladi (masalan `123456789:AAExample...`) — uni saqlab qo'ying.

## 2. O'rnatish

```bash
cd kwezr-telegram-admin-bot
npm install
cp .env.example .env
```

`.env` faylini oching va:

- `BOT_TOKEN` — BotFather bergan token
- `ADMIN_CHAT_IDS` — bo'sh qoldiring (keyingi qadamda to'ldiramiz)

## 3. Chat ID'ingizni olish

```bash
npm start
```

Endi Telegramda o'z botingizga `/start` deb yozing. Bot sizga chat ID'ingizni
yuboradi. Shu ID'ni `.env` faylidagi `ADMIN_CHAT_IDS` ga yozib, serverni qayta
ishga tushiring (`Ctrl+C`, keyin yana `npm start`). Bir nechta admin bo'lsa,
ID'larni vergul bilan yozing: `ADMIN_CHAT_IDS=111111111,222222222`

## 4. Saytni botga ulash

`server.js` `http://localhost:3000` portida ishlaydi va `/api/order` manziliga
POST so'rov qabul qiladi. Saytdagi `kwezr-shop.html` fayli buyurtma
yaratilganda shu manzilga avtomatik so'rov yuboradigan qilib sozlangan
(`BACKEND_URL` o'zgaruvchisi orqali, faylning boshida).

Agar serverni boshqa joyda (masalan VPS'da) ishga tushirsangiz, `kwezr-shop.html`
faylidagi `BACKEND_URL` qiymatini o'zingizning server manzilingizga
o'zgartiring, masalan:

```js
const BACKEND_URL = 'https://sizning-domeningiz.uz/api/order';
```

## 5. Bot buyruqlari (faqat adminlar uchun)

- `/orders` — hozirgi faol (yakunlanmagan) buyurtmalar ro'yxati
- `/stats` — umumiy statistika
- `/id` — chat ID'ingizni ko'rsatadi

## Eslatma

- Buyurtmalar `data/orders.json` faylida saqlanadi (oddiy fayl asosidagi baza).
  Katta hajmdagi loyiha uchun buni PostgreSQL/MongoDB kabi haqiqiy bazaga
  almashtirish tavsiya etiladi.
- Server doim ishlab turishi kerak (masalan VPS + `pm2` yoki systemd orqali),
  aks holda sayt xabar yubora olmaydi. Mahalliy kompyuterda faqat siz
  ishlatayotgan vaqtda ishlaydi.
