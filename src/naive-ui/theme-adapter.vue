<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { resolveProvider, useAdapterTheme } from '../shared/context';
import { resolveNaiveTheme } from './shared';

defineOptions({ name: 'ThemeAdapter', inheritAttrs: false });

defineSlots<{ default?: () => VNode[] }>();

const theme = useAdapterTheme();
const Provider = theme.value ? resolveProvider(['NConfigProvider', 'n-config-provider']) : undefined;
const adaptedTheme = computed(() => (theme.value ? resolveNaiveTheme(theme.value) : undefined));
</script>

<template>
  <component :is="Provider" v-if="Provider && adaptedTheme" :theme-overrides="adaptedTheme">
    <slot />
  </component>
  <slot v-else />
</template>
