"use client";

import { type ReactNode, useEffect, useState } from "react";

import { AppPreferencesPanel } from "@/components/AppPreferencesPanel";
import { InternalAssistant } from "@/components/InternalAssistant";
import { PauseReflectionButton } from "@/components/PauseReflectionButton";
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
  focusVisionChallenges,
  logicChallenges,
  memoryChallenges,
  processChallenges,
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
  SessionMode,
  SessionRecord,
  UserLink,
  Usuario,
} from "@/lib/types";

type TrailMode = "memoria" | "visual" | "atencao" | "comparacao" | "espacial" | "logica" | "processo" | "visaoFocada";
type DashboardTab = "hoje" | "progresso" | "rotina" | "insights";
type QuickGroup = "base" | "especial" | "avancado" | "explorar";

const processReflectionPrompts = [
  "O que está ocupando sua mente neste momento?",
  "Que sensação aparece quando você fica alguns segundos sem pressa?",
  "O que você quer cuidar melhor hoje?",
  "Qual pensamento merece ser observado sem virar uma ação imediata?",
  "O que este pequeno intervalo muda no seu jeito de perceber o tempo?",
  "Que significado você quer colocar no que vai fazer agora?",
  "O que você nota no seu corpo quando para por alguns segundos?",
  "Que escolha simples pode deixar este momento mais consciente?",
  "Qual foi a melhor parte do seu dia até agora?",
  "O que você gostaria de entender melhor sobre si mesmo?",
  "Que coisa pequena merece sua gratidão neste momento?",
  "O que você pode fazer com mais calma hoje?",
  "Qual sentimento está mais presente agora?",
  "Que pensamento você pode deixar passar sem brigar com ele?",
  "O que você quer lembrar quando terminar esta pausa?",
  "Qual atitude sua combina com a pessoa que você quer ser?",
  "O que você pode observar sem tentar mudar imediatamente?",
  "Qual parte do seu dia pediu mais paciência?",
  "O que você aprendeu recentemente sobre esperar?",
  "Que pequena decisão pode melhorar seu próximo momento?",
  "O que você está sentindo que ainda não colocou em palavras?",
  "Qual barulho ou silêncio você percebe agora?",
  "O que seu corpo parece estar pedindo neste instante?",
  "Que coisa você pode fazer com mais presença?",
  "Qual pensamento está tentando correr na sua frente?",
  "O que fica mais claro quando você respira devagar?",
  "Que valor você quer praticar nos próximos minutos?",
  "O que você pode aceitar por enquanto?",
  "Qual cuidado simples você pode ter consigo hoje?",
  "O que você quer soltar antes de continuar?",
  "Que parte de você precisa de gentileza agora?",
  "O que mudou dentro de você desde o começo do dia?",
  "Qual lembrança boa pode te acompanhar por alguns segundos?",
  "O que você quer perceber melhor ao seu redor?",
  "Que pequena coisa está funcionando bem hoje?",
  "Qual pensamento merece menos pressa?",
  "O que você pode fazer sem se cobrar tanto?",
  "Que pergunta você faria para si mesmo agora?",
  "O que você quer cultivar com repetição e paciência?",
  "Qual detalhe do ambiente você ainda não tinha notado?",
  "O que você pode agradecer sem precisar explicar?",
  "Que escolha ajudaria você a ficar mais inteiro agora?",
  "O que significa estar atento neste momento?",
  "Qual parte do tempo você costuma apressar?",
  "O que você pode fazer para respeitar seu ritmo?",
  "Que sensação aparece quando você não precisa responder logo?",
  "O que você gostaria de cuidar com mais carinho?",
  "Qual pensamento pode esperar mais um pouco?",
  "O que você quer fazer com mais intenção?",
  "Que qualidade você quer trazer para este momento?",
  "O que você percebe quando escuta sua própria respiração?",
  "Qual parte do seu corpo está mais relaxada agora?",
  "Qual parte do seu corpo está pedindo atenção?",
  "O que você pode notar sem julgar?",
  "Que coisa simples pode te ajudar a recomeçar?",
  "O que você quer lembrar sobre o valor da pausa?",
  "Qual emoção merece espaço sem pressa?",
  "O que você pode fazer hoje que tenha significado?",
  "Que tipo de pessoa você quer ser no próximo gesto?",
  "O que você está tentando controlar demais?",
  "O que você pode deixar acontecer no seu tempo?",
  "Que pensamento te aproxima de uma escolha melhor?",
  "O que você pode observar no intervalo entre uma ideia e outra?",
  "Qual foi uma pequena vitória recente?",
  "O que você quer aprender com este momento de espera?",
  "Que coisa importante não precisa ser resolvida agora?",
  "O que você pode fazer com mais leveza?",
  "Qual palavra descreve seu estado agora?",
  "Que palavra você gostaria de levar para o resto do dia?",
  "O que você pode perceber sem transformar em tarefa?",
  "Qual cuidado você ofereceria a um amigo neste momento?",
  "Você pode oferecer esse mesmo cuidado a si mesmo?",
  "O que você quer fazer devagar para fazer melhor?",
  "Qual hábito você quer fortalecer aos poucos?",
  "O que você pode escolher mesmo quando existe pressa?",
  "Que coisa te ajuda a voltar para o presente?",
  "O que você nota no seu rosto quando para por alguns segundos?",
  "Que pensamento te deixa mais calmo?",
  "O que você pode fazer para ouvir melhor a si mesmo?",
  "Qual pequena verdade você está percebendo agora?",
  "O que você quer honrar no seu próprio tempo?",
  "Que gesto simples pode demonstrar respeito por você?",
  "O que você pode deixar mais simples hoje?",
  "Qual expectativa você pode afrouxar um pouco?",
  "O que você quer fazer com mais honestidade?",
  "Que coisa você pode reconhecer sem se comparar?",
  "O que você pode notar sobre sua energia agora?",
  "Qual limite seu merece respeito hoje?",
  "Que escolha pequena pode proteger sua atenção?",
  "O que você faria se pudesse agir com mais calma?",
  "Qual parte deste momento parece suficiente?",
  "O que você quer lembrar quando sentir pressa?",
  "Que pensamento pode virar curiosidade em vez de cobrança?",
  "O que você pode aprender com uma pausa curta?",
  "Qual sentimento você pode nomear sem tentar consertar?",
  "O que você quer preservar dentro de você hoje?",
  "Que coisa simples mostra que você está presente?",
  "O que você pode fazer com cuidado mesmo sendo pequeno?",
  "Qual direção você quer dar para sua atenção?",
  "O que você percebe quando não precisa provar nada?",
  "Que parte da sua rotina pode ganhar mais sentido?",
  "O que você quer fazer porque importa, não porque é urgente?",
  "O que você pode respeitar no seu próprio ritmo?",
];

