// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';
import { createSSRApp, defineComponent, h } from 'vue';
import { SConfigProvider } from '@vean/ui';
import { renderToString } from 'vue/server-renderer';
import NextAdapter from '../antdv-next/theme-adapter.vue';
import AntAdapter from '../antdv/theme-adapter.vue';
import ArcoAdapter from '../arco/theme-adapter.vue';
import ElementAdapter from '../element-plus/theme-adapter.vue';
import NaiveAdapter from '../naive-ui/theme-adapter.vue';

describe('SSR without browser globals', () => {
  it('renders CSS and JS adapter slots with no document or window', async () => {
    expect(typeof document).toBe('undefined');
    expect(typeof window).toBe('undefined');
    const Provider = defineComponent({
      setup(_, { slots }) {
        return () => h('section', slots.default?.());
      }
    });
    const app = createSSRApp({
      render() {
        return h(
          SConfigProvider,
          { customToast: true, isServer: true },
          {
            default: () =>
              [ElementAdapter, ArcoAdapter, NaiveAdapter, AntAdapter, NextAdapter].map(adapter =>
                h(adapter, null, { default: () => h('span', 'server-content') })
              )
          }
        );
      }
    });
    app.component('NConfigProvider', Provider);
    app.component('AConfigProvider', Provider);
    const html = await renderToString(app);
    expect(html.match(/server-content/g)).toHaveLength(5);
    expect(html).not.toContain('data-vean-adapter');
  });
});
