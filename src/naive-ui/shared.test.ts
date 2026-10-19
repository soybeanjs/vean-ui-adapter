import { describe, expect, it } from 'vite-plus/test';
import { resolveAdapterTheme } from '../shared/theme';
import { resolveNaiveTheme } from './shared';

describe('Naive theme overrides', () => {
  it.each(['light', 'dark'] as const)('maps %s surfaces and semantic states without replacing theme defaults', mode => {
    const source = resolveAdapterTheme({ primary: 'indigo' }, mode);
    const result = resolveNaiveTheme(source);
    expect(result.common).toBeDefined();
    expect(result.common.bodyColor).toBe(source.colors.background);
    expect(result.common.inputColor).toBe(source.colors.card);
    expect(result.common.primaryColor).toBe(source.colors.primary);
    expect(result.common.baseColor).toBe(source.colors['primary-foreground']);
    expect(result.common.primaryColorHover).not.toBe(result.common.primaryColorPressed);
    expect(result.common.textColorDisabled).toBeTruthy();
    expect(result.common.placeholderColorDisabled).toBeTruthy();
  });

  it('pairs tooltip surfaces with their own foreground even with black solid labels', () => {
    const theme = resolveAdapterTheme({}, 'dark');
    theme.colors['primary-foreground'] = '#000';
    const result = resolveNaiveTheme(theme);
    expect(result.common.baseColor).toBe('#000');
    expect(result.Tooltip).toEqual({ color: theme.colors.popover, textColor: theme.colors['popover-foreground'] });
  });

  it('updates the component size and radius keys consumed by Naive', () => {
    const source = resolveAdapterTheme({ radius: 'lg' }, 'light');
    const { common } = resolveNaiveTheme(source);
    expect(common.borderRadius).toBe(source.radius.md);
    expect(common.fontSizeMedium).toBe(`${(source.size * 14) / 16}px`);
    expect(common.heightMedium).toBe(`${(source.size * 34) / 16}px`);
    expect(common.heightLarge).not.toBe(common.heightSmall);
  });
});
