import type { Theme } from "../types";

export function heatColor(count: number, maxCount: number, theme: Theme): string {
  if (count <= 0) {
    return theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(15, 23, 42, 0.05)";
  }
  const t = maxCount <= 0 ? 1 : Math.min(1, count / maxCount);
  const hue = 46 - t * 42;
  const sat = 92;
  const light = theme === "dark" ? 24 + t * 32 : 78 - t * 36;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function formatAverage(value: number): string {
  return value.toFixed(2);
}
