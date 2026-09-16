import { STORAGE_KEY, parseRarity } from "../constants";
import { parseHero } from "../engine/importExport";
import type { Hero, Rarity, SortBy, Theme } from "../types";

export type PersistedState = {
  version: 1;
  heroes: Hero[];
  theme: Theme;
  sortBy: SortBy;
  comparisonOpen: boolean;
  preferredRarity: Rarity;
};

export function loadPersistedState(raw: string | null): PersistedState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<PersistedState>;
    if (data.version !== 1 || !Array.isArray(data.heroes)) return null;
    const heroes: Hero[] = [];
    for (let index = 0; index < data.heroes.length; index += 1) {
      const parsed = parseHero(data.heroes[index], index);
      if (!parsed.ok) return null;
      heroes.push(parsed.hero);
    }
    return {
      version: 1,
      heroes,
      theme: data.theme === "dark" ? "dark" : "light",
      sortBy: isSortBy(data.sortBy) ? normalizeSortBy(data.sortBy) : "manual",
      comparisonOpen: Boolean(data.comparisonOpen),
      preferredRarity: parseRarity(data.preferredRarity),
    };
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedState): string {
  return JSON.stringify(state);
}

export function readLocalStorage(): PersistedState | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  return loadPersistedState(storage.getItem(STORAGE_KEY));
}

export function writeLocalStorage(state: PersistedState): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, savePersistedState(state));
}

function getLocalStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  try {
    if (typeof localStorage === "undefined") return null;
    if (typeof localStorage.getItem !== "function" || typeof localStorage.setItem !== "function") {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

function isSortBy(value: unknown): value is SortBy | "efficiency" {
  return value === "manual" || value === "createdAt" || value === "name" || value === "totalHits" || value === "efficiency";
}

function normalizeSortBy(value: SortBy | "efficiency"): SortBy {
  return value === "efficiency" ? "totalHits" : value;
}
