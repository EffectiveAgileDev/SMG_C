import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APIKeyForm } from '../APIKeyForm';
import type { APIKeyFormData } from '../types';
import type { PlatformType } from '../../../lib/apiKeys/types';

// Mock scrollIntoView for JSDOM
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// RED Phase: Write failing tests first
describe('APIKeyForm', () => {
  const mockSubmit = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Basic Rendering
  it('renders form fields correctly for new key', () => {
    render(<APIKeyForm onSubmit={mockSubmit} />);

    // Platform select
    const platformLabel = screen.getByText(/Platform/i);
    const platformSelect = screen.getByTestId('platform-select');
    expect(platformLabel).toBeInTheDocument();
    expect(platformSelect).toBeInTheDocument();
    expect(platformSelect).toHaveTextContent('Twitter');

    // Key name input
    const keyNameLabel = screen.getByText(/Key Name/i);
    const keyNameInput = screen.getByTestId('key-name-input');
    expect(keyNameLabel).toBeInTheDocument();
    expect(keyNameInput).toBeInTheDocument();
    expect(keyNameInput).toHaveValue('');

    // API key input
    const keyValueLabel = screen.getByText(/API Key/i);
    const keyValueInput = screen.getByTestId('key-value-input');
    expect(keyValueLabel).toBeInTheDocument();
    expect(keyValueInput).toBeInTheDocument();
    expect(keyValueInput).toHaveValue('');

    // Submit button
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  // Test 2: Form Validation
  it('shows validation error when submitting without required fields', async () => {
    render(<APIKeyForm onSubmit={mockSubmit} />);

    // Submit without filling any fields
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(/Key name is required/i);
    });

    // Should not call onSubmit
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  // Test 3: Form Submission
  it('submits form data when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(<APIKeyForm onSubmit={mockSubmit} />);

    // Fill out form
    await user.type(screen.getByTestId('key-name-input'), 'Test Key');
    await user.type(screen.getByTestId('key-value-input'), 'test-api-key-123');

    // Submit form
    await user.click(screen.getByTestId('submit-button'));

    // Should call onSubmit with correct data
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        platformType: 'twitter',
        keyName: 'Test Key',
        keyValue: 'test-api-key-123',
        expiresAt: undefined
      });
    });
  });

  // Test 4: Loading State
  it('disables form during submission', async () => {
    const user = userEvent.setup();
    render(<APIKeyForm onSubmit={mockSubmit} />);

    // Fill out form
    await user.type(screen.getByTestId('key-name-input'), 'Test Key');
    await user.type(screen.getByTestId('key-value-input'), 'test-api-key-123');

    // Start submission
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Form should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('key-name-input')).toBeDisabled();
    expect(screen.getByTestId('key-value-input')).toBeDisabled();
    expect(screen.getByTestId('platform-select')).toBeDisabled();
  });

  // Test 5: Error Handling
  it('handles submission errors', async () => {
    const mockError = new Error('Failed to save key');
    const mockSubmitError = vi.fn(() => Promise.reject(mockError));
    
    const user = userEvent.setup();
    render(<APIKeyForm onSubmit={mockSubmitError} />);

    // Fill and submit form
    await user.type(screen.getByTestId('key-name-input'), 'Test Key');
    await user.type(screen.getByTestId('key-value-input'), 'test-api-key-123');
    await user.click(screen.getByTestId('submit-button'));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(/Failed to save key/i);
    });

    // Form should be enabled again
    expect(screen.getByTestId('submit-button')).toBeEnabled();
  });

  // Test 6: Platform Selection
  it('updates form data when platform is changed', async () => {
    const { container } = render(<APIKeyForm onSubmit={mockSubmit} />);

    // Get the select trigger and click it
    const select = screen.getByTestId('platform-select');
    fireEvent.click(select);

    // Find and click the LinkedIn option in the portal
    const linkedInOption = screen.getByRole('option', { name: 'LinkedIn' });
    fireEvent.click(linkedInOption);

    // Fill and submit form using fireEvent for consistency
    const keyNameInput = screen.getByTestId('key-name-input');
    const keyValueInput = screen.getByTestId('key-value-input');
    const submitButton = screen.getByTestId('submit-button');

    fireEvent.change(keyNameInput, { target: { value: 'LinkedIn Key' } });
    fireEvent.change(keyValueInput, { target: { value: 'linkedin-api-key-123' } });
    fireEvent.click(submitButton);

    // Should call onSubmit with updated platform
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        platformType: 'linkedin',
        keyName: 'LinkedIn Key',
        keyValue: 'linkedin-api-key-123',
        expiresAt: undefined
      });
    });
  });

  // Test 7: Key Rotation Mode
  it('renders correctly in key rotation mode', async () => {
    const initialData: Partial<APIKeyFormData> = {
      platformType: 'twitter' as PlatformType,
      keyName: 'Existing Key',
      keyValue: 'old-key-value'
    };

    render(
      <APIKeyForm 
        onSubmit={mockSubmit} 
        isRotating={true}
        initialData={initialData}
      />
    );

    // Platform should be disabled and pre-selected
    const platformSelect = screen.getByTestId('platform-select');
    expect(platformSelect).toBeDisabled();
    expect(platformSelect).toHaveTextContent('Twitter');

    // Key name should be disabled and pre-filled
    const keyNameInput = screen.getByTestId('key-name-input');
    expect(keyNameInput).toBeDisabled();
    expect(keyNameInput).toHaveValue('Existing Key');

    // Only new key input should be enabled
    const keyValueInput = screen.getByTestId('key-value-input');
    expect(keyValueInput).toBeEnabled();
    expect(keyValueInput).toHaveValue('');

    // Submit button should say "Rotate Key"
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toHaveTextContent('Rotate Key');
    expect(submitButton).toBeEnabled();
  });
}); 