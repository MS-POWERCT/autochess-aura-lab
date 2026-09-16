import { useState } from "react";
import { rarityColor, rarityName } from "../constants";
import { selectedHeroes, visibleHeroes } from "../store/appReducer";
import { useApp } from "../store/context";
import type { SortBy } from "../types";
import { PatternPreview } from "./PatternPreview";

export function HeroList() {
  const { state, dispatch } = useApp();
  const heroes = visibleHeroes(state);
  const selectedCount = selectedHeroes(state.heroes).length;
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <aside className="panel hero-panel">
      <h2>英雄卡片</h2>
      <div className="list-toolbar">
        <div className="search-sort">
          <input
            aria-label="搜索英雄"
            placeholder="搜索英雄名称"
            value={state.search}
            onChange={(event) => dispatch({ type: "set-search", search: event.target.value })}
          />
          <select
            aria-label="排序"
            value={state.sortBy}
            onChange={(event) => dispatch({ type: "set-sort", sortBy: event.target.value as SortBy })}
          >
            <option value="manual">手动排序</option>
            <option value="createdAt">创建时间</option>
            <option value="name">名称</option>
            <option value="totalHits">总辐射数量</option>
          </select>
        </div>
        <button type="button" className="primary" onClick={() => dispatch({ type: "start-create" })}>
          + 添加英雄
        </button>
      </div>
      <div className="hero-list">
        {heroes.length === 0 ? (
          <div className="hint">还没有英雄。把右侧的英雄和辐射放入棋盘后保存。</div>
        ) : (
          heroes.map((hero) => (
            <article
              key={hero.id}
              className={`hero-card ${state.editingId === hero.id ? "active" : ""}`}
              draggable
              onDragStart={() => setDragId(hero.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragId || dragId === hero.id) return;
                const ids = heroes.map((item) => item.id);
                const from = ids.indexOf(dragId);
                const to = ids.indexOf(hero.id);
                ids.splice(from, 1);
                ids.splice(to, 0, dragId);
                dispatch({ type: "reorder", ids });
                setDragId(null);
              }}
              onMouseEnter={() => dispatch({ type: "hover-hero", id: hero.id })}
              onMouseLeave={() => dispatch({ type: "hover-hero", id: null })}
            >
              <div className="hero-card-head">
                <input
                  type="checkbox"
                  aria-label={`选中${hero.name}`}
                  checked={hero.selected}
                  onChange={() => dispatch({ type: "toggle-select", id: hero.id })}
                />
                <strong className="hero-card-name">{hero.name}</strong>
                <span className="rarity-badge" style={{ color: rarityColor(hero.rarity) }}>
                  {rarityName(hero.rarity)}
                </span>
              </div>
              <PatternPreview
                name={hero.name}
                position={hero.position}
                radiationCells={hero.radiationCells}
                color={rarityColor(hero.rarity)}
              />
              <div className="hero-card-actions">
                <button type="button" onClick={() => dispatch({ type: "start-edit", id: hero.id })}>
                  编辑
                </button>
                <button type="button" onClick={() => dispatch({ type: "duplicate-hero", id: hero.id })}>
                  复制
                </button>
                <button type="button" className="danger" onClick={() => dispatch({ type: "delete-hero", id: hero.id })}>
                  删除
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      <div className="footer-count">已选中 {selectedCount} / {state.heroes.length}</div>
    </aside>
  );
}
