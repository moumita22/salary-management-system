import type { SeniorityLevel } from '../types/index.js';

/**
 * Formatters and Common UI Utilities for Salary Management System
 */

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const COUNTRIES = [
  { code: 'IN', name: '🇮🇳 India', badge: '🇮🇳 IN' },
  { code: 'US', name: '🇺🇸 United States', badge: '🇺🇸 US' },
  { code: 'DE', name: '🇩🇪 Germany', badge: '🇩🇪 DE' },
  { code: 'GB', name: '🇬🇧 United Kingdom', badge: '🇬🇧 GB' },
  { code: 'SG', name: '🇸🇬 Singapore', badge: '🇸🇬 SG' },
] as const;

export const LEVELS = [
  { code: 'JUNIOR', name: 'Junior Tier' },
  { code: 'MID_LEVEL', name: 'Mid-Level' },
  { code: 'SENIOR', name: 'Senior / Lead' },
] as const;

/**
 * Returns Tailwind CSS styling classes for Seniority level badges
 */
export function getLevelBadgeClass(level?: SeniorityLevel): string {
  switch (level) {
    case 'SENIOR':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'MID_LEVEL':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

/**
 * Returns country code with national flag icon badge
 */
export function getCountryBadge(code: string): string {
  const match = COUNTRIES.find((c) => c.code === code);
  return match ? match.badge : code;
}

/**
 * Format numeric or string amount as USD currency string ($X,XXX.XX)
 */
export function formatUsd(val?: number | string | null): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return '—';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Parses a Date object, ISO date string, or null into a calendar day number and formatted string
 */
export function parseDate(val?: string | Date | null): { day: number; text: string } {
  if (!val) return { day: 15, text: '—' };
  const str = val instanceof Date ? val.toISOString().split('T')[0] : String(val).split('T')[0];
  const parts = str.split('-');
  const day = parts.length >= 3 ? parseInt(parts[2], 10) : 15;
  return { day: isNaN(day) ? 15 : day, text: str };
}

/**
 * Formats a month number (1-12) and year into a long readable period title (e.g. 'November 2026')
 */
export function formatPayPeriod(month: number, year: number): string {
  const monthName = MONTHS_LONG[month - 1] || 'Current';
  return `${monthName} ${year}`;
}
