import { onMounted, onUnmounted, watch } from 'vue';
import type { ComputedRef } from 'vue';
import type { AdapterTheme, CssVariables } from './types';

type CssLibrary = 'element-plus' | 'arco';
interface StyleOwner {
  css: string;
  mode: AdapterTheme['mode'];
}
interface StyleEntry {
  element: HTMLStyleElement;
  owners: Map<symbol, StyleOwner>;
  originalArcoTheme: string | null;
  appliedArcoTheme?: string;
}

// Per-document ownership also isolates test documents and separate browser windows.
const documents = new WeakMap<Document, Map<CssLibrary, StyleEntry>>();

function serializeVariables(library: CssLibrary, variables: CssVariables): string {
  const selector = library === 'arco' ? 'body, body[arco-theme]' : ':root, html.dark';
  const declarations = Object.entries(variables)
    .map(([key, value]) => `${key}:${value};`)
    .join('');
  return `${selector}{${declarations}}`;
}

function applyOwner(document: Document, library: CssLibrary, entry: StyleEntry): void {
  const owner = Array.from(entry.owners.values()).at(-1);
  if (!owner) return;

  entry.element.textContent = owner.css;
  if (library === 'arco') {
    document.body.setAttribute('arco-theme', owner.mode);
    entry.appliedArcoTheme = owner.mode;
  }
}

function acquireStyle(document: Document, library: CssLibrary, owner: StyleOwner) {
  let entries = documents.get(document);
  if (!entries) {
    entries = new Map();
    documents.set(document, entries);
  }

  let entry = entries.get(library);
  if (!entry) {
    const element = document.createElement('style');
    element.dataset.veanAdapter = library;
    document.head.appendChild(element);
    entry = { element, owners: new Map(), originalArcoTheme: document.body.getAttribute('arco-theme') };
    entries.set(library, entry);
  }

  const current = entry;
  const key = Symbol(library);
  current.owners.set(key, owner);
  applyOwner(document, library, current);

  return {
    update(value: StyleOwner): void {
      current.owners.set(key, value);
      applyOwner(document, library, current);
    },
    release(): void {
      current.owners.delete(key);
      if (current.owners.size) {
        applyOwner(document, library, current);
        return;
      }
      current.element.remove();
      entries.delete(library);
      if (library !== 'arco' || document.body.getAttribute('arco-theme') !== current.appliedArcoTheme) return;
      if (current.originalArcoTheme === null) {
        document.body.removeAttribute('arco-theme');
        return;
      }
      document.body.setAttribute('arco-theme', current.originalArcoTheme);
    }
  };
}

export function useAdapterStyle(
  library: CssLibrary,
  theme: ComputedRef<AdapterTheme | null>,
  resolveVariables: (value: AdapterTheme) => CssVariables
): void {
  let handle: ReturnType<typeof acquireStyle> | undefined;

  function update(value: AdapterTheme | null): void {
    if (!value || typeof document === 'undefined') return;
    const owner = { css: serializeVariables(library, resolveVariables(value)), mode: value.mode };
    if (handle) {
      handle.update(owner);
      return;
    }
    handle = acquireStyle(document, library, owner);
  }

  onMounted(() => {
    update(theme.value);
    watch(theme, update);
  });
  onUnmounted(() => handle?.release());
}
