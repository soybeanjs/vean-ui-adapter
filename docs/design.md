# vean-ui-adapter 设计规范

把 `@vean/ui` 的主题（语义色、色阶、圆角、字体、密度、明暗模式）单向映射到其他 Vue UI 组件库，让 `SConfigProvider` 成为唯一主题源。

状态：草案，待实现。

---

## 1. 目标与非目标

### 目标

1. 每个目标库一个 `ThemeAdapter` 组件，子路径导出。把它放进 `<SConfigProvider>` 里面包住应用，该库整体跟随 vean 的主题。
2. 跟随的维度：主色、语义色（success / warning / danger / info）、色阶（hover / active / 浅底）、中性色（背景 / 文字 / 边框 / 填充）、圆角阶梯、字体族、明暗模式。
3. 五个库：`element-plus`、`naive-ui`、`ant-design-vue`、`antdv-next`、`@arco-design/web-vue`。
4. 目标库是**可选 peer**，没装不报错，只降级。
5. **组件零配置**：主题全部来自 `SConfigProvider`，适配器不接受任何主题相关 props。

### 非目标

- 不做反向适配（其他库主题 → vean）。
- 不改目标库的组件结构、不覆盖组件级样式。
- 不做组件级 props 映射（`SButton` 的 props 不会传给 `el-button`）。
- 不做 CSS-in-JS 运行时插件接管（antdv 的 `StyleProvider`）。

---

## 2. 五个库的注入机制（决定了架构）

| 库                     | 注入方式                  | 载体                      | 暗色入口                    | 纯 CSS 覆盖 |
| ---------------------- | ------------------------- | ------------------------- | --------------------------- | ----------- |
| element-plus           | CSS 变量                  | `:root` / 任意容器       | `html.dark`                 | 全量        |
| @arco-design/web-vue   | CSS 变量（裸 rgb 三元组） | `body`                    | `body[arco-theme='dark']`   | 全量        |
| ant-design-vue         | JS token 对象             | `<a-config-provider>`     | 算法或显式 alias token      | 部分        |
| antdv-next             | 同上                      | `<a-config-provider>`     | 同上                        | 部分        |
| naive-ui               | 纯 JS 对象，无 CSS 变量   | `<n-config-provider>`     | `theme` 对象                | 不能        |

结论：**两类通道并存**——CSS 变量通道（element-plus、arco）和 JS 主题对象通道（naive-ui、antdv 系）。同一套 core 产出两种载荷。

---

## 3. 核心设计决策

### 决策 1：每个子路径只导出**一个组件**，名字统一为 `ThemeAdapter`，零 props

```ts
// vean-ui-adapter/element-plus   → export { ThemeAdapter }
// vean-ui-adapter/arco           → export { ThemeAdapter }
// vean-ui-adapter/antdv          → export { ThemeAdapter }
// vean-ui-adapter/antdv-next     → export { ThemeAdapter }
// vean-ui-adapter/naive-ui       → export { ThemeAdapter }
```

五个子路径同名导出。用户在 import 时就地重命名，代码里读起来就是该库的适配器：

```ts
import { ThemeAdapter as ElementPlusTheme } from 'vean-ui-adapter/element-plus';
import { ThemeAdapter as NaiveTheme } from 'vean-ui-adapter/naive-ui';
```

组件内部完成全部适配逻辑：读主题 → 算颜色 → 派生色阶 → 注入。

不暴露 composable、不接受 `theme` / `vars` / `library` / `algorithms` 之类的传递口。理由：

- 主题的唯一数据源是 `SConfigProvider`，任何额外传参都是第二个数据源。
- 适配器的价值就是「放进去就好」。多一个参数就多一处用户能配错的地方。
- 名字统一后，5 个子路径的对外形状完全一致，用户从 element-plus 换到 arco 只需换 import 路径，模板不用动。

代价：直接 `import { ThemeAdapter } from 'vean-ui-adapter/element-plus'` 两次会命名冲突，必须重命名。五个库同时叠加只能这么写，文档里给示例。

### 决策 2：目标库的 ConfigProvider 从**全局注册表**解析，不 `import`

naive-ui 和 antdv 系需要渲染自己的 ConfigProvider 组件。适配器**不 import 它们**，而是从当前实例的 `appContext.components` 里按名字取：

