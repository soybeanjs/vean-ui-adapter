import { computed, getCurrentInstance } from 'vue';
import type { Component, ComputedRef } from 'vue';
import { useTheme } from '@vean/ui';
import type { ThemeContext } from '@vean/ui';
import { resolveAdapterTheme } from './theme';
import type { AdapterTheme } from './types';

function warn(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[vean-ui-adapter] ${message}`);
  }
}

function readThemeContext(): ThemeContext | undefined {
  try {
    return useTheme('ThemeAdapter');
  } catch (error) {
    // useTheme has no nullable overload. Only its missing-context error is recoverable.
    if (!(error instanceof Error) || error.message !== '`ThemeAdapter` must be used within `UiThemeContext`') {
      throw error;
    }
    warn('ThemeAdapter requires SConfigProvider; rendering its slot unchanged.');
    return undefined;
  }
}

export function useAdapterTheme(): ComputedRef<AdapterTheme | null> {
  const context = readThemeContext();
  return computed(() => (context ? resolveAdapterTheme(context.theme.value, context.effectiveMode.value) : null));
}

export function resolveProvider(names: readonly string[]): Component | undefined {
  const components = getCurrentInstance()?.appContext.components;
  const provider = names.map(name => components?.[name]).find(component => component !== undefined);

  if (!provider) {
    warn(`${names[0]} is not globally registered; register it with app.component() or app.use().`);
  }

  return provider;
}
