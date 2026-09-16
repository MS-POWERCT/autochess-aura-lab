import { rarityColor } from "../constants";
import { COLS, ROWS, formatPosition, isSamePosition, positionKey } from "../engine/board";
import { heatColor } from "../engine/heat";
import type { BoardOverlay, Hero, PlaceTool, Position, Theme } from "../types";

type BoardProps = {
  mode: "result" | "select";
  overlay?: BoardOverlay;
  theme: Theme;
  heroPosition?: Position | null;
  radiationKeys?: Set<string>;
  highlightKeys?: Set<string>;
  heroesById?: Map<string, Hero>;
  onCellClick?: (position: Position) => void;
  onCellDrop?: (tool: PlaceTool, position: Position) => void;
  onCellHover?: (position: Position | null) => void;
};

export function Board({
  mode,
  overlay,
  theme,
  heroPosition,
  radiationKeys,
  highlightKeys,
  heroesById,
  onCellClick,
  onCellDrop,
  onCellHover,
}: BoardProps) {
  const maxCount = overlay
    ? overlay.reduce((max, row) => Math.max(max, ...row.map((cell) => cell.count)), 0)
    : 0;

  const cells: Position[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      cells.push({ col, row });
    }
  }

  return (
    <div className="board" role="grid" aria-label={mode === "result" ? "结果棋盘" : "选择棋盘"}>
      {cells.map((position) => {
        const cell = overlay?.[position.row]?.[position.col];
        const isHero = heroPosition ? isSamePosition(position, heroPosition) : false;
        const radiated = radiationKeys?.has(positionKey(position)) ?? false;
        const highlighted = highlightKeys?.has(positionKey(position)) ?? false;
        const className = [
          "cell",
          isHero ? "hero" : "",
          radiated ? "radiated" : "",
          highlighted ? "highlight" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={positionKey(position)}
            type="button"
            className={className}
            style={
              mode === "result"
                ? { background: heatColor(cell?.count ?? 0, maxCount, theme) }
                : isHero
                  ? { background: "color-mix(in srgb, var(--hero) 35%, var(--cell))" }
                  : undefined
            }
            aria-label={`${mode === "result" ? "结果格子" : "选择格子"} ${position.col},${position.row}`}
            onClick={() => onCellClick?.(position)}
            onDragOver={(event) => {
              if (!onCellDrop) return;
              event.preventDefault();
            }}
            onDrop={(event) => {
              if (!onCellDrop) return;
              event.preventDefault();
              const tool = event.dataTransfer.getData("text/piece");
              if (tool === "hero" || tool === "radiation") {
                onCellDrop(tool, position);
              }
            }}
            onMouseEnter={() => onCellHover?.(position)}
            onMouseLeave={() => onCellHover?.(null)}
          >
            {mode === "result" ? (
              <span className="cell-count">{cell?.count ?? 0}</span>
            ) : (
              <span className="cell-count">
                {isHero && radiated ? "英+辐" : isHero ? "英雄" : radiated ? "辐射" : ""}
              </span>
            )}
            <span className="cell-coord">{formatPosition(position)}</span>
            {mode === "result" && cell && cell.heroIds.length > 0 && (
              <span className="dots">
                {cell.heroIds.map((id) => (
                  <span
                    key={id}
                    className="dot"
                    style={{ background: heroesById?.get(id) ? rarityColor(heroesById.get(id)!.rarity) : "#fff" }}
                  />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
