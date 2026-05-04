import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getReviewReflection } from "@/components/ReviewMetrics";

const projectRoot = process.cwd();

test("review reflection points the student to process, not only score", () => {
  const reflection = getReviewReflection([
    { label: "Acertos", value: "2" },
    { label: "Erros", value: "1" },
    { label: "Tempo", value: "8s" },
  ]);

  assert.equal(reflection.title, "Atenção ao impulso");
  assert.match(reflection.question, /pressa|distração|regra/);
  assert.match(reflection.action, /próxima tentativa/);
});

test("internal technical keys stay unaccented while user-facing labels may be accented", () => {
  const files = [
    "components/AdminScreen.tsx",
    "components/Dashboard.tsx",
    "components/InternalAssistant.tsx",
    "lib/product-management.ts",
    "lib/training-insights.ts",
    "lib/game-data-v3.ts",
  ];
  const source = files.map((file) => readFileSync(join(projectRoot, file), "utf8")).join("\n");

  assert.doesNotMatch(source, /"excluído"|excluído:/);
  assert.doesNotMatch(source, /"evolução"/);
  assert.doesNotMatch(source, /"raciocínio"/);
  assert.doesNotMatch(source, /sequências:/);
});
