import React, { useState, useMemo } from 'react';
import type { StoredImage } from '../../lib/types/image';
import { ImageCard } from './ImageCard';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

type SortOption = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';

interface ImageGalleryProps {
  images: StoredImage[];
  onDeleteImages: (imageIds: string[]) => Promise<void> | void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onDeleteImages }) => {
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedAndFilteredImages = useMemo(() => {
    let result = [...images];

    // Apply filter
    if (filterText) {
      result = result.filter(image => 
        image.name.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [images, filterText, sortBy]);

  const handleSelect = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return;
    setIsDeleting(true);
    try {
      await onDeleteImages(Array.from(selectedImages));
      setSelectedImages(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <Input
          type="text"
          placeholder="Filter images..."
          aria-label="Filter images"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <Select
          value={sortBy}
          onValueChange={(value: SortOption) => setSortBy(value)}
        >
          <SelectTrigger aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="date_asc">Date (Oldest first)</SelectItem>
            <SelectItem value="date_desc">Date (Newest first)</SelectItem>
          </SelectContent>
        </Select>
        {selectedImages.size > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Selected</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Selected Images</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {selectedImages.size} selected images? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleBatchDelete} 
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        data-testid="image-gallery-grid"
      >
        {sortedAndFilteredImages.length === 0 && images.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">
            No images found
          </div>
        ) : sortedAndFilteredImages.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">
            No images match your filter
          </div>
        ) : (
          sortedAndFilteredImages.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              selected={selectedImages.has(image.id)}
              onSelect={() => handleSelect(image.id)}
              onDelete={async () => {
                setIsDeleting(true);
                try {
                  await onDeleteImages([image.id]);
                } finally {
                  setIsDeleting(false);
                }
              }}
              isDeleting={isDeleting}
            />
          ))
        )}
      </div>
    </div>
  );
}; 