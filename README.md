# Serfayz Academy — To'liq Funktsional Veb-sayt Tizimi

Ushbu loyiha **Serfayz Academy** o'quv markazi uchun mo'ljallangan zamonaviy, tezkor va AI bilan integratsiya qilingan veb-platformadir.

## 🚀 Loyiha Haqida

Loyiha ikki qismdan iborat:
1. **Frontend**: Foydalanuvchilar uchun yuqori darajadagi UI/UX dizayn (Bento grid, Glassmorphism).
2. **Backend**: Ma'lumotlarni boshqarish, arizalarni qabul qilish va AI Chatbot xizmati.

## ✨ Imkoniyatlar

- **AI Chatbot**: Groq Cloud API (Llama 3) yordamida `academy.json` ma'lumotlari asosida o'quvchilarga 24/7 javob beradi.
- **Premium Dizayn**: To'liq responsiv (mobil va desktop), qorong'u rejim (dark mode) va zamonaviy animatsiyalar.
- **Ariza Tizimi**: Foydalanuvchilar "Birinchi dars bepul" xizmati uchun ariza qoldirishlari mumkin. Arizalar avtomatik ravishda backendda `contacts.json` fayliga saqlanadi.
- **Bento Grid Kurslar**: Kurslar haqida barcha ma'lumotlar vizual qulay bloklarda taqdim etilgan.
- **Silliq Navigatsiya**: Sahifa ichidagi silliq scroll va interaktiv elementlar.

## 🛠 Texnologiyalar

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript.
- **Backend**: Node.js, Express.js.
- **AI Integratsiya**: Groq API (llama3-8b-8192).
- **Ma'lumotlar**: JSON (Local database).

## 📦 O'rnatish va Ishga Tushirish

### 1. Backendni sozlash
Loyihaning `serfayz-backend` papkasiga kiring:
```bash
cd serfayz-backend
```
Zaruriy paketlarni o'rnating:
```bash
npm install
```
`.env` faylini yarating va Groq API kalitingizni kiriting:
```env
PORT=3000
GROQ_API_KEY=your_api_key_here
```
Serverni ishga tushiring:
```bash
npm start
```

### 2. Frontendni ochish
Frontend fayli quyidagi manzilda joylashgan:
`vebsayt-dizayn-yangilash/MERGED_final.html`

Uni brauzerda (yoki Live Server orqali) oching. Backend `localhost:3000` da ishlayotgan bo'lsa, Chat va Ariza topshirish funksiyalari avtomatik ishlaydi.

## 📂 Fayl Tuzilmasi

```text
anti/
├── serfayz-backend/        # Express.js server
│   ├── data/               # academy.json va contacts.json
│   ├── routes/             # Chat va Contact API routelar
│   ├── server.js           # Asosiy server fayli
│   └── .env                # Maxfiy sozlamalar
├── vebsayt-dizayn-yangilash/
│   └── MERGED_final.html   # Asosiy UI fayli
├── logo.png                # Akademiyaning logotipi
└── README.md               # Ushbu qo'llanma
```

## 📝 Muallif
**Serfayz Academy Team** — Kelajak Bugundan Boshlanadi!
