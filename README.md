# vean-ui-adapter

让业务页中的第三方 Vue 组件跟随 `@vean/ui` 的主题。每个入口只有一个零 props 的 `ThemeAdapter`，主题唯一来源是上层 `SConfigProvider`。

支持 Element Plus、Arco Design Vue、Ant Design Vue、antdv-next、Naive UI。需求背景、设计取舍和验收方案见 [设计文档](./docs/design.md)。

## 接入

安装本包及 `vue`、`@vean/ui`、`@vean/theme`，按需安装目标组件库。五个目标库均为 optional peer，不会因使用一个适配器而引入其余库。仓库当前为开发版本，尚未发布。

| 目标库          | import 子路径                  | 全局 Provider 注册 |
| --------------- | ------------------------------ | ------------------ |
| Element Plus    | `vean-ui-adapter/element-plus` | 不需要             |
| Arco Design Vue | `vean-ui-adapter/arco`         | 不需要             |
| Ant Design Vue  | `vean-ui-adapter/antdv`        | `AConfigProvider`  |
| antdv-next      | `vean-ui-adapter/antdv-next`   | `AConfigProvider`  |
| Naive UI        | `vean-ui-adapter/naive-ui`     | `NConfigProvider`  |

以 Naive UI 为例，显式注册 Provider 即可，业务组件仍可按需导入：

```ts
// main.ts
import { createApp } from 'vue';
import { NConfigProvider } from 'naive-ui';
import '@vean/ui/styles.css';
import App from './App.vue';

createApp(App).component('NConfigProvider', NConfigProvider).mount('#app');
```

```vue
<script setup lang="ts">
import { SConfigProvider } from '@vean/ui';
import { NButton } from 'naive-ui';
import { ThemeAdapter } from 'vean-ui-adapter/naive-ui';
</script>

<template>
  <SConfigProvider :theme="{ primary: 'indigo', radius: 'md' }">
    <ThemeAdapter>
      <NButton type="primary">保存</NButton>
    </ThemeAdapter>
  </SConfigProvider>
</template>
```

Ant 系将对应库导出的 `ConfigProvider` 注册为 `AConfigProvider`。使用该库的 `app.use(...)` 安装方式也可，但不要在同一个 app 中将两套 Ant 注册到同名 Provider。

Element Plus 与 Arco 需在应用入口导入各自基础样式：

```ts
// 使用 Arco 时：
import '@arco-design/web-vue/dist/arco.css';
import 'element-plus/dist/index.css';
```

明暗由 `useTheme().setMode('light' | 'dark' | 'auto')` 或 Vean 的主题切换组件控制。适配器自动跟随 `effectiveMode`。不要给 `ThemeAdapter` 传递主题 props；字体、反馈色及自定义语义覆盖均设置在 `SConfigProvider` 上。

## 能力边界

- Element/Arco 写入全局 CSS 变量，适用于全局主题。多个同库实例同时存在时，最后挂载者生效；卸载后恢复前一个实例。Arco 的 `arco-theme` 属性会恢复为接入前的值。
- Element 的可用字号/尺寸变量跟随主题，但 Button 等 Sass 固定高度保持库默认值。Arco 字号、控件高度为固定 px，本版不覆盖组件样式，无法整体跟随密度。
- 字号与可映射高度按 `theme.size / 16` 缩放各库自身基准，保留目标库默认的尺寸比例。
- Element/Arco 的实心控件共用一个前景色变量，统一对应 `primary-foreground`，不能分别映射每个反馈色 foreground。
- Naive 以 `themeOverrides.common` 为主，对共用 `baseColor` 造成的前景/背景冲突补充最少的原生组件主题字段；不等同于原生 `darkTheme`，显式局部主题和组件内部硬编码值仍保留库自身规则。
- Ant 两库使用显式主题 token；不接管 `StyleProvider`。组件内部硬编码、内置命名调色板和显式组件 props 优先于全局语义主题。
- JS 通道支持 SSR；CSS 通道在客户端挂载时注入，SSR 只透传内容，不保证首屏无主题闪烁。
- 缺少 `SConfigProvider` 或未注册目标 Provider 时，开发环境告警并透传内容。
- 不做业务组件 API 转发，不暴露内部 composable，不支持自定义 Element/Arco CSS 前缀。

## 开发与验证

```sh
pnpm install
pnpm play
pnpm typecheck
pnpm lint
pnpm test run
pnpm build
```

Playground 通过同一组主色、圆角、字号、明暗控制五个真实组件库。成员表格使用相同数据，可对照行选择、项目数排序、表头及行背景；支持斑马纹的库保留原生样式。两套 Ant 使用独立 Vue app 与独立样式前缀。

测试覆盖颜色格式兼容、alpha、主题覆盖、圆角和尺寸解析、亮暗色阶、真实 Provider 更新、真实组件渲染、SSR、缺依赖降级以及多实例清理。构建产物位于 `dist/`，不提交。
