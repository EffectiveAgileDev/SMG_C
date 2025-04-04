import React from 'react';
import PlatformDialog from './calendar/PlatformDialog';
import PlatformStatus from './calendar/PlatformStatus';
import PostDialog from './calendar/PostDialog';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarGrid from './calendar/CalendarGrid';
import useCalendarNavigation from '../hooks/useCalendarNavigation';
import usePostManagement from '../hooks/usePostManagement';

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

export default function Calendar({ initialPosts = [], initialDate = new Date(2024, 3, 1) }: CalendarProps) {
  const {
    selectedDate, 
    view, 
    handleNextMonth, 
    handlePrevMonth, 
    toggleView
  } = useCalendarNavigation({ initialDate });
  
  const {
    posts,
    newPost,
    showDialog,
    showConnectionDialog,
    platformToConnect,
    handleSlotClick,
    handlePlatformToggle,
    handleConnectPlatform,
    handleDragStart,
    handleDrop,
    setShowDialog,
    setShowConnectionDialog
  } = usePostManagement({ initialPosts });

  return (
    <div className="h-full flex flex-col">
      <CalendarHeader
        selectedDate={selectedDate}
        view={view}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onViewToggle={toggleView}
      />

      <PlatformStatus />

      <CalendarGrid
        selectedDate={selectedDate}
        view={view}
        posts={posts}
        onSlotClick={handleSlotClick}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
      />

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