import { describe, it, expect } from 'vitest';
import {
  getSpread,
  getNextFlipPage,
  getPrevFlipPage,
  isSameSpread,
} from '@/lib/flipNavigation';

describe('getSpread with coverPage 1', () => {
  it('treats page 1 as cover', () => {
    expect(getSpread(1, 10, false, 1)).toEqual({
      left: null,
      right: 1,
      isCover: true,
    });
  });

  it('pairs content pages 2-3', () => {
    expect(getSpread(2, 10, false, 1)).toEqual({
      left: 2,
      right: 3,
      isCover: false,
    });
  });
});

describe('getSpread with coverPage 2', () => {
  it('shows page 1 alone before cover', () => {
    expect(getSpread(1, 10, false, 2)).toEqual({
      left: null,
      right: 1,
      isCover: false,
    });
  });

  it('treats page 2 as cover', () => {
    expect(getSpread(2, 10, false, 2)).toEqual({
      left: null,
      right: 2,
      isCover: true,
    });
  });

  it('pairs content pages 3-4 after cover', () => {
    expect(getSpread(3, 10, false, 2)).toEqual({
      left: 3,
      right: 4,
      isCover: false,
    });
    expect(getSpread(4, 10, false, 2)).toEqual({
      left: 3,
      right: 4,
      isCover: false,
    });
  });
});

describe('flip navigation with coverPage 2', () => {
  const total = 10;
  const cover = 2;

  it('opens cover then first content spread', () => {
    expect(getNextFlipPage(2, total, false, cover)).toBe(3);
    expect(getNextFlipPage(3, total, false, cover)).toBe(4);
  });

  it('returns to cover from first content page', () => {
    expect(getPrevFlipPage(3, total, false, cover)).toBe(2);
  });

  it('steps through page 1 before cover', () => {
    expect(getNextFlipPage(1, total, false, cover)).toBe(2);
    expect(getPrevFlipPage(2, total, false, cover)).toBe(2);
  });
});

describe('isSameSpread', () => {
  it('considers pages in same spread equal', () => {
    expect(isSameSpread(3, 4, 10, false, 2)).toBe(true);
    expect(isSameSpread(3, 5, 10, false, 2)).toBe(false);
  });
});
