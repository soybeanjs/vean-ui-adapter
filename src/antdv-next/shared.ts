import { resolveAntTheme as resolveBaseAntTheme } from '../shared/ant-tokens';
import type { AntTheme } from '../shared/ant-tokens';
import { mix, opacity } from '../shared/color';
import type { AdapterTheme } from '../shared/types';

export function resolveAntTheme(theme: AdapterTheme): AntTheme {
  const { colors } = theme;
  const base = resolveBaseAntTheme(theme);
  return {
    token: {
      ...base.token,
      colorBgSolid: colors.foreground,
      colorBgSolidHover: opacity(colors.foreground, 0.75),
      colorBgSolidActive: opacity(colors.foreground, 0.95),
      colorBgBlur: opacity(colors.card, 0.6),
      colorBorderDisabled: opacity(colors.border, 0.6),
      colorErrorBgFilledHover: mix(colors.card, colors.destructive, 0.2),
      colorErrorBgActive: mix(colors.card, colors.destructive, 0.28)
    }
  };
}
