import { defineConfig } from 'vite-plus';
import unpluginVue from 'unplugin-vue/rolldown';
import vue from 'unplugin-vue/vite';
import unpluginVueJsx from 'unplugin-vue-jsx/rolldown';
import UnoCSS from 'unocss/vite';
import { lint, fmt } from '@soybeanjs/oxc-config';

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  fmt,
  lint,
  resolve: {
    tsconfigPaths: true
  },
  root: './playground',
  plugins: [vue(), UnoCSS()],
  test: {
    root: '.',
    environment: 'happy-dom',
    include: ['src/**/*.test.ts']
  },
  pack: {
    entry: [
      'src/index.ts',
      'src/element-plus/index.ts',
      'src/arco/index.ts',
      'src/antdv/index.ts',
      'src/antdv-next/index.ts',
      'src/naive-ui/index.ts'
    ],
    platform: 'neutral',
    deps: {
      neverBundle: ['vue', '@vean/ui', '@vean/theme', '@soybeanjs/colord']
    },
    clean: true,
    dts: {
      vue: true
    },
    plugins: [unpluginVue({ isProduction: true }), unpluginVueJsx()],
    sourcemap: false,
    minify: false,
    fixedExtension: false
  }
});
