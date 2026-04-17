import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultProgress,
  getAgeBand,
  getAttentionDifficulty,
  getAudienceFromAge,
  getCompletionRate,
  getLogicDifficulty,
  getMemoryDifficulty,
  getRecommendedChallengeId,
  isChallengeUnlocked,
  mergeProgress,
} from "@/lib/scoring";
import {
  getAbilityInsights,
  getAutomaticDiagnostic,
  getGuidedSessions,
  getPerformanceTrends,
  getSmartRecommendation,
} from "@/lib/training-insights";
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
  logicChallenges,
  memoryChallenges,
  spatialChallenges,
  visualChallenges,
} from "@/lib/game-data-v3";

test("createDefaultProgress prepares the three progress tracks", () => {
  const progress = createDefaultProgress();

  assert.ok(Object.keys(progress.memoria).length > 0);
  assert.ok(Object.keys(progress.visual).length > 0);
  assert.ok(Object.keys(progress.atencao).length > 0);
  assert.ok(Object.keys(progress.comparacao).length > 0);
  assert.ok(Object.keys(progress.espacial).length > 0);
  assert.ok(Object.keys(progress.logica).length > 0);
  assert.ok(Object.keys(progress.especial).length > 0);
});

test("expanded tracks expose the requested amount of phases", () => {
  assert.equal(memoryChallenges.length, 15);
  assert.equal(visualChallenges.length, 15);
  assert.equal(attentionChallenges.length, 15);
  assert.equal(comparisonChallenges.length, 15);
  assert.equal(spatialChallenges.length, 15);
  assert.equal(logicChallenges.length, 15);
  assert.equal(exclusiveChallenges.filter((item) => item.audience === "infantil").length, 10);
  assert.equal(exclusiveChallenges.filter((item) => item.audience === "adolescente").length, 10);
  assert.equal(exclusiveChallenges.filter((item) => item.audience === "adulto").length, 10);
});

test("advanced tracks are also registered in progress maps", () => {
  const progress = createDefaultProgress();

  assert.equal(progress.memoria[advancedMemoryChallenges[0].id].attempts, 0);
  assert.equal(progress.atencao[advancedAttentionChallenges[0].id].attempts, 0);
  assert.equal(progress.comparacao[advancedComparisonChallenges[0].id].attempts, 0);
  assert.equal(progress.espacial[advancedSpatialChallenges[0].id].attempts, 0);
  assert.equal(progress.logica[advancedLogicChallenges[0].id].attempts, 0);
});

test("mergeProgress preserves saved data while filling missing challenges", () => {
  const merged = mergeProgress({
    memoria: {
      1: {
        attempts: 2,
        bestScore: 18,
        lastScore: 12,
        bestTimeSeconds: 9,
        completed: true,
        lastPlayedAt: "2026-04-09T10:00:00.000Z",
        lastVariationIndex: 1,
      },
    },
  });

  assert.equal(merged.memoria[1].completed, true);
  assert.equal(merged.memoria[1].lastVariationIndex, 1);
  assert.equal(merged.visual[1].completed, false);
  assert.equal(merged.atencao[1].completed, false);
  assert.equal(merged.comparacao[1].attempts, 0);
  assert.equal(merged.espacial[1].attempts, 0);
  assert.equal(merged.logica[1].attempts, 0);
  assert.equal(merged.especial[101].attempts, 0);
});

test("age mapping separates childhood, adolescence and adulthood correctly", () => {
  assert.equal(getAgeBand(7), "6-8");
  assert.equal(getAgeBand(11), "9-12");
  assert.equal(getAgeBand(14), "13-15");
  assert.equal(getAgeBand(17), "15-18");
  assert.equal(getAudienceFromAge(12), "infantil");
  assert.equal(getAudienceFromAge(18), "adolescente");
  assert.equal(getAudienceFromAge(19), "adulto");
});

test("memory difficulty adapts to age and previous attempts", () => {
  const difficulty = getMemoryDifficulty({
    tempoBase: 8,
    minimoBase: 4,
    idade: 7,
    progress: { attempts: 3, completed: false, bestScore: 0 },
  });

  assert.equal(difficulty.tempoMemorizacao, 14);
  assert.equal(difficulty.minimoParaConcluir, 2);
});

test("attention difficulty gets stricter after strong performance", () => {
  const difficulty = getAttentionDifficulty({
    tempoBase: 16,
    minimoBase: 4,
    idade: 25,
    progress: { attempts: 5, completed: true, bestScore: 30 },
  });

  assert.equal(difficulty.tempoLimite, 14);
  assert.equal(difficulty.minimoParaConcluir, 5);
});

test("logic difficulty also adapts to age and strong performance", () => {
  const difficulty = getLogicDifficulty({
    tempoBase: 14,
    minimoBase: 4,
    idade: 26,
    progress: { attempts: 4, completed: true, bestScore: 29 },
  });

  assert.equal(difficulty.tempoLimite, 12);
  assert.equal(difficulty.minimoParaConcluir, 5);
});

test("challenge unlock and recommendation respect progression order", () => {
  const progress = createDefaultProgress().memoria;
  progress[1].completed = true;
  progress[1].lastPlayedAt = "2026-04-09T12:00:00.000Z";
  progress[2].attempts = 1;
  progress[2].lastPlayedAt = "2026-04-09T11:00:00.000Z";

  assert.equal(isChallengeUnlocked(progress, 1), true);
  assert.equal(isChallengeUnlocked(progress, 2), true);
  assert.equal(isChallengeUnlocked(progress, 3), false);
  assert.equal(getRecommendedChallengeId(progress, [1, 2, 3, 4, 5]), 2);
});

test("completion rate reflects finished items", () => {
  const progress = createDefaultProgress().atencao;
  progress[1].completed = true;
  progress[2].completed = true;

  assert.equal(getCompletionRate(progress), 11);
});

test("insights expose abilities, trends, recommendation and guided plans", () => {
  const progress = createDefaultProgress();
  progress.memoria[1].attempts = 3;
  progress.memoria[1].completed = false;
  progress.atencao[1].attempts = 4;
  progress.atencao[1].completed = false;
  progress.logica[1].attempts = 2;
  progress.logica[1].completed = true;
  const now = Date.now();
  const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

  const history = [
    {
      id: "1",
      email: "aluno@example.com",
      mode: "atencao" as const,
      challengeId: 1,
      score: 8,
      timeSeconds: 18,
      completed: false,
      playedAt: daysAgo(1),
    },
    {
      id: "2",
      email: "aluno@example.com",
      mode: "memoria" as const,
      challengeId: 1,
      score: 10,
      timeSeconds: 15,
      completed: false,
      playedAt: daysAgo(2),
    },
    {
      id: "3",
      email: "aluno@example.com",
      mode: "logica" as const,
      challengeId: 1,
      score: 24,
      timeSeconds: 9,
      completed: true,
      playedAt: daysAgo(22),
    },
  ];

  const abilities = getAbilityInsights(history, progress);
  const trends = getPerformanceTrends(history);
  const recommendation = getSmartRecommendation(history, progress);
  const diagnostic = getAutomaticDiagnostic(12, history, progress);
  const plans = getGuidedSessions(12, history, progress);

  assert.equal(abilities.length, 4);
  assert.equal(trends.length, 2);
  assert.equal(recommendation.mode, "atencao");
  assert.equal(diagnostic.starters.length, 5);
  assert.equal(plans.length, 3);
});
