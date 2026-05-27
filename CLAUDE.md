# Цифровой детокс — Лендинг

Курс «Цифровой детокс — 21 день». Автор: Никита Вохмянин.
HTML+CSS+JS, без фреймворка. Хостинг: **Vercel** (статика + serverless API).
GitHub: https://github.com/Denis-bbrp/digital-detox-landing
Продакшн: https://nezalipay.ru

---

## Стек и файлы

```
landing/
  index.html           — основная страница, inline CSS, mobile-first (max-width: 480px)
  main.js              — анимации, форма, ЮKassa виджет, промокод, галерея
  thanks.html          — страница после оплаты → кнопка в Telegram-канал
  style.css            — стили для thanks.html (CSS-переменные зелёная тема)
  vercel.json          — конфиг Vercel (функции + роуты)
  api/
    create-payment.js  — serverless: создаёт платёж в ЮKassa, возвращает token
    webhook.js         — serverless: принимает ЮKassa webhook, пишет в Sheets + отправляет email
    validate-promo.js  — serverless: проверяет промокод, возвращает цену
    _promo-codes.js    — список промокодов (редактировать здесь)
  assets/
    mobile-hero.png    — hero фото мобайл (941×1672)
    photo.png          — hero фото десктоп (1776×886)
    nik1.jpg / nik2.jpg / nik3.jpg  — фото автора для свайпера
```

---

## Дизайн

Палитра (olive/warm cinema):
- `--red: #c8401a` — акцент, кнопки
- `--dark: #2d2d18` — тёмные секции, финальный CTA
- `--cream: #f2f0e3` — фон
- `--warm: #1e1e0f` — тёмный блок автора
- `--muted: #7a7a58` — вторичный текст

Шрифты: Syne (заголовки), Bebas Neue (цена), Manrope (тело)
Все стили — inline в `index.html`, никакого `style.css` для основной страницы.

---

## Воронка

```
Форма (имя + телефон + email + промокод)
  → Formspree (ID: xvzyggjn) сохраняет контакт
  → /api/create-payment → ЮKassa embedded-виджет (2700 ₽)
  → [оплатил] thanks.html → кнопка в Telegram-канал (t.me/+kth_vQIBJtYwZTVl)
             → ЮKassa webhook → /api/webhook → Google Sheets + email покупателю
  → [не оплатил] контакт сохранён в Formspree, менеджер звонит
```

---

## Env vars в Vercel (все уже настроены)

| Переменная | Что делает |
|---|---|
| `YOOKASSA_SHOP_ID` | ID магазина ЮKassa (1361786) |
| `YOOKASSA_SECRET_KEY` | Секретный ключ ЮKassa |
| `GOOGLE_SHEET_WEBHOOK_URL` | URL Google Apps Script → пишет строку в таблицу |
| `RESEND_API_KEY` | Ключ Resend → отправляет email покупателю после оплаты |

---

## Google Sheets (таблица оплат)

URL: https://docs.google.com/spreadsheets/d/110v0N5263cEQByFhVCcGR5iKSGMNwb8Cat50iR0lE5U

Колонки:
A: Дата | B: Имя | C: Email | D: Телефон | E: Сумма | F: Payment ID | G: Статус | H: (реф, пусто) | I: Промокод | J: Скидка

Данные пишутся через Google Apps Script (веб-приложение), который принимает POST от `/api/webhook`.

---

## Промокоды (`api/_promo-codes.js`)

Активные:
- `TEST1` — 1 ₽ (тест, удалить после проверки)
- `NASTYA` — закомментирован, не активен

Типы промокодов:
- `percent` — скидка в % от BASE_PRICE (2700 ₽)
- `fixed` — скидка в рублях
- `fixed_price` — итоговая цена напрямую (MIN_PRICE не применяется)

Опционально поле `expires: 'YYYY-MM-DD'` — промокод перестаёт работать после этой даты.

Чтобы добавить/удалить промокод — редактируй `_promo-codes.js`, пуш, деплой ~1 мин.

---

## Плавающая кнопка контактов

Фиксированная кнопка "Остались вопросы?" в правом нижнем углу.
Контакты Никиты:
- Telegram: @vnik106
- WhatsApp: +7 (989) 854-11-17
- Телефон: +7 (989) 854-11-17

---

## Что ещё ждёт настройки

- [ ] **ЮKassa webhook** — нужно добавить в ЛК ЮKassa:
  URL: `https://nezalipay.ru/api/webhook`, событие: `payment.succeeded`
- [ ] Удалить промокод `TEST1` после тестирования

---

## Деплой

```bash
cd landing
git add .
git commit -m "описание"
git push
# Vercel деплоит автоматически через ~1 мин
```
