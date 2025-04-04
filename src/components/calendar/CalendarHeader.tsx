import React from 'react';
import { format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarHeaderProps {
  selectedDate: Date;
  view: 'month' | 'week';
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onViewToggle: () => void;
}

export function CalendarHeader({
  selectedDate,
  view,
  onPrevMonth,
  onNextMonth,
  onViewToggle
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <button
          onClick={onPrevMonth}
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
          onClick={onNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="next month"
          data-testid="next-month"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <button
        onClick={onViewToggle}
        data-testid="view-toggle"
      >
        Switch to {view === 'month' ? 'week' : 'month'} view
      </button>
    </div>
  );
}

export default CalendarHeader; 