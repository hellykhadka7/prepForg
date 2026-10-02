const { parse } = require('csv-parse/sync');
const Problem = require('../models/Problem.model');
const { DIFFICULTIES, PATTERNS } = require('../config/constants');

/**
 * Import Service
 * Handles JSON, CSV, and paste-based bulk problem imports.
 * Validates data before insertion and preserves insertion order via orderIndex.
 */

/**
 * Parse and validate a JSON array of problem objects.
 * Returns { valid: Problem[], errors: string[] }.
 */
const parseJSONImport = (jsonData) => {
  const errors = [];
  const valid = [];

  if (!Array.isArray(jsonData)) {
    return { valid: [], errors: ['Input must be a JSON array'] };
  }

  jsonData.forEach((item, index) => {
    const itemErrors = validateProblemItem(item, index);
    if (itemErrors.length > 0) {
      errors.push(...itemErrors);
    } else {
      valid.push({
        title: item.title.trim(),
        difficulty: item.difficulty,
        topic: item.topic.trim(),
        week: parseInt(item.week, 10),
        orderIndex: item.orderIndex != null ? parseInt(item.orderIndex, 10) : index,
        leetcodeUrl: item.leetcodeUrl || '',
        patterns: item.patterns || [],
        isActive: true,
      });
    }
  });

  return { valid, errors };
};

/**
 * Parse and validate a CSV string of problems.
 * Expected columns: title, difficulty, topic, week, orderIndex, leetcodeUrl, patterns
 * patterns should be semicolon-separated within the CSV.
 */
const parseCSVImport = (csvString) => {
  const errors = [];
  const valid = [];

  let records;
  try {
    records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (e) {
    return { valid: [], errors: [`CSV parse error: ${e.message}`] };
  }

  records.forEach((item, index) => {
    // Convert patterns from semicolon-separated string to array
    if (typeof item.patterns === 'string') {
      item.patterns = item.patterns
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean);
    }

    if (item.week) item.week = parseInt(item.week, 10);
    if (item.orderIndex) item.orderIndex = parseInt(item.orderIndex, 10);

    const itemErrors = validateProblemItem(item, index);
    if (itemErrors.length > 0) {
      errors.push(...itemErrors);
    } else {
      valid.push({
        title: item.title.trim(),
        difficulty: item.difficulty,
        topic: item.topic.trim(),
        week: item.week,
        orderIndex: item.orderIndex != null ? item.orderIndex : index,
        leetcodeUrl: item.leetcodeUrl || '',
        patterns: item.patterns || [],
        isActive: true,
      });
    }
  });

  return { valid, errors };
};

/**
 * Validate a single problem item.
 */
const validateProblemItem = (item, index) => {
  const errors = [];
  const prefix = `Item ${index + 1}`;

  if (!item.title || typeof item.title !== 'string' || item.title.trim() === '') {
    errors.push(`${prefix}: title is required`);
  }
  if (!item.difficulty || !DIFFICULTIES.includes(item.difficulty)) {
    errors.push(`${prefix}: difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  }
  if (!item.topic || typeof item.topic !== 'string' || item.topic.trim() === '') {
    errors.push(`${prefix}: topic is required`);
  }
  if (item.week == null || isNaN(parseInt(item.week, 10)) || parseInt(item.week, 10) < 1) {
    errors.push(`${prefix}: week must be a positive number`);
  }
  if (item.patterns && Array.isArray(item.patterns)) {
    for (const p of item.patterns) {
      if (!PATTERNS.includes(p)) {
        errors.push(`${prefix}: invalid pattern "${p}"`);
      }
    }
  }

  return errors;
};

/**
 * Bulk insert validated problems into the database.
 * Returns the count of inserted documents.
 */
const bulkInsertProblems = async (validProblems) => {
  if (validProblems.length === 0) return 0;

  const result = await Problem.insertMany(validProblems, { ordered: true });
  return result.length;
};

module.exports = { parseJSONImport, parseCSVImport, bulkInsertProblems };
