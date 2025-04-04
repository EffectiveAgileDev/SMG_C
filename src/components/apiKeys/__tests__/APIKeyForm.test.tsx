import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APIKeyForm } from '../APIKeyForm';
import { setupComponentTest } from '../../../test/mockRegistry';
import { selectOption } from '../../../test/testHelpers';

describe('APIKeyForm', () => {
  const mockSubmit = vi.fn();
  
  // Set up test environment with proper cleanup
  const cleanup = setupComponentTest({ 
    radix: true,  // Using Radix UI Select component
    shadcn: true  // Using Shadcn UI components
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Test 1: Basic Rendering
  it('renders form fields correctly for new key', () => {
    render(<APIKeyForm onSubmit={mockSubmit} />);
    
    expect(screen.getByTestId('platform-select')).toBeInTheDocument();
    expect(screen.getByTestId('key-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('key-value-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  // Test 2: Validation
  it('shows validation error when submitting without required fields', async () => {
    const user = userEvent.setup();
    render(<APIKeyForm onSubmit={mockSubmit} />);
    
    await user.click(screen.getByTestId('submit-button'));
    
    expect(await screen.findByText('Key name is required')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  // Test 3: Form Submission
  it('submits form data when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(<APIKeyForm onSubmit={mockSubmit} />);

    // Fill out form
    const keyNameInput = screen.getByTestId('key-name-input');
    const keyValueInput = screen.getByTestId('key-value-input');
    
    await user.type(keyNameInput, 'Test Key');
    await user.type(keyValueInput, 'test-api-key-123');
    
    // Select platform (Twitter is default)
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

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

    // Fill required fields
    await user.type(screen.getByTestId('key-name-input'), 'Test Key');
    await user.type(screen.getByTestId('key-value-input'), 'test-api-key-123');
    
    // Click submit
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Verify form is disabled during submission
    expect(screen.getByTestId('key-name-input')).toBeDisabled();
    expect(screen.getByTestId('key-value-input')).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  // Test 5: Error Handling
  it('handles submission errors', async () => {
    const mockError = new Error('Submission failed');
    const errorMockSubmit = vi.fn().mockRejectedValue(mockError);
    
    const user = userEvent.setup();
    render(<APIKeyForm onSubmit={errorMockSubmit} />);

    // Fill and submit form
    await user.type(screen.getByTestId('key-name-input'), 'Test Key');
    await user.type(screen.getByTestId('key-value-input'), 'test-api-key-123');
    await user.click(screen.getByTestId('submit-button'));

    // Verify error is displayed
    expect(await screen.findByText(/submission failed/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  // Test 6: Platform Selection
  it('updates form data when platform is changed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<APIKeyForm onSubmit={onSubmit} />);
    
    // Verify initial state
    expect(screen.getByTestId('platform-select')).toHaveTextContent('Twitter');
    
    // Use the native select element that's already in the DOM
    // This avoids issues with the Radix UI select component in tests
    const nativeSelect = document.querySelector('select[name="platformType"]');
    expect(nativeSelect).not.toBeNull();
    
    // Change the value directly
    fireEvent.change(nativeSelect!, { target: { value: 'linkedin' } });
    
    // Verify the platform has been updated
    await waitFor(() => {
      expect(screen.getByTestId('platform-select')).toHaveTextContent('LinkedIn');
    });
    
    // Get input elements
    const keyNameInput = screen.getByTestId('key-name-input');
    const keyValueInput = screen.getByTestId('key-value-input');
    
    // Clear inputs first
    await user.clear(keyNameInput);
    await user.clear(keyValueInput);
    
    // Fill in form fields
    await user.type(keyNameInput, 'My LinkedIn Key');
    await user.type(keyValueInput, '12345-linkedin-key');
    
    // Submit the form
    await user.click(screen.getByTestId('submit-button'));
    
    // Verify onSubmit was called with the correct data
    expect(onSubmit).toHaveBeenCalledWith({
      platformType: 'linkedin',
      keyName: 'My LinkedIn Key',
      keyValue: '12345-linkedin-key',
      expiresAt: undefined
    });
  });
}); 