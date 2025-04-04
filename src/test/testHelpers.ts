import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

/**
 * Utility functions for interacting with UI components in tests
 */

/**
 * Select an option from a Select component
 * @param selectLabel - The accessible name or label of the select component
 * @param optionName - The name of the option to select
 * @param user - The userEvent instance to use for interactions
 */
export async function selectOption(
  selectLabel: string | RegExp,
  optionName: string | RegExp,
  user = userEvent.setup()
): Promise<void> {
  // Find the select trigger button
  const selectTrigger = screen.getByRole('combobox', { name: selectLabel });
  
  // Click to open the select dropdown
  await user.click(selectTrigger);
  
  // Wait for the select to be open
  await waitFor(() => {
    expect(selectTrigger).toHaveAttribute('aria-expanded', 'true');
  });
  
  // Find the option by role and name
  const option = screen.getByRole('option', { name: optionName });
  
  // Click on the option
  await user.click(option);
  
  // Wait for the select to be closed
  await waitFor(() => {
    expect(selectTrigger).toHaveAttribute('aria-expanded', 'false');
  });
}

/**
 * Get the current value of a Select component
 * @param selectLabel - The accessible name or label of the select component
 * @returns The currently selected value
 */
export function getSelectValue(selectLabel: string | RegExp): string {
  const selectTrigger = screen.getByRole('combobox', { name: selectLabel });
  const valueElement = selectTrigger.querySelector('[data-slot="select-value"]');
  return valueElement?.textContent || '';
}

/**
 * Wait for a specific option to be available in a Select component
 * @param optionName - The name of the option to wait for
 * @param timeout - Optional timeout in ms (default: 1000ms)
 */
export async function waitForSelectOption(
  optionName: string | RegExp,
  timeout: number = 1000
): Promise<HTMLElement> {
  return await waitFor(
    () => screen.getByRole('option', { name: optionName }),
    { timeout }
  );
}

/**
 * Open a Select component dropdown
 * @param selectLabel - The accessible name or label of the select component
 * @param user - The userEvent instance to use for interactions
 */
export async function openSelect(
  selectLabel: string | RegExp,
  user = userEvent.setup()
): Promise<void> {
  const selectTrigger = screen.getByRole('combobox', { name: selectLabel });
  await user.click(selectTrigger);
  await waitFor(() => {
    expect(selectTrigger).toHaveAttribute('aria-expanded', 'true');
  });
}

/**
 * Close an open Select component dropdown
 * @param selectLabel - The accessible name or label of the select component
 * @param user - The userEvent instance to use for interactions
 */
export async function closeSelect(
  selectLabel: string | RegExp,
  user = userEvent.setup()
): Promise<void> {
  const selectTrigger = screen.getByRole('combobox', { name: selectLabel });
  if (selectTrigger.getAttribute('aria-expanded') === 'true') {
    await user.click(selectTrigger);
    await waitFor(() => {
      expect(selectTrigger).toHaveAttribute('aria-expanded', 'false');
    });
  }
} 