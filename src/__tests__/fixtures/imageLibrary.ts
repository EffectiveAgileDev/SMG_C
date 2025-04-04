import type { StoredImage } from '../../lib/types/imageLibrary';

// Mock image data
export const mockImages: StoredImage[] = [
  {
    id: '1',
    name: 'test-image-1.jpg',
    path: '/images/test1.jpg',
    size: 1024,
    format: 'image/jpeg',
    width: 800,
    height: 600,
    created_at: '2024-04-01T10:00:00Z',
    updated_at: '2024-04-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'test-image-2.png',
    path: '/images/test2.png',
    size: 2048,
    format: 'image/png',
    width: 1024,
    height: 768,
    created_at: '2024-04-02T10:00:00Z',
    updated_at: '2024-04-02T10:00:00Z'
  }
];

// Helper function to create a mock image with custom properties
export function createMockImage(overrides: Partial<StoredImage> = {}): StoredImage {
  return {
    id: 'mock-id',
    name: 'mock-image.jpg',
    path: '/images/mock.jpg',
    size: 1024,
    format: 'image/jpeg',
    width: 800,
    height: 600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

// Common test handlers
export const mockHandlers = {
  onSelect: () => {},
  onDelete: () => {},
  onDeleteImages: () => {}
}; 