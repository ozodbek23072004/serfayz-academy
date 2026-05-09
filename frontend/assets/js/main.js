  
    document.addEventListener("DOMContentLoaded", () => {
      const widget = document.getElementById("ai-chat-widget");
      const windowEl = document.getElementById("ai-chat-window");
      const toggleBtn = document.getElementById("ai-chat-toggle");
      const closeBtn = document.getElementById("close-chat-btn");
      const messagesContainer = document.getElementById("ai-chat-messages");
      const input = document.getElementById("ai-chat-input");
      const sendBtn = document.getElementById("ai-chat-send");
      const icon = document.getElementById("ai-chat-icon");

      let isOpen = false;
      let history = [];
      let isFirstOpen = true;

      const toggleChat = () => {
        isOpen = !isOpen;
        if (isOpen) {
          widget.classList.remove("opacity-0", "translate-y-4", "pointer-events-none");
          windowEl.classList.remove("scale-95");
          icon.textContent = "close";

          if (isFirstOpen) {
            isFirstOpen = false;
            setTimeout(() => {
              showTypingIndicator();
              setTimeout(() => {
                removeTypingIndicator();
                addMessage("Assalomu alaykum! 👋 Xush kelibsiz. Kurslar yoki narxlar haqida savollaringiz bormi?", "ai");
              }, 1200);
            }, 300);
          }
        } else {
          widget.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
          windowEl.classList.add("scale-95");
          icon.textContent = "forum";
        }
      };

      toggleBtn.addEventListener("click", toggleChat);
      closeBtn.addEventListener("click", toggleChat);

      const addMessage = (text, sender) => {
        const div = document.createElement("div");
        div.className = `max-w-[85%] rounded-2xl px-4 py-2.5 ${sender === "user" ? "bg-[#b0ff96] text-[#0e0e0e] self-end rounded-br-sm" : "bg-white shadow-xl dark:shadow-none dark:bg-[#1a1a1a] text-gray-900 dark:text-white border border-black/5 dark:border-white/10 self-start rounded-bl-sm"}`;

        div.innerHTML = text.replace(/\n/g, '<br/>');

        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (sender === "user") {
          history.push({ role: "user", content: text });
        } else {
          history.push({ role: "assistant", content: text });
        }

        if (history.length > 20) {
          history.splice(0, history.length - 20); // Keep last 10 pairs
        }
      };

      const showTypingIndicator = () => {
        const div = document.createElement("div");
        div.id = "typing-indicator";
        div.className = "bg-white shadow-xl dark:shadow-none dark:bg-[#1a1a1a] text-[#b0ff96] border border-black/5 dark:border-white/10 self-start rounded-2xl rounded-bl-sm px-4 py-2.5 tracking-[0.2em] font-black text-xs flex items-center";
        div.innerHTML = `<span class="animate-bounce inline-block">●</span><span class="animate-bounce inline-block" style="animation-delay: 0.1s">●</span><span class="animate-bounce inline-block" style="animation-delay: 0.2s">●</span>`;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      };

      const removeTypingIndicator = () => {
        const el = document.getElementById("typing-indicator");
        if (el) el.remove();
      };

      const API_BASE = "";

      const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        input.value = "";
        addMessage(text, "user");
        input.disabled = true;
        sendBtn.disabled = true;

        showTypingIndicator();

        try {
          const reqHistory = history.slice(0, -1);

          const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "omit",   // file:// protokoli uchun kerak
            body: JSON.stringify({
              message: text,
              history: reqHistory.slice(-16)
            })
          });

          removeTypingIndicator();

          if (res.status === 429) {
            addMessage("⏳ Juda ko'p so'rov yubordingiz. Bir daqiqadan keyin qaytadan urinib ko'ring.", "ai");
            return;
          }

          if (!res.ok) {
            addMessage("😔 Kechirasiz, AI xizmatida vaqtinchalik muammo bor. Iltimos qaytadan urinib ko'ring yoki +998 71 123 45 67 ga qo'ng'iroq qiling.", "ai");
            return;
          }

          const data = await res.json();
          if (data.reply) {
            addMessage(data.reply, "ai");
          } else {
            addMessage("Kechirasiz, javob topolmadim. Telefon orqali bog'laning: +998 97 925 20 03", "ai");
          }

        } catch (err) {
          console.error("Chat xatosi:", err);
          removeTypingIndicator();
          addMessage("Hozirda AI xizmatida kichik ulanish uzilishi bor 🤖.\nIltimos, darslar haqida batafsil ma'lumot olish bo'yicha to'g'ridan to'g'ri administratorlarimizga qo'ng'iroq qilaqoling: \n📞 +998 97 925 20 03", "ai");
        } finally {
          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();
        }
      };

      sendBtn.addEventListener("click", sendMessage);
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
      });

      // Auto-open after 1.5s
      setTimeout(() => {
        if (!isOpen) toggleChat();
      }, 1500);
    });
  

  
    var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    // Change the icons inside the button based on previous settings
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      themeToggleLightIcon.classList.remove('hidden');
    } else {
      themeToggleDarkIcon.classList.remove('hidden');
    }

    var themeToggleBtn = document.getElementById('theme-toggle');

    themeToggleBtn.addEventListener('click', function () {
      // toggle icons inside button
      themeToggleDarkIcon.classList.toggle('hidden');
      themeToggleLightIcon.classList.toggle('hidden');

      // if set via local storage previously
      if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('color-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('color-theme', 'light');
        }
        // if NOT set via local storage previously
      } else {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('color-theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('color-theme', 'dark');
        }
      }
    });
  

  <!-- Contact Form API + Toast -->
  
    (() => {
      const API = "";
      function showToast(msg, type) {
        const old = document.getElementById("sa-toast");
        if (old) old.remove();
        const t = document.createElement("div");
        t.id = "sa-toast";
        const clr = type === "error"
          ? "background:#fe6b00;color:#fff"
          : "background:#b0ff96;color:#0e0e0e";
        t.setAttribute("style",
          `position:fixed;top:96px;right:32px;z-index:9999;${clr};` +
          `padding:14px 22px;border-radius:14px;font-weight:700;font-size:14px;` +
          `display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.2);` +
          `transition:opacity .4s,transform .4s;font-family:'Space Grotesk',sans-serif`);
        const icon = type === "error" ? "error" : "check_circle";
        t.innerHTML = `<span class="material-symbols-outlined" style="font-size:20px">${icon}</span>${msg}`;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(-10px)"; }, 3800);
        setTimeout(() => t.remove(), 4200);
      }

      document.addEventListener("DOMContentLoaded", () => {
        const phoneInp = document.getElementById("hero-phone-input");
        const nameInp = document.getElementById("hero-name-input");
        const courseInp = document.getElementById("hero-course-input");
        const btn = document.getElementById("hero-submit-btn");
        if (!phoneInp || !btn) return;

        // Phone input control: faqat raqamlarga ruxsat beramiz
        phoneInp.addEventListener("keydown", (e) => {
          // Ruxsat berilgan tugmalar: backspace, delete, tab, escape, enter, numbers
          if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
              (e.keyCode >= 48 && e.keyCode <= 57) || 
              (e.keyCode >= 96 && e.keyCode <= 105)) {
              return;
          }
          // Qolgan hamma narsani to'xtatamiz (harflar, belgilar)
          e.preventDefault();
        });

        phoneInp.addEventListener("input", (e) => {
          let x = e.target.value.replace(/\D/g, ''); // Raqam bo'lmagan hamma narsani o'chirish
          if (x.length > 9) x = x.substring(0, 9);
          
          let formatted = "";
          if (x.length > 0) formatted += x.substring(0, 2);
          if (x.length > 2) formatted += " " + x.substring(2, 5);
          if (x.length > 5) formatted += "-" + x.substring(5, 7);
          if (x.length > 7) formatted += "-" + x.substring(7, 9);
          e.target.value = formatted;
        });

        async function submitContact() {
          const name = nameInp ? nameInp.value.trim() : "";
          const course = courseInp ? courseInp.value : "";
          const digits = phoneInp.value.trim();

          if (!name) { showToast("Ismingizni kiriting!", "error"); nameInp.focus(); return; }
          if (!course) { showToast("Kursni tanlang!", "error"); courseInp.focus(); return; }
          if (!digits || digits.length < 12) { showToast("Telefon raqamni to'liq kiriting!", "error"); phoneInp.focus(); return; }

          const phone = "+998 " + digits;

          const orig = btn.innerHTML;
          btn.innerHTML = "Yuborilmoqda...";
          btn.disabled = true;

          try {
            const r = await fetch(`${API}/api/contact`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "omit",
              body: JSON.stringify({ phone, name, course, message: "Saytdan ariza" })
            });
            const d = await r.json();
            if (r.ok && d.success) {
              showToast("✅ Arizangiz qabul qilindi! Tez orada bog'lanamiz.");
              phoneInp.value = "";
              if (nameInp) nameInp.value = "";
              if (courseInp) courseInp.value = "";
            } else {
              showToast(d.message || "Xatolik. Qayta urinib ko'ring.", "error");
            }
          } catch {
            showToast("Server bilan ulanishda xato. +998 97 925 20 03", "error");
          } finally {
            btn.innerHTML = orig;
            btn.disabled = false;
          }
        }

        btn.addEventListener("click", submitContact);
        phoneInp.addEventListener("keypress", e => { if (e.key === "Enter") submitContact(); });
        if (nameInp) nameInp.addEventListener("keypress", e => { if (e.key === "Enter") submitContact(); });
      });
    })();
  

  
    // Mobile Menu Logic
    document.addEventListener("DOMContentLoaded", () => {
      const mobileMenuBtn = document.getElementById("mobile-menu-btn");
      const closeMobileMenuBtn = document.getElementById("close-mobile-menu");
      const mobileMenu = document.getElementById("mobile-menu");
      const mobileLinks = document.querySelectorAll(".mobile-link");

      const toggleMenu = () => {
        if (mobileMenu) {
          mobileMenu.classList.toggle("translate-x-full");
        }
      };

      if (mobileMenuBtn && closeMobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", toggleMenu);
        closeMobileMenuBtn.addEventListener("click", toggleMenu);
        
        mobileLinks.forEach(link => {
          link.addEventListener("click", toggleMenu);
        });
      }
    });
  
</body>

</html>