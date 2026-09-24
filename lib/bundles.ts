import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';

/**
 * Bundle helpers.
 *
 * A bundle is a regular Resource whose `bundleResourceIds` lists other resources.
 * Buying the bundle grants access to the bundle AND every child resource, so the
 * existing checkout / webhook / order flow keeps working completely unchanged —
 * the webhooks just call grantResourceAccess() instead of pushing one id.
 */

/** Normalize a mixed array (ObjectIds / strings / populated docs) into unique id strings. */
export function toResourceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((entry) => {
      const anyEntry = entry as { _id?: { toString(): string }; toString?(): string };
      if (anyEntry && typeof anyEntry === 'object' && anyEntry._id) return anyEntry._id.toString();
      if (anyEntry && typeof anyEntry.toString === 'function') {
        const s = anyEntry.toString();
        // Plain [object Object] means an unpopulated/invalid entry — drop it.
        return s === '[object Object]' ? '' : s;
      }
      return '';
    })
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  return Array.from(new Set(ids));
}

/**
 * All resource ids a purchase unlocks: the bought resource itself plus, when it
 * is a bundle, every resource inside it.
 */
export async function resolveGrantIds(resourceId: string): Promise<string[]> {
  await connectDB();
  const resource = await Resource.findById(resourceId)
    .select('bundleResourceIds')
    .lean<{ bundleResourceIds?: mongoose.Types.ObjectId[] } | null>();
  if (!resource) return [resourceId].filter((id) => mongoose.Types.ObjectId.isValid(id));
  return [resourceId, ...toResourceIds(resource.bundleResourceIds)];
}

/** Idempotently grant the user access to every id (bundle + children). */
export async function grantResourceAccess(userId: string, resourceIds: string[]): Promise<number> {
  const ids = Array.from(new Set(resourceIds.filter((id) => mongoose.Types.ObjectId.isValid(id))));
  if (!userId || ids.length === 0) return 0;
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const result = await User.updateOne(
    { _id: userId },
    { $addToSet: { purchasedResources: { $each: objectIds } } }
  );
  return result.modifiedCount ?? 0;
}

/** Purchase + bundle-aware access check. */
export async function userHasResourceAccess(
  user: { purchasedResources: unknown[] },
  resourceId: string
): Promise<boolean> {
  const targetId = resourceId;
  if (!mongoose.Types.ObjectId.isValid(targetId)) return false;
  const ownedIds = toResourceIds(user.purchasedResources);
  if (ownedIds.length === 0) return false;
  if (ownedIds.includes(targetId)) return true;
  // Not owned directly — is it bundled inside something the user owns?
  const bundle = await Resource.findOne({
    _id: { $in: ownedIds.map((id) => new mongoose.Types.ObjectId(id)) },
    bundleResourceIds: new mongoose.Types.ObjectId(targetId),
  })
    .select('_id')
    .lean();
  return Boolean(bundle);
}
