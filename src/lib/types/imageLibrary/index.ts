// Image Types
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ImageImportResult {
  success: boolean;
  error?: string;
  metadata?: ImageMetadata;
}

export interface StoredImage {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
  size: number;
  format: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  category?: string;
}

// Component Props Types
export interface ImageCardProps {
  image: StoredImage;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export interface ImageGalleryProps {
  images: StoredImage[];
  onDeleteImages: (imageIds: string[]) => Promise<void> | void;
}

export interface ImageGridProps {
  images: StoredImage[];
  selectedImages: Set<string>;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading?: boolean;
}

// Database Types
export interface ImageLibraryEntry {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
  size: number;
  format: string;
  content_hash: string;
  tags: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}

// Utility Types
export interface ImageImportError {
  file: File;
  error: string;
}

// Sort Options
export type SortOption = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'; 