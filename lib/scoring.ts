import {
  attentionChallenges,
  comparisonChallenges,
  exclusiveChallenges,
  logicChallenges,
  memoryChallenges,
  spatialChallenges,
  visualChallenges,
} from "@/lib/game-data-v3";
import type { ProgressState, SessionMode, SessionRecord } from "@/lib/types";

function defaultChallengeProgress() {
  return {
    attempts: 0,
    bestScore: 0,
    lastScore: 0,
    bestTimeSeconds: null,
    completed: false,
    lastPlayedAt: null,
    lastVariationIndex: null,
  };
}

export function createDefaultProgress(): ProgressState {
  return {
    memoria: Object.fromEntries(memoryChallenges.map((challenge) => [challenge.id, defaultChallengeProgress()])),
    visual: Object.fromEntries(visualChallenges.map((challenge) => [challenge.id, defaultChallengeProgress()])),
    atencao: Object.fromEntries(attentionChallenges.map((challenge) => [challenge.id, defaultChallengeProgress()])),
    comparacao: Object.fromEntries(comparisonChallenges.map((challenge) => [challenge.id, defaultChallengeProgress()])),
    espacial: Object.fromEntries(spatialChallenges.map((challenge) => [challenge.id, defaultChallengeProgress()])),
    logica: Object.fromEntries(logicChallenges.map((challenge) => [challenge.id, defaultChallengeProgress()])),
    especial: Object.fromEntries(exclusiveChallenges.map((challenge) => [challenge.id, defaultChallengeProgress()])),
  };
}

export function mergeProgress(saved?: Partial<ProgressState> | null): ProgressState {
  const base = createDefaultProgress();

  for (const challenge of memoryChallenges) {
    base.memoria[challenge.id] = {
      ...base.memoria[challenge.id],
      ...(saved?.memoria?.[challenge.id] ?? {}),
    };
  }

  for (const challenge of visualChallenges) {
    base.visual[challenge.id] = {
      ...base.visual[challenge.id],
      ...(saved?.visual?.[challenge.id] ?? {}),
    };
  }

  for (const challenge of attentionChallenges) {
    base.atencao[challenge.id] = {
      ...base.atencao[challenge.id],
      ...(saved?.atencao?.[challenge.id] ?? {}),
    };
  }

  for (const challenge of comparisonChallenges) {
    base.comparacao[challenge.id] = {
      ...base.comparacao[challenge.id],
      ...(saved?.comparacao?.[challenge.id] ?? {}),
    };
  }

  for (const challenge of spatialChallenges) {
    base.espacial[challenge.id] = {
      ...base.espacial[challenge.id],
      ...(saved?.espacial?.[challenge.id] ?? {}),
    };
  }

  for (const challenge of logicChallenges) {
    base.logica[challenge.id] = {
      ...base.logica[challenge.id],
      ...(saved?.logica?.[challenge.id] ?? {}),
    };
  }

  for (const challenge of exclusiveChallenges) {
    base.especial[challenge.id] = {
      ...base.especial[challenge.id],
      ...(saved?.especial?.[challenge.id] ?? {}),
    };
  }

  return base;
}

export function getNivel(pontos: number) {
  if (pontos < 20) return "Iniciante";
  if (pontos < 45) return "Aprendiz";
  if (pontos < 75) return "Avancado";
  return "Alta performance";
}

export function getCompletionRate(progressMap: Record<number, { completed: boolean }>) {
  const values = Object.values(progressMap);
  if (values.length === 0) return 0;
  return Math.round((values.filter((item) => item.completed).length / values.length) * 100);
}

export function getSessionModeLabel(mode: SessionMode) {
  switch (mode) {
    case "memoria":
      return "Memoria";
    case "atencao":
      return "Atencao";
    case "visual":
      return "Memoria visual";
    case "comparacao":
      return "Comparacao";
    case "espacial":
      return "Orientacao espacial";
    case "logica":
      return "Logica";
    default:
      return "Trilha exclusiva";
  }
}

