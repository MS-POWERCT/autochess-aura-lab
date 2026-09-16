import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_PACKS = [
  ["爪爪辐射-绿色.json", 5],
  ["爪爪辐射-蓝色.json", 9],
  ["爪爪辐射-紫色.json", 9],
  ["爪爪辐射-金色.json", 34],
];

test("docs packs match the built-in import catalog", () => {
  const files = readdirSync(join(root, "docs")).filter((name) => name.endsWith(".json"));
  assert.deepEqual(
    files.sort(),
    EXPECTED_PACKS.map(([name]) => name).sort(),
  );

  for (const [name, count] of EXPECTED_PACKS) {
    const data = JSON.parse(readFileSync(join(root, "docs", name), "utf8"));
    assert.equal(data.version, 1);
    assert.equal(data.heroes.length, count);
    for (const hero of data.heroes) {
      assert.equal(typeof hero.name, "string");
      assert.equal(typeof hero.position?.col, "number");
      assert.equal(typeof hero.position?.row, "number");
      assert.ok(hero.position.col >= 0 && hero.position.col <= 4);
      assert.ok(hero.position.row >= 0 && hero.position.row <= 3);
      assert.ok(Array.isArray(hero.radiationCells));
      for (const cell of hero.radiationCells) {
        assert.ok(cell.col >= 0 && cell.col <= 4);
        assert.ok(cell.row >= 0 && cell.row <= 3);
      }
    }
  }
});

test("app name is auto-chess themed", () => {
  const constants = readFileSync(join(root, "src/constants.ts"), "utf8");
  const html = readFileSync(join(root, "index.html"), "utf8");
  const exportEngine = readFileSync(join(root, "src/engine/importExport.ts"), "utf8");
  const header = readFileSync(join(root, "src/components/Header.tsx"), "utf8");

  assert.match(constants, /自走棋辐射对比工具/);
  assert.match(constants, /适用于自走棋/);
  assert.doesNotMatch(constants, /爪爪大乱斗/);
  assert.match(html, /自走棋辐射对比工具/);
  assert.match(exportEngine, /自走棋辐射-\$\{suffix\}/);
  assert.match(header, /APP_SUBTITLE/);
});

test("readme uses the github project names", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.match(readme, /autochess-aura-lab/);
  assert.match(readme, /Auto Chess Aura Lab/);
  assert.match(readme, /自走棋辐射对比工具/);
  assert.match(readme, /npm run dev/);
});

test("import modal lists built-in packs and a styled file drop", () => {
  const modal = readFileSync(join(root, "src/components/ImportExportModals.tsx"), "utf8");
  const css = readFileSync(join(root, "src/index.css"), "utf8");
  const presets = readFileSync(join(root, "src/presets.ts"), "utf8");

  assert.match(modal, /BUILTIN_PRESETS/);
  assert.match(modal, /file-drop/);
  assert.match(presets, /爪爪辐射-绿色\.json/);
  assert.match(css, /\.preset-card/);
  assert.match(css, /\.file-drop/);
  assert.match(css, /\.import-btn/);
});

test("brand logo and favicon are wired up", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const header = readFileSync(join(root, "src/components/Header.tsx"), "utf8");
  const css = readFileSync(join(root, "src/index.css"), "utf8");

  assert.equal(existsSync(join(root, "public/logo.png")), true);
  assert.equal(existsSync(join(root, "public/favicon.ico")), true);
  assert.equal(existsSync(join(root, "public/apple-touch-icon.png")), true);
  assert.match(html, /rel="icon" href="\/favicon\.ico"/);
  assert.match(html, /apple-touch-icon/);
  assert.match(header, /src="\/logo\.png"/);
  assert.match(css, /\.brand-logo/);
});
