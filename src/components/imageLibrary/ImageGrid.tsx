'use client';

import React, { useMemo, useState } from 'react';
import type { StoredImage, ImageGridProps } from '../../lib/types/imageLibrary';
import { ImageCard } from './ImageCard';
import { useImageSelection } from '../../lib/hooks/useImageSelection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

type SortOption = 'newest' | 'oldest' | 'name';

export function ImageGrid({ 
  images, 
  onSelect, 
  onDelete, 
  selectedImages: externalSelectedImages = new Set(),
  isDeleting = false
}: ImageGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedImages, handleSelect, clearSelection, selectAll } = useImageSelection({
    onSelectionChange: (newSelection) => {
      onSelect(Array.from(newSelection)[newSelection.size - 1]); // Pass the last selected image id
    }
  });

  const filteredAndSortedImages = useMemo(() => {
    let result = [...images];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(img => 
        img.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        default:
          return 0;
      }
    });

    return result;
  }, [images, sortBy, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Search images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredAndSortedImages.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            selected={selectedImages.has(image.id)}
            onSelect={() => handleSelect(image.id)}
            onDelete={() => onDelete(image.id)}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </div>
  );
} 