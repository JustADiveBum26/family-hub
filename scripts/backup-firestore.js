// Snapshots the live Firestore data before every deploy, so a future data
// loss (accidental clear, bad edit, etc.) always has a recent restore point
// to fall back on. Writes into a private backups repo — never this repo,
// since this repo is public and the data includes account balances, bill
// amounts, and plaintext login PINs/passwords. See
// .github/workflows/deploy.yml for how this is invoked and where its output
// (BACKUP_OUT_DIR) actually ends up.
import { store } from "../src/store.js";
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

const outDir = process.env.BACKUP_OUT_DIR || "backups";
const KEEP = 60; // prune anything older once there are more than this many snapshots

async function main() {
  // Reuses the same export logic as the in-app "Download Backup" button
  // (store.dump(), also used by family.jsx) instead of a second hand-rolled
  // copy of the getDoc+JSON.parse dance, so a future fix to that logic only
  // has to happen once.
  const parsed = await store.dump();
  if (Object.keys(parsed).length === 0) {
    console.log("No Firestore document found — nothing to back up.");
    return;
  }
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = join(outDir, `family-hub-${stamp}.json`);
  writeFileSync(outFile, JSON.stringify(parsed, null, 2));
  console.log("Wrote backup:", outFile);

  const files = readdirSync(outDir)
    .filter(f => f.startsWith("family-hub-") && f.endsWith(".json"))
    .sort();
  const excess = files.length - KEEP;
  if (excess > 0) {
    for (const f of files.slice(0, excess)) {
      unlinkSync(join(outDir, f));
      console.log("Pruned old backup:", f);
    }
  }
}

main().catch(err => {
  console.error("Backup failed:", err);
  process.exit(1);
});
