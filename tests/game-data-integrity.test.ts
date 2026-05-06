import test from "node:test";
import assert from "node:assert/strict";

import {
  advancedAttentionChallenges,
  advancedComparisonChallenges,
  advancedLogicChallenges,
  advancedMemoryChallenges,
  advancedSpatialChallenges,
} from "@/lib/advanced-game-data";
import {
  attentionChallenges,
  comparisonChallenges,
  exclusiveChallenges,
  focusVisionChallenges,
  logicChallenges,
  memoryChallenges,
  processChallenges,
  spatialChallenges,
  visualChallenges,
} from "@/lib/game-data-v3";
import { getMemoryFigure, getMemoryFigureMap, getStableVisualChoices } from "@/lib/memory-figures";
import type { MemoryChallenge } from "@/lib/types";

function assertUniqueIds(label: string, ids: number[]) {
  assert.equal(new Set(ids).size, ids.length, `${label} has duplicated ids`);
}

function assertMemoryFiguresAreUnique(challenges: MemoryChallenge[]) {
  challenges.forEach((challenge) => {
    [...challenge.variacoes, ...(challenge.variacoesInfantis ?? [])].forEach((variation, variationIndex) => {
      const choices = getStableVisualChoices(variation, challenge.variacoes, challenge.id, variationIndex);
      const figureMap = getMemoryFigureMap([...variation, ...choices]);
      const visibleFigures = choices.map((choice) => getMemoryFigure(choice, figureMap));

      assert.equal(
        new Set(visibleFigures).size,
        visibleFigures.length,
        `Memory challenge ${challenge.id}, variation ${variationIndex} has repeated visible figures`,
      );
    });
  });
}

test("all game tracks keep unique challenge ids", () => {
  assertUniqueIds("memory", memoryChallenges.map((item) => item.id));
  assertUniqueIds("advanced memory", advancedMemoryChallenges.map((item) => item.id));
  assertUniqueIds("visual", visualChallenges.map((item) => item.id));
  assertUniqueIds("attention", attentionChallenges.map((item) => item.id));
  assertUniqueIds("advanced attention", advancedAttentionChallenges.map((item) => item.id));
  assertUniqueIds("comparison", comparisonChallenges.map((item) => item.id));
  assertUniqueIds("advanced comparison", advancedComparisonChallenges.map((item) => item.id));
  assertUniqueIds("spatial", spatialChallenges.map((item) => item.id));
  assertUniqueIds("advanced spatial", advancedSpatialChallenges.map((item) => item.id));
  assertUniqueIds("exclusive", exclusiveChallenges.map((item) => item.id));
  assertUniqueIds("logic", logicChallenges.map((item) => item.id));
  assertUniqueIds("advanced logic", advancedLogicChallenges.map((item) => item.id));
  assertUniqueIds("process", processChallenges.map((item) => item.id));
  assertUniqueIds("focus vision", focusVisionChallenges.map((item) => item.id));
});

test("memory choices do not show duplicate visible figures inside a round", () => {
  assertMemoryFiguresAreUnique(memoryChallenges);
  assertMemoryFiguresAreUnique(advancedMemoryChallenges);
});

test("visual memory variations use unique symbols", () => {
  visualChallenges.forEach((challenge) => {
    challenge.variacoes.forEach((variation, index) => {
      assert.equal(new Set(variation).size, variation.length, `Visual challenge ${challenge.id}, variation ${index} repeats a symbol`);
      assert.ok(variation.length >= challenge.minimoParaConcluir, `Visual challenge ${challenge.id} cannot meet its minimum`);
    });
  });
});

test("all game variations can satisfy their completion minimum", () => {
  [...attentionChallenges, ...advancedAttentionChallenges].forEach((challenge) => {
    challenge.variacoes.forEach((variation) => {
      const targetCount = variation.grade.filter((cell) => cell === variation.alvo).length;
      assert.ok(targetCount >= challenge.minimoParaConcluir, `Attention challenge ${challenge.id} cannot meet its minimum`);
    });
  });

  [...comparisonChallenges, ...advancedComparisonChallenges].forEach((challenge) => {
    challenge.variacoes.forEach((variation) => {
      assert.ok(variation.rounds.length >= challenge.minimoParaConcluir, `Comparison challenge ${challenge.id} cannot meet its minimum`);
    });
  });

  [...spatialChallenges, ...advancedSpatialChallenges].forEach((challenge) => {
    challenge.variacoes.forEach((variation) => {
      assert.ok(variation.sequence.length >= challenge.minimoParaConcluir, `Spatial challenge ${challenge.id} cannot meet its minimum`);
    });
  });

  exclusiveChallenges.forEach((challenge) => {
    challenge.variacoes.forEach((variation) => {
      assert.ok(variation.sequence.length >= challenge.minimoParaConcluir, `Exclusive challenge ${challenge.id} cannot meet its minimum`);
    });
  });

  [...logicChallenges, ...advancedLogicChallenges].forEach((challenge) => {
    challenge.variacoes.forEach((variation) => {
      assert.ok(variation.rounds.length >= challenge.minimoParaConcluir, `Logic challenge ${challenge.id} cannot meet its minimum`);
    });
  });

  processChallenges.forEach((challenge) => {
    challenge.variacoes.forEach((variation) => {
      assert.ok(variation.steps.length >= challenge.minimoParaConcluir, `Process challenge ${challenge.id} cannot meet its minimum`);
    });
  });

  focusVisionChallenges.forEach((challenge) => {
    challenge.variacoes.forEach((variation) => {
      assert.ok(variation.targetCount >= challenge.minimoParaConcluir, `Focus challenge ${challenge.id} cannot meet its minimum`);
      assert.ok(!variation.distratores.includes(variation.alvo), `Focus challenge ${challenge.id} repeats target as distractor`);
    });
  });
});
