export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY } = process.env;
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    return res.status(500).json({ error: 'YooKassa env vars not set' });
  }

  const credentials = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');
  const idempotenceKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Idempotence-Key': idempotenceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: { value: '5000.00', currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'embedded',
        return_url: 'https://nezalipay.ru/thanks.html',
      },
      description: 'Курс «Цифровой детокс» — 21 день',
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return res.status(502).json({ error: err });
  }

  const payment = await response.json();
  res.status(200).json({ token: payment.confirmation.confirmation_token });
}
