import { describe, expect, it } from 'vite-plus/test';
import { theme } from 'antdv-next';
import { prepareComponentToken } from 'antdv-next/dist/button/style/token';
import { resolveAdapterTheme } from '../shared/theme';
import { resolveAntTheme } from './shared';

describe('Antdv Next extended tokens', () => {
  it.each(['light', 'dark'] as const)('covers modern solid, disabled and error tokens in %s mode', mode => {
    const source = resolveAdapterTheme({}, mode);
    const { token } = resolveAntTheme(source);
    expect(token.colorBgSolid).toBe(source.colors.foreground);
    const resolved = theme.getDesignToken(resolveAntTheme(source));
    if (typeof prepareComponentToken !== 'function') throw new Error('Expected Button token factory');
    expect(prepareComponentToken(resolved)?.solidTextColor).toBe(mode === 'dark' ? '#000' : '#fff');
    expect(prepareComponentToken(resolved)?.primaryColor).toBe(source.colors['primary-foreground']);
    [
      'colorBgSolidHover',
      'colorBgSolidActive',
      'colorBgBlur',
      'colorBorderDisabled',
      'colorErrorBgFilledHover',
      'colorErrorBgActive'
    ].forEach(key => {
      expect(token[key]).toBeTruthy();
    });
  });
});
