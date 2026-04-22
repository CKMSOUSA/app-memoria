"use client";

import { useState } from "react";

import { AppPreferencesPanel } from "@/components/AppPreferencesPanel";
import { InternalAssistant } from "@/components/InternalAssistant";
import { getRemoteBackendStatus } from "@/lib/app-repository";
import type { AppSettings } from "@/lib/app-settings";
import type { OfflineSyncStatus } from "@/lib/offline-store";
import {
  getAutomaticGoals,
  getComparativeReportInsights,
  getFormalEvaluationProtocol,
  getInterventionLibrary,
  getManagedStudentHistories,
  getPrivateClassRanking,
  getRelevantObservations,
  getRelevantPrescriptions,
  getRolePanelInsight,
  getUpcomingReminders,
} from "@/lib/product-management";
import { exportComparativeReportPdf, exportUserReportPdf } from "@/lib/report-pdf";
import {
  attentionChallenges,
  comparisonChallenges,
  exclusiveChallenges,
  logicChallenges,
  memoryChallenges,
  spatialChallenges,
  visualChallenges,
} from "@/lib/game-data-v3";
import {
  getAudienceFromAge,
  getAudienceLabel,
  getAgeLabel,
  getCompletionRate,
  getCompletionRateForIds,
  getNivel,
  getRecommendedChallengeId,
  getReportSummary,
  getSessionModeLabel,
  isChallengeUnlocked,
} from "@/lib/scoring";
import {
  getAbilityInsights,
  getAutomaticDiagnostic,
  getCooperativeCycle,
  getEngagementMissions,
  getGuidedSessions,
  getPerformanceTrends,
  getSmartRecommendation,
  getThemedTracks,
  getAchievementInsights,
} from "@/lib/training-insights";
import type {
  ClinicalObservation,
  PrescriptionSession,
  ProgressState,
  ReminderSchedule,
  SessionRecord,
  UserLink,
  Usuario,
} from "@/lib/types";

type TrailMode = "memoria" | "visual" | "atencao" | "comparacao" | "espacial" | "logica";

type DashboardProps = {
  usuario: Usuario;
  progresso: ProgressState;
  onOpenMemory: () => void;
  onOpenVisual: () => void;
  onOpenAttention: () => void;
  onOpenComparison: () => void;
  onOpenSpatial: () => void;
  onOpenLogic: () => void;
  onOpenProfile: () => void;
  onOpenSpecial: () => void;
  onOpenAdvanced: () => void;
  onOpenHelp: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  history: SessionRecord[];
  managedHistories: Array<{ user: Usuario; history: SessionRecord[]; progress?: ProgressState }>;
  observations: ClinicalObservation[];
  reminders: ReminderSchedule[];
  prescriptions: PrescriptionSession[];
  userLinks: UserLink[];
  settings: AppSettings;
  isOffline: boolean;
  offlineSyncStatus: OfflineSyncStatus;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onSaveReminder: (
    input: Omit<ReminderSchedule, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void | Promise<void>;
  onSavePrescription: (
    input: Omit<PrescriptionSession, "id" | "createdAt" | "status">,
  ) => void | Promise<void>;
  onUpdatePrescriptionStatus: (id: string, status: PrescriptionSession["status"]) => void | Promise<void>;
};

function ProgressList({
  title,
  mode,
  progressMap,
}: {
  title: string;
  mode: TrailMode;
  progressMap:
    | ProgressState["memoria"]
    | ProgressState["visual"]
    | ProgressState["atencao"]
    | ProgressState["comparacao"]
    | ProgressState["espacial"]
    | ProgressState["logica"];
}) {
  const challenges =
    mode === "memoria"
      ? memoryChallenges
      : mode === "visual"
        ? visualChallenges
      : mode === "atencao"
        ? attentionChallenges
        : mode === "comparacao"
          ? comparisonChallenges
          : mode === "espacial"
            ? spatialChallenges
            : logicChallenges;

  return (
    <section className="panel">
      <div className="section-head">
        <h3>{title}</h3>
        <span className="small-muted">
          {Object.values(progressMap).filter((item) => item.completed).length}/{challenges.length} concluidos
        </span>
      </div>

      <div className="challenge-list">
        {challenges.map((challenge) => {
          const progress = progressMap[challenge.id];
          const unlocked = isChallengeUnlocked(progressMap, challenge.id);

          return (
            <article key={challenge.id} className={`challenge-item ${progress.completed ? "is-complete" : ""}`}>
              <div>
                <p className="challenge-title">
                  {`Fase ${challenge.id} - ${challenge.difficultyLabel}: ${challenge.nome}`}
                </p>
                <p className="small-muted">
                  {unlocked ? "Liberado" : "Bloqueado ate concluir o anterior"} · Melhor score {progress.bestScore}
                </p>
              </div>
              <span className={`pill ${progress.completed ? "pill-success" : unlocked ? "pill-neutral" : "pill-locked"}`}>
                {progress.completed ? "Concluido" : unlocked ? "Em progresso" : "Bloqueado"}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <article className="stat-card">
      <p className="stat-card-label">{label}</p>
      <h3 className="stat-card-value">{value}</h3>
      <p className="stat-card-caption">{caption}</p>
    </article>
  );
}

function CompactMetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <article className="metric-chip-card">
      <div className="metric-chip-top">
        <p className="metric-chip-label">{label}</p>
        <strong className="metric-chip-value">{value}</strong>
      </div>
      <p className="metric-chip-caption">{caption}</p>
    </article>
  );
}

function AbilityCard({
  title,
  score,
  level,
  summary,
}: {
  title: string;
  score: number;
  level: "forte" | "estavel" | "prioridade";
  summary: string;
}) {
  return (
    <article className={`insight-card insight-card-${level}`}>
      <div className="insight-card-top">
        <p className="ability-card-title">{title}</p>
        <span className="pill">{score}/100</span>
      </div>
      <h3>{level === "forte" ? "Forte" : level === "estavel" ? "Estavel" : "Prioridade"}</h3>
      <p className="muted">{summary}</p>
    </article>
  );
}

function TrendCard({
  label,
  direction,
  scoreDelta,
  completionDelta,
  summary,
}: {
  label: string;
  direction: "subindo" | "estavel" | "caindo";
  scoreDelta: number;
  completionDelta: number;
  summary: string;
}) {
  const signal = direction === "subindo" ? "Em melhora" : direction === "caindo" ? "Em queda" : "Estavel";
  return (
    <article className={`trend-card trend-card-${direction}`}>
      <div className="section-head">
        <h3>{label}</h3>
        <span className="pill">{signal}</span>
      </div>
      <p className="muted">{summary}</p>
      <div className="trend-metrics">
        <span>{`${scoreDelta >= 0 ? "+" : ""}${scoreDelta} score`}</span>
        <span>{`${completionDelta >= 0 ? "+" : ""}${completionDelta}% conclusao`}</span>
      </div>
    </article>
  );
}

function GuidedPlanCard({
  title,
  durationLabel,
  objective,
  cadence,
  steps,
  onOpen,
}: {
  title: string;
  durationLabel: string;
  objective: string;
  cadence: string;
  steps: string[];
  onOpen: () => void;
}) {
  return (
    <article className="guided-plan-card">
      <div className="section-head">
        <div>
          <p className="small-muted">{durationLabel}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <p className="muted">{objective}</p>
      <p className="small-muted">{cadence}</p>
      <ul className="clean-list">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      <button className="btn btn-secondary" onClick={onOpen}>
        Abrir trilha principal
      </button>
    </article>
  );
}

function MissionCard({
  cadence,
  title,
  summary,
  progressLabel,
  completed,
  onOpen,
}: {
  cadence: "diaria" | "semanal";
  title: string;
  summary: string;
  progressLabel: string;
  completed: boolean;
  onOpen: () => void;
}) {
  return (
    <article className={`engagement-card mission-card ${completed ? "mission-card-complete" : ""}`}>
      <div className="section-head">
        <p className="engagement-tag">{cadence === "diaria" ? "Missao diaria" : "Missao semanal"}</p>
        <span className={`pill ${completed ? "pill-success" : "pill-neutral"}`}>{completed ? "Cumprida" : "Em curso"}</span>
      </div>
      <h3>{title}</h3>
      <p className="muted">{summary}</p>
      <p className="engagement-highlight">{progressLabel}</p>
      <button className="btn btn-secondary" onClick={onOpen}>
        Abrir atividade
      </button>
    </article>
  );
}

function AchievementCard({
  title,
  category,
  unlocked,
  summary,
  highlight,
}: {
  title: string;
  category: "consistencia" | "precisao" | "evolucao";
  unlocked: boolean;
  summary: string;
  highlight: string;
}) {
  const categoryLabel =
    category === "consistencia" ? "Consistencia" : category === "precisao" ? "Precisao" : "Evolucao";

  return (
    <article className={`engagement-card achievement-card ${unlocked ? "achievement-card-unlocked" : ""}`}>
      <div className="section-head">
        <p className="engagement-tag">{categoryLabel}</p>
        <span className={`pill ${unlocked ? "pill-success" : "pill-locked"}`}>{unlocked ? "Desbloqueada" : "Em preparo"}</span>
      </div>
      <h3>{title}</h3>
      <p className="muted">{summary}</p>
      <p className="engagement-highlight">{highlight}</p>
    </article>
  );
}

function ThemedTrackCard({
  title,
  label,
  summary,
  audienceHint,
  challengeName,
  onOpen,
}: {
  title: string;
  label: string;
  summary: string;
  audienceHint: string;
  challengeName: string;
  onOpen: () => void;
}) {
  return (
    <article className="engagement-card themed-track-card">
      <p className="engagement-tag">{label}</p>
      <h3>{title}</h3>
      <p className="muted">{summary}</p>
      <p className="small-muted">{audienceHint}</p>
      <p className="engagement-highlight">{`Comecar por ${challengeName}`}</p>
      <button className="btn btn-secondary" onClick={onOpen}>
        Abrir trilha
      </button>
    </article>
  );
}

function CooperativeCard({
  title,
  summary,
  partnerLabel,
  cadence,
  challengeName,
  actions,
  onOpen,
}: {
  title: string;
  summary: string;
  partnerLabel: string;
  cadence: string;
  challengeName: string;
  actions: string[];
  onOpen: () => void;
}) {
  return (
    <article className="engagement-card cooperative-card">
      <div className="section-head">
        <div>
          <p className="engagement-tag">Ciclo compartilhado</p>
          <h3>{title}</h3>
        </div>
        <span className="pill">{partnerLabel}</span>
      </div>
      <p className="muted">{summary}</p>
      <p className="engagement-highlight">{cadence}</p>
      <p className="small-muted">{`Atividade-base: ${challengeName}`}</p>
      <ul className="clean-list">
        {actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
      <button className="btn btn-primary" onClick={onOpen}>
        Abrir ciclo sugerido
      </button>
    </article>
  );
}

function RolePanelCard({
  title,
  summary,
  cards,
}: {
  title: string;
  summary: string;
  cards: Array<{ label: string; value: string; caption: string }>;
}) {
  return (
    <section className="panel">
      <div className="section-head">
        <h3>{title}</h3>
        <span className="small-muted">Painel dedicado por perfil</span>
      </div>
      <p className="muted">{summary}</p>
      <div className="stats-grid">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} caption={card.caption} />
        ))}
      </div>
    </section>
  );
}

function RankingCard({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ email: string; name: string; score: number; subtitle: string }>;
}) {
  return (
    <article className="engagement-card ranking-card">
      <div className="section-head">
        <h3>{title}</h3>
        <span className="pill">{entries.length} posicao(oes)</span>
      </div>
      {entries.length > 0 ? (
        <div className="ranking-list">
          {entries.map((entry, index) => (
            <div key={entry.email} className="ranking-item">
              <strong>{`${index + 1}. ${entry.name}`}</strong>
              <span>{entry.score}</span>
              <p className="small-muted">{entry.subtitle}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="small-muted">Ainda nao ha dados suficientes para formar o ranking privado.</p>
      )}
    </article>
  );
}

function ReminderPlanner({
  turma,
  reminders,
  onSave,
}: {
  turma: string | null;
  reminders: ReminderSchedule[];
  onSave: (input: Omit<ReminderSchedule, "id" | "createdAt" | "updatedAt">) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [days, setDays] = useState("Seg, Qua, Sex");
  const [duration, setDuration] = useState("10");

  return (
    <article className="engagement-card planner-card">
      <div className="section-head">
        <h3>Agenda de treino e lembretes</h3>
        <span className="small-muted">{reminders.length} rotina(s) ativa(s)</span>
      </div>
      <div className="planner-grid">
        <label className="field field-compact">
          <span>Titulo</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Treino de foco da semana" />
        </label>
        <label className="field field-compact">
          <span>Objetivo</span>
          <input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Ex.: Atencao e ritmo de resposta" />
        </label>
        <label className="field field-compact">
          <span>Dias</span>
          <input value={days} onChange={(event) => setDays(event.target.value)} placeholder="Seg, Qua, Sex" />
        </label>
        <label className="field field-compact">
          <span>Duracao em minutos</span>
          <input value={duration} onChange={(event) => setDuration(event.target.value)} />
        </label>
      </div>
      <button
        className="btn btn-secondary"
        onClick={() => {
          if (!title.trim() || !objective.trim()) return;
          void onSave({
            ownerEmail: "",
            turma,
            title: title.trim(),
            objective: objective.trim(),
            daysOfWeek: days.split(",").map((item) => item.trim()).filter(Boolean),
            durationMinutes: Math.max(5, Number(duration) || 10),
            active: true,
          });
          setTitle("");
          setObjective("");
        }}
      >
        Salvar rotina
      </button>
      <div className="clean-list">
        {reminders.map((item) => (
          <p key={item.id} className="small-muted">{`${item.title} · ${item.daysOfWeek.join(", ")} · ${item.durationMinutes} min`}</p>
        ))}
      </div>
    </article>
  );
}

function PrescriptionPanel({
  usuario,
  prescriptions,
  onSave,
  onUpdateStatus,
}: {
  usuario: Usuario;
  prescriptions: PrescriptionSession[];
  onSave: (input: Omit<PrescriptionSession, "id" | "createdAt" | "status">) => void | Promise<void>;
  onUpdateStatus: (id: string, status: PrescriptionSession["status"]) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [mode, setMode] = useState<"memoria" | "atencao" | "comparacao" | "espacial" | "logica" | "visual" | "especial">("atencao");
  const [challengeId, setChallengeId] = useState("1");
  const [notes, setNotes] = useState("");

  return (
    <article className="engagement-card planner-card">
      <div className="section-head">
        <h3>Sessoes prescritas</h3>
        <span className="small-muted">{prescriptions.length} item(ns) no ciclo</span>
      </div>
      {usuario.role === "professor" || usuario.role === "responsavel" ? (
        <>
          <div className="planner-grid">
            <label className="field field-compact">
              <span>Titulo</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Bloco de atencao da turma" />
            </label>
            <label className="field field-compact">
              <span>Email do aluno</span>
              <input value={targetEmail} onChange={(event) => setTargetEmail(event.target.value)} placeholder="aluno@email.com" />
            </label>
            <label className="field field-compact">
              <span>Trilha</span>
              <select className="text-input" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
                <option value="memoria">Memoria</option>
                <option value="visual">Memoria visual</option>
                <option value="atencao">Atencao</option>
                <option value="comparacao">Comparacao</option>
                <option value="espacial">Orientacao espacial</option>
                <option value="logica">Logica</option>
                <option value="especial">Trilha exclusiva</option>
              </select>
            </label>
            <label className="field field-compact">
              <span>Fase</span>
              <input value={challengeId} onChange={(event) => setChallengeId(event.target.value)} />
            </label>
          </div>
          <label className="field field-compact">
            <span>Objetivo</span>
            <input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Ex.: Reduzir erro por impulso" />
          </label>
          <label className="field field-compact">
            <span>Observacoes da sessao</span>
            <textarea className="text-input admin-reply-input" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (!title.trim() || !targetEmail.trim()) return;
              void onSave({
                assignedToEmail: targetEmail.trim().toLowerCase(),
                assignedByEmail: usuario.email,
                assignedByName: usuario.nome,
                turma: usuario.turma ?? null,
                title: title.trim(),
                objective: objective.trim() || "Sessao prescrita com objetivo orientado.",
                mode,
                challengeId: Math.max(1, Number(challengeId) || 1),
                challengeName: `${getSessionModeLabel(mode)} - Fase ${Math.max(1, Number(challengeId) || 1)}`,
                notes: notes.trim(),
                durationMinutes: 10,
              });
              setTitle("");
              setObjective("");
              setTargetEmail("");
              setNotes("");
            }}
          >
            Prescrever sessao
          </button>
        </>
      ) : null}
      <div className="prescription-list">
        {prescriptions.map((item) => (
          <div key={item.id} className="ranking-item">
            <strong>{item.title}</strong>
            <span>{item.status === "concluida" ? "Feita" : "Pendente"}</span>
            <p className="small-muted">{`${item.challengeName} · ${item.objective}`}</p>
            {usuario.role === "aluno" && item.status === "pendente" ? (
              <button className="btn btn-secondary" onClick={() => void onUpdateStatus(item.id, "concluida")}>
                Marcar como concluida
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function ComparativeCard({
  items,
  onExport,
}: {
  items: Array<{ label: string; currentValue: number; previousValue: number; delta: number; summary: string }>;
  onExport: () => void;
}) {
  return (
    <section className="panel">
      <div className="section-head">
        <h3>Comparativo por periodo</h3>
        <button className="btn btn-secondary btn-export-report" onClick={onExport}>
          Exportar comparativo
        </button>
      </div>
      <div className="engagement-grid">
        {items.map((item) => (
          <article key={item.label} className="engagement-card">
            <h3>{item.label}</h3>
            <p className="engagement-highlight">{`${item.currentValue} agora · ${item.previousValue} antes · ${item.delta >= 0 ? "+" : ""}${item.delta}`}</p>
            <p className="muted">{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InterventionCard({
  title,
  summary,
  actions,
}: {
  title: string;
  summary: string;
  actions: string[];
}) {
  return (
    <article className="engagement-card">
      <h3>{title}</h3>
      <p className="muted">{summary}</p>
      <ul className="clean-list">
        {actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </article>
  );
}

function ObservationTimeline({
  observations,
}: {
  observations: ClinicalObservation[];
}) {
  return (
    <section className="panel">
      <div className="section-head">
        <h3>Observacoes com historico</h3>
        <span className="small-muted">{observations.length} registro(s) do perfil</span>
      </div>
      <div className="observation-timeline">
        {observations.length > 0 ? (
          observations.map((item) => (
            <article key={item.id} className="engagement-card">
              <p className="engagement-tag">{item.category === "clinica" ? "Clinica" : "Pedagogica"}</p>
              <h3>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</h3>
              <p className="muted">{item.note}</p>
              <p className="small-muted">{`Autor atual: ${item.authorName}`}</p>
              {item.history && item.history.length > 0 ? (
                <div className="small-muted">
                  {item.history.slice(-3).map((revision) => (
                    <p key={`${revision.updatedAt}-${revision.authorName}`}>{`${new Date(revision.updatedAt).toLocaleDateString("pt-BR")} · ${revision.authorName}: ${revision.note}`}</p>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="small-muted">Ainda nao ha observacoes clinicas ou pedagogicas para este perfil.</p>
        )}
      </div>
    </section>
  );
}

function TrackCard({
  title,
  audience,
  currentAudience,
  description,
}: {
  title: string;
  audience: "infantil" | "adolescente" | "adulto";
  currentAudience: "infantil" | "adolescente" | "adulto";
  description: string;
}) {
  const isActive = audience === currentAudience;
  return (
    <article className={`track-card ${isActive ? "track-card-active" : ""}`}>
      <p className="small-muted">{isActive ? "Trilha atual" : "Disponivel no app"}</p>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </article>
  );
}

export function Dashboard({
  usuario,
  progresso,
  onOpenMemory,
  onOpenVisual,
  onOpenAttention,
  onOpenComparison,
  onOpenSpatial,
  onOpenLogic,
  onOpenProfile,
  onOpenSpecial,
  onOpenAdvanced,
  onOpenHelp,
  onOpenAdmin,
  onLogout,
  history,
  managedHistories,
  observations,
  reminders,
  prescriptions,
  userLinks,
  settings,
  isOffline,
  offlineSyncStatus,
  onUpdateSettings,
  onSaveReminder,
  onSavePrescription,
  onUpdatePrescriptionStatus,
}: DashboardProps) {
  const backendStatus = getRemoteBackendStatus();
  const memoriaRate = getCompletionRate(progresso.memoria);
  const visualRate = getCompletionRate(progresso.visual);
  const atencaoRate = getCompletionRate(progresso.atencao);
  const comparacaoRate = getCompletionRate(progresso.comparacao);
  const espacialRate = getCompletionRate(progresso.espacial);
  const currentAudience = getAudienceFromAge(usuario.idade);
  const specialChallenges = exclusiveChallenges.filter((item) => item.audience === currentAudience);
  const especialRate = getCompletionRateForIds(
    progresso.especial,
    specialChallenges.map((challenge) => challenge.id),
  );
  const memoriaRecomendada = memoryChallenges.find(
    (item) => item.id === getRecommendedChallengeId(progresso.memoria, memoryChallenges.map((challenge) => challenge.id)),
  );
  const visualRecomendada = visualChallenges.find(
    (item) => item.id === getRecommendedChallengeId(progresso.visual, visualChallenges.map((challenge) => challenge.id)),
  );
  const atencaoRecomendada = attentionChallenges.find(
    (item) =>
      item.id === getRecommendedChallengeId(progresso.atencao, attentionChallenges.map((challenge) => challenge.id)),
  );
  const comparacaoRecomendada = comparisonChallenges.find(
    (item) =>
      item.id ===
      getRecommendedChallengeId(progresso.comparacao, comparisonChallenges.map((challenge) => challenge.id)),
  );
  const logicaRecomendada = logicChallenges.find(
    (item) => item.id === getRecommendedChallengeId(progresso.logica, logicChallenges.map((challenge) => challenge.id)),
  );
  const resumo = getReportSummary(history);
  const abilityInsights = getAbilityInsights(history, progresso);
  const performanceTrends = getPerformanceTrends(history);
  const diagnostic = getAutomaticDiagnostic(usuario.idade, history, progresso);
  const smartRecommendation = getSmartRecommendation(history, progresso);
  const guidedSessions = getGuidedSessions(usuario.idade, history, progresso);
  const engagementMissions = getEngagementMissions(history, progresso);
  const achievementInsights = getAchievementInsights(history, progresso);
  const themedTracks = getThemedTracks(usuario.idade, history, progresso);
  const cooperativeCycle = getCooperativeCycle(usuario, history, progresso);
  const comparativeInsights = getComparativeReportInsights(history);
  const interventionLibrary = getInterventionLibrary(history, progresso);
  const formalEvaluationProtocol = getFormalEvaluationProtocol(usuario, history);
  const automaticGoals = getAutomaticGoals(history, progresso);
  const managedStudentHistories = getManagedStudentHistories(usuario, managedHistories, userLinks);
  const rolePanel = getRolePanelInsight(usuario, managedStudentHistories);
  const privateRanking = getPrivateClassRanking(managedStudentHistories, null, "score");
  const evolutionRanking = getPrivateClassRanking(managedStudentHistories, null, "evolucao");
  const relevantObservations = getRelevantObservations(observations, usuario.email);
  const upcomingReminders = getUpcomingReminders(reminders, usuario.email, usuario.turma ?? null);
  const relevantPrescriptions = getRelevantPrescriptions(prescriptions, usuario);
  function handleExportPdf() {
    exportUserReportPdf({
      usuario,
      generatedAt: new Date().toLocaleString("pt-BR"),
      summary: [
        { label: "Sessoes", value: String(resumo.totalSessions), caption: "Rodadas registradas no historico" },
        { label: "Concluidas", value: String(resumo.completedSessions), caption: "Sessoes com meta atingida" },
        { label: "Media", value: String(resumo.averageScore), caption: "Pontuacao media por sessao" },
        {
          label: "Modo forte",
          value: getSessionModeLabel(resumo.strongestMode),
          caption: "Trilha com melhor desempenho acumulado",
        },
      ],
      abilities: abilityInsights.map((item) => ({
        title: item.title,
        score: item.score,
        level: item.level === "forte" ? "Forte" : item.level === "estavel" ? "Estavel" : "Prioridade",
        summary: item.summary,
      })),
      trends: performanceTrends.map((item) => ({
        label: item.label,
        direction: item.direction === "subindo" ? "Em melhora" : item.direction === "caindo" ? "Em queda" : "Estavel",
        summary: item.summary,
      })),
      diagnostic: {
        title: diagnostic.title,
        readinessLabel: diagnostic.readinessLabel,
        summary: diagnostic.summary,
        focusLabel: diagnostic.focusLabel,
      },
      recommendation: {
        title: smartRecommendation.title,
        summary: smartRecommendation.reason,
        reason: smartRecommendation.reason,
      },
      guidedSessions: guidedSessions.map((item) => ({
        title: item.title,
        durationLabel: item.durationLabel,
        summary: `${item.objective}. Ritmo sugerido: ${item.cadence}.`,
      })),
    });
  }

  function handleExportComparativePdf() {
    exportComparativeReportPdf({
      usuario,
      generatedAt: new Date().toLocaleString("pt-BR"),
      items: comparativeInsights,
    });
  }
  const [activeTrailTab, setActiveTrailTab] = useState<TrailMode>("memoria");
  const trailTabs: Array<{
    id: TrailMode;
    label: string;
    title: string;
    rate: number;
    progressMap:
      | ProgressState["memoria"]
      | ProgressState["visual"]
      | ProgressState["atencao"]
      | ProgressState["comparacao"]
      | ProgressState["espacial"]
      | ProgressState["logica"];
  }> = [
    { id: "memoria", label: "Memoria", title: "Trilha de memoria", rate: memoriaRate, progressMap: progresso.memoria },
    { id: "visual", label: "Memoria visual", title: "Trilha de memoria visual", rate: visualRate, progressMap: progresso.visual },
    { id: "atencao", label: "Atencao", title: "Trilha de atencao", rate: atencaoRate, progressMap: progresso.atencao },
    {
      id: "comparacao",
      label: "Comparacao",
      title: "Trilha de comparacao",
      rate: comparacaoRate,
      progressMap: progresso.comparacao,
    },
    {
      id: "espacial",
      label: "Orientacao espacial",
      title: "Trilha de orientacao espacial",
      rate: espacialRate,
      progressMap: progresso.espacial,
    },
    { id: "logica", label: "Logica", title: "Trilha de logica", rate: getCompletionRate(progresso.logica), progressMap: progresso.logica },
  ];
  const activeTrail = trailTabs.find((trail) => trail.id === activeTrailTab) ?? trailTabs[0];
  const openMode = (mode: TrailMode) => {
    if (mode === "memoria") return onOpenMemory();
    if (mode === "visual") return onOpenVisual();
    if (mode === "atencao") return onOpenAttention();
    if (mode === "comparacao") return onOpenComparison();
    if (mode === "espacial") return onOpenSpatial();
    return onOpenLogic();
  };

  return (
    <main className="shell shell-dashboard">
      <aside className="sidebar">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">{usuario.avatar}</div>
          <div>
            <h2>{usuario.nome}</h2>
            <p className="sidebar-email">{usuario.email}</p>
          </div>
        </div>
        <p className="sidebar-label">Treino diario</p>
        <button className="btn btn-side btn-side-active">Dashboard</button>
        <button className="btn btn-side" onClick={onOpenMemory}>
          Jogo de memoria
        </button>
        <button className="btn btn-side" onClick={onOpenVisual}>
          Memoria visual
        </button>
        <button className="btn btn-side" onClick={onOpenAttention}>
          Jogo de atencao
        </button>
        <button className="btn btn-side" onClick={onOpenComparison}>
          Jogo de comparacao
        </button>
        <button className="btn btn-side" onClick={onOpenSpatial}>
          Orientacao espacial
        </button>
        <button className="btn btn-side" onClick={onOpenLogic}>
          Jogo de logica
        </button>
        <button className="btn btn-side" onClick={onOpenSpecial}>
          Trilha exclusiva
        </button>
        <button className="btn btn-side" onClick={onOpenAdvanced}>
          Testes Avancados
        </button>
        <button className="btn btn-side" onClick={onOpenProfile}>
          Perfil
        </button>
        <button className="btn btn-side" onClick={onOpenHelp}>
          Ajuda
        </button>
        {usuario.role === "admin" ? (
          <>
            <p className="sidebar-label">Gestao</p>
            <button className="btn btn-side" onClick={onOpenAdmin}>
              Painel administrativo
            </button>
          </>
        ) : null}
        <button className="btn btn-side" onClick={onLogout}>
          Sair
        </button>
      </aside>

      <section className="content">
        <header className="topbar panel">
          <div className="topbar-main">
            <p className="eyebrow">Painel do usuario</p>
            <div className="dashboard-title-row">
              <h1 className="dashboard-title">{`Ola, ${usuario.nome}`}</h1>
              <span className="dashboard-age-chip">{getAgeLabel(usuario.idade)}</span>
            </div>
            <p className="muted">
              Seu progresso fica salvo por desafio. Os pontos so aumentam quando voce supera seu melhor resultado em
              cada fase.
            </p>
            <div className="topbar-actions">
              <button className="btn btn-primary" onClick={onOpenMemory}>
                Memoria
              </button>
              <button className="btn btn-secondary" onClick={onOpenAttention}>
                Atencao
              </button>
              <button className="btn btn-secondary" onClick={onOpenComparison}>
                Comparacao
              </button>
              <button className="btn btn-secondary" onClick={onOpenSpatial}>
                Orientacao espacial
              </button>
              <button className="btn btn-secondary" onClick={onOpenLogic}>
                Logica
              </button>
              <button className="btn btn-secondary" onClick={onOpenAdvanced}>
                Testes Avancados
              </button>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-support-actions">
              {usuario.role === "admin" ? (
                <button className="btn btn-topbar-admin" onClick={onOpenAdmin}>
                  Acesso administrador
                </button>
              ) : null}
              <button className="btn btn-topbar-profile" onClick={onOpenProfile}>
                Editar perfil
              </button>
              <button className="btn btn-topbar-help" onClick={onOpenHelp}>
                Abrir ajuda
              </button>
            </div>
            <section className={`topbar-personal panel audience-hero audience-${currentAudience}`}>
              <div>
                <p className="eyebrow">Experiencia personalizada</p>
                <h3>{getAudienceLabel(currentAudience)}</h3>
                <p className="muted">
                  {currentAudience === "infantil"
                    ? "Painel com linguagem mais ludica, jogos concretos e reforco positivo para criancas."
                    : currentAudience === "adolescente"
                      ? "Painel com ritmo mais rapido, metas intermediarias e desafios de foco e codificacao."
                      : "Painel com maior densidade, rotina objetiva e desafios com mais carga cognitiva."}
                </p>
              </div>
              <button className="btn btn-primary" onClick={onOpenSpecial}>
                Abrir minijogo
              </button>
            </section>
          </div>
        </header>

        <section className="panel metrics-panel">
          <div className="section-head">
            <h3>{`Resumo do treino: Status ${usuario.premium ? "Premium" : "Basico"}`}</h3>
            <span className="small-muted">Indicadores principais do desempenho atual</span>
          </div>
          <div className="metrics-strip">
            <CompactMetricCard
              label="Pontos"
              value={String(usuario.pontos)}
              caption="Pontuacao acumulada por melhora real"
            />
            <CompactMetricCard label="Nivel" value={getNivel(usuario.pontos)} caption="Escala progressiva do aplicativo" />
            <CompactMetricCard
              label="Memoria / Visual"
              value={`${memoriaRate}% / ${visualRate}%`}
              caption="Progresso nas trilhas verbal e visual"
            />
            <CompactMetricCard
              label="Atencao"
              value={`${atencaoRate}%`}
              caption="Percentual de desafios concluidos em foco seletivo"
            />
            <CompactMetricCard
              label="Comparacao"
              value={`${comparacaoRate}%`}
              caption="Comparacoes de quantidade, valor, ordem e tamanho"
            />
            <CompactMetricCard
              label="Orientacao"
              value={`${espacialRate}%`}
              caption="Progresso nos desafios de rota, direcao e referencia espacial"
            />
            <CompactMetricCard
              label="Logica"
              value={`${getCompletionRate(progresso.logica)}%`}
              caption="Sequencias, padroes e previsao do proximo termo"
            />
            <CompactMetricCard
              label="Trilha exclusiva"
              value={`${especialRate}%`}
              caption="Progresso no minijogo do seu publico"
            />
          </div>
        </section>

        <AppPreferencesPanel
          settings={settings}
          isOffline={isOffline}
          offlineSyncStatus={offlineSyncStatus}
          onUpdateSettings={onUpdateSettings}
        />

        {rolePanel ? <RolePanelCard title={rolePanel.title} summary={rolePanel.summary} cards={rolePanel.cards} /> : null}

        <InternalAssistant
          usuario={usuario}
          progresso={progresso}
          history={history}
          onOpenMemory={onOpenMemory}
          onOpenAttention={onOpenAttention}
          onOpenComparison={onOpenComparison}
          onOpenSpatial={onOpenSpatial}
          onOpenLogic={onOpenLogic}
          onOpenSpecial={onOpenSpecial}
        />

        {(usuario.role === "professor" || usuario.role === "responsavel") && usuario.turma ? (
          <section className="panel">
            <div className="section-head">
              <h3>Ranking privado da turma</h3>
              <span className="small-muted">Leitura interna por grupo, sem exposicao publica</span>
            </div>
            <div className="engagement-grid">
              <RankingCard title="Ranking por desempenho" entries={privateRanking} />
              <RankingCard title="Ranking por evolucao" entries={evolutionRanking} />
            </div>
          </section>
        ) : null}

        {(usuario.role === "professor" || usuario.role === "responsavel") ? (
          <section className="panel">
            <div className="section-head">
              <h3>Rotina orientada do grupo</h3>
              <span className="small-muted">Agenda, lembretes e sessoes prescritas para o ciclo atual</span>
            </div>
            <div className="engagement-grid">
              <ReminderPlanner
                turma={usuario.turma ?? null}
                reminders={upcomingReminders}
                onSave={(input) =>
                  onSaveReminder({
                    ...input,
                    ownerEmail: usuario.email,
                  })
                }
              />
              <PrescriptionPanel
                usuario={usuario}
                prescriptions={relevantPrescriptions}
                onSave={onSavePrescription}
                onUpdateStatus={onUpdatePrescriptionStatus}
              />
            </div>
          </section>
        ) : null}

        {usuario.role === "aluno" ? (
          <section className="panel">
            <div className="section-head">
              <h3>Minha agenda guiada</h3>
              <span className="small-muted">Lembretes e sessoes que chegaram para este perfil</span>
            </div>
            <div className="engagement-grid">
              <article className="engagement-card planner-card">
                <h3>Lembretes ativos</h3>
                {upcomingReminders.length > 0 ? (
                  upcomingReminders.map((item) => (
                    <p key={item.id} className="small-muted">{`${item.title} · ${item.daysOfWeek.join(", ")} · ${item.durationMinutes} min`}</p>
                  ))
                ) : (
                  <p className="small-muted">Nenhum lembrete ativo para este perfil ainda.</p>
                )}
              </article>
              <PrescriptionPanel
                usuario={usuario}
                prescriptions={relevantPrescriptions}
                onSave={onSavePrescription}
                onUpdateStatus={onUpdatePrescriptionStatus}
              />
            </div>
          </section>
        ) : null}

        <section className="panel">
          <div className="section-head">
            <h3>Missoes diarias e semanais</h3>
            <span className="small-muted">Metas curtas para manter frequencia e dar direcao ao proximo treino</span>
          </div>
          <div className="engagement-grid">
            {engagementMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                cadence={mission.cadence}
                title={mission.title}
                summary={mission.summary}
                progressLabel={mission.progressLabel}
                completed={mission.completed}
                onOpen={() => openMode(mission.primaryMode)}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Metas automaticas por aluno</h3>
            <span className="small-muted">Geradas com base em historico, erro recorrente e ritmo recente</span>
          </div>
          <div className="engagement-grid">
            {automaticGoals.map((goal) => (
              <article key={goal.title} className="engagement-card">
                <h3>{goal.title}</h3>
                <p className="engagement-highlight">{goal.progressLabel}</p>
                <p className="muted">{goal.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel report-panel">
          <div className="section-head">
            <h3>Relatorio de desempenho</h3>
            <div className="section-head-actions">
              <span className="small-muted">Resumo automatico das suas sessoes</span>
              <button className="btn btn-secondary btn-export-report" onClick={handleExportPdf}>
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="stats-grid">
            <StatCard label="Sessoes" value={String(resumo.totalSessions)} caption="Rodadas registradas no historico" />
            <StatCard label="Concluidas" value={String(resumo.completedSessions)} caption="Sessoes com meta atingida" />
            <StatCard label="Media" value={String(resumo.averageScore)} caption="Pontuacao media por sessao" />
            <StatCard label="Modo forte" value={getSessionModeLabel(resumo.strongestMode)} caption="Trilha com melhor desempenho acumulado" />
          </div>
        </section>

        <ComparativeCard items={comparativeInsights} onExport={handleExportComparativePdf} />

        <section className="panel diagnostic-panel">
          <div className="section-head">
            <h3>{diagnostic.title}</h3>
            <span className="pill">{diagnostic.readinessLabel}</span>
          </div>
          <p className="muted">{diagnostic.summary}</p>
          <p className="small-muted">{diagnostic.focusLabel}</p>
          <div className="diagnostic-chip-grid">
            {diagnostic.starters.map((starter) => (
              <article key={`${starter.mode}-${starter.challengeId}`} className="phase-chip phase-chip-wide">
                <strong>{getSessionModeLabel(starter.mode)}</strong>
                <span>{`Fase ${starter.challengeId} - ${starter.challengeName}`}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Relatorios por habilidade</h3>
            <span className="ability-section-subtitle">Leitura separada de memoria, atencao, velocidade e raciocinio</span>
          </div>
          <div className="insight-grid">
            {abilityInsights.map((insight) => (
              <AbilityCard
                key={insight.key}
                title={insight.title}
                score={insight.score}
                level={insight.level}
                summary={insight.summary}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Historico semanal e mensal</h3>
            <span className="small-muted">Tendencia de melhora ou queda no ritmo recente</span>
          </div>
          <div className="trend-grid">
            {performanceTrends.map((trend) => (
              <TrendCard
                key={trend.label}
                label={trend.label}
                direction={trend.direction}
                scoreDelta={trend.scoreDelta}
                completionDelta={trend.completionDelta}
                summary={trend.summary}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Conquistas visuais</h3>
            <span className="small-muted">Reconhecimentos por consistencia, precisao e evolucao, nao so por pontuacao</span>
          </div>
          <div className="engagement-grid">
            {achievementInsights.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                title={achievement.title}
                category={achievement.category}
                unlocked={achievement.unlocked}
                summary={achievement.summary}
                highlight={achievement.highlight}
              />
            ))}
          </div>
        </section>

        <ObservationTimeline observations={relevantObservations} />

        {usuario.role === "admin" ? (
          <section className="panel backend-panel">
            <div className="section-head">
              <h3>Contas e Progresso Online</h3>
              <span className={`pill ${backendStatus.ready ? "pill-success" : "pill-neutral"}`}>{backendStatus.provider}</span>
            </div>
            <p className="muted">{backendStatus.description}</p>
            <div className="phase-summary">
              <div className="phase-chip">
                <strong>Modo</strong>
                <span>{backendStatus.mode === "remote" ? "Remoto" : "Local"}</span>
              </div>
              <div className="phase-chip">
                <strong>Status</strong>
                <span>{backendStatus.ready ? "Pronto para sincronizar" : "Falta configurar credenciais"}</span>
              </div>
              <div className="phase-chip">
                <strong>Impacto</strong>
                <span>{backendStatus.ready ? "Conta e progresso online" : "Conta e progresso ficam no navegador"}</span>
              </div>
            </div>
          </section>
        ) : null}

        <section className="panel">
          <div className="section-head">
            <h3>Trilhas por publico</h3>
            <span className="small-muted">O app ajusta conteudo e dificuldade automaticamente pela idade</span>
          </div>
          <div className="track-grid">
            <TrackCard
              title="Trilha Infantil"
              audience="infantil"
              currentAudience={currentAudience}
              description="Vocabulos mais concretos, instrucoes mais ludicas e menor carga visual para criancas."
            />
            <TrackCard
              title="Trilha Adolescente"
              audience="adolescente"
              currentAudience={currentAudience}
              description="Mais velocidade, mais itens por rodada e desafios com exigencia intermediaria."
            />
            <TrackCard
              title="Trilha Adulta"
              audience="adulto"
              currentAudience={currentAudience}
              description="Mais densidade de informacao, menos tempo e metas mais exigentes por fase."
            />
          </div>
        </section>

        <section className="panel quick-grid">
          <article className="quick-card quick-card-highlight">
            <p className="small-muted">Recomendacao inteligente</p>
            <h3>{smartRecommendation.title}</h3>
            <p className="muted">{smartRecommendation.reason}</p>
            <p className="small-muted">{`${smartRecommendation.objective} Proxima fase: ${smartRecommendation.challengeName}.`}</p>
            <button className="btn btn-primary" onClick={() => openMode(smartRecommendation.mode)}>
              Abrir atividade sugerida
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendacao de memoria</p>
            <h3>{memoriaRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para trabalhar evocacao de palavras e consolidar rotina curta de treino.</p>
            <button className="btn btn-secondary" onClick={onOpenMemory}>
              Abrir memoria
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendacao visual</p>
            <h3>{visualRecomendada?.nomeInfantil ?? visualRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para pareamento de figuras, memoria de posicao e treino com animais e flores.</p>
            <button className="btn btn-secondary" onClick={onOpenVisual}>
              Abrir memoria visual
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendacao de atencao</p>
            <h3>{atencaoRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para foco seletivo, velocidade visual e reducao de erros por impulso.</p>
            <button className="btn btn-secondary" onClick={onOpenAttention}>
              Abrir atencao
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendacao de comparacao</p>
            <h3>{comparacaoRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para criterio, ordem, tamanho, quantidade e decisao rapida entre opcoes.</p>
            <button className="btn btn-secondary" onClick={onOpenComparison}>
              Abrir comparacao
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendacao de logica</p>
            <h3>{logicaRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para perceber padroes, completar sequencias e prever o proximo elemento.</p>
            <button className="btn btn-secondary" onClick={onOpenLogic}>
              Abrir logica
            </button>
          </article>
        </section>

        <section className="panel split-panel">
          <div>
            <div className="section-head">
              <h3>Evolucao geral</h3>
              <span className="small-muted">Meta sugerida: 75 pontos</span>
            </div>
            <div className="progress-rail">
              <div className="progress-fill" style={{ width: `${Math.min((usuario.pontos / 75) * 100, 100)}%` }} />
            </div>
            <p className="muted">
              Continue tentando melhorar seus melhores resultados. Assim a progressao fica mais justa, mais clara e
              menos repetitiva.
            </p>
          </div>

          <div>
            <div className="section-head">
              <h3>Rotina sugerida</h3>
            </div>
            <ul className="clean-list">
              <li>{`Prioridade principal: ${smartRecommendation.challengeName} em ${getSessionModeLabel(smartRecommendation.mode)}`}</li>
              <li>{`Memoria: priorize "${memoriaRecomendada?.nome ?? "primeiro desafio"}" na proxima sessao`}</li>
              <li>{`Atencao: priorize "${atencaoRecomendada?.nome ?? "primeiro desafio"}" para variar o treino`}</li>
              <li>{`Comparacao: priorize "${comparacaoRecomendada?.nome ?? "primeiro desafio"}" para ampliar o raciocinio comparativo`}</li>
              <li>As fases liberam em ordem, entao concluir bem a atual ajuda a manter a trilha pedagogica</li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Sessoes guiadas por objetivo</h3>
            <span className="small-muted">Planos curtos e progressivos para usar sem montar a rotina manualmente</span>
          </div>
          <div className="guided-plan-grid">
            {guidedSessions.map((plan) => (
              <GuidedPlanCard
                key={plan.id}
                title={plan.title}
                durationLabel={plan.durationLabel}
                objective={plan.objective}
                cadence={plan.cadence}
                steps={plan.steps}
                onOpen={() => openMode(plan.primaryMode)}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Biblioteca de intervencoes</h3>
            <span className="small-muted">Acoes praticas sugeridas conforme habilidade, idade e desempenho</span>
          </div>
          <div className="engagement-grid">
            {interventionLibrary.map((item) => (
              <InterventionCard key={item.title} title={item.title} summary={item.summary} actions={item.actions} />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Trilhas tematicas</h3>
            <span className="small-muted">Atalhos prontos para foco escolar, agilidade mental, reabilitacao e desafio elite</span>
          </div>
          <div className="engagement-grid">
            {themedTracks.map((track) => (
              <ThemedTrackCard
                key={track.id}
                title={track.title}
                label={track.label}
                summary={track.summary}
                audienceHint={track.audienceHint}
                challengeName={track.challengeName}
                onOpen={() => openMode(track.primaryMode)}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Modo duelo ou cooperativo</h3>
            <span className="small-muted">Mesmo ciclo para aluno e professor ou responsavel acompanharem juntos</span>
          </div>
          <CooperativeCard
            title={cooperativeCycle.title}
            summary={cooperativeCycle.summary}
            partnerLabel={cooperativeCycle.partnerLabel}
            cadence={cooperativeCycle.cadence}
            challengeName={cooperativeCycle.challengeName}
            actions={cooperativeCycle.actions}
            onOpen={() => openMode(cooperativeCycle.primaryMode)}
          />
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Checklist de acessibilidade avancada</h3>
            <span className="small-muted">Contraste, foco, voz, teclado e ambiente formal controlado</span>
          </div>
          <div className="engagement-grid">
            <article className="engagement-card">
              <h3>{formalEvaluationProtocol.title}</h3>
              <p className="muted">{formalEvaluationProtocol.summary}</p>
              <ul className="clean-list">
                {formalEvaluationProtocol.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
            <article className="engagement-card">
              <h3>Checklist de leitura e acesso</h3>
              <ul className="clean-list">
                <li>{`Contraste forte: ${settings.highContrast ? "ativo" : "inativo"}`}</li>
                <li>{`Fonte ampliada: ${settings.largeText ? "ativa" : "inativa"}`}</li>
                <li>{`Narracao: ${settings.narrationEnabled ? "ativa" : "inativa"}`}</li>
                <li>{`Foco visivel: ${settings.visibleFocus ? "ativo" : "inativo"}`}</li>
                <li>{`Teclado: ${settings.keyboardNavigation ? "ativo" : "inativo"}`}</li>
                <li>{`Modo formal: ${settings.formalEvaluationMode ? "ativo" : "inativo"}`}</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="panel trails-panel">
          <div className="section-head">
            <h3>Trilhas do aluno</h3>
            <span className="small-muted">Abra apenas a trilha que quiser acompanhar agora</span>
          </div>

          <div className="trail-tabs" role="tablist" aria-label="Trilhas do aluno">
            {trailTabs.map((trail) => (
              <button
                key={trail.id}
                type="button"
                role="tab"
                aria-selected={trail.id === activeTrailTab}
                className={`trail-tab ${trail.id === activeTrailTab ? "trail-tab-active" : ""}`}
                onClick={() => setActiveTrailTab(trail.id)}
              >
                <span className="trail-tab-label">{trail.label}</span>
                <span className="trail-tab-rate">{trail.rate}% concluidos</span>
              </button>
            ))}
          </div>

          <div className="trail-panel-shell">
            <ProgressList title={activeTrail.title} mode={activeTrail.id} progressMap={activeTrail.progressMap} />
          </div>
        </section>
      </section>
    </main>
  );
}
