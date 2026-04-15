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
  onUpdateUserStatus: (email: string, status: Usuario["status"]) => Promise<void>;
};

const userStatusLabels: Record<Usuario["status"], string> = {
  ativo: "Ativo",
  bloqueado: "Bloqueado",
  excluido: "Excluido",
};

export function AdminScreen({
  usuario,
  progressoAtual,
  histories,
  helpRequests,
  onBack,
  onUpdateHelpStatus,
  onUpdateUserStatus,
}: AdminScreenProps) {
  const normalizedHistories = useMemo(
    () => (histories.length > 0 ? histories : [{ user: usuario, history: [], progress: progressoAtual }]),
    [histories, progressoAtual, usuario],
  );
  const [search, setSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"todos" | Usuario["status"]>("todos");
  const [helpStatusFilter, setHelpStatusFilter] = useState<"todas" | HelpRequest["status"]>("todas");
  const [updatingHelpId, setUpdatingHelpId] = useState<string | null>(null);
  const [updatingUserEmail, setUpdatingUserEmail] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const userStatusSummary = useMemo(
    () => ({
      ativo: normalizedHistories.filter(({ user }) => user.status === "ativo").length,
      bloqueado: normalizedHistories.filter(({ user }) => user.status === "bloqueado").length,
      excluido: normalizedHistories.filter(({ user }) => user.status === "excluido").length,
    }),
    [normalizedHistories],
  );

  const filteredHistories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalizedHistories.filter(({ user, history }) => {
      if (userStatusFilter !== "todos" && user.status !== userStatusFilter) {
        return false;
      }

      if (!query) return true;

      const matchesUser =
        user.nome.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query);
      const matchesHistory = history.some(
        (entry) =>
          getSessionModeLabel(entry.mode).toLowerCase().includes(query) ||
          String(entry.challengeId).includes(query),
      );

      return matchesUser || matchesHistory;
    });
  }, [normalizedHistories, search, userStatusFilter]);

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

        <section className="panel admin-status-panel">
          <div className="section-head">
            <h3>Status dos usuarios</h3>
            <span className="small-muted">Controle rapido de acesso ao aplicativo</span>
          </div>
          <div className="admin-status-grid">
            <div className="admin-status-card admin-status-card-active">
              <strong>{userStatusSummary.ativo}</strong>
              <span>Ativos</span>
            </div>
            <div className="admin-status-card admin-status-card-blocked">
              <strong>{userStatusSummary.bloqueado}</strong>
              <span>Bloqueados</span>
            </div>
            <div className="admin-status-card admin-status-card-deleted">
              <strong>{userStatusSummary.excluido}</strong>
              <span>Excluidos</span>
            </div>
          </div>
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
              <span>Status do usuario</span>
              <select
                className="text-input"
                value={userStatusFilter}
                onChange={(event) => setUserStatusFilter(event.target.value as "todos" | Usuario["status"])}
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="bloqueado">Bloqueados</option>
                <option value="excluido">Excluidos</option>
              </select>
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
                      <strong>Status</strong>
                      <span className={`admin-user-status admin-user-status-${user.status}`}>
                        {userStatusLabels[user.status]}
                      </span>
                    </div>
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

                  <div className="button-row">
                    <button
                      className="btn btn-secondary"
                      disabled={updatingUserEmail === user.email || user.role === "admin" || user.status === "excluido"}
                      onClick={async () => {
                        setUpdatingUserEmail(user.email);
                        try {
                          await onUpdateUserStatus(user.email, user.status === "bloqueado" ? "ativo" : "bloqueado");
                        } finally {
                          setUpdatingUserEmail(null);
                        }
                      }}
                    >
                      {updatingUserEmail === user.email
                        ? "Atualizando..."
                        : user.status === "excluido"
                          ? "Usuario excluido"
                        : user.status === "bloqueado"
                          ? "Desbloquear usuario"
                          : "Bloquear usuario"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={updatingUserEmail === user.email || user.role === "admin" || user.status === "excluido"}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Excluir ${user.nome}? O usuario perdera progresso, historico e pedidos de ajuda salvos.`,
                        );
                        if (!confirmed) return;

                        setUpdatingUserEmail(user.email);
                        try {
                          await onUpdateUserStatus(user.email, "excluido");
                        } finally {
                          setUpdatingUserEmail(null);
                        }
                      }}
                    >
                      {user.status === "excluido" ? "Usuario excluido" : "Excluir usuario"}
                    </button>
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
