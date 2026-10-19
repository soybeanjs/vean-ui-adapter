<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { resolveProvider, useAdapterTheme } from '../shared/context';
import { resolveAntTheme } from './shared';

defineOptions({ name: 'ThemeAdapter', inheritAttrs: false });

defineSlots<{ default?: () => VNode[] }>();

const theme = useAdapterTheme();
const Provider = theme.value ? resolveProvider(['AConfigProvider', 'a-config-provider']) : undefined;
const adaptedTheme = computed(() => (theme.value ? resolveAntTheme(theme.value) : undefined));
</script>

<template>
  <component :is="Provider" v-if="Provider && adaptedTheme" :theme="adaptedTheme">
    <slot />
  </component>
  <slot v-else />
</template>
