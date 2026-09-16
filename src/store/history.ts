import { HISTORY_LIMIT } from "../constants";
import type { Hero } from "../types";

export type HistoryState = {
  past: Hero[][];
  future: Hero[][];
};

export function emptyHistory(): HistoryState {
  return { past: [], future: [] };
}

export function cloneHeroes(heroes: Hero[]): Hero[] {
  return heroes.map((hero) => ({
    ...hero,
    position: { ...hero.position },
    radiationCells: hero.radiationCells.map((cell) => ({ ...cell })),
  }));
}

export function pushHistory(history: HistoryState, current: Hero[]): HistoryState {
  const past = [...history.past, cloneHeroes(current)].slice(-HISTORY_LIMIT);
  return { past, future: [] };
}

export function undo(history: HistoryState, current: Hero[]): { history: HistoryState; heroes: Hero[] } | null {
  if (history.past.length === 0) return null;
  const past = [...history.past];
  const previous = past.pop() as Hero[];
  return {
    heroes: previous,
    history: {
      past,
      future: [cloneHeroes(current), ...history.future].slice(0, HISTORY_LIMIT),
    },
  };
}

export function redo(history: HistoryState, current: Hero[]): { history: HistoryState; heroes: Hero[] } | null {
  if (history.future.length === 0) return null;
  const [next, ...future] = history.future;
  return {
    heroes: next,
    history: {
      past: [...history.past, cloneHeroes(current)].slice(-HISTORY_LIMIT),
      future,
    },
  };
}
