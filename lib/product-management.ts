import { getSessionModeLabel } from "@/lib/scoring";
import { getAbilityInsights, getPerformanceTrends, getSmartRecommendation } from "@/lib/training-insights";
import type {
  AdminAuditEntry,
  ClinicalObservation,
  PrescriptionSession,
  ProgressState,
  ReminderSchedule,
  SessionMode,
  SessionRecord,
  UserLink,
  Usuario,
} from "@/lib/types";

type ManagedHistory = { user: Usuario; history: SessionRecord[]; progress?: ProgressState };

export type RankingEntry = {
  email: string;
  name: string;
  turma: string | null;
  score: number;
  subtitle: string;
};

export type ComparativeInsight = {
  label: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  summary: string;
};

export type RolePanelInsight = {
  title: string;
  summary: string;
  cards: Array<{ label: string; value: string; caption: string }>;
};

export type InterventionTip = {
  title: string;
  category: "memoria" | "atencao" | "velocidade" | "raciocinio";
  summary: string;
  actions: string[];
  mode: SessionMode;
};

export type EvaluationProtocol = {
  title: string;
  summary: string;
  rules: string[];
};

export type AutomaticGoal = {
  title: string;
  progressLabel: string;
  summary: string;
};

export type AdherenceInsight = {
  regular: number;
  attention: number;
  inactive: number;
  entries: Array<{ email: string; name: string; label: "regular" | "attention" | "inactive"; summary: string }>;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPeriodStats(history: SessionRecord[], daysFrom: number, daysTo: number) {
  const now = Date.now();
  const start = now - daysFrom * 24 * 60 * 60 * 1000;
  const end = now - daysTo * 24 * 60 * 60 * 1000;
  const entries = history.filter((entry) => {
    const played = new Date(entry.playedAt).getTime();
    return played <= end && played >= start;
  });

  return {
    sessions: entries.length,
    averageScore: Math.round(average(entries.map((entry) => entry.score))),
    completionRate: entries.length > 0 ? Math.round((entries.filter((entry) => entry.completed).length / entries.length) * 100) : 0,
  };
}

export function getComparativeReportInsights(history: SessionRecord[]): ComparativeInsight[] {
  const weeklyCurrent = getPeriodStats(history, 7, 0);
  const weeklyPrevious = getPeriodStats(history, 14, 7);
  const monthlyCurrent = getPeriodStats(history, 30, 0);
  const monthlyPrevious = getPeriodStats(history, 60, 30);

  return [
    {
      label: "Score medio semanal",
      currentValue: weeklyCurrent.averageScore,
      previousValue: weeklyPrevious.averageScore,
      delta: weeklyCurrent.averageScore - weeklyPrevious.averageScore,
      summary: "Compara a media da semana atual com a semana imediatamente anterior.",
    },
    {
      label: "Conclusao semanal",
      currentValue: weeklyCurrent.completionRate,
      previousValue: weeklyPrevious.completionRate,
      delta: weeklyCurrent.completionRate - weeklyPrevious.completionRate,
      summary: "Mostra se a semana atual esta mais consistente na entrega de sessoes completas.",
    },
    {
      label: "Score medio mensal",
      currentValue: monthlyCurrent.averageScore,
      previousValue: monthlyPrevious.averageScore,
      delta: monthlyCurrent.averageScore - monthlyPrevious.averageScore,
      summary: "Indica ganho ou perda de desempenho em janelas mais longas.",
    },
    {
      label: "Volume mensal",
      currentValue: monthlyCurrent.sessions,
      previousValue: monthlyPrevious.sessions,
      delta: monthlyCurrent.sessions - monthlyPrevious.sessions,
      summary: "Ajuda a ler aderencia, retorno ao treino e estabilidade da rotina ao longo do mes.",
    },
  ];
}

export function getPrivateClassRanking(histories: ManagedHistory[], turma: string | null, mode: "score" | "evolucao"): RankingEntry[] {
  const filtered = histories.filter((entry) => entry.user.role === "aluno" && (turma ? entry.user.turma === turma : true));

  return filtered
    .map((entry) => {
      const currentMonth = getPeriodStats(entry.history, 30, 0);
      const previousMonth = getPeriodStats(entry.history, 60, 30);
      const evolution = currentMonth.averageScore - previousMonth.averageScore;
      return {
        email: entry.user.email,
        name: entry.user.nome,
        turma: entry.user.turma ?? null,
        score: mode === "score" ? currentMonth.averageScore : evolution,
        subtitle:
          mode === "score"
            ? `${currentMonth.sessions} sessao(oes) no periodo`
            : `${evolution >= 0 ? "+" : ""}${evolution} ponto(s) no ultimo ciclo`,
      };
    })
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 8);
}

