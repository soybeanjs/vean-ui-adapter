<script setup lang="ts">
import { ref } from 'vue';
import { NAlert, NButton, NCard, NCheckbox, NDataTable, NInput, NRadio, NSelect, NTag, NTooltip } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { ThemeAdapter } from '../../../src/naive-ui';
import { compareProjects, getMemberKey, members } from './shared';
import type { Member } from './types';

defineOptions({ name: 'NaiveDemo' });
const text = ref('Soybean');
const selected = ref('vue');
const columns: DataTableColumns<Member> = [
  { type: 'selection' },
  { title: '成员', key: 'name' },
  { title: '角色', key: 'role' },
  { title: '项目数', key: 'projects', sorter: compareProjects },
  { title: '状态', key: 'status' }
];
const options = [
  { label: 'Vue', value: 'vue' },
  { label: 'TypeScript', value: 'ts' }
];
</script>

<template>
  <ThemeAdapter>
    <NCard title="Naive UI">
      <div class="demo-stack">
        <div class="demo-actions">
          <NButton type="primary">主要操作</NButton>
          <NButton type="success">成功</NButton>
          <NButton type="error">危险</NButton>
          <NButton disabled>禁用</NButton>
        </div>
        <NInput v-model:value="text" aria-label="Naive UI 输入" />
        <NSelect v-model:value="selected" :options="options" aria-label="Naive UI 选择" />
        <div class="demo-actions">
          <NTag type="primary">主题同步</NTag>
          <NTag>默认标签</NTag>
          <NCheckbox>复选框</NCheckbox>
          <NRadio>单选框</NRadio>
          <NTooltip>
            <template #trigger><NButton>提示</NButton></template>
            跟随浮层主题
          </NTooltip>
        </div>
        <NAlert type="info" title="主题已同步">表面与反馈色保持配对</NAlert>
        <div class="member-table">
          <NDataTable
            :data="members"
            :columns="columns"
            :row-key="getMemberKey"
            :scroll-x="480"
            striped
            size="small"
            aria-label="Naive UI 成员表格"
          />
        </div>
      </div>
    </NCard>
  </ThemeAdapter>
</template>
