<script setup lang="ts">
import { createApp, h, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import type { App, Component } from 'vue';
import type { ThemeModePreference, ThemeOptions } from '@vean/theme';
import { SConfigProvider } from '@vean/ui';
import ThemeMode from './ThemeMode.vue';

defineOptions({ name: 'DemoHost' });

const props = defineProps<{
  demo: Component;
  theme: ThemeOptions;
  mode: ThemeModePreference;
  provider?: Component;
  providerName?: string;
}>();

const container = shallowRef<HTMLElement>();
let demoApp: App | undefined;

onMounted(() => {
  if (!container.value) return;
  demoApp = createApp({
    setup: () => () =>
      h(
        SConfigProvider,
        { theme: props.theme },
        {
          default: () => h(ThemeMode, { mode: props.mode }, { default: () => h(props.demo) })
        }
      )
  });
  if (props.provider && props.providerName) demoApp.component(props.providerName, props.provider);
  demoApp.mount(container.value);
});

onBeforeUnmount(() => demoApp?.unmount());
</script>

<template><div ref="container" class="demo-content" /></template>
