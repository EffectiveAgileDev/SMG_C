'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { ImageImportService } from '@/lib/imageLibrary/imageImport';
import { StoredImage } from '@/lib/types/image';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUploadComplete: (image: StoredImage) => void;
  onUploadError: (error: string) => void;
  userId: string;
}

export function ImageUpload({ onUploadComplete, onUploadError, userId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const imageImportService = new ImageImportService();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        const result = await imageImportService.importImage(file, userId, {});
        if (result.error) {
          onUploadError(result.error.message);
        } else if (result.data) {
          onUploadComplete(result.data as StoredImage);
        }
      }
    } catch (error) {
      onUploadError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [imageImportService, onUploadComplete, onUploadError, userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
        isUploading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl">📸</div>
        {isDragActive ? (
          <p>Drop the images here...</p>
        ) : (
          <>
            <p>Drag and drop images here, or click to select files</p>
            <p className="text-sm text-muted-foreground">
              Supports: JPG, PNG, GIF, WebP (max 10MB)
            </p>
          </>
        )}
        {isUploading && <p>Uploading...</p>}
      </div>
    </div>
  );
} 