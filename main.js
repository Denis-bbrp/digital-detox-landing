/* ============================================
   ЦИФРОВОЙ ДЕТОКС — main.js
   ============================================ */

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
  formspreeId: 'xvzyggjn',
  returnUrl:   'https://nezalipay.ru/thanks.html',
  refTtlDays:  90,
};

// ===== РЕФ-ТРЕКИНГ =====
const REF_KEYS = ['ref', 'utm_source', 'utm_campaign'];

function captureRefFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const now = Date.now();
  const ttl = CONFIG.refTtlDays * 24 * 60 * 60 * 1000;

  REF_KEYS.forEach((key) => {
    const value = params.get(key);
    if (!value) return;
    try {
      localStorage.setItem(`nezalipay_${key}`, JSON.stringify({ value, ts: now }));
    } catch {}
  });

  // Чистим протухшее
  REF_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(`nezalipay_${key}`);
      if (!raw) return;
      const { ts } = JSON.parse(raw);
      if (!ts || now - ts > ttl) localStorage.removeItem(`nezalipay_${key}`);
    } catch {}
  });
}

function getStoredRef(key) {
  try {
    const raw = localStorage.getItem(`nezalipay_${key}`);
    if (!raw) return '';
    return JSON.parse(raw).value || '';
  } catch {
    return '';
  }
}

// ===== SCROLL-АНИМАЦИИ =====
function initAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));

  // Stagger для пунктов чек-листа
  document.querySelectorAll('.checklist__item').forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.08}s`;
    observer.observe(item);
  });

  // Stagger для карточек
  document.querySelectorAll('.cards-grid .card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.06}s`;
  });
}

// ===== ЮKassa =====
async function openYooKassa(errorEl, email, name, phone, promo) {
  try {
    const payload = {
      email, name, phone,
      promo: promo || '',
      ref: getStoredRef('ref'),
      utm_source: getStoredRef('utm_source'),
      utm_campaign: getStoredRef('utm_campaign'),
    };
    const res = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('payment-api-error');
    const { token } = await res.json();

    const widgetEl = document.getElementById('yookassa-widget');
    widgetEl.hidden = false;
    widgetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const checkout = new window.YooMoneyCheckoutWidget({
      confirmation_token: token,
      return_url: CONFIG.returnUrl,
      error_callback: function (error) {
        console.error('YooKassa error:', error);
      },
    });
    checkout.render('yookassa-widget');
  } catch {
    showError(errorEl, 'Ошибка при открытии оплаты. Напишите нам: nezalipay.team@gmail.com');
  }
}

// ===== ОБРАБОТКА ФОРМ =====
function handleFormSubmit(formEl) {
  const btn         = formEl.querySelector('button[type="submit"]');
  const btnText     = btn.querySelector('.btn__text');
  const btnLoader   = btn.querySelector('.btn__loader');
  const errorEl     = formEl.querySelector('.form-error');
  const inputs      = formEl.querySelectorAll('input');

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- Валидация ---
    let isValid = true;
    inputs.forEach((input) => {
      if (input.type === 'checkbox') return;
      if (input.name === 'promo') return;
      input.classList.remove('input-error');
      if (!input.value.trim()) {
        input.classList.add('input-error');
        isValid = false;
      }
      if (input.type === 'email' && input.value && !input.value.includes('@')) {
        input.classList.add('input-error');
        isValid = false;
      }
    });

    const consent = formEl.querySelector('input[type="checkbox"]');
    if (consent && !consent.checked) {
      isValid = false;
      showError(errorEl, 'Необходимо согласие на обработку персональных данных');
      return;
    }

    if (!isValid) {
      showError(errorEl, 'Пожалуйста, заполни все поля');
      return;
    }

    // --- Показываем loader ---
    setLoading(btn, btnText, btnLoader, true);
    if (errorEl) errorEl.hidden = true;

    // --- Отправка в Formspree ---
    const formData = new FormData(formEl);
    formData.append('_subject', 'Новая заявка — Цифровой детокс');

    try {
      const response = await fetch(
        `https://formspree.io/f/${CONFIG.formspreeId}`,
        {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        }
      );

      if (response.ok) {
        setLoading(btn, btnText, btnLoader, false);
        const email = formEl.querySelector('input[type="email"]')?.value?.trim() || '';
        const name  = formEl.querySelector('input[name="name"]')?.value?.trim() || '';
        const phone = formEl.querySelector('input[name="phone"]')?.value?.trim() || '';
        const promo = formEl.querySelector('input[name="promo"]')?.value?.trim() || '';
        openYooKassa(errorEl, email, name, phone, promo);
      } else {
        throw new Error('Formspree error');
      }
    } catch {
      setLoading(btn, btnText, btnLoader, false);
      showError(
        errorEl,
        'Не удалось отправить заявку. Попробуй ещё раз или напиши нам напрямую.'
      );
    }
  });

  // Сбрасываем ошибку при вводе
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      if (errorEl) errorEl.hidden = true;
    });
  });
}

