import { describe, expect, it } from 'vite-plus/test';
import { mix, opacity, toRgbTriplet } from '../shared/color';
import { resolveAdapterTheme } from '../shared/theme';
import { resolveArcoVariables } from './shared';

describe('Arco variables', () => {
  it.each(['light', 'dark'] as const)('emits RGB channels separately from complete colors in %s mode', mode => {
    const theme = resolveAdapterTheme({}, mode);
    const variables = resolveArcoVariables(theme);

    expect(variables['--primary-6']).toBe(toRgbTriplet(theme.colors.primary));
    expect(variables['--danger-6']).toBe(toRgbTriplet(theme.colors.destructive));
    expect(variables['--primary-1']).toBe(
      toRgbTriplet(mix(theme.colors.primary, mode === 'dark' ? theme.colors.card : '#ffffff', 0.9))
    );
    expect(variables['--color-primary-light-1']).toBe(
      mode === 'dark' ? opacity(theme.colors.primary, 0.2) : mix(theme.colors.primary, '#ffffff', 0.9)
    );
  });

  it('overrides all feedback light backgrounds when switching to dark mode', () => {
    const theme = resolveAdapterTheme({}, 'dark');
    const variables = resolveArcoVariables(theme);

    ['primary', 'success', 'warning', 'danger', 'link'].forEach(role => {
      [1, 2, 3, 4].forEach(level => {
        expect(variables[`--color-${role}-light-${level}`]).toMatch(/^rgba?\(/);
      });
    });
    expect(variables['--color-border']).toBe(theme.colors.border);
    expect(variables['--color-mask-bg']).toBe(theme.colors.mask);
    expect(variables['--color-white']).toBe(theme.colors['primary-foreground']);
    expect(variables['--border-radius-medium']).toBe(theme.radius.md);
  });
});
