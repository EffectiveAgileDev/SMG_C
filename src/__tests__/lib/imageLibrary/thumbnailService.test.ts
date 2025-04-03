import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { ThumbnailService } from '../../../lib/imageLibrary/thumbnailService';
import { ThumbnailConfig, ThumbnailResult } from '../../../lib/types/image';

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    toFormat: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image')),
    metadata: vi.fn().mockResolvedValue({
      width: 300,
      height: 300,
      format: 'webp'
    })
  }))
}));

// Mock Supabase client following our standards
const mockStorage = {
  from: vi.fn().mockReturnValue({
    download: vi.fn().mockResolvedValue({ data: null, error: null }),
    upload: vi.fn().mockResolvedValue({ data: null, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } })
  })
};

const mockDatabase = {
  from: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  })
};

const mockSupabaseClient = {
  storage: mockStorage,
  from: mockDatabase.from
} as unknown as SupabaseClient;

describe('Thumbnail Service', () => {
  let thumbnailService: ThumbnailService;
  const defaultConfig: ThumbnailConfig = {
    width: 300,
    height: 300,
    quality: 80,
    format: 'webp'
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    thumbnailService = new ThumbnailService(mockSupabaseClient, defaultConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a thumbnail for a valid image', async () => {
    // Arrange
    const imageId = 'test-image-id';
    const originalPath = 'images/test-image.jpg';
    const expectedThumbnailPath = 'thumbnails/test-image-id.webp';
    const expectedPublicUrl = 'https://example.com/thumbnails/test-image-id.webp';

    // Mock successful image download
    mockStorage.from().download.mockResolvedValue({
      data: Buffer.from('fake-image-data'),
      error: null
    });

    // Mock successful thumbnail upload
    mockStorage.from().upload.mockResolvedValue({
      data: { path: expectedThumbnailPath },
      error: null
    });

    // Mock public URL generation
    mockStorage.from().getPublicUrl.mockReturnValue({
      data: { publicUrl: expectedPublicUrl }
    });

    // Mock database update
    mockDatabase.from().update().eq.mockResolvedValue({
      data: { id: imageId, thumbnail_path: expectedThumbnailPath },
      error: null
    });

    // Act
    const result = await thumbnailService.generateThumbnail(imageId, originalPath);

    // Assert
    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      imageId,
      thumbnailPath: expectedThumbnailPath,
      thumbnailUrl: expectedPublicUrl,
      width: defaultConfig.width,
      height: defaultConfig.height
    });

    // Verify storage operations
    expect(mockStorage.from).toHaveBeenCalledWith('images');
    expect(mockStorage.from().download).toHaveBeenCalledWith(originalPath);
    expect(mockStorage.from().upload).toHaveBeenCalledWith(
      expectedThumbnailPath,
      expect.any(Buffer),
      { contentType: 'image/webp' }
    );

    // Verify database update
    expect(mockDatabase.from).toHaveBeenCalledWith('image_library');
    expect(mockDatabase.from().update).toHaveBeenCalledWith({ thumbnail_path: expectedThumbnailPath });
    expect(mockDatabase.from().update().eq).toHaveBeenCalledWith('id', imageId);
  });

  it('should handle non-existent images', async () => {
    // Arrange
    const imageId = 'non-existent-id';
    const originalPath = 'images/non-existent.jpg';

    // Mock failed image download
    mockStorage.from().download.mockResolvedValue({
      data: null,
      error: { message: 'Image not found', code: 'NOT_FOUND' }
    });

    // Act
    const result = await thumbnailService.generateThumbnail(imageId, originalPath);

    // Assert
    expect(result.error).toEqual({
      message: 'Failed to download original image: Image not found',
      code: 'DOWNLOAD_ERROR'
    });
    expect(result.data).toBeNull();

    // Verify no upload was attempted
    expect(mockStorage.from().upload).not.toHaveBeenCalled();
    expect(mockDatabase.from().update().eq).not.toHaveBeenCalled();
  });

  it('should handle image processing errors', async () => {
    // Arrange
    const imageId = 'test-image-id';
    const originalPath = 'images/corrupt-image.jpg';

    // Mock successful download but corrupt image
    mockStorage.from().download.mockResolvedValue({
      data: Buffer.from('corrupt-data'),
      error: null
    });

    // Act
    const result = await thumbnailService.generateThumbnail(imageId, originalPath);

    // Assert
    expect(result.error).toEqual({
      message: 'Failed to process image',
      code: 'PROCESSING_ERROR'
    });
    expect(result.data).toBeNull();

    // Verify no upload was attempted
    expect(mockStorage.from().upload).not.toHaveBeenCalled();
    expect(mockDatabase.from().update().eq).not.toHaveBeenCalled();
  });

  it('should maintain aspect ratio when generating thumbnails', async () => {
    // Arrange
    const imageId = 'test-image-id';
    const originalPath = 'images/wide-image.jpg';

    // Mock successful image download
    mockStorage.from().download.mockResolvedValue({
      data: Buffer.from('fake-wide-image-data'),
      error: null
    });

    // Mock successful upload
    mockStorage.from().upload.mockResolvedValue({
      data: { path: 'thumbnails/wide-image.webp' },
      error: null
    });

    // Mock database update
    mockDatabase.from().update().eq.mockResolvedValue({
      data: { id: imageId, thumbnail_path: 'thumbnails/wide-image.webp' },
      error: null
    });

    // Act
    const result = await thumbnailService.generateThumbnail(imageId, originalPath, {
      ...defaultConfig,
      maintainAspectRatio: true
    });

    // Assert
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.width).toBeLessThanOrEqual(defaultConfig.width);
      expect(result.data.height).toBeLessThanOrEqual(defaultConfig.height);
    }
  });
}); 