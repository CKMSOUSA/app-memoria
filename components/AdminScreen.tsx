"use client";

import { useMemo, useState } from "react";

import { getCompletionRate, getReportSummary, getSessionModeLabel } from "@/lib/scoring";
import type { HelpRequest, ProgressState, SessionRecord, Usuario } from "@/lib/types";

type AdminScreenProps = {
  usuario: Usuario;
  progressoAtual: ProgressState;
  histories: Array<{ user: Usuario; history: SessionRecord[]; progress?: ProgressState }>;
  helpRequests: HelpRequest[];
  onBack: () => void;
  onUpdateHelpStatus: (
    requestId: string,
    status: HelpRequest["status"],
    adminReply?: string,
  ) => Promise<void>;
};

export function AdminScreen({ usuario, progressoAtual, histories, helpRequests, onBack, onUpdateHelpStatus }: AdminScreenProps) {
  const normalizedHistories = useMemo(
    () => (histories.length > 0 ? histories : [{ user: usuario, history: [], progress: progressoAtual }]),
    [histories, progressoAtual, usuario],
  );
  const [search, setSearch] = useState("");
  const [helpStatusFilter, setHelpStatusFilter] = useState<"todas" | HelpRequest["status"]>("todas");
  const [updatingHelpId, setUpdatingHelpId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const filteredHistories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return normalizedHistories;

    return normalizedHistories.filter(({ user, history }) => {
      const matchesUser =
        user.nome.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesHistory = history.some(
        (entry) =>
          getSessionModeLabel(entry.mode).toLowerCase().includes(query) ||
          String(entry.challengeId).includes(query),
      );

      return matchesUser || matchesHistory;
    });
  }, [normalizedHistories, search]);

  const filteredHelpRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return helpRequests.filter((request) => {
      const matchesStatus = helpStatusFilter === "todas" || request.status === helpStatusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;

      return (
        request.name.toLowerCase().includes(query) ||
        request.email.toLowerCase().includes(query) ||
        request.subject.toLowerCase().includes(query) ||
        request.message.toLowerCase().includes(query)
      );
    });
  }, [helpRequests, helpStatusFilter, search]);

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Area administrativa</p>
            <h1>Acompanhe usuarios, progresso e sessoes</h1>
            <p className="muted">
              Painel de acompanhamento com resumo por aluno, ultima atividade, modo de treino mais forte e central de ajuda.
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
          <article className="stat-card">
            <p className="small-muted">Pedidos de ajuda</p>
            <h3>{helpRequests.length}</h3>
            <p className="muted">Duvidas registradas pelos usuarios dentro do app.</p>
          </article>
        </section>

        <section className="panel admin-toolbar">
          <div className="section-head">
            <h3>Busca e filtros</h3>
            <span className="small-muted">Refine usuarios, sessoes e duvidas</span>
          </div>

          <div className="admin-toolbar-grid">
            <label className="field">
              <span>Buscar por nome, email, trilha ou fase</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: Ana, user@email.com, memoria ou fase 3"
              />
            </label>

            <label className="field">
              <span>Status da ajuda</span>
              <select
                className="text-input"
                value={helpStatusFilter}
                onChange={(event) => setHelpStatusFilter(event.target.value as "todas" | HelpRequest["status"])}
              >
                <option value="todas">Todas</option>
                <option value="aberta">Abertas</option>
                <option value="respondida">Respondidas</option>
              </select>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Resumo por aluno</h3>
            <span className="small-muted">{filteredHistories.length} aluno(s) encontrado(s)</span>
          </div>
          <div className="admin-grid">
            {filteredHistories.map(({ user, history, progress }) => {
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
                    <span>{`Visual ${getCompletionRate(effectiveProgress.visual)}%`}</span>
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
          {filteredHistories.length === 0 ? <p className="small-muted">Nenhum aluno corresponde aos filtros atuais.</p> : null}
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Duvidas enviadas</h3>
            <span className="small-muted">{filteredHelpRequests.length} item(ns) encontrado(s)</span>
          </div>
          <div className="faq-list">
            {filteredHelpRequests.length > 0 ? (
              filteredHelpRequests.slice(0, 12).map((request) => (
                <article key={request.id} className="faq-card">
                  <div className="section-head">
                    <strong>{request.subject}</strong>
                    <span className="small-muted">{`${request.name} - ${request.status}`}</span>
                  </div>
                  <p className="muted">{request.message}</p>
                  <label className="field field-compact">
                    <span>Resposta do admin</span>
                    <textarea
                      className="text-input admin-reply-input"
                      rows={4}
                      value={replyDrafts[request.id] ?? request.adminReply ?? ""}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="Escreva uma orientacao curta para o usuario."
                    />
                  </label>
                  {request.adminReply ? (
                    <p className="admin-reply-preview">
                      <strong>Ultima resposta enviada:</strong> {request.adminReply}
                    </p>
                  ) : null}
                  <div className="button-row">
                    <button
                      className="btn btn-secondary"
                      disabled={updatingHelpId === request.id}
                      onClick={async () => {
                        setUpdatingHelpId(request.id);
                        try {
                          await onUpdateHelpStatus(
                            request.id,
                            "respondida",
                            (replyDrafts[request.id] ?? request.adminReply ?? "").trim(),
                          );
                        } finally {
                          setUpdatingHelpId(null);
                        }
                      }}
                    >
                      {updatingHelpId === request.id
                        ? "Atualizando..."
                        : request.status === "respondida"
                          ? "Atualizar resposta"
                          : "Responder e marcar"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="small-muted">Nenhuma duvida corresponde aos filtros atuais.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