```ts
const { appContext } = getCurrentInstance()!;
const ConfigProvider = appContext.components['NConfigProvider'];   // naive-ui
const ConfigProvider = appContext.components['AConfigProvider'];   // antdv
```

前提：用户已经 `app.use(Naive)` / `app.use(Antd)`（naive-ui 和 antdv 的安装插件都会全局注册全部组件，这是它们文档里的标准用法）。取不到时降级：只渲染 slot，dev 环境打一条警告，不抛错。

理由：
- 任何 `import 'naive-ui'` 在没装库的项目里都会构建失败，optional peer 就失去意义。
- 让用户自己把组件传进来（v1 方案）违反「组件零配置」。
- 全局注册表是 Vue 自带的运行时能力，不需要打包器配合，SSR 下也安全。

element-plus 和 arco 不需要 ConfigProvider，跳过这步。

### 决策 3：不依赖目标库的 `darkTheme` / `darkAlgorithm`，明暗值自己算全

- naive-ui：不传 `darkTheme`，而是构造 `{ name: 'vean-dark', common: { ... } }` 作为 `theme` prop。naive-ui 接受任意 `Theme` 形状的对象，我们直接给出暗色下的完整 `common`。
- antdv 系：不传 `algorithm`，把中性 alias token 全部显式写出（`colorBgContainer` / `colorBgElevated` / `colorText` / `colorBorder` / `colorFill*` …）。ant-design 的算法只负责从 seed 推导 alias，alias 全部给满后算法方向不再影响结果。

理由：`darkTheme` 和 `darkAlgorithm` 都必须 `import` 目标库才能拿到。绕过它们，暗色就和亮色走同一条代码路径，只换数据。

副作用：需要维护两份 alias token 映射（light / dark）。这是可控的，也是确定性的代价。

### 决策 4：单包 + subpath exports

```
vean-ui-adapter                 → core（内部共享，不对外承诺稳定 API）
vean-ui-adapter/element-plus    → ThemeAdapter
vean-ui-adapter/arco            → ThemeAdapter
vean-ui-adapter/antdv           → ThemeAdapter
vean-ui-adapter/antdv-next      → ThemeAdapter
vean-ui-adapter/naive-ui        → ThemeAdapter
```

理由：五个适配共享色阶派生与颜色格式转换，拆包会导致 core 重复发布；subpath 让用户只 load 需要的一份。

### 决策 5：以 `resolveThemeMap` 为唯一数据源

不自己算语义色。core 只做流水线：

```
useTheme().theme                       (ThemeOptions)
  → resolveThemeMap(options)           → ThemeMap（light/dark TokenValue + literal + alpha）
  → resolveThemeColors(options, mode)  → Record<SemanticToken, string>（完整 CSS 颜色）
  → colord 转换格式                     → hex / rgb 三元组 / rgba
  → 各库映射表                          → CSS 变量块 或 theme 对象
```

理由：vean 的主题引擎已经把 palette → semantic → literal 三层解耦。重算一遍必然与 vean 自身的 CSS 漂移（`@vean/theme` 的不变式：JS 解析结果与 CSS 解析结果必须一致）。

### 决策 6：色阶（hover / active / 浅底）用混色派生，不用 vean ramp

| 库           | 派生规则                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| element-plus | 亮色 `light-N` = `mix(white, base, N*10%)`（N=3,5,7,8,9）、`dark-2` = `mix(black, base, 20%)`；暗色反转       |
| arco         | `1..5` / `6` base / `7..10` 三段派生，亮暗方向相反                                                       |
| naive-ui     | `Hover` = `lighten(base, 8%)`、`Pressed` = `darken(base, 12%)`、`Suppl` = `Hover`                          |
| antdv 系     | 只给 seed + alias，色阶由库自己算                                                                        |

理由：各库的色阶服务于各自的交互语义（hover 变浅多少是库的设计语言）。hardcode vean 的 `--primary-50…950` 会让 hover 态在某个色系上跳变。

**暗色方向反转是硬性要求**，见 5.1 / 5.2。

### 决策 7：明暗由 `effectiveMode` 驱动，但暗色块写目标库自己的选择器

```
mode = useTheme().effectiveMode   // 'light' | 'dark'，auto 已解析
```

