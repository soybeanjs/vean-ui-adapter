# vean-ui-adapter

把 `@vean/ui` 适配到其他框架/场景的中间层包。Vue 3 + TypeScript，构建走 `vite-plus`。

## 项目定位

把 `@vean/ui` 的主题（语义色、色阶、圆角、字体、密度、明暗模式）单向映射到其他 Vue UI 组件库，让 `SConfigProvider` 成为唯一主题源。

目标库（五选一，按需）：`element-plus`、`@arco-design/web-vue`、`ant-design-vue`、`antdv-next`、`naive-ui`。

关键约束（详见 `docs/design.md`）：

- 每个子路径只导出一个名为 `ThemeAdapter` 的组件，**零 props**，适配逻辑全在组件内。五个子路径同名导出，用户 import 时就地重命名（`import { ThemeAdapter as EpTheme } from 'vean-ui-adapter/element-plus'`）。
- 主题唯一来源是 `SConfigProvider`，适配器不接任何主题相关 props，不外露 composable。
- 目标库全部是 optional peer，适配代码**不 import 任何目标库**。需要 ConfigProvider 的库（naive-ui、antdv 系）从 `appContext.components` 按名字解析，要求用户已 `app.use(...)` 全局注册。
- 目标库的类型也不用，各适配器自己声明最小结构，避免没装库的项目报 `TS2307`。
- 唯一数据源是 `@vean/theme` 的 `resolveThemeMap` / `resolveThemeColors`，不自己算语义色。
- 不依赖目标库的 `darkTheme` / `darkAlgorithm`（需要 import 才能拿到），明暗两套值自己算全。

## 命令

| 命令             | 作用                                 |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | `vp pack --watch`，构建监听          |
| `pnpm play`      | `vp dev`，起 `playground/` 调试页面  |
| `pnpm build`     | `vp pack`，产物到 `dist/`            |
| `pnpm typecheck` | `tsc --noEmit --skipLibCheck`        |
| `pnpm lint`      | `vp lint --fix` + ESLint 检查 `.vue` |
| `pnpm fmt`       | `vp fmt` 格式化                      |
| `pnpm test`      | `vp test`                            |
| `pnpm upkg`      | `soy ncu` 交互式升级依赖             |

## 目录

- `naive-ui/`、`antdv/`、`antdv-next/` 下各有 `theme-adapter.vue`（组件名均为 `ThemeAdapter`）+ `index.ts` 单行重导出。
- `playground/`：Vite 调试应用（`root: './playground'`），验证组件用这里，不新增测试脚手架。
- `docs/design.md`：多 UI 库主题适配的设计规范。改架构、加适配库、改映射表之前先读它，实现与文档不一致时改文档或改代码，不要两边都放着。
- `dist/`：构建产物，不提交。

## 前置：安装协作技能（强制）

本文件引用的技能包必须在本机全局存在，否则规范无法生效。新协作者第一次上手先跑：

```bash
npx skills add soybeanjs/skills -g -a '*'
npx skills add soybeanjs/vean-ui -g -a '*'
```

第一条安装到 `~/.agents/skills/` 并软链接到各 agent 目录，提供 `vue-sfc-structure`、`typescript-functional-style`、`pnpm-deps-upgrade`、`soybean-standard-projects`；第二条提供 `vean-ui` / `vean-aria` 组件文档技能。

安装失败项里出现 `Eve` / `PromptScript: does not support global skill installation` 可以忽略，不影响本机使用。

校验是否已装：

```bash
npx skills list | grep -E 'vue-sfc-structure|typescript-functional-style|pnpm-deps-upgrade|vean-ui'
```

缺哪个就重跑对应的 `npx skills add`，不要跳过规范直接凭记忆写。

## 编码规范（强制）

写代码前先读对应技能文件，它们优先于本文件的概括：

1. **`.vue` 文件** → `~/.agents/skills/vue-sfc-structure/SKILL.md`
   - `script setup` 严格按顺序：imports → `defineOptions` → props 类型 → `defineProps` → emits 类型 → `defineEmits` → slots 类型 → `defineSlots` → hooks → 业务逻辑 → init → context → watch → 生命周期 → `defineExpose`。
   - 模板里直接用 prop 名，不写 `props.xxx`。

2. **`.ts` / `.tsx` / `.js` / `.jsx`**（含 `<script setup>` 内的 TS）→ `~/.agents/skills/typescript-functional-style/SKILL.md`
   - 纯函数优先，禁止 class（外部 API 强制除外）；能用 `map`/`filter`/`find` 就不手写循环；guard clause + early return 压嵌套。
   - 只服务当前模块的纯函数放同级 `shared.ts`；跨模块复用放全局 shared 目录。

3. **语言约定**
   - TypeScript `strict: true`，不用 `any`；不用 `as` 收窄可推导的类型。
   - 字符串用单引号；类型定义就近，简单类型写在文件内，多处复用提取到同级 `types.ts`。

## 依赖升级（强制）

升级依赖一律走 `~/.agents/skills/pnpm-deps-upgrade/SKILL.md`，不要手工改 `package.json` 版本号。

核心路径：`pnpm upkg`（`soy ncu`）→ `pnpm clean --lockfile && pnpm i` → `pnpm typecheck && pnpm test` → `git commit -m "chore(deps): update deps"`。

catalog 依赖（`vite`、`typescript`、`vite-plus`）在 `pnpm-workspace.yaml` 里定义，改版本改那里，不是 `package.json`。

## 组件文档查询

组件用法、props、slots、主题：

1. 本机技能 `~/.agents/skills/vean-ui/SKILL.md`（`@vean/ui` styled 组件、`@vean/aria` 无样式基元、`SConfigProvider` 主题）。查某组件读 `references/components.md` 索引后只加载对应 `components/*.md`。
2. 技能文件不够用时，读 `https://veanui.com/llms.txt`，需要更完整上下文用 `https://veanui.com/llms-full.txt`。

写组件前先确认 `S*` 组件是否存在，不要自己造一个已有能力的组件。

## 提交

Conventional Commits，英文，`<type>(<scope>): <subject>`。scope 用模块名（`adapter`、`playground`、`deps`）。一次提交只做一件事。

## 调试约定

新增或改动组件后，用 `pnpm play` 在 `playground/src/App.vue` 里挂上验证，不要只靠 typecheck。
