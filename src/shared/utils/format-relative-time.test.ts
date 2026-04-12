import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime } from './format-relative-time';

describe('formatRelativeTime', () => {
  const NOW = new Date('2024-06-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function offset(seconds: number): string {
    return new Date(NOW.getTime() - seconds * 1000).toISOString();
  }

  it('returns empty string for null', () => {
    expect(formatRelativeTime(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('returns "just now" for under a minute', () => {
    expect(formatRelativeTime(offset(0))).toBe('just now');
    expect(formatRelativeTime(offset(59))).toBe('just now');
  });

  it('returns minutes for under an hour', () => {
    expect(formatRelativeTime(offset(60))).toBe('1m ago');
    expect(formatRelativeTime(offset(60 * 59))).toBe('59m ago');
  });

  it('returns hours for under a day', () => {
    expect(formatRelativeTime(offset(60 * 60))).toBe('1h ago');
    expect(formatRelativeTime(offset(60 * 60 * 23))).toBe('23h ago');
  });

  it('returns days for under a week', () => {
    expect(formatRelativeTime(offset(60 * 60 * 24))).toBe('1d ago');
    expect(formatRelativeTime(offset(60 * 60 * 24 * 6))).toBe('6d ago');
  });

  it('returns weeks for under a month', () => {
    expect(formatRelativeTime(offset(60 * 60 * 24 * 7))).toBe('1w ago');
    expect(formatRelativeTime(offset(60 * 60 * 24 * 29))).toBe('4w ago');
  });

  it('falls back to a locale date string for older values', () => {
    const old = new Date('2023-01-15T00:00:00Z');
    expect(formatRelativeTime(old.toISOString())).toBe(
      old.toLocaleDateString(),
    );
  });
});
