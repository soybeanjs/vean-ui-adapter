# vean-ui-adapter 设计规范

把 `@vean/ui` 的主题（语义色、色阶、圆角、字体、密度、明暗模式）单向映射到其他 Vue UI 组件库，让 `SConfigProvider` 成为唯一主题源。

状态：P0–P6 已实现；当前映射与验证范围见各节实施注记。

需求依据：[SoybeanAdmin v3.0 路线图 #941](https://github.com/soybeanjs/soybean-admin/issues/941) 与 [v3 方案 §7](https://github.com/soybeanjs/soybean-admin/blob/main/docs/v3.md)（2026-10-18 核实）。路线图点名 naive-ui、element-plus、antdv-next；本仓库按用户确认实现五个库。

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
- 不改目标库的组件结构、不注入组件级 CSS；必要时使用目标库原生组件主题字段修正公共 token 无法表达的语义配对（见 5.4）。
- 不做组件级 props 映射（`SButton` 的 props 不会传给 `el-button`）。
- 不做 CSS-in-JS 运行时插件接管（antdv 的 `StyleProvider`）。

---

## 2. 五个库的注入机制（决定了架构）

| 库                     | 注入方式                  | 载体                      | 暗色入口                    | 纯 CSS 覆盖 |
| ---------------------- | ------------------------- | ------------------------- | --------------------------- | ----------- |
| element-plus         | CSS 变量                     | `:root` / `html.dark` | `html.dark`                 | 全量        |
| @arco-design/web-vue | CSS 变量（调色板为裸 rgb）   | `body`                | `body[arco-theme='dark']`   | 全量        |
| ant-design-vue         | JS token 对象             | `<a-config-provider>`     | 算法或显式 alias token      | 部分        |
| antdv-next             | 同上                      | `<a-config-provider>`     | 同上                        | 部分        |
| naive-ui             | JS 对象，无全局主题 CSS 变量 | `<n-config-provider>` | `themeOverrides` 当前模式值 | 不能        |

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

前提：用户已通过 `app.component('NConfigProvider', NConfigProvider)` / `app.component('AConfigProvider', ConfigProvider)` 显式注册，或通过目标库插件全局注册。也支持对应 kebab-case 名称。取不到时降级：只渲染 slot，dev 环境打一条警告，不抛错。

实施注记：Ant Design Vue 与 antdv-next 的 Provider 都叫 `AConfigProvider`，同一 app 的同名注册不能混用。playground 通过独立子应用隔离两版 Provider 与样式前缀。

理由：

- 任何 `import 'naive-ui'` 在没装库的项目里都会构建失败，optional peer 就失去意义。
- 让用户自己把组件传进来（v1 方案）违反「组件零配置」。
- 全局注册表是 Vue 自带的运行时能力，不需要打包器配合，SSR 下也安全。

element-plus 和 arco 不需要 ConfigProvider，跳过这步。

### 决策 3：不依赖目标库的 `darkTheme` / `darkAlgorithm`，明暗值自己算全

- naive-ui：不传 `darkTheme`，而是通过 `themeOverrides.common` 合并当前模式的颜色、排版和尺寸；不传 `theme.common`，避免整体替换默认 common 后丢失必要字段。少量组件主题字段补足公共 token 的语义冲突（见 5.4）。
- antdv 系：不传 `algorithm`，显式覆盖语义交互色阶与中性 map token（`colorBgContainer` / `colorBgElevated` / `colorText` / `colorBorder` / `colorFill*` …）；库在合并这些覆盖后派生 disabled / fill / control alias，无须重复声明。内置命名调色板独立于语义 token，不由适配器重算。

理由：`darkTheme` 和 `darkAlgorithm` 都必须 `import` 目标库才能拿到。绕过它们，暗色就和亮色走同一条代码路径，只换数据。

副作用：需要维护模式相关映射。这是可控的，也是确定性的代价；不承诺复刻目标库原生 darkTheme / darkAlgorithm 的全部组件差异。

### 决策 4：单包 + subpath exports

```
vean-ui-adapter                 → 空入口（共享实现仅供包内部使用）
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
  → colord 转换格式                     → rgb / rgb 三元组 / rgba
  → 各库映射表                          → CSS 变量块 或 theme 对象
```

理由：vean 的主题引擎已经把 palette → semantic → literal 三层解耦。重算一遍必然与 vean 自身的 CSS 漂移（`@vean/theme` 的不变式：JS 解析结果与 CSS 解析结果必须一致）。

### 决策 6：色阶（hover / active / 浅底）用混色派生，不用 vean ramp

| 库           | 派生规则                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| element-plus | 亮色 `light-N` = `mix(white, base, N*10%)`（N=3,5,7,8,9）、`dark-2` = `mix(black, base, 20%)`；暗色反转       |
| arco         | `1..5` / `6` base / `7..10` 三段派生，亮暗方向相反                                                       |
| naive-ui     | `Hover` = 混白 16%、`Pressed` = 混黑 16%、`Suppl` = 混黑 12%                                            |
| antdv 系     | 显式交互色阶：Hover 混白 16%、Active 混黑 16%；浅底按模式与 card 混色                                   |

理由：各库的色阶服务于各自的交互语义（hover 变浅多少是库的设计语言）。hardcode vean 的 `--primary-50…950` 会让 hover 态在某个色系上跳变。

**CSS 库暗色色阶方向反转是硬性要求**，见 5.1 / 5.2；Ant 与 Naive 保留各自交互规则。

### 决策 7：明暗由 `effectiveMode` 驱动，但暗色块写目标库自己的选择器

```
mode = useTheme().effectiveMode   // 'light' | 'dark'，auto 已解析
```

- CSS 通道：只产出当前 `effectiveMode` 的完整变量块；Element 使用 `:root, html.dark`，Arco 使用 `body, body[arco-theme]`，防止库原生暗色选择器覆盖，也兼容 vean 自定义 darkSelector。
- JS 通道：按 `effectiveMode` 解析当前模式对象并传下去。
- arco 额外：组件在 mode 变化时同步 `document.body.setAttribute('arco-theme', 'dark' | 'light')`，最后卸载时恢复挂载前的原值；外部另行修改过属性时保留外部值。

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

不同库的适配器可以叠加，各自位置任意，只要都在 `SConfigProvider` 内（Ant 两版同名 Provider 需独立 app，不能按此方式混用）：

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

根入口保持空导出；共享纯函数和 composable 只在包内使用，不外露第二套主题 API：

```ts
// src/index.ts
export {};
```

内部实现为 `src/shared/theme.ts`、`color.ts`、`context.ts`、`style.ts`；跨 Ant 两版共用 `ant-tokens.ts`。

---

## 5. 映射表

记法：`←` 右边是 vean 语义 token（`@vean/theme` 的 `SemanticToken`），`·N%` 表示在原 alpha 上再乘 N%，`R.x` 表示已解析成具体长度的圆角（见 5.5）。`resolveThemeColors` 已合成引擎 alpha，不能重复乘 `alpha.mask` / `alpha.border`。混色写法表示目标色与比例；代码统一使用 `mix(base, target, amount)`。

### 5.1 element-plus（CSS 变量）

| 目标变量                                                        | 来源                                                        |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| `--el-color-primary`                                            | `primary`                                                   |
| `--el-color-primary-light-3/5/7/8/9`                                    | 亮：`mix(white, primary, 30/50/70/80/90%)`；暗：`mix(card, primary, 30/50/70/80/90%)` |
| `--el-color-primary-dark-2`                                     | 亮：`mix(black, primary, 20%)`；暗：`mix(white, primary, 20%)` |
| `--el-color-primary-rgb`                                        | `primary` 的 `r,g,b`                                        |
| `--el-color-success*` / `-warning*` / `-danger*` / `-error*` / `-info*` | `success` / `warning` / `destructive`（danger 与 error 同值） / `info`，规则同上 |
| `--el-bg-color`                                                 | `card`                                                      |
| `--el-bg-color-page`                                            | `background`                                                |
| `--el-bg-color-overlay`                                         | `popover`                                                   |
| `--el-text-color-primary`                                       | `foreground`                                                |
| `--el-text-color-regular`                                               | `foreground`                                                                          |
| `--el-text-color-secondary`                                     | `muted-foreground`                                          |
| `--el-text-color-placeholder`                                           | `muted-foreground` ·70%                                                               |
| `--el-text-color-disabled`                                      | `muted-foreground` ·50%                                     |
| `--el-border-color` / `-light`                                          | `border` / `border` ·80%                                                              |
| `--el-border-color-lighter` / `-extra-light`                    | `border` ·60% / ·40%                                        |
| `--el-border-color-dark` / `-darker`                                    | `input` / `input`                                                                     |
| `--el-fill-color` / `-light` / `-lighter` / `-extra-light`              | `secondary` / `muted` / `mix(card, muted, 50%)` / `75%`                               |
| `--el-fill-color-dark` / `-darker`                                      | `accent` / `secondary`                                                                |
| `--el-fill-color-blank`                                         | `card`                                                      |
| `--el-mask-color`                                                       | `card` ·90%                                                                           |
| `--el-border-radius-base` / `-small` / `-round` / `-circle`             | `R.md` / `R.sm` / `R.full` / `100%`                                                   |
| `--el-font-family`                                              | `literal.font-sans`                                         |

实施注记：当前块选择器为 `:root, html.dark`；另覆盖 `--el-color-white`（primary-foreground）、完整 light-1..9、disabled / overlay / mask 变量、字号与可用控件尺寸变量。overlay 取已解析 mask；loading mask 取 card ·90% / ·30%。默认 size=16 时保留库自己的字号 / 尺寸阶梯，按 size/16 缩放；部分组件（如 Button）高度由 Sass 固化，不能跟随全局尺寸变量。

**注意**：element-plus 的暗色变量在 `theme-chalk/dark/css-vars.css` 里，且色阶**方向反转**（亮色 `light-3` 变浅 `#79bbff`，暗色 `light-3` 变深 `#3375b9`）。适配器自己产出当前模式值，不复用那个文件；用户仍可 import 它拿非颜色变量，适配器选择器同时覆盖亮暗入口。暗色浅阶混入 card 表面以保持 Vean 表面一致。

### 5.2 arco（调色板变量为**裸 rgb 三元组**）

arco 内部写 `rgb(var(--arcoblue-6))`，所以调色板输出 `r,g,b` 而不是 `rgb()`；`--color-*` 变量必须是完整颜色。

| 目标变量                                     | 来源                                                       |
| -------------------------------------------- | ---------------------------------------------------------- |
| `--primary-1..10`                            | `primary` 10 级派生                                        |
| `--success-1..10` / `-warning-` / `-danger-` | `success` / `warning` / `destructive`                      |
| `--link-1..10`                               | `primary`                                                  |
| `--color-primary-light-1..4`                 | 亮：`mix(white, primary, [90,72,54,36]%)`；暗：`rgba(primary, [0.2,0.35,0.5,0.65])` |
| `--color-text-1` / `-2` / `-3` / `-4`                                | `foreground` / `foreground` / `muted-foreground` / ·50%                             |
| `--color-bg-1` / `-2` / `-3` / `-4` / `-5`   | `background` / `card` / `card` / `popover` / `popover`     |
| `--color-bg-white` / `--color-bg-popup`      | `card` / `popover`                                         |
| `--color-border` / `-1` / `-2` / `-3` / `-4`                         | `border` / ·75% / `border` / `input` / `ring`                                       |
| `--color-fill-1` / `-2` / `-3` / `-4`                                | `muted` / `secondary` / `accent` / `mix(foreground, accent, 10%)`                   |
| `--border-radius-none` / `-small` / `-medium` / `-large` / `-circle` | `0` / `R.sm` / `R.md` / `R.lg` / `50%`     |

当前块选择器：`body, body[arco-theme]`。实施注记：同时补齐 gray / neutral-1..10、secondary 状态、tooltip / spin / menu / mask 表面；tooltip 使用 primary 与 primary-foreground 配对。Arco 字号和控件高度编译为固定 px，本版不覆盖组件 CSS，因此不能跟随密度；字体族由应用 CSS 继承。

**注意**：arco 暗色下 `1→10` **整条方向反转**（亮色 `arcoblue-1` 最浅 `232,243,255`，暗色 `arcoblue-1` 最深 `0,13,77`）。

- 亮色：`1..5` = `mix(white, base, [90,72,54,36,18]%)`，`6` = base，`7..10` = `mix(black, base, [15,30,45,60]%)`
- 暗色：`1..5` = `mix(card, base, [90,72,54,36,18]%)`，`6` = base，`7..10` = `mix(white, base, [15,30,45,60]%)`

暗色块还需显式重写 `--color-border-1..4` 和 `--color-fill-1..4`，不能只写亮色那套；实现统一取当前模式的 Vean border / input / ring / muted / secondary / accent，不保留库原生白色透明度常量。

### 5.3 ant-design-vue / antdv-next（token 对象）

seed token：

| token                                                                                                | 来源              |
| ---------------------------------------------------------------------------------------------------- | ----------------- |
| `colorPrimary` / `colorSuccess` / `colorWarning` / `colorError` / `colorInfo` / `colorLink`            | 对应语义 token    |
| `colorTextBase` / `colorBgBase`                                                                       | `foreground` / `background`（暗色下也是这两个，值本身不同） |
| `borderRadius` / `borderRadiusSM` / `borderRadiusLG`                                                  | `R.md` / `R.sm` / `R.lg`  |
| `fontFamily` / `fontSize` / `controlHeight`                                                 | `literal.font-sans` / `14 × size/16` / `32 × size/16`       |
| `wireframe`                                                                                           | `false`           |

中性 map / alias token（**显式覆盖模式相关值，替代 `darkAlgorithm`**）：

| token                                                                                                | 来源                                  |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `colorBgContainer` / `colorBgElevated` / `colorBgLayout` / `colorBgSpotlight`    | `card` / `popover` / `background` / `primary`   |
| `colorText` / `colorTextSecondary` / `colorTextTertiary` / `colorTextQuaternary` | `foreground` / ·82% / `muted-foreground` / ·55% |
| `colorBorder` / `colorBorderSecondary`                                                                | `border` / `border` ·60%              |
| `colorFill` / `colorFillSecondary` / `colorFillTertiary` / `colorFillQuaternary`                       | `muted` / ·80% / ·60% / ·40%          |
| `colorBgMask`                                                                    | `mask`                                          |

`theme` 结构：

```ts
{ token: { ...seed, ...alias } }
```

实施注记：保留默认 hashed 隔离。显式按 size/16 缩放各字号与标题阶梯，绕开默认算法的偶数像素取整；行高保留库基准比例。`colorTextLightSolid` 为 primary-foreground；next 额外映射 neutral solid / blur / disabled border / error 背景，Button、Tag 自行按 solid 背景亮度选择黑白前景。

不传 `algorithm`、不传 `cssVar`（antdv 的 `cssVar` 明说不支持 token 间互相引用变量，也没有额外收益）。

### 5.4 naive-ui（`common` 段）

| key                                                                | 来源                                     |
| ------------------------------------------------------------------ | ---------------------------------------- |
| `primaryColor` / `primaryColorHover` / `primaryColorPressed` / `primaryColorSuppl` | `primary` / 混白 16% / 混黑 16% / 混黑 12%       |
| `infoColor*` / `successColor*` / `warningColor*` / `errorColor*`    | 对应语义 token，四态规则同上              |
| `textColorBase`                                                                    | `foreground`                                     |
| `textColor1` / `-2` / `-3`                                         | `foreground` / ·82% / `muted-foreground` |
| `bodyColor`                                                        | `background`                             |
| `cardColor` / `tableColor` / `modalColor` / `popoverColor`                         | `card` / `card` / `popover` / `popover`          |
| `borderColor` / `dividerColor`                                      | `border` / ·60%                          |
| `hoverColor` / `pressedColor` / `actionColor`                                      | `muted` / `mix(foreground, muted, 8%)` / `muted` |
| `borderRadius` / `borderRadiusSmall`                               | `R.md` / `R.sm`                          |
| `fontFamily` / `fontSize`                                                          | `literal.font-sans` / `14 × size/16` px          |

暗色：不用 `darkTheme`，传 `themeOverrides = { common: <上表的当前模式取值>, ...必要组件字段 }`，与库默认 common 合并。common 还覆盖输入、禁用、图标、滚动条、表格、阴影等状态；字号和控件高度按 size/16 缩放，size=16 时保留默认字号 14px / 中号高度 34px。

实施注记：baseColor 同时用于实心前景与部分表面，单个值无法表达不同语义。仅为 Button 各反馈前景、Tooltip 的 popover 配对、Alert 混色表面，以及 Checkbox / Radio / 分段 Tabs / Layout 折叠按钮 / bordered Tag 增加原生组件主题字段；不注入组件 CSS、不复制完整 self 算法。显式 inverted 等局部主题与硬编码值仍遵循目标库自身规则。

### 5.5 圆角解析（所有库共用）

`ThemeMap.literal` 的圆角是 `calc(var(--radius) * 1.25)` 形式，引用 vean 自己的 `--radius`。目标库没有这个变量，直接输出是无效值。

core 必须先解析成具体长度：

```
seed = literal.radius              // 例如 0.625rem
rung(key) = seed × coefficient     // 0.78125rem
```

映射时用 `rung('sm' | 'md' | 'lg')`，不用 literal 里的 `radius-sm` / `radius-lg` 字符串。`radius-none` → `0`，`radius-full` → `9999px` 直接透传。

字体族直接透传。size 为 px/rem 时先解析为 px；rem size 以初始 16px 为基准，JS 圆角 rem 按主题 size 转 px，不读取 DOM，保证 SSR 一致。可映射的尺寸按各库自身默认阶梯乘 size/16，不将所有库字号强制改为 Vean 原值；表格 padding 等原生固定间距保留库默认值。

---

## 6. 文件结构

```
src/
  index.ts                     # 空入口，内部共享实现不对外导出
  shared/
    color.ts                   # colord 格式转换、透明度、混色
    theme.ts                   # resolveThemeMap / resolveThemeColors + 圆角与单位解析
    types.ts                   # 内部最小主题结构
    style.ts                   # CSS 注入、实例所有权、卸载恢复、SSR 跳过
    context.ts                 # 主题 context 与全局 ConfigProvider 解析
    ant-tokens.ts              # 两版 Ant 公共 token 映射
  element-plus/
    index.ts  shared.ts  theme-adapter.vue
  arco/
    index.ts  shared.ts  theme-adapter.vue
  antdv/
    index.ts  shared.ts  theme-adapter.vue
  antdv-next/
    index.ts  shared.ts  theme-adapter.vue
  naive-ui/
    index.ts  shared.ts  theme-adapter.vue
playground/
  src/
    App.vue                    # 五库对照页
    DemoHost.vue               # 独立子应用与 Provider 注册隔离
    demos/
      ElementDemo.vue  ArcoDemo.vue  AntDemo.vue
      AntNextDemo.vue  NaiveDemo.vue
```

没有 `use-theme.ts`：不外露 composable，逻辑就在 `.vue` 组件里 + 同级 `shared.ts` 映射表（纯函数，可单测）。

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
    "vue": "^3.5.44",
    "element-plus": "^2.14.7",
    "naive-ui": "^2.45.3",
    "ant-design-vue": "^4.2.6",
    "antdv-next": "^1.6.0",
    "@arco-design/web-vue": "^2.58.0"
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

- 目标库同时声明在 `peerDependencies` 与 `peerDependenciesMeta`（optional），使可选约束真实生效；仅为 playground 验证安装为 devDependencies。
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
            ├─ resolveThemeColors(effectiveMode) → 当前模式完整颜色
            ├─ 色阶派生 + 格式转换（含暗色方向反转）
            │
            ├─ CSS 通道（element-plus / arco）
            │    └─ <style> 注入当前模式块 + arco-theme 属性同步
            │    └─ <slot />
            │
            └─ JS 通道（antdv / antdv-next / naive-ui）
                 └─ <component :is="Provider" :theme="current">  // Naive 使用 :theme-overrides
                      <slot />
                    </component>
```

### 生命周期

- 每 document / 库一个 `<style>` 和有序实例集合：最后挂载实例拥有全局主题；非所有者更新不抢占，所有者卸载恢复上一实例，最后一个卸载才清理。全局 CSS 无法隔离同库的多个主题。
- 主题变化只更新 `<style>` 的 textContent，不重建节点（避免样式闪烁、保住 CSS 过渡）。
- 注入的变量带目标库自己的前缀（`--el-` / `--color-`），不污染 vean 的变量。
- SSR：CSS 注入只在 onMounted 执行，服务端仅透传 slot；JS 通道可服务端渲染 Provider。CSS 首屏不保证无主题闪烁。

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
| vean 写 `html.dark`，element-plus 也用 `html.dark`              | 当前模式变量同时匹配 `:root, html.dark`，不依赖 vean darkSelector |
| vean 用 `.dark` 类，arco 用 `body[arco-theme='dark']`           | 适配器同步 body 属性，最后卸载恢复原值；保留外部另行修改的值      |
| antdv `hashed` 类名与 vean 的 UnoCSS 原子类可能命中同元素 | 不做处理，写进已知限制                               |
| naive-ui 的 provider 必须在最外层，`SConfigProvider` 也在最外层 | 顺序固定 `SConfigProvider > ThemeAdapter > App`，文档给示例 |

---

## 10. 验证方式

1. **映射断言测试**（`vp test`）：映射表是纯函数（`AdapterTheme` → vars / token 对象），给固定入参断言输出。色阶派生、暗色方向反转、圆角解析都在这层测。
2. **playground 对照页**：五个库各一个 demo，同一组按钮 / 输入框 / 卡片 / Table 并排，改 `primary` / `radius` / `size` / `mode` 时确认支持的维度全部跟随。
3. **降级测试**：不装目标库、不全局注册、不包 `SConfigProvider` 三种情况，都只渲染 slot + 一条警告，不抛错。

验收标准：`primary` 从 `indigo` 改到 `rose`，五个库的主按钮 / 焦点环 / 选中态同时变色；`radius` 从 `md` 改到 `2xl`，圆角同时变大；切暗色，五个库同时变暗，且 CSS 暗色色阶方向正确；Naive / Ant 按各自交互规则。补充真实 Provider / parser、响应式、透明度、单位、所有权恢复与 SSR 测试，运行 typecheck / lint / test / build 并检查产物无目标库 import。

---

## 11. 实现分期

| 阶段 | 内容                                                          | 依赖 |
| ---- | ------------------------------------------------------------- | ---- |
| P0 ✅ | core：`color.ts` / `theme.ts` / `context.ts` / `style.ts` + 映射测试 | 无    |
| P1 ✅ | element-plus（纯 CSS，规则明确，先跑通注入链路）                     | P0    |
| P2 ✅ | arco（纯 CSS + `body[arco-theme]` 同步 + 暗色反转）                  | P0    |
| P3 ✅ | antdv（token 对象 + Provider 解析 + 显式模式映射）                   | P0    |
| P4 ✅ | antdv-next（复用 P3，验证差异）                                      | P3    |
| P5 ✅ | naive-ui（themeOverrides.common + 必要组件字段）                     | P3    |
| P6 ✅ | playground 五库对照页                                                | P1–P5 |

实施顺序保留：先做 P1 而不是先把五个库的映射表都写完，注入链路（`<style>` 写入、引用计数、SSR 跳过、mode 切换）是所有适配的地基，用最简单的库验证它。

每期交付前跑「三项验收」：`primary` 换色、`radius` 换挡、`mode` 切换各一次，playground 里肉眼确认。色阶方向反转这类错误要靠映射测试验证，但只看亮色会漏——映射断言必须覆盖 light 和 dark 两套。

---

## 已知限制

1. **JS 通道必须全局注册目标 Provider**（`app.component(...)` 或目标库插件）。只局部 import 业务组件而不注册 Provider 时，适配器降级为纯透传；CSS 通道无此要求。
2. naive-ui 没有统一的全局主题 CSS 变量，适配通过 ConfigProvider 的 themeOverrides 工作；保留默认 self 算法，少量原生组件主题字段不等同于完整 darkTheme。
3. antdv 的 `cssVar` 模式不支持 token 间互相引用，所有颜色必须是完整值。
4. arco 的暗色依赖 `body[arco-theme='dark']`，适配器会自动设置；如果用户自己也改这个属性会打架。
5. 五库内部仍可能有硬编码颜色或固定算法，不承诺每个局部组件模式都跟随；Element loading 遮罩已通过 mask 变量映射。
6. 不接管 antdv 的 `StyleProvider`。
7. element-plus 暗色色阶反转、arco 暗色 1→10 方向反转，照抄亮色会导致色阶混色方向错误；测试必须断言 dark 全量色阶。
8. antdv-next 与 antdv 4.x 的 `cssVar` / `zeroRuntime` 行为有差异；当前 P4 已以独立 playground 子应用验证，不额外接管这些模式。

9. Element / Arco 共享实心前景变量映射 primary-foreground，无法分别表达每个反馈色 foreground；局部深色 Menu 等复用该变量的场景需通过目标库组件 API 调整。
10. Ant blue / purple 等命名预设色不等同于语义色，不重算其独立调色板；Arco 固定 px 字号 / 高度、Element 部分 Sass 固定尺寸不随密度变化。

验证版本：@vean/ui / @vean/theme 0.50.2，Element Plus 2.14.7，Arco 2.58.0，Ant Design Vue 4.2.6，antdv-next 1.6.0，Naive UI 2.45.3。颜色边界统一使用传统 rgb(r, g, b) / rgba(r, g, b, a)，兼容 Naive seemly；混色前转换为 colord 支持的格式，避免透明色退化。
