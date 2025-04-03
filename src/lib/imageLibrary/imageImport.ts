import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { ImageMetadata, ImageImportResult } from '../types/image';

export enum ImageImportErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE'
}

interface ImageImportError {
  message: string;
  code: ImageImportErrorCode;
}

interface StorageConfig {
  bucket: string;
  maxSizeBytes: number;
  allowedTypes: string[];
  pathPrefix: string;
}

export class ImageImportService {
  private readonly supabase: SupabaseClient;
  private readonly config: StorageConfig;

  constructor(
    supabaseClient: SupabaseClient,
    config: Partial<StorageConfig> = {}
  ) {
    this.supabase = supabaseClient;
    this.config = {
      bucket: 'images',
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      pathPrefix: 'images',
      ...config
    };
  }

  async importImage(
    file: File,
    userId: string,
    metadata: Partial<ImageMetadata>
  ): Promise<ImageImportResult> {
    // Validate file
    const validationError = this.validateFile(file);
    if (validationError) {
      return this.createErrorResponse(validationError);
    }

    // Upload to storage
    const uploadResult = await this.uploadToStorage(file, userId);
    if (uploadResult.error) {
      return this.createErrorResponse(uploadResult.error);
    }

    // Get public URL
    const publicUrl = this.getPublicUrl(uploadResult.storagePath);

    // Save to database
    const { data: dbData, error: dbError } = await this.saveToDatabase(
      file,
      userId,
      uploadResult.storagePath,
      publicUrl,
      metadata
    );

    if (dbError) {
      // Clean up uploaded file on database error
      await this.cleanupStorage(uploadResult.storagePath);
      return this.createErrorResponse({
        message: 'Failed to save image metadata',
        code: ImageImportErrorCode.DATABASE_ERROR
      });
    }

    return {
      data: {
        id: dbData.id,
        url: publicUrl,
        title: dbData.title,
        description: dbData.description,
        tags: dbData.tags,
        platformCompatibility: dbData.platform_compatibility
      },
      error: null
    };
  }

  private validateFile(file: File): ImageImportError | null {
    if (!this.config.allowedTypes.includes(file.type)) {
      return {
        message: 'Invalid file type. Only images are allowed.',
        code: ImageImportErrorCode.INVALID_FILE_TYPE
      };
    }

    if (file.size > this.config.maxSizeBytes) {
      return {
        message: `File too large. Maximum size is ${this.config.maxSizeBytes / 1024 / 1024}MB`,
        code: ImageImportErrorCode.FILE_TOO_LARGE
      };
    }

    return null;
  }

  private async uploadToStorage(
    file: File,
    userId: string
  ): Promise<{ storagePath: string; error: ImageImportError | null }> {
    const storagePath = this.generateStoragePath(file.name, userId);
    const { data, error } = await this.supabase
      .storage
      .from(this.config.bucket)
      .upload(storagePath, file, {
        contentType: file.type
      });

    if (error) {
      return {
        storagePath,
        error: {
          message: 'Failed to upload image to storage',
          code: ImageImportErrorCode.STORAGE_ERROR
        }
      };
    }

    return { storagePath: data.path, error: null };
  }

  private getPublicUrl(storagePath: string): string {
    return this.supabase
      .storage
      .from(this.config.bucket)
      .getPublicUrl(storagePath)
      .data
      .publicUrl;
  }

  private async saveToDatabase(
    file: File,
    userId: string,
    storagePath: string,
    publicUrl: string,
    metadata: Partial<ImageMetadata>
  ) {
    return await this.supabase
      .from('image_library')
      .insert({
        user_id: userId,
        storage_path: storagePath,
        url: publicUrl,
        content_type: file.type,
        file_name: file.name,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        platform_compatibility: metadata.platformCompatibility
      })
      .select()
      .single();
  }

  private async cleanupStorage(storagePath: string): Promise<void> {
    await this.supabase
      .storage
      .from(this.config.bucket)
      .remove([storagePath]);
  }

  private generateStoragePath(fileName: string, userId: string): string {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}/${this.config.pathPrefix}/${sanitizedFileName}`;
  }

  private createErrorResponse(error: ImageImportError): ImageImportResult {
    return {
      data: null,
      error
    };
  }
} 