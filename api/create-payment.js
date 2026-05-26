import { applyPromo, BASE_PRICE } from './_promo-codes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY } = process.env;
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    return res.status(500).json({ error: 'YooKassa env vars not set' });
  }

  const {
    email = '', name = '', phone = '',
    ref = '', promo = '',
    utm_source = '', utm_campaign = '',
  } = req.body || {};

  const { valid, price, discount, blogger, code } = applyPromo(promo);
  const amountValue = price.toFixed(2);

  const credentials = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');
  const idempotenceKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let response;
  try {
    response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { value: amountValue, currency: 'RUB' },
        capture: true,
        confirmation: {
          type: 'embedded',
          return_url: 'https://nezalipay.ru/thanks.html',
        },
        description: 'Курс «Цифровой детокс» — 21 день',
        metadata: {
          email, name, phone,
          ref: String(ref).slice(0, 64),
          promo: valid ? code : '',
          discount: valid ? String(discount) : '0',
          blogger: valid ? blogger : '',
          base_price: String(BASE_PRICE),
          utm_source: String(utm_source).slice(0, 64),
          utm_campaign: String(utm_campaign).slice(0, 64),
        },
        receipt: {
          customer: { email: email || 'noreply@nezalipay.ru' },
          items: [{
            description: 'Курс «Цифровой детокс» — 21 день',
            quantity: '1.00',
            amount: { value: amountValue, currency: 'RUB' },
            vat_code: 1,
            payment_mode: 'full_payment',
            payment_subject: 'service',
          }],
        },
      }),
    });
  } catch (err) {
    return res.status(502).json({ error: 'network-error', detail: err.message });
  }

  if (!response.ok) {
    const err = await response.json();
    console.error('YooKassa error:', JSON.stringify(err));
    console.error('ShopID:', YOOKASSA_SHOP_ID);
    console.error('Key prefix:', YOOKASSA_SECRET_KEY.slice(0, 8));
    return res.status(502).json({ error: err });
  }

  const payment = await response.json();
  res.status(200).json({ token: payment.confirmation.confirmation_token });
}
