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

export interface StoredImage extends ImageMetadata {
  id: string;
  user_id: string;
  storage_path: string;
  url: string;
  content_type: string;
  file_name: string;
  created_at: string;
  updated_at: string;
} 