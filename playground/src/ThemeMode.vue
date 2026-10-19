<script setup lang="ts">
import { watch } from 'vue';
import type { ThemeModePreference } from '@vean/theme';
import { useTheme } from '@vean/ui';

defineOptions({ name: 'ThemeMode' });

const props = defineProps<{ mode: ThemeModePreference }>();
const { setMode } = useTheme();

watch(() => props.mode, setMode, { immediate: true });
</script>

<template><slot /></template>
