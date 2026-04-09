import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateAttentionRound,
  evaluateAudienceRound,
  evaluateComparisonRound,
  evaluateLogicRound,
  evaluateMemoryRound,
  evaluateSpatialRound,
  getNextVariationIndex,
} from "@/lib/game-logic";

test("getNextVariationIndex avoids repeating the current variation when there is more than one option", () => {
  assert.equal(getNextVariationIndex(3, 1, 0.4), 2);
  assert.equal(getNextVariationIndex(3, 2, 0.8), 0);
});

test("getNextVariationIndex keeps zero when there is only one variation", () => {
  assert.equal(getNextVariationIndex(1, 0, 0.9), 0);
});

test("evaluateMemoryRound counts hits, wrong words and missed words correctly", () => {
  const result = evaluateMemoryRound({
    expectedWords: ["casa", "livro", "sol"],
    response: "Casa, livro, gato, livro",
    answerSeconds: 4,
    memorizationSeconds: 8,
    minimumToComplete: 2,
  });

  assert.deepEqual(result.hits, ["casa", "livro"]);
  assert.deepEqual(result.wrongWords, ["gato"]);
  assert.deepEqual(result.missedWords, ["sol"]);
  assert.equal(result.completed, true);
  assert.equal(result.score, 21);
});

test("evaluateAttentionRound applies error penalty and completion threshold", () => {
  const result = evaluateAttentionRound({
    foundCount: 3,
    totalTargets: 5,
    wrongClicks: 2,
    timeLeft: 6,
    timeLimit: 14,
    minimumToComplete: 4,
  });

  assert.equal(result.completed, false);
  assert.equal(result.elapsedSeconds, 8);
  assert.equal(result.score, 15);
});

test("evaluateAudienceRound validates ordered sequence and scoring", () => {
  const result = evaluateAudienceRound({
    expectedSequence: ["A7", "K2", "M9", "R4"],
    selectedSequence: ["A7", "K2", "R4", "M9"],
    answerSeconds: 5,
    revealSeconds: 6,
    minimumToComplete: 4,
  });

  assert.deepEqual(result.hits, ["A7", "K2"]);
  assert.deepEqual(result.misses, ["M9", "R4"]);
  assert.equal(result.completed, false);
  assert.equal(result.score, 21);
});

test("evaluateSpatialRound compares route directions in order", () => {
  const result = evaluateSpatialRound({
    expectedSequence: ["cima", "direita", "baixo", "esquerda"],
    selectedSequence: ["cima", "direita", "esquerda", "esquerda"],
    answerSeconds: 5,
    responseSeconds: 16,
    minimumToComplete: 3,
  });

  assert.deepEqual(result.hits, ["cima", "direita", "esquerda"]);
  assert.deepEqual(result.mistakes, ["baixo"]);
  assert.deepEqual(result.wrongMoves, ["esquerda"]);
  assert.equal(result.completed, true);
});

test("evaluateComparisonRound validates left and right choices", () => {
  const result = evaluateComparisonRound({
    expectedAnswers: ["left", "right", "left"],
    selectedAnswers: ["left", "left", "right"],
    answerSeconds: 7,
    timeLimit: 16,
    minimumToComplete: 2,
  });

  assert.deepEqual(result.hits, [0]);
  assert.deepEqual(result.mistakes, [1, 2]);
  assert.equal(result.completed, false);
  assert.equal(result.score, 17);
});

test("evaluateLogicRound validates the next term choices", () => {
  const result = evaluateLogicRound({
    expectedAnswers: ["4", "A", "12"],
    selectedAnswers: ["4", "B", "12"],
    answerSeconds: 8,
    timeLimit: 18,
    minimumToComplete: 2,
  });

  assert.deepEqual(result.hits, [0, 2]);
  assert.deepEqual(result.mistakes, [1]);
  assert.equal(result.completed, true);
});
