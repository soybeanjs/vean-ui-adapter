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
  pack: {
    entry: ['src/index.ts'],
    platform: 'neutral',
    deps: {
      neverBundle: ['vue']
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
