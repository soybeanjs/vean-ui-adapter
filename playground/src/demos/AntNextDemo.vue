<script setup lang="ts">
import { ref } from 'vue';
import {
  Button as AntButton,
  Card as AntCard,
  ConfigProvider as AntConfigProvider,
  Input as AntInput,
  Select as AntSelect,
  Table as AntTable,
  Tag as AntTag
} from 'antdv-next';
import type { TableProps } from 'antdv-next';
import { ThemeAdapter } from '../../../src/antdv-next';
import { compareProjects, members, tableScroll } from './shared';
import type { Member } from './types';

defineOptions({ name: 'AntNextDemo' });
const text = ref('Soybean');
const selected = ref('vue');
const columns: TableProps<Member>['columns'] = [
  { title: '成员', dataIndex: 'name', key: 'name' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '项目数', dataIndex: 'projects', key: 'projects', sorter: compareProjects },
  { title: '状态', dataIndex: 'status', key: 'status' }
];
const rowSelection: NonNullable<TableProps<Member>['rowSelection']> = {};

const options = [
  { label: 'Vue', value: 'vue' },
  { label: 'TypeScript', value: 'ts' }
];
</script>

<template>
  <AntConfigProvider prefix-cls="next-ant">
    <ThemeAdapter>
      <AntCard title="Antdv Next">
        <div class="demo-stack">
          <div class="demo-actions">
            <AntButton type="primary">主要操作</AntButton>
            <AntButton>次要操作</AntButton>
            <AntButton color="default" variant="solid">实心操作</AntButton>
            <AntButton type="primary" danger>危险</AntButton>
            <AntButton disabled>禁用</AntButton>
          </div>
          <AntInput v-model:value="text" aria-label="Antdv Next 输入" />
          <AntSelect v-model:value="selected" :options="options" aria-label="Antdv Next 选择" />
          <div><AntTag color="processing">主题同步</AntTag></div>
          <div class="member-table">
            <AntTable
              :data-source="members"
              :columns="columns"
              :row-selection="rowSelection"
              :pagination="false"
              :scroll="tableScroll"
              row-key="id"
              size="small"
              aria-label="Antdv Next 成员表格"
            />
          </div>
        </div>
      </AntCard>
    </ThemeAdapter>
  </AntConfigProvider>
</template>
