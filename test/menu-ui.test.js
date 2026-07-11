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
