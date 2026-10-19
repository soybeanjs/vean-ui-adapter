import type { SemanticToken, ThemeMap, ThemeMode } from '@vean/theme';

export interface AdapterTheme {
  mode: ThemeMode;
  colors: Record<SemanticToken, string>;
  literal: ThemeMap['literal'];
  radius: { sm: string; md: string; lg: string; full: string };
  radiusPx: { sm: number; md: number; lg: number };
  size: number;
}

export type CssVariables = Record<`--${string}`, string>;
