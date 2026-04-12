import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins simple class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('honors clsx object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('flattens arrays', () => {
    expect(cn(['a', 'b'], ['c'])).toBe('a b c');
  });

  it('dedupes conflicting tailwind classes via tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('returns an empty string when called with no args', () => {
    expect(cn()).toBe('');
  });
});
