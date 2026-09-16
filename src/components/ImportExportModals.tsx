import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { rarityColor, rarityName } from "../constants";
import { defaultExportFilename, parseImport, parseImportData, serializeExport } from "../engine/importExport";
import { BUILTIN_PRESETS, type BuiltinPreset } from "../presets";
import { selectedHeroes } from "../store/appReducer";
import { useApp } from "../store/context";
import type { Hero, ImportMode } from "../types";
import { downloadTextFile } from "../utils/download";

type ImportExportModalsProps = {
  importOpen: boolean;
  exportOpen: boolean;
  onClose: () => void;
};

type ImportSource = {
  kind: "preset" | "file";
  id?: string;
  label: string;
};

export function ImportExportModals({ importOpen, exportOpen, onClose }: ImportExportModalsProps) {
  const { state, dispatch } = useApp();
  const [mode, setMode] = useState<ImportMode>("merge");
  const [preview, setPreview] = useState<Hero[] | null>(null);
  const [error, setError] = useState("");
  const [source, setSource] = useState<ImportSource | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState(defaultExportFilename(new Date(), "全部"));
  const [scope, setScope] = useState<"all" | "selected">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportHeroes = useMemo(
    () => (scope === "selected" ? selectedHeroes(state.heroes) : state.heroes),
    [scope, state.heroes],
  );

  useEffect(() => {
    if (importOpen) return;
    setPreview(null);
    setError("");
    setSource(null);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [importOpen]);

  function applyParsed(
    parsed: ReturnType<typeof parseImportData>,
    nextSource: ImportSource,
  ) {
    if (!parsed.ok) {
      setPreview(null);
      setSource(null);
      setError(parsed.error);
      return;
    }
    setError("");
    setPreview(parsed.heroes);
    setSource(nextSource);
  }

  function handlePreset(preset: BuiltinPreset) {
    if (fileInputRef.current) fileInputRef.current.value = "";
    applyParsed(parseImportData(preset.payload), {
      kind: "preset",
      id: preset.id,
      label: preset.name,
    });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    applyParsed(parseImport(text), { kind: "file", label: file.name });
  }

  function confirmImport() {
    if (!preview) return;
    dispatch({ type: "import-heroes", heroes: preview, mode });
    setPreview(null);
    onClose();
  }

  function confirmExport() {
    downloadTextFile(filename.trim() || defaultExportFilename(new Date(), scope === "selected" ? "选中" : "全部"), serializeExport(exportHeroes));
    onClose();
  }

  if (!importOpen && !exportOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={importOpen ? "modal import-modal" : "modal"}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {importOpen ? (
          <>
            <p className="modal-kicker">图鉴导入</p>
            <h3>导入英雄</h3>
            <p className="muted import-lead">点选内置图鉴即可预览，也可以上传自己导出的 JSON。</p>

            <div className="import-section-title">
              <span>内置图鉴</span>
              <span>{BUILTIN_PRESETS.reduce((sum, pack) => sum + pack.count, 0)} 名棋子</span>
            </div>
            <div className="preset-grid">
              {BUILTIN_PRESETS.map((preset) => {
                const selected = source?.kind === "preset" && source.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={selected ? "preset-card selected" : "preset-card"}
                    style={{ "--rarity": rarityColor(preset.rarity) } as CSSProperties}
                    onClick={() => handlePreset(preset)}
                  >
                    <span className="preset-badge">{rarityName(preset.rarity)}</span>
                    <strong>{preset.name}</strong>
                    <span className="preset-meta">{preset.description}</span>
                    <span className="preset-count">{preset.count} 名</span>
                  </button>
                );
              })}
            </div>

            <div className="import-section-title">
              <span>本地文件</span>
            </div>
            <label
              className={dragOver ? "file-drop dragover" : "file-drop"}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                void handleFile(event.dataTransfer.files[0]);
              }}
            >
              <input
                ref={fileInputRef}
                aria-label="选择导入文件"
                type="file"
                accept="application/json,.json"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <strong>点击选择，或把 JSON 拖到这里</strong>
              <span>支持本工具导出的图鉴文件</span>
            </label>

            <div className="import-section-title">
              <span>导入方式</span>
            </div>
            <div className="mode-toggle">
              <button type="button" className={mode === "merge" ? "active" : ""} onClick={() => setMode("merge")}>
                合并追加
              </button>
              <button type="button" className={mode === "replace" ? "active" : ""} onClick={() => setMode("replace")}>
                替换现有
              </button>
            </div>
            <p className="muted import-mode-hint">
              {mode === "merge" ? "保留当前列表，把预览中的英雄追加进去。" : "清空当前列表，只保留这次导入的英雄。"}
            </p>

            {error ? <p className="error">{error}</p> : null}
            {preview && source ? (
              <>
                <div className="import-source">
                  <span className="import-source-dot" />
                  已选择 {source.label} · {preview.length} 名英雄
                </div>
                <div className="preview-list">
                  {preview.map((hero) => (
                    <div key={hero.id} className="preview-item">
                      <span className="preview-name">
                        <span className="rarity-dot" style={{ "--rarity": rarityColor(hero.rarity) } as CSSProperties} />
                        {hero.name}
                      </span>
                      <span className="muted">{hero.radiationCells.length} 格辐射</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">选择图鉴或文件后会显示预览，确认后再导入。</p>
            )}
            <div className="inline-actions modal-footer">
              <button type="button" onClick={onClose}>
                取消
              </button>
              <button type="button" className="primary" disabled={!preview} onClick={confirmImport}>
                确认导入
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>导出英雄</h3>
            <div className="mode-toggle">
              <button
                type="button"
                className={scope === "all" ? "active" : ""}
                onClick={() => {
                  setScope("all");
                  setFilename(defaultExportFilename(new Date(), "全部"));
                }}
              >
                全部导出
              </button>
              <button
                type="button"
                className={scope === "selected" ? "active" : ""}
                onClick={() => {
                  setScope("selected");
                  setFilename(defaultExportFilename(new Date(), "选中"));
                }}
              >
                选中导出
              </button>
            </div>
            <label>
              <span className="muted">文件名</span>
              <input aria-label="导出文件名" value={filename} onChange={(event) => setFilename(event.target.value)} />
            </label>
            <p className="muted">将导出 {exportHeroes.length} 名英雄。</p>
            <div className="inline-actions">
              <button type="button" className="primary" disabled={exportHeroes.length === 0} onClick={confirmExport}>
                下载 JSON
              </button>
              <button type="button" onClick={onClose}>
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
