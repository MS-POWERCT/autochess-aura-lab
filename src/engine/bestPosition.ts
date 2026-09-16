import { CELL_COUNT, type BestPositionResult, type Offset, type Position } from "../types";
import { allPositions } from "./board";
import { countValidRadiation } from "./radiation";

export function theoreticalMax(offsets: Offset[]): number {
  return offsets.length;
}

export function findBestPositions(offsets: Offset[]): BestPositionResult {
  const maxPossible = theoreticalMax(offsets);
  let maxCount = 0;
  const scored: { position: Position; count: number }[] = [];

  for (const position of allPositions()) {
    const count = countValidRadiation(position, offsets);
    scored.push({ position, count });
    if (count > maxCount) {
      maxCount = count;
    }
  }

  return {
    maxCount,
    theoreticalMax: maxPossible,
    positions: scored.filter((item) => item.count === maxCount).map((item) => item.position),
  };
}

export function efficiency(validCount: number, max: number): number {
  if (max <= 0) return 0;
  return (validCount / max) * 100;
}

export function averageHits(totalHits: number, cellCount = CELL_COUNT): number {
  if (cellCount <= 0) return 0;
  return totalHits / cellCount;
}
