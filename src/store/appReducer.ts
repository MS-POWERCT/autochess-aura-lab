import { uniquePositions } from "../engine/board";
import { mergeHeroes } from "../engine/importExport";
import { heroPlacementStats } from "../engine/stats";
import type { DraftHero, Hero, ImportMode, PlaceTool, Position, Rarity, SortBy, Theme } from "../types";
import { cloneHeroes, emptyHistory, pushHistory, redo, undo, type HistoryState } from "./history";

export type AppState = {
  heroes: Hero[];
  editingId: string | null;
  draft: DraftHero;
  placeTool: PlaceTool;
  search: string;
  sortBy: SortBy;
  theme: Theme;
  comparisonOpen: boolean;
  hoveredHeroId: string | null;
  hoveredCell: Position | null;
  history: HistoryState;
  seed: number;
  preferredRarity: Rarity;
};

export type AppAction =
  | { type: "hydrate"; heroes: Hero[]; theme: Theme; sortBy: SortBy; comparisonOpen: boolean; preferredRarity?: Rarity }
  | { type: "start-create" }
  | { type: "start-edit"; id: string }
  | { type: "update-draft"; patch: Partial<DraftHero> }
  | { type: "set-place-tool"; tool: PlaceTool }
  | { type: "place-piece"; tool?: PlaceTool; position: Position; mode?: "toggle" | "set" }
  | { type: "save-draft" }
  | { type: "reset-draft" }
  | { type: "delete-hero"; id: string }
  | { type: "duplicate-hero"; id: string }
  | { type: "toggle-select"; id: string }
  | { type: "set-search"; search: string }
  | { type: "set-sort"; sortBy: SortBy }
  | { type: "reorder"; ids: string[] }
  | { type: "set-theme"; theme: Theme }
  | { type: "set-comparison-open"; open: boolean }
  | { type: "hover-hero"; id: string | null }
  | { type: "hover-cell"; position: Position | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "import-heroes"; heroes: Hero[]; mode: ImportMode };

export function createDraft(rarity: Rarity, name = ""): DraftHero {
  return {
    name,
    position: null,
    radiationCells: [],
    rarity,
  };
}

export function createInitialState(now = 0): AppState {
  return {
    heroes: [],
    editingId: null,
    draft: createDraft("green"),
    placeTool: "hero",
    search: "",
    sortBy: "manual",
    theme: "light",
    comparisonOpen: true,
    hoveredHeroId: null,
    hoveredCell: null,
    history: emptyHistory(),
    seed: now,
    preferredRarity: "green",
  };
}

