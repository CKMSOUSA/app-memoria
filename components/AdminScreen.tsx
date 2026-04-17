"use client";

import { useMemo, useState } from "react";

import { getCompletionRate, getReportSummary, getSessionModeLabel } from "@/lib/scoring";
import { getAdminAlerts } from "@/lib/training-insights";
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

const userRoleLabels: Record<Usuario["role"], string> = {
  aluno: "Aluno",
  responsavel: "Responsavel",
  professor: "Professor",
  admin: "Administrador",
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
  const [userRoleFilter, setUserRoleFilter] = useState<"todos" | Usuario["role"]>("todos");
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
  const adminAlerts = useMemo(() => getAdminAlerts(normalizedHistories), [normalizedHistories]);

  const filteredHistories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalizedHistories.filter(({ user, history }) => {
      if (userStatusFilter !== "todos" && user.status !== userStatusFilter) {
        return false;
      }

      if (userRoleFilter !== "todos" && user.role !== userRoleFilter) {
        return false;
      }

      if (!query) return true;

      const matchesUser =
        user.nome.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query) ||
        userRoleLabels[user.role].toLowerCase().includes(query) ||
        (user.turma ?? "").toLowerCase().includes(query);
      const matchesHistory = history.some(
        (entry) =>
          getSessionModeLabel(entry.mode).toLowerCase().includes(query) ||
          String(entry.challengeId).includes(query),
      );

      return matchesUser || matchesHistory;
    });
  }, [normalizedHistories, search, userRoleFilter, userStatusFilter]);

  const turmaSummaries = useMemo(() => {
    const grouped = new Map<
      string,
      {
        name: string;
        total: number;
        alunos: number;
        responsaveis: number;
        professores: number;
        admins: number;
        averageScore: number;
        completionRate: number;
        latestActivity: string | null;
      }
    >();

    for (const { user, history } of filteredHistories) {
      const turmaNome = user.turma?.trim() || "Sem turma";
      const current = grouped.get(turmaNome) ?? {
        name: turmaNome,
        total: 0,
        alunos: 0,
        responsaveis: 0,
        professores: 0,
        admins: 0,
        averageScore: 0,
        completionRate: 0,
        latestActivity: null,
      };

      current.total += 1;
      current.alunos += user.role === "aluno" ? 1 : 0;
      current.responsaveis += user.role === "responsavel" ? 1 : 0;
      current.professores += user.role === "professor" ? 1 : 0;
      current.admins += user.role === "admin" ? 1 : 0;

      const totalScore = history.reduce((sum, entry) => sum + entry.score, 0);
      const averageScore = history.length > 0 ? Math.round(totalScore / history.length) : 0;
      const completionRate =
        history.length > 0 ? Math.round((history.filter((entry) => entry.completed).length / history.length) * 100) : 0;
      current.averageScore += averageScore;
      current.completionRate += completionRate;

      const latestActivity = history[0]?.playedAt ?? null;
      if (!current.latestActivity || (latestActivity && latestActivity > current.latestActivity)) {
        current.latestActivity = latestActivity;
      }

      grouped.set(turmaNome, current);
    }

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        averageScore: item.total > 0 ? Math.round(item.averageScore / item.total) : 0,
        completionRate: item.total > 0 ? Math.round(item.completionRate / item.total) : 0,
      }))
      .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name));
  }, [filteredHistories]);

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
            <p className="eyebrow admin-area-title">Area administrativa</p>
            <p className="muted">
              Painel de acompanhamento com resumo por aluno, ultima atividade, modo de treino mais forte e central de ajuda.
            </p>
          </div>
          <button className="btn btn-admin-back" onClick={onBack}>
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

        <section className="panel admin-alerts-panel">
          <div className="section-head">
            <h3>Alertas inteligentes</h3>
            <span className="small-muted">{adminAlerts.length} alerta(s) priorizados para acao</span>
          </div>
          {adminAlerts.length > 0 ? (
            <div className="admin-alert-grid">
              {adminAlerts.map((alert) => (
                <article key={`${alert.email}-${alert.category}-${alert.title}`} className={`admin-alert-card admin-alert-${alert.severity}`}>
                  <div className="section-head">
                    <div>
                      <h3>{alert.title}</h3>
                      <p className="small-muted">{alert.name}</p>
                    </div>
                    <span className="pill">{alert.severity === "alta" ? "Alta" : alert.severity === "media" ? "Media" : "Baixa"}</span>
                  </div>
                  <p className="muted">{alert.summary}</p>
                  <p className="small-muted">{alert.recommendation}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="small-muted">Nenhum alerta critico agora. O grupo esta sem sinais fortes de abandono ou queda.</p>
          )}
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
                placeholder="Ex.: Ana, Turma Alfa, professor, memoria ou fase 3"
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
              <span>Perfil</span>
              <select
                className="text-input"
                value={userRoleFilter}
                onChange={(event) => setUserRoleFilter(event.target.value as "todos" | Usuario["role"])}
              >
                <option value="todos">Todos</option>
                <option value="aluno">Alunos</option>
                <option value="responsavel">Responsaveis</option>
                <option value="professor">Professores</option>
                <option value="admin">Administradores</option>
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

        <section className="panel admin-class-panel">
          <div className="section-head">
            <h3>Visao por turma</h3>
            <span className="small-muted">{turmaSummaries.length} grupo(s) com usuarios nos filtros atuais</span>
          </div>
          {turmaSummaries.length > 0 ? (
            <div className="admin-class-grid">
              {turmaSummaries.map((turma) => (
                <article key={turma.name} className="admin-class-card">
                  <div className="section-head">
                    <div>
                      <h3>{turma.name}</h3>
                      <p className="small-muted">{turma.total} perfil(is) vinculado(s)</p>
                    </div>
                    <span className="pill">{`${turma.completionRate}% conclusao`}</span>
                  </div>
                  <div className="admin-class-metrics">
                    <span>{`${turma.alunos} aluno(s)`}</span>
                    <span>{`${turma.professores} professor(es)`}</span>
                    <span>{`${turma.responsaveis} responsavel(is)`}</span>
                    {turma.admins > 0 ? <span>{`${turma.admins} admin`}</span> : null}
                  </div>
                  <p className="muted">{`Media consolidada da turma: ${turma.averageScore} pontos.`}</p>
                  <p className="small-muted">
                    {turma.latestActivity
                      ? `Ultima atividade registrada em ${new Date(turma.latestActivity).toLocaleDateString("pt-BR")}.`
                      : "Ainda sem sessoes registradas nesta turma."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="small-muted">Nenhuma turma corresponde aos filtros atuais.</p>
          )}
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Resumo por aluno</h3>
            <span className="small-muted">{filteredHistories.length} perfil(is) encontrado(s)</span>
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
                      <p className="small-muted">{`${userRoleLabels[user.role]}${user.turma ? ` - ${user.turma}` : ""}`}</p>
                    </div>
                  </div>

                  <div className="admin-chip-grid">
                    <div className="phase-chip">
                      <strong>Perfil</strong>
                      <span>{userRoleLabels[user.role]}</span>
                    </div>
                    <div className="phase-chip">
                      <strong>Turma</strong>
                      <span>{user.turma?.trim() || "Sem turma"}</span>
                    </div>
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
