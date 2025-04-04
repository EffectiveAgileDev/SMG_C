import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageGrid } from '../../../components/imageLibrary/ImageGrid';
import { mockImages } from '../../fixtures/imageLibrary';
import { StoredImage } from '../../../lib/types/imageLibrary';

// Mock hasPointerCapture and scrollIntoView
Element.prototype.hasPointerCapture = () => false;
Element.prototype.scrollIntoView = vi.fn();

describe('ImageGrid', () => {
  const defaultProps = {
    images: mockImages,
    selectedImages: new Set<string>(),
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    isDeleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all images', () => {
    render(<ImageGrid {...defaultProps} />);
    const imageCards = screen.getAllByRole('article');
    expect(imageCards).toHaveLength(mockImages.length);
  });

  it('filters images by search query', () => {
    render(<ImageGrid {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search images...');
    fireEvent.change(searchInput, { target: { value: 'test-image-1' } });
    const imageCards = screen.getAllByRole('article');
    expect(imageCards).toHaveLength(1);
  });

  it('sorts images by name when selected', async () => {
    const images = [
      { 
        id: '1', 
        name: 'Zebra', 
        path: 'url1', 
        created_at: new Date().toISOString(),
        size: 1024,
        format: 'image/jpeg',
        width: 800,
        height: 600,
        updated_at: new Date().toISOString()
      },
      { 
        id: '2', 
        name: 'Ant', 
        path: 'url2', 
        created_at: new Date().toISOString(),
        size: 1024,
        format: 'image/jpeg',
        width: 800,
        height: 600,
        updated_at: new Date().toISOString()
      }
    ] as StoredImage[];

    render(
      <ImageGrid 
        images={images} 
        onSelect={vi.fn()} 
        onDelete={vi.fn()} 
        selectedImages={new Set<string>()}
        isDeleting={false}
      />
    );

    // Click the sort button to open the dropdown
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    // Wait for the content to be rendered in the portal and click the "Name" option
    await waitFor(async () => {
      const nameOption = screen.getByRole('option', { name: 'Name' });
      await userEvent.click(nameOption);
    });

    // Wait for the sort to take effect and verify the order
    await waitFor(() => {
      const imageCards = screen.getAllByTestId('image-card');
      expect(imageCards[0].querySelector('.font-medium')).toHaveTextContent('Ant');
      expect(imageCards[1].querySelector('.font-medium')).toHaveTextContent('Zebra');
    }, { timeout: 1000 });
  });

  it('handles image selection', async () => {
    render(<ImageGrid {...defaultProps} />);
    const selectButtons = screen.getAllByRole('button', { name: 'Select Image' });
    await userEvent.click(selectButtons[1]); // Click the second image's select button since mockImages[0] is test-image-2.png

    expect(defaultProps.onSelect).toHaveBeenCalledWith('1'); // test-image-1.jpg has id '1'
  });

  it('handles image deletion', async () => {
    render(<ImageGrid {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteButtons[1]); // Click the second image's delete button

    // Wait for the dialog to appear and click the delete button
    await waitFor(async () => {
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await userEvent.click(deleteButton);
    });

    expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('shows loading state when deleting', () => {
    render(<ImageGrid {...defaultProps} isDeleting={true} />);
    const deleteButtons = screen.getAllByRole('button', { name: 'Deleting...' });
    expect(deleteButtons[0]).toBeDisabled();
  });
}); 