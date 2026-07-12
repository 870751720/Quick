import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const game = readFileSync(new URL("../src/game.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("new game overwrite uses in-game confirmation UI", () => {
  assert.match(html, /id="new-game-confirm"/);
  assert.match(html, /id="confirm-new-game"/);
  assert.match(html, /id="cancel-new-game"/);
  assert.doesNotMatch(game, /\bconfirm\s*\(/);
  assert.match(game, /confirmNewGameButton\.onclick = startNewGame/);
  assert.match(game, /event\.key === "Escape"/);
});

test("browser entry and transitive modules share one cache version",()=>{
  const entryVersion=html.match(/src="src\/game\.js\?v=(\d+)"/)?.[1];
  const moduleVersions=[...game.matchAll(/from "\.\/[^"?]+\.js\?v=(\d+)"/g)].map((match)=>match[1]);
  assert.ok(entryVersion,"entry script has a cache version");
  assert.ok(moduleVersions.length>0,"game imports versioned modules");
  assert.deepEqual(new Set(moduleVersions),new Set([entryVersion]));
});
