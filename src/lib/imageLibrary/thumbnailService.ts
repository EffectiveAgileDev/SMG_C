import { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { ThumbnailConfig, ThumbnailResult, ThumbnailErrorCode } from '../types/image';

export class ThumbnailService {
  private readonly supabase: SupabaseClient;
  private readonly config: ThumbnailConfig;

  constructor(supabaseClient: SupabaseClient, config: ThumbnailConfig) {
    this.supabase = supabaseClient;
    this.config = config;
  }

  async generateThumbnail(
    imageId: string,
    originalPath: string,
    config?: Partial<ThumbnailConfig>
  ): Promise<ThumbnailResult> {
    const finalConfig = { ...this.config, ...config };

    try {
      // Download original image
      const { data: imageData, error: downloadError } = await this.supabase
        .storage
        .from('images')
        .download(originalPath);

      if (downloadError || !imageData) {
        return {
          data: null,
          error: {
            message: `Failed to download original image: ${downloadError?.message || 'Image not found'}`,
            code: ThumbnailErrorCode.DOWNLOAD_ERROR
          }
        };
      }

      // Convert Blob to Buffer
      const imageBuffer = Buffer.from(await imageData.arrayBuffer());

      // Process image with sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(finalConfig.width, finalConfig.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(finalConfig.format, { quality: finalConfig.quality })
        .toBuffer();

      // Generate thumbnail path
      const thumbnailPath = `thumbnails/${imageId}.${finalConfig.format}`;

      // Upload thumbnail
      const { error: uploadError } = await this.supabase
        .storage
        .from('images')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: `image/${finalConfig.format}`
        });

      if (uploadError) {
        return {
          data: null,
          error: {
            message: 'Failed to upload thumbnail',
            code: ThumbnailErrorCode.UPLOAD_ERROR
          }
        };
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase
        .storage
        .from('images')
        .getPublicUrl(thumbnailPath);

      // Update image record with thumbnail path
      const { error: updateError } = await this.supabase
        .from('image_library')
        .update({ thumbnail_path: thumbnailPath })
        .eq('id', imageId);

      if (updateError) {
        // Clean up uploaded thumbnail if database update fails
        await this.supabase
          .storage
          .from('images')
          .remove([thumbnailPath]);

        return {
          data: null,
          error: {
            message: 'Failed to update image record',
            code: ThumbnailErrorCode.UPDATE_ERROR
          }
        };
      }

      return {
        data: {
          imageId,
          thumbnailPath,
          thumbnailUrl: publicUrl,
          width: finalConfig.width,
          height: finalConfig.height
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: 'Failed to process image',
          code: ThumbnailErrorCode.PROCESSING_ERROR
        }
      };
    }
  }
} 