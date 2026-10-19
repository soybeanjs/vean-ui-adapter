import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import type { Component, PropType } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { SConfigProvider, useTheme } from '@vean/ui';
import type { ThemeContext, ThemeSettingsState } from '@vean/ui';
import { renderToString } from 'vue/server-renderer';
import NextAdapter from '../antdv-next/theme-adapter.vue';
import AntAdapter from '../antdv/theme-adapter.vue';
import ArcoAdapter from '../arco/theme-adapter.vue';
import ElementAdapter from '../element-plus/theme-adapter.vue';
import NaiveAdapter from '../naive-ui/theme-adapter.vue';

interface TestPayload {
  common?: Record<string, string>;
  token?: Record<string, string | number | boolean>;
}

const TestProvider = defineComponent({
  props: {
    theme: Object as PropType<TestPayload>,
    themeOverrides: Object as PropType<TestPayload>
  },
  setup(_, { slots }) {
    return () => h('section', slots.default?.());
  }
});

const mounted: VueWrapper[] = [];

function mountAdapter(adapter: Component, components: Record<string, Component> = {}) {
  let context: ThemeContext | undefined;
  const Child = defineComponent({
    setup() {
      context = useTheme();
      return () => h(adapter, null, { default: () => h('span', 'content') });
    }
  });
  const wrapper = mount(SConfigProvider, {
    props: { customToast: true },
    slots: { default: () => h(Child) },
    global: { components }
  });
  mounted.push(wrapper);

  async function setTheme(state: ThemeSettingsState): Promise<void> {
    if (!context) throw new Error('Theme context was not provided');
    context.setThemeState(state);
    await nextTick();
  }

  return { wrapper, setTheme };
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount());
  document.body.removeAttribute('arco-theme');
  vi.restoreAllMocks();
});

describe('zero-prop adapter runtime', () => {
  it.each([
    { name: 'Naive', adapter: NaiveAdapter, registration: 'NConfigProvider', prop: 'themeOverrides' as const },
    { name: 'AntDV', adapter: AntAdapter, registration: 'AConfigProvider', prop: 'theme' as const },
    { name: 'Next', adapter: NextAdapter, registration: 'AConfigProvider', prop: 'theme' as const }
  ])('$name updates its registered provider from the real Vean context', async ({ adapter, registration, prop }) => {
    const { wrapper, setTheme } = mountAdapter(adapter, { [registration]: TestProvider });
    await setTheme({ primary: 'indigo', mode: 'light', radius: 'md', size: 'sm' });
    const provider = wrapper.findComponent(TestProvider);
    const before = provider.props(prop);
    await setTheme({ primary: 'rose', mode: 'dark', radius: '2xl', size: 'lg' });
    const after = provider.props(prop);
    expect(after).not.toEqual(before);
    expect(wrapper.text()).toBe('content');
    if (prop === 'themeOverrides') {
      expect(after?.common?.primaryColor).not.toBe(before?.common?.primaryColor);
      expect(after?.common?.bodyColor).not.toBe(before?.common?.bodyColor);
      expect(after?.common?.borderRadius).not.toBe(before?.common?.borderRadius);
      expect(after?.common?.heightMedium).not.toBe(before?.common?.heightMedium);
    } else {
      expect(after?.token?.colorPrimary).not.toBe(before?.token?.colorPrimary);
      expect(after?.token?.colorBgContainer).not.toBe(before?.token?.colorBgContainer);
      expect(after?.token?.borderRadius).not.toBe(before?.token?.borderRadius);
      expect(after?.token?.controlHeight).not.toBe(before?.token?.controlHeight);
    }
  });

  it.each([ElementAdapter, ArcoAdapter, NaiveAdapter, AntAdapter, NextAdapter])(
    'passes content through without SConfigProvider',
    adapter => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const wrapper = mount(adapter, { slots: { default: '<span>fallback</span>' } });
      mounted.push(wrapper);
      expect(wrapper.text()).toBe('fallback');
      expect(document.querySelector('style[data-vean-adapter]')).toBeNull();
      expect(warning.mock.calls.some(([message]) => String(message).includes('requires SConfigProvider'))).toBe(true);
    }
  );

  it.each([NaiveAdapter, AntAdapter, NextAdapter])(
    'passes content through when the target provider is not registered',
    adapter => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { wrapper } = mountAdapter(adapter);
      expect(wrapper.text()).toBe('content');
      expect(wrapper.find('section').exists()).toBe(false);
    }
  );
});

