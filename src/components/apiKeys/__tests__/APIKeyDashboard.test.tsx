import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { APIKeyDashboard } from '../APIKeyDashboard';
import { APIKey } from '../types';
import { fetchApiKeys, createApiKey } from '../../../lib/api';

// Mock the API module
vi.mock('../../../lib/api', () => ({
  fetchApiKeys: vi.fn(),
  createApiKey: vi.fn(),
}));

// Mock child components
vi.mock('../APIKeyCard', () => ({
  APIKeyCard: ({ apiKey }: { apiKey: APIKey }) => (
    <div data-testid="api-key-card">{apiKey.keyName}</div>
  ),
}));

vi.mock('../APIKeyForm', () => ({
  APIKeyForm: ({ onSubmit }: { onSubmit: (data: any) => Promise<void> }) => (
    <form data-testid="api-key-form" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ keyName: 'Test Key', platformType: 'twitter' });
    }}>
      <button type="submit">Submit</button>
    </form>
  ),
}));

describe('APIKeyDashboard', () => {
  const mockApiKeys: APIKey[] = [
    {
      id: '1',
      keyName: 'Twitter Key',
      platformType: 'twitter',
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: undefined,
      encryptedKey: 'encrypted-key-1',
    },
    {
      id: '2',
      keyName: 'LinkedIn Key',
      platformType: 'linkedin',
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: undefined,
      encryptedKey: 'encrypted-key-2',
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state initially', async () => {
    vi.mocked(fetchApiKeys).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<APIKeyDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('should render error message when API call fails', async () => {
    const mockError = new Error('Failed to fetch API keys');
    vi.mocked(fetchApiKeys).mockRejectedValueOnce(mockError);

    render(<APIKeyDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Error loading API keys')).toBeInTheDocument();
    });
  });

  it('should render API key cards when data is loaded', async () => {
    vi.mocked(fetchApiKeys).mockResolvedValueOnce(mockApiKeys);

    render(<APIKeyDashboard />);
    await waitFor(() => {
      expect(screen.getAllByTestId('api-key-card')).toHaveLength(2);
    });
  });

  it('should show create form when add button is clicked', async () => {
    vi.mocked(fetchApiKeys).mockResolvedValueOnce([]);
    
    render(<APIKeyDashboard />);
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const addButton = screen.getByText('Add API Key');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('api-key-form')).toBeInTheDocument();
    });
  });

  it('should refresh key list after successful key creation', async () => {
    const newKey: APIKey = {
      id: '3',
      keyName: 'New Key',
      platformType: 'twitter',
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: undefined,
      encryptedKey: 'encrypted-key-3',
    };

    vi.mocked(fetchApiKeys)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([...mockApiKeys, newKey]);
    
    vi.mocked(createApiKey).mockResolvedValueOnce(newKey);

    render(<APIKeyDashboard />);
    await waitFor(() => {
      const addButton = screen.getByText('Add API Key');
      fireEvent.click(addButton);
    });
    
    const form = screen.getByTestId('api-key-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getAllByTestId('api-key-card')).toHaveLength(3);
    });
  });

  it('should show error toast when key creation fails', async () => {
    const mockError = new Error('Failed to create API key');
    vi.mocked(fetchApiKeys).mockResolvedValueOnce([]);
    vi.mocked(createApiKey).mockRejectedValueOnce(mockError);

    render(<APIKeyDashboard />);
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const addButton = screen.getByText('Add API Key');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('api-key-form')).toBeInTheDocument();
    });
    
    const form = screen.getByTestId('api-key-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Error creating API key')).toBeInTheDocument();
    });
  });
}); 