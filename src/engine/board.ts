import { CELL_COUNT, COLS, ROWS, type Offset, type Position } from "../types";

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

export function isSamePosition(a: Position, b: Position): boolean {
  return a.col === b.col && a.row === b.row;
}

export function positionKey(position: Position): string {
  return `${position.col},${position.row}`;
}

export function formatPosition(position: Position): string {
  return `(${position.col},${position.row})`;
}

export function allPositions(): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      positions.push({ col, row });
    }
  }
  return positions;
}

export function offsetKey(offset: Offset): string {
  return `${offset.dc},${offset.dr}`;
}

export function uniqueOffsets(offsets: Offset[]): Offset[] {
  const seen = new Set<string>();
  const result: Offset[] = [];
  for (const offset of offsets) {
    const key = offsetKey(offset);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ dc: offset.dc, dr: offset.dr });
  }
  return result;
}

export function uniquePositions(positions: Position[]): Position[] {
  const seen = new Set<string>();
  const result: Position[] = [];
  for (const position of positions) {
    if (!inBounds(position.col, position.row)) continue;
    const key = positionKey(position);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ col: position.col, row: position.row });
  }
  return result;
}

export function hasPosition(positions: Position[], position: Position): boolean {
  return positions.some((item) => isSamePosition(item, position));
}

export function togglePosition(positions: Position[], position: Position): Position[] {
  if (hasPosition(positions, position)) {
    return positions.filter((item) => !isSamePosition(item, position));
  }
  return uniquePositions([...positions, position]);
}

export function cellsToOffsets(origin: Position, cells: Position[]): Offset[] {
  return uniqueOffsets(
    cells.map((cell) => ({
      dc: cell.col - origin.col,
      dr: cell.row - origin.row,
    })),
  );
}

export { CELL_COUNT, COLS, ROWS };
