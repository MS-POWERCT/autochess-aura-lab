import type { Rarity } from "./types";

export const RARITIES: { id: Rarity; name: string; color: string }[] = [
  { id: "green", name: "绿色", color: "#22c55e" },
  { id: "blue", name: "蓝色", color: "#3b82f6" },
  { id: "purple", name: "紫色", color: "#a855f7" },
  { id: "gold", name: "金黄色", color: "#eab308" },
];

export const STORAGE_KEY = "claw-clash-radiation-v1";
export const HISTORY_LIMIT = 50;
export const APP_TITLE = "自走棋辐射对比工具";
export const APP_SUBTITLE = "5×4 棋盘光环站位 · 适用于自走棋";

export function rarityMeta(id: Rarity) {
  return RARITIES.find((item) => item.id === id) ?? RARITIES[0];
}

export function rarityColor(id: Rarity): string {
  return rarityMeta(id).color;
}

export function rarityName(id: Rarity): string {
  return rarityMeta(id).name;
}

export function parseRarity(value: unknown): Rarity {
  if (value === "green" || value === "blue" || value === "purple" || value === "gold") {
    return value;
  }
  if (value === 1 || value === "1") return "green";
  if (value === 2 || value === "2") return "blue";
  if (value === 3 || value === "3") return "purple";
  if (typeof value === "number" && value >= 4) return "gold";
  if (typeof value === "string") {
    if (value.includes("绿") || value.toLowerCase().includes("green")) return "green";
    if (value.includes("蓝") || value.toLowerCase().includes("blue")) return "blue";
    if (value.includes("紫") || value.toLowerCase().includes("purple")) return "purple";
    if (value.includes("金") || value.toLowerCase().includes("gold") || value.toLowerCase().includes("yellow")) {
      return "gold";
    }
  }
  return "green";
}
