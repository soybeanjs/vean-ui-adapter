<script setup lang="ts">
import { computed, ref } from 'vue';
import { ConfigProvider as AntConfigProvider } from 'ant-design-vue';
import { NConfigProvider } from 'naive-ui';
import type { ThemeModePreference, ThemeOptions } from '@vean/theme';
import { ConfigProvider as NextConfigProvider } from 'antdv-next';
import DemoHost from './DemoHost.vue';
import AntDemo from './demos/AntDemo.vue';
import AntNextDemo from './demos/AntNextDemo.vue';
import ArcoDemo from './demos/ArcoDemo.vue';
import ElementDemo from './demos/ElementDemo.vue';
import NaiveDemo from './demos/NaiveDemo.vue';

defineOptions({ name: 'AdapterPlayground' });

const primary = ref<'indigo' | 'rose'>('indigo');
const radius = ref<'md' | '2xl'>('md');
const size = ref<'sm' | 'md' | 'lg'>('md');
const mode = ref<ThemeModePreference>('light');
const theme = computed<ThemeOptions>(() => ({ primary: primary.value, radius: radius.value, size: size.value }));
</script>

<template>
  <main class="playground">
    <header>
      <p class="eyebrow">SOYBEAN · VEAN UI ADAPTER</p>
      <h1>一个主题，五个组件库</h1>
      <p>调整同一份主题，对照五库控件与表格。勾选成员、排序项目数，检查选中态、表头和行背景。</p>
    </header>
    <section class="controls" aria-label="主题控制">
      <label>
        主色
        <select v-model="primary" aria-label="主色">
          <option value="indigo">Indigo</option>
          <option value="rose">Rose</option>
        </select>
      </label>
      <label>
        圆角
        <select v-model="radius" aria-label="圆角">
          <option value="md">md</option>
          <option value="2xl">2xl</option>
        </select>
      </label>
      <label>
        字号
        <select v-model="size" aria-label="字号">
          <option value="sm">sm</option>
          <option value="md">md</option>
          <option value="lg">lg</option>
        </select>
      </label>
      <label>
        明暗
        <select v-model="mode" aria-label="明暗">
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
          <option value="auto">跟随系统</option>
        </select>
      </label>
    </section>
    <section class="demo-grid" aria-label="五库对照">
      <DemoHost data-library="element-plus" :demo="ElementDemo" :theme="theme" :mode="mode" />
      <DemoHost data-library="arco" :demo="ArcoDemo" :theme="theme" :mode="mode" />
      <DemoHost
        data-library="antdv"
        :demo="AntDemo"
        :theme="theme"
        :mode="mode"
        :provider="AntConfigProvider"
        provider-name="AConfigProvider"
      />
      <DemoHost
        data-library="antdv-next"
        :demo="AntNextDemo"
        :theme="theme"
        :mode="mode"
        :provider="NextConfigProvider"
        provider-name="AConfigProvider"
      />
      <DemoHost
        data-library="naive-ui"
        :demo="NaiveDemo"
        :theme="theme"
        :mode="mode"
        :provider="NConfigProvider"
        provider-name="NConfigProvider"
      />
    </section>
  </main>
</template>

<style>
body {
  margin: 0;
  background: #f3f5f9;
  color: #253047;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.playground {
  max-width: 1360px;
  margin: auto;
  padding: 48px 32px;
}
.playground header {
  margin-bottom: 28px;
}
.playground h1 {
  margin: 10px 0;
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.04em;
}
.playground header > p:last-child {
  color: #667085;
  font-size: 14px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #6366f1;
}
.controls {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 20px 24px;
  margin-bottom: 24px;
  background: #fff;
  border: 1px solid #e4e7ef;
  border-radius: 14px;
}
.controls label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 550;
}
.controls select {
  min-width: 100px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  background: #fff;
  color: #253047;
  font: inherit;
}
.demo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.demo-content {
  min-width: 0;
}
.demo-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.demo-actions > button {
  margin-left: 0;
}
.member-table {
  min-width: 0;
  max-width: 100%;
  overflow: auto;
}
@media (max-width: 800px) {
  .playground {
    padding: 28px 16px;
  }
  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
