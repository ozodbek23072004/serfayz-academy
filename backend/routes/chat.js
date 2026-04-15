import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Simple in-memory rate limiter (IP ga minutiga max 20 so'rov) ──
const rateLimitMap = new Map();
const RATE_LIMIT = 20;       // so'rovlar soni
const RATE_WINDOW = 60_000;  // 1 daqiqa (ms)

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_WINDOW) {
    // Yangi oyna boshlash
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  rateLimitMap.set(ip, entry);
  return true;
}

// ── Academy ma'lumotlarini yuklash ──
function loadAcademy() {
  const dataPath = path.join(__dirname, '..', 'data', 'academy.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// ── Admin uslubida system prompt ──
function buildSystemPrompt(academy) {
  const a = academy.academy;
  const courses = academy.courses.map(c =>
    `• ${c.name}: ${c.price} | ${c.duration}`
  ).join('\n');
  const discounts = (academy.discounts_and_promotions || []).map(d => `• ${d}`).join('\n');

  return `Sen "Serfayz O'quv Markazi" ning qabul bo'limidagi xodimisan. Ismingiz Serfayz AI.

📍 Manzil: ${a.address}
📞 Telefon: ${a.phone}
💬 Telegram: ${a.telegram_link || 'https://t.me/serfayztv'} (${a.telegram || '@serfayzuz'})
📸 Instagram: ${a.instagram_link || 'https://www.instagram.com/serfayztv'} (${a.instagram || '@serfayztv'})
🕐 Ish vaqti: ${a.working_hours}
👥 Guruhlar: ${a.group_size || 'Kichik guruhlar (8–12 kishi)'}
📅 Jadval: Dars jadvali kelishilgan holda — ertalabki yoki kechki guruh
💳 To'lov: Naqd pul, Click, Payme, bank kartasi. Bo'lib to'lash mumkin.
👨‍🏫 O'qituvchilar: Barcha o'qituvchilar milliy sertifikatga ega
🎂 Yosh: Yosh chegarasi yo'q — barcha yoshdagilar qabul qilinadi

KURSLAR VA NARXLAR:
${courses}

AKSIYALAR VA CHEGIRMALAR:
${discounts}

MULOQOT USLUBI:
- Haqiqiy qabul bo'lim xodimi kabi samimiy, tabiiy gapir — ortiqcha rasmiy bo'lma.
- Har javob oxirida suhbatni davom ettiruvchi qisqa savol qo'y, masalan: "Yana savollaringiz bormi?", "Qaysi kurs qiziqtiradi?", "Qanday yordam bera olaman?" kabi.
- "Birinchi dars bepul" ni FAQAT kursga yozilish yoki narx haqida so'ralganda eslatib o't — har javobda emas.
- Javoblar qisqa va aniq. Uzun ro'yxatlar yozma.
- Emoji faqat zarur joyda — har jumlada ishlatma.

QOIDALAR:
1. FAQAT yuqoridagi ma'lumotlar asosida javob ber. Hech narsa to'qima.
2. O'zbek tilida gapir.
3. Bilmagan narsani to'qima — telefonga yo'naldir: ${a.phone} yoki Telegram: ${a.telegram_link || 'https://t.me/serfayztv'}`;
}

// ── POST /api/chat ──
router.post('/', async (req, res) => {
  // Rate limit tekshiruvi
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Juda ko\'p so\'rov yuborildingiz. Bir daqiqadan keyin qaytadan urinib ko\'ring.'
    });
  }

  try {
    const { message, history = [] } = req.body;

    // Validatsiya
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Xabar bo'sh bo'lishi mumkin emas." });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: "Xabar bo'sh bo'lishi mumkin emas." });
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({ error: "Xabar juda uzun (max 1000 belgi)." });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY topilmadi!');
      return res.status(500).json({ error: "AI xizmati hozircha mavjud emas." });
    }

    // Academy ma'lumotlarini yuklash
    const academy = loadAcademy();
    const systemPrompt = buildSystemPrompt(academy);

    // Tarix (max 8 ta juft = 16 xabar) — token limit uchun
    const cleanHistory = Array.isArray(history)
      ? history.slice(-16).filter(m =>
          m && typeof m === 'object' &&
          ['user', 'assistant'].includes(m.role) &&
          typeof m.content === 'string'
        )
      : [];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...cleanHistory,
      { role: 'user', content: trimmed }
    ];

    // Groq API ga yuborish — llama-3.1-70b (eng kuchli bepul model)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',   // Eng kuchli bepul Groq modeli
        messages,
        max_tokens: 600,
        temperature: 0.65,
        top_p: 0.9,
      })
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error(`❌ Groq API xatosi (${groqRes.status}):`, errBody);

      // Model topilmasa fallback
      if (groqRes.status === 404 || errBody.includes('model')) {
        return tryFallbackModel(apiKey, messages, res);
      }

      return res.status(502).json({ error: "AI xizmatida vaqtinchalik muammo. Iltimos qaytadan urinib ko'ring." });
    }

    const data = await groqRes.json();

    if (!data.choices?.[0]?.message?.content) {
      console.error('❌ Groq javobida content yo\'q:', JSON.stringify(data));
      return res.status(502).json({ error: "AI javob bera olmadi." });
    }

    const reply = data.choices[0].message.content;

    // Token statistikasi logga yozish
    if (data.usage) {
      console.log(`📊 Tokenlar: kirish=${data.usage.prompt_tokens}, chiqish=${data.usage.completion_tokens}`);
    }

    res.json({ reply });

  } catch (error) {
    console.error('❌ Chat routeda xato:', error.message);
    res.status(500).json({ error: "Server ichki xatosi yuz berdi." });
  }
});

// ── Fallback: llama3-8b-8192 (eski ishonchli model) ──
async function tryFallbackModel(apiKey, messages, res) {
  try {
    const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      })
    });

    if (!fallbackRes.ok) {
      return res.status(502).json({ error: "AI xizmatida muammo. Iltimos keyinroq urinib ko'ring." });
    }

    const data = await fallbackRes.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return res.status(502).json({ error: "AI javob bera olmadi." });

    console.log('⚠️  Fallback model ishlatildi: llama3-8b-8192');
    res.json({ reply });

  } catch (err) {
    console.error('❌ Fallback modeli ham ishlamadi:', err.message);
    res.status(500).json({ error: "Server ichki xatosi." });
  }
}

export default router;
