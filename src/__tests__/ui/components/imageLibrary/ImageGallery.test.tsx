import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ImageGallery } from '../../../../components/imageLibrary/ImageGallery';
import { mockImages, mockHandlers } from '../../../fixtures/imageLibrary';

describe('UI Components', () => {
  describe('ImageLibrary', () => {
    describe('ImageGallery', () => {
      describe('Basic Rendering', () => {
        it('should render grid layout with images', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          expect(screen.getByTestId('image-gallery-grid')).toBeInTheDocument();
          expect(screen.getAllByTestId('image-card')).toHaveLength(2);
        });

        it('should render empty state when no images', () => {
          render(
            <ImageGallery
              images={[]}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          expect(screen.getByText(/no images found/i)).toBeInTheDocument();
        });

        it('should render sorting controls', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
        });

        it('should render filtering controls', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          expect(screen.getByRole('textbox', { name: /filter images/i })).toBeInTheDocument();
        });
      });

      describe('Sorting Functionality', () => {
        it('should sort images by name ascending', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
          fireEvent.change(sortSelect, { target: { value: 'name_asc' } });

          const imageCards = screen.getAllByTestId('image-card');
          expect(imageCards[0]).toHaveTextContent('test-image-1.jpg');
          expect(imageCards[1]).toHaveTextContent('test-image-2.png');
        });

        it('should sort images by date descending', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
          fireEvent.click(sortSelect);
          const dateDescOption = screen.getByRole('option', { name: /date \(newest first\)/i });
          fireEvent.click(dateDescOption);

          const imageCards = screen.getAllByTestId('image-card');
          const firstCard = imageCards[0];
          const secondCard = imageCards[1];
          expect(firstCard).toHaveTextContent('test-image-2.png');
          expect(secondCard).toHaveTextContent('test-image-1.jpg');
        });
      });

      describe('Filtering Functionality', () => {
        it('should filter images by name', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          const filterInput = screen.getByRole('textbox', { name: /filter images/i });
          fireEvent.change(filterInput, { target: { value: 'png' } });

          expect(screen.getAllByTestId('image-card')).toHaveLength(1);
          expect(screen.getByText('test-image-2.png')).toBeInTheDocument();
        });

        it('should show no results message when filter matches nothing', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          const filterInput = screen.getByRole('textbox', { name: /filter images/i });
          fireEvent.change(filterInput, { target: { value: 'nonexistent' } });

          expect(screen.getByText(/no images match your filter/i)).toBeInTheDocument();
        });
      });

      describe('Batch Selection', () => {
        it('should allow selecting multiple images', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          const selectButtons = screen.getAllByRole('button', { name: /select image/i });
          fireEvent.click(selectButtons[0]);
          fireEvent.click(selectButtons[1]);

          expect(screen.getAllByRole('button', { name: /^selected$/i })).toHaveLength(2);
        });

        it('should show batch actions when images are selected', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          const selectButton = screen.getAllByRole('button', { name: /select image/i })[0];
          fireEvent.click(selectButton);

          expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
        });
      });

      describe('Batch Delete', () => {
        it('should call onDeleteImages with selected image ids', async () => {
          const handleDelete = vi.fn();
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={handleDelete}
            />
          );

          // Select both images
          const selectButtons = screen.getAllByRole('button', { name: /select image/i });
          fireEvent.click(selectButtons[0]);
          fireEvent.click(selectButtons[1]);

          // Click batch delete
          fireEvent.click(screen.getByRole('button', { name: /delete selected/i }));
          
          // Confirm deletion
          fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

          expect(handleDelete).toHaveBeenCalledWith(['1', '2']);
        });

        it('should show confirmation dialog for batch delete', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={mockHandlers.onDeleteImages}
            />
          );

          // Select an image
          const selectButton = screen.getAllByRole('button', { name: /select image/i })[0];
          fireEvent.click(selectButton);

          // Click batch delete
          fireEvent.click(screen.getByRole('button', { name: /delete selected/i }));

          expect(screen.getByRole('dialog')).toBeInTheDocument();
          expect(screen.getByRole('heading', { name: /delete selected images/i })).toBeInTheDocument();
          expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
        });
      });

      describe('Loading States', () => {
        it('should show loading state while deleting', () => {
          render(
            <ImageGallery
              images={mockImages}
              onDeleteImages={() => new Promise(() => {})}
            />
          );

          // Select an image and trigger delete
          const selectButton = screen.getAllByRole('button', { name: /select image/i })[0];
          fireEvent.click(selectButton);
          fireEvent.click(screen.getByRole('button', { name: /delete selected/i }));
          fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

          expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
        });
      });
    });
  });
}); 