import { useEffect, useMemo, useReducer, useState } from "react";
import { BusuanziStats } from "./components/BusuanziStats";
import { Header } from "./components/Header";
import { HeroList } from "./components/HeroList";
import { ResultPanel } from "./components/ResultPanel";
import { EditorPanel } from "./components/EditorPanel";
import { ImportExportModals } from "./components/ImportExportModals";
import { encodeSharePayload, decodeSharePayload, readShareParam } from "./engine/share";
import { readLocalStorage, writeLocalStorage } from "./persist/storage";
import { appReducer, createInitialState } from "./store/appReducer";
import { AppContext } from "./store/context";
import { copyText } from "./utils/download";

function createBootState() {
  const base = createInitialState(Date.now());
  const persisted = readLocalStorage();
  if (!persisted) return base;
  return appReducer(base, {
    type: "hydrate",
    heroes: persisted.heroes,
    theme: persisted.theme,
    sortBy: persisted.sortBy,
    comparisonOpen: persisted.comparisonOpen,
    preferredRarity: persisted.preferredRarity,
  });
}

export function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, createBootState);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const value = useMemo(() => ({ state, dispatch }), [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    writeLocalStorage({
      version: 1,
      heroes: state.heroes,
      theme: state.theme,
      sortBy: state.sortBy,
      comparisonOpen: state.comparisonOpen,
      preferredRarity: state.preferredRarity,
    });
  }, [state.heroes, state.theme, state.sortBy, state.comparisonOpen, state.preferredRarity]);

  useEffect(() => {
    const encoded = readShareParam(window.location.search, window.location.hash);
    if (!encoded) return;
    const parsed = decodeSharePayload(encoded);
    if (parsed.ok) {
      dispatch({ type: "import-heroes", heroes: parsed.heroes, mode: "replace" });
      setNotice("已从分享链接加载英雄数据");
    }
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      dispatch({ type: event.shiftKey ? "redo" : "undo" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleShare() {
    const encoded = encodeSharePayload(state.heroes);
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    const ok = await copyText(url);
    setNotice(ok ? "分享链接已复制到剪贴板" : url);
  }

  return (
    <AppContext.Provider value={value}>
      <div className="app">
        <Header
          onImport={() => {
            setExportOpen(false);
            setImportOpen(true);
          }}
          onExport={() => {
            setImportOpen(false);
            setExportOpen(true);
          }}
          onShare={() => {
            void handleShare();
          }}
        />
        {notice ? <div className="banner" style={{ marginTop: 12 }}>{notice}</div> : null}
        <div className="layout">
          <HeroList />
          <ResultPanel />
          <EditorPanel />
        </div>
        <ImportExportModals
          importOpen={importOpen}
          exportOpen={exportOpen}
          onClose={() => {
            setImportOpen(false);
            setExportOpen(false);
          }}
        />
        <BusuanziStats />
      </div>
    </AppContext.Provider>
  );
}
