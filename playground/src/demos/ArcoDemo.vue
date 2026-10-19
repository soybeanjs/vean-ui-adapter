<script setup lang="ts">
import { ref } from 'vue';
import {
  Button as ArButton,
  Card as ArCard,
  Input as ArInput,
  Select as ArSelect,
  Table as ArTable,
  Tag as ArTag
} from '@arco-design/web-vue';
import type { TableColumnData, TableRowSelection } from '@arco-design/web-vue';
import { ThemeAdapter } from '../../../src/arco';
import { members, tableScroll } from './shared';

defineOptions({ name: 'ArcoDemo' });
const text = ref('Soybean');
const selected = ref('vue');
const rowSelection: TableRowSelection = { type: 'checkbox', showCheckedAll: true };
const columns: TableColumnData[] = [
  { title: '成员', dataIndex: 'name' },
  { title: '角色', dataIndex: 'role' },
  { title: '项目数', dataIndex: 'projects', sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '状态', dataIndex: 'status' }
];
const options = [
  { label: 'Vue', value: 'vue' },
  { label: 'TypeScript', value: 'ts' }
];
</script>

<template>
  <ThemeAdapter>
    <ArCard title="Arco Design">
      <div class="demo-stack">
        <div class="demo-actions">
          <ArButton type="primary">主要操作</ArButton>
          <ArButton type="primary" status="success">成功</ArButton>
          <ArButton type="primary" status="danger">危险</ArButton>
          <ArButton disabled>禁用</ArButton>
        </div>
        <ArInput v-model="text" aria-label="Arco Design 输入" />
        <ArSelect v-model="selected" :options="options" aria-label="Arco Design 选择" />
        <div><ArTag color="arcoblue">主题同步</ArTag></div>
        <div class="member-table">
          <ArTable
            :data="members"
            :columns="columns"
            :row-selection="rowSelection"
            :pagination="false"
            :scroll="tableScroll"
            row-key="id"
            stripe
            aria-label="Arco Design 成员表格"
          />
        </div>
      </div>
    </ArCard>
  </ThemeAdapter>
</template>
