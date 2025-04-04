'use client';

import React from 'react';
import type { StoredImage } from '../../lib/types/image';
import { formatFileSize } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface ImageCardProps {
  image: StoredImage;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ImageCard({ image, selected, onSelect, onDelete, isDeleting = false }: ImageCardProps) {
  const handleSelect = () => {
    onSelect(image.id);
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
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" data-variant="destructive">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => onDelete(image.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 