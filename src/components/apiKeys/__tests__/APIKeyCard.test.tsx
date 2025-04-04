import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { APIKeyCard } from '../APIKeyCard';
import type { APIKey } from '../types';

const mockApiKey: APIKey = {
  id: 'test-key-1',
  platformType: 'twitter',
  keyName: 'Test Twitter Key',
  encryptedKey: 'encrypted-key-123',
  isActive: true,
  createdAt: '2024-04-05T12:00:00Z',
  expiresAt: new Date('2024-05-05T12:00:00Z'),
  lastUsed: '2024-04-05T13:00:00Z'
};

describe('APIKeyCard', () => {
  const onRotate = vi.fn(() => Promise.resolve());
  const onDeactivate = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders API key information correctly', () => {
    render(
      <APIKeyCard
        apiKey={mockApiKey}
        onRotate={onRotate}
        onDeactivate={onDeactivate}
      />
    );

    // Check key name and platform
    expect(screen.getByText('Test Twitter Key')).toBeInTheDocument();
    expect(screen.getByText('twitter')).toBeInTheDocument();

    // Check status badge
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Check dates
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Expires:/)).toBeInTheDocument();
    expect(screen.getByText(/Last used:/)).toBeInTheDocument();
  });

  it('shows inactive status for inactive keys', () => {
    const inactiveKey = { ...mockApiKey, isActive: false };
    render(
      <APIKeyCard
        apiKey={inactiveKey}
        onRotate={onRotate}
        onDeactivate={onDeactivate}
      />
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.queryByText('Rotate Key')).not.toBeInTheDocument();
    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
  });

  it('handles key rotation', async () => {
    render(
      <APIKeyCard
        apiKey={mockApiKey}
        onRotate={onRotate}
        onDeactivate={onDeactivate}
      />
    );

    const rotateButton = screen.getByText('Rotate Key');
    fireEvent.click(rotateButton);

    expect(rotateButton).toBeDisabled();
    expect(screen.getByText('Rotating...')).toBeInTheDocument();

    await waitFor(() => {
      expect(onRotate).toHaveBeenCalledWith(mockApiKey.id);
      expect(screen.getByText('Rotate Key')).toBeEnabled();
    });
  });

  it('handles key deactivation', async () => {
    render(
      <APIKeyCard
        apiKey={mockApiKey}
        onRotate={onRotate}
        onDeactivate={onDeactivate}
      />
    );

    // Open confirmation dialog
    const deactivateButton = screen.getByText('Deactivate');
    fireEvent.click(deactivateButton);

    // Check dialog content
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();

    // Confirm deactivation
    const confirmButton = screen.getByRole('button', { name: 'Deactivate' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onDeactivate).toHaveBeenCalledWith(mockApiKey.id);
    });
  });

  it('handles errors gracefully', async () => {
    // Create a mock function that rejects with an error
    const onRotateError = vi.fn().mockRejectedValue(new Error('Rotation failed'));

    render(
      <APIKeyCard
        apiKey={{
          id: '123',
          platformType: 'twitter',
          keyName: 'Test Key',
          encryptedKey: 'encrypted-key',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        }}
        onDeactivate={() => Promise.resolve()}
        onRotate={onRotateError}
      />
    );

    // Find and click the rotate button
    const rotateButton = screen.getByRole('button', { name: /rotate key/i });
    fireEvent.click(rotateButton);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Could not rotate key')).toBeInTheDocument();
    });
  });
}); 