export function nextHeroName(heroes: Hero[]): string {
  return `英雄${heroes.length + 1}`;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate": {
      const preferredRarity = action.preferredRarity ?? "green";
      return {
        ...state,
        heroes: cloneHeroes(action.heroes),
        theme: action.theme,
        sortBy: action.sortBy,
        comparisonOpen: action.comparisonOpen,
        preferredRarity,
        draft: createDraft(preferredRarity),
        placeTool: "hero",
      };
    }
    case "start-create":
      return {
        ...state,
        editingId: null,
        placeTool: "hero",
        draft: createDraft(state.preferredRarity, nextHeroName(state.heroes)),
      };
    case "start-edit": {
      const hero = state.heroes.find((item) => item.id === action.id);
      if (!hero) return state;
      return {
        ...state,
        editingId: hero.id,
        placeTool: "hero",
        draft: draftFromHero(hero),
      };
    }
    case "update-draft":
      return {
        ...state,
        draft: { ...state.draft, ...action.patch },
        preferredRarity: action.patch.rarity ?? state.preferredRarity,
      };
    case "set-place-tool":
      return { ...state, placeTool: action.tool };
    case "place-piece": {
      const tool = action.tool ?? state.placeTool;
      const mode = action.mode ?? "toggle";
      if (tool === "hero") {
        return { ...state, draft: { ...state.draft, position: action.position } };
      }
      const exists = state.draft.radiationCells.some(
        (cell) => cell.col === action.position.col && cell.row === action.position.row,
      );
      if (mode === "set" && exists) {
        return state;
      }
      const radiationCells =
        mode === "set"
          ? uniquePositions([...state.draft.radiationCells, action.position])
          : exists
            ? state.draft.radiationCells.filter(
                (cell) => cell.col !== action.position.col || cell.row !== action.position.row,
              )
            : uniquePositions([...state.draft.radiationCells, action.position]);
      return { ...state, draft: { ...state.draft, radiationCells } };
    }
    case "save-draft": {
      const saved = saveDraftHero(state);
      if (!saved) return state;
      return {
        ...saved,
        preferredRarity: state.draft.rarity,
        history: pushHistory(state.history, state.heroes),
      };
    }
    case "reset-draft": {
      if (state.editingId) {
        const hero = state.heroes.find((item) => item.id === state.editingId);
        if (!hero) return state;
        return { ...state, placeTool: "hero", draft: draftFromHero(hero) };
      }
      return {
        ...state,
        placeTool: "hero",
        draft: createDraft(state.draft.rarity, state.draft.name),
      };
    }
    case "delete-hero": {
      const heroes = state.heroes.filter((hero) => hero.id !== action.id);
      return {
        ...state,
        heroes,
        history: pushHistory(state.history, state.heroes),
        editingId: state.editingId === action.id ? null : state.editingId,
        placeTool: state.editingId === action.id ? "hero" : state.placeTool,
        draft:
          state.editingId === action.id
            ? createDraft(state.preferredRarity, nextHeroName(heroes))
            : state.draft,
      };
    }
    case "duplicate-hero": {
      const hero = state.heroes.find((item) => item.id === action.id);
      if (!hero) return state;
      const copy: Hero = {
        ...cloneHeroes([hero])[0],
        id: createId(state.heroes, state.seed + state.heroes.length + 1),
        name: `${hero.name} 副本`,
        createdAt: hero.createdAt + 1,
        selected: true,
      };
      return {
        ...state,
        heroes: [...state.heroes, copy],
        history: pushHistory(state.history, state.heroes),
      };
    }
    case "toggle-select":
      return {
        ...state,
        history: pushHistory(state.history, state.heroes),
        heroes: state.heroes.map((hero) =>
          hero.id === action.id ? { ...hero, selected: !hero.selected } : hero,
        ),
      };
    case "set-search":
      return { ...state, search: action.search };
    case "set-sort":
      return { ...state, sortBy: action.sortBy };
    case "reorder": {
      const map = new Map(state.heroes.map((hero) => [hero.id, hero]));
      const heroes = action.ids.map((id) => map.get(id)).filter((hero): hero is Hero => Boolean(hero));
      for (const hero of state.heroes) {
        if (!action.ids.includes(hero.id)) heroes.push(hero);
      }
      return {
        ...state,
        sortBy: "manual",
        heroes,
        history: pushHistory(state.history, state.heroes),
      };
    }
    case "set-theme":
      return { ...state, theme: action.theme };
    case "set-comparison-open":
      return { ...state, comparisonOpen: action.open };
    case "hover-hero":
      return { ...state, hoveredHeroId: action.id };
    case "hover-cell":
      return { ...state, hoveredCell: action.position };
    case "undo": {
      const result = undo(state.history, state.heroes);
      if (!result) return state;
      return { ...state, heroes: result.heroes, history: result.history };
    }
    case "redo": {
      const result = redo(state.history, state.heroes);
      if (!result) return state;
      return { ...state, heroes: result.heroes, history: result.history };
    }
    case "import-heroes": {
      const heroes = action.mode === "replace" ? cloneHeroes(action.heroes) : mergeHeroes(state.heroes, action.heroes);
      return {
        ...state,
        heroes,
        history: pushHistory(state.history, state.heroes),
        editingId: null,
        placeTool: "hero",
        draft: createDraft(state.preferredRarity, nextHeroName(heroes)),
      };
    }
    default:
      return state;
  }
}

export function visibleHeroes(state: AppState): Hero[] {
  const keyword = state.search.trim().toLowerCase();
  const filtered = keyword
    ? state.heroes.filter((hero) => hero.name.toLowerCase().includes(keyword))
    : [...state.heroes];

  if (state.sortBy === "name") {
    return filtered.sort((a, b) => a.name.localeCompare(b.name, "zh"));
  }
  if (state.sortBy === "createdAt") {
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }
  if (state.sortBy === "totalHits") {
    return filtered.sort((a, b) => heroPlacementStats(b).totalHits - heroPlacementStats(a).totalHits);
  }
  return filtered;
}

export function selectedHeroes(heroes: Hero[]): Hero[] {
  return heroes.filter((hero) => hero.selected);
}

function draftFromHero(hero: Hero): DraftHero {
  return {
    name: hero.name,
    position: { ...hero.position },
    radiationCells: uniquePositions(hero.radiationCells),
    rarity: hero.rarity,
  };
}

function saveDraftHero(state: AppState): AppState | null {
  const name = state.draft.name.trim();
  if (!name || !state.draft.position) return null;

  const payload: Omit<Hero, "id" | "createdAt" | "selected"> = {
    name,
    position: state.draft.position,
    radiationCells: uniquePositions(state.draft.radiationCells),
    rarity: state.draft.rarity,
  };

  if (state.editingId) {
    return {
      ...state,
      heroes: state.heroes.map((hero) =>
        hero.id === state.editingId ? { ...hero, ...payload } : hero,
      ),
    };
  }

  const hero: Hero = {
    ...payload,
    id: createId(state.heroes, state.seed + state.heroes.length),
    createdAt: state.seed + state.heroes.length + 1,
    selected: true,
  };

  return {
    ...state,
    heroes: [...state.heroes, hero],
    editingId: hero.id,
  };
}

function createId(heroes: Hero[], seed: number): string {
  const used = new Set(heroes.map((hero) => hero.id));
  let id = `hero-${seed}`;
  let index = seed;
  while (used.has(id)) {
    index += 1;
    id = `hero-${index}`;
  }
  return id;
}
