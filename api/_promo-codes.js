export const BASE_PRICE = 2700;
export const MIN_PRICE  = 1000;

// Чтобы добавить блогера: продублируй строку, замени NASTYA на имя в CAPS, blogger — то же имя в нижнем регистре.
// Все промокоды дают 10% скидки. discount/type не трогай.
export const PROMO_CODES = {
  'EXAMPLE10': { discount: 10, type: 'percent', blogger: 'example' },
};

export function applyPromo(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { valid: false, price: BASE_PRICE, discount: 0, blogger: '', code: '' };

  const entry = PROMO_CODES[code];
  if (!entry) return { valid: false, price: BASE_PRICE, discount: 0, blogger: '', code };

  let discount = entry.type === 'percent'
    ? Math.round(BASE_PRICE * entry.discount / 100)
    : entry.discount;

  let price = BASE_PRICE - discount;
  if (price < MIN_PRICE) {
    price = MIN_PRICE;
    discount = BASE_PRICE - MIN_PRICE;
  }

  return { valid: true, price, discount, blogger: entry.blogger, code };
}
