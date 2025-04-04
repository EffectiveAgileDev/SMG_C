'use client';

import React from 'react';
import type { StoredImage, ImageCardProps } from '../../lib/types/imageLibrary';
import { formatFileSize } from '../../lib/utils';
import { Button } from '../ui/button';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

export function ImageCard({ image, selected, onSelect, onDelete, isDeleting = false }: ImageCardProps) {
  const handleSelect = () => {
    if (!selected) {
      onSelect(image.id);
    }
  };

  return (
    <div 
      className={`relative p-4 rounded-lg border ${selected ? 'border-2 border-primary' : 'border-gray-200'}`}
      data-testid="image-card"
      role="article"
    >
      <div className="font-medium mb-2">{image.name}</div>
      <div className="text-sm text-gray-500 space-y-1">
        <div>{formatFileSize(image.size)}</div>
        <div>{`${image.width} × ${image.height}`}</div>
      </div>
      <div className="mt-4 space-x-2">
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
    </div>
  );
} 