/**
 * Currency helpers.
 *
 * Prices used to render as "Rs. 1000" in some places and "₹900.00" in others.
 * Everything now goes through these helpers so the format is identical across
 * cards, product pages, checkout, dashboards and admin screens.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats a rupee amount as "₹1,000" / "₹899.50". */
export function formatPrice(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : value;

  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return inrFormatter.format(0);
  }

  return inrFormatter.format(amount);
}

/** Price after a percentage discount, rounded to a whole rupee so cards
 *  never show odd amounts like "₹2,299.08" (display-only helper — checkout
 *  computes the charge server-side). */
export function discountedPrice(price: number, discount?: number | null): number {
  if (!discount || discount <= 0) return price;
  return Math.round(price * (1 - discount / 100));
}

/** Formats the price after an optional percentage discount. */
export function formatDiscountedPrice(price: number, discount?: number | null): string {
  return formatPrice(discountedPrice(price, discount));
}
