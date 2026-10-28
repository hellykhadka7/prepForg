/**
 * Transactional Migration & Rollback Script: Duplicate Two Sum Deduplication
 *
 * Canonical problem (keep active):
 *   ID1 = '6abd2b3648376b3b20569bd5' (Topic: 'Array', original seed with historical solutions/revisions/notes)
 * Duplicate problem (soft-deactivate):
 *   ID2 = '6abd305ef1ac334c4d55007a' (Topic: 'Arrays & Hashing', redundant seed)
 *
 * Safety features:
 * - Uses MongoDB multi-document transaction (session.withTransaction)
 * - Automatically rolls back in MongoDB if any error or duplicate-key conflict occurs
 * - Dynamically queries ALL matching UserProblemStatus records (not a hardcoded list)
 * - Takes a full pre-migration JSON snapshot saved to disk before any mutation
 * - Supports --dry-run (default), --execute, and --rollback <snapshot-file>
 *
 * Usage:
 *   node src/scripts/migrate-two-sum.js --dry-run
 *   node src/scripts/migrate-two-sum.js --execute
 *   node src/scripts/migrate-two-sum.js --rollback <path-to-snapshot>
 */

const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');
const Problem = require('../models/Problem.model');
const UserProblemStatus = require('../models/UserProblemStatus.model');

const CANONICAL_ID = new mongoose.Types.ObjectId('6abd2b3648376b3b20569bd5');
const DUPLICATE_ID = new mongoose.Types.ObjectId('6abd305ef1ac334c4d55007a');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../.migration-snapshots');

async function dryRun() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Running DRY-RUN simulation...');

  const p1 = await Problem.findById(CANONICAL_ID).lean();
  const p2 = await Problem.findById(DUPLICATE_ID).lean();

  if (!p1) throw new Error(`Canonical problem ${CANONICAL_ID} not found!`);
  if (!p2) throw new Error(`Duplicate problem ${DUPLICATE_ID} not found!`);

  console.log(`Canonical Problem: [${p1._id}] "${p1.title}" (topic: "${p1.topic}", active: ${p1.isActive})`);
  console.log(`Duplicate Problem: [${p2._id}] "${p2.title}" (topic: "${p2.topic}", active: ${p2.isActive})`);

  // Dynamically find ALL statuses on duplicate problem
  const duplicateStatuses = await UserProblemStatus.find({ problemId: DUPLICATE_ID }).lean();
  console.log(`\nFound ${duplicateStatuses.length} UserProblemStatus record(s) on duplicate problem:`);

  const actions = [];
  for (const status of duplicateStatuses) {
    const existingOnCanonical = await UserProblemStatus.findOne({
      userId: status.userId,
      problemId: CANONICAL_ID,
    }).lean();

    if (existingOnCanonical) {
      actions.push({
        type: 'DELETE_REDUNDANT',
        userId: status.userId,
        statusId: status._id,
        reason: `User already has a status record (${existingOnCanonical.status}) on canonical problem. Duplicate record (${status.status}) will be safely removed to prevent E11000 key conflict.`,
      });
    } else {
      actions.push({
        type: 'MIGRATE_REFERENCE',
        userId: status.userId,
        statusId: status._id,
        currentStatus: status.status,
        reason: `User has no status on canonical problem. Record will be updated: problemId ${DUPLICATE_ID} -> ${CANONICAL_ID}.`,
      });
    }
  }

  console.log('\nPlanned Actions:');
  for (const a of actions) {
    console.log(`- Action: ${a.type} | User: ${a.userId} | ${a.reason}`);
  }
  console.log(`- Action: SOFT_DEACTIVATE | Problem: ${DUPLICATE_ID} | Set isActive: false (document is preserved)`);

  console.log('\nDRY RUN COMPLETE. Zero database mutations were performed.');
  await mongoose.disconnect();
}