export function getRolePanelInsight(usuario: Usuario, histories: ManagedHistory[]): RolePanelInsight | null {
  if (usuario.role === "aluno" || usuario.role === "admin") return null;

  const managed = histories.filter((entry) => entry.user.role === "aluno" && entry.user.turma === usuario.turma);
  const totalSessions = managed.reduce((sum, entry) => sum + entry.history.length, 0);
  const averageScore = Math.round(average(managed.flatMap((entry) => entry.history.map((item) => item.score))));
  const completionRate =
    totalSessions > 0
      ? Math.round((managed.flatMap((entry) => entry.history).filter((entry) => entry.completed).length / totalSessions) * 100)
      : 0;
  const recommendationMode = managed[0]?.progress ? getSmartRecommendation(managed[0].history, managed[0].progress).mode : "memoria";

  return {
    title: usuario.role === "professor" ? "Painel do professor" : "Painel do responsavel",
    summary:
      usuario.role === "professor"
        ? "Visao agrupada da turma com foco em aderencia, progresso e proximo bloco prescrito."
        : "Visao de acompanhamento do grupo ou rotina compartilhada, com foco em constancia e apoio no treino.",
    cards: [
      { label: "Alunos acompanhados", value: String(managed.length), caption: "Perfis de aluno vinculados pela mesma turma ou grupo." },
      { label: "Media consolidada", value: String(averageScore || 0), caption: "Leitura agregada do desempenho recente do grupo." },
      { label: "Conclusao", value: `${completionRate}%`, caption: "Percentual de sessoes completas nas rodadas registradas." },
      { label: "Foco recomendado", value: getSessionModeLabel(recommendationMode), caption: "Trilha com mais valor para o proximo ciclo monitorado." },
    ],
  };
}

export function getInterventionLibrary(history: SessionRecord[], progresso: ProgressState): InterventionTip[] {
  const abilities = getAbilityInsights(history, progresso);
  const trends = getPerformanceTrends(history);
  const recommendation = getSmartRecommendation(history, progresso);
  const falling = trends.some((item) => item.direction === "caindo");

  return abilities
    .filter((item) => item.level !== "forte")
    .map((item) => {
      if (item.key === "memoriaTrabalho") {
        return {
          title: "Intervencao para memoria de trabalho",
          category: "memoria" as const,
          summary: "Use evocacao curta, repeticao guiada e revisao imediata das respostas que faltaram.",
          actions: [
            "Comecar por fases curtas antes de aumentar quantidade de itens.",
            "Pedir repeticao em voz alta antes de responder, quando isso fizer sentido.",
            "Revisar erros e faltas logo depois da rodada, sem trocar de trilha cedo demais.",
          ],
          mode: "memoria" as const,
        };
      }
      if (item.key === "atencaoSustentada") {
        return {
          title: "Intervencao para atencao sustentada",
          category: "atencao" as const,
          summary: "Reduza impulsividade com blocos breves, alvo unico e revisao de cliques fora do foco.",
          actions: [
            "Usar sessoes de 5 a 10 minutos para preservar foco.",
            "Pausar entre rodadas quando houver aumento rapido de erro.",
            "Retomar a fase imediatamente anterior se os cliques errados subirem.",
          ],
          mode: "atencao" as const,
        };
      }
      if (item.key === "velocidadeResposta") {
        return {
          title: "Intervencao para velocidade de resposta",
          category: "velocidade" as const,
          summary: "Acelere com criterio: primeiro estabilize acerto, depois reduza tempo de decisao.",
          actions: [
            "Iniciar com metas de precisao antes de pressionar velocidade.",
            "Alternar comparacao e atencao para variar ritmo sem perder regra.",
            falling ? "Evitar subir dificuldade na mesma semana em que a tendencia estiver caindo." : "Subir uma fase apenas quando houver duas rodadas estaveis.",
          ],
          mode: recommendation.mode,
        };
      }
      return {
        title: "Intervencao para raciocinio",
        category: "raciocinio" as const,
        summary: "Reforce leitura de padrao e criterio com tempo suficiente para verbalizar a regra.",
        actions: [
          "Pedir que a pessoa explique a regra antes de marcar a resposta.",
          "Alternar logica e comparacao para consolidar criterio.",
          "Manter a mesma fase por mais de uma rodada quando ainda houver troca de regra.",
        ],
        mode: "logica" as const,
      };
    });
}

