'use client';

/**
 * Workbench UI state.
 *
 * Local UI concerns only (spec §38): panel sizes, open tabs, selection, bottom
 * panel, theme/density, draft input. Authoritative policy / deployment / runtime
 * state never lives here — those are server state read through the data layer.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AgentPatch, BottomPanelTab, EditorTab, PageKind } from './types';
import type { RailViewId } from './nav';

export interface SelectedEntity {
  kind: string;
  id: string;
  label: string;
}

export interface Toast {
  id: string;
  message: string;
}

/** Appearance preferences (spec §29). Persisted with the rest of the layout. */
export interface Appearance {
  /** `auto` keeps the dark ground for the Code editor only. */
  theme: 'light' | 'dark' | 'auto';
  density: 'comfortable' | 'compact';
  editorFontSize: number;
}

export const DEFAULT_APPEARANCE: Appearance = { theme: 'auto', density: 'comfortable', editorFontSize: 13 };

export interface PanelSizes {
  explorer: number;
  agent: number;
  bottom: number;
}

const DEFAULT_SIZES: PanelSizes = { explorer: 240, agent: 380, bottom: 220 };

/* Spec §3.1 gives explorer 180–340 and agent 300–520. The upper bounds are
   raised a little here: at the chosen type scale the spec maxima feel cramped,
   and dragging past them read as "the panel stopped working". */
export const PANEL_LIMITS = {
  explorer: { min: 180, max: 440, default: 240 },
  agent: { min: 300, max: 620, default: 380 },
  bottom: { min: 120, default: 220 },
};

const STORAGE_KEY = 'ctxlock.workbench.v1';

interface PersistedState {
  sizes: PanelSizes;
  explorerOpen: boolean;
  agentOpen: boolean;
  bottomOpen: boolean;
  bottomTab: BottomPanelTab;
  rail: RailViewId;
  tabs: EditorTab[];
  developerMode: boolean;
  appearance: Appearance;
}

interface WorkbenchValue {
  /* layout */
  sizes: PanelSizes;
  setPanelSize: (panel: keyof PanelSizes, value: number) => void;
  resetPanelSize: (panel: keyof PanelSizes) => void;
  explorerOpen: boolean;
  toggleExplorer: () => void;
  agentOpen: boolean;
  toggleAgent: () => void;
  agentDrawer: boolean;
  bottomOpen: boolean;
  toggleBottom: () => void;
  bottomMaximized: boolean;
  toggleBottomMaximized: () => void;
  bottomTab: BottomPanelTab;
  setBottomTab: (tab: BottomPanelTab) => void;
  openBottom: (tab: BottomPanelTab) => void;

  /* rail + tabs */
  rail: RailViewId;
  setRail: (rail: RailViewId) => void;
  tabs: EditorTab[];
  activeTabId: string | null;
  openTab: (tab: Omit<EditorTab, 'preview'> & { preview?: boolean }) => void;
  pinTab: (id: string) => void;
  /** Returns the tab that should take focus when the closed tab was active. */
  closeTab: (id: string) => EditorTab | null;
  closeOtherTabs: (id: string) => void;

  /* agent sidebar */
  selection: SelectedEntity | null;
  setSelection: (selection: SelectedEntity | null) => void;
  pageKind: PageKind;
  setPageKind: (kind: PageKind) => void;
  agentDraft: string;
  setAgentDraft: (value: string) => void;
  focusAgentInput: () => void;
  registerAgentInput: (el: HTMLTextAreaElement | null) => void;

  /* Patches the agent proposed and the user applied (spec §6.4). The agent
     never writes to a page; it hands the page a proposal to show. */
  pendingPatches: AgentPatch[];
  proposePatch: (patch: Omit<AgentPatch, 'id' | 'at'>) => void;
  dismissPatch: (id: string) => void;

  /* command palette */
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  /* toasts (lightweight feedback only, spec §48) */
  toasts: Toast[];
  pushToast: (message: string) => void;

  /* developer mode (spec §29) */
  developerMode: boolean;
  setDeveloperMode: (on: boolean) => void;

  /* appearance (spec §29) */
  appearance: Appearance;
  setAppearance: (next: Partial<Appearance>) => void;
  resetAppearance: () => void;

  /* viewport class (spec §46) */
  viewport: 'wide' | 'medium' | 'narrow' | 'monitor';
}

const WorkbenchContext = createContext<WorkbenchValue | null>(null);

