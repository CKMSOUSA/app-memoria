"use client";

import { useState } from "react";

import { AppPreferencesPanel } from "@/components/AppPreferencesPanel";
import { InternalAssistant } from "@/components/InternalAssistant";
import { getRemoteBackendStatus } from "@/lib/app-repository";
import type { AppSettings } from "@/lib/app-settings";
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
  getGuidedSessions,
  getPerformanceTrends,
  getSmartRecommendation,
} from "@/lib/training-insights";
import type { ProgressState, SessionRecord, Usuario } from "@/lib/types";

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
  settings: AppSettings;
  isOffline: boolean;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
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
        <p className="small-muted">{title}</p>
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
  settings,
  isOffline,
  onUpdateSettings,
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

        <AppPreferencesPanel settings={settings} isOffline={isOffline} onUpdateSettings={onUpdateSettings} />

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

        <section className="panel report-panel">
          <div className="section-head">
            <h3>Relatorio de desempenho</h3>
            <span className="small-muted">Resumo automatico das suas sessoes</span>
          </div>
          <div className="stats-grid">
            <StatCard label="Sessoes" value={String(resumo.totalSessions)} caption="Rodadas registradas no historico" />
            <StatCard label="Concluidas" value={String(resumo.completedSessions)} caption="Sessoes com meta atingida" />
            <StatCard label="Media" value={String(resumo.averageScore)} caption="Pontuacao media por sessao" />
            <StatCard label="Modo forte" value={getSessionModeLabel(resumo.strongestMode)} caption="Trilha com melhor desempenho acumulado" />
          </div>
        </section>

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
            <span className="small-muted">Leitura separada de memoria, atencao, velocidade e raciocinio</span>
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
