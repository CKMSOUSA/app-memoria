"use client";

import { getDataModeDescription, getDataModeLabel, getRemoteBackendStatus } from "@/lib/app-repository";
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
import type { DataMode, ProgressState, SessionRecord, Usuario } from "@/lib/types";

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
  onOpenAdmin: () => void;
  onOpenHelp: () => void;
  onLogout: () => void;
  dataMode: DataMode;
  history: SessionRecord[];
};

function ProgressList({
  title,
  mode,
  progressMap,
}: {
  title: string;
  mode: "memoria" | "visual" | "atencao" | "comparacao" | "espacial" | "logica";
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
      <p className="small-muted">{label}</p>
      <h3>{value}</h3>
      <p className="muted">{caption}</p>
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
  onOpenAdmin,
  onOpenHelp,
  onLogout,
  dataMode,
  history,
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
  const canOpenAdmin = usuario.role === "admin";

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
        {canOpenAdmin ? (
          <button className="btn btn-side" onClick={onOpenAdmin}>
            Area administrativa
          </button>
        ) : null}
        <button className="btn btn-side" onClick={onOpenProfile}>
          Perfil
        </button>
        <button className="btn btn-side" onClick={onOpenHelp}>
          Ajuda
        </button>
        <button className="btn btn-side" onClick={onLogout}>
          Sair
        </button>
      </aside>

      <section className="content">
        <header className="topbar panel">
          <div>
            <p className="eyebrow">Painel do usuario</p>
            <h1>{`Ola, ${usuario.nome}`}</h1>
            <p className="muted">
              Seu progresso fica salvo por desafio. Os pontos so aumentam quando voce supera seu melhor resultado em
              cada fase.
            </p>
          </div>
          <div className="topbar-right">
            <div className="topbar-support-actions">
              <button className="btn btn-topbar-profile" onClick={onOpenProfile}>
                Editar perfil
              </button>
              <button className="btn btn-topbar-help" onClick={onOpenHelp}>
                Abrir ajuda
              </button>
            </div>
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
            </div>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard label="Pontos totais" value={String(usuario.pontos)} caption="Pontuacao acumulada por melhora real" />
          <StatCard label="Nivel atual" value={getNivel(usuario.pontos)} caption="Escala progressiva do aplicativo" />
          <StatCard label="Idade" value={getAgeLabel(usuario.idade)} caption={getAudienceLabel(currentAudience)} />
          <StatCard label="Dados" value={getDataModeLabel(dataMode)} caption={getDataModeDescription(dataMode)} />
          <StatCard
            label="Perfil de acesso"
            value={usuario.role === "admin" ? "Administrador" : "Aluno"}
            caption={usuario.role === "admin" ? "Pode acompanhar usuarios e pedidos de ajuda" : "Acesso focado no treino do aluno"}
          />
          <StatCard
            label="Status"
            value={usuario.premium ? "Premium" : "Basico"}
            caption="Conteudos extras podem ser destravados no futuro"
          />
          <StatCard
            label="Memoria + Visual"
            value={`${memoriaRate}% / ${visualRate}%`}
            caption="Progresso nas trilhas verbal e visual"
          />
          <StatCard
            label="Atencao"
            value={`${atencaoRate}%`}
            caption="Percentual de desafios concluidos em foco seletivo"
          />
          <StatCard
            label="Comparacao"
            value={`${comparacaoRate}%`}
            caption="Comparacoes de quantidade, valor, ordem e tamanho"
          />
          <StatCard
            label="Orientacao espacial"
            value={`${espacialRate}%`}
            caption="Progresso nos desafios de rota, direcao e referencia espacial"
          />
          <StatCard label="Logica" value={`${getCompletionRate(progresso.logica)}%`} caption="Sequencias, padroes e previsao do proximo termo" />
          <StatCard label="Trilha exclusiva" value={`${especialRate}%`} caption="Progresso no minijogo do seu publico" />
        </section>

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
          <div className="button-row">
            {canOpenAdmin ? (
              <button className="btn btn-secondary" onClick={onOpenAdmin}>
                Abrir area administrativa
              </button>
            ) : null}
            <button className="btn btn-secondary" onClick={onOpenLogic}>
              Treinar logica
            </button>
          </div>
        </section>

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

        <section className={`panel audience-hero audience-${currentAudience}`}>
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
          <div className="button-row">
            <button className="btn btn-primary" onClick={onOpenSpecial}>
              Abrir minijogo exclusivo
            </button>
          </div>
        </section>

        <section className="panel quick-grid">
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
              <li>{`Memoria: priorize "${memoriaRecomendada?.nome ?? "primeiro desafio"}" na proxima sessao`}</li>
              <li>{`Atencao: priorize "${atencaoRecomendada?.nome ?? "primeiro desafio"}" para variar o treino`}</li>
              <li>{`Comparacao: priorize "${comparacaoRecomendada?.nome ?? "primeiro desafio"}" para ampliar o raciocinio comparativo`}</li>
              <li>Inclua uma rodada de orientacao espacial para treinar esquerda, direita e rotas em sequencia</li>
              <li>As fases liberam em ordem, entao concluir bem a atual ajuda a manter a trilha pedagogica</li>
            </ul>
          </div>
        </section>

        <div className="dual-panels">
          <ProgressList title="Trilha de memoria" mode="memoria" progressMap={progresso.memoria} />
          <ProgressList title="Trilha de memoria visual" mode="visual" progressMap={progresso.visual} />
          <ProgressList title="Trilha de atencao" mode="atencao" progressMap={progresso.atencao} />
          <ProgressList title="Trilha de comparacao" mode="comparacao" progressMap={progresso.comparacao} />
          <ProgressList title="Trilha de orientacao espacial" mode="espacial" progressMap={progresso.espacial} />
          <ProgressList title="Trilha de logica" mode="logica" progressMap={progresso.logica} />
        </div>
      </section>
    </main>
  );
}
