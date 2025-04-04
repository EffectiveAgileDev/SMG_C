'use client';

import React from 'react';
import type { StoredImage, ImageGridProps } from '../../lib/types/imageLibrary';
import { ImageCard } from './ImageCard';

export function ImageGrid({ 
  images, 
  onSelect, 
  onDelete, 
  selectedImages = new Set(),
  isDeleting = false
}: ImageGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          selected={selectedImages.has(image.id)}
          onSelect={() => onSelect(image.id)}
          onDelete={() => onDelete(image.id)}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
} 