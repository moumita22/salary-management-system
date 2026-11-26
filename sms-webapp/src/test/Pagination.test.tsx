import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Pagination from '../components/Pagination';
import { getVisiblePages } from '../utils/pagination';

describe('Pagination Unit Tests & visible page generator', () => {
  describe('getVisiblePages algorithm', () => {
    it('returns single page when totalPages <= 1', () => {
      expect(getVisiblePages(1, 1)).toEqual([1]);
      expect(getVisiblePages(1, 0)).toEqual([1]);
    });

    it('returns all pages sequentially when totalPages <= 7', () => {
      expect(getVisiblePages(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getVisiblePages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('shows start window with trailing ellipsis when near the beginning (totalPages = 100)', () => {
      // 1, 2, 3, 4, 5, 'dots-end', 100
      expect(getVisiblePages(1, 100)).toEqual([1, 2, 3, 4, 5, 'dots-end', 100]);
      expect(getVisiblePages(4, 100)).toEqual([1, 2, 3, 4, 5, 'dots-end', 100]);
    });

    it('shows end window with leading ellipsis when near the end (totalPages = 100)', () => {
      // 1, 'dots-start', 96, 97, 98, 99, 100
      expect(getVisiblePages(100, 100)).toEqual([1, 'dots-start', 96, 97, 98, 99, 100]);
      expect(getVisiblePages(97, 100)).toEqual([1, 'dots-start', 96, 97, 98, 99, 100]);
    });

    it('shows both ellipses and current page window when in the middle (totalPages = 100)', () => {
      // 1, 'dots-start', 49, 50, 51, 'dots-end', 100
      expect(getVisiblePages(50, 100)).toEqual([1, 'dots-start', 49, 50, 51, 'dots-end', 100]);
    });
  });

  describe('Pagination Component Interactions', () => {
    it('renders visible page numbers and highlights current page', () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={100}
          totalItems={2500}
          pageSize={25}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />,
      );

      // Should display page buttons: 1, 2, 3, 4, 5, 100
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 100' })).toBeInTheDocument();

      // Page 1 should be marked aria-current="page"
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'Page 2' })).not.toHaveAttribute('aria-current');

      // Click on page 3 button
      fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
      expect(onPageChange).toHaveBeenCalledWith(3);

      // Click on page 100 button
      fireEvent.click(screen.getByRole('button', { name: 'Page 100' }));
      expect(onPageChange).toHaveBeenCalledWith(100);
    });

    it('navigates with previous and next buttons correctly', () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();

      const { rerender } = render(
        <Pagination
          currentPage={1}
          totalPages={10}
          totalItems={250}
          pageSize={25}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />,
      );

      // Previous button should be disabled on page 1
      const prevButton = screen.getByRole('button', { name: 'Previous Page' });
      expect(prevButton).toBeDisabled();

      // Next button should be enabled
      const nextButton = screen.getByRole('button', { name: 'Next Page' });
      expect(nextButton).toBeEnabled();
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(2);

      // Rerender at last page
      rerender(
        <Pagination
          currentPage={10}
          totalPages={10}
          totalItems={250}
          pageSize={25}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />,
      );

      expect(screen.getByRole('button', { name: 'Next Page' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Previous Page' })).toBeEnabled();
      fireEvent.click(screen.getByRole('button', { name: 'Previous Page' }));
      expect(onPageChange).toHaveBeenCalledWith(9);
    });

    it('allows changing rows per page', () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={10}
          totalItems={250}
          pageSize={25}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />,
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '50' } });
      expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });
  });
});
