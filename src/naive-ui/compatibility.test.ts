import { describe, expect, it } from 'vite-plus/test';
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import { NAlert, NButton, NCheckbox, NConfigProvider, NInput, NRadio, NTag, NTooltip } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import { resolveAdapterTheme } from '../shared/theme';
import { resolveNaiveTheme } from './shared';

/** Exercise Naive's real theme functions and ConfigProvider merge, rather than a provider mock. */
describe('Naive component compatibility', () => {
  it('keeps a real tooltip readable when solid labels are black', () => {
    const theme = resolveAdapterTheme({}, 'dark');
    theme.colors['primary-foreground'] = '#000';
    const wrapper = mount(NConfigProvider, {
      props: { themeOverrides: resolveNaiveTheme(theme) },
      slots: {
        default: () =>
          h(
            NTooltip,
            { show: true, to: false },
            {
              trigger: () => h('button', 'Trigger'),
              default: () => 'Tooltip'
            }
          )
      }
    });
    const style = wrapper.find('.n-tooltip').attributes('style');
    expect(style).toContain(`--n-color: ${theme.colors.popover};`);
    expect(style).toContain(`--n-text-color: ${theme.colors['popover-foreground']};`);
    wrapper.unmount();
  });

  it.each(['success', 'warning', 'error', 'info'] as const)(
    'keeps the custom %s foreground across solid button states',
    type => {
      const theme = resolveAdapterTheme({}, 'dark');
      const role = type === 'error' ? 'destructive' : type;
      theme.colors[`${role}-foreground`] = 'rgb(17, 34, 51)';
      const wrapper = mount(NConfigProvider, {
        props: { themeOverrides: resolveNaiveTheme(theme) },
        slots: { default: () => h(NButton, { type }, { default: () => type }) }
      });
      const style = wrapper.find('.n-button').attributes('style');
      ['', '-hover', '-pressed', '-focus', '-disabled'].forEach(state => {
        expect(style).toContain(`--n-text-color${state}: rgb(17, 34, 51);`);
      });
      wrapper.unmount();
    }
  );

  it('keeps dark feedback and unchecked controls on dark surfaces', () => {
    const theme = resolveAdapterTheme({}, 'dark');
    const overrides: GlobalThemeOverrides = resolveNaiveTheme(theme);
    const wrapper = mount(NConfigProvider, {
      props: { themeOverrides: overrides },
      slots: {
        default: () => [
          h(NAlert, { type: 'info' }, { default: () => 'Feedback' }),
          h(NCheckbox),
          h(NRadio),
          h(NTag, { bordered: true }, { default: () => 'Tag' }),
          h(NInput),
          h(NButton, { type: 'primary' }, { default: () => 'Action' })
        ]
      }
    });

    expect(wrapper.find('.n-alert').attributes('style')).toContain(`--n-color: ${overrides.Alert?.colorInfo};`);
    expect(wrapper.find('.n-checkbox').attributes('style')).toContain(`--n-color: ${theme.colors.card};`);
    expect(wrapper.find('.n-radio').attributes('style')).toContain(`--n-color: ${theme.colors.card};`);
    expect(wrapper.find('.n-tag').attributes('style')).toContain(`--n-color: ${theme.colors.muted};`);
    expect(wrapper.find('.n-input').attributes('style')).toContain(`--n-height: ${(theme.size * 34) / 16}px;`);
    expect(wrapper.find('.n-button').attributes('style')).toContain(
      `--n-text-color: ${theme.colors['primary-foreground']};`
    );
    wrapper.unmount();
  });
});
