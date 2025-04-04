import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
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

// Mock the platforms utility
vi.mock('../../utils/platforms', () => ({
  PLATFORMS: [
    { platform: 'twitter', connected: true, charLimit: 280 },
    { platform: 'facebook', connected: true, charLimit: 63206 },
    { platform: 'instagram', connected: false, charLimit: 2200 },
    { platform: 'linkedin', connected: true, charLimit: 3000 }
  ],
  validateContent: (content: string, platforms: string[]): string | null => {
    for (const platformName of platforms) {
      const platformConfig = { platform: platformName, connected: platformName !== 'instagram', charLimit: platformName === 'twitter' ? 280 : 2000 };
      if (platformConfig?.charLimit && content.length > platformConfig.charLimit) {
        return `Exceeds ${platformName}'s character limit (${content.length}/${platformConfig.charLimit})`;
      }
    }
    return null;
  },
  isPlatformConnected: (platform: string) => platform !== 'instagram'
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
      scheduled_for: new Date(Date.UTC(2024, 3, 5, 9, 0, 0)).toISOString(),
      platforms: ['twitter'] as string[],
      status: 'draft' as const
    };

    beforeEach(() => {
      // Set the initial date to April 5th, 2024 UTC
      vi.setSystemTime(new Date(Date.UTC(2024, 3, 5, 0, 0, 0)));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should display post status indicators correctly', () => {
      render(<Calendar initialPosts={[mockPost]} initialDate={new Date(Date.UTC(2024, 3, 5, 0, 0, 0))} />);
      const timeSlot = screen.getByTestId('calendar-slot-2024-04-05-09');
      const postIndicator = within(timeSlot).getByTestId('post-1-status');
      expect(postIndicator).toHaveAttribute('data-status', 'draft');
    });

    it('should allow rescheduling posts via drag and drop', () => {
      render(<Calendar initialPosts={[mockPost]} initialDate={new Date(Date.UTC(2024, 3, 5, 0, 0, 0))} />);
      const originalTimeSlot = screen.getByTestId('calendar-slot-2024-04-05-09');
      const post = within(originalTimeSlot).getByTestId('post-1');
      const newTimeSlot = screen.getByTestId('calendar-slot-2024-04-05-14');

      fireEvent.dragStart(post);
      fireEvent.drop(newTimeSlot);

      expect(within(originalTimeSlot).queryByTestId('post-1')).not.toBeInTheDocument();
      expect(within(newTimeSlot).getByTestId('post-1')).toBeInTheDocument();
    });

    it('should show platform icons for scheduled posts', () => {
      render(<Calendar initialPosts={[mockPost]} initialDate={new Date(Date.UTC(2024, 3, 5, 0, 0, 0))} />);
      const timeSlot = screen.getByTestId('calendar-slot-2024-04-05-09');
      const twitterIcon = within(timeSlot).getByTestId('platform-icon-twitter');
      expect(twitterIcon).toBeInTheDocument();
    });
  });

  // Test Group: Platform Integration
  describe('Platform Integration', () => {
    it('should show platform connection status', () => {
      render(<Calendar />);
      const platformIcon = screen.getByTestId('platform-icon-instagram');
      const platformContainer = platformIcon.closest('div[class*="bg-red-100"]') as HTMLElement;
      expect(platformContainer).not.toBeNull();
      expect(within(platformContainer).getByText('× Not Connected')).toBeInTheDocument();
    });

    it('should prompt for platform authentication if not connected', async () => {
      render(<Calendar />);
      
      // Click on a time slot to open the post dialog
      const timeSlot = screen.getByTestId('calendar-slot-2024-04-01-00');
      fireEvent.click(timeSlot);

      // Wait for the post dialog to appear
      const postDialog = await screen.findByRole('dialog');
      expect(postDialog).toBeInTheDocument();

      // Find and click the Instagram checkbox
      const instagramCheckbox = within(postDialog).getByRole('checkbox', { name: /instagram/i });
      fireEvent.click(instagramCheckbox);

      // Wait for the platform dialog to appear
      const platformDialog = await screen.findByRole('dialog');
      expect(platformDialog).toBeInTheDocument();

      // Check the dialog content
      expect(within(platformDialog).getByRole('heading')).toHaveTextContent(/connect instagram/i);
      expect(within(platformDialog).getByText(/please connect your instagram account/i)).toBeInTheDocument();
      expect(within(platformDialog).getByTestId('connect-instagram-button')).toBeInTheDocument();
    });
  });
}); 