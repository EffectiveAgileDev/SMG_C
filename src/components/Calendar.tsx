import React, { useState } from 'react';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { isPlatformConnected } from '../utils/platforms';
import PlatformDialog from './calendar/PlatformDialog';
import PlatformStatus from './calendar/PlatformStatus';
import PostDialog from './calendar/PostDialog';
import TimeSlot from './calendar/TimeSlot';

interface CalendarProps {
  initialPosts?: Array<{
    id: number;
    content: string;
    status: 'draft' | 'scheduled' | 'published';
    scheduled_for: string;
    platforms: string[];
  }>;
  initialDate?: Date;
}

interface NewPost {
  content: string;
  platforms: string[];
  scheduled_for: string;
}

export default function Calendar({ initialPosts = [], initialDate = new Date(2024, 3, 1) }: CalendarProps) {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showDialog, setShowDialog] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [platformToConnect, setPlatformToConnect] = useState<string | null>(null);
  const [newPost, setNewPost] = useState<NewPost>({
    content: '',
    platforms: [],
    scheduled_for: '',
  });
  const [posts, setPosts] = useState(initialPosts);
  const [draggedPostId, setDraggedPostId] = useState<number | null>(null);

  const handleNextMonth = () => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate.getTime());
      const currentMonth = newDate.getMonth();
      const currentYear = newDate.getFullYear();
      newDate.setFullYear(currentYear, currentMonth + 1, 1);
      return newDate;
    });
  };

  const handlePrevMonth = () => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate.getTime());
      const currentMonth = newDate.getMonth();
      const currentYear = newDate.getFullYear();
      newDate.setFullYear(currentYear, currentMonth - 1, 1);
      return newDate;
    });
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const scheduled_for = format(date, `yyyy-MM-dd'T'${hour.toString().padStart(2, '0')}:00:00`);
    setNewPost(prev => ({ ...prev, scheduled_for }));
    setShowDialog(true);
  };

  const handlePlatformToggle = (platform: string) => {
    if (!isPlatformConnected(platform)) {
      setPlatformToConnect(platform);
      setShowConnectionDialog(true);
      setShowDialog(false);
      return;
    }

    setNewPost(prev => {
      const updatedPlatforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      
      return {
        ...prev,
        platforms: updatedPlatforms
      };
    });
  };

  const handleConnectPlatform = () => {
    // In a real app, this would initiate OAuth flow
    setShowConnectionDialog(false);
    setPlatformToConnect(null);
  };

  const handleDragStart = (postId: number) => {
    setDraggedPostId(postId);
  };

  const handleDrop = (date: Date, hour: number) => {
    if (draggedPostId === null) return;

    // Create a UTC date for the new scheduled time
    const newScheduledFor = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        0,
        0,
        0
      )
    ).toISOString();

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === draggedPostId
          ? { ...post, scheduled_for: newScheduledFor }
          : post
      )
    );
    setDraggedPostId(null);
  };

  const getPostsForSlot = (date: Date, hour: number) => {
    // Create a slot time string in ISO format
    const slotTime = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        0,
        0,
        0
      )
    ).toISOString();

    return posts.filter(post => {
      // Get the post time in ISO format
      const postTime = new Date(post.scheduled_for).toISOString();

      console.log('Comparing slots:', {
        slotTime,
        postTime,
        match: slotTime === postTime
      });

      return slotTime === postTime;
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
            onSlotClick={handleSlotClick}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="previous month"
            data-testid="prev-month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold" data-testid="current-month">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="next month"
            data-testid="next-month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => setView(view === 'month' ? 'week' : 'month')}
          data-testid="view-toggle"
        >
          Switch to {view === 'month' ? 'week' : 'month'} view
        </button>
      </div>

      <PlatformStatus />

      {view === 'month' ? (
        <div role="grid" data-testid="month-view">
          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>
        </div>
      ) : (
        <div role="grid" data-testid="week-view">
          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>
        </div>
      )}

      {showDialog && (
        <PostDialog
          onClose={() => setShowDialog(false)}
          onSave={() => setShowDialog(false)}
          initialPost={newPost}
          onPlatformToggle={handlePlatformToggle}
        />
      )}

      {showConnectionDialog && platformToConnect && (
        <PlatformDialog
          platform={platformToConnect}
          onClose={() => setShowConnectionDialog(false)}
          onConnect={handleConnectPlatform}
        />
      )}
    </div>
  );
}