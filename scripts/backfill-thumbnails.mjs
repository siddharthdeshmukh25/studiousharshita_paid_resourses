/**
 * One-time backfill: every resource that has images but no thumbnailUrl gets
 * thumbnailUrl = images[0]. Existing thumbnailUrl values are never touched.
 *
 * Usage:  node --env-file=.env scripts/backfill-thumbnails.mjs
 * Add --dry-run to preview without writing.
 */

import mongoose from 'mongoose';

const DRY_RUN = process.argv.includes('--dry-run');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI missing. Run with: node --env-file=.env scripts/backfill-thumbnails.mjs');
  process.exit(1);
}

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    images: { type: [String], default: [] },
    thumbnailUrl: String,
  },
  { collection: 'resources', strict: false }
);

const Resource = mongoose.models.BackfillResource || mongoose.model('BackfillResource', resourceSchema);

try {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const targets = await Resource.find({ thumbnailUrl: { $in: [null, ''] }, images: { $exists: true, $ne: [] } })
    .select('_id title images')
    .lean();

  console.log(`Found ${targets.length} resource(s) missing thumbnailUrl.`);

  let updated = 0;
  for (const doc of targets) {
    const first = Array.isArray(doc.images) ? doc.images.find(Boolean) : null;
    if (!first) continue;
    if (DRY_RUN) {
      console.log(`[dry-run] would set thumbnailUrl for "${doc.title}" (${doc._id})`);
    } else {
      await Resource.updateOne({ _id: doc._id }, { $set: { thumbnailUrl: first } });
      console.log(`✓ set thumbnailUrl for "${doc.title}"`);
    }
    updated += 1;
  }

  console.log(DRY_RUN ? `Dry run complete — ${updated} would be updated.` : `Done — ${updated} resource(s) updated.`);
} catch (error) {
  console.error('Backfill failed:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
