import {
  attentionChallenges,
  comparisonChallenges,
  logicChallenges,
  memoryChallenges,
  spatialChallenges,
  visualChallenges,
} from "@/lib/game-data-v3";
import { getAudienceFromAge, getRecommendedChallengeId, getSessionModeLabel } from "@/lib/scoring";
import type { ProgressState, SessionMode, SessionRecord } from "@/lib/types";

export type CoreMode = "memoria" | "visual" | "atencao" | "comparacao" | "espacial" | "logica";
export type AbilityKey = "memoriaTrabalho" | "atencaoSustentada" | "velocidadeResposta" | "raciocinio";

export type AbilityInsight = {
  key: AbilityKey;
  title: string;
  score: number;
  level: "forte" | "estavel" | "prioridade";
  summary: string;
};

export type TrendInsight = {
  label: "Semanal" | "Mensal";
  direction: "subindo" | "estavel" | "caindo";
  scoreDelta: number;
  completionDelta: number;
  summary: string;
};

export type DiagnosticStarter = {
  mode: CoreMode;
  challengeId: number;
  challengeName: string;
};

export type DiagnosticInsight = {
  title: string;
  summary: string;
  readinessLabel: string;
  focusLabel: string;
  starters: DiagnosticStarter[];
};

export type RecommendationInsight = {
  mode: CoreMode;
  challengeId: number;
  challengeName: string;
  title: string;
  reason: string;
  objective: string;
};

export type GuidedSession = {
  id: string;
  title: string;
  durationLabel: string;
  objective: string;
  cadence: string;
  primaryMode: CoreMode;
  challengeId: number;
  steps: string[];
};

export type AdminAlertInsight = {
  email: string;
  name: string;
  severity: "alta" | "media" | "baixa";
  category: "abandono" | "queda" | "baixa_conclusao" | "intervencao";
  title: string;
  summary: string;
  recommendation: string;
};

type ModeStats = {
  sessions: number;
  completionRate: number;
  averageScore: number;
  averageTime: number;
  incompleteCount: number;
  lastPlayedAt: string | null;
};

