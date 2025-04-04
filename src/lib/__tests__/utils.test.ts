import { describe, it, expect } from 'vitest';
import { formatFileSize, cn } from '../utils';

describe('formatFileSize', () => {
  it('should return "0 B" for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(2097152)).toBe('2 MB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should format terabytes correctly', () => {
    expect(formatFileSize(1099511627776)).toBe('1 TB');
  });
});

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', { bar: true })).toBe('foo bar');
    expect(cn('foo', { bar: false })).toBe('foo');
    expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('base', { active: isActive })).toBe('base active');
  });

  it('should handle tailwind classes correctly', () => {
    expect(cn('p-4', 'bg-blue-500', 'hover:bg-blue-600')).toBe('p-4 bg-blue-500 hover:bg-blue-600');
  });
}); 