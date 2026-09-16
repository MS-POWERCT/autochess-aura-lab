import { useMemo, useState, type DragEvent } from "react";
import { RARITIES } from "../constants";
import { findBestPositions } from "../engine/bestPosition";
import { cellsToOffsets, formatPosition, positionKey } from "../engine/board";
import { useApp } from "../store/context";
import type { PlaceTool, Position } from "../types";
import { Board } from "./Board";

export function EditorPanel() {
  const { state, dispatch } = useApp();
  const { draft, placeTool } = state;
  const [error, setError] = useState("");

  const radiationKeys = useMemo(
    () => new Set(draft.radiationCells.map(positionKey)),
    [draft.radiationCells],
  );

  const best = useMemo(() => {
    if (!draft.position) return null;
    return findBestPositions(cellsToOffsets(draft.position, draft.radiationCells));
  }, [draft.position, draft.radiationCells]);

  function placeOnBoard(position: Position, tool: PlaceTool = placeTool, mode: "toggle" | "set" = "toggle") {
    dispatch({ type: "place-piece", tool, position, mode });
  }

  function handleSave() {
    if (!draft.name.trim()) {
      setError("请填写英雄名称");
      return;
    }
    if (!draft.position) {
      setError("请把英雄放入棋盘");
      return;
    }
    setError("");
    dispatch({ type: "save-draft" });
  }

  function startPieceDrag(event: DragEvent<HTMLButtonElement>, tool: PlaceTool) {
    event.dataTransfer.setData("text/piece", tool);
    event.dataTransfer.effectAllowed = "copy";
    dispatch({ type: "set-place-tool", tool });
  }

  return (
    <section className="panel editor-panel">
      <h2>{state.editingId ? "编辑英雄" : "新建英雄"}</h2>
      <div className="piece-tray">
        <button
          type="button"
          className={`piece-button hero-piece ${placeTool === "hero" ? "active" : ""}`}
          aria-pressed={placeTool === "hero"}
          draggable
          onDragStart={(event) => startPieceDrag(event, "hero")}
          onClick={() => dispatch({ type: "set-place-tool", tool: "hero" })}
        >
          英雄
        </button>
        <button
          type="button"
          className={`piece-button radiation-piece ${placeTool === "radiation" ? "active" : ""}`}
          aria-pressed={placeTool === "radiation"}
          draggable
          onDragStart={(event) => startPieceDrag(event, "radiation")}
          onClick={() => dispatch({ type: "set-place-tool", tool: "radiation" })}
        >
          辐射
        </button>
      </div>
      <p className="muted">点选按钮后点击格子放入<span className="wide-label">，也可以把按钮拖到格子上</span>。</p>
      <Board
        mode="select"
        theme={state.theme}
        heroPosition={draft.position}
        radiationKeys={radiationKeys}
        onCellClick={(position) => placeOnBoard(position)}
        onCellDrop={(tool, position) => placeOnBoard(position, tool, "set")}
      />
      <div className="editor-grid" style={{ marginTop: 12 }}>
        <div className="hint">
          {!draft.position
            ? "还没有放入英雄。点「英雄」再点棋盘格子。"
            : draft.radiationCells.length === 0
              ? `英雄在 ${formatPosition(draft.position)}。点「辐射」再点格子，放入这个英雄的辐射范围。`
              : `英雄 ${formatPosition(draft.position)}，辐射 ${draft.radiationCells.length} 格。最佳位置辐射数 ${best?.maxCount ?? 0}：${best?.positions.map(formatPosition).join("、")}`}
        </div>
        <label>
          <span className="muted">英雄名称</span>
          <input
            aria-label="英雄名称"
            value={draft.name}
            onChange={(event) => dispatch({ type: "update-draft", patch: { name: event.target.value } })}
            placeholder="例如 剑士"
          />
        </label>
        <fieldset className="rarity-fieldset">
          <legend className="muted">等级</legend>
          <div className="rarity-row" role="radiogroup" aria-label="英雄等级">
            {RARITIES.map((rarity) => (
              <label key={rarity.id} className={`rarity-option ${draft.rarity === rarity.id ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="hero-rarity"
                  value={rarity.id}
                  checked={draft.rarity === rarity.id}
                  onChange={() => dispatch({ type: "update-draft", patch: { rarity: rarity.id } })}
                />
                <span className="swatch" style={{ background: rarity.color }} />
                {rarity.name}
              </label>
            ))}
          </div>
        </fieldset>
        {error ? <div className="error">{error}</div> : null}
        <div className="inline-actions">
          <button type="button" className="primary" onClick={handleSave}>
            保存英雄
          </button>
          <button type="button" onClick={() => dispatch({ type: "reset-draft" })}>
            重置
          </button>
        </div>
      </div>
    </section>
  );
}
