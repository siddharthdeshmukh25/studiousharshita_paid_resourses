import Coupon from '@/models/Coupon';

export async function getValidCoupon(code: string | undefined) {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return null;

  return Coupon.findOne({
    code: normalizedCode,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
}
