import { describe, expect, it } from 'vitest';
import { formatCurrencyShort } from './format-currency';

describe('formatCurrencyShort', () => {
  it('returns $0 for null', () => {
    expect(formatCurrencyShort(null)).toBe('$0');
  });

  it('returns $0 for undefined', () => {
    expect(formatCurrencyShort(undefined)).toBe('$0');
  });

  it('formats sub-thousand values without a suffix', () => {
    expect(formatCurrencyShort(0)).toBe('$0');
    expect(formatCurrencyShort(42)).toBe('$42');
    expect(formatCurrencyShort(999)).toBe('$999');
  });

  it('formats values >= 1,000 and < 1,000,000 with a K suffix', () => {
    expect(formatCurrencyShort(1_000)).toBe('$1.0K');
    expect(formatCurrencyShort(1_500)).toBe('$1.5K');
    expect(formatCurrencyShort(999_999)).toBe('$1000.0K');
  });

  it('formats values >= 1,000,000 with an M suffix', () => {
    expect(formatCurrencyShort(1_000_000)).toBe('$1.0M');
    expect(formatCurrencyShort(2_500_000)).toBe('$2.5M');
    expect(formatCurrencyShort(1_234_567)).toBe('$1.2M');
  });
});
