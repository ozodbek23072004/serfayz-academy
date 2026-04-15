// server.js — Serfayz Academy Backend Server
// Node.js + Express | Port 3000

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import chatRouter from './routes/chat.js';
import contactRouter from './routes/contact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────
// 1. Academy ma'lumotlarini o'qish (server start da)
// ──────────────────────────────────────────────
const academyPath = path.join(__dirname, 'data', 'academy.json');
let academyData;

try {
  const raw = fs.readFileSync(academyPath, 'utf-8');
  academyData = JSON.parse(raw);
  console.log(`✅ academy.json yuklandi: ${academyData.courses.length} ta kurs`);
} catch (err) {
  console.error('❌ academy.json o\'qishda xato:', err.message);
  process.exit(1);
}

// Ma'lumotlarni barcha route'larga ulash
app.locals.academy = academyData;

// ──────────────────────────────────────────────
// 2. Middleware'lar
// ──────────────────────────────────────────────

// CORS — frontend URL laridan so'rovlarga ruxsat
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // VS Code Live Server, Postman, curl yoki file:// uchun origin yo'q (null) bo'lishi mumkin
      if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Development uchun barcha originlarga ruxsat beramiz
        // Production da bu qatorni o'chirib qo'ying:
        callback(null, true);
        // callback(new Error(`CORS: ${origin} ga ruxsat yo'q`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-token'],
    credentials: true,
  })
);

// JSON body parser (maksimum 50kb)
app.use(express.json({ limit: '50kb' }));

// URL encoded forms
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Request logger (development uchun)
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString('uz-UZ');
  console.log(`[${time}] ${req.method} ${req.path}`);
  next();
});

// ──────────────────────────────────────────────
// 3. Route'lar
// ──────────────────────────────────────────────

// Sog'liq tekshiruvi
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    server: 'Serfayz Academy API',
    version: '1.0.0',
    endpoints: {
      data: 'GET /api/data',
      chat: 'POST /api/chat',
      contact: {
        submit: 'POST /api/contact',
        list: 'GET /api/contact (admin)',
        update: 'PATCH /api/contact/:id (admin)',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// /api/data — Frontend uchun akademiya ma'lumotlari
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    data: academyData,
  });
});

// /api/chat — AI chatbot
app.use('/api/chat', chatRouter);

// /api/contact — Ariza formasi
app.use('/api/contact', contactRouter);

// ──────────────────────────────────────────────
// 4. 404 va Xato ushlash
// ──────────────────────────────────────────────

// 404 — Topilmagan route
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint topilmadi',
    path: req.path,
    hint: 'GET / — mavjud endpointlar ro\'yxati',
  });
});

// Global xato handler
app.use((err, req, res, next) => {
  console.error('Server xatosi:', err.message);

  // CORS xatosi
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // JSON parse xatosi
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Noto\'g\'ri JSON format' });
  }

  res.status(500).json({ error: 'Server ichki xatosi' });
});

// ──────────────────────────────────────────────
// 5. Serverni ishga tushirish
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     SERFAYZ ACADEMY BACKEND SERVER     ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📊 Ma'lumotlar:         http://localhost:${PORT}/api/data`);
  console.log(`🤖 AI Chat:             POST http://localhost:${PORT}/api/chat`);
  console.log(`📩 Arizalar:            POST http://localhost:${PORT}/api/contact`);
  console.log(`🔑 Groq API key: ${process.env.GROQ_API_KEY ? '✅ Topildi' : '⚠️  Topilmadi (.env ga qo\'shing)'}`);
  console.log('─'.repeat(42));
  console.log(`⏰ ${new Date().toLocaleString('uz-UZ')}\n`);
});

export default app;