type DashboardProps = {
  usuario: Usuario;
  progresso: ProgressState;
  onOpenMemory: () => void;
  onOpenVisual: () => void;
  onOpenAttention: () => void;
  onOpenComparison: () => void;
  onOpenSpatial: () => void;
  onOpenLogic: () => void;
  onOpenProcess: () => void;
  onOpenFocusVision: () => void;
  onOpenProfile: () => void;
  onOpenSpecial: (challengeId?: number) => void;
  onOpenAdvanced: () => void;
  onOpenAdvancedMemory: () => void;
  onOpenAdvancedAttention: () => void;
  onOpenAdvancedComparison: () => void;
  onOpenAdvancedSpatial: () => void;
  onOpenAdvancedLogic: () => void;
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
      | ProgressState["logica"]
      | ProgressState["processo"]
      | ProgressState["visaoFocada"];
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
            : mode === "logica"
              ? logicChallenges
              : mode === "processo"
                ? processChallenges
                : focusVisionChallenges;

  return (
    <section className="panel">
      <div className="section-head">
        <h3>{title}</h3>
        <span className="small-muted">
          {Object.values(progressMap).filter((item) => item.completed).length}/{challenges.length} concluídos
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
                  {unlocked ? "Liberado" : "Bloqueado até concluir o anterior"} · Melhor score {progress.bestScore}
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

function SidebarMenuGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="sidebar-group" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="sidebar-group-body">{children}</div>
    </details>
  );
}

function DisclosureSection({
  title,
  caption,
  children,
  defaultOpen = false,
}: {
  title: string;
  caption: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="dashboard-disclosure panel" open={defaultOpen}>
      <summary className="dashboard-disclosure-summary">
        <div>
          <h3>{title}</h3>
          <span className="small-muted">{caption}</span>
        </div>
      </summary>
      <div className="dashboard-disclosure-body">{children}</div>
    </details>
  );
}

function getGoalLabel(goal: Usuario["goal"]) {
  switch (goal) {
    case "memoria":
      return "Fortalecer memória";
    case "atencao":
      return "Melhorar atenção";
    case "pedagogico":
      return "Reforço pedagógico";
    case "rotina":
      return "Criar rotina";
    default:
      return "Definir foco";
  }
}