- CSS 通道：产出 light 块 + dark 块，选择器用目标库自己的约定（`html.dark` / `body[arco-theme='dark']`），不复用 vean 的 `.dark` 类名（两者恰好一致，但不依赖）。
- JS 通道：产出 light / dark 两套对象，组件按 `effectiveMode` 选一套传下去。
- arco 额外：组件在 mode 变化时同步 `document.body.setAttribute('arco-theme', 'dark' | 'light')`，卸载时移除。

---

## 4. 对外 API

### 4.1 用法

```vue
<script setup lang="ts">
import { SConfigProvider } from '@vean/ui';
import { ThemeAdapter } from 'vean-ui-adapter/naive-ui';
</script>

<template>
  <SConfigProvider :theme="{ primary: 'indigo', radius: 'lg' }">
    <ThemeAdapter>
      <App />
    </ThemeAdapter>
  </SConfigProvider>
</template>
```

五库叠加也可以，各自位置任意，只要都在 `SConfigProvider` 内：

```vue
<script setup lang="ts">
import { ThemeAdapter as EpTheme } from 'vean-ui-adapter/element-plus';
import { ThemeAdapter as ArcoTheme } from 'vean-ui-adapter/arco';
import { ThemeAdapter as AntdvTheme } from 'vean-ui-adapter/antdv';
import { ThemeAdapter as NaiveTheme } from 'vean-ui-adapter/naive-ui';
</script>

<template>
  <SConfigProvider :theme="{ primary: 'indigo' }">
    <EpTheme>
      <ArcoTheme>
        <AntdvTheme>
          <NaiveTheme>
            <App />
          </NaiveTheme>
        </AntdvTheme>
      </ArcoTheme>
    </EpTheme>
  </SConfigProvider>
</template>
```

### 4.2 组件契约（五个完全一致）

```ts
defineOptions({ name: 'ThemeAdapter', inheritAttrs: false });
defineSlots<{ default?: () => VNode[] }>();
```

- 零 props。
- 一个默认 slot，透传所有子节点。
- 内部 `useTheme()` 读不到 `UiThemeContext` 时（没包在 `SConfigProvider` 里）：dev 警告 + 纯透传。

### 4.3 core 出口（`vean-ui-adapter`）

只放跨适配器共享的纯函数，标 `@internal`，不承诺稳定 API：

```ts
export { resolveAdapterTheme } from './shared/use-adapter-theme';  // { mode, colors, literal, alpha }
export { deriveScale } from './shared/scale';                      // 混色色阶
export { toHex, toRgbTriplet, toRgba, mix, lighten, darken } from './shared/color';
```

---

## 5. 映射表

记法：`←` 右边是 vean 语义 token（`@vean/theme` 的 `SemanticToken`），`·N%` 表示带透明度 N，`R.x` 表示已解析成具体长度的圆角（见 5.5）。

### 5.1 element-plus（CSS 变量）

| 目标变量                                                        | 来源                                                        |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| `--el-color-primary`                                            | `primary`                                                   |
| `--el-color-primary-light-3/5/7/8/9`                            | 亮：`mix(white, primary, 30/50/70/80/90%)`；暗：`mix(black, primary, 30/50/70/80/90%)` |
| `--el-color-primary-dark-2`                                     | 亮：`mix(black, primary, 20%)`；暗：`mix(white, primary, 20%)` |
| `--el-color-primary-rgb`                                        | `primary` 的 `r,g,b`                                        |
| `--el-color-success*` / `-warning*` / `-danger*` / `-error*` / `-info*` | `success` / `warning` / `destructive`（danger 与 error 同值） / `info`，规则同上 |
| `--el-bg-color`                                                 | `card`                                                      |
| `--el-bg-color-page`                                            | `background`                                                |
| `--el-bg-color-overlay`                                         | `popover`                                                   |
| `--el-text-color-primary`                                       | `foreground`                                                |
| `--el-text-color-regular`                                       | `foreground` ·90%                                           |
| `--el-text-color-secondary`                                     | `muted-foreground`                                          |
| `--el-text-color-placeholder`                                   | `muted-foreground` ·60%                                     |
| `--el-text-color-disabled`                                      | `muted-foreground` ·50%                                     |
| `--el-border-color` / `-light`                                  | `border`                                                    |
| `--el-border-color-lighter` / `-extra-light`                    | `border` ·60% / ·40%                                        |
| `--el-border-color-dark` / `-darker`                            | `mix(black, border, 10%)` / `20%`                           |
| `--el-fill-color` / `-light` / `-lighter` / `-extra-light`      | `muted` / ·80% / ·60% / ·40%                                |
| `--el-fill-color-dark` / `-darker`                              | `mix(black, muted, 8%)` / `16%`                             |
| `--el-fill-color-blank`                                         | `card`                                                      |
| `--el-mask-color`                                               | `mask` ·`alpha.mask`                                        |
| `--el-border-radius-base` / `-small` / `-round` / `-circle`     | `R.md` / `R.sm` / `R.full` / `50%`                          |
| `--el-font-family`                                              | `literal.font-sans`                                         |

