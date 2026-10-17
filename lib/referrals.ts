import { randomBytes } from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import { SiteSettings } from '@/models/SiteSettings';
import Referral from '@/models/Referral';
import mongoose from 'mongoose';

export const REFERRAL_COOKIE = 'sb_ref';
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generateReferralCode(length = 8) {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

/** Returns the user's referral code, creating and saving one if missing. */
export async function ensureReferralCode(userId: string) {
  await connectDB();

  for (let attempt = 0; attempt < 5; attempt++) {
    const user = await User.findById(userId).select('referralCode').lean();
    if (!user) return null;
    if (typeof user.referralCode === 'string' && user.referralCode.trim()) return user.referralCode;

    const code = generateReferralCode();
    try {
      // `$in: [null, '']` includes both explicit null/empty values and missing
      // fields, which occur on accounts created before referral codes existed.
      const result = await User.updateOne(
        { _id: userId, referralCode: { $in: [null, ''] } },
        { $set: { referralCode: code } }
      );
      if (result.modifiedCount > 0) return code;

      // Another request may have assigned the code concurrently.
      const fresh = await User.findById(userId).select('referralCode').lean();
      if (typeof fresh?.referralCode === 'string' && fresh.referralCode.trim()) return fresh.referralCode;
    } catch (error: unknown) {
      // Unique-index collisions are rare; retry with a fresh random code.
      if (!(typeof error === 'object' && error && 'code' in error && (error as { code?: number }).code === 11000)) throw error;
    }
  }

  // Return the saved value if a concurrent request won the final race.
  const finalUser = await User.findById(userId).select('referralCode').lean();
  return typeof finalUser?.referralCode === 'string' && finalUser.referralCode.trim()
    ? finalUser.referralCode
    : null;
}

export async function getReferralSettings() {
  await connectDB();
  const settings = await SiteSettings.findOne({ key: 'site' }).select('referral').lean();
  return {
    enabled: settings?.referral?.enabled ?? true,
    defaultPercent: settings?.referral?.defaultPercent ?? 10,
  };
}

/** Effective commission % for a resource, or null when referrals are off for it. */
export function resolveCommissionPercent(
  resource: { price?: number; referralEnabled?: boolean; referralPercent?: number | null },
  settings: { enabled: boolean; defaultPercent: number }
) {
  if (!settings.enabled || resource.price === 0) return null;
  if (resource.referralEnabled === false) return null;
  const percent = resource.referralPercent ?? settings.defaultPercent;
  return Math.min(Math.max(percent, 0), 100);
}

export async function getResourceCommission(resourceId: string) {
  await connectDB();
  const resource = await Resource.findById(resourceId).select('price referralEnabled referralPercent').lean();
  if (!resource) return null;
  const settings = await getReferralSettings();
  return resolveCommissionPercent(resource, settings);
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Records a pending referral sale when a checkout starts for a referred buyer.
 * The sale is reported as earned only once its Order is completed (see /api/referrals/me).
 */
export async function recordReferralSale({
  referralCode,
  buyerId,
  resourceId,
  orderRef,
  saleAmount,
}: {
  referralCode?: string;
  buyerId: string;
  resourceId: string;
  orderRef: string;
  saleAmount: number;
}) {
  if (!referralCode) return;
  await connectDB();
  const referrer = await User.findOne({ referralCode }).select('_id').lean();
  if (!referrer || String(referrer._id) === buyerId) return;

  const percent = await getResourceCommission(resourceId);
  if (percent === null) return;

  await Referral.create({
    referrerId: new mongoose.Types.ObjectId(String(referrer._id)),
    resourceId: new mongoose.Types.ObjectId(resourceId),
    type: 'sale',
    orderRef,
    buyerId: new mongoose.Types.ObjectId(buyerId),
    saleAmount: roundMoney(saleAmount),
    commissionPercent: percent,
    commissionAmount: roundMoney((saleAmount * percent) / 100),
  });
}
