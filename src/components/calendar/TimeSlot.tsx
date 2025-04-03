import React from 'react';
import { format } from 'date-fns';

interface TimeSlotProps {
  date: Date;
  hour: number;
  posts: Array<{
    id: number;
    content: string;
    status: 'draft' | 'scheduled' | 'published';
    platforms: string[];
  }>;
  onSlotClick: (date: Date, hour: number) => void;
  onDrop: (date: Date, hour: number) => void;
  onDragStart: (postId: number) => void;
}

interface PlatformIconProps {
  platform: string;
}

const PlatformIcon = ({ platform }: PlatformIconProps) => {
  return (
    <div
      data-testid={`platform-icon-${platform.toLowerCase()}`}
      className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs"
      title={platform}
    >
      {platform[0].toUpperCase()}
    </div>
  );
};

export default function TimeSlot({ date, hour, posts, onSlotClick, onDrop, onDragStart }: TimeSlotProps) {
  const slotId = `calendar-slot-${format(date, 'yyyy-MM-dd')}-${hour.toString().padStart(2, '0')}`;

  return (
    <div
      data-testid={slotId}
      className="h-12 border-t border-gray-200 cursor-pointer hover:bg-gray-50 relative"
      onClick={() => onSlotClick(date, hour)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(date, hour)}
    >
      <div className="flex items-center justify-between p-1">
        <span>{hour}:00</span>
        {posts.map(post => (
          <div
            key={post.id}
            data-testid={`post-${post.id}`}
            draggable
            onDragStart={() => onDragStart(post.id)}
            className="flex items-center space-x-1"
          >
            <div className="flex -space-x-1">
              {post.platforms.map(platform => (
                <PlatformIcon key={platform} platform={platform} />
              ))}
            </div>
            <div
              data-testid={`post-${post.id}-status`}
              data-status={post.status}
              className={`px-2 py-1 rounded text-xs ${
                post.status === 'published' ? 'bg-green-100 text-green-800' :
                post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {post.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 