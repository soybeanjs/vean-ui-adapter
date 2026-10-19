import { mix, opacity, toRgbTriplet } from '../shared/color';
import type { AdapterTheme, CssVariables } from '../shared/types';

function resolveSemanticVariables(theme: AdapterTheme): CssVariables {
  const { colors, mode } = theme;
  const roles = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.destructive,
    error: colors.destructive,
    info: colors.info
  };

  return Object.fromEntries(
    Object.entries(roles).flatMap(([role, color]) => [
      [`--el-color-${role}`, color],
      [`--el-color-${role}-rgb`, toRgbTriplet(color)],
      [`--el-color-${role}-dark-2`, mix(color, mode === 'dark' ? '#ffffff' : '#000000', 0.2)],
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => [
        `--el-color-${role}-light-${level}`,
        mix(color, mode === 'dark' ? colors.card : '#ffffff', level / 10)
      ])
    ])
  );
}

/** Element Plus consumes complete CSS colors, including the engine's border alpha. */
export function resolveElementVariables(theme: AdapterTheme): CssVariables {
  const { colors, literal, radius, size } = theme;
  const scale = size / 16;

  return {
    ...resolveSemanticVariables(theme),
    // Solid status controls share this foreground in Element Plus.
    '--el-color-white': colors['primary-foreground'],
    '--el-bg-color': colors.card,
    '--el-bg-color-page': colors.background,
    '--el-bg-color-overlay': colors.popover,
    '--el-text-color-primary': colors.foreground,
    '--el-text-color-regular': colors.foreground,
    '--el-text-color-secondary': colors['muted-foreground'],
    '--el-text-color-placeholder': opacity(colors['muted-foreground'], 0.7),
    '--el-text-color-disabled': opacity(colors['muted-foreground'], 0.5),
    '--el-border-color': colors.border,
    '--el-border-color-light': opacity(colors.border, 0.8),
    '--el-border-color-lighter': opacity(colors.border, 0.6),
    '--el-border-color-extra-light': opacity(colors.border, 0.4),
    '--el-border-color-dark': colors.input,
    '--el-border-color-darker': colors.input,
    '--el-border-color-hover': colors.ring,
    '--el-fill-color': colors.secondary,
    '--el-fill-color-light': colors.muted,
    '--el-fill-color-lighter': mix(colors.muted, colors.card, 0.5),
    '--el-fill-color-extra-light': mix(colors.muted, colors.card, 0.75),
    '--el-fill-color-dark': colors.accent,
    '--el-fill-color-darker': colors.secondary,
    '--el-fill-color-blank': colors.card,
    '--el-disabled-bg-color': colors.muted,
    '--el-disabled-text-color': opacity(colors['muted-foreground'], 0.5),
    '--el-disabled-border-color': colors.border,
    '--el-overlay-color': colors.mask,
    '--el-overlay-color-light': opacity(colors.mask, 0.75),
    '--el-overlay-color-lighter': opacity(colors.mask, 0.5),
    '--el-mask-color': opacity(colors.card, 0.9),
    '--el-mask-color-extra-light': opacity(colors.card, 0.3),
    '--el-border-radius-base': radius.md,
    '--el-border-radius-small': radius.sm,
    '--el-border-radius-round': radius.full,
    '--el-border-radius-circle': '100%',
    '--el-font-family': literal['font-sans'],
    '--el-font-size-extra-large': `${20 * scale}px`,
    '--el-font-size-large': `${18 * scale}px`,
    '--el-font-size-medium': `${16 * scale}px`,
    '--el-font-size-base': `${14 * scale}px`,
    '--el-font-size-small': `${13 * scale}px`,
    '--el-font-size-extra-small': `${12 * scale}px`,
    '--el-component-size-large': `${40 * scale}px`,
    '--el-component-size': `${32 * scale}px`,
    '--el-component-size-small': `${24 * scale}px`
  };
}