暗色块选择器：`html.dark`。

**注意**：element-plus 的暗色变量在 `theme-chalk/dark/css-vars.css` 里，且色阶**方向反转**（亮色 `light-3` 变浅 `#79bbff`，暗色 `light-3` 变深 `#3375b9`）。适配器自己产出 dark 块，不复用那个文件；用户仍可 import 它拿非颜色变量，我们的选择器相同且注入在后，会覆盖。

### 5.2 arco（CSS 变量，值必须是**裸 rgb 三元组**）

arco 内部写 `rgb(var(--arcoblue-6))`，所以输出 `r,g,b` 而不是 `rgb()`。

| 目标变量                                     | 来源                                                       |
| -------------------------------------------- | ---------------------------------------------------------- |
| `--primary-1..10`                            | `primary` 10 级派生                                        |
| `--success-1..10` / `-warning-` / `-danger-` | `success` / `warning` / `destructive`                      |
| `--link-1..10`                               | `primary`                                                  |
| `--color-primary-light-1..4`                 | 亮：`mix(white, primary, [90,72,54,36]%)`；暗：`rgba(primary, [0.2,0.35,0.5,0.65])` |
| `--color-text-1` / `-2` / `-3` / `-4`        | `foreground` / ·70% / `muted-foreground` / ·50%            |
| `--color-bg-1` / `-2` / `-3` / `-4` / `-5`   | `background` / `card` / `card` / `popover` / `popover`     |
| `--color-bg-white` / `--color-bg-popup`      | `card` / `popover`                                         |
| `--color-border` / `-1` / `-2` / `-3` / `-4` | `border` / ·40% / ·60% / `border` / `mix(black, border, 15%)` |
| `--color-fill-1` / `-2` / `-3` / `-4`        | `muted` ·40% / `muted` / `mix(black, muted, 6%)` / `12%`   |
| `--border-radius-none` / `-small` / `-medium` / `-large` / `-circle` | `0` / `R.sm` / `R.md` / `R.lg` / `50%`     |

暗色块选择器：`body[arco-theme='dark']`。

**注意**：arco 暗色下 `1→10` **整条方向反转**（亮色 `arcoblue-1` 最浅 `232,243,255`，暗色 `arcoblue-1` 最深 `0,13,77`）。

- 亮色：`1..5` = `mix(white, base, [90,72,54,36,18]%)`，`6` = base，`7..10` = `mix(black, base, [36,68,86,95]%)`
- 暗色：`1..5` = `mix(black, base, [95,86,68,36,18]%)`，`6` = base，`7..10` = `mix(white, base, [18,36,54,72]%)`

暗色块还需显式重写 `--color-border-1..4`（`rgba(255,255,255,0.04~0.16)`）和 `--color-fill-1..4`，不能只写亮色那套。

### 5.3 ant-design-vue / antdv-next（token 对象）

seed token：

| token                                                                                                | 来源              |
| ---------------------------------------------------------------------------------------------------- | ----------------- |
| `colorPrimary` / `colorSuccess` / `colorWarning` / `colorError` / `colorInfo` / `colorLink`            | 对应语义 token    |
| `colorTextBase` / `colorBgBase`                                                                       | `foreground` / `background`（暗色下也是这两个，值本身不同） |
| `borderRadius` / `borderRadiusSM` / `borderRadiusLG`                                                  | `R.md` / `R.sm` / `R.lg`  |
| `fontFamily` / `fontSize` / `controlHeight`                                                           | `literal.font-sans` / `literal.size` 的 px 数值 / `size × 2` |
| `wireframe`                                                                                           | `false`           |

