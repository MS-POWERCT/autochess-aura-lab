export const COLS = 5;
export const ROWS = 4;
export const CELL_COUNT = COLS * ROWS;

export type Position = {
  col: number;
  row: number;
};

export type Offset = {
  dc: number;
  dr: number;
};

export type Rarity = "green" | "blue" | "purple" | "gold";

export type PlaceTool = "hero" | "radiation";

export type Hero = {
  id: string;
  name: string;
  position: Position;
  radiationCells: Position[];
  rarity: Rarity;
  selected: boolean;
  createdAt: number;
};

export type DraftHero = {
  name: string;
  position: Position | null;
  radiationCells: Position[];
  rarity: Rarity;
};

export type CellOverlay = {
  count: number;
  heroIds: string[];
};

export type BoardOverlay = CellOverlay[][];

export type BoardStats = {
  radiatedCells: number;
  maxCount: number;
  average: number;
  totalHits: number;
  bestCellCount: number;
};

export type BestPositionResult = {
  maxCount: number;
  theoreticalMax: number;
  positions: Position[];
};

export type SortBy = "manual" | "createdAt" | "name" | "totalHits";

export type Theme = "dark" | "light";

export type ImportMode = "merge" | "replace";

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  heroes: Hero[];
};

export type ComparisonRow = {
  id: string;
  name: string;
  rarity: Rarity;
  rarityName: string;
  maxCount: number;
  bestCellCount: number;
  totalHits: number;
  average: number;
};
