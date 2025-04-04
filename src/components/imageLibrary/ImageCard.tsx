'use client';

import React from 'react';
import type { StoredImage } from '../../lib/types/image';
import { formatFileSize } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

interface ImageCardProps {
  image: StoredImage;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ImageCard({ image, selected, onSelect, onDelete }: ImageCardProps) {
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
        {selected ? 'Selected' : 'Select'}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" data-variant="destructive">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent role="dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(image.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 