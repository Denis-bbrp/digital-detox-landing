# Цифровой детокс — Лендинг

HTML+CSS+JS, без фреймворка. Хостинг: **Vercel** (статика + serverless API).
GitHub: https://denis-bbrp.github.io/digital-detox-landing/
Продакшн: https://nezalipay.ru

## Файлы

```
landing/
  index.html      — основная страница (9 блоков)
  style.css       — все стили, CSS-переменные, адаптив
  main.js         — анимации, формы, галерея, лайтбокс
  thanks.html     — страница после оплаты → кнопка в Telegram
  vercel.json     — конфиг Vercel
  api/
    create-payment.js  — serverless: создаёт платёж в ЮKassa, возвращает token
  assets/
    photo.png         — hero фото десктоп (1776×886, before/after)
    mobile-hero.png   — hero фото мобайл (941×1672, вертикальный)
    nik1.jpg          — фото автора для галереи (960×1280)
    nik2.jpg
    nik3.jpg
```

## Заглушки

Все заглушки заменены. Осталось только задать env vars в Vercel (см. ниже).

## Env vars в Vercel (Settings → Environment Variables)

| Переменная | Откуда взять |
|---|---|
| `YOOKASSA_SHOP_ID` | ЮKassa → Настройки магазина → shopId |
| `YOOKASSA_SECRET_KEY` | ЮKassa → Настройки → Ключи API → Секретный ключ |

## Воронка

```
Форма (имя + телефон + email)
  → Formspree сохраняет контакт
  → /api/create-payment → ЮKassa виджет (5000 ₽)
  → [оплатил] thanks.html → кнопка в Telegram
  → [не оплатил] контакт сохранён, менеджер звонит
```

## Интеграции

**Formspree** — `https://formspree.io/f/YOUR_FORM_ID`
- Бесплатно до 50 заявок/месяц
- formspree.io → New Form → скопировать ID → вставить в main.js:7

**ЮKassa** — embedded-виджет
- `api/create-payment.js` — serverless-функция Vercel, создаёт платёж через ЮKassa API
- Токен (confirmation_token) генерируется на каждый платёж
- Виджет рендерится в `#yookassa-widget` на странице

## Структура CSS

Шрифт: Manrope (Google Fonts), weights 400/500/600/700/800
Основной акцент: `#0D7C5B` (зелёный)
Breakpoints: 900px (планшет), 768px (мобайл), 480px (малый мобайл)

## Hero блок

Структура: бейджи-строка сверху → фото на всю ширину → overlay с текстом и кнопкой
- Десктоп: `assets/photo.png` через `<picture>`
- Мобайл (≤768px): `assets/mobile-hero.png` через `<source media>`
- Overlay кнопка ведёт на `https://t.me/+kth_vQIBJtYwZTVl` (прямо в Telegram, без формы)

## Автор блок

Галерея-аккордеон из 3 фото (nik1/2/3.jpg) + лайтбокс (свайп, клавиши, клик вне).
Текст автора: Никита Вохмянин — предприниматель, история личного детокса.

## Деплой

```bash
git add .
git commit -m "..."
git push
# GitHub Pages обновляется через ~1 минуту
```

## Что работает без настройки

- Все анимации (IntersectionObserver)
- Галерея + лайтбокс
- Адаптив (мобайл/десктоп)
- Валидация формы на клиенте

## Что не работает без настройки

- Отправка формы (нужен Formspree ID)
- Оплата (нужен ЮKassa токен)
- Кнопки Telegram (нужна реальная ссылка)
