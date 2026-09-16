import type { Rarity } from "./types";
import greenPack from "../docs/爪爪辐射-绿色.json";
import bluePack from "../docs/爪爪辐射-蓝色.json";
import purplePack from "../docs/爪爪辐射-紫色.json";
import goldPack from "../docs/爪爪辐射-金色.json";

export type BuiltinPreset = {
  id: Rarity;
  name: string;
  description: string;
  rarity: Rarity;
  count: number;
  payload: unknown;
};

function heroCount(payload: unknown): number {
  if (!payload || typeof payload !== "object" || !("heroes" in payload)) return 0;
  const heroes = (payload as { heroes: unknown }).heroes;
  return Array.isArray(heroes) ? heroes.length : 0;
}

export const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    id: "green",
    name: "绿色英雄",
    description: "常见基础棋子",
    rarity: "green",
    payload: greenPack,
    count: heroCount(greenPack),
  },
  {
    id: "blue",
    name: "蓝色英雄",
    description: "进阶阵容核心",
    rarity: "blue",
    payload: bluePack,
    count: heroCount(bluePack),
  },
  {
    id: "purple",
    name: "紫色英雄",
    description: "高费关键棋子",
    rarity: "purple",
    payload: purplePack,
    count: heroCount(purplePack),
  },
  {
    id: "gold",
    name: "金色英雄",
    description: "传说级棋子合集",
    rarity: "gold",
    payload: goldPack,
    count: heroCount(goldPack),
  },
];