export function getFormalEvaluationProtocol(usuario: Usuario, history: SessionRecord[]): EvaluationProtocol {
  const comparative = getComparativeReportInsights(history);
  return {
    title: "Modo avaliacao formal",
    summary: `Versao mais padronizada para ${usuario.nome}, com menos interferencia visual e leitura mais tecnica do desempenho.`,
    rules: [
      "Ativar contraste controlado, foco visivel e reducao de estimulos.",
      "Aplicar sequencia curta: memoria, atencao, comparacao e logica.",
      `Registrar comparativos principais: ${comparative[0]?.label.toLowerCase() ?? "score medio"} e ${comparative[1]?.label.toLowerCase() ?? "conclusao semanal"}.`,
      "Evitar interrupcoes durante a sessao e revisar apenas ao final de cada bloco.",
    ],
  };
}

export function getRelevantObservations(
  observations: ClinicalObservation[],
  email: string,
) {
  return observations
    .filter((item) => item.email === email)
    .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1));
}

export function getUpcomingReminders(reminders: ReminderSchedule[], ownerEmail: string, turma: string | null) {
  return reminders.filter((item) => item.active && (item.ownerEmail === ownerEmail || (turma && item.turma === turma)));
}

export function getRelevantPrescriptions(
  prescriptions: PrescriptionSession[],
  usuario: Usuario,
) {
  if (usuario.role === "aluno") {
    return prescriptions.filter((item) => item.assignedToEmail === usuario.email);
  }

  return prescriptions.filter((item) => item.assignedByEmail === usuario.email || (usuario.turma && item.turma === usuario.turma));
}

export function getManagedStudentHistories(
  usuario: Usuario,
  histories: ManagedHistory[],
  userLinks: UserLink[],
) {
  if (usuario.role === "admin") return histories.filter((entry) => entry.user.role === "aluno");
  if (usuario.role === "aluno") return histories.filter((entry) => entry.user.email === usuario.email);

  const linkedEmails = new Set(
    userLinks
      .filter((item) => item.ownerEmail === usuario.email && item.relationship === usuario.role)
      .map((item) => item.studentEmail),
  );

  const linked = histories.filter((entry) => entry.user.role === "aluno" && linkedEmails.has(entry.user.email));
  if (linked.length > 0) return linked;

  return histories.filter((entry) => entry.user.role === "aluno" && entry.user.turma === usuario.turma);
}

