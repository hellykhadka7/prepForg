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
 * - Validates expected pre-migration state and aborts before mutation if expectations fail
 * - Automatically rolls back in MongoDB if any error or duplicate-key conflict occurs
 * - Dynamically queries ALL matching UserProblemStatus records (not a hardcoded list)
 * - Takes a full pre-migration JSON snapshot saved to disk before any mutation
 * - Per-user status override list: certain users can have their migrated status reset to
 *   a specific value instead of being carried over (e.g. test-only completions).
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

/**
 * Per-user status overrides for the MIGRATE_REFERENCE path.
 *
 * When a user's only status record lives on the duplicate problem and that status
 * should NOT be migrated as-is to the canonical problem (e.g. a test-only
 * completion that was never a genuine solve), add an entry here.
 *
 * Key:   userId string (hex ObjectId)
 * Value: the status that will be written onto the canonical problem record instead
 *        of the duplicated status.
 *
 * Users NOT listed here follow the default path: their status is migrated unchanged.
 * Users with an existing record on the canonical problem follow the DELETE_REDUNDANT
 * path and are unaffected by this map.
 */
const STATUS_OVERRIDES = {
  // hellykhadka (6ab657dab93e7d35cf066f0c): marked 'completed' only as a tracker UI test.
  // Reset to 'not_started' on the canonical problem so genuine history is unaffected.
  '6ab657dab93e7d35cf066f0c': 'not_started',
};

const SNAPSHOT_DIR = path.resolve(__dirname, '../../.migration-snapshots');

/**
 * Validate that both target problems exist, both titles match "Two Sum"
 * (case-insensitive after trimming), the canonical record is active,
 * and the duplicate record is active.
 *
 * Throws an error to abort execution if any expectation fails.
 */
function validateTargetProblems(p1, p2) {
  if (!p1) {
    throw new Error(`Canonical problem ${CANONICAL_ID} not found in database.`);
  }
  if (!p2) {
    throw new Error(`Duplicate problem ${DUPLICATE_ID} not found in database.`);
  }

  const p1Title = p1.title ? p1.title.trim().toLowerCase() : '';
  const p2Title = p2.title ? p2.title.trim().toLowerCase() : '';

  if (p1Title !== 'two sum') {
    throw new Error(`Canonical problem title expected "Two Sum", got "${p1.title}".`);
  }
  if (p2Title !== 'two sum') {
    throw new Error(`Duplicate problem title expected "Two Sum", got "${p2.title}".`);
  }

  if (!p1.isActive) {
    throw new Error(`Canonical problem ${CANONICAL_ID} is not active (isActive: ${p1.isActive}).`);
  }
  if (!p2.isActive) {
    throw new Error(`Duplicate problem ${DUPLICATE_ID} is already inactive (isActive: ${p2.isActive}). Migration may have already run.`);
  }
}

/**
 * Reconstruct a UserProblemStatus document for rollback restoration,
 * preserving original userId (as ObjectId), problemId (as ObjectId), status,
 * timestamps (createdAt, updatedAt), and __v.
 */
function buildRollbackStatusDoc(orig) {
  const updateDoc = {
    userId: new mongoose.Types.ObjectId(orig.userId),
    problemId: new mongoose.Types.ObjectId(orig.problemId),
    status: orig.status,
  };
  if (orig.createdAt) updateDoc.createdAt = new Date(orig.createdAt);
  if (orig.updatedAt) updateDoc.updatedAt = new Date(orig.updatedAt);
  if (typeof orig.__v !== 'undefined') updateDoc.__v = orig.__v;
  return updateDoc;
}

