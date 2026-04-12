import { describe, expect, it } from 'vitest';
import { formatInitials } from './format-initials';

describe('formatInitials', () => {
  it('returns ? for null', () => {
    expect(formatInitials(null)).toBe('?');
  });

  it('returns ? for undefined', () => {
    expect(formatInitials(undefined)).toBe('?');
  });

  it('returns ? for empty string', () => {
    expect(formatInitials('')).toBe('?');
  });

  it('returns the first letter for a single name', () => {
    expect(formatInitials('jane')).toBe('J');
  });

  it('returns two initials for a two-word name', () => {
    expect(formatInitials('jane doe')).toBe('JD');
  });

  it('truncates to two initials for three or more words', () => {
    expect(formatInitials('jane mary doe')).toBe('JM');
    expect(formatInitials('a b c d e')).toBe('AB');
  });

  it('uppercases lowercase input', () => {
    expect(formatInitials('alice smith')).toBe('AS');
  });
});
