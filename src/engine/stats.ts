import { rarityName } from "../constants";
import type { BoardOverlay, BoardStats, ComparisonRow, Hero } from "../types";
import { CELL_COUNT, cellsToOffsets } from "./board";
import { computePlacementOverlay, heroRadiationCells } from "./radiation";

export function computeStats(overlay: BoardOverlay): BoardStats {
  let radiatedCells = 0;
  let maxCount = 0;
  let totalHits = 0;

  for (const row of overlay) {
    for (const cell of row) {
      totalHits += cell.count;
      if (cell.count > 0) {
        radiatedCells += 1;
      }
      if (cell.count > maxCount) {
        maxCount = cell.count;
      }
    }
  }

  const bestCellCount = maxCount === 0 ? 0 : overlay.flat().filter((cell) => cell.count === maxCount).length;

  return {
    radiatedCells,
    maxCount,
    totalHits,
    bestCellCount,
    average: CELL_COUNT === 0 ? 0 : totalHits / CELL_COUNT,
  };
}

export function heroPlacementStats(hero: Pick<Hero, "position" | "radiationCells">): BoardStats {
  const offsets = cellsToOffsets(hero.position, heroRadiationCells(hero));
  return computeStats(computePlacementOverlay(offsets));
}

export function buildComparisonRows(heroes: Hero[]): ComparisonRow[] {
  return heroes.map((hero) => {
    const stats = heroPlacementStats(hero);
    return {
      id: hero.id,
      name: hero.name,
      rarity: hero.rarity,
      rarityName: rarityName(hero.rarity),
      maxCount: stats.maxCount,
      bestCellCount: stats.bestCellCount,
      totalHits: stats.totalHits,
      average: stats.average,
    };
  });
}

export type ComparisonSortKey = keyof Pick<
  ComparisonRow,
  "name" | "rarityName" | "maxCount" | "bestCellCount" | "totalHits" | "average"
>;

export function sortComparisonRows(
  rows: ComparisonRow[],
  key: ComparisonSortKey,
  direction: "asc" | "desc",
): ComparisonRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const result = compareComparisonField(a, b, key);
    if (result !== 0) return result * factor;
    return a.name.localeCompare(b.name, "zh");
  });
}

function compareComparisonField(a: ComparisonRow, b: ComparisonRow, key: ComparisonSortKey): number {
  if (key === "name" || key === "rarityName") {
    return a[key].localeCompare(b[key], "zh");
  }
  return a[key] - b[key];
}
