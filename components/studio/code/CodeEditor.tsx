'use client';

/**
 * Monaco wrapper for the Code surface (spec §18).
 *
 * Loaded only on this route. Generated code is read-only after a successful
 * build, so the editor defaults to read-only and only developer mode can open a
 * draft — which invalidates artifact correspondence and forces a rebuild.
 */
import { useCallback } from 'react';
import Editor, { DiffEditor, type Monaco } from '@monaco-editor/react';
import { useWorkbench } from '@/lib/studio/workbench';

/** Editor theme built from the workbench's own dark tokens. */
const THEME_NAME = 'contextlock-dark';

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6f6f7a', fontStyle: 'italic' },
      { token: 'keyword', foreground: '9db4ff' },
      { token: 'string', foreground: '9bd7a8' },
      { token: 'number', foreground: '7fc8dd' },
      { token: 'type', foreground: 'c2a9f5' },
      { token: 'delimiter', foreground: '8a8a95' },
    ],
    colors: {
      'editor.background': '#090909',
      'editor.foreground': '#e4e4e7',
      'editorLineNumber.foreground': '#4c4c55',
      'editorLineNumber.activeForeground': '#a9a9b2',
      'editor.selectionBackground': '#2a3a5c',
      'editor.lineHighlightBackground': '#131315',
      'editorGutter.background': '#090909',
      'editorIndentGuide.background1': '#1e1e20',
      'editorWidget.background': '#121213',
      'editorWidget.border': '#26262a',
      'scrollbarSlider.background': '#2a2a2e88',
      'scrollbarSlider.hoverBackground': '#3a3a40aa',
      'diffEditor.insertedTextBackground': '#1b4a3320',
      'diffEditor.removedTextBackground': '#5c221e20',
    },
  });
}

const OPTIONS = {
  fontSize: 13,
  lineHeight: 21,
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line' as const,
  smoothScrolling: true,
  padding: { top: 14, bottom: 20 },
  // Accessibility support is on by default; the spec requires Monaco's
  // accessibility mode to keep working (§45).
  accessibilitySupport: 'auto' as const,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
  tabSize: 2,
};

export function CodeEditor({
  value,
  language,
  readOnly,
  onChange,
}: {
  value: string;
  language: string;
  readOnly: boolean;
  onChange?: (value: string) => void;
}) {
  const beforeMount = useCallback((monaco: Monaco) => defineTheme(monaco), []);
  const { appearance } = useWorkbench();
  const fontSize = appearance.editorFontSize;

  return (
    <Editor
      value={value}
      language={language}
      theme={THEME_NAME}
      beforeMount={beforeMount}
      onChange={(next) => onChange?.(next ?? '')}
      options={{ ...OPTIONS, fontSize, lineHeight: Math.round(fontSize * 1.62), readOnly, domReadOnly: readOnly }}
      loading={<EditorLoading />}
    />
  );
}

export function CodeDiff({
  original,
  modified,
  language,
}: {
  original: string;
  modified: string;
  language: string;
}) {
  const beforeMount = useCallback((monaco: Monaco) => defineTheme(monaco), []);
  const { appearance } = useWorkbench();
  const fontSize = appearance.editorFontSize;

  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language}
      theme={THEME_NAME}
      beforeMount={beforeMount}
      options={{
        ...OPTIONS,
        fontSize,
        lineHeight: Math.round(fontSize * 1.62),
        readOnly: true,
        renderSideBySide: true,
        enableSplitViewResizing: false,
      }}
      loading={<EditorLoading />}
    />
  );
}

function EditorLoading() {
  return (
    <div style={{ padding: 18 }}>
      <span className="cl-meta">Loading editor…</span>
    </div>
  );
}
