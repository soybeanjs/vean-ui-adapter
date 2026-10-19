import { afterEach, describe, expect, it } from 'vite-plus/test';
import { defineComponent, h, nextTick } from 'vue';
import type { Component } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { Button as AntButton, ConfigProvider as AntProvider, Input as AntInput } from 'ant-design-vue';
import { NButton, NConfigProvider, NInput } from 'naive-ui';
import { SConfigProvider, useTheme } from '@vean/ui';
import type { ThemeContext } from '@vean/ui';
import { Button as NextButton, ConfigProvider as NextProvider, Input as NextInput } from 'antdv-next';
import NextAdapter from '../antdv-next/theme-adapter.vue';
import AntAdapter from '../antdv/theme-adapter.vue';
import NaiveAdapter from '../naive-ui/theme-adapter.vue';

interface Target {
  name: string;
  adapter: Component;
  provider: Component;
  registration: string;
  button: Component;
  input: Component;
}

const targets: Target[] = [
  {
    name: 'Naive UI',
    adapter: NaiveAdapter,
    provider: NConfigProvider,
    registration: 'NConfigProvider',
    button: NButton,
    input: NInput
  },
  {
    name: 'Ant Design Vue',
    adapter: AntAdapter,
    provider: AntProvider,
    registration: 'AConfigProvider',
    button: AntButton,
    input: AntInput
  },
  {
    name: 'Antdv Next',
    adapter: NextAdapter,
    provider: NextProvider,
    registration: 'AConfigProvider',
    button: NextButton,
    input: NextInput
  }
];

const wrappers: VueWrapper[] = [];

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
});

describe('real target library compatibility', () => {
  it.each(targets)('$name renders and updates inputs and buttons through its actual color parser', async target => {
    let context: ThemeContext | undefined;
    const Content = defineComponent({
      setup() {
        context = useTheme();
        return () =>
          h(target.adapter, null, {
            default: () => [
              h(target.button, { type: 'primary' }, { default: () => 'Primary action' }),
              h(target.input, { placeholder: 'Theme input' })
            ]
          });
      }
    });
    const wrapper = mount(SConfigProvider, {
      props: { customToast: true },
      slots: { default: () => h(Content) },
      global: { components: { [target.registration]: target.provider } }
    });
    wrappers.push(wrapper);
    if (!context) throw new Error('Missing real Vean theme context');

    context.setThemeState({ primary: 'indigo', mode: 'light', radius: 'md', size: 'sm' });
    await nextTick();
    const light = wrapper.html() + document.head.innerHTML;
    expect(wrapper.find('input').attributes('placeholder')).toBe('Theme input');
    expect(wrapper.find('button').text()).toContain('Primary action');

    context.setThemeState({ primary: 'rose', mode: 'dark', radius: '2xl', size: 'lg' });
    await nextTick();
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('button').text()).toContain('Primary action');
    expect(wrapper.html() + document.head.innerHTML).not.toBe(light);
    expect(wrapper.html()).not.toMatch(/NaN|undefinedpx/);

    context.setThemeState({ primary: 'emerald', mode: 'light' });
    await nextTick();
    expect(wrapper.find('input').exists()).toBe(true);
  });
});
