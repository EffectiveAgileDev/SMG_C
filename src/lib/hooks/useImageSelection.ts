import { useState, useCallback } from 'react';

export interface UseImageSelectionOptions {
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function useImageSelection(options: UseImageSelectionOptions = {}) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const handleSelect = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      options.onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [options.onSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedImages(new Set());
    options.onSelectionChange?.(new Set());
  }, [options.onSelectionChange]);

  const selectAll = useCallback((imageIds: string[]) => {
    const newSelection = new Set(imageIds);
    setSelectedImages(newSelection);
    options.onSelectionChange?.(newSelection);
  }, [options.onSelectionChange]);

  return {
    selectedImages,
    handleSelect,
    clearSelection,
    selectAll,
  };
} 