async function executeMigration() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Initiating Transactional Migration...');

  // Ensure snapshot dir exists
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  // Step 1: Pre-migration Snapshot of ALL affected documents
  const p1Before = await Problem.findById(CANONICAL_ID).lean();
  const p2Before = await Problem.findById(DUPLICATE_ID).lean();
  const duplicateStatusesBefore = await UserProblemStatus.find({ problemId: DUPLICATE_ID }).lean();
  const canonicalStatusesBefore = await UserProblemStatus.find({ problemId: CANONICAL_ID }).lean();

  const snapshot = {
    timestamp: new Date().toISOString(),
    canonicalId: CANONICAL_ID.toString(),
    duplicateId: DUPLICATE_ID.toString(),
    p1Before,
    p2Before,
    duplicateStatusesBefore,
    canonicalStatusesBefore,
  };

  const snapshotFile = path.join(SNAPSHOT_DIR, `snapshot-two-sum-${Date.now()}.json`);
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`Pre-migration snapshot written to: ${snapshotFile}`);

  // Step 2: Run within MongoDB Multi-Document Transaction
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Process all duplicate status records dynamically
      for (const status of duplicateStatusesBefore) {
        const existingCanonical = await UserProblemStatus.findOne({
          userId: status.userId,
          problemId: CANONICAL_ID,
        }).session(session);

        if (existingCanonical) {
          // If canonical status is not completed, but duplicate was completed, upgrade canonical to completed
          if (status.status === 'completed' && existingCanonical.status !== 'completed') {
            existingCanonical.status = 'completed';
            await existingCanonical.save({ session });
          }
          // Remove duplicate to satisfy unique index (userId, problemId)
          await UserProblemStatus.deleteOne({ _id: status._id }).session(session);
          console.log(`[Tx] Removed redundant status record ${status._id} for user ${status.userId}`);
        } else {
          // Migrate problemId to canonical
          await UserProblemStatus.updateOne(
            { _id: status._id },
            { $set: { problemId: CANONICAL_ID } }
          ).session(session);
          console.log(`[Tx] Migrated status record ${status._id} to canonical problem for user ${status.userId}`);
        }
      }

      // 2. Soft-deactivate duplicate problem
      await Problem.updateOne(
        { _id: DUPLICATE_ID },
        { $set: { isActive: false } }
      ).session(session);
      console.log(`[Tx] Soft-deactivated duplicate problem ${DUPLICATE_ID}`);
    });

    console.log('Transaction committed successfully! Migration completed.');
  } catch (err) {
    console.error('Transaction failed and aborted automatically by MongoDB:', err);
    throw err;
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
}

async function rollback(snapshotPath) {
  if (!snapshotPath || !fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found: ${snapshotPath}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  console.log(`Loaded snapshot from ${snapshot.timestamp}. Connecting to MongoDB...`);

  await mongoose.connect(MONGODB_URI);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Restore duplicate problem isActive flag
      if (snapshot.p2Before) {
        await Problem.updateOne(
          { _id: DUPLICATE_ID },
          { $set: { isActive: snapshot.p2Before.isActive } }
        ).session(session);
        console.log(`[Rollback] Restored problem ${DUPLICATE_ID} isActive to ${snapshot.p2Before.isActive}`);
      }

      // 2. Restore duplicate statuses
      for (const orig of snapshot.duplicateStatusesBefore) {
        await UserProblemStatus.updateOne(
          { _id: orig._id },
          {
            $set: {
              problemId: new mongoose.Types.ObjectId(orig.problemId),
              status: orig.status,
            },
          },
          { upsert: true }
        ).session(session);
        console.log(`[Rollback] Restored duplicate status record ${orig._id}`);
      }

      // 3. Restore canonical statuses
      for (const orig of snapshot.canonicalStatusesBefore) {
        await UserProblemStatus.updateOne(
          { _id: orig._id },
          { $set: { status: orig.status } },
          { upsert: true }
        ).session(session);
        console.log(`[Rollback] Restored canonical status record ${orig._id}`);
      }
    });

    console.log('Rollback transaction committed successfully!');
  } catch (err) {
    console.error('Rollback failed:', err);
    throw err;
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
}

// CLI handler
const args = process.argv.slice(2);
if (args.includes('--execute')) {
  executeMigration().catch(console.error);
} else if (args.includes('--rollback')) {
  const fileArg = args[args.indexOf('--rollback') + 1];
  rollback(fileArg).catch(console.error);
} else {
  dryRun().catch(console.error);
}

