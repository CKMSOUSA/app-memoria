import { normalizeText } from "@/lib/scoring";

export function getNextVariationIndex(total: number, current: number | null, randomValue = Math.random()) {
  if (total <= 1) return 0;

  const normalizedRandom = Number.isFinite(randomValue) ? Math.max(0, Math.min(randomValue, 0.999999)) : 0;
  let next = Math.floor(normalizedRandom * total);

  if (current === null || next !== current) {
    return next;
  }

  return (current + 1) % total;
}

export function evaluateMemoryRound({
  expectedWords,
  response,
  answerSeconds,
  memorizationSeconds,
  minimumToComplete,
}: {
  expectedWords: string[];
  response: string;
  answerSeconds: number;
  memorizationSeconds: number;
  minimumToComplete: number;
}) {
  const normalizedExpected = expectedWords.map((word) => normalizeText(word));
  const typedWords = response
    .split(/[;,\n\s]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);

  const uniqueTyped = Array.from(new Set(typedWords));
  const hits = uniqueTyped.filter((item) => normalizedExpected.includes(item));
  const wrongWords = uniqueTyped.filter((item) => !normalizedExpected.includes(item));
  const missedWords = normalizedExpected.filter((item) => !hits.includes(item));
  const baseScore = hits.length * 4;
  const speedBonus = Math.max(0, memorizationSeconds + 10 - answerSeconds);
  const penalty = wrongWords.length;
  const score = Math.max(0, baseScore + speedBonus - penalty);
  const completed = hits.length >= minimumToComplete;

  return {
    hits,
    wrongWords,
    missedWords,
    score,
    completed,
  };
}

export function evaluateAttentionRound({
  foundCount,
  totalTargets,
  wrongClicks,
  timeLeft,
  timeLimit,
  minimumToComplete,
}: {
  foundCount: number;
  totalTargets: number;
  wrongClicks: number;
  timeLeft: number;
  timeLimit: number;
  minimumToComplete: number;
}) {
  const hitsScore = foundCount * 5;
  const timeBonus = Math.max(0, timeLeft - wrongClicks);
  const score = Math.max(0, hitsScore + timeBonus - wrongClicks * 2);
  const completed = foundCount >= minimumToComplete;

  return {
    foundCount,
    totalTargets,
    wrongClicks,
    elapsedSeconds: Math.max(timeLimit - timeLeft, 0),
    score,
    completed,
  };
}

export function evaluateAudienceRound({
  expectedSequence,
  selectedSequence,
  answerSeconds,
  revealSeconds,
  minimumToComplete,
}: {
  expectedSequence: string[];
  selectedSequence: string[];
  answerSeconds: number;
  revealSeconds: number;
  minimumToComplete: number;
}) {
  const hits = selectedSequence.filter((item, index) => item === expectedSequence[index]);
  const misses = expectedSequence.filter((item, index) => selectedSequence[index] !== item);
  const score = Math.max(0, hits.length * 6 + Math.max(0, revealSeconds + 8 - answerSeconds));
  const completed = hits.length >= minimumToComplete;

  return {
    hits,
    misses,
    score,
    completed,
  };
}

export function evaluateSpatialRound({
  expectedSequence,
  selectedSequence,
  answerSeconds,
  responseSeconds,
  minimumToComplete,
}: {
  expectedSequence: string[];
  selectedSequence: string[];
  answerSeconds: number;
  responseSeconds: number;
  minimumToComplete: number;
}) {
  const hits = selectedSequence.filter((item, index) => item === expectedSequence[index]);
  const mistakes = expectedSequence.filter((item, index) => selectedSequence[index] !== item);
  const wrongMoves = selectedSequence.filter((item, index) => item !== expectedSequence[index]);
  const score = Math.max(0, hits.length * 5 + Math.max(0, responseSeconds + 8 - answerSeconds) - wrongMoves.length);
  const completed = hits.length >= minimumToComplete;

  return {
    hits,
    mistakes,
    wrongMoves,
    score,
    completed,
  };
}

export function evaluateComparisonRound({
  expectedAnswers,
  selectedAnswers,
  answerSeconds,
  timeLimit,
  minimumToComplete,
}: {
  expectedAnswers: Array<"left" | "right">;
  selectedAnswers: Array<"left" | "right">;
  answerSeconds: number;
  timeLimit: number;
  minimumToComplete: number;
}) {
  const hits = expectedAnswers
    .map((answer, index) => (selectedAnswers[index] === answer ? index : -1))
    .filter((index) => index >= 0);
  const mistakes = expectedAnswers
    .map((answer, index) => (selectedAnswers[index] !== answer ? index : -1))
    .filter((index) => index >= 0);
  const score = Math.max(0, hits.length * 6 + Math.max(0, timeLimit + 6 - answerSeconds) - mistakes.length * 2);
  const completed = hits.length >= minimumToComplete;

  return {
    hits,
    mistakes,
    score,
    completed,
  };
}

export function evaluateLogicRound({
  expectedAnswers,
  selectedAnswers,
  answerSeconds,
  timeLimit,
  minimumToComplete,
}: {
  expectedAnswers: string[];
  selectedAnswers: string[];
  answerSeconds: number;
  timeLimit: number;
  minimumToComplete: number;
}) {
  const hits = expectedAnswers
    .map((answer, index) => (normalizeText(selectedAnswers[index] ?? "") === normalizeText(answer) ? index : -1))
    .filter((index) => index >= 0);
  const mistakes = expectedAnswers
    .map((answer, index) => (normalizeText(selectedAnswers[index] ?? "") !== normalizeText(answer) ? index : -1))
    .filter((index) => index >= 0);
  const score = Math.max(0, hits.length * 7 + Math.max(0, timeLimit + 8 - answerSeconds) - mistakes.length * 2);
  const completed = hits.length >= minimumToComplete;

  return {
    hits,
    mistakes,
    score,
    completed,
  };
}
