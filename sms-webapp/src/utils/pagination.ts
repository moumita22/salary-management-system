export type PageItem = number | 'dots-start' | 'dots-end';

/**
 * Calculates the visible page numbers and ellipsis tokens for pagination.
 * Maintains a stable, compact set of buttons (at most 7 items):
 * - If totalPages <= 7: shows all pages [1, 2, ..., totalPages]
 * - If near start: [1, 2, 3, 4, 5, '...', totalPages]
 * - If near end: [1, '...', N-4, N-3, N-2, N-1, N]
 * - If in middle: [1, '...', C-1, C, C+1, '...', N]
 */
export function getVisiblePages(currentPage: number, totalPages: number): PageItem[] {
  const safeTotal = Math.max(1, totalPages);
  const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, i) => i + 1);
  }

  const showLeftDots = safeCurrent > 4;
  const showRightDots = safeCurrent < safeTotal - 3;

  if (!showLeftDots && showRightDots) {
    return [1, 2, 3, 4, 5, 'dots-end', safeTotal];
  }

  if (showLeftDots && !showRightDots) {
    return [
      1,
      'dots-start',
      safeTotal - 4,
      safeTotal - 3,
      safeTotal - 2,
      safeTotal - 1,
      safeTotal,
    ];
  }

  return [1, 'dots-start', safeCurrent - 1, safeCurrent, safeCurrent + 1, 'dots-end', safeTotal];
}