function getLevelLabel(level: Usuario["selfReportedLevel"]) {
  switch (level) {
    case "iniciante":
      return "Iniciante";
    case "intermediario":
      return "Intermediário";
    case "avancado":
      return "Avançado";
    default:
      return "Não definido";
  }
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
      <h3>{level === "forte" ? "Forte" : level === "estavel" ? "Estável" : "Prioridade"}</h3>
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
  const signal = direction === "subindo" ? "Em melhora" : direction === "caindo" ? "Em queda" : "Estável";
  return (
    <article className={`trend-card trend-card-${direction}`}>
      <div className="section-head">
        <h3>{label}</h3>
        <span className="pill">{signal}</span>
      </div>
      <p className="muted">{summary}</p>
      <div className="trend-metrics">
        <span>{`${scoreDelta >= 0 ? "+" : ""}${scoreDelta} score`}</span>
        <span>{`${completionDelta >= 0 ? "+" : ""}${completionDelta}% conclusão`}</span>
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
        <p className="engagement-tag">{cadence === "diaria" ? "Missão diária" : "Missão semanal"}</p>
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
    category === "consistencia" ? "Consistência" : category === "precisao" ? "Precisão" : "Evolução";

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
      <p className="engagement-highlight">{`Começar por ${challengeName}`}</p>
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
        <span className="pill">{entries.length} posição(oes)</span>
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
        <p className="small-muted">Ainda não há dados suficientes para formar o ranking privado.</p>
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
          <input value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Ex.: Atenção e ritmo de resposta" />
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
        <h3>Sessões prescritas</h3>
        <span className="small-muted">{prescriptions.length} item(ns) no ciclo</span>
      </div>
      {usuario.role === "professor" || usuario.role === "responsavel" ? (
        <>
          <div className="planner-grid">
            <label className="field field-compact">
              <span>Titulo</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Bloco de atenção da turma" />
            </label>
            <label className="field field-compact">
              <span>Email do aluno</span>
              <input value={targetEmail} onChange={(event) => setTargetEmail(event.target.value)} placeholder="aluno@email.com" />
            </label>
            <label className="field field-compact">
              <span>Trilha</span>
              <select className="text-input" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
                <option value="memoria">Memória</option>
                <option value="visual">Memória visual</option>
                <option value="atencao">Atenção</option>
                <option value="comparacao">Comparação</option>
                <option value="espacial">Orientação espacial</option>
                <option value="logica">Lógica</option>
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
            <span>Observações da sessão</span>
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
                objective: objective.trim() || "Sessão prescrita com objetivo orientado.",
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
            Prescrever sessão
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
                Marcar como concluída
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
        <h3>Comparativo por período</h3>
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
        <h3>Observações com histórico</h3>
        <span className="small-muted">{observations.length} registro(s) do perfil</span>
      </div>
      <div className="observation-timeline">
        {observations.length > 0 ? (
          observations.map((item) => (
            <article key={item.id} className="engagement-card">
              <p className="engagement-tag">{item.category === "clinica" ? "Clínica" : "Pedagógica"}</p>
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
          <p className="small-muted">Ainda não há observações clínicas ou pedagógicas para este perfil.</p>
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
  onOpenProcess,
  onOpenFocusVision,
  onOpenProfile,
  onOpenSpecial,
  onOpenAdvanced,
  onOpenAdvancedMemory,
  onOpenAdvancedAttention,
  onOpenAdvancedComparison,
  onOpenAdvancedSpatial,
  onOpenAdvancedLogic,
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
  const processoRate = getCompletionRate(progresso.processo);
  const visaoFocadaRate = getCompletionRate(progresso.visaoFocada);
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
        { label: "Sessões", value: String(resumo.totalSessions), caption: "Rodadas registradas no histórico" },
        { label: "Concluídas", value: String(resumo.completedSessions), caption: "Sessões com meta atingida" },
        { label: "Média", value: String(resumo.averageScore), caption: "Pontuação média por sessão" },
        {
          label: "Modo forte",
          value: getSessionModeLabel(resumo.strongestMode),
          caption: "Trilha com melhor desempenho acumulado",
        },
      ],
      abilities: abilityInsights.map((item) => ({
        title: item.title,
        score: item.score,
        level: item.level === "forte" ? "Forte" : item.level === "estavel" ? "Estável" : "Prioridade",
        summary: item.summary,
      })),
      trends: performanceTrends.map((item) => ({
        label: item.label,
        direction: item.direction === "subindo" ? "Em melhora" : item.direction === "caindo" ? "Em queda" : "Estável",
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
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>("hoje");
  const [activeQuickAction, setActiveQuickAction] = useState("hoje");
  const [activeQuickGroup, setActiveQuickGroup] = useState<QuickGroup | null>(null);
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
      | ProgressState["logica"]
      | ProgressState["processo"]
      | ProgressState["visaoFocada"];
  }> = [
    { id: "memoria", label: "Memória", title: "Trilha de memória", rate: memoriaRate, progressMap: progresso.memoria },
    { id: "visual", label: "Memória visual", title: "Trilha de memória visual", rate: visualRate, progressMap: progresso.visual },
    { id: "atencao", label: "Atenção", title: "Trilha de atenção", rate: atencaoRate, progressMap: progresso.atencao },
    { id: "processo", label: "Procrastinação", title: "Trilha Procrastinação", rate: processoRate, progressMap: progresso.processo },
    { id: "visaoFocada", label: "Foco", title: "Trilha de visão focada", rate: visaoFocadaRate, progressMap: progresso.visaoFocada },
    {
      id: "comparacao",
      label: "Comparação",
      title: "Trilha de comparação",
      rate: comparacaoRate,
      progressMap: progresso.comparacao,
    },
    {
      id: "espacial",
      label: "Orientação espacial",
      title: "Trilha de orientação espacial",
      rate: espacialRate,
      progressMap: progresso.espacial,
    },
    { id: "logica", label: "Lógica", title: "Trilha de lógica", rate: getCompletionRate(progresso.logica), progressMap: progresso.logica },
  ];
  const activeTrail = trailTabs.find((trail) => trail.id === activeTrailTab) ?? trailTabs[0];
  const openMode = (mode: TrailMode) => {
    if (mode === "memoria") return onOpenMemory();
    if (mode === "visual") return onOpenVisual();
    if (mode === "atencao") return onOpenAttention();
    if (mode === "comparacao") return onOpenComparison();
    if (mode === "espacial") return onOpenSpatial();
    if (mode === "processo") return onOpenProcess();
    if (mode === "visaoFocada") return onOpenFocusVision();
    return onOpenLogic();
  };
  const sidebarDashboardTabs: Array<{ id: Exclude<DashboardTab, "hoje">; label: string; caption: string }> = [
    { id: "progresso", label: "Progresso", caption: "Evolução e trilhas" },
    { id: "rotina", label: "Rotina", caption: "Planos, sugestões e agenda" },
    {
      id: "insights",
      label: "Insights",
      caption: usuario.role === "admin" ? "Análises e operação" : "Ajustes e leitura",
    },
  ];
  const baseTrainingActions = [
    { label: "Jogo de memória", onOpen: onOpenMemory },
    { label: "Jogo de atenção", onOpen: onOpenAttention },
    { label: "Jogo de comparação", onOpen: onOpenComparison },
    { label: "Memória visual", onOpen: onOpenVisual },
    { label: "Orientação espacial", onOpen: onOpenSpatial },
    { label: "Jogo de lógica", onOpen: onOpenLogic },
  ];
  const exploreActions = [
    { label: "Procrastinação", onOpen: onOpenProcess },
    { label: "Foco", onOpen: onOpenFocusVision },
  ];
  const specialActions = specialChallenges.map((challenge) => ({
    label: challenge.nome,
    onOpen: () => onOpenSpecial(challenge.id),
  }));
  const advancedActions = [
    { label: "Memória", onOpen: onOpenAdvancedMemory },
    { label: "Atenção", onOpen: onOpenAdvancedAttention },
    { label: "Comparação", onOpen: onOpenAdvancedComparison },
    { label: "Orientação espacial", onOpen: onOpenAdvancedSpatial },
    { label: "Lógica", onOpen: onOpenAdvancedLogic },
  ];
  function runQuickAction(id: string, action: () => void) {
    setActiveQuickAction(id);
    action();
  }
  function toggleQuickGroup(group: QuickGroup) {
    setActiveQuickGroup((current) => (current === group ? null : group));
    setActiveQuickAction(group);
  }

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
        <button
          className={`btn btn-side ${activeDashboardTab === "hoje" ? "btn-side-active" : ""}`}
          onClick={() => setActiveDashboardTab("hoje")}
        >
          Dashboard
        </button>
        <SidebarMenuGroup title="Painel" defaultOpen>
          {sidebarDashboardTabs.map((tab) => (
            <button
              key={tab.id}
              className={`btn btn-side ${activeDashboardTab === tab.id ? "btn-side-active" : ""}`}
              onClick={() => setActiveDashboardTab(tab.id)}
              title={tab.caption}
            >
              {tab.label}
            </button>
          ))}
        </SidebarMenuGroup>
        <SidebarMenuGroup title="Treino Base" defaultOpen>
          {baseTrainingActions.map((action) => (
            <button key={action.label} className="btn btn-side" onClick={action.onOpen}>
              {action.label}
            </button>
          ))}
        </SidebarMenuGroup>
        <SidebarMenuGroup title="Explorar mais">
          {exploreActions.map((action) => (
            <button key={action.label} className="btn btn-side" onClick={action.onOpen}>
              {action.label}
            </button>
          ))}
        </SidebarMenuGroup>
        <button className="btn btn-side" onClick={() => onOpenSpecial()}>
          Trilha exclusiva
        </button>
        <button className="btn btn-side" onClick={onOpenAdvanced}>
          Testes Avançados
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
            <p className="eyebrow">Painel do usuário</p>
            <div className="dashboard-title-row">
              <h1 className="dashboard-title">{`Olá, ${usuario.nome}`}</h1>
              <span className="dashboard-age-chip">{getAgeLabel(usuario.idade)}</span>
            </div>
            <p className="muted">
              Seu progresso fica salvo por desafio. Os pontos só aumentam quando você supera seu melhor resultado em
              cada fase.
            </p>
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
          </div>
        </header>

        <section className="dashboard-primary-cards" aria-label="Acessos em destaque">
          <button
            type="button"
            className={`dashboard-tab dashboard-tab-hoje ${activeDashboardTab === "hoje" ? "dashboard-tab-active" : ""} ${
              activeQuickAction === "hoje" ? "dashboard-card-marked" : ""
            }`}
            onClick={() => {
              setActiveQuickAction("hoje");
              setActiveDashboardTab("hoje");
            }}
          >
            <span className="trail-tab-label">Hoje</span>
            <span className="trail-tab-rate">Próximo passo e rotina imediata</span>
          </button>
          <button
            className={`dashboard-action-card dashboard-action-process ${activeQuickAction === "processo" ? "dashboard-card-marked" : ""}`}
            type="button"
            onClick={() => runQuickAction("processo", onOpenProcess)}
          >
            <span className="trail-tab-label">Procrastinação</span>
            <span className="trail-tab-rate">Começo, meio e fim</span>
          </button>
          <button
            className={`dashboard-action-card dashboard-action-focus ${activeQuickAction === "foco" ? "dashboard-card-marked" : ""}`}
            type="button"
            onClick={() => runQuickAction("foco", onOpenFocusVision)}
          >
            <span className="trail-tab-label">Foco</span>
            <span className="trail-tab-rate">Foco central e periférico</span>
          </button>
        </section>

        <section className="dashboard-feature-row" aria-label="Pausa e experiência personalizada">
          <PauseReflectionButton
            className="dashboard-reflection-slot"
            variant="alarm"
            prompts={processReflectionPrompts}
            title="Pausa para reflexão (40 segundos para sair do automático)"
            doneMessage="Guarde a percepção que apareceu e siga com calma."
          />
          <section className={`topbar-personal panel audience-hero audience-${currentAudience}`}>
            <div>
              <p className="eyebrow">Experiência personalizada</p>
              <h3>{getAudienceLabel(currentAudience)}</h3>
              <p className="muted">
                {currentAudience === "infantil"
                  ? "Painel com linguagem mais lúdica, jogos concretos e reforço positivo para crianças."
                  : currentAudience === "adolescente"
                    ? "Painel com ritmo mais rápido, metas intermediárias e desafios de foco e codificação."
                    : "Painel com maior densidade, rotina objetiva e desafios com mais carga cognitiva."}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => onOpenSpecial()}>
              Abrir minijogo
            </button>
          </section>
        </section>

        <section className="panel dashboard-tabs-panel">
          <div className="section-head">
            <h3>Navegação rápida</h3>
            <span className="small-muted">Abra só o grupo de informações que você quer ver agora</span>
          </div>
          <div className="dashboard-quick-grid" role="navigation" aria-label="Navegação rápida">
            <article
              className={`dashboard-option-card dashboard-option-base ${
                activeQuickGroup === "base" || activeQuickAction.startsWith("base-") ? "dashboard-option-card-marked" : ""
              }`}
            >
              <button
                className="dashboard-option-toggle"
                type="button"
                aria-expanded={activeQuickGroup === "base"}
                aria-controls="quick-base-options"
                onClick={() => toggleQuickGroup("base")}
              >
                <span>
                  <strong>Treino Base</strong>
                  <small>Mesmas opções da guia lateral</small>
                </span>
                <span className="dashboard-option-chevron" aria-hidden="true">
                  {activeQuickGroup === "base" ? "−" : "+"}
                </span>
              </button>
              {activeQuickGroup === "base" ? (
                <div className="dashboard-option-list" id="quick-base-options">
                  {baseTrainingActions.map((action) => (
                    <button
                      key={action.label}
                      className={`btn btn-secondary dashboard-option-button ${activeQuickAction === `base-${action.label}` ? "dashboard-option-button-marked" : ""}`}
                      type="button"
                      onClick={() => runQuickAction(`base-${action.label}`, action.onOpen)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
            <article
              className={`dashboard-option-card dashboard-option-special ${
                activeQuickGroup === "especial" || activeQuickAction.startsWith("especial-") ? "dashboard-option-card-marked" : ""
              }`}
            >
              <button
                className="dashboard-option-toggle"
                type="button"
                aria-expanded={activeQuickGroup === "especial"}
                aria-controls="quick-special-options"
                onClick={() => toggleQuickGroup("especial")}
              >
                <span>
                  <strong>Trilha Exclusiva</strong>
                  <small>Sequência personalizada por público</small>
                </span>
                <span className="dashboard-option-chevron" aria-hidden="true">
                  {activeQuickGroup === "especial" ? "−" : "+"}
                </span>
              </button>
              {activeQuickGroup === "especial" ? (
                <div className="dashboard-option-list" id="quick-special-options">
                  {specialActions.map((action) => (
                    <button
                      key={action.label}
                      className={`btn btn-secondary dashboard-option-button ${activeQuickAction === `especial-${action.label}` ? "dashboard-option-button-marked" : ""}`}
                      type="button"
                      onClick={() => runQuickAction(`especial-${action.label}`, action.onOpen)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
            <article
              className={`dashboard-option-card dashboard-option-advanced ${
                activeQuickGroup === "avancado" || activeQuickAction.startsWith("avancado-") ? "dashboard-option-card-marked" : ""
              }`}
            >
              <button
                className="dashboard-option-toggle"
                type="button"
                aria-expanded={activeQuickGroup === "avancado"}
                aria-controls="quick-advanced-options"
                onClick={() => toggleQuickGroup("avancado")}
              >
                <span>
                  <strong>Testes Avançados</strong>
                  <small>Desafios com maior carga cognitiva</small>
                </span>
                <span className="dashboard-option-chevron" aria-hidden="true">
                  {activeQuickGroup === "avancado" ? "−" : "+"}
                </span>
              </button>
              {activeQuickGroup === "avancado" ? (
                <div className="dashboard-option-list" id="quick-advanced-options">
                  {advancedActions.map((action) => (
                    <button
                      key={action.label}
                      className={`btn btn-secondary dashboard-option-button ${activeQuickAction === `avancado-${action.label}` ? "dashboard-option-button-marked" : ""}`}
                      type="button"
                      onClick={() => runQuickAction(`avancado-${action.label}`, action.onOpen)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
            <article
              className={`dashboard-option-card dashboard-option-explore ${
                activeQuickGroup === "explorar" || activeQuickAction.startsWith("explorar-") ? "dashboard-option-card-marked" : ""
              }`}
            >
              <button
                className="dashboard-option-toggle"
                type="button"
                aria-expanded={activeQuickGroup === "explorar"}
                aria-controls="quick-explore-options"
                onClick={() => toggleQuickGroup("explorar")}
              >
                <span>
                  <strong>Explorar mais</strong>
                  <small>Mesmas opções da guia lateral</small>
                </span>
                <span className="dashboard-option-chevron" aria-hidden="true">
                  {activeQuickGroup === "explorar" ? "−" : "+"}
                </span>
              </button>
              {activeQuickGroup === "explorar" ? (
                <div className="dashboard-option-list" id="quick-explore-options">
                  {exploreActions.map((action) => (
                    <button
                      key={action.label}
                      className={`btn btn-secondary dashboard-option-button ${activeQuickAction === `explorar-${action.label}` ? "dashboard-option-button-marked" : ""}`}
                      type="button"
                      onClick={() => runQuickAction(`explorar-${action.label}`, action.onOpen)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          </div>
        </section>

        {activeDashboardTab === "progresso" ? (
          <section className="panel metrics-panel">
          <div className="section-head">
            <h3>{`Resumo do treino: Status ${usuario.premium ? "Premium" : "Básico"}`}</h3>
            <span className="small-muted">Indicadores principais do desempenho atual</span>
          </div>
          <div className="metrics-strip">
            <CompactMetricCard
              label="Pontos"
              value={String(usuario.pontos)}
              caption="Pontuação acumulada por melhora real"
            />
            <CompactMetricCard
              label="Objetivo"
              value={getGoalLabel(usuario.goal)}
              caption="Foco principal definido no onboarding"
            />
            <CompactMetricCard
              label="Nível inicial"
              value={getLevelLabel(usuario.selfReportedLevel)}
              caption="Percepção de entrada usada para guiar o ritmo"
            />
            <CompactMetricCard
              label="Rotina"
              value={`${usuario.weeklyAvailability ?? 3} dia(s)`}
              caption="Disponibilidade semanal informada no perfil"
            />
            <CompactMetricCard label="Nível" value={getNivel(usuario.pontos)} caption="Escala progressiva do aplicativo" />
            <CompactMetricCard
              label="Memória / Visual"
              value={`${memoriaRate}% / ${visualRate}%`}
              caption="Progresso nas trilhas verbal e visual"
            />
            <CompactMetricCard
              label="Atenção"
              value={`${atencaoRate}%`}
              caption="Percentual de desafios concluídos em foco seletivo"
            />
            <CompactMetricCard
              label="Comparação"
              value={`${comparacaoRate}%`}
              caption="Comparações de quantidade, valor, ordem e tamanho"
            />
            <CompactMetricCard
              label="Orientação"
              value={`${espacialRate}%`}
              caption="Progresso nos desafios de rota, direção e referência espacial"
            />
            <CompactMetricCard
              label="Lógica"
              value={`${getCompletionRate(progresso.logica)}%`}
              caption="Sequencias, padrões e previsão do próximo termo"
            />
            <CompactMetricCard
              label="Trilha exclusiva"
              value={`${especialRate}%`}
              caption="Progresso no minijogo do seu publico"
            />
          </div>
          </section>
        ) : null}

        {activeDashboardTab === "insights" ? (
        <AppPreferencesPanel
          settings={settings}
          isOffline={isOffline}
          offlineSyncStatus={offlineSyncStatus}
          onUpdateSettings={onUpdateSettings}
        />
        ) : null}

        {activeDashboardTab === "insights" ? (
          usuario.role === "admin" ? (
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
          ) : null
        ) : null}

        {activeDashboardTab === "insights" ? (
          <>
            {rolePanel ? <RolePanelCard title={rolePanel.title} summary={rolePanel.summary} cards={rolePanel.cards} /> : null}

            {(usuario.role === "professor" || usuario.role === "responsavel") && usuario.turma ? (
              <section className="panel">
                <div className="section-head">
                  <h3>Ranking privado da turma</h3>
                  <span className="small-muted">Leitura interna por grupo, sem exposicao publica</span>
                </div>
                <div className="engagement-grid">
                  <RankingCard title="Ranking por desempenho" entries={privateRanking} />
                  <RankingCard title="Ranking por evolução" entries={evolutionRanking} />
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {activeDashboardTab === "progresso" ? (
          <>
        {usuario.role === "admin" ? (
          <>
            <section className="panel">
              <div className="section-head">
                <h3>Metas automaticas por aluno</h3>
                <span className="small-muted">Geradas com base em histórico, erro recorrente e ritmo recente</span>
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
                <h3>Relatório de desempenho</h3>
                <div className="section-head-actions">
                  <span className="small-muted">Resumo automático das suas sessões</span>
                  <button className="btn btn-secondary btn-export-report" onClick={handleExportPdf}>
                    Exportar PDF
                  </button>
                </div>
              </div>
              <div className="stats-grid">
                <StatCard label="Sessões" value={String(resumo.totalSessions)} caption="Rodadas registradas no histórico" />
                <StatCard label="Concluídas" value={String(resumo.completedSessions)} caption="Sessões com meta atingida" />
                <StatCard label="Média" value={String(resumo.averageScore)} caption="Pontuação média por sessão" />
                <StatCard label="Modo forte" value={getSessionModeLabel(resumo.strongestMode)} caption="Trilha com melhor desempenho acumulado" />
              </div>
            </section>

            <ComparativeCard items={comparativeInsights} onExport={handleExportComparativePdf} />
          </>
        ) : null}

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
            <h3>Relatórios por habilidade</h3>
            <span className="ability-section-subtitle">Leitura separada de memória, atenção, velocidade e raciocínio</span>
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

        {usuario.role === "admin" ? (
          <section className="panel">
            <div className="section-head">
              <h3>Histórico semanal e mensal</h3>
              <span className="small-muted">Tendência de melhora ou queda no ritmo recente</span>
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
        ) : null}

        <section className="panel">
          <div className="section-head">
            <h3>Conquistas visuais</h3>
            <span className="small-muted">Reconhecimentos por consistência, precisão e evolução, não só por pontuação</span>
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
          </>
        ) : null}

        {activeDashboardTab === "insights" ? <ObservationTimeline observations={relevantObservations} /> : null}

        {activeDashboardTab === "insights" && usuario.role === "admin" ? (
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

        {activeDashboardTab === "insights" ? (
        <DisclosureSection
          title="Trilhas por publico"
          caption="O app ajusta conteúdo e dificuldade automaticamente pela idade"
        >
          <div className="track-grid">
            <TrackCard
              title="Trilha Infantil"
              audience="infantil"
              currentAudience={currentAudience}
              description="Vocábulos mais concretos, instruções mais lúdicas e menor carga visual para crianças."
            />
            <TrackCard
              title="Trilha Adolescente"
              audience="adolescente"
              currentAudience={currentAudience}
              description="Mais velocidade, mais itens por rodada e desafios com exigencia intermediária."
            />
            <TrackCard
              title="Trilha Adulta"
              audience="adulto"
              currentAudience={currentAudience}
              description="Mais densidade de informação, menos tempo e metas mais exigentes por fase."
            />
          </div>
        </DisclosureSection>
        ) : null}

        {activeDashboardTab === "rotina" ? (
          <>
        <section className="panel quick-grid">
          <article className="quick-card quick-card-highlight">
            <p className="small-muted">Recomendação inteligente</p>
            <h3>{smartRecommendation.title}</h3>
            <p className="muted">{smartRecommendation.reason}</p>
            <p className="small-muted">{`${smartRecommendation.objective} Próxima fase: ${smartRecommendation.challengeName}.`}</p>
            <button className="btn btn-primary" onClick={() => openMode(smartRecommendation.mode)}>
              Abrir atividade sugerida
            </button>
          </article>
          <article className="quick-card quick-card-process">
            <p className="small-muted">Procrastinação</p>
            <h3>Começo, meio e fim</h3>
            <p className="muted">
              Treino curto com sequência obrigatória: escolha uma entrada, sustente o meio e feche a jogada antes de sair.
            </p>
            <button className="btn btn-primary" onClick={onOpenProcess}>
              Abrir Procrastinação
            </button>
          </article>
          <article className="quick-card quick-card-focus-vision">
            <p className="small-muted">Foco</p>
            <h3>Ache o alvo sem perder o centro</h3>
            <p className="muted">
              Treino de foco central e visão periférica com 30 jogos em progressão híbrida inteligente.
            </p>
            <button className="btn btn-primary" onClick={onOpenFocusVision}>
              Abrir Foco
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendação de memória</p>
            <h3>{memoriaRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para trabalhar evocação de palavras e consolidar rotina curta de treino.</p>
            <button className="btn btn-secondary" onClick={onOpenMemory}>
              Abrir memória
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendação visual</p>
            <h3>{visualRecomendada?.nomeInfantil ?? visualRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para pareamento de figuras, memória de posição e treino com animais e flores.</p>
            <button className="btn btn-secondary" onClick={onOpenVisual}>
              Abrir memória visual
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendação de atenção</p>
            <h3>{atencaoRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para foco seletivo, velocidade visual e redução de erros por impulso.</p>
            <button className="btn btn-secondary" onClick={onOpenAttention}>
              Abrir atenção
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendação de comparação</p>
            <h3>{comparacaoRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para critério, ordem, tamanho, quantidade e decisão rápida entre opções.</p>
            <button className="btn btn-secondary" onClick={onOpenComparison}>
              Abrir comparação
            </button>
          </article>
          <article className="quick-card">
            <p className="small-muted">Recomendação de lógica</p>
            <h3>{logicaRecomendada?.nome ?? "Primeira fase"}</h3>
            <p className="muted">Boa para perceber padrões, completar sequências e prever o próximo elemento.</p>
            <button className="btn btn-secondary" onClick={onOpenLogic}>
              Abrir lógica
            </button>
          </article>
        </section>

        <section className="panel split-panel">
          <div>
            <div className="section-head">
              <h3>Evolução geral</h3>
              <span className="small-muted">Meta sugerida: 75 pontos</span>
            </div>
            <div className="progress-rail">
              <div className="progress-fill" style={{ width: `${Math.min((usuario.pontos / 75) * 100, 100)}%` }} />
            </div>
            <p className="muted">
              Continue tentando melhorar seus melhores resultados. Assim a progressão fica mais justa, mais clara e
              menos repetitiva.
            </p>
          </div>

          <div>
            <div className="section-head">
              <h3>Rotina sugerida</h3>
            </div>
            <ul className="clean-list">
              <li>{`Prioridade principal: ${smartRecommendation.challengeName} em ${getSessionModeLabel(smartRecommendation.mode)}`}</li>
              <li>{`Memória: priorize "${memoriaRecomendada?.nome ?? "primeiro desafio"}" na próxima sessão`}</li>
              <li>{`Atenção: priorize "${atencaoRecomendada?.nome ?? "primeiro desafio"}" para variar o treino`}</li>
              <li>{`Comparação: priorize "${comparacaoRecomendada?.nome ?? "primeiro desafio"}" para ampliar o raciocínio comparativo`}</li>
              <li>As fases liberam em ordem, entao concluir bem a atual ajuda a manter a trilha pedagógica</li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Sessões guiadas por objetivo</h3>
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

        <DisclosureSection
          title="Biblioteca de intervencoes"
          caption="Ações práticas sugeridas conforme habilidade, idade e desempenho"
        >
          <div className="engagement-grid">
            {interventionLibrary.map((item) => (
              <InterventionCard key={item.title} title={item.title} summary={item.summary} actions={item.actions} />
            ))}
          </div>
        </DisclosureSection>

        <DisclosureSection
          title="Trilhas tematicas"
          caption="Atalhos prontos para foco escolar, agilidade mental, reabilitação e desafio elite"
        >
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
        </DisclosureSection>

        <DisclosureSection
          title="Modo duelo ou cooperativo"
          caption="Mesmo ciclo para aluno e professor ou responsável acompanharem juntos"
        >
          <CooperativeCard
            title={cooperativeCycle.title}
            summary={cooperativeCycle.summary}
            partnerLabel={cooperativeCycle.partnerLabel}
            cadence={cooperativeCycle.cadence}
            challengeName={cooperativeCycle.challengeName}
            actions={cooperativeCycle.actions}
            onOpen={() => openMode(cooperativeCycle.primaryMode)}
          />
        </DisclosureSection>
          </>
        ) : null}

        {activeDashboardTab === "insights" ? (
        <DisclosureSection
          title="Checklist de acessibilidade avançada"
          caption="Contraste, foco, voz, teclado e ambiente formal controlado"
        >
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
        </DisclosureSection>
        ) : null}

        {activeDashboardTab === "progresso" ? (
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
                <span className="trail-tab-rate">{trail.rate}% concluídos</span>
              </button>
            ))}
          </div>

          <div className="trail-panel-shell">
            <ProgressList title={activeTrail.title} mode={activeTrail.id} progressMap={activeTrail.progressMap} />
          </div>
        </section>
        ) : null}
      </section>
    </main>
  );
}
