import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (relativePath: string) => readFileSync(resolve(repoRoot, relativePath), "utf8");

const navigation = read("src/components/site.tsx");
const guide = read("src/routes/add-to-home-screen.tsx");

assert.equal(
  navigation.match(/to="\/add-to-home-screen"/g)?.length,
  2,
  "the guide should be linked from the landing header and the sidebar",
);
assert.match(navigation, /Add to home screen/);
assert.match(guide, /createFileRoute\("\/add-to-home-screen"\)/);
assert.match(guide, /iPhone/);
assert.match(guide, /Safari/);
assert.match(guide, /Android/);
assert.match(guide, /Chrome/);
assert.match(guide, /Add to Home Screen/);
assert.match(guide, /support\.apple\.com/);
assert.match(guide, /developer\.chrome\.com/);
assert.match(guide, /IOS_REFERENCE_IMAGE/);
assert.match(guide, /ANDROID_REFERENCE_IMAGE/);
assert.match(guide, /Reference screenshot/);

console.log("home-screen guide contract passed");
