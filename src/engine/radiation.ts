import type { BoardOverlay, Hero, Offset, Position } from "../types";
import { COLS, ROWS, allPositions, inBounds, uniquePositions } from "./board";

export function applyOffsets(origin: Position, offsets: Offset[]): Position[] {
  const cells: Position[] = [];
  for (const offset of offsets) {
    const col = origin.col + offset.dc;
    const row = origin.row + offset.dr;
    if (inBounds(col, row)) {
      cells.push({ col, row });
    }
  }
  return cells;
}

export function countValidRadiation(origin: Position, offsets: Offset[]): number {
  return applyOffsets(origin, offsets).length;
}

export function heroRadiationCells(hero: Pick<Hero, "radiationCells">): Position[] {
  return uniquePositions(hero.radiationCells);
}

export function createEmptyOverlay(): BoardOverlay {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ count: 0, heroIds: [] as string[] })),
  );
}

export function computePlacementOverlay(offsets: Offset[]): BoardOverlay {
  const overlay = createEmptyOverlay();
  for (const position of allPositions()) {
    overlay[position.row][position.col].count = countValidRadiation(position, offsets);
  }
  return overlay;
}
