export const BASE_PRICE = 2700;
export const MIN_PRICE  = 1000;

// blogger — ник для трекинга в таблице
export const PROMO_CODES = {
  'TEST1':  { type: 'fixed_price', fixed_price: 1,  blogger: 'test'  }, // TODO: удалить после тестов
  'NASTYA': { type: 'percent',     discount: 10,    blogger: 'nastya' },
};

export function applyPromo(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { valid: false, price: BASE_PRICE, discount: 0, blogger: '', code: '' };

  const entry = PROMO_CODES[code];
  if (!entry) return { valid: false, price: BASE_PRICE, discount: 0, blogger: '', code };

  // Проверка срока действия
  if (entry.expires && new Date() > new Date(entry.expires)) {
    return { valid: false, price: BASE_PRICE, discount: 0, blogger: '', code };
  }

  // fixed_price: финальная цена задана напрямую
  if (entry.type === 'fixed_price') {
    const price    = entry.fixed_price;
    const discount = BASE_PRICE - price;
    return { valid: true, price, discount, blogger: entry.blogger || '', code };
  }

  // percent / fixed
  let discount = entry.type === 'percent'
    ? Math.round(BASE_PRICE * entry.discount / 100)
    : entry.discount;

  let price = BASE_PRICE - discount;
  if (price < MIN_PRICE) {
    price    = MIN_PRICE;
    discount = BASE_PRICE - MIN_PRICE;
  }

  return { valid: true, price, discount, blogger: entry.blogger || '', code };
}
