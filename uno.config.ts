import { defineConfig } from 'unocss';
import { presetUi } from '@vean/unocss';

export default defineConfig({
  presets: [
    presetUi({
      resetCSS: true,
      globalCSS: true
    })
  ]
});