async function dryRun() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Running DRY-RUN simulation...');

  const p1 = await Problem.findById(CANONICAL_ID).lean();
  const p2 = await Problem.findById(DUPLICATE_ID).lean();

  // Validate pre-state
  validateTargetProblems(p1, p2);

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
      const override = STATUS_OVERRIDES[status.userId.toString()];
      const targetStatus = override !== undefined ? override : status.status;
      const overrideNote = override !== undefined
        ? ` [OVERRIDE: original status "${status.status}" replaced with "${targetStatus}" — test-only completion reset]`
        : '';
      actions.push({
        type: 'MIGRATE_REFERENCE',
        userId: status.userId,
        statusId: status._id,
        currentStatus: status.status,
        targetStatus,
        reason: `User has no status on canonical problem. Record will be updated: problemId ${DUPLICATE_ID} -> ${CANONICAL_ID}, status "${status.status}" -> "${targetStatus}".${overrideNote}`,
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

  // Step 1: Pre-migration validation
  const p1Before = await Problem.findById(CANONICAL_ID).lean();
  const p2Before = await Problem.findById(DUPLICATE_ID).lean();

  validateTargetProblems(p1Before, p2Before);

  // Ensure snapshot dir exists
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  // Step 2: Pre-migration Snapshot of ALL affected documents
  const duplicateStatusesBefore = await UserProblemStatus.find({ problemId: DUPLICATE_ID }).lean();
  const canonicalStatusesBefore = await UserProblemStatus.find({ problemId: CANONICAL_ID }).lean();

  const snapshot = {
    timestamp: new Date().toISOString(),
    canonicalId: CANONICAL_ID.toString(),
    duplicateId: DUPLICATE_ID.toString(),
    // Record the overrides that were active at migration time, for audit and rollback reference.
    statusOverridesApplied: STATUS_OVERRIDES,
    p1Before,
    p2Before,
    duplicateStatusesBefore,
    canonicalStatusesBefore,
  };

  const snapshotFile = path.join(SNAPSHOT_DIR, `snapshot-two-sum-${Date.now()}.json`);
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`Pre-migration snapshot written to: ${snapshotFile}`);

  // Step 3: Run within MongoDB Multi-Document Transaction
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
          // DELETE_REDUNDANT path:
          // The user already has a canonical status record. The duplicate status is discarded
          // entirely to avoid E11000 unique-index violation. The canonical status is kept
          // exactly as-is — we do NOT upgrade it based on the duplicate record, because
          // the duplicate may represent a test-only interaction rather than a genuine solve.
          await UserProblemStatus.deleteOne({ _id: status._id }).session(session);
          console.log(`[Tx] Removed redundant status record ${status._id} for user ${status.userId} (canonical status preserved unchanged)`);
        } else {
          // MIGRATE_REFERENCE path:
          // The user has no canonical status. Re-point the duplicate record to the canonical
          // problem. Apply STATUS_OVERRIDES if defined — this allows test-only completions
          // to be reset to 'not_started' rather than carried over as 'completed'.
          const override = STATUS_OVERRIDES[status.userId.toString()];
          const targetStatus = override !== undefined ? override : status.status;

          await UserProblemStatus.updateOne(
            { _id: status._id },
            { $set: { problemId: CANONICAL_ID, status: targetStatus } }
          ).session(session);

          if (override !== undefined) {
            console.log(`[Tx] Migrated status record ${status._id} to canonical problem for user ${status.userId} — status reset from "${status.status}" to "${targetStatus}" (override applied)`);
          } else {
            console.log(`[Tx] Migrated status record ${status._id} to canonical problem for user ${status.userId} — status "${targetStatus}" carried over`);
          }
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

      // 2. Restore duplicate statuses (preserving userId, problemId, status, and timestamps)
      for (const orig of snapshot.duplicateStatusesBefore) {
        const updateDoc = buildRollbackStatusDoc(orig);
        await UserProblemStatus.updateOne(
          { _id: new mongoose.Types.ObjectId(orig._id) },
          { $set: updateDoc },
          { upsert: true }
        ).session(session);
        console.log(`[Rollback] Restored duplicate status record ${orig._id}`);
      }

      // 3. Restore canonical statuses (preserving userId, problemId, status, and timestamps)
      for (const orig of snapshot.canonicalStatusesBefore) {
        const updateDoc = buildRollbackStatusDoc(orig);
        await UserProblemStatus.updateOne(
          { _id: new mongoose.Types.ObjectId(orig._id) },
          { $set: updateDoc },
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

module.exports = {
  CANONICAL_ID,
  DUPLICATE_ID,
  STATUS_OVERRIDES,
  validateTargetProblems,
  buildRollbackStatusDoc,
  dryRun,
  executeMigration,
  rollback,
};

// CLI handler
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--execute')) {
    executeMigration().catch(console.error);
  } else if (args.includes('--rollback')) {
    const fileArg = args[args.indexOf('--rollback') + 1];
    rollback(fileArg).catch(console.error);
  } else {
    dryRun().catch(console.error);
  }
}
