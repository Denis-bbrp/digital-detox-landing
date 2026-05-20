/* ============================================
   ЦИФРОВОЙ ДЕТОКС — main.js
   ============================================ */

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
  formspreeId: 'xvzyggjn',
  returnUrl:   'https://nezalipay.ru/thanks.html',
};

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
async function openYooKassa(errorEl, email, name) {
  try {
    const res = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
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
        openYooKassa(errorEl, email, name);
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
  initAnimations();
  initGallery();

  const ctaForm = document.getElementById('lead-form-cta');
  if (ctaForm) handleFormSubmit(ctaForm);
});
