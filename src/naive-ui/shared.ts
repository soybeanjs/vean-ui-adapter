import { mix, opacity } from '../shared/color';
import type { AdapterTheme } from '../shared/types';

type NaiveStatus = 'Info' | 'Success' | 'Warning' | 'Error';
type ButtonOverrides = Partial<
  Record<`textColor${'' | 'Hover' | 'Pressed' | 'Focus' | 'Disabled'}${NaiveStatus}`, string>
>;
type AlertOverrides = Record<`color${NaiveStatus}` | `border${NaiveStatus}`, string>;

export interface NaiveThemeOverrides {
  common: Record<string, string>;
  Button: ButtonOverrides;
  Tooltip: { color: string; textColor: string };
  Alert: AlertOverrides;
  Checkbox: { color: string };
  Radio: { color: string; buttonColor: string; buttonColorActive: string };
  Tabs: { tabColorSegment: string };
  Layout: { siderToggleButtonColor: string };
  Tag: { colorBordered: string };
}

function resolveStatus(name: 'primary' | Lowercase<NaiveStatus>, color: string): Record<string, string> {
  return {
    [`${name}Color`]: color,
    [`${name}ColorHover`]: mix(color, '#fff', 0.16),
    [`${name}ColorPressed`]: mix(color, '#000', 0.16),
    [`${name}ColorSuppl`]: mix(color, '#000', 0.12)
  };
}

function resolveButtonForeground(name: NaiveStatus, color: string): ButtonOverrides {
  return {
    [`textColor${name}`]: color,
    [`textColorHover${name}`]: color,
    [`textColorPressed${name}`]: color,
    [`textColorFocus${name}`]: color,
    [`textColorDisabled${name}`]: color
  };
}

/** Overrides preserve Naive's complete common defaults and component theme functions. */
export function resolveNaiveTheme(theme: AdapterTheme): NaiveThemeOverrides {
  const { colors: c, literal, radius, size, mode } = theme;
  const text = c.foreground;
  const secondary = c['muted-foreground'];
  const subdued = opacity(secondary, 0.55);
  const scale = (value: number): string => `${(value * size) / 16}px`;
  return {
    common: {
      ...resolveStatus('primary', c.primary),
      ...resolveStatus('success', c.success),
      ...resolveStatus('warning', c.warning),
      ...resolveStatus('error', c.destructive),
      ...resolveStatus('info', c.info),
      // Naive uses baseColor for solid button labels and checkbox marks.
      baseColor: c['primary-foreground'],
      textColorBase: text,
      textColor1: text,
      textColor2: opacity(text, 0.82),
      textColor3: secondary,
      textColorDisabled: subdued,
      placeholderColor: subdued,
      placeholderColorDisabled: opacity(secondary, 0.4),
      iconColor: secondary,
      iconColorDisabled: subdued,
      iconColorHover: text,
      iconColorPressed: secondary,
      closeIconColor: secondary,
      closeIconColorHover: text,
      closeIconColorPressed: secondary,
      closeColorHover: c.muted,
      closeColorPressed: opacity(c.muted, 0.8),
      clearColor: secondary,
      clearColorHover: text,
      clearColorPressed: secondary,
      scrollbarColor: opacity(secondary, 0.3),
      scrollbarColorHover: opacity(secondary, 0.5),
      progressRailColor: c.muted,
      railColor: c.muted,
      bodyColor: c.background,
      cardColor: c.card,
      tableColor: c.card,
      modalColor: c.popover,
      popoverColor: c.popover,
      borderColor: c.border,
      dividerColor: opacity(c.border, 0.6),
      hoverColor: c.muted,
      pressedColor: mix(c.muted, text, 0.08),
      actionColor: c.muted,
      tagColor: c.muted,
      avatarColor: c.muted,
      invertedColor: mode === 'dark' ? '#000' : c.foreground,
      inputColor: c.card,
      inputColorDisabled: opacity(c.muted, 0.6),
      codeColor: c.muted,
      tabColor: c.card,
      tableHeaderColor: c.muted,
      tableColorHover: c.muted,
      tableColorStriped: opacity(c.muted, 0.5),
      buttonColor2: c.muted,
      buttonColor2Hover: mix(c.muted, text, 0.06),
      buttonColor2Pressed: mix(c.muted, text, 0.1),
      boxShadow1: `0 2px 8px ${opacity(c.mask, 0.24)}`,
      boxShadow2: `0 4px 16px ${opacity(c.mask, 0.32)}`,
      boxShadow3: `0 8px 32px ${opacity(c.mask, 0.4)}`,
      borderRadius: radius.md,
      borderRadiusSmall: radius.sm,
      fontFamily: literal['font-sans'],
      fontFamilyMono: literal['font-mono'],
      fontSize: scale(14),
      fontSizeMini: scale(12),
      fontSizeTiny: scale(12),
      fontSizeSmall: scale(14),
      fontSizeMedium: scale(14),
      fontSizeLarge: scale(15),
      fontSizeHuge: scale(16),
      heightMini: scale(16),
      heightTiny: scale(22),
      heightSmall: scale(28),
      heightMedium: scale(34),
      heightLarge: scale(40),
      heightHuge: scale(46)
    },
    // The default self function composites baseColor with black, which cannot
    // represent a custom solid-label foreground and a readable tooltip at once.
    Button: {
      ...resolveButtonForeground('Success', c['success-foreground']),
      ...resolveButtonForeground('Warning', c['warning-foreground']),
      ...resolveButtonForeground('Error', c['destructive-foreground']),
      ...resolveButtonForeground('Info', c['info-foreground'])
    },
    Tooltip: { color: c.popover, textColor: c['popover-foreground'] },
    // baseColor also backs solid labels, so surface consumers need separate values.
    Alert: {
      colorInfo: mix(c.card, c.info, 0.08),
      colorSuccess: mix(c.card, c.success, 0.08),
      colorWarning: mix(c.card, c.warning, 0.08),
      colorError: mix(c.card, c.destructive, 0.08),
      borderInfo: `1px solid ${mix(c.card, c.info, 0.25)}`,
      borderSuccess: `1px solid ${mix(c.card, c.success, 0.25)}`,
      borderWarning: `1px solid ${mix(c.card, c.warning, 0.33)}`,
      borderError: `1px solid ${mix(c.card, c.destructive, 0.25)}`
    },
    Checkbox: { color: c.card },
    Radio: { color: c.card, buttonColor: c.card, buttonColorActive: c.card },
    Tabs: { tabColorSegment: c.card },
    Layout: { siderToggleButtonColor: c.card },
    Tag: { colorBordered: c.muted }
  };
}
