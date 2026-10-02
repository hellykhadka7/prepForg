/**
 * Timezone-safe date utilities.
 * All dates stored as UTC midnight for consistency.
 */

/**
 * Get today's date as UTC midnight.
 * This ensures consistent date comparison across timezones.
 */
const getUTCToday = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Normalize any date to UTC midnight.
 */
const toUTCMidnight = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Add days to a date, returning a new UTC midnight date.
 */
const addDays = (date, days) => {
  const d = toUTCMidnight(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

/**
 * Calculate difference in days between two dates (UTC midnight).
 */
const daysBetween = (date1, date2) => {
  const d1 = toUTCMidnight(date1);
  const d2 = toUTCMidnight(date2);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

/**
 * Check if two dates are the same UTC day.
 */
const isSameDay = (date1, date2) => {
  const d1 = toUTCMidnight(date1);
  const d2 = toUTCMidnight(date2);
  return d1.getTime() === d2.getTime();
};

/**
 * Check if a date is yesterday (UTC).
 */
const isYesterday = (date) => {
  const yesterday = addDays(getUTCToday(), -1);
  return isSameDay(date, yesterday);
};

/**
 * Check if a date is today or in the past (UTC).
 */
const isDueOrOverdue = (date) => {
  const today = getUTCToday();
  return toUTCMidnight(date).getTime() <= today.getTime();
};

/**
 * Check if today is a weekend (Saturday or Sunday).
 */
const isWeekend = () => {
  const day = new Date().getUTCDay();
  return day === 0 || day === 6;
};

/**
 * Get ISO week number for a date (e.g., "2026-W38").
 */
const getISOWeek = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

module.exports = {
  getUTCToday,
  toUTCMidnight,
  addDays,
  daysBetween,
  isSameDay,
  isYesterday,
  isDueOrOverdue,
  isWeekend,
  getISOWeek,
};