alias token（**显式给满，替代 `darkAlgorithm`**）：

| token                                                                                                | 来源                                  |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `colorBgContainer` / `colorBgElevated` / `colorBgLayout` / `colorBgSpotlight`                         | `card` / `popover` / `background` / `muted` |
| `colorText` / `colorTextSecondary` / `colorTextTertiary` / `colorTextQuaternary`                      | `foreground` / ·70% / `muted-foreground` / ·55% |
| `colorBorder` / `colorBorderSecondary`                                                                | `border` / `border` ·60%              |
| `colorFill` / `colorFillSecondary` / `colorFillTertiary` / `colorFillQuaternary`                       | `muted` / ·80% / ·60% / ·40%          |
| `colorBgMask`                                                                                        | `mask` ·`alpha.mask`                  |

`theme` 结构：

```ts
{ token: { ...seed, ...alias }, hashed: false }
```

不传 `algorithm`、不传 `cssVar`（antdv 的 `cssVar` 明说不支持 token 间互相引用变量，也没有额外收益）。

### 5.4 naive-ui（`common` 段）

| key                                                                | 来源                                     |
| ------------------------------------------------------------------ | ---------------------------------------- |
| `primaryColor` / `primaryColorHover` / `primaryColorPressed` / `primaryColorSuppl` | `primary` / `lighten 8%` / `darken 12%` / 同 Hover |
| `infoColor*` / `successColor*` / `warningColor*` / `errorColor*`    | 对应语义 token，四态规则同上              |
| `textColorBase`                                                    | 亮 `#000` / 暗 `#fff`                    |
| `textColor1` / `-2` / `-3`                                         | `foreground` / ·82% / `muted-foreground` |
| `bodyColor`                                                        | `background`                             |
| `cardColor` / `tableColor` / `modalColor` / `popoverColor`          | `card`                                   |
| `borderColor` / `dividerColor`                                      | `border` / ·60%                          |
| `hoverColor` / `pressedColor` / `actionColor`                      | `muted` / `mix(black, muted, 8%)` / `muted` ·80% |
| `borderRadius` / `borderRadiusSmall`                               | `R.md` / `R.sm`                          |
| `fontFamily` / `fontSize`                                          | `literal.font-sans` / `literal.size`     |

暗色：不用 `darkTheme`，构造 `theme` prop = `{ name: 'vean-dark', common: <上表的暗色取值> }`。只做 `common` 段，不做组件级 overrides。

### 5.5 圆角解析（所有库共用）

`ThemeMap.literal` 的圆角是 `calc(var(--radius) * 1.25)` 形式，引用 vean 自己的 `--radius`。目标库没有这个变量，直接输出是无效值。

core 必须先解析成具体长度：

```
seed = literal.radius              // 例如 0.625rem
rung(key) = seed × coefficient     // 0.78125rem
```

映射时用 `rung('sm' | 'md' | 'lg')`，不用 literal 里的 `radius-sm` / `radius-lg` 字符串。`radius-none` → `0`，`radius-full` → `9999px` 直接透传。

`size`（`16px`）和字体族本来就是字面量，直接透传。

---

## 6. 文件结构

```
src/
  index.ts                     # core 出口（@internal）
  shared/
    color.ts                   # colord 封装：hsl() 解析 → hex / rgb 三元组 / rgba / mix / lighten / darken
    theme.ts                   # resolveThemeMap / resolveThemeColors 薄封装 + 缓存
    scale.ts                   # 色阶派生（mix / vean-ramp，含暗色方向反转）
    radius.ts                  # calc(var(--radius) * N) → 具体长度
    inject.ts                  # CSS 变量注入：<style> 写入器（SSR 跳过、引用计数、卸载清理）
    resolve-component.ts       # appContext.components 查找 + 未注册警告
    use-adapter-theme.ts       # 通用 composable：{ mode, colors, literal, alpha }
  element-plus/
    index.ts  vars.ts  theme-adapter.vue
  arco/
    index.ts  vars.ts  theme-adapter.vue
  antdv/
    index.ts  tokens.ts  theme-adapter.vue
  antdv-next/
    index.ts  tokens.ts  theme-adapter.vue
  naive-ui/
    index.ts  overrides.ts  theme-adapter.vue
playground/
  src/
    App.vue                    # 五库切换对照页
    demos/
      ElementPlusDemo.vue  ArcoDemo.vue  AntdvDemo.vue
      AntdvNextDemo.vue    NaiveUiDemo.vue
```

