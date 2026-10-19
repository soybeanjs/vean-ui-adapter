<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElCard, ElInput, ElOption, ElSelect, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { ThemeAdapter } from '../../../src/element-plus';
import { members } from './shared';

defineOptions({ name: 'ElementDemo' });
const text = ref('Soybean');
const selected = ref('vue');
</script>

<template>
  <ThemeAdapter>
    <ElCard header="Element Plus" shadow="never">
      <div class="demo-stack">
        <div class="demo-actions">
          <ElButton type="primary">主要操作</ElButton>
          <ElButton type="success">成功</ElButton>
          <ElButton type="danger">危险</ElButton>
          <ElButton disabled>禁用</ElButton>
        </div>
        <ElInput v-model="text" aria-label="Element Plus 输入" />
        <ElSelect v-model="selected" aria-label="Element Plus 选择">
          <ElOption label="Vue" value="vue" />
          <ElOption label="TypeScript" value="ts" />
        </ElSelect>
        <div><ElTag>主题同步</ElTag></div>
        <div class="member-table">
          <ElTable :data="members" row-key="id" stripe highlight-current-row aria-label="Element Plus 成员表格">
            <ElTableColumn type="selection" width="44" />
            <ElTableColumn prop="name" label="成员" min-width="100" />
            <ElTableColumn prop="role" label="角色" min-width="90" />
            <ElTableColumn prop="projects" label="项目数" sortable min-width="100" />
            <ElTableColumn prop="status" label="状态" min-width="90" />
          </ElTable>
        </div>
      </div>
    </ElCard>
  </ThemeAdapter>
</template>
