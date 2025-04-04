'use client';

import React from 'react';
import type { StoredImage } from '../../lib/types/image';
import { formatFileSize } from '../../lib/utils';
import { Button } from '../ui/button';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

interface ImageCardProps {
  image: StoredImage;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ImageCard({ image, selected, onSelect, onDelete, isDeleting = false }: ImageCardProps) {
  const handleSelect = () => {
    if (!selected) {
      onSelect(image.id);
    }
  };

  return (
    <div 
      data-testid="image-card"
      className={selected ? 'selected' : ''}
    >
      <div>{image.name}</div>
      <div>{formatFileSize(image.size)}</div>
      <div>{`${image.width} × ${image.height}`}</div>
      <Button
        onClick={handleSelect}
        variant={selected ? "secondary" : "default"}
        className={selected ? 'active' : ''}
        aria-pressed={selected}
      >
        {selected ? 'Selected' : 'Select Image'}
      </Button>
      <ConfirmationDialog
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        onConfirm={() => onDelete(image.id)}
        isLoading={isDeleting}
        trigger={
          <Button variant="destructive" data-variant="destructive" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </div>
  );
} 