没有 `use-theme.ts`：不外露 composable，逻辑就在 `.vue` 组件里 + 同级 `vars.ts` / `tokens.ts` / `overrides.ts` 映射表（纯函数，可单测）。

每个 `index.ts` 就一行：

```ts
// src/element-plus/index.ts
export { default as ThemeAdapter } from './theme-adapter.vue';
```

`package.json` exports：

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./element-plus": { "types": "./dist/element-plus/index.d.ts", "import": "./dist/element-plus/index.js" },
    "./arco": { "types": "./dist/arco/index.d.ts", "import": "./dist/arco/index.js" },
    "./antdv": { "types": "./dist/antdv/index.d.ts", "import": "./dist/antdv/index.js" },
    "./antdv-next": { "types": "./dist/antdv-next/index.d.ts", "import": "./dist/antdv-next/index.js" },
    "./naive-ui": { "types": "./dist/naive-ui/index.d.ts", "import": "./dist/naive-ui/index.js" }
  }
}
```

`vite.config.ts` 的 `pack.entry` 从单入口改为多入口数组。

---

## 7. 依赖策略

```json
{
  "dependencies": {
    "@soybeanjs/colord": "^0.8.1"
  },
  "peerDependencies": {
    "@vean/ui": "^0.50.2",
    "@vean/theme": "^0.50.2",
    "vue": "^3.5.0"
  },
  "peerDependenciesMeta": {
    "element-plus": { "optional": true },
    "naive-ui": { "optional": true },
    "ant-design-vue": { "optional": true },
    "antdv-next": { "optional": true },
    "@arco-design/web-vue": { "optional": true }
  }
}
```

- 目标库只出现在 `peerDependenciesMeta`（optional），不进 `peerDependencies`——避免 pnpm 自动安装。
- 适配层**不用目标库的类型**。每个库自己声明最小结构（`Record<string, string>` / 自定义 `ThemeConfig` 形状）。理由：`import type` 在没装库的项目里仍会报 `TS2307`。
- `@vean/theme` 提为 peer（直接 import 它的 `resolveThemeMap`）。
- `@soybeanjs/colord` 提为 dependency。

---

## 8. 运行时流程

```
<SConfigProvider :theme="...">
  └─ provideThemeContext（vean 自己的 context）
       │
       └─ <ThemeAdapter>                    ← 适配器，零 props
            ├─ useTheme()                   读 base/primary/radius/size/font + effectiveMode
            ├─ resolveThemeMap              → ThemeMap
            ├─ resolveThemeColors(light)     ┐
            ├─ resolveThemeColors(dark)      ┘ 两套完整颜色
            ├─ 色阶派生 + 格式转换（含暗色方向反转）
            │
            ├─ CSS 通道（element-plus / arco）
            │    └─ <style> 注入 light 块 + dark 块 + arco-theme 属性同步
            │    └─ <slot />
            │
            └─ JS 通道（antdv / antdv-next / naive-ui）
                 └─ <component :is="resolveGlobalComponent('AConfigProvider')" :theme="current">
                      <slot />
                    </component>
