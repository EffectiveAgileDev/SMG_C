export type PlatformType = 'twitter' | 'instagram' | 'facebook' | 'linkedin';

export interface ImageMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  platformCompatibility?: PlatformType[];
  contentHash?: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

export interface ImageImportResult {
  data: {
    id: string;
    url: string;
    title?: string;
    description?: string;
    tags?: string[];
    platformCompatibility?: PlatformType[];
  } | null;
  error: {
    message: string;
    code: string;
  } | null;
}

export interface StoredImage {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

export interface ThumbnailResult {
  data: {
    imageId: string;
    thumbnailPath: string;
    thumbnailUrl: string;
    width: number;
    height: number;
  } | null;
  error: {
    message: string;
    code: string;
  } | null;
}

export enum ThumbnailErrorCode {
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  UPDATE_ERROR = 'UPDATE_ERROR'
} 