export function getAutomaticGoals(history: SessionRecord[], progresso: ProgressState): AutomaticGoal[] {
  const recommendation = getSmartRecommendation(history, progresso);
  const recentWeek = getPeriodStats(history, 7, 0);
  const completedModes = new Set(history.filter((entry) => entry.completed).map((entry) => entry.mode));

  return [
    {
      title: "Meta de frequencia da semana",
      progressLabel: `${Math.min(recentWeek.sessions, 3)}/3 sessoes registradas`,
      summary: "Manter tres blocos curtos na semana para consolidar rotina.",
    },
    {
      title: "Meta de consolidacao principal",
      progressLabel: `${getSessionModeLabel(recommendation.mode)} · fase ${recommendation.challengeId}`,
      summary: `Priorizar ${recommendation.challengeName} ate estabilizar conclusao e reduzir erro recorrente.`,
    },
    {
      title: "Meta de variedade cognitiva",
      progressLabel: `${Math.min(completedModes.size, 3)}/3 trilhas concluidas`,
      summary: "Alternar trilhas ajuda a distribuir carga entre memoria, atencao e raciocinio.",
    },
  ];
}

export function getAdherencePanel(histories: ManagedHistory[]): AdherenceInsight {
  const entries = histories
    .filter((entry) => entry.user.role === "aluno")
    .map((entry) => {
      const recentWeek = getPeriodStats(entry.history, 7, 0);
      const recentMonth = getPeriodStats(entry.history, 30, 0);
      const label: "regular" | "attention" | "inactive" =
        recentWeek.sessions >= 2
          ? "regular"
          : recentMonth.sessions >= 1
            ? "attention"
            : "inactive";

      return {
        email: entry.user.email,
        name: entry.user.nome,
        label,
        summary:
          label === "regular"
            ? `${recentWeek.sessions} sessoes na semana com rotina ativa.`
            : label === "attention"
              ? "Treino recente baixo; vale retomar com meta curta."
              : "Sem registros recentes; risco de abandono mais alto.",
      };
    });

  return {
    regular: entries.filter((item) => item.label === "regular").length,
    attention: entries.filter((item) => item.label === "attention").length,
    inactive: entries.filter((item) => item.label === "inactive").length,
    entries: entries.sort((left, right) => left.name.localeCompare(right.name)),
  };
}

export function getFilteredManagedHistories(
  histories: ManagedHistory[],
  filters: {
    ageBand?: "todas" | "6-12" | "13-17" | "18+";
    level?: "todos" | "iniciante" | "intermediario" | "avancado";
    trend?: "todas" | "subindo" | "estavel" | "caindo";
    prescriptionStatus?: "todas" | "pendente" | "concluida";
  },
  prescriptions: PrescriptionSession[],
) {
  return histories.filter((entry) => {
    const ageMatch =
      filters.ageBand === undefined || filters.ageBand === "todas"
        ? true
        : filters.ageBand === "6-12"
          ? entry.user.idade <= 12
          : filters.ageBand === "13-17"
            ? entry.user.idade >= 13 && entry.user.idade <= 17
            : entry.user.idade >= 18;

    const averageScore = Math.round(average(entry.history.map((item) => item.score)));
    const levelMatch =
      filters.level === undefined || filters.level === "todos"
        ? true
        : filters.level === "iniciante"
          ? averageScore < 15
          : filters.level === "intermediario"
            ? averageScore >= 15 && averageScore < 24
            : averageScore >= 24;

    const trendDirection = getPerformanceTrends(entry.history)[0]?.direction ?? "estavel";
    const trendMatch = filters.trend === undefined || filters.trend === "todas" ? true : trendDirection === filters.trend;

    const userPrescriptions = prescriptions.filter((item) => item.assignedToEmail === entry.user.email);
    const prescriptionMatch =
      filters.prescriptionStatus === undefined || filters.prescriptionStatus === "todas"
        ? true
        : userPrescriptions.some((item) => item.status === filters.prescriptionStatus);

    return ageMatch && levelMatch && trendMatch && prescriptionMatch;
  });
}

export function summarizeAuditLog(entries: AdminAuditEntry[]) {
  return entries.slice(0, 12);
}
