import { APP_SUBTITLE, APP_TITLE } from "../constants";
import { useApp } from "../store/context";

type HeaderProps = {
  onImport: () => void;
  onExport: () => void;
  onShare: () => void;
};

export function Header({ onImport, onExport, onShare }: HeaderProps) {
  const { state, dispatch } = useApp();
  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-logo" src="/logo.png" width={44} height={44} alt={APP_TITLE} />
        <div className="brand-copy">
          <strong>{APP_TITLE}</strong>
          <span>{APP_SUBTITLE}</span>
        </div>
      </div>
      <div className="top-actions">
        <button type="button" onClick={() => dispatch({ type: "undo" })} disabled={!canUndo}>
          撤销
        </button>
        <button type="button" onClick={() => dispatch({ type: "redo" })} disabled={!canRedo}>
          重做
        </button>
        <button type="button" className="import-btn" onClick={onImport}>
          导入
        </button>
        <button type="button" onClick={onExport}>
          导出
        </button>
        <button type="button" onClick={onShare}>
          分享链接
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "set-theme", theme: state.theme === "dark" ? "light" : "dark" })}
        >
          {state.theme === "dark" ? "浅色主题" : "深色主题"}
        </button>
      </div>
    </header>
  );
}
