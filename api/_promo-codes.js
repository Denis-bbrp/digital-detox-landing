export const BASE_PRICE = 2700;
export const MIN_PRICE  = 1000;

// ─────────────────────────────────────────────
// ПРОМОКОДЫ
//
// Типы:
//   percent     — скидка в %. Пример: { discount: 20, type: 'percent', blogger: 'nastya' }
//   fixed       — скидка в рублях. Пример: { discount: 500, type: 'fixed', blogger: '' }
//   fixed_price — итоговая цена напрямую (MIN_PRICE не применяется).
//                 Пример: { type: 'fixed_price', fixed_price: 1, blogger: 'test' }
//
// blogger — ник для трекинга в таблице (можно оставить пустым '')
// ─────────────────────────────────────────────
export const PROMO_CODES = {
  // ── ТЕСТ (1 рубль) ──
  'TEST1':    { type: 'fixed_price', fixed_price: 1,    blogger: 'test' },

  // ── БЛОГЕРЫ (10%) ──
  // 'NASTYA':   { discount: 10, type: 'percent', blogger: 'nastya' },
  // 'IVAN':     { discount: 10, type: 'percent', blogger: 'ivan'   },

  // ── СПЕЦПРЕДЛОЖЕНИЯ ──
  // 'EARLY500':  { discount: 500,  type: 'fixed',   blogger: '' },
  // 'PROMO20':   { discount: 20,   type: 'percent', blogger: '' },
};

export function applyPromo(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { valid: false, price: BASE_PRICE, discount: 0, blogger: '', code: '' };

  const entry = PROMO_CODES[code];
  if (!entry) return { valid: false, price: BASE_PRICE, discount: 0, blogger: '', code };

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
