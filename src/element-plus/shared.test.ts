import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vite-plus/test';
import { mix } from '../shared/color';
import { resolveAdapterTheme } from '../shared/theme';
import { resolveElementVariables } from './shared';

describe('Element Plus variables', () => {
  it('supplies the foreground consumed by real solid controls', () => {
    const theme = resolveAdapterTheme(
      { overrides: { light: { primary: 'hsl(240 100% 94%)', 'primary-foreground': 'hsl(240 33% 14%)' } } },
      'light'
    );
    const variables = resolveElementVariables(theme);
    const require = createRequire(import.meta.url);
    const buttonCss = readFileSync(require.resolve('element-plus/theme-chalk/el-button.css'), 'utf8');
    const checkboxCss = readFileSync(require.resolve('element-plus/theme-chalk/el-checkbox.css'), 'utf8');

    expect(buttonCss).toContain('--el-button-text-color:var(--el-color-white)');
    expect(checkboxCss).toContain('--el-checkbox-checked-icon-color:var(--el-color-white)');
    expect(variables['--el-color-white']).toBe(theme.colors['primary-foreground']);
  });

  it.each(['light', 'dark'] as const)('uses mode-aware interaction shades in %s mode', mode => {
    const theme = resolveAdapterTheme({}, mode);
    const variables = resolveElementVariables(theme);

    expect(variables['--el-color-primary']).toBe(theme.colors.primary);
    expect(variables['--el-color-primary-light-9']).toBe(
      mix(theme.colors.primary, mode === 'dark' ? theme.colors.card : '#ffffff', 0.9)
    );
    expect(variables['--el-color-primary-dark-2']).toBe(
      mix(theme.colors.primary, mode === 'dark' ? '#ffffff' : '#000000', 0.2)
    );
    expect(variables['--el-color-error']).toBe(variables['--el-color-danger']);
  });

  it('preserves resolved border alpha and scales the real component size variables', () => {
    const theme = resolveAdapterTheme({ size: '20px' }, 'dark');
    const variables = resolveElementVariables(theme);

    expect(variables['--el-border-color']).toBe(theme.colors.border);
    expect(variables['--el-disabled-border-color']).toBe(theme.colors.border);
    expect(variables['--el-overlay-color']).toBe(theme.colors.mask);
    expect(variables['--el-component-size']).toBe('40px');
    expect(variables['--el-font-size-base']).toBe('17.5px');
    expect(variables['--el-border-radius-base']).toBe(theme.radius.md);
  });

  it('uses inline semantic overrides for every status family', () => {
    const theme = resolveAdapterTheme(
      {
        overrides: {
          dark: {
            primary: 'hsl(210 65% 20%)',
            destructive: 'hsl(30 50% 26%)',
            info: 'hsl(210 68% 80%)'
          }
        }
      },
      'dark'
    );
    const variables = resolveElementVariables(theme);

    expect(variables['--el-color-primary']).toBe(theme.colors.primary);
    expect(variables['--el-color-danger']).toBe(theme.colors.destructive);
    expect(variables['--el-color-error']).toBe(theme.colors.destructive);
    expect(variables['--el-color-info']).toBe(theme.colors.info);
  });
});
