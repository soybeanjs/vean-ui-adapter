import { describe, expect, it } from 'vite-plus/test';
import { resolveAdapterTheme } from '../shared/theme';
import { resolveAntTheme } from './shared';

describe('Ant Design Vue explicit tokens', () => {
  it.each(['light', 'dark'] as const)('covers every semantic state in %s mode', mode => {
    const source = resolveAdapterTheme({}, mode);
    const { token } = resolveAntTheme(source);
    ['Primary', 'Success', 'Warning', 'Error', 'Info'].forEach(status => {
      ['', 'Bg', 'BgHover', 'Border', 'BorderHover', 'Hover', 'Active', 'TextHover', 'Text', 'TextActive'].forEach(
        state => {
          expect(token[`color${status}${state}`]).toBeTruthy();
        }
      );
    });
    expect(token.colorBgContainer).toBe(source.colors.card);
    expect(token.colorBgElevated).toBe(source.colors.popover);
    expect(token.colorBgMask).toBe(source.colors.mask);
    expect(token.colorTextLightSolid).toBe(source.colors['primary-foreground']);
  });

  it('changes tinted backgrounds with the mode instead of retaining light derived tokens', () => {
    const light = resolveAntTheme(resolveAdapterTheme({}, 'light')).token;
    const dark = resolveAntTheme(resolveAdapterTheme({}, 'dark')).token;
    expect(dark.colorPrimaryBg).not.toBe(light.colorPrimaryBg);
    expect(dark.colorErrorBg).not.toBe(light.colorErrorBg);
  });
});
