<script setup lang="ts">
import type { VNode } from 'vue';
import { useAdapterTheme } from '../shared/context';
import { useAdapterStyle } from '../shared/style';
import { resolveElementVariables } from './shared';

defineOptions({ name: 'ThemeAdapter', inheritAttrs: false });

defineSlots<{ default?: () => VNode[] }>();

const theme = useAdapterTheme();

useAdapterStyle('element-plus', theme, resolveElementVariables);
</script>

<template>
  <slot />
</template>
