/**
 * Date and Payroll Cycle Calendar Utilities
 */

/**
 * Returns the exact number of calendar days in a given month and year
 * (Handles leap years accurately: e.g. Feb 2024 -> 29, Feb 2026 -> 28)
 */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Returns formatted start and end ISO dates ('YYYY-MM-DD') for a monthly payroll cycle
 */
export function getCycleDates(
  month: number,
  year: number
): { cycleStart: string; cycleEnd: string; daysInMonth: number } {
  const daysInMonth = getDaysInMonth(month, year);
  const mm = String(month).padStart(2, '0');
  const dd = String(daysInMonth).padStart(2, '0');

  return {
    cycleStart: `${year}-${mm}-01`,
    cycleEnd: `${year}-${mm}-${dd}`,
    daysInMonth,
  };
}

/**
 * Normalizes Date or date string to 'YYYY-MM-DD'
 */
export function formatDateIso(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return String(date).split('T')[0];
}
