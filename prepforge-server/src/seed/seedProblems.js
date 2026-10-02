const mongoose = require('mongoose');
const Problem = require('../models/Problem.model');
const connectDB = require('../config/db');

/**
 * Seed script for the 141 DSA problems.
 * Reads from problems.seed.json and inserts preserving orderIndex.
 *
 * Usage:
 *   node src/seed/seedProblems.js
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Optionally clears existing problems (--clear flag)
 * 3. Inserts all problems from the seed file
 * 4. Preserves week and orderIndex ordering
 */

const seedProblems = async () => {
  try {
    await connectDB();

    const clearFlag = process.argv.includes('--clear');

    if (clearFlag) {
      console.log('Clearing existing problems...');
      await Problem.deleteMany({});
      console.log('Cleared.');
    }

    const existingCount = await Problem.countDocuments();
    if (existingCount > 0 && !clearFlag) {
      console.log(`Database already has ${existingCount} problems. Use --clear to replace.`);
      process.exit(0);
    }

    // Load seed data
    let seedData;
    try {
      seedData = require('./problems.seed.json');
    } catch (e) {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║  problems.seed.json not found.                           ║');
      console.log('║                                                          ║');
      console.log('║  Create src/seed/problems.seed.json with format:         ║');
      console.log('║  [                                                       ║');
      console.log('║    {                                                     ║');
      console.log('║      "title": "Two Sum",                                 ║');
      console.log('║      "difficulty": "Easy",                               ║');
      console.log('║      "topic": "Array",                                   ║');
      console.log('║      "week": 1,                                          ║');
      console.log('║      "orderIndex": 1,                                    ║');
      console.log('║      "leetcodeUrl": "https://leetcode.com/...",          ║');
      console.log('║      "patterns": ["HashMap"]                             ║');
      console.log('║    }                                                     ║');
      console.log('║  ]                                                       ║');
      console.log('║                                                          ║');
      console.log('║  Or use the /api/v1/import/problems/json endpoint.       ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');

      // Create a sample seed file with 5 problems for testing
      console.log('Creating sample seed data for development testing...');
      seedData = getSampleProblems();
    }

    console.log(`Inserting ${seedData.length} problems...`);

    const result = await Problem.insertMany(seedData, { ordered: true });
    console.log(`Successfully seeded ${result.length} problems.`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

/**
 * Sample problems for development testing.
 * These will be replaced with the full 141 when the user provides them.
 */
const getSampleProblems = () => [
  { title: 'Two Sum', difficulty: 'Easy', topic: 'Array', week: 1, orderIndex: 1, leetcodeUrl: 'https://leetcode.com/problems/two-sum', patterns: ['Arrays', 'HashMap'] },
  { title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Stack', week: 1, orderIndex: 2, leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses', patterns: ['Stack'] },
  { title: 'Merge Two Sorted Lists', difficulty: 'Easy', topic: 'Linked List', week: 1, orderIndex: 3, leetcodeUrl: 'https://leetcode.com/problems/merge-two-sorted-lists', patterns: ['Linked List'] },
  { title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', topic: 'Array', week: 1, orderIndex: 4, leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock', patterns: ['Arrays', 'Sliding Window'] },
  { title: 'Valid Palindrome', difficulty: 'Easy', topic: 'String', week: 1, orderIndex: 5, leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome', patterns: ['Two Pointer'] },
  { title: 'Invert Binary Tree', difficulty: 'Easy', topic: 'Tree', week: 1, orderIndex: 6, leetcodeUrl: 'https://leetcode.com/problems/invert-binary-tree', patterns: ['Tree', 'DFS'] },
  { title: 'Valid Anagram', difficulty: 'Easy', topic: 'String', week: 1, orderIndex: 7, leetcodeUrl: 'https://leetcode.com/problems/valid-anagram', patterns: ['HashMap'] },
  { title: 'Binary Search', difficulty: 'Easy', topic: 'Array', week: 1, orderIndex: 8, leetcodeUrl: 'https://leetcode.com/problems/binary-search', patterns: ['Binary Search'] },
  { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topic: 'String', week: 1, orderIndex: 9, leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters', patterns: ['Sliding Window', 'HashMap'] },
  { title: '3Sum', difficulty: 'Medium', topic: 'Array', week: 1, orderIndex: 10, leetcodeUrl: 'https://leetcode.com/problems/3sum', patterns: ['Two Pointer', 'Sorting'] },
  { title: 'Group Anagrams', difficulty: 'Medium', topic: 'String', week: 2, orderIndex: 11, leetcodeUrl: 'https://leetcode.com/problems/group-anagrams', patterns: ['HashMap', 'Sorting'] },
  { title: 'Product of Array Except Self', difficulty: 'Medium', topic: 'Array', week: 2, orderIndex: 12, leetcodeUrl: 'https://leetcode.com/problems/product-of-array-except-self', patterns: ['Arrays'] },
  { title: 'Clone Graph', difficulty: 'Medium', topic: 'Graph', week: 2, orderIndex: 13, leetcodeUrl: 'https://leetcode.com/problems/clone-graph', patterns: ['Graph', 'DFS', 'BFS'] },
  { title: 'Validate Binary Search Tree', difficulty: 'Medium', topic: 'Tree', week: 2, orderIndex: 14, leetcodeUrl: 'https://leetcode.com/problems/validate-binary-search-tree', patterns: ['Tree', 'DFS'] },
  { title: 'Coin Change', difficulty: 'Medium', topic: 'DP', week: 2, orderIndex: 15, leetcodeUrl: 'https://leetcode.com/problems/coin-change', patterns: ['DP'] },
  { title: 'Number of Islands', difficulty: 'Medium', topic: 'Graph', week: 2, orderIndex: 16, leetcodeUrl: 'https://leetcode.com/problems/number-of-islands', patterns: ['Graph', 'DFS', 'BFS'] },
  { title: 'Course Schedule', difficulty: 'Medium', topic: 'Graph', week: 3, orderIndex: 17, leetcodeUrl: 'https://leetcode.com/problems/course-schedule', patterns: ['Graph', 'DFS'] },
  { title: 'Merge Intervals', difficulty: 'Medium', topic: 'Array', week: 3, orderIndex: 18, leetcodeUrl: 'https://leetcode.com/problems/merge-intervals', patterns: ['Sorting', 'Arrays'] },
  { title: 'Word Break', difficulty: 'Medium', topic: 'DP', week: 3, orderIndex: 19, leetcodeUrl: 'https://leetcode.com/problems/word-break', patterns: ['DP'] },
  { title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Array', week: 3, orderIndex: 20, leetcodeUrl: 'https://leetcode.com/problems/trapping-rain-water', patterns: ['Two Pointer', 'Stack'] },
  { title: 'Merge K Sorted Lists', difficulty: 'Hard', topic: 'Linked List', week: 3, orderIndex: 21, leetcodeUrl: 'https://leetcode.com/problems/merge-k-sorted-lists', patterns: ['Linked List', 'Heap'] },
  { title: 'Minimum Window Substring', difficulty: 'Hard', topic: 'String', week: 3, orderIndex: 22, leetcodeUrl: 'https://leetcode.com/problems/minimum-window-substring', patterns: ['Sliding Window', 'HashMap'] },
  { title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', topic: 'Tree', week: 4, orderIndex: 23, leetcodeUrl: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree', patterns: ['Tree', 'DFS', 'BFS'] },
  { title: 'Word Search II', difficulty: 'Hard', topic: 'Trie', week: 4, orderIndex: 24, leetcodeUrl: 'https://leetcode.com/problems/word-search-ii', patterns: ['Trie', 'Backtracking', 'DFS'] },
  { title: 'Longest Increasing Subsequence', difficulty: 'Medium', topic: 'DP', week: 4, orderIndex: 25, leetcodeUrl: 'https://leetcode.com/problems/longest-increasing-subsequence', patterns: ['DP', 'Binary Search'] },
];

seedProblems();
