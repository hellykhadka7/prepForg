/**
 * Targeted Integration Test Suite: Progress-Tracking Consistency
 *
 * Verifies:
 * 1. Completion union for accepted-only solutions
 * 2. Completion union for manually completed UserProblemStatus
 * 3. Overlapping accepted + manual completions (strict deduplication)
 * 4. Difficulty counts (Easy, Medium, Hard) correctly computed from union
 * 5. Custom-problem isolation in denominator (User A never sees User B's custom problems)
 * 6. Roadmap progress using the completion union
 * 7. Analytics service charts using the union for counts while preserving genuine confidence
 * 8. Daily goals progress using today's completions with deduplication and prior-solve exclusion
 *
 * Runs with Node.js built-in test runner: `node tests/progress-consistency.test.js`
 */

const assert = require('node:assert');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../src/config/env');
const Problem = require('../src/models/Problem.model');
const Solution = require('../src/models/Solution.model');
const UserProblemStatus = require('../src/models/UserProblemStatus.model');
const Roadmap = require('../src/models/Roadmap.model');
const { getCompletedProblemIds, getCompletedTodayProblemIds } = require('../src/services/completion.service');
const { getDifficultyDistribution, getTopicStats, getPatternStats } = require('../src/services/analytics.service');
const { getUTCToday, addDays } = require('../src/utils/dateUtils');

async function runTests() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for consistency testing.');

  const testSuffix = Date.now().toString();
  const createdProblemIds = [];
  const createdSolutionIds = [];
  const createdStatusIds = [];
  const createdRoadmapIds = [];

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const today = getUTCToday();
  const yesterday = addDays(today, -1);

  try {
    // ── Setup Test Problems ──
    // Prob 1: Easy (accepted solution only)
    const prob1 = await Problem.create({
      title: `__TEST_PROB_1_${testSuffix}__`,
      difficulty: 'Easy',
      topic: 'TestArray',
      patterns: ['Arrays'],
      isActive: true,
      week: 1,
      orderIndex: 1,
    });
    createdProblemIds.push(prob1._id);

    // Prob 2: Medium (manual status only)
    const prob2 = await Problem.create({
      title: `__TEST_PROB_2_${testSuffix}__`,
      difficulty: 'Medium',
      topic: 'TestTree',
      patterns: ['Tree'],
      isActive: true,
      week: 1,
      orderIndex: 2,
    });
    createdProblemIds.push(prob2._id);

    // Prob 3: Hard (both accepted solution AND manual status)
    const prob3 = await Problem.create({
      title: `__TEST_PROB_3_${testSuffix}__`,
      difficulty: 'Hard',
      topic: 'TestDP',
      patterns: ['DP'],
      isActive: true,
      week: 1,
      orderIndex: 3,
    });
    createdProblemIds.push(prob3._id);

    // Prob 4: Easy (user B's custom problem)
    const prob4 = await Problem.create({
      title: `__TEST_PROB_4_USER_B_${testSuffix}__`,
      difficulty: 'Easy',
      topic: 'CustomB',
      isCustom: true,
      createdBy: userB,
      isActive: true,
      week: 0,
      orderIndex: 0,
    });
    createdProblemIds.push(prob4._id);

    // Prob 5: Medium (user A's custom problem)
    const prob5 = await Problem.create({
      title: `__TEST_PROB_5_USER_A_${testSuffix}__`,
      difficulty: 'Medium',
      topic: 'CustomA',
      isCustom: true,
      createdBy: userA,
      isActive: true,
      week: 0,
      orderIndex: 0,
    });
    createdProblemIds.push(prob5._id);

    // ── Setup Solutions & Statuses for User A ──
    // Prob 1: Accepted solution today
    const sol1 = await Solution.create({
      userId: userA,
      problemId: prob1._id,
      language: 'javascript',
      code: 'test()',
      isAccepted: true,
      isFirstSolve: true,
      confidence: 4,
      solveDuration: 60,
      xpAwarded: 10,
      submittedAt: today,
    });
    createdSolutionIds.push(sol1._id);

    // Prob 2: Manual status 'completed' today
    const stat2 = await UserProblemStatus.create({
      userId: userA,
      problemId: prob2._id,
      status: 'completed',
    });
    createdStatusIds.push(stat2._id);

    // Prob 3: BOTH accepted solution today AND manual status 'completed' today
    const sol3 = await Solution.create({
      userId: userA,
      problemId: prob3._id,
      language: 'python',
      code: 'test()',
      isAccepted: true,
      isFirstSolve: true,
      confidence: 5,
      solveDuration: 120,
      xpAwarded: 20,
      submittedAt: today,
    });
    createdSolutionIds.push(sol3._id);

    const stat3 = await UserProblemStatus.create({
      userId: userA,
      problemId: prob3._id,
      status: 'completed',
    });
    createdStatusIds.push(stat3._id);

    // Prob 5 (User A's custom): Manual status 'completed' today
    const stat5 = await UserProblemStatus.create({
      userId: userA,
      problemId: prob5._id,
      status: 'completed',
    });
    createdStatusIds.push(stat5._id);

    // ──────────────────────────────────────────────────────
    // TEST 1: Completion Union & Deduplication
    // ──────────────────────────────────────────────────────
    console.log('Testing Test 1: Completion union & deduplication...');
    const completedA = await getCompletedProblemIds(userA);
    const completedAStr = completedA.map((id) => id.toString());

    assert.strictEqual(completedA.length, 4, 'User A should have exactly 4 completed problems (Prob 1, 2, 3, 5)');
    assert.ok(completedAStr.includes(prob1._id.toString()), 'Prob 1 (solution only) should be in union');
    assert.ok(completedAStr.includes(prob2._id.toString()), 'Prob 2 (status only) should be in union');
    assert.ok(completedAStr.includes(prob3._id.toString()), 'Prob 3 (both) should be in union exactly once');
    assert.ok(completedAStr.includes(prob5._id.toString()), 'Prob 5 (custom) should be in union');
    assert.ok(!completedAStr.includes(prob4._id.toString()), 'Prob 4 (User B custom) must NOT be in union for User A');
    console.log('✔ Test 1 passed.');

    // ──────────────────────────────────────────────────────
    // TEST 2: Difficulty Breakdown
    // ──────────────────────────────────────────────────────
    console.log('Testing Test 2: Difficulty breakdown calculation...');
    const completedProblems = await Problem.find(
      { _id: { $in: completedA }, isActive: true },
      { difficulty: 1 }
    ).lean();

    const diffCounts = { total: completedProblems.length, easy: 0, medium: 0, hard: 0 };
    for (const p of completedProblems) {
      if (p.difficulty === 'Easy') diffCounts.easy++;
      else if (p.difficulty === 'Medium') diffCounts.medium++;
      else if (p.difficulty === 'Hard') diffCounts.hard++;
    }

    assert.strictEqual(diffCounts.total, 4, 'Total completed should be 4');
    assert.strictEqual(diffCounts.easy, 1, 'Easy completed should be 1 (Prob 1)');
    assert.strictEqual(diffCounts.medium, 2, 'Medium completed should be 2 (Prob 2, Prob 5)');
    assert.strictEqual(diffCounts.hard, 1, 'Hard completed should be 1 (Prob 3)');
    assert.strictEqual(diffCounts.easy + diffCounts.medium + diffCounts.hard, diffCounts.total, 'Sub-totals must sum to total');
    console.log('✔ Test 2 passed.');

    // ──────────────────────────────────────────────────────
    // TEST 3: Custom-Problem Denominator Isolation
    // ──────────────────────────────────────────────────────
    console.log('Testing Test 3: Custom-problem denominator isolation...');
    // Seeded + User A custom
    const denominatorA = await Problem.countDocuments({
      isActive: true,
      $or: [{ isCustom: { $ne: true } }, { isCustom: true, createdBy: userA }],
    });

    // Seeded + User B custom
    const denominatorB = await Problem.countDocuments({
      isActive: true,
      $or: [{ isCustom: { $ne: true } }, { isCustom: true, createdBy: userB }],
    });

    // All active problems in DB (including both A and B custom)
    const denominatorGlobal = await Problem.countDocuments({ isActive: true });

    assert.ok(denominatorA < denominatorGlobal, 'User A denominator must not count User B custom problems');
    assert.ok(denominatorB < denominatorGlobal, 'User B denominator must not count User A custom problems');
    console.log('✔ Test 3 passed.');

    // ──────────────────────────────────────────────────────
    // TEST 4: Roadmap Progress with Union
    // ──────────────────────────────────────────────────────
    console.log('Testing Test 4: Roadmap progress with union...');
    const roadmap = await Roadmap.create({
      name: `__TEST_ROADMAP_${testSuffix}__`,
      description: 'Test roadmap',
      isSystem: false,
      createdBy: userA,
      problemIds: [prob1._id, prob2._id, prob3._id, prob4._id],
    });
    createdRoadmapIds.push(roadmap._id);

    const completedIdsSet = new Set(completedA.map((id) => id.toString()));
    const solvedInRoadmap = roadmap.problemIds.filter((pid) => completedIdsSet.has(pid.toString())).length;

    assert.strictEqual(solvedInRoadmap, 3, 'Roadmap should have 3 solved problems for User A (Prob 1, 2, 3)');
    console.log('✔ Test 4 passed.');

    // ──────────────────────────────────────────────────────
    // TEST 5: Analytics Services
    // ──────────────────────────────────────────────────────
    console.log('Testing Test 5: Analytics difficulty, topic, and pattern stats...');
    const diffDist = await getDifficultyDistribution(userA);
    assert.ok(diffDist.Easy >= 1, 'Difficulty distribution should include Easy');
    assert.ok(diffDist.Medium >= 2, 'Difficulty distribution should include Medium');
    assert.ok(diffDist.Hard >= 1, 'Difficulty distribution should include Hard');

    const topicStats = await getTopicStats(userA);
    const topicMap = Object.fromEntries(topicStats.map((t) => [t._id, t]));
    assert.ok(topicMap['TestArray'] && topicMap['TestArray'].solved >= 1, 'Topic TestArray should be counted');
    assert.ok(topicMap['TestTree'] && topicMap['TestTree'].solved >= 1, 'Topic TestTree should be counted');
    assert.ok(topicMap['TestDP'] && topicMap['TestDP'].solved >= 1, 'Topic TestDP should be counted');

    // Verify confidence is genuine (only Prob 1 and Prob 3 had submissions with confidence 4 and 5)
    assert.strictEqual(topicMap['TestArray'].avgConfidence, 4, 'TestArray confidence should reflect real submission');
    assert.strictEqual(topicMap['TestTree'].avgConfidence, null, 'TestTree (manual only) should have null confidence');
    assert.strictEqual(topicMap['TestDP'].avgConfidence, 5, 'TestDP confidence should reflect real submission');

    const patternStats = await getPatternStats(userA);
    const patternMap = Object.fromEntries(patternStats.map((p) => [p._id, p.count]));
    assert.ok(patternMap['Arrays'] >= 1, 'Pattern Arrays counted');
    assert.ok(patternMap['Tree'] >= 1, 'Pattern Tree counted');
    assert.ok(patternMap['DP'] >= 1, 'Pattern DP counted');
    console.log('✔ Test 5 passed.');

    // ──────────────────────────────────────────────────────
    // TEST 6: Daily Goals Progress (Deduplication & Prior Solves)
    // ──────────────────────────────────────────────────────
    console.log('Testing Test 6: Daily goals completion today...');
    const todayCompleted = await getCompletedTodayProblemIds(userA, today);
    const todayCompletedStr = todayCompleted.map((id) => id.toString());

    // User A solved Prob 1, Prob 2, Prob 3, Prob 5 today
    assert.strictEqual(todayCompleted.length, 4, 'All 4 completed today should count');
    assert.ok(todayCompletedStr.includes(prob3._id.toString()), 'Prob 3 (solved both ways today) counts exactly once');

    // Now simulate Prob 1 was solved yesterday instead
    await Solution.updateOne({ _id: sol1._id }, { submittedAt: yesterday });
    const todayAfterPriorSolve = await getCompletedTodayProblemIds(userA, today);
    const todayAfterPriorSolveStr = todayAfterPriorSolve.map((id) => id.toString());

    assert.ok(!todayAfterPriorSolveStr.includes(prob1._id.toString()), 'Problem solved prior to today must NOT count for today');
    assert.strictEqual(todayAfterPriorSolve.length, 3, 'Today count should now be 3 (Prob 2, 3, 5)');
    console.log('✔ Test 6 passed.');

    // ──────────────────────────────────────────────────────
    // TEST 7: Prior-day completion changed & marked completed again today
    // ──────────────────────────────────────────────────────
    console.log('Testing Test 7: Prior-day completion changed and marked completed again today...');
    const prob6 = await Problem.create({
      title: `__TEST_PROB_6_${testSuffix}__`,
      difficulty: 'Easy',
      topic: 'TestRecomplete',
      isActive: true,
      week: 1,
      orderIndex: 6,
    });
    createdProblemIds.push(prob6._id);

    // Previously marked completed, then changed to on_hold yesterday
    const stat6 = await UserProblemStatus.create({
      userId: userA,
      problemId: prob6._id,
      status: 'on_hold',
      updatedAt: yesterday,
    });
    createdStatusIds.push(stat6._id);

    // Yesterday on_hold -> should NOT be in today's completed
    const beforeToday = await getCompletedTodayProblemIds(userA, today);
    assert.ok(!beforeToday.map(String).includes(prob6._id.toString()), 'Yesterday on_hold should not count today');

    // Marked completed again today
    stat6.status = 'completed';
    stat6.updatedAt = today;
    await stat6.save();

    // Now it MUST count towards today's daily goal
    const afterRecomplete = await getCompletedTodayProblemIds(userA, today);
    assert.ok(afterRecomplete.map(String).includes(prob6._id.toString()), 'Marked completed again today MUST count for today');

    // If user also submits an accepted solution for Prob 6 today, it must NOT double-count
    const sol6 = await Solution.create({
      userId: userA,
      problemId: prob6._id,
      language: 'javascript',
      code: 'recomplete()',
      confidence: 4,
      isAccepted: true,
      submittedAt: today,
    });
    createdSolutionIds.push(sol6._id);

    const afterSolutionToo = await getCompletedTodayProblemIds(userA, today);
    const countOfProb6 = afterSolutionToo.filter((id) => id.toString() === prob6._id.toString()).length;
    assert.strictEqual(countOfProb6, 1, 'Dual completion today (status + submission) must be counted EXACTLY ONCE');
    console.log('✔ Test 7 passed.');

    console.log('\n========================================');
    console.log('ALL TARGETED INTEGRATION TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    // ── Clean up all test records ──
    console.log('Cleaning up test documents from database...');
    if (createdProblemIds.length > 0) {
      await Problem.deleteMany({ _id: { $in: createdProblemIds } });
    }
    if (createdSolutionIds.length > 0) {
      await Solution.deleteMany({ _id: { $in: createdSolutionIds } });
    }
    if (createdStatusIds.length > 0) {
      await UserProblemStatus.deleteMany({ _id: { $in: createdStatusIds } });
    }
    if (createdRoadmapIds.length > 0) {
      await Roadmap.deleteMany({ _id: { $in: createdRoadmapIds } });
    }
    await mongoose.disconnect();
    console.log('Cleanup complete and database disconnected.');
  }
}

runTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});