const MODE_CHALLENGES: Record<CoreMode, Array<{ id: number; nome: string; nomeInfantil?: string }>> = {
  memoria: memoryChallenges,
  visual: visualChallenges,
  atencao: attentionChallenges,
  comparacao: comparisonChallenges,
  espacial: spatialChallenges,
  logica: logicChallenges,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getModeHistory(history: SessionRecord[], mode: SessionMode) {
  return history.filter((entry) => entry.mode === mode);
}

function getModeStats(history: SessionRecord[], mode: CoreMode): ModeStats {
  const modeHistory = getModeHistory(history, mode);
  const sessions = modeHistory.length;
  const completionRate =
    sessions > 0 ? Math.round((modeHistory.filter((entry) => entry.completed).length / sessions) * 100) : 0;

  return {
    sessions,
    completionRate,
    averageScore: Math.round(average(modeHistory.map((entry) => entry.score))),
    averageTime: Math.round(average(modeHistory.map((entry) => entry.timeSeconds))),
    incompleteCount: modeHistory.filter((entry) => !entry.completed).length,
    lastPlayedAt: modeHistory[0]?.playedAt ?? null,
  };
}

function getModeEstimatedScore(progressMap: Record<number, { bestScore: number; completed: boolean; attempts: number }>) {
  const values = Object.values(progressMap);
  if (values.length === 0) return 0;

  const weightedProgress =
    values.reduce((sum, item) => sum + item.bestScore + (item.completed ? 8 : 0) - Math.min(item.attempts, 4), 0) /
    values.length;

  return clamp(Math.round(weightedProgress * 3), 18, 84);
}

function getModeCompositeScore(
  history: SessionRecord[],
  progressMap: Record<number, { bestScore: number; completed: boolean; attempts: number }>,
  mode: CoreMode,
) {
  const stats = getModeStats(history, mode);
  const completionRate = stats.sessions > 0 ? stats.completionRate : Math.round((Object.values(progressMap).filter((item) => item.completed).length / Math.max(Object.values(progressMap).length, 1)) * 100);
  const scoreScore = stats.sessions > 0 ? clamp(stats.averageScore * 3.2, 0, 100) : getModeEstimatedScore(progressMap);
  const speedScore = stats.sessions > 0 ? clamp(100 - stats.averageTime * 3, 18, 100) : 52;

  return Math.round(scoreScore * 0.55 + completionRate * 0.3 + speedScore * 0.15);
}

function describeAbilityLevel(score: number): AbilityInsight["level"] {
  if (score >= 74) return "forte";
  if (score >= 48) return "estavel";
  return "prioridade";
}

function describeAbilitySummary(title: string, score: number, strongestModeLabel: string, weakestModeLabel: string) {
  if (score >= 74) {
    return `${title} esta forte agora, com base consistente em ${strongestModeLabel.toLowerCase()}.`;
  }
  if (score >= 48) {
    return `${title} esta estavel, mas ainda pode ganhar consistencia quando voce alterna com ${weakestModeLabel.toLowerCase()}.`;
  }
  return `${title} pede reforco imediato. O padrao recente indica revisar ${weakestModeLabel.toLowerCase()} com mais frequencia.`;
}

export function getAbilityInsights(history: SessionRecord[], progresso: ProgressState): AbilityInsight[] {
  const memoryWork = Math.round(
    getModeCompositeScore(history, progresso.memoria, "memoria") * 0.5 +
      getModeCompositeScore(history, progresso.visual, "visual") * 0.25 +
      getModeCompositeScore(history, progresso.espacial, "espacial") * 0.25,
  );
  const sustainedAttention = Math.round(
    getModeCompositeScore(history, progresso.atencao, "atencao") * 0.7 +
      getModeCompositeScore(history, progresso.visual, "visual") * 0.1 +
      getModeCompositeScore(history, progresso.espacial, "espacial") * 0.2,
  );
  const responseSpeed = Math.round(
    average(
      (["memoria", "visual", "atencao", "comparacao", "espacial", "logica"] as CoreMode[]).map((mode) =>
        clamp(
          getModeCompositeScore(history, progresso[mode], mode) * 0.45 +
            (100 - Math.min(getModeStats(history, mode).averageTime * 3, 82)) * 0.55,
          0,
          100,
        ),
      ),
    ),
  );
  const reasoning = Math.round(
    getModeCompositeScore(history, progresso.comparacao, "comparacao") * 0.45 +
      getModeCompositeScore(history, progresso.logica, "logica") * 0.55,
  );

  const strongestReasoningMode =
    getModeCompositeScore(history, progresso.comparacao, "comparacao") >=
    getModeCompositeScore(history, progresso.logica, "logica")
      ? "Comparacao"
      : "Logica";
  const weakestReasoningMode =
    getModeCompositeScore(history, progresso.comparacao, "comparacao") <
    getModeCompositeScore(history, progresso.logica, "logica")
      ? "Comparacao"
      : "Logica";

  return [
    {
      key: "memoriaTrabalho",
      title: "Memoria de trabalho",
      score: memoryWork,
      level: describeAbilityLevel(memoryWork),
      summary: describeAbilitySummary("A memoria de trabalho", memoryWork, "memoria", "memoria visual"),
    },
    {
      key: "atencaoSustentada",
      title: "Atencao sustentada",
      score: sustainedAttention,
      level: describeAbilityLevel(sustainedAttention),
      summary: describeAbilitySummary("A atencao sustentada", sustainedAttention, "atencao", "orientacao espacial"),
    },
    {
      key: "velocidadeResposta",
      title: "Velocidade de resposta",
      score: responseSpeed,
      level: describeAbilityLevel(responseSpeed),
      summary:
        responseSpeed >= 70
          ? "Seu ritmo de resposta esta competitivo, sem perder muita precisao nas rodadas."
          : responseSpeed >= 48
            ? "Sua velocidade esta funcional, mas ainda oscila quando o desafio exige mais trocas ou sequencias."
            : "Seu tempo de resposta caiu nas ultimas sessoes. Vale priorizar blocos curtos e objetivos.",
    },
    {
      key: "raciocinio",
      title: "Raciocinio",
      score: reasoning,
      level: describeAbilityLevel(reasoning),
      summary: describeAbilitySummary("O raciocinio", reasoning, strongestReasoningMode, weakestReasoningMode),
    },
  ];
}

function getWindowStats(history: SessionRecord[], fromDaysAgo: number, toDaysAgo: number) {
  const now = Date.now();
  const start = now - fromDaysAgo * 24 * 60 * 60 * 1000;
  const end = now - toDaysAgo * 24 * 60 * 60 * 1000;
  const windowHistory = history.filter((entry) => {
    const played = new Date(entry.playedAt).getTime();
    return played <= end && played >= start;
  });

  return {
    averageScore: Math.round(average(windowHistory.map((entry) => entry.score))),
    completionRate:
      windowHistory.length > 0
        ? Math.round((windowHistory.filter((entry) => entry.completed).length / windowHistory.length) * 100)
        : 0,
    count: windowHistory.length,
  };
}

function buildTrend(
  label: TrendInsight["label"],
  current: ReturnType<typeof getWindowStats>,
  previous: ReturnType<typeof getWindowStats>,
): TrendInsight {
  const scoreDelta = current.averageScore - previous.averageScore;
  const completionDelta = current.completionRate - previous.completionRate;
  const combined = scoreDelta + completionDelta * 0.6;
  const direction: TrendInsight["direction"] = combined >= 6 ? "subindo" : combined <= -6 ? "caindo" : "estavel";

  const summary =
    current.count === 0
      ? `${label} sem dados suficientes ainda.`
      : direction === "subindo"
        ? `${label} em alta, com melhora de score e maior constancia nas metas.`
        : direction === "caindo"
          ? `${label} em queda, com mais sessoes incompletas ou score menor que no periodo anterior.`
          : `${label} estavel, mantendo faixa parecida de pontuacao e conclusao.`;

  return { label, direction, scoreDelta, completionDelta, summary };
}

export function getPerformanceTrends(history: SessionRecord[]): TrendInsight[] {
  const weeklyCurrent = getWindowStats(history, 7, 0);
  const weeklyPrevious = getWindowStats(history, 14, 7);
  const monthlyCurrent = getWindowStats(history, 30, 0);
  const monthlyPrevious = getWindowStats(history, 60, 30);

  return [
    buildTrend("Semanal", weeklyCurrent, weeklyPrevious),
    buildTrend("Mensal", monthlyCurrent, monthlyPrevious),
  ];
}

function getChallengeName(mode: CoreMode, challengeId: number) {
  const challenge = MODE_CHALLENGES[mode].find((item) => item.id === challengeId);
  return challenge?.nomeInfantil ?? challenge?.nome ?? `Fase ${challengeId}`;
}

function getSuggestedPhaseBase(idade: number) {
  if (idade <= 8) return 1;
  if (idade <= 12) return 2;
  if (idade <= 18) return 3;
  return 4;
}

function getModeStarter(
  mode: CoreMode,
  idade: number,
  history: SessionRecord[],
  progressMap: Record<number, { completed: boolean; attempts: number; lastPlayedAt: string | null; bestScore: number }>,
) {
  const ids = MODE_CHALLENGES[mode].map((item) => item.id);
  const recommended = getRecommendedChallengeId(progressMap, ids);
  const basePhase = getSuggestedPhaseBase(idade);
  const stats = getModeStats(history, mode);
  const performanceBoost = stats.averageScore >= 24 && stats.completionRate >= 60 ? 1 : 0;
  const suggested = clamp(basePhase + performanceBoost, ids[0] ?? 1, ids[ids.length - 1] ?? 1);
  const challengeId = progressMap[suggested]?.attempts === 0 ? suggested : recommended;

  return {
    mode,
    challengeId,
    challengeName: getChallengeName(mode, challengeId),
  };
}

export function getAutomaticDiagnostic(idade: number, history: SessionRecord[], progresso: ProgressState): DiagnosticInsight {
  const audience = getAudienceFromAge(idade);
  const completionRate =
    history.length > 0 ? Math.round((history.filter((entry) => entry.completed).length / history.length) * 100) : 0;
  const avgScore = Math.round(average(history.map((entry) => entry.score)));
  const starters = (["memoria", "atencao", "comparacao", "espacial", "logica"] as CoreMode[]).map((mode) =>
    getModeStarter(mode, idade, history, progresso[mode]),
  );

  const readinessLabel =
    history.length === 0
      ? audience === "infantil"
        ? "Entrada guiada"
        : audience === "adolescente"
          ? "Entrada intermediaria"
          : "Entrada objetiva"
      : completionRate >= 70 && avgScore >= 24
        ? "Pronto para avancar"
        : completionRate >= 45
          ? "Base em consolidacao"
          : "Precisa de base controlada";

  const focusLabel =
    history.length < 4
      ? "Primeiro mapeamento automatico para evitar comecar forte ou facil demais."
      : avgScore >= 26
        ? "Perfil atual indica tolerancia maior a carga cognitiva e transicao mais rapida."
        : "Perfil atual pede mais repeticao de base antes de acelerar tempo e complexidade.";

  return {
    title: history.length < 4 ? "Diagnostico inicial automatico" : "Reposicionamento automatico",
    summary: `O app sugere um ponto de partida ideal por trilha usando idade, historico recente e desafios ja concluidos.`,
    readinessLabel,
    focusLabel,
    starters,
  };
}

function getModeRisk(
  mode: CoreMode,
  history: SessionRecord[],
  progressMap: Record<number, { completed: boolean; attempts: number; lastPlayedAt: string | null; bestScore: number }>,
) {
  const stats = getModeStats(history, mode);
  const lowScorePenalty = clamp(24 - stats.averageScore, 0, 24);
  const slowPenalty = clamp(stats.averageTime - 8, 0, 16);
  const repeatedAttempts = Object.values(progressMap).filter((item) => item.attempts >= 2 && !item.completed).length;
  const recentMissPenalty = stats.incompleteCount * 5;

  return lowScorePenalty + slowPenalty + repeatedAttempts * 4 + recentMissPenalty;
}

export function getSmartRecommendation(history: SessionRecord[], progresso: ProgressState): RecommendationInsight {
  const modes: CoreMode[] = ["memoria", "visual", "atencao", "comparacao", "espacial", "logica"];
  const weakestMode =
    [...modes]
      .sort((left, right) => getModeRisk(right, history, progresso[right]) - getModeRisk(left, history, progresso[left]))[0] ??
    "memoria";
  const challengeIds = MODE_CHALLENGES[weakestMode].map((item) => item.id);
  const challengeId = getRecommendedChallengeId(progresso[weakestMode], challengeIds);
  const challengeName = getChallengeName(weakestMode, challengeId);

  const reasonByMode: Record<CoreMode, string> = {
    memoria: "O historico mostra evocacao irregular e queda quando a quantidade de itens aumenta.",
    visual: "Os pareamentos recentes indicam dificuldade em sustentar memoria visual e localizacao de pares.",
    atencao: "Os erros recorrentes aparecem em foco seletivo e controle de impulsos durante a busca do alvo.",
    comparacao: "O padrao recente sugere oscilacao ao decidir criterio, ordem ou quantidade sob tempo.",
    espacial: "As rotas recentes mostram perda de sequencia e troca de direcao em movimentos sucessivos.",
    logica: "As ultimas rodadas indicam dificuldade em sustentar regras, padroes e previsao do proximo termo.",
  };

  const objectiveByMode: Record<CoreMode, string> = {
    memoria: "Reforcar memoria de trabalho com evocacao curta e mais precisa.",
    visual: "Reforcar memoria visual e localizacao com menos dispersao.",
    atencao: "Reduzir erro recorrente de selecao e melhorar constancia de foco.",
    comparacao: "Estabilizar criterio de decisao antes de subir a velocidade.",
    espacial: "Reconstruir sequencias espaciais com mais seguranca.",
    logica: "Recuperar leitura de regra e previsao de padrao com menos impulsividade.",
  };

  return {
    mode: weakestMode,
    challengeId,
    challengeName,
    title: `Proxima atividade inteligente: ${getSessionModeLabel(weakestMode)}`,
    reason: reasonByMode[weakestMode],
    objective: objectiveByMode[weakestMode],
  };
}

export function getGuidedSessions(
  idade: number,
  history: SessionRecord[],
  progresso: ProgressState,
): GuidedSession[] {
  const recommendation = getSmartRecommendation(history, progresso);
  const memoryStarter = getModeStarter("memoria", idade, history, progresso.memoria);
  const attentionStarter = getModeStarter("atencao", idade, history, progresso.atencao);
  const logicStarter = getModeStarter("logica", idade, history, progresso.logica);

  return [
    {
      id: "focus-10",
      title: "Treino de 10 minutos para atencao",
      durationLabel: "10 minutos",
      objective: "Reforcar foco seletivo, reduzir erros de impulso e dar uma sessao curta de alta utilidade.",
      cadence: "Ideal para abrir o dia ou aquecer antes de outra trilha.",
      primaryMode: "atencao",
      challengeId: attentionStarter.challengeId,
      steps: [
        `Comece em ${attentionStarter.challengeName}.`,
        "Faca duas rodadas seguidas tentando reduzir cliques errados.",
        "Se a segunda rodada sair melhor, feche com uma rodada curta de comparacao.",
      ],
    },
    {
      id: "memory-4w",
      title: "Plano de 4 semanas para memoria",
      durationLabel: "4 semanas",
      objective: "Construir constancia em memoria de trabalho com progressao gradual de carga.",
      cadence: "Tres encontros por semana, alternando evocacao verbal e memoria visual.",
      primaryMode: "memoria",
      challengeId: memoryStarter.challengeId,
      steps: [
        `Semana 1: estabilize ${memoryStarter.challengeName} e uma rodada de memoria visual.`,
        "Semana 2: aumente para duas rodadas consecutivas com pausa curta.",
        "Semana 3: inclua orientacao espacial para reforcar sequencia e manutencao.",
        "Semana 4: compare os scores e tente subir uma fase mantendo precisao.",
      ],
    },
    {
      id: "reasoning-precision",
      title: "Bloco guiado de raciocinio e precisao",
      durationLabel: "15 minutos",
      objective: "Equilibrar velocidade com criterio em padroes, comparacao e tomada de decisao.",
      cadence: "Use quando quiser uma sessao mais densa, mas ainda objetiva.",
      primaryMode: recommendation.mode === "comparacao" || recommendation.mode === "logica" ? recommendation.mode : "logica",
      challengeId: recommendation.mode === "comparacao" || recommendation.mode === "logica" ? recommendation.challengeId : logicStarter.challengeId,
      steps: [
        `Abra ${recommendation.mode === "comparacao" || recommendation.mode === "logica" ? recommendation.challengeName : logicStarter.challengeName}.`,
        "Complete uma rodada focando em acertar antes de acelerar.",
        "Feche com uma rodada de comparacao para consolidar criterio e resposta.",
      ],
    },
  ];
}

function getDaysSinceLastSession(history: SessionRecord[]) {
  if (history.length === 0) return Number.POSITIVE_INFINITY;
  const lastPlayed = new Date(history[0].playedAt).getTime();
  return Math.floor((Date.now() - lastPlayed) / (24 * 60 * 60 * 1000));
}

export function getAdminAlerts(
  users: Array<{ user: { nome: string; email: string; idade: number; status: string }; history: SessionRecord[]; progress?: ProgressState }>,
): AdminAlertInsight[] {
  const alerts: AdminAlertInsight[] = [];

  for (const entry of users) {
    const progress = entry.progress;
    if (!progress || entry.user.status !== "ativo") continue;

    const trends = getPerformanceTrends(entry.history);
    const weeklyTrend = trends.find((item) => item.label === "Semanal");
    const recommendation = getSmartRecommendation(entry.history, progress);
    const completionRate =
      entry.history.length > 0
        ? Math.round((entry.history.filter((item) => item.completed).length / entry.history.length) * 100)
        : 0;
    const daysSinceLastSession = getDaysSinceLastSession(entry.history);

    if (daysSinceLastSession >= 10 && entry.history.length > 0) {
      alerts.push({
        email: entry.user.email,
        name: entry.user.nome,
        severity: "alta",
        category: "abandono",
        title: "Risco de abandono",
        summary: `${entry.user.nome} esta sem treinar ha ${daysSinceLastSession} dias, apesar de ja ter historico no app.`,
        recommendation: "Retomar com uma sessao curta guiada e contato ativo para recuperar a rotina.",
      });
    }

    if (weeklyTrend?.direction === "caindo") {
      alerts.push({
        email: entry.user.email,
        name: entry.user.nome,
        severity: weeklyTrend.scoreDelta <= -10 ? "alta" : "media",
        category: "queda",
        title: "Queda recente de desempenho",
        summary: `${entry.user.nome} entrou em tendencia de queda na semana, com ${weeklyTrend.scoreDelta} pontos no score e ${weeklyTrend.completionDelta}% em conclusao.`,
        recommendation: `Priorizar ${getSessionModeLabel(recommendation.mode)} em ${recommendation.challengeName} para estabilizar o desempenho.`,
      });
    }

    if (entry.history.length >= 4 && completionRate <= 40) {
      alerts.push({
        email: entry.user.email,
        name: entry.user.nome,
        severity: completionRate <= 25 ? "alta" : "media",
        category: "baixa_conclusao",
        title: "Baixa taxa de conclusao",
        summary: `${entry.user.nome} concluiu apenas ${completionRate}% das sessoes registradas.`,
        recommendation: "Rebaixar a carga da rotina e focar em blocos curtos com meta clara de acerto.",
      });
    }

    if (entry.history.length >= 3 && recommendation.mode === "atencao") {
      alerts.push({
        email: entry.user.email,
        name: entry.user.nome,
        severity: "baixa",
        category: "intervencao",
        title: "Intervencao sugerida",
        summary: `${entry.user.nome} esta acumulando erros de foco seletivo e pode se beneficiar de um bloco dirigido de atencao.`,
        recommendation: `Abrir ${recommendation.challengeName} e acompanhar se os erros diminuem em duas rodadas seguidas.`,
      });
    }
  }

  const severityOrder: Record<AdminAlertInsight["severity"], number> = {
    alta: 0,
    media: 1,
    baixa: 2,
  };

  return alerts
    .sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity])
    .slice(0, 12);
}
