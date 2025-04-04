'use client';

import React from 'react';
import { StoredImage } from '@/lib/types/image';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
  images: StoredImage[];
  onSelect?: (image: StoredImage) => void;
  onDelete?: (image: StoredImage) => void;
  selectedImages?: Set<string>;
}

export function ImageGrid({ 
  images, 
  onSelect, 
  onDelete, 
  selectedImages = new Set() 
}: ImageGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onSelect={onSelect}
          onDelete={onDelete}
          selected={selectedImages.has(image.id)}
        />
      ))}
    </div>
  );
} 