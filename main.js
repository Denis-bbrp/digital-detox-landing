/* ============================================
   ЦИФРОВОЙ ДЕТОКС — main.js
   ============================================ */

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
  formspreeId:      'YOUR_FORM_ID',    // Заменить на ID из formspree.io
  yookassaToken:    'YOUR_PAYMENT_TOKEN', // Заменить на токен из ЮKassa
  returnUrl:        'https://your-domain.ru/thanks.html', // Домен после замены
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
function openYooKassa() {
  // Когда будет реальный токен — удали alert и раскомментируй виджет ниже
  alert(
    '⚠️ Для подключения оплаты:\n\n' +
    '1. Войдите в личный кабинет ЮKassa\n' +
    '2. Создайте платёж через API и получите confirmation_token\n' +
    '3. Замените YOUR_PAYMENT_TOKEN в main.js\n' +
    '4. Замените your-domain.ru на ваш домен'
  );

  /*
  const checkout = new window.YooMoneyCheckoutWidget({
    confirmation_token: CONFIG.yookassaToken,
    return_url: CONFIG.returnUrl,
    error_callback: function (error) {
      console.error('YooKassa error:', error);
    },
  });
  checkout.render('yookassa-widget');
  */
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
        // Контакт сохранён — открываем оплату
        setLoading(btn, btnText, btnLoader, false);
        openYooKassa();
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

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  initAnimations();

  const heroForm = document.getElementById('lead-form-hero');
  const ctaForm  = document.getElementById('lead-form-cta');

  if (heroForm) handleFormSubmit(heroForm);
  if (ctaForm)  handleFormSubmit(ctaForm);
});
