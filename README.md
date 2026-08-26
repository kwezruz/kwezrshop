# KWEZR — Telegram bildirishnoma boti (admin panel bot ichida)

Bu bot KWEZR do'kon saytida yangi buyurtma tushganda sizga (adminga) Telegramda
xabar yuboradi — mijoz ismi, telefoni, mahsulotlar, summasi va to'lov cheki (rasm).
Xabar ostidagi tugmalar orqali to'g'ridan-to'g'ri Telegramdan:

- ✅ To'lovni tasdiqlash / ❌ Rad etish
- 🧵 Tayyorlanmoqda / 🚚 Yo'lda / 📦 Yetkazildi / ❌ Bekor qilish

qilishingiz mumkin — ya'ni **admin panel botning o'zi ichida** ishlaydi.

Bundan tashqari, bot mijozlar bilan ham ishlaydi:

- **Ro'yxatdan o'tish**: mijoz botga `/start` yozganda, telefon raqamini yuborishi
  so'raladi (tugma bosib, real Telegram raqami ulanadi). Ro'yxatdan o'tgan
  mijozlar ro'yxati `/users` buyrug'i orqali adminlarga ko'rinadi.
- **Admin bilan yozishish**: ro'yxatdan o'tgan mijoz botga xabar yozsa, u
  avtomatik barcha adminlarga (mijoz ismi, raqami bilan) yetkaziladi. Admin
  o'sha xabarga Telegramda oddiy "Reply" (javob berish) qilib yozsa, javob
  to'g'ridan-to'g'ri mijozga yuboriladi — alohida qo'shimcha dastur kerak emas.

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

Endi Telegramda o'z botingizga `/id` deb yozing (ro'yxatdan o'tmagan bo'lsangiz
ham ishlaydi). Bot sizga chat ID'ingizni yuboradi. Shu ID'ni `.env` faylidagi
`ADMIN_CHAT_IDS` ga yozib, serverni qayta ishga tushiring (`Ctrl+C`, keyin yana
`npm start`). Bir nechta admin bo'lsa, ID'larni vergul bilan yozing:
`ADMIN_CHAT_IDS=111111111,222222222`

Shundan keyin botga `/start` yozsangiz, "admin sifatida ro'yxatdan o'tgansiz"
degan xabarni ko'rasiz.

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
- `/users` — ro'yxatdan o'tgan mijozlar ro'yxati (ism, telefon)
- `/stats` — umumiy statistika
- `/id` — chat ID'ingizni ko'rsatadi

## Mijoz uchun oqim

1. Mijoz `/start` yozadi → bot telefon raqamini so'raydi (tugma orqali).
2. Raqam yuborilgach, ro'yxatdan o'tgan hisoblanadi va bu haqda adminlarga
   xabar boradi.
3. Mijoz istalgan vaqt botga yozsa (savol, murojaat), xabar barcha
   adminlarga yuboriladi.
4. Admin o'sha xabarga Telegramda "Reply" qilib javob yozsa, javob
   avtomatik mijozga yetib boradi.

## Eslatma

- Buyurtmalar `data/kwezr_orders.json`, mijozlar `data/kwezr_users.json`,
  admin↔mijoz yozishmalar xaritasi `data/kwezr_relay.json` fayllarida
  saqlanadi (oddiy fayl asosidagi baza). Katta hajmdagi loyiha uchun buni
  PostgreSQL/MongoDB kabi haqiqiy bazaga almashtirish tavsiya etiladi.
- Server doim ishlab turishi kerak (masalan VPS + `pm2` yoki systemd orqali),
  aks holda sayt xabar yubora olmaydi va mijozlar bilan yozishma ishlamaydi.
  Mahalliy kompyuterda faqat siz ishlatayotgan vaqtda ishlaydi.