function setLoading(btn, textEl, loaderEl, isLoading) {
  btn.disabled    = isLoading;
  textEl.hidden   = isLoading;
  loaderEl.hidden = !isLoading;
}

function showError(errorEl, message) {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

// ===== ПРОМОКОД =====
function initPromoField(formEl) {
  const input = formEl.querySelector('input[name="promo"]');
  const hint  = formEl.querySelector('.promo-hint');
  if (!input || !hint) return;

  let timer = null;
  let lastCode = '';

  const setHint = (text, cls) => {
    hint.textContent = text;
    hint.classList.remove('promo-valid', 'promo-invalid');
    if (cls) hint.classList.add(cls);
    hint.hidden = !text;
  };

  const check = async () => {
    const code = input.value.trim().toUpperCase();
    if (code === lastCode) return;
    lastCode = code;

    if (!code) { setHint('', null); return; }

    try {
      const res = await fetch(`/api/validate-promo?code=${encodeURIComponent(code)}`);
      if (!res.ok) { setHint('', null); return; }
      const data = await res.json();
      if (data.valid) {
        setHint(`Скидка ${data.discount} ₽, итого ${data.price} ₽`, 'promo-valid');
      } else {
        setHint('Код не найден', 'promo-invalid');
      }
    } catch {
      setHint('', null);
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(check, 400);
  });
  input.addEventListener('blur', () => {
    clearTimeout(timer);
    check();
  });
}

// ===== ГАЛЕРЕЯ + ЛАЙТБОКС =====
function initGallery() {
  const items = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lb-img');
  const lbClose  = document.getElementById('lb-close');
  const lbPrev   = document.getElementById('lb-prev');
  const lbNext   = document.getElementById('lb-next');
  if (!items.length || !lightbox) return;

  const imgs = Array.from(items).map(el => el.querySelector('img').src);
  let current = 0;

  function showImg(i) {
    current = (i + imgs.length) % imgs.length;
    lbImg.style.animation = 'none';
    lbImg.offsetHeight;
    lbImg.style.animation = '';
    lbImg.src = imgs[current];
  }

  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      // Аккордеон
      items.forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      // Лайтбокс
      showImg(i);
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  lbClose.addEventListener('click', () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showImg(current - 1); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); showImg(current + 1); });

  // Свайп
  let tx = 0;
  lightbox.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) dx > 0 ? showImg(current - 1) : showImg(current + 1);
  });

  // Стрелки клавиатуры
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  showImg(current - 1);
    if (e.key === 'ArrowRight') showImg(current + 1);
    if (e.key === 'Escape') { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  });
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  captureRefFromUrl();
  initAnimations();
  initGallery();

  const ctaForm = document.getElementById('lead-form-cta');
  if (ctaForm) {
    handleFormSubmit(ctaForm);
    initPromoField(ctaForm);
  }
});

// ═══ COUNTDOWN TIMER ═══
(function() {
  var end = new Date(Date.now() + (2*86400 + 0*3600 + 0*60) * 1000);
  function updateTimer() {
    var diff = Math.max(0, end - Date.now());
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    var str = (d > 0 ? d + 'д ' : '') +
      String(h).padStart(2,'0') + 'ч ' +
      String(m).padStart(2,'0') + 'м ' +
      String(s).padStart(2,'0') + 'с';
    var el = document.getElementById('hero-timer');
    if (el) el.textContent = str;
  }
  updateTimer();
  setInterval(updateTimer, 1000);
})();

// ═══ AUTHOR SWIPER DOTS ═══
(function() {
  var track = document.querySelector('.author-swiper__track');
  var dots  = document.querySelectorAll('.author-swiper__dot');
  if (!track || !dots.length) return;
  track.addEventListener('scroll', function() {
    var idx = Math.round(track.scrollLeft / track.offsetWidth);
    dots.forEach(function(d, i) {
      d.classList.toggle('active', i === idx);
    });
  }, { passive: true });
})();