export function getReportSummary(history: SessionRecord[]) {
  const totalSessions = history.length;
  const completedSessions = history.filter((item) => item.completed).length;
  const averageScore =
    totalSessions > 0 ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / totalSessions) : 0;
  const totalMinutes = Math.round(history.reduce((sum, item) => sum + item.timeSeconds, 0) / 60);
  const strongestMode =
    Object.entries(
      history.reduce<Record<string, number>>((acc, item) => {
        acc[item.mode] = (acc[item.mode] ?? 0) + item.score;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "memoria";

  return {
    totalSessions,
    completedSessions,
    averageScore,
    totalMinutes,
    strongestMode: strongestMode as SessionMode,
  };
}

export function getCompletionRateForIds(
  progressMap: Record<number, { completed: boolean }>,
  challengeIds: number[],
) {
  if (challengeIds.length === 0) return 0;
  const completed = challengeIds.filter((id) => progressMap[id]?.completed).length;
  return Math.round((completed / challengeIds.length) * 100);
}

export function isChallengeUnlocked(
  progressMap: Record<number, { completed: boolean }>,
  challengeId: number,
) {
  if (challengeId === 1) return true;
  return progressMap[challengeId - 1]?.completed ?? false;
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getAgeBand(idade: number) {
  if (idade <= 8) return "6-8";
  if (idade <= 12) return "9-12";
  if (idade <= 15) return "13-15";
  if (idade <= 18) return "15-18";
  return "adulto";
}

export function getAudienceFromAge(idade: number) {
  if (idade <= 12) return "infantil";
  if (idade <= 18) return "adolescente";
  return "adulto";
}

export function getAgeLabel(idade: number) {
  const band = getAgeBand(idade);
  switch (band) {
    case "6-8":
      return `${idade} anos · criancas 6 a 8`;
    case "9-12":
      return `${idade} anos · 9 a 12 anos`;
    case "13-15":
      return `${idade} anos · 13 a 15 anos`;
    case "15-18":
      return `${idade} anos · 15 a 18 anos`;
    default:
      return `${idade} anos · adultos`;
  }
}

export function getAudienceLabel(audience: ReturnType<typeof getAudienceFromAge>) {
  switch (audience) {
    case "infantil":
      return "Trilha Infantil";
    case "adolescente":
      return "Trilha Adolescente";
    default:
      return "Trilha Adulta";
  }
}

export function getMemoryAgeProfile(idade: number) {
  switch (getAgeBand(idade)) {
    case "6-8":
      return { visibleWords: 3, timeOffset: 4, minimumCap: 2 };
    case "9-12":
      return { visibleWords: 4, timeOffset: 2, minimumCap: 3 };
    case "13-15":
      return { visibleWords: 5, timeOffset: 1, minimumCap: 4 };
    case "15-18":
      return { visibleWords: 5, timeOffset: 0, minimumCap: 5 };
    default:
      return { visibleWords: 5, timeOffset: -1, minimumCap: 5 };
  }
}

export function getAttentionAgeProfile(idade: number) {
  switch (getAgeBand(idade)) {
    case "6-8":
      return { visibleCells: 8, timeOffset: 4, minimumCap: 3 };
    case "9-12":
      return { visibleCells: 10, timeOffset: 2, minimumCap: 4 };
    case "13-15":
      return { visibleCells: 12, timeOffset: 1, minimumCap: 5 };
    case "15-18":
      return { visibleCells: 12, timeOffset: 0, minimumCap: 5 };
    default:
      return { visibleCells: 12, timeOffset: -1, minimumCap: 6 };
  }
}

export function getRecommendedChallengeId(
  progressMap: Record<number, { completed: boolean; lastPlayedAt: string | null; attempts: number }>,
  challengeIds: number[],
) {
  const unlockedIds = challengeIds.filter((id) => isChallengeUnlocked(progressMap, id));
  const pendingIds = unlockedIds.filter((id) => !progressMap[id]?.completed);

  const sortByLeastRecent = (a: number, b: number) => {
    const aPlayed = progressMap[a]?.lastPlayedAt ? new Date(progressMap[a].lastPlayedAt as string).getTime() : 0;
    const bPlayed = progressMap[b]?.lastPlayedAt ? new Date(progressMap[b].lastPlayedAt as string).getTime() : 0;
    if (aPlayed !== bPlayed) return aPlayed - bPlayed;
    return (progressMap[a]?.attempts ?? 0) - (progressMap[b]?.attempts ?? 0);
  };

  if (pendingIds.length > 0) {
    return [...pendingIds].sort(sortByLeastRecent)[0];
  }

  return [...unlockedIds].sort(sortByLeastRecent)[0] ?? challengeIds[0] ?? 1;
}

export function getMemoryDifficulty({
  tempoBase,
  minimoBase,
  idade,
  progress,
}: {
  tempoBase: number;
  minimoBase: number;
  idade: number;
  progress: { attempts: number; completed: boolean; bestScore: number };
}) {
  const ageProfile = getMemoryAgeProfile(idade);
  let tempoMemorizacao = tempoBase + ageProfile.timeOffset;
  let minimoParaConcluir = Math.min(minimoBase, ageProfile.minimumCap);

  if (progress.completed && progress.bestScore >= 24) tempoMemorizacao = Math.max(4, tempoBase - 1);
  if (progress.completed && progress.bestScore >= 28) minimoParaConcluir += 1;
  if (!progress.completed && progress.attempts >= 3) tempoMemorizacao += 2;

  return { tempoMemorizacao, minimoParaConcluir };
}

export function getAttentionDifficulty({
  tempoBase,
  minimoBase,
  idade,
  progress,
}: {
  tempoBase: number;
  minimoBase: number;
  idade: number;
  progress: { attempts: number; completed: boolean; bestScore: number };
}) {
  const ageProfile = getAttentionAgeProfile(idade);
  let tempoLimite = tempoBase + ageProfile.timeOffset;
  let minimoParaConcluir = Math.min(minimoBase, ageProfile.minimumCap);

  if (progress.completed && progress.bestScore >= 26) tempoLimite = Math.max(10, tempoBase - 2);
  if (progress.completed && progress.bestScore >= 30) minimoParaConcluir += 1;
  if (!progress.completed && progress.attempts >= 3) tempoLimite += 2;

  return { tempoLimite, minimoParaConcluir };
}

export function getComparisonDifficulty({
  tempoBase,
  minimoBase,
  idade,
  progress,
}: {
  tempoBase: number;
  minimoBase: number;
  idade: number;
  progress: { attempts: number; completed: boolean; bestScore: number };
}) {
  const ageProfile = getAttentionAgeProfile(idade);
  let tempoLimite = tempoBase + Math.max(-1, ageProfile.timeOffset - 1);
  let minimoParaConcluir = Math.min(minimoBase, Math.max(2, ageProfile.minimumCap - 2));

  if (progress.completed && progress.bestScore >= 20) tempoLimite = Math.max(10, tempoBase - 2);
  if (progress.completed && progress.bestScore >= 24) minimoParaConcluir += 1;
  if (!progress.completed && progress.attempts >= 3) tempoLimite += 2;

  return { tempoLimite, minimoParaConcluir };
}

export function getSpatialDifficulty({
  tempoBase,
  minimoBase,
  idade,
  progress,
}: {
  tempoBase: number;
  minimoBase: number;
  idade: number;
  progress: { attempts: number; completed: boolean; bestScore: number };
}) {
  const ageProfile = getAttentionAgeProfile(idade);
  let tempoResposta = tempoBase + ageProfile.timeOffset;
  let minimoParaConcluir = Math.min(minimoBase, Math.max(2, ageProfile.minimumCap - 1));

  if (progress.completed && progress.bestScore >= 24) tempoResposta = Math.max(10, tempoBase - 2);
  if (progress.completed && progress.bestScore >= 30) minimoParaConcluir += 1;
  if (!progress.completed && progress.attempts >= 3) tempoResposta += 2;

  return { tempoResposta, minimoParaConcluir };
}
