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

  const email = payment.metadata?.email;
  const name  = payment.metadata?.name || 'Привет';
  const phone = payment.metadata?.phone || '';

  if (email) {
    await sendConfirmationEmail(email, name);
  }

  await logToSheets({ payment, name, email: email || '', phone });

  res.status(200).end();
}

async function logToSheets({ payment, name, email, phone }) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
        name, email, phone,
        amount: payment.amount?.value || '5000.00',
        payment_id: payment.id,
        status: 'оплачено',
      }),
    });
  } catch {}
}

async function sendConfirmationEmail(email, name) {
  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) return;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
      <h2 style="color:#0D7C5B;margin-bottom:8px">Оплата прошла ✅</h2>
      <p style="margin-bottom:24px">Привет, ${name}!</p>
      <p>Твоя оплата курса <strong>«Цифровой детокс» — 21 день</strong> успешно получена.</p>
      <table style="margin:24px 0;border-collapse:collapse;width:100%">
        <tr><td style="padding:8px 0;color:#666">Сумма:</td><td style="padding:8px 0;font-weight:bold">5 000 ₽</td></tr>
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
