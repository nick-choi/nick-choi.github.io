import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
// Preserve actual installed dependency license text in the deployed artifact.
const blocks: string[] = [
  "SilverBullet Static Viewer — Third-party notices\n\nSilverBullet styling and original fonts are adapted/reused from:\nhttps://github.com/silverbulletmd/silverbullet\nCommit: 3ee1f82deedf4d083bb1adde43f131448082abc6\n\nSilverBullet MIT license: SilverBullet-MIT.txt\niA Writer Mono / IBM Plex SIL OFL 1.1: iA-Writer-Mono.txt\n\nThis is an independent read-only viewer, not an official SilverBullet release.",
];
async function packages(dir: string) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith("@")) {
      await packages(full);
      continue;
    }
    try {
      const pkg = JSON.parse(
        await readFile(path.join(full, "package.json"), "utf8"),
      );
      const names = (await readdir(full)).filter((f) =>
        /^(license|licence|copying|notice)(\.|$)/i.test(f),
      );
      const texts = [];
      for (const name of names) {
        try {
          texts.push(
            `${name}:\n${await readFile(path.join(full, name), "utf8")}`,
          );
        } catch {}
      }
      blocks.push(
        `${pkg.name}@${pkg.version}\nLicense: ${JSON.stringify(pkg.license)}\n${texts.join("\n\n") || "See package repository for license: " + JSON.stringify(pkg.repository)}`,
      );
    } catch {}
  }
}
await packages("node_modules");
await writeFile(
  "public/licenses/THIRD-PARTY-NOTICES.txt",
  blocks.join("\n\n" + "=".repeat(72) + "\n\n"),
);
console.log(`Collected notices for ${blocks.length - 1} installed packages`);
