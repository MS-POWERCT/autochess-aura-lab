import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const stagingRoot = path.join(root, ".taptap-h5");
const staging = path.join(stagingRoot, "game");
const zipName = "自走棋辐射对比工具.zip";
const zipPath = path.join(root, zipName);

execSync("npx tsc --noEmit", { stdio: "inherit", cwd: root });
execSync("npx vite build --base ./", { stdio: "inherit", cwd: root });

rmSync(stagingRoot, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
cpSync(path.join(root, "dist"), staging, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

execSync(`zip -r ${JSON.stringify(zipPath)} game -x "*.DS_Store"`, {
  stdio: "inherit",
  cwd: stagingRoot,
});

rmSync(stagingRoot, { recursive: true, force: true });
console.log(`\n已生成 ${zipPath}`);
