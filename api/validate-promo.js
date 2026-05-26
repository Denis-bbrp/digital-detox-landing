import { applyPromo, BASE_PRICE } from './_promo-codes.js';

export default function handler(req, res) {
  const code = req.query?.code || '';
  const { valid, price, discount } = applyPromo(code);

  res.setHeader('Cache-Control', 'no-store');
  if (!valid) return res.status(200).json({ valid: false });
  res.status(200).json({ valid: true, price, discount, base_price: BASE_PRICE });
}
