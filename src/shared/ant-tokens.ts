import { mix, opacity } from './color';
import type { AdapterTheme } from './types';

type AntToken = string | number | boolean;

export interface AntTheme {
  token: Record<string, AntToken>;
}

type AntStatus = 'colorPrimary' | 'colorSuccess' | 'colorWarning' | 'colorError' | 'colorInfo';

function resolveStatusTokens(name: AntStatus, color: string, theme: AdapterTheme): Record<string, string> {
  const { colors, mode } = theme;
  const hover = mix(color, '#fff', 0.16);
  const active = mix(color, '#000', 0.16);
  return {
    [name]: color,
    [`${name}Bg`]: mix(colors.card, color, mode === 'dark' ? 0.18 : 0.08),
    [`${name}BgHover`]: mix(colors.card, color, mode === 'dark' ? 0.25 : 0.14),
    [`${name}Border`]: mix(colors.card, color, 0.35),
    [`${name}BorderHover`]: mix(colors.card, color, 0.5),
    [`${name}Hover`]: hover,
    [`${name}Active`]: active,
    [`${name}TextHover`]: hover,
    [`${name}Text`]: color,
    [`${name}TextActive`]: active
  };
}

/** Explicit map tokens prevent the default light algorithm from leaking light surfaces. */
export function resolveAntTheme(theme: AdapterTheme): AntTheme {
  const { colors, literal, size, radiusPx, mode } = theme;
  const scale = size / 16;
  const status = {
    ...resolveStatusTokens('colorPrimary', colors.primary, theme),
    ...resolveStatusTokens('colorSuccess', colors.success, theme),
    ...resolveStatusTokens('colorWarning', colors.warning, theme),
    ...resolveStatusTokens('colorError', colors.destructive, theme),
    ...resolveStatusTokens('colorInfo', colors.info, theme)
  };
  return {
    token: {
      ...status,
      colorLink: colors.primary,
      colorLinkHover: status.colorPrimaryHover,
      colorLinkActive: status.colorPrimaryActive,
      colorTextBase: colors.foreground,
      colorBgBase: colors.background,
      colorText: colors.foreground,
      colorTextSecondary: opacity(colors.foreground, 0.82),
      colorTextTertiary: colors['muted-foreground'],
      colorTextQuaternary: opacity(colors['muted-foreground'], 0.55),
      colorTextLightSolid: colors['primary-foreground'],
      colorBgContainer: colors.card,
      colorBgElevated: colors.popover,
      colorBgLayout: colors.background,
      colorBgSpotlight: colors.primary,
      colorBorder: colors.border,
      colorBorderSecondary: opacity(colors.border, 0.6),
      colorFill: colors.muted,
      colorFillSecondary: opacity(colors.muted, 0.8),
      colorFillTertiary: opacity(colors.muted, 0.6),
      colorFillQuaternary: opacity(colors.muted, 0.4),
      colorBgMask: colors.mask,
      borderRadius: radiusPx.md,
      borderRadiusXS: radiusPx.sm / 2,
      borderRadiusSM: radiusPx.sm,
      borderRadiusLG: radiusPx.lg,
      fontFamily: literal['font-sans'],
      fontFamilyCode: literal['font-mono'],
      // Ant rounds generated font sizes to even pixels. Explicit rungs preserve
      // proportional scaling for fractional and custom Vean sizes.
      fontSize: 14 * scale,
      fontSizeSM: 12 * scale,
      fontSizeLG: 16 * scale,
      fontSizeXL: 20 * scale,
      fontSizeHeading1: 38 * scale,
      fontSizeHeading2: 30 * scale,
      fontSizeHeading3: 24 * scale,
      fontSizeHeading4: 20 * scale,
      fontSizeHeading5: 16 * scale,
      lineHeight: 22 / 14,
      lineHeightSM: 20 / 12,
      lineHeightLG: 24 / 16,
      lineHeightHeading1: 46 / 38,
      lineHeightHeading2: 38 / 30,
      lineHeightHeading3: 32 / 24,
      lineHeightHeading4: 28 / 20,
      lineHeightHeading5: 24 / 16,
      controlHeight: 32 * scale,
      colorWhite: '#fff',
      wireframe: false,
      colorShadow: mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : '#000'
    }
  };
}
