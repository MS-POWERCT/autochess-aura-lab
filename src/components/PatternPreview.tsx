import { COLS, ROWS, isSamePosition, positionKey } from "../engine/board";
import type { Position } from "../types";

type PatternPreviewProps = {
  name: string;
  position: Position;
  radiationCells: Position[];
  color: string;
};

export function PatternPreview({ name, position, radiationCells, color }: PatternPreviewProps) {
  const radiationKeys = new Set(radiationCells.map(positionKey));
  const cells: Position[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      cells.push({ col, row });
    }
  }

  return (
    <div className="pattern-preview" role="img" aria-label={`${name}辐射样式`}>
      {cells.map((cell) => {
        const isHero = isSamePosition(cell, position);
        const isRadiation = radiationKeys.has(positionKey(cell));
        return (
          <span
            key={positionKey(cell)}
            className={`pattern-cell ${isHero ? "is-hero" : ""} ${isRadiation ? "is-radiation" : ""}`}
            style={
              isHero
                ? { background: color, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55)" }
                : isRadiation
                  ? { background: color, opacity: 0.45 }
                  : undefined
            }
          />
        );
      })}
    </div>
  );
}