export function useWorkbench(): WorkbenchValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error('useWorkbench must be used inside <WorkbenchProvider>');
  return ctx;
}

function readPersisted(): Partial<PersistedState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : null;
  } catch {
    return null;
  }
}

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [sizes, setSizes] = useState<PanelSizes>(DEFAULT_SIZES);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(false);
  const [bottomMaximized, setBottomMaximized] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomPanelTab>('problems');
  const [rail, setRail] = useState<RailViewId>('operate');
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectedEntity | null>(null);
  const [pageKind, setPageKind] = useState<PageKind>('overview');
  const [agentDraft, setAgentDraft] = useState('');
  const [pendingPatches, setPendingPatches] = useState<AgentPatch[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [developerMode, setDeveloperMode] = useState(false);
  const [appearance, setAppearanceState] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [viewport, setViewport] = useState<WorkbenchValue['viewport']>('wide');
  const [hydrated, setHydrated] = useState(false);
  const agentInputRef = useRef<HTMLTextAreaElement | null>(null);

  /* Mirrors of tab state so close/open can read the latest value without
     re-creating their callbacks on every tab change. */
  const tabsRef = useRef<EditorTab[]>([]);
  const activeTabRef = useRef<string | null>(null);
  tabsRef.current = tabs;
  activeTabRef.current = activeTabId;

  /* restore persisted layout after mount so SSR markup stays deterministic */
  useEffect(() => {
    const saved = readPersisted();
    if (saved) {
      if (saved.sizes) setSizes({ ...DEFAULT_SIZES, ...saved.sizes });
      if (typeof saved.explorerOpen === 'boolean') setExplorerOpen(saved.explorerOpen);
      if (typeof saved.agentOpen === 'boolean') setAgentOpen(saved.agentOpen);
      if (typeof saved.bottomOpen === 'boolean') setBottomOpen(saved.bottomOpen);
      if (saved.bottomTab) setBottomTab(saved.bottomTab);
      if (saved.rail) setRail(saved.rail);
      if (saved.tabs?.length) {
        setTabs(saved.tabs);
        setActiveTabId(saved.tabs[saved.tabs.length - 1]?.id ?? null);
      }
      if (typeof saved.developerMode === 'boolean') setDeveloperMode(saved.developerMode);
      if (saved.appearance) setAppearanceState({ ...DEFAULT_APPEARANCE, ...saved.appearance });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedState = {
      sizes,
      explorerOpen,
      agentOpen,
      bottomOpen,
      bottomTab,
      rail,
      tabs,
      developerMode,
      appearance,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage unavailable — layout simply resets next session */
    }
  }, [hydrated, sizes, explorerOpen, agentOpen, bottomOpen, bottomTab, rail, tabs, developerMode, appearance]);

  /* viewport classes from spec §46 */
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setViewport(w >= 1440 ? 'wide' : w >= 1180 ? 'medium' : w >= 900 ? 'narrow' : 'monitor');
    };
    compute();
    window.addEventListener('resize', compute, { passive: true });
    return () => window.removeEventListener('resize', compute);
  }, []);

  const setPanelSize = useCallback((panel: keyof PanelSizes, value: number) => {
    setSizes((prev) => (prev[panel] === value ? prev : { ...prev, [panel]: value }));
  }, []);

  const resetPanelSize = useCallback((panel: keyof PanelSizes) => {
    setSizes((prev) => ({ ...prev, [panel]: DEFAULT_SIZES[panel] }));
  }, []);

  const openTab = useCallback((tab: Omit<EditorTab, 'preview'> & { preview?: boolean }) => {
    const preview = tab.preview ?? true;
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === tab.id);
      if (existing) {
        return prev.map((t) => (t.id === tab.id ? { ...t, ...tab, preview: existing.preview && preview } : t));
      }
      // single-click navigation reuses the current preview tab (spec §3.3)
      const withoutPreview = preview ? prev.filter((t) => !t.preview) : prev;
      return [...withoutPreview, { ...tab, preview }];
    });
    setActiveTabId(tab.id);
  }, []);

  const pinTab = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, preview: false } : t)));
  }, []);

  /**
   * Closes a tab and returns the tab that should take focus, so the caller can
   * navigate there. Without this, closing the tab you are standing on removed
   * the tab but left its page on screen with nothing selected.
   */
  const closeTab = useCallback((id: string): EditorTab | null => {
    const current = tabsRef.current;
    const index = current.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const next = current.filter((t) => t.id !== id);
    const neighbour = next[index] ?? next[index - 1] ?? next[next.length - 1] ?? null;
    const wasActive = activeTabRef.current === id;

    setTabs(next);
    if (wasActive) setActiveTabId(neighbour?.id ?? null);

    // The caller only needs to navigate if the tab being closed is on screen.
    return wasActive ? neighbour : null;
  }, []);

  const closeOtherTabs = useCallback((id: string) => {
    setTabs((prev) => prev.filter((t) => t.id === id));
    setActiveTabId(id);
  }, []);

  const toggleExplorer = useCallback(() => setExplorerOpen((v) => !v), []);
  const toggleAgent = useCallback(() => setAgentOpen((v) => !v), []);
  const toggleBottom = useCallback(() => setBottomOpen((v) => !v), []);
  const toggleBottomMaximized = useCallback(() => setBottomMaximized((v) => !v), []);

  const openBottom = useCallback((tab: BottomPanelTab) => {
    setBottomTab(tab);
    setBottomOpen(true);
  }, []);

  const pushToast = useCallback((message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const setAppearance = useCallback((next: Partial<Appearance>) => {
    setAppearanceState((prev) => ({ ...prev, ...next }));
  }, []);

  const resetAppearance = useCallback(() => setAppearanceState(DEFAULT_APPEARANCE), []);

  const proposePatch = useCallback((patch: Omit<AgentPatch, 'id' | 'at'>) => {
    setPendingPatches((prev) => [
      ...prev,
      { ...patch, id: `patch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString() },
    ]);
  }, []);

  const dismissPatch = useCallback((id: string) => {
    setPendingPatches((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const registerAgentInput = useCallback((el: HTMLTextAreaElement | null) => {
    agentInputRef.current = el;
  }, []);

  const focusAgentInput = useCallback(() => {
    setAgentOpen(true);
    window.setTimeout(() => agentInputRef.current?.focus(), 40);
  }, []);

  const agentDrawer = viewport === 'narrow' || viewport === 'monitor';

  const value = useMemo<WorkbenchValue>(
    () => ({
      sizes,
      setPanelSize,
      resetPanelSize,
      explorerOpen,
      toggleExplorer,
      agentOpen,
      toggleAgent,
      agentDrawer,
      bottomOpen,
      toggleBottom,
      bottomMaximized,
      toggleBottomMaximized,
      bottomTab,
      setBottomTab,
      openBottom,
      rail,
      setRail,
      tabs,
      activeTabId,
      openTab,
      pinTab,
      closeTab,
      closeOtherTabs,
      selection,
      setSelection,
      pageKind,
      setPageKind,
      agentDraft,
      setAgentDraft,
      focusAgentInput,
      registerAgentInput,
      pendingPatches,
      proposePatch,
      dismissPatch,
      paletteOpen,
      setPaletteOpen,
      toasts,
      pushToast,
      developerMode,
      setDeveloperMode,
      appearance,
      setAppearance,
      resetAppearance,
      viewport,
    }),
    [
      sizes, setPanelSize, resetPanelSize,
      explorerOpen, toggleExplorer,
      agentOpen, toggleAgent, agentDrawer,
      bottomOpen, toggleBottom, bottomMaximized, toggleBottomMaximized, bottomTab, openBottom,
      rail, tabs, activeTabId, openTab, pinTab, closeTab, closeOtherTabs,
      selection, pageKind, agentDraft, focusAgentInput, registerAgentInput,
      pendingPatches, proposePatch, dismissPatch,
      paletteOpen, toasts, pushToast, developerMode, viewport,
      appearance, setAppearance, resetAppearance,
    ],
  );

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

/**
 * Registers the page with the workbench: opens/focuses its editor tab, syncs the
 * agent page-kind and clears stale selection when the page changes.
 */
export function usePageRegistration(opts: {
  id: string;
  title: string;
  href: string;
  pageKind: PageKind;
  live?: boolean;
  stale?: boolean;
}) {
  const { openTab, setPageKind, setSelection } = useWorkbench();
  const { id, title, href, pageKind, live, stale } = opts;

  useEffect(() => {
    openTab({ id, title, href, pageKind, live, stale });
    setPageKind(pageKind);
    setSelection(null);
  }, [id, title, href, pageKind, live, stale, openTab, setPageKind, setSelection]);
}
