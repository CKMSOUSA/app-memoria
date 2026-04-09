"use client";

import { getCompletionRate, getReportSummary, getSessionModeLabel } from "@/lib/scoring";
import type { ProgressState, SessionRecord, Usuario } from "@/lib/types";

type AdminScreenProps = {
  usuario: Usuario;
  progressoAtual: ProgressState;
  histories: Array<{ user: Usuario; history: SessionRecord[]; progress?: ProgressState }>;
  onBack: () => void;
};

export function AdminScreen({ usuario, progressoAtual, histories, onBack }: AdminScreenProps) {
  const normalizedHistories = histories.length > 0 ? histories : [{ user: usuario, history: [], progress: progressoAtual }];

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Area administrativa</p>
            <h1>Acompanhe usuarios, progresso e sessoes</h1>
            <p className="muted">
              Painel de acompanhamento com resumo por aluno, ultima atividade e modo de treino mais forte.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar ao painel
          </button>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <p className="small-muted">Usuarios monitorados</p>
            <h3>{normalizedHistories.length}</h3>
            <p className="muted">Leitura local das contas cadastradas no app.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Sessoes registradas</p>
            <h3>{normalizedHistories.reduce((sum, item) => sum + item.history.length, 0)}</h3>
            <p className="muted">Cada rodada concluida gera um registro para relatorios.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Conclusoes totais</p>
            <h3>{normalizedHistories.reduce((sum, item) => sum + item.history.filter((entry) => entry.completed).length, 0)}</h3>
            <p className="muted">Ajuda a acompanhar aderencia e evolucao geral.</p>
          </article>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Resumo por aluno</h3>
            <span className="small-muted">Visao administrativa de progresso e historico</span>
          </div>
          <div className="admin-grid">
            {normalizedHistories.map(({ user, history, progress }) => {
              const summary = getReportSummary(history);
              const effectiveProgress = progress ?? progressoAtual;
              return (
                <article key={user.email} className="admin-card">
                  <div className="admin-card-head">
                    <div className="sidebar-avatar">{user.avatar}</div>
                    <div>
                      <h3>{user.nome}</h3>
                      <p className="small-muted">{user.email}</p>
                    </div>
                  </div>

                  <div className="admin-chip-grid">
                    <div className="phase-chip">
                      <strong>Pontos</strong>
                      <span>{user.pontos}</span>
                    </div>
                    <div className="phase-chip">
                      <strong>Sessoes</strong>
                      <span>{summary.totalSessions}</span>
                    </div>
                    <div className="phase-chip">
                      <strong>Media</strong>
                      <span>{summary.averageScore}</span>
                    </div>
                    <div className="phase-chip">
                      <strong>Modo forte</strong>
                      <span>{getSessionModeLabel(summary.strongestMode)}</span>
                    </div>
                  </div>

                  <div className="admin-progress-grid">
                    <span>{`Memoria ${getCompletionRate(effectiveProgress.memoria)}%`}</span>
                    <span>{`Atencao ${getCompletionRate(effectiveProgress.atencao)}%`}</span>
                    <span>{`Comparacao ${getCompletionRate(effectiveProgress.comparacao)}%`}</span>
                    <span>{`Espacial ${getCompletionRate(effectiveProgress.espacial)}%`}</span>
                    <span>{`Logica ${getCompletionRate(effectiveProgress.logica)}%`}</span>
                    <span>{`Exclusiva ${getCompletionRate(effectiveProgress.especial)}%`}</span>
                  </div>

                  <div className="admin-history">
                    <strong>Ultimas sessoes</strong>
                    {history.length > 0 ? (
                      history.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="admin-history-item">
                          <span>{getSessionModeLabel(entry.mode)}</span>
                          <span>{`Fase ${entry.challengeId}`}</span>
                          <span>{`Score ${entry.score}`}</span>
                        </div>
                      ))
                    ) : (
                      <p className="small-muted">Ainda nao ha sessoes registradas para este usuario.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
