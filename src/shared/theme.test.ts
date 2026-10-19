import { describe, expect, it } from 'vite-plus/test';
import { resolveThemeColors } from '@vean/theme';
import { mix, opacity, toColor, toRgbTriplet } from './color';
import { lengthToPx, resolveAdapterTheme } from './theme';

describe('theme normalization', () => {
  it('emits legacy RGB accepted by target color parsers', () => {
    expect(toColor('hsl(0 100% 50%)')).toBe('rgb(255, 0, 0)');
    expect(toColor('rgb(255 0 0 / 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
    expect(toRgbTriplet('hsl(240 100% 50%)')).toBe('0, 0, 255');
    expect(mix('#000', '#fff', 0.5)).toBe('rgb(128, 128, 128)');
  });

  it('applies engine alpha once and preserves it when fading', () => {
    const theme = resolveAdapterTheme({}, 'dark');
    const colors = resolveThemeColors({}, 'dark');
    expect(theme.colors.border).toBe(toColor(colors.border));
    expect(theme.colors.mask).toBe(toColor(colors.mask));
    expect(theme.colors.border).toBe('rgba(255, 255, 255, 0.1)');
    expect(opacity(theme.colors.border, 0.5)).toBe('rgba(255, 255, 255, 0.05)');
  });

  it('resolves radius rungs and numerical rem tokens using the theme root size', () => {
    const theme = resolveAdapterTheme({ radius: '1rem', size: '20px' }, 'light');
    expect(theme.radius).toEqual({ sm: '0.75rem', md: '1rem', lg: '1.25rem', full: '9999px' });
    expect(theme.radiusPx).toEqual({ sm: 15, md: 20, lg: 25 });
    expect(lengthToPx('1.25rem')).toBe(20);
    expect(resolveAdapterTheme({ radius: '0px' }, 'light').radiusPx.md).toBe(0);
  });
});
