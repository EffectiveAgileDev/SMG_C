import { useState } from 'react';

interface UseCalendarNavigationProps {
  initialDate?: Date;
}

export function useCalendarNavigation({ initialDate = new Date() }: UseCalendarNavigationProps = {}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<'month' | 'week'>('month');

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

  const toggleView = () => {
    setView(prev => (prev === 'month' ? 'week' : 'month'));
  };

  return {
    selectedDate,
    view,
    handleNextMonth,
    handlePrevMonth,
    toggleView,
    setSelectedDate
  };
}

export default useCalendarNavigation; 