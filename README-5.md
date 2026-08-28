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

## 4. Saytni ochish

Endi bitta server ham botni, ham saytning o'zini ishga tushiradi. `npm start`
dan keyin brauzeringizda shu manzilni oching:

```
http://localhost:3000
```

Sayt shu yerdan ochiladi va buyurtma berilganda avtomatik shu serverdagi
botga xabar ketadi (qo'shimcha sozlash shart emas).

> Eslatma: agar `public/index.html` faylini to'g'ridan-to'g'ri (server
> ishlamasdan) ikki marta bosib brauzerda ochsangiz, sayt ko'rinadi, lekin
> buyurtmalar botga yetib bormaydi — chunki bildirishnoma yuborish uchun
> server ishlab turishi shart.

Agar serverni boshqa joyda (masalan VPS'da, o'z domeningizda) joylashtirsangiz,
hammasi o'sha manzilda avtomatik ishlayveradi — `public/index.html` ichidagi
kod nisbiy manzildan (`/api/order`) foydalanadi, uni qo'lda o'zgartirish
shart emas.

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

## 6. Sayt ma'lumotlari endi umumiy (hamma bir xil narsani ko'radi)

Avval mahsulotlar, promokodlar, buyurtmalar, ro'yxatdan o'tgan foydalanuvchilar
va h.k. faqat **shu brauzerning** xotirasida (`localStorage`) saqlanardi —
ya'ni har bir kishi, har bir qurilma o'zining alohida nusxasini ko'rardi
(masalan, admin qo'shgan mahsulot boshqa telefonda ko'rinmasdi).

Endi bu ma'lumotlar **serverning o'zida** (`data/kwezr_store.json` faylida)
saqlanadi. Shuning uchun:

- Admin panelda qo'shilgan/o'zgartirilgan mahsulot, promokod, yetkazib berish
  hududi, banner va sozlamalar — saytga kirgan **hamma** uchun (har qanday
  telefon, kompyuter, brauzerdan) bir xil ko'rinadi.
- Bu ishlashi uchun server (`npm start`) **doim ishlab turishi shart**. Server
  o'chiq bo'lsa yoki internet/tarmoq bilan bog'lanib bo'lmasa, sayt vaqtincha
  o'sha brauzerning eski (localStorage'dagi) nusxasiga qaytadi — lekin bu
  boshqalarga ko'rinmaydi, faqat vaqtinchalik zaxira sifatida ishlaydi.
- Shaxsiy narsalar (masalan tanlangan til, kim sifatida tizimga
  kirilgani — "sessiya") hamon faqat shu brauzerda qoladi, chunki ular
  boshqalarga umuman tegishli emas.

> Eslatma: `/api/store/*` manzili hozircha parolsiz — ya'ni har kim bu
> manzilga to'g'ridan-to'g'ri so'rov yuborib, ma'lumotni o'zgartirishi mumkin.
> Sayt faqat o'zingiz va ishonchli adminlar orasida ishlatilsa muammo emas,
> lekin ochiq internetga (real domenga) chiqarsangiz, buni kelajakda parol/
> token bilan himoyalashni tavsiya qilamiz.

## 7. Endi haqiqiy baza ishlatiladi (SQLite)

Avval hamma narsa oddiy JSON fayllarda saqlanardi. Endi bular o'rniga
**SQLite** — haqiqiy SQL bazasi — ishlatiladi:

- Baza fayli: `data/kwezr.db` (bitta fayl, lekin ichida to'g'ri jadvallar,
  indekslar bilan — Excel emas, chinakam relyatsion baza).
- `npm install` qilganda `better-sqlite3` paketi avtomatik o'rnatiladi —
  qo'shimcha sozlash shart emas, server ("Docker", "Postgres" kabi alohida
  dastur o'rnatish) kerak emas.
- **Eski ma'lumotlaringiz yo'qolmaydi**: agar avval `data/kwezr_orders.json`,
  `data/kwezr_users.json` va h.k. fayllar bo'lgan bo'lsa, server birinchi marta
  ishga tushganda ularni avtomatik SQLite bazasiga ko'chiradi va eski
  fayllarni `.old` qo'shimchasi bilan qoldiradi (zaxira sifatida).
- Nega bu yaxshi: bir vaqtning o'zida bir nechta so'rov kelganda (masalan
  bir vaqtda ikki xil buyurtma tushsa) ma'lumot buzilib qolish xavfi yo'q,
  qidirish (masalan mijozning barcha buyurtmalarini topish) tezroq ishlaydi,
  va fayl hajmi kattalashsa ham baza sekinlashib ketmaydi.

## Eslatma

- Buyurtmalar `data/kwezr_orders.json`, mijozlar `data/kwezr_users.json`,
  admin↔mijoz yozishmalar xaritasi `data/kwezr_relay.json`, saytning umumiy
  ma'lumotlari (mahsulotlar, promokodlar va h.k.) `data/kwezr_store.json`
  fayllarida saqlanadi (oddiy fayl asosidagi baza). Katta hajmdagi loyiha
  uchun buni PostgreSQL/MongoDB kabi haqiqiy bazaga almashtirish tavsiya
  etiladi.
- Server doim ishlab turishi kerak (masalan VPS + `pm2` yoki systemd orqali),
  aks holda sayt xabar yubora olmaydi, mijozlar bilan yozishma ishlamaydi va
  mahsulotlar/promokodlar kabi umumiy ma'lumotlar hamma uchun yangilanmaydi.
  Mahalliy kompyuterda faqat siz ishlatayotgan vaqtda ishlaydi.
