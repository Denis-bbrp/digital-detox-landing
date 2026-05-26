export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const event = req.body;
  if (!event || event.event !== 'payment.succeeded') {
    return res.status(200).end();
  }

  const payment = event.object;
  if (!payment || payment.status !== 'succeeded') {
    return res.status(200).end();
  }

  const meta  = payment.metadata || {};
  const email = meta.email;
  const name  = meta.name || 'Привет';
  const phone = meta.phone || '';

  const amountInt = Math.round(parseFloat(payment.amount?.value || '2700'));
  const amountFormatted = amountInt.toLocaleString('ru-RU') + ' ₽';

  if (email) {
    await sendConfirmationEmail(email, name, amountFormatted);
  }

  await logToSheets({
    payment, name, email: email || '', phone,
    ref: meta.ref || '',
    promo: meta.promo || '',
    discount: meta.discount || '0',
    blogger: meta.blogger || '',
    utm_source: meta.utm_source || '',
    utm_campaign: meta.utm_campaign || '',
  });

  res.status(200).end();
}

async function logToSheets(data) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
        name: data.name,
        email: data.email,
        phone: data.phone,
        amount: data.payment.amount?.value || '2700.00',
        payment_id: data.payment.id,
        status: 'оплачено',
        ref: data.ref,
        promo: data.promo,
        discount: data.discount,
        blogger: data.blogger,
        utm_source: data.utm_source,
        utm_campaign: data.utm_campaign,
      }),
    });
  } catch {}
}

async function sendConfirmationEmail(email, name, amountFormatted) {
  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) return;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
      <h2 style="color:#0D7C5B;margin-bottom:8px">Оплата прошла ✅</h2>
      <p style="margin-bottom:24px">Привет, ${name}!</p>
      <p>Твоя оплата курса <strong>«Цифровой детокс» — 21 день</strong> успешно получена.</p>
      <table style="margin:24px 0;border-collapse:collapse;width:100%">
        <tr><td style="padding:8px 0;color:#666">Сумма:</td><td style="padding:8px 0;font-weight:bold">${amountFormatted}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Курс:</td><td style="padding:8px 0">«Цифровой детокс» — 21 день</td></tr>
      </table>
      <p style="margin-bottom:24px">Переходи в закрытый Telegram-канал — всё начинается там:</p>
      <a href="https://t.me/+kth_vQIBJtYwZTVl"
         style="display:inline-block;background:#0D7C5B;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:16px">
        Перейти в Telegram-канал
      </a>
      <p style="margin-top:32px;font-size:14px;color:#666">
        Вопросы? Пиши: <a href="mailto:nezalipay.team@gmail.com" style="color:#0D7C5B">nezalipay.team@gmail.com</a>
      </p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Цифровой детокс <noreply@nezalipay.ru>',
      reply_to: 'nezalipay.team@gmail.com',
      to: [email],
      subject: 'Оплата прошла — добро пожаловать на курс «Цифровой детокс»!',
      html,
    }),
  });
}
