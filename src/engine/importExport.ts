import { parseRarity } from "../constants";
import type { ExportPayload, Hero, Offset, Position, Rarity } from "../types";
import { applyOffsets } from "./radiation";
import { inBounds, uniqueOffsets, uniquePositions } from "./board";

export const EXPORT_VERSION = 1 as const;

export function createExportPayload(heroes: Hero[], now = new Date()): ExportPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    heroes: heroes.map(cloneHero),
  };
}

export function serializeExport(heroes: Hero[], now = new Date()): string {
  return JSON.stringify(createExportPayload(heroes, now), null, 2);
}

export type ParseResult =
  | { ok: true; heroes: Hero[] }
  | { ok: false; error: string };

export function parseImport(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "文件不是有效的 JSON" };
  }
  return parseImportData(data);
}

export function parseImportData(data: unknown): ParseResult {
  if (!isRecord(data)) {
    return { ok: false, error: "导入数据格式不正确" };
  }

  if (data.version !== EXPORT_VERSION) {
    return { ok: false, error: `不支持的数据版本：${String(data.version)}` };
  }

  if (!Array.isArray(data.heroes)) {
    return { ok: false, error: "缺少英雄列表" };
  }

  const heroes: Hero[] = [];
  for (let index = 0; index < data.heroes.length; index += 1) {
    const parsed = parseHero(data.heroes[index], index);
    if (!parsed.ok) return parsed;
    heroes.push(parsed.hero);
  }

  return { ok: true, heroes };
}

export function mergeHeroes(existing: Hero[], incoming: Hero[]): Hero[] {
  const usedIds = new Set(existing.map((hero) => hero.id));
  const merged = [...existing];
  for (const hero of incoming) {
    let id = hero.id;
    if (usedIds.has(id)) {
      id = allocateId(usedIds);
    }
    usedIds.add(id);
    merged.push({ ...cloneHero(hero), id });
  }
  return merged;
}

export function defaultExportFilename(now = new Date(), suffix = "全部"): string {
  const stamp = formatStamp(now);
  return `自走棋辐射-${suffix}-${stamp}.json`;
}

export function parseHero(value: unknown, index: number): { ok: true; hero: Hero } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: `第 ${index + 1} 个英雄格式不正确` };
  }

  const position = parsePosition(value.position);
  if (!position) {
    return { ok: false, error: `第 ${index + 1} 个英雄位置无效` };
  }

  const radiationCells = parseRadiationCells(value, position);
  if (!radiationCells) {
    return { ok: false, error: `第 ${index + 1} 个英雄辐射范围无效` };
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) {
    return { ok: false, error: `第 ${index + 1} 个英雄缺少名称` };
  }

  const id = typeof value.id === "string" && value.id.trim() ? value.id : `imported-${index}`;
  const rarity: Rarity = parseRarity(value.rarity ?? value.level);
  const selected = typeof value.selected === "boolean" ? value.selected : true;
  const createdAt = Number.isFinite(value.createdAt) ? Number(value.createdAt) : Date.now() + index;

  return {
    ok: true,
    hero: {
      id,
      name,
      position,
      radiationCells,
      rarity,
      selected,
      createdAt,
    },
  };
}

function parseRadiationCells(value: Record<string, unknown>, position: Position): Position[] | null {
  if (Array.isArray(value.radiationCells)) {
    const cells: Position[] = [];
    for (const item of value.radiationCells) {
      const parsed = parsePosition(item);
      if (!parsed) return null;
      cells.push(parsed);
    }
    return uniquePositions(cells);
  }

  const offsets = parseOffsets(value.offsets);
  if (!offsets) return null;
  return uniquePositions(applyOffsets(position, offsets));
}

function parsePosition(value: unknown): Position | null {
  if (!isRecord(value)) return null;
  if (!Number.isInteger(value.col) || !Number.isInteger(value.row)) return null;
  if (!inBounds(Number(value.col), Number(value.row))) return null;
  return { col: Number(value.col), row: Number(value.row) };
}

function parseOffsets(value: unknown): Offset[] | null {
  if (!Array.isArray(value)) return null;
  const offsets: Offset[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (!Number.isInteger(item.dc) || !Number.isInteger(item.dr)) return null;
    offsets.push({ dc: Number(item.dc), dr: Number(item.dr) });
  }
  return uniqueOffsets(offsets);
}

function cloneHero(hero: Hero): Hero {
  return {
    ...hero,
    position: { ...hero.position },
    radiationCells: uniquePositions(hero.radiationCells),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function allocateId(used: Set<string>): string {
  let index = used.size;
  let id = `hero-${index}`;
  while (used.has(id)) {
    index += 1;
    id = `hero-${index}`;
  }
  return id;
}

function formatStamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
