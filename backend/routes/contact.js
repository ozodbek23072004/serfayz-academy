import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contacts.json');

// ── Yordamchi funksiyalar ──
function readContacts() {
  if (!fs.existsSync(CONTACTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveContacts(contacts) {
  const dir = path.dirname(CONTACTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
}

function checkAdmin(req, res) {
  const token = req.headers['x-admin-token'];
  const adminToken = process.env.ADMIN_TOKEN || 'serfayz-admin-2024';
  if (token !== adminToken) {
    res.status(403).json({ error: "Ruxsat yo'q. Admin token talab qilinadi." });
    return false;
  }
  return true;
}

// ── POST /api/contact — Yangi ariza qabul qilish ──
router.post('/', (req, res) => {
  try {
    const { phone, course, name, message } = req.body;

    // Validatsiya: telefon bo'sh bo'lmasin
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: "Telefon raqam bo'sh bo'lishi mumkin emas." });
    }

    const phoneClean = phone.trim();

    // Format tekshiruvi
    const phoneRegex = /^\+?[0-9\s\-()]{9,20}$/;
    if (!phoneRegex.test(phoneClean)) {
      return res.status(400).json({ success: false, message: "Noto'g'ri telefon raqam formati." });
    }

    const contacts = readContacts();

    // Yangi ariza
    const newContact = {
      id: Date.now().toString(),
      name: (name || '').toString().trim().slice(0, 100),
      phone: phoneClean,
      course: (course || '').toString().trim().slice(0, 100),
      message: (message || '').toString().trim().slice(0, 500),
      status: 'new',   // new | contacted | enrolled
      createdAt: new Date().toISOString()
    };

    contacts.push(newContact);
    saveContacts(contacts);

    console.log(`📩 Yangi ariza: ${newContact.name || 'Nomsiz'} | ${newContact.phone} | ${newContact.course || 'kurs ko\'rsatilmagan'}`);

    // Telegram'ga yuborish
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (telegramBotToken) {
      if (!telegramChatId) {
        console.warn("⚠️ Telegram CHAT_ID kiritilmagan (.env). Xabar yuborilmaydi. Iltimos Chat ID ni toping va qo'shing.");
      } else {
        const text = `📩 <b>Yangi ariza keldi!</b>\n\n👤 Ism: ${newContact.name || 'Nomsiz'}\n📞 Telefon: ${newContact.phone}\n🎓 Kurs: ${newContact.course || '-'}\n💬 Xabar: ${newContact.message || '-'}`;
        
        // Chat ID larni vergul orqali ajratib, har biriga alohida yuborish
        const chatIds = telegramChatId.split(',').map(id => id.trim()).filter(id => id);
        
        chatIds.forEach(chatId => {
          fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: 'HTML'
            })
          }).then(async res => {
            if (!res.ok) {
              console.error(`Telegram xatosi (${chatId}):`, await res.text());
            }
          }).catch(err => console.error(`Telegram fetch xatosi (${chatId}):`, err));
        });
      }
    }

    res.json({
      success: true,
      message: "Arizangiz qabul qilindi! Tez orada siz bilan bog'lanamiz.",
      id: newContact.id
    });

  } catch (error) {
    console.error("Contact POST xatosi:", error);
    res.status(500).json({ success: false, message: "Server ichki xatosi yuz berdi." });
  }
});

// ── GET /api/contact — Admin: barcha arizalarni ko'rish ──
router.get('/', (req, res) => {
  if (!checkAdmin(req, res)) return;

  try {
    const contacts = readContacts();
    const { status, limit = 100, offset = 0 } = req.query;

    let filtered = status ? contacts.filter(c => c.status === status) : contacts;
    const total = filtered.length;

    // Yangilardan eskiga tartiblash
    filtered = filtered
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      total,
      data: filtered
    });
  } catch (error) {
    console.error("Contact GET xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi." });
  }
});

// ── PATCH /api/contact/:id — Admin: status o'zgartirish ──
router.patch('/:id', (req, res) => {
  if (!checkAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'enrolled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status noto'g'ri. Mumkinlar: ${validStatuses.join(', ')}` });
    }

    const contacts = readContacts();
    const idx = contacts.findIndex(c => c.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Ariza topilmadi.' });
    }

    contacts[idx].status = status;
    contacts[idx].updatedAt = new Date().toISOString();
    saveContacts(contacts);

    res.json({ success: true, data: contacts[idx] });
  } catch (error) {
    console.error("Contact PATCH xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi." });
  }
});

// ── DELETE /api/contact/:id — Admin: arizani o'chirish ──
router.delete('/:id', (req, res) => {
  if (!checkAdmin(req, res)) return;

  try {
    const { id } = req.params;
    let contacts = readContacts();
    const before = contacts.length;
    contacts = contacts.filter(c => c.id !== id);

    if (contacts.length === before) {
      return res.status(404).json({ error: 'Ariza topilmadi.' });
    }

    saveContacts(contacts);
    res.json({ success: true, message: 'Ariza o\'chirildi.' });
  } catch (error) {
    console.error("Contact DELETE xatosi:", error);
    res.status(500).json({ success: false, message: "Server xatosi." });
  }
});

export default router;