```

### 生命周期

- 多个适配器实例同时挂载时按引用计数写 `<style>`，最后一个卸载才清理。
- 主题变化只更新 `<style>` 的 textContent，不重建节点（避免样式闪烁、保住 CSS 过渡）。
- 注入的变量带目标库自己的前缀（`--el-` / `--color-`），不污染 vean 的变量。
- SSR：`typeof document === 'undefined'` 时跳过 CSS 注入，只做 JS 通道。

### 降级

| 情况                                | 行为                                              |
| ----------------------------------- | ------------------------------------------------- |
| 没包在 `SConfigProvider` 里          | dev 警告 `[vean-ui-adapter] ... requires SConfigProvider`，纯透传 slot |
| JS 通道取不到 ConfigProvider 组件   | dev 警告 `... target component not registered, call app.use(...)`，纯透传 slot |
| CSS 通道 + SSR                      | 只渲染 slot，不注入                               |

任何降级都不抛错。

---

## 9. 与 vean 自身的冲突点

| 冲突                                            | 处理                                                        |
| ----------------------------------------------- | ----------------------------------------------------------- |
| vean 写 `html.dark`，element-plus 也用 `html.dark` | 恰好一致，可复用。适配器仍独立写一份 dark 块，不依赖顺序  |
| vean 用 `.dark` 类，arco 用 `body[arco-theme='dark']` | 适配器在 mode 变化时同步设置 body 属性，卸载时移除        |
| antdv `hashed` 类名与 vean 的 UnoCSS 原子类可能命中同元素 | 不做处理，写进已知限制                               |
| naive-ui 的 provider 必须在最外层，`SConfigProvider` 也在最外层 | 顺序固定 `SConfigProvider > ThemeAdapter > App`，文档给示例 |

---

## 10. 验证方式

1. **快照测试**（`vp test`）：映射表是纯函数（`ThemeOptions` → vars / token 对象），给固定入参断言输出。色阶派生、暗色方向反转、圆角解析都在这层测。
2. **playground 对照页**：五个库各一个 demo，同一组按钮 / 输入框 / 卡片并排，改 `primary` / `radius` / `mode` 时肉眼确认全部跟随。
3. **降级测试**：不装目标库、不全局注册、不包 `SConfigProvider` 三种情况，都只渲染 slot + 一条警告，不抛错。

验收标准：`primary` 从 `indigo` 改到 `rose`，五个库的主按钮 / 焦点环 / 选中态同时变色；`radius` 从 `md` 改到 `2xl`，圆角同时变大；切暗色，五个库同时变暗，且暗色下的 hover 态比常态更浅（不是更暗）。

---

## 11. 实现分期

| 阶段 | 内容                                                          | 依赖 |
| ---- | ------------------------------------------------------------- | ---- |
| P0   | core：`color.ts` / `theme.ts` / `scale.ts` / `radius.ts` / `inject.ts` + 快照测试 | 无 |
| P1   | element-plus（纯 CSS，规则明确，先跑通注入链路）               | P0   |
| P2   | arco（纯 CSS + `body[arco-theme]` 同步 + 暗色反转）            | P0   |
| P3   | antdv（token 对象 + `resolve-component` + alias 给满）         | P0   |
| P4   | antdv-next（复用 P3，验证差异）                                | P3   |
| P5   | naive-ui（自定义 dark theme 对象）                             | P3   |
| P6   | playground 五库对照页                                          | P1–P5 |

先做 P1 而不是先把五个库的映射表都写完：注入链路（`<style>` 写入、引用计数、SSR 跳过、mode 切换）是所有适配的地基，用最简单的库验证它。

每期交付前跑「三项验收」：`primary` 换色、`radius` 换挡、`mode` 切换各一次，playground 里肉眼确认。色阶方向反转这类错误类型检查和快照测试都能发现，但只看亮色会漏——快照必须同时断言 light 和 dark 两套。

---

## 已知限制

1. **必须全局注册目标库**（`app.use(Naive)` / `app.use(Antd)`）。按需局部 import 组件（`import { NButton } from 'naive-ui'`）而不全局注册时，`resolve-component` 取不到 ConfigProvider，适配器降级为纯透传。
2. naive-ui 无 CSS 变量，只能在 ConfigProvider 层工作，组件级微调不可用。
3. antdv 的 `cssVar` 模式不支持 token 间互相引用，所有颜色必须是完整值。
4. arco 的暗色依赖 `body[arco-theme='dark']`，适配器会自动设置；如果用户自己也改这个属性会打架。
5. 五库内部仍有硬编码颜色（element-plus 的 loading 遮罩、antdv 的渐变），不跟随主题。
6. 不接管 antdv 的 `StyleProvider`。
7. element-plus 暗色色阶反转、arco 暗色 1→10 整条反转，这两处照抄亮色逻辑的症状是「暗色下 hover 比常态更亮」，肉眼容易漏。快照必须断言 dark 全量色阶。
8. antdv-next 与 antdv 4.x 的 `cssVar` / `zeroRuntime` 行为有差异，实现 P4 时先跑 playground，不要假设完全一致。
