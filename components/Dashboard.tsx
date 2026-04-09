"use client";

import {
  attentionChallenges,
  comparisonChallenges,
  exclusiveChallenges,
  memoryChallenges,
  spatialChallenges,
} from "@/lib/game-data-v3";
import {
  getAudienceFromAge,
  getAudienceLabel,
  getAgeLabel,
  getCompletionRate,
  getCompletionRateForIds,
  getNivel,
  getRecommendedChallengeId,
  isChallengeUnlocked,
} from "@/lib/scoring";
import type { ProgressState, Usuario } from "@/lib/types";

type DashboardProps = {
  usuario: Usuario;
  progresso: ProgressState;
  onOpenMemory: () => void;
  onOpenAttention: () => void;
  onOpenComparison: () => void;
  onOpenSpatial: () => void;
  onOpenProfile: () => void;
  onOpenSpecial: () => void;
  onLogout: () => void;
};

function ProgressList({
  title,
  mode,
  progressMap,
}: {
  title: string;
  mode: "memoria" | "atencao" | "comparacao" | "espacial";
  progressMap:
    | ProgressState["memoria"]
    | ProgressState["atencao"]
    | ProgressState["comparacao"]
    | ProgressState["espacial"];
}) {
  const challenges =
    mode === "memoria"
      ? memoryChallenges
      : mode === "atencao"
        ? attentionChallenges
        : mode === "comparacao"
          ? comparisonChallenges
          : spatialChallenges;

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
  onOpenAttention,
  onOpenComparison,
  onOpenSpatial,
  onOpenProfile,
  onOpenSpecial,
  onLogout,
}: DashboardProps) {
  const memoriaRate = getCompletionRate(progresso.memoria);
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
  const atencaoRecomendada = attentionChallenges.find(
    (item) =>
      item.id === getRecommendedChallengeId(progresso.atencao, attentionChallenges.map((challenge) => challenge.id)),
  );
  const comparacaoRecomendada = comparisonChallenges.find(
    (item) =>
      item.id ===
      getRecommendedChallengeId(progresso.comparacao, comparisonChallenges.map((challenge) => challenge.id)),
  );

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
        <button className="btn btn-side" onClick={onOpenAttention}>
          Jogo de atencao
        </button>
        <button className="btn btn-side" onClick={onOpenComparison}>
          Jogo de comparacao
        </button>
        <button className="btn btn-side" onClick={onOpenSpatial}>
          Orientacao espacial
        </button>
        <button className="btn btn-side" onClick={onOpenSpecial}>
          Trilha exclusiva
        </button>
        <button className="btn btn-side" onClick={onOpenProfile}>
          Perfil
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
              Seu progresso fica salvo por desafio. Novos pontos entram apenas quando voce supera seu melhor score.
            </p>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-secondary" onClick={onOpenProfile}>
              Editar perfil
            </button>
            <button className="btn btn-secondary" onClick={onOpenAttention}>
              Treinar atencao
            </button>
            <button className="btn btn-secondary" onClick={onOpenComparison}>
              Treinar comparacao
            </button>
            <button className="btn btn-secondary" onClick={onOpenSpatial}>
              Treinar orientacao
            </button>
            <button className="btn btn-primary" onClick={onOpenMemory}>
              Treinar memoria
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard label="Pontos totais" value={String(usuario.pontos)} caption="Pontuacao acumulada por melhora real" />
          <StatCard label="Nivel atual" value={getNivel(usuario.pontos)} caption="Escala progressiva do aplicativo" />
          <StatCard label="Idade" value={getAgeLabel(usuario.idade)} caption={getAudienceLabel(currentAudience)} />
          <StatCard
            label="Status"
            value={usuario.premium ? "Premium" : "Basico"}
            caption="Conteudos extras podem ser destravados no futuro"
          />
          <StatCard
            label="Memoria + Atencao"
            value={`${memoriaRate}% / ${atencaoRate}%`}
            caption="Percentual de desafios concluidos em cada trilha"
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
          <StatCard label="Trilha exclusiva" value={`${especialRate}%`} caption="Progresso no minijogo do seu publico" />
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Trilhas Por Publico</h3>
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
              Continue tentando melhorar seus melhores resultados. Isso reduz a repeticao vazia e deixa a progressao
              mais honesta.
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
              <li>O dashboard puxa primeiro desafios pendentes e evita sugerir o que foi jogado mais recentemente</li>
            </ul>
          </div>
        </section>

        <div className="dual-panels">
          <ProgressList title="Trilha de memoria" mode="memoria" progressMap={progresso.memoria} />
          <ProgressList title="Trilha de atencao" mode="atencao" progressMap={progresso.atencao} />
          <ProgressList title="Trilha de comparacao" mode="comparacao" progressMap={progresso.comparacao} />
          <ProgressList title="Trilha de orientacao espacial" mode="espacial" progressMap={progresso.espacial} />
        </div>
      </section>
    </main>
  );
}
