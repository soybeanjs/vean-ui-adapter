import { describe, expect, it } from 'vite-plus/test';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { ConfigProvider as AntProvider, theme as antTheme } from 'ant-design-vue';
import { ConfigProvider as NextProvider, theme as nextTheme } from 'antdv-next';
import { resolveAntTheme as resolveNextTheme } from '../antdv-next/shared';
import { resolveAntTheme } from './ant-tokens';
import { resolveAdapterTheme } from './theme';

// Exercise the real seed -> map -> alias pipeline: checking the input override
// alone cannot catch aliases generated before or after the adapter's values.
describe('Ant resolved token compatibility', () => {
  it.each(['light', 'dark'] as const)('derives disabled and control aliases from Vean surfaces in %s', mode => {
    const source = resolveAdapterTheme({}, mode);
    const mapped = resolveAntTheme(source);
    const nextMapped = resolveNextTheme(source);
    const verify = (token: {
      colorBgContainerDisabled: string;
      colorTextDisabled: string;
      colorFillContent: string;
      colorFillAlter: string;
      controlItemBgActive: string;
      controlItemBgHover: string;
      colorTextLightSolid: string;
      controlHeightSM: number;
      controlHeightLG: number;
    }): void => {
      expect(token.colorBgContainerDisabled).toBe(mapped.token.colorFillTertiary);
      expect(token.colorTextDisabled).toBe(mapped.token.colorTextQuaternary);
      expect(token.colorFillContent).toBe(mapped.token.colorFillSecondary);
      expect(token.colorFillAlter).toBe(mapped.token.colorFillQuaternary);
      expect(token.controlItemBgActive).toBe(mapped.token.colorPrimaryBg);
      expect(token.controlItemBgHover).toBe(mapped.token.colorFillTertiary);
      expect(token.colorTextLightSolid).toBe(source.colors['primary-foreground']);
      expect(token.controlHeightSM).toBe(Number(mapped.token.controlHeight) * 0.75);
      expect(token.controlHeightLG).toBe(Number(mapped.token.controlHeight) * 1.25);
    };
    const AntProbe = defineComponent({
      setup() {
        const { token } = antTheme.useToken();
        return () => {
          verify(token.value);
          return h('span');
        };
      }
    });
    const ant = mount(AntProvider, { props: { theme: mapped }, slots: { default: () => h(AntProbe) } });
    ant.unmount();
    const NextProbe = defineComponent({
      setup() {
        const { token } = nextTheme.useToken();
        return () => {
          verify(token.value);
          expect(token.value.colorBgSolid).toBe(source.colors.foreground);
          return h('span');
        };
      }
    });
    const next = mount(NextProvider, { props: { theme: nextMapped }, slots: { default: () => h(NextProbe) } });
    next.unmount();
  });

  it('scales every font rung proportionally for custom sizes', () => {
    const base = resolveAdapterTheme({}, 'light');
    const small = resolveAntTheme({ ...base, size: 16 }).token;
    const large = resolveAntTheme({ ...base, size: 20 }).token;
    expect(small.fontSize).toBe(14);
    expect(small.fontSizeSM).toBe(12);
    expect(small.controlHeight).toBe(32);
    expect(large.controlHeight).toBe(40);
    expect(resolveAntTheme({ ...base, size: 17.5 }).token.fontSize).toBe(14 * (17.5 / 16));
    [
      'fontSize',
      'fontSizeSM',
      'fontSizeLG',
      'fontSizeXL',
      'fontSizeHeading1',
      'fontSizeHeading2',
      'fontSizeHeading3',
      'fontSizeHeading4',
      'fontSizeHeading5'
    ].forEach(key => {
      expect(large[key]).toBe(Number(small[key]) * 1.25);
    });
  });
});
