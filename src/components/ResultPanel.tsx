import { useMemo, useState } from "react";
import { rarityColor } from "../constants";
import { cellsToOffsets, formatPosition, positionKey } from "../engine/board";
import { computePlacementOverlay } from "../engine/radiation";
import { findBestPositions } from "../engine/bestPosition";
import { buildComparisonRows, computeStats, sortComparisonRows, type ComparisonSortKey } from "../engine/stats";
import { formatAverage } from "../engine/heat";
import { selectedHeroes } from "../store/appReducer";
import { useApp } from "../store/context";
import { Board } from "./Board";

export function ResultPanel() {
  const { state, dispatch } = useApp();
  const selected = selectedHeroes(state.heroes);
  const offsets = useMemo(() => {
    const hovered = state.hoveredHeroId
      ? state.heroes.find((hero) => hero.id === state.hoveredHeroId)
      : undefined;
    if (hovered) {
      return cellsToOffsets(hovered.position, hovered.radiationCells);
    }
    if (state.draft.position) {
      return cellsToOffsets(state.draft.position, state.draft.radiationCells);
    }
    return [];
  }, [state.draft, state.heroes, state.hoveredHeroId]);

  const overlay = useMemo(() => computePlacementOverlay(offsets), [offsets]);
  const stats = useMemo(() => computeStats(overlay), [overlay]);
  const best = useMemo(() => findBestPositions(offsets), [offsets]);
  const highlightKeys = useMemo(
    () => new Set(best.positions.map(positionKey)),
    [best.positions],
  );
  const rows = useMemo(() => buildComparisonRows(selected), [selected]);
  const [sortKey, setSortKey] = useState<ComparisonSortKey>("totalHits");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const sortedRows = useMemo(
    () => sortComparisonRows(rows, sortKey, direction),
    [rows, sortKey, direction],
  );

  const hoveredCount = state.hoveredCell
    ? overlay[state.hoveredCell.row][state.hoveredCell.col].count
    : null;

  function toggleSort(key: ComparisonSortKey) {
    if (sortKey === key) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(key === "name" || key === "rarityName" ? "asc" : "desc");
  }

  return (
    <section className="panel result-panel">
      <h2>结果棋盘</h2>
      <Board
        mode="result"
        overlay={overlay}
        theme={state.theme}
        heroPosition={state.draft.position}
        highlightKeys={highlightKeys}
        onCellClick={(position) => dispatch({ type: "hover-cell", position })}
        onCellHover={(position) => dispatch({ type: "hover-cell", position })}
      />
      <div className="stat-grid">
        <div className="stat">
          <span className="muted">最高可辐射</span>
          <b>{stats.maxCount}</b>
        </div>
        <div className="stat">
          <span className="muted">最佳位置数</span>
          <b>{stats.bestCellCount}</b>
        </div>
        <div className="stat">
          <span className="muted">总辐射数量</span>
          <b>{stats.totalHits}</b>
        </div>
      </div>
      <div className="hint">
        {state.hoveredCell && hoveredCount !== null
          ? `英雄放在 ${formatPosition(state.hoveredCell)} 可辐射 ${hoveredCount} 格`
          : "每个格子的数字 = 英雄放在这里时，辐射还能打到棋盘上的格子数。高亮格是最佳位置。"}
      </div>
      <div className="inline-actions" style={{ marginTop: 12 }}>
        <h3 style={{ margin: 0, flex: 1 }}>英雄对比</h3>
        <button type="button" onClick={() => dispatch({ type: "set-comparison-open", open: !state.comparisonOpen })}>
          {state.comparisonOpen ? "收起" : "展开"}
        </button>
      </div>
      {state.comparisonOpen && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => toggleSort("name")}>
                    英雄名称
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("rarityName")}>
                    等级
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("maxCount")}>
                    最高可辐射
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("bestCellCount")}>
                    最佳位置数
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("totalHits")}>
                    总辐射数量
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("average")}>
                    平均可辐射
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    勾选英雄后将在这里对比。
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>
                      <span className="swatch" style={{ background: rarityColor(row.rarity), marginRight: 6 }} />
                      {row.rarityName}
                    </td>
                    <td>{row.maxCount}</td>
                    <td>{row.bestCellCount}</td>
                    <td>{row.totalHits}</td>
                    <td>{formatAverage(row.average)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
