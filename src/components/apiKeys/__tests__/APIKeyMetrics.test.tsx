import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { APIKeyMetrics } from '../APIKeyMetrics';
import { APIKey } from '../types';

describe('APIKeyMetrics', () => {
  const mockApiKey: APIKey = {
    id: '1',
    keyName: 'Test Key',
    platformType: 'twitter',
    isActive: true,
    createdAt: '2024-04-10T12:00:00Z',
    encryptedKey: 'encrypted-key-1',
    lastUsed: '2024-04-10T14:00:00Z'
  };

  const mockMetrics = {
    usageCount: 150,
    errorRate: 0.02,
    lastUsed: new Date('2024-04-10T21:00:00Z')  // 21:00 UTC = 14:00 PDT (2:00 PM)
  };

  it('should display usage count', () => {
    render(
      <APIKeyMetrics
        apiKey={mockApiKey}
        usageCount={mockMetrics.usageCount}
        errorRate={mockMetrics.errorRate}
        lastUsed={mockMetrics.lastUsed}
      />
    );
    expect(screen.getByTestId('usage-count')).toHaveTextContent('150');
  });

  it('should display error rate as percentage', () => {
    render(
      <APIKeyMetrics
        apiKey={mockApiKey}
        usageCount={mockMetrics.usageCount}
        errorRate={mockMetrics.errorRate}
        lastUsed={mockMetrics.lastUsed}
      />
    );
    expect(screen.getByTestId('error-rate')).toHaveTextContent('2%');
  });

  it('should display formatted last used time', () => {
    render(
      <APIKeyMetrics
        apiKey={mockApiKey}
        usageCount={mockMetrics.usageCount}
        errorRate={mockMetrics.errorRate}
        lastUsed={mockMetrics.lastUsed}
      />
    );
    expect(screen.getByTestId('last-used')).toHaveTextContent('2:00 PM');
  });

  it('should display "Never" when key has not been used', () => {
    const unusedApiKey: APIKey = {
      id: '2',
      keyName: 'Unused Key',
      platformType: 'twitter',
      isActive: true,
      createdAt: '2024-04-10T12:00:00Z',
      encryptedKey: 'encrypted-key-2'
    };

    render(
      <APIKeyMetrics
        apiKey={unusedApiKey}
        usageCount={0}
        errorRate={0}
        lastUsed={undefined}
      />
    );
    expect(screen.getByTestId('last-used')).toHaveTextContent('Never');
  });

  it('should show warning indicator when error rate is high', () => {
    render(
      <APIKeyMetrics
        apiKey={mockApiKey}
        usageCount={mockMetrics.usageCount}
        errorRate={0.15} // 15% error rate
        lastUsed={mockMetrics.lastUsed}
      />
    );
    expect(screen.getByTestId('error-warning')).toBeInTheDocument();
  });

  it('should not show warning indicator when error rate is acceptable', () => {
    render(
      <APIKeyMetrics
        apiKey={mockApiKey}
        usageCount={mockMetrics.usageCount}
        errorRate={0.02} // 2% error rate
        lastUsed={mockMetrics.lastUsed}
      />
    );
    expect(screen.queryByTestId('error-warning')).not.toBeInTheDocument();
  });

  it('should display usage trend graph', () => {
    render(
      <APIKeyMetrics
        apiKey={mockApiKey}
        usageCount={mockMetrics.usageCount}
        errorRate={mockMetrics.errorRate}
        lastUsed={mockMetrics.lastUsed}
      />
    );
    expect(screen.getByTestId('usage-trend')).toBeInTheDocument();
  });
}); 