import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { ImageImportService } from '../../../lib/imageLibrary/imageImport';
import { ImageMetadata } from '../../../lib/types/image';

// Mock Supabase client
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: vi.fn(),
  eq: vi.fn()
});

const mockSupabaseClient = {
  storage: {
    from: vi.fn().mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: vi.fn().mockResolvedValue({ data: true, error: null })
    })
  },
  from: mockFrom
} as unknown as SupabaseClient;

describe('Image Import Service', () => {
  let imageImportService: ImageImportService;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    imageImportService = new ImageImportService(mockSupabaseClient);

    // Reset mock implementations
    mockSelect.mockReturnThis();
    mockSingle.mockImplementation(() => ({
      data: { id: 'test-image-id' },
      error: null
    }));
    mockSelect.mockImplementation(() => ({ single: mockSingle }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully import an image with metadata', async () => {
    // Arrange
    const testImage = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    const userId = 'test-user-id';
    const metadata: Partial<ImageMetadata> = {
      title: 'Test Image',
      description: 'A test image for import',
      tags: ['test', 'import'],
      platformCompatibility: ['twitter', 'instagram']
    };

    const expectedStoragePath = `${userId}/images/${testImage.name}`;
    const expectedPublicUrl = `https://example.com/storage/v1/object/public/${expectedStoragePath}`;

    // Mock storage upload
    mockUpload.mockResolvedValue({
      data: { path: expectedStoragePath },
      error: null
    });

    // Mock public URL generation
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: expectedPublicUrl }
    });

    // Mock database insert
    mockSingle.mockResolvedValue({
      data: {
        id: 'test-image-id',
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        platform_compatibility: metadata.platformCompatibility
      },
      error: null
    });

    // Act
    const result = await imageImportService.importImage(testImage, userId, metadata);

    // Assert
    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      id: 'test-image-id',
      url: expectedPublicUrl,
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      platformCompatibility: metadata.platformCompatibility
    });

    // Verify storage operations
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('images');
    expect(mockUpload).toHaveBeenCalledWith(
      expectedStoragePath,
      testImage,
      { contentType: 'image/jpeg' }
    );

    // Verify database operations
    expect(mockFrom).toHaveBeenCalledWith('image_library');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      storage_path: expectedStoragePath,
      url: expectedPublicUrl,
      content_type: 'image/jpeg',
      file_name: 'test.jpg',
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      platform_compatibility: metadata.platformCompatibility
    });
  });

  it('should validate image file type', async () => {
    // Arrange
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const userId = 'test-user-id';

    // Act
    const result = await imageImportService.importImage(invalidFile, userId, {});

    // Assert
    expect(result.error).toEqual({
      message: 'Invalid file type. Only images are allowed.',
      code: 'INVALID_FILE_TYPE'
    });
    expect(result.data).toBeNull();

    // Verify no storage operations were performed
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should handle storage upload failures', async () => {
    // Arrange
    const testImage = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    const userId = 'test-user-id';

    // Mock storage upload failure
    mockUpload.mockResolvedValue({
      data: null,
      error: { message: 'Storage error', code: 'STORAGE_ERROR' }
    });

    // Act
    const result = await imageImportService.importImage(testImage, userId, {});

    // Assert
    expect(result.error).toEqual({
      message: 'Failed to upload image to storage',
      code: 'STORAGE_ERROR'
    });
    expect(result.data).toBeNull();

    // Verify no database operations were performed
    expect(mockInsert).not.toHaveBeenCalled();
  });
}); 