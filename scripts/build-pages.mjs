import { copyFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, ".next");
if (existsSync(nextDir)) rmSync(nextDir, { recursive: true, force: true });

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, PAGES: "1" },
  cwd: root,
});
if (result.status !== 0) {
  throw new Error(`next build failed: ${result.status}`);
}

const out = path.join(root, "out");
writeFileSync(path.join(out, ".nojekyll"), "");
writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify(
    {
      name: "Stamp",
      short_name: "Stamp",
      start_url: "/Stamp/phone/",
      display: "standalone",
      background_color: "#143028",
      theme_color: "#143028",
      icons: [{ src: "/Stamp/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    },
    null,
    2,
  ),
);

for (const name of ["demo.mp4", "pitch.mp4", "agora.mp4"]) {
  const from = path.join(root, "docs", name);
  if (existsSync(from)) copyFileSync(from, path.join(out, name));
}
