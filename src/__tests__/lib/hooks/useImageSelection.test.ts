import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageSelection } from '../../../lib/hooks/useImageSelection';

describe('useImageSelection', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useImageSelection());
    expect(result.current.selectedImages.size).toBe(0);
  });

  it('should toggle image selection', () => {
    const { result } = renderHook(() => useImageSelection());
    
    act(() => {
      result.current.handleSelect('1');
    });
    expect(result.current.selectedImages.has('1')).toBe(true);
    
    act(() => {
      result.current.handleSelect('1');
    });
    expect(result.current.selectedImages.has('1')).toBe(false);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useImageSelection());
    
    act(() => {
      result.current.handleSelect('1');
      result.current.handleSelect('2');
    });
    expect(result.current.selectedImages.size).toBe(2);
    
    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedImages.size).toBe(0);
  });

  it('should select all images', () => {
    const { result } = renderHook(() => useImageSelection());
    const imageIds = ['1', '2', '3'];
    
    act(() => {
      result.current.selectAll(imageIds);
    });
    expect(result.current.selectedImages.size).toBe(3);
    imageIds.forEach(id => {
      expect(result.current.selectedImages.has(id)).toBe(true);
    });
  });

  it('should call onSelectionChange when selection changes', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() => 
      useImageSelection({ onSelectionChange })
    );
    
    act(() => {
      result.current.handleSelect('1');
    });
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1']));
    
    act(() => {
      result.current.clearSelection();
    });
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });
}); 