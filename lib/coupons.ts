import Coupon from '@/models/Coupon';

export async function getValidCoupon(code: string | undefined, purchaseAmount?: number) {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return null;

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  // Check minimum purchase amount requirement
  if (coupon && coupon.minimumPurchaseAmount && purchaseAmount) {
    if (purchaseAmount < coupon.minimumPurchaseAmount) {
      return null; // Coupon not valid for this purchase amount
    }
  }

  return coupon;
}
