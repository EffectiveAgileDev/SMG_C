import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ImageCard } from '../../../../components/imageLibrary/ImageCard';
import type { StoredImage } from '../../../../lib/types/imageLibrary';

describe('UI Components', () => {
  describe('ImageLibrary', () => {
    describe('ImageCard', () => {
      // Test data setup
      const mockImage: StoredImage = {
        id: '1',
        name: 'test-image.jpg',
        path: '/images/test-image.jpg',
        size: 1024,
        format: 'image/jpeg',
        width: 800,
        height: 600,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      describe('Basic Rendering', () => {
        it('should render image name', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          );
      
          expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
        });

        it('should render image size', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          );
      
          expect(screen.getByText('1 KB')).toBeInTheDocument();
        });

        it('should render image dimensions', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          );
      
          expect(screen.getByText('800 × 600')).toBeInTheDocument();
        });

        it('should show selected state when selected', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={true}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          );
      
          expect(screen.getByTestId('image-card')).toHaveClass('selected');
        });
      });

      describe('Selection Handling', () => {
        it('should call onSelect with image id when select button is clicked', () => {
          const handleSelect = vi.fn();
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={handleSelect}
              onDelete={() => {}}
            />
          );

          fireEvent.click(screen.getByRole('button', { name: /select/i }));
          expect(handleSelect).toHaveBeenCalledWith(mockImage.id);
        });

        it('should show selected button as active when selected', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={true}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          );

          const selectButton = screen.getByRole('button', { name: /selected/i });
          expect(selectButton).toHaveClass('active');
        });

        it('should not call onSelect when already selected', () => {
          const handleSelect = vi.fn();
          render(
            <ImageCard
              image={mockImage}
              selected={true}
              onSelect={handleSelect}
              onDelete={() => {}}
            />
          );

          fireEvent.click(screen.getByRole('button', { name: /selected/i }));
          expect(handleSelect).not.toHaveBeenCalled();
        });
      });

      describe('Delete Handling', () => {
        it('should call onDelete with image id when delete button is clicked', async () => {
          const handleDelete = vi.fn();
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={handleDelete}
            />
          );

          // Click the delete button to open the dialog
          fireEvent.click(screen.getByRole('button', { name: /delete/i }));
          
          // Click the confirm delete button in the dialog
          fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
          
          expect(handleDelete).toHaveBeenCalledWith(mockImage.id);
        });

        it('should show delete button with destructive variant', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          );

          const deleteButton = screen.getByRole('button', { name: /delete/i });
          expect(deleteButton).toHaveAttribute('data-variant', 'destructive');
        });

        it('should show delete confirmation dialog when clicked', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {}}
            />
          );

          fireEvent.click(screen.getByRole('button', { name: /delete/i }));
          expect(screen.getByRole('dialog')).toBeInTheDocument();
          expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
        });
      });

      describe('Loading States', () => {
        it('should show loading state in delete button when deleting', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {}}
              isDeleting={true}
            />
          );

          expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
        });

        it('should disable delete button when in loading state', () => {
          render(
            <ImageCard
              image={mockImage}
              selected={false}
              onSelect={() => {}}
              onDelete={() => {}}
              isDeleting={true}
            />
          );

          const deleteButton = screen.getByRole('button', { name: /deleting/i });
          expect(deleteButton).toBeDisabled();
        });
      });
    });
  });
}); 