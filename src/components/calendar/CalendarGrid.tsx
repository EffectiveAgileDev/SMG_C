import React from 'react';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import TimeSlot from './TimeSlot';

interface Post {
  id: number;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_for: string;
  platforms: string[];
}

interface CalendarGridProps {
  selectedDate: Date;
  view: 'month' | 'week';
  posts: Post[];
  onSlotClick: (date: Date, hour: number) => void;
  onDrop: (date: Date, hour: number) => void;
  onDragStart: (postId: number) => void;
}

export function CalendarGrid({
  selectedDate,
  view,
  posts,
  onSlotClick,
  onDrop,
  onDragStart
}: CalendarGridProps) {
  const getPostsForSlot = (date: Date, hour: number) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduled_for);
      return (
        postDate.getUTCDate() === date.getDate() &&
        postDate.getUTCMonth() === date.getMonth() &&
        postDate.getUTCFullYear() === date.getFullYear() &&
        postDate.getUTCHours() === hour
      );
    });
  };

  const renderDays = () => {
    const start = view === 'month' ? startOfMonth(selectedDate) : startOfWeek(selectedDate);
    const end = view === 'month' ? endOfMonth(selectedDate) : endOfWeek(selectedDate);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => (
      <div key={format(day, 'yyyy-MM-dd')} className="border border-gray-200">
        <div className="p-2 font-semibold">{format(day, 'MMM d')}</div>
        {Array.from({ length: 24 }, (_, hour) => (
          <TimeSlot
            key={hour}
            date={day}
            hour={hour}
            posts={getPostsForSlot(day, hour)}
            onSlotClick={onSlotClick}
            onDrop={onDrop}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    ));
  };

  return (
    <div role="grid" data-testid={`${view}-view`}>
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
}

export default CalendarGrid; 