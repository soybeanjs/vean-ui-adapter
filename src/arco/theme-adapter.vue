<script setup lang="ts">
import type { VNode } from 'vue';
import { useAdapterTheme } from '../shared/context';
import { useAdapterStyle } from '../shared/style';
import { resolveArcoVariables } from './shared';

defineOptions({ name: 'ThemeAdapter', inheritAttrs: false });

defineSlots<{ default?: () => VNode[] }>();

const theme = useAdapterTheme();

useAdapterStyle('arco', theme, resolveArcoVariables);
</script>

<template>
  <slot />
</template>
