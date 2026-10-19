import { mix, opacity, toRgbTriplet } from '../shared/color';
import type { AdapterTheme, CssVariables } from '../shared/types';

function resolveSemanticVariables(theme: AdapterTheme): CssVariables {
  const { colors, mode } = theme;
  const roles = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.destructive,
    link: colors.primary
  };

  return Object.fromEntries(
    Object.entries(roles).flatMap(([role, color]) => [
      ...Array.from({ length: 10 }, (_, index) => {
        const level = index + 1;
        const target =
          level < 6 ? (mode === 'dark' ? colors.card : '#ffffff') : mode === 'dark' ? '#ffffff' : '#000000';
        const amount = level < 6 ? (6 - level) * 0.18 : (level - 6) * 0.15;
        return [`--${role}-${level}`, toRgbTriplet(mix(color, target, amount))];
      }),
      ...[1, 2, 3, 4].map(level => [
        `--color-${role}-light-${level}`,
        mode === 'dark' ? opacity(color, 0.05 + level * 0.15) : mix(color, '#ffffff', (6 - level) * 0.18)
      ])
    ])
  );
}

function resolveNeutralVariables(theme: AdapterTheme): CssVariables {
  const { colors } = theme;
  return Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => {
      const color = mix(colors.background, colors.foreground, index / 9);
      return [
        [`--gray-${index + 1}`, toRgbTriplet(color)],
        [`--color-neutral-${index + 1}`, color]
      ];
    }).flat()
  );
}

/** Arco's palette variables contain comma-separated channels; color variables contain full colors. */
export function resolveArcoVariables(theme: AdapterTheme): CssVariables {
  const { colors, radius } = theme;

  return {
    ...resolveSemanticVariables(theme),
    ...resolveNeutralVariables(theme),
    '--color-white': colors['primary-foreground'],
    '--color-black': '#000000',
    '--color-bg-1': colors.background,
    '--color-bg-2': colors.card,
    '--color-bg-3': colors.card,
    '--color-bg-4': colors.popover,
    '--color-bg-5': colors.popover,
    '--color-bg-popup': colors.popover,
    '--color-bg-white': colors.card,
    '--color-text-1': colors.foreground,
    '--color-text-2': colors.foreground,
    '--color-text-3': colors['muted-foreground'],
    '--color-text-4': opacity(colors['muted-foreground'], 0.5),
    '--color-border': colors.border,
    '--color-border-1': opacity(colors.border, 0.75),
    '--color-border-2': colors.border,
    '--color-border-3': colors.input,
    '--color-border-4': colors.ring,
    '--color-fill-1': colors.muted,
    '--color-fill-2': colors.secondary,
    '--color-fill-3': colors.accent,
    '--color-fill-4': mix(colors.accent, colors.foreground, 0.1),
    '--color-secondary': colors.secondary,
    '--color-secondary-hover': colors.accent,
    '--color-secondary-active': mix(colors.accent, colors.foreground, 0.1),
    '--color-secondary-disabled': colors.muted,
    '--color-tooltip-bg': colors.primary,
    '--color-spin-layer-bg': opacity(colors.card, 0.6),
    '--color-menu-dark-bg': colors.card,
    '--color-menu-light-bg': colors.card,
    '--color-menu-dark-hover': colors.accent,
    '--color-mask-bg': colors.mask,
    '--border-radius-none': '0',
    '--border-radius-small': radius.sm,
    '--border-radius-medium': radius.md,
    '--border-radius-large': radius.lg,
    '--border-radius-circle': '50%'
  };
}
