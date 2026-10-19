import { SEMANTIC_TOKENS, resolveThemeColors, resolveThemeMap } from '@vean/theme';
import type { ThemeMap, ThemeMode, ThemeOptions } from '@vean/theme';
import { toColor } from './color';
import type { AdapterTheme } from './types';

/** The engine only accepts px/rem lengths; rem size is relative to the initial root size. */
export function lengthToPx(length: string, rootSize = 16): number {
  return Number.parseFloat(length) * (length.endsWith('rem') ? rootSize : 1);
}

function resolveRadius(literal: ThemeMap['literal'], rung: 'sm' | 'md' | 'lg'): string {
  const expression = literal[`radius-${rung}`];
  const coefficient = expression.match(/\*\s*([\d.]+)\s*\)/)?.[1];
  const multiplier = coefficient ? Number(coefficient) : 1;
  const unit = literal.radius.endsWith('rem') ? 'rem' : 'px';

  return `${Number.parseFloat(literal.radius) * multiplier}${unit}`;
}

export function resolveAdapterTheme(options: ThemeOptions, mode: ThemeMode): AdapterTheme {
  const { literal } = resolveThemeMap(options);
  const colors = resolveThemeColors(options, mode, 'hsl');
  const size = lengthToPx(literal.size);
  const radius = {
    sm: resolveRadius(literal, 'sm'),
    md: resolveRadius(literal, 'md'),
    lg: resolveRadius(literal, 'lg'),
    full: literal['radius-full']
  };

  SEMANTIC_TOKENS.forEach(token => {
    colors[token] = toColor(colors[token]);
  });

  return {
    mode,
    colors,
    literal,
    radius,
    radiusPx: {
      sm: lengthToPx(radius.sm, size),
      md: lengthToPx(radius.md, size),
      lg: lengthToPx(radius.lg, size)
    },
    size
  };
}