describe('CSS ownership', () => {
  it('keeps the latest mounted owner active and restores an earlier owner on release', async () => {
    document.body.setAttribute('arco-theme', 'original');
    const first = mountAdapter(ArcoAdapter);
    await first.setTheme({ primary: 'indigo', mode: 'light' });
    const style = document.querySelector('style[data-vean-adapter="arco"]');
    const initial = style?.textContent;
    const second = mountAdapter(ArcoAdapter);
    await second.setTheme({ primary: 'rose', mode: 'dark' });
    const active = style?.textContent;
    expect(active).not.toBe(initial);
    expect(document.body.getAttribute('arco-theme')).toBe('dark');
    await first.setTheme({ primary: 'emerald', mode: 'light' });
    expect(style?.textContent).toBe(active);
    expect(document.body.getAttribute('arco-theme')).toBe('dark');
    second.wrapper.unmount();
    expect(document.querySelector('style[data-vean-adapter="arco"]')).toBe(style);
    expect(style?.textContent).not.toBe(initial);
    expect(document.body.getAttribute('arco-theme')).toBe('light');
    first.wrapper.unmount();
    expect(document.querySelector('style[data-vean-adapter="arco"]')).toBeNull();
    expect(document.body.getAttribute('arco-theme')).toBe('original');
  });

  it('preserves an external body attribute change made while mounted', async () => {
    const { wrapper, setTheme } = mountAdapter(ArcoAdapter);
    await setTheme({ mode: 'dark' });
    document.body.setAttribute('arco-theme', 'external');
    wrapper.unmount();
    expect(document.body.getAttribute('arco-theme')).toBe('external');
  });

  it('updates an existing Element style node and removes it only after the last owner', async () => {
    const first = mountAdapter(ElementAdapter);
    const style = document.querySelector('style[data-vean-adapter="element-plus"]');
    const before = style?.textContent;
    await first.setTheme({ mode: 'dark', primary: 'rose' });
    expect(document.querySelector('style[data-vean-adapter="element-plus"]')).toBe(style);
    expect(style?.textContent).not.toBe(before);
    const second = mountAdapter(ElementAdapter);
    first.wrapper.unmount();
    expect(document.querySelector('style[data-vean-adapter="element-plus"]')).toBe(style);
    second.wrapper.unmount();
    expect(document.querySelector('style[data-vean-adapter="element-plus"]')).toBeNull();
  });
});

describe('server rendering', () => {
  it('renders all adapters without mutating DOM styles or Arco attributes', async () => {
    const head = document.head.innerHTML;
    const attribute = document.body.getAttribute('arco-theme');
    const app = createSSRApp({
      render() {
        return h(
          SConfigProvider,
          { isServer: true, customToast: true },
          {
            default: () =>
              [ElementAdapter, ArcoAdapter, NaiveAdapter, AntAdapter, NextAdapter].map(adapter =>
                h(adapter, null, { default: () => h('span', 'server') })
              )
          }
        );
      }
    });
    app.component('NConfigProvider', TestProvider);
    app.component('AConfigProvider', TestProvider);
    const html = await renderToString(app);
    expect(html.match(/server/g)).toHaveLength(5);
    expect(document.head.innerHTML).toBe(head);
    expect(document.body.getAttribute('arco-theme')).toBe(attribute);
  });
});
