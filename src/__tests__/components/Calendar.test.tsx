import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Calendar from '../../components/Calendar';

// Mock Supabase client for post operations
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

describe('Calendar Component', () => {
  // Test Group: Basic Calendar Navigation
  describe('Calendar Navigation', () => {
    it('should render calendar in month view by default', () => {
      render(<Calendar />);
      expect(screen.getByTestId('month-view')).toBeInTheDocument();
      expect(screen.getByText(/April 2024/i)).toBeInTheDocument();
    });

    it('should allow switching between month and week views', async () => {
      render(<Calendar />);
      const weekViewButton = screen.getByRole('button', { name: /week/i });
      await userEvent.click(weekViewButton);
      expect(screen.getByTestId('week-view')).toBeInTheDocument();
    });

    it('should navigate between months', async () => {
      render(<Calendar />);
      
      // Check initial month
      expect(screen.getByTestId('current-month')).toHaveTextContent('April 2024');
      
      // Click next month and verify
      const nextMonthButton = screen.getByRole('button', { name: /next month/i });
      await userEvent.click(nextMonthButton);
      
      // Debug what we're seeing
      console.log('Month header after click:', screen.getByTestId('current-month').textContent);
      
      // Check if we moved to May
      expect(screen.getByTestId('current-month')).toHaveTextContent('May 2024');
    });
  });

  // Test Group: Post Creation
  describe('Post Creation', () => {
    it('should open post creation modal on time slot click', async () => {
      render(<Calendar />);
      console.log('Available testIds:', document.querySelector('[data-testid]'));
      const timeSlot = screen.getByTestId('calendar-slot-2024-04-05-09');
      console.log('Found time slot:', timeSlot);
      await userEvent.click(timeSlot);
      
      const dialog = screen.queryByRole('dialog');
      console.log('Dialog present:', !!dialog);
      if (dialog) {
        console.log('Dialog content:', dialog.textContent);
      }
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/create a post/i)).toBeInTheDocument();
    });

    it('should allow selecting multiple platforms for a post', async () => {
      render(<Calendar />);
      const timeSlot = screen.getByTestId('calendar-slot-2024-04-05-09');
      await userEvent.click(timeSlot);
      
      const twitterCheckbox = screen.getByRole('checkbox', { name: /twitter/i });
      const linkedinCheckbox = screen.getByRole('checkbox', { name: /linkedin/i });
      
      await userEvent.click(twitterCheckbox);
      await userEvent.click(linkedinCheckbox);
      
      expect(twitterCheckbox).toBeChecked();
      expect(linkedinCheckbox).toBeChecked();
    });

    it('should validate platform-specific content requirements', async () => {
      render(<Calendar />);
      const timeSlot = screen.getByTestId('calendar-slot-2024-04-05-09');
      await userEvent.click(timeSlot);
      
      // Select Twitter
      await userEvent.click(screen.getByRole('checkbox', { name: /twitter/i }));
      
      // Try to enter text longer than Twitter's limit
      const contentInput = screen.getByRole('textbox', { name: /post content/i });
      await userEvent.type(contentInput, 'x'.repeat(281));
      
      expect(screen.getByText(/exceeds twitter's character limit/i)).toBeInTheDocument();
    });
  });

  // Test Group: Post Management
  describe('Post Management', () => {
    const mockPost = {
      id: 1,
      content: 'Test post',
      status: 'draft' as const,
      scheduled_for: '2024-04-05T09:00:00Z',
      platforms: ['twitter'] as string[],
    };

    it('should display post status indicators correctly', () => {
      render(<Calendar initialPosts={[mockPost]} />);
      const postIndicator = screen.getByTestId('post-1-status');
      expect(postIndicator).toHaveAttribute('data-status', 'draft');
    });

    it('should allow rescheduling posts via drag and drop', async () => {
      render(<Calendar initialPosts={[mockPost]} />);
      const post = screen.getByTestId('post-1');
      const newTimeSlot = screen.getByTestId('calendar-slot-2024-04-05-14');
      
      fireEvent.dragStart(post);
      fireEvent.drop(newTimeSlot);
      fireEvent.dragEnd(post);
      
      expect(newTimeSlot).toContainElement(post);
    });

    it('should show platform icons for scheduled posts', () => {
      render(<Calendar initialPosts={[mockPost]} />);
      const twitterIcon = screen.getByTestId('platform-icon-twitter');
      expect(twitterIcon).toBeInTheDocument();
    });
  });

  // Test Group: Platform Integration
  describe('Platform Integration', () => {
    it('should show platform connection status', () => {
      render(<Calendar />);
      const platformStatus = screen.getByTestId('platform-status');
      expect(platformStatus).toBeInTheDocument();
    });

    it('should prompt for platform authentication if not connected', async () => {
      render(<Calendar />);
      
      // Find and click the Instagram platform checkbox
      const instagramCheckbox = screen.getByLabelText(/instagram/i);
      await userEvent.click(instagramCheckbox);

      // Verify the connection dialog appears with correct content
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Check for dialog title
      expect(screen.getByText('Connect Instagram')).toBeInTheDocument();
      
      // Check for dialog message
      expect(screen.getByText('Please connect your Instagram account to continue.')).toBeInTheDocument();
      
      // Check for connect button
      const connectButton = screen.getByTestId('connect-instagram-button');
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toHaveTextContent('Connect Instagram Account');
    });
  });
}); 