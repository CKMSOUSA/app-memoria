"use client";

import { useMemo, useRef, useState } from "react";

import { getAdherencePanel, getFilteredManagedHistories, getPrivateClassRanking, summarizeAuditLog } from "@/lib/product-management";
import { exportAdminReportPdf } from "@/lib/report-pdf";
import { getCompletionRate, getReportSummary, getSessionModeLabel } from "@/lib/scoring";
import { getAdminAlerts } from "@/lib/training-insights";
import type {
  AdminAuditEntry,
  BackupData,
  ClinicalObservation,
  HelpRequest,
  PrescriptionSession,
  ProgressState,
  ReminderSchedule,
  SessionRecord,
  UserLink,
  Usuario,
} from "@/lib/types";

type AdminScreenProps = {
  usuario: Usuario;
  progressoAtual: ProgressState;
  histories: Array<{ user: Usuario; history: SessionRecord[]; progress?: ProgressState }>;
  helpRequests: HelpRequest[];
  observations: ClinicalObservation[];
  reminders: ReminderSchedule[];
  prescriptions: PrescriptionSession[];
  userLinks: UserLink[];
  auditLog: AdminAuditEntry[];
  onBack: () => void;
  onLogout: () => void;
  onUpdateHelpStatus: (
    requestId: string,
    status: HelpRequest["status"],
    adminReply?: string,
  ) => Promise<void>;
  onUpdateUserStatus: (email: string, status: Usuario["status"]) => Promise<void>;
  onResetAllTrainingData: () => Promise<void>;
  onSaveObservation: (
    email: string,
    category: ClinicalObservation["category"],
    note: string,
  ) => Promise<void>;
  onSaveUserLink: (input: Omit<UserLink, "id" | "createdAt">) => Promise<void>;
  onExportBackup: () => Promise<BackupData>;
  onRestoreBackup: (backup: BackupData) => Promise<void>;
};

type AdminPanelOption = "visao-geral" | "usuarios" | "ajuda" | "rotinas" | "auditoria";

const userStatusLabels: Record<Usuario["status"], string> = {
  ativo: "Ativo",
  bloqueado: "Bloqueado",
  excluido: "Excluído",
};

const userRoleLabels: Record<Usuario["role"], string> = {
  aluno: "Aluno",
  responsavel: "Responsável",
  professor: "Professor",
  admin: "Administrador",
};

export function AdminScreen({
  usuario,
  progressoAtual,
  histories,
  helpRequests,
  observations,
  reminders,
  prescriptions,
  userLinks,
  auditLog,
  onBack,
  onLogout,
  onUpdateHelpStatus,
  onUpdateUserStatus,
  onResetAllTrainingData,
  onSaveObservation,
  onSaveUserLink,
  onExportBackup,
  onRestoreBackup,
}: AdminScreenProps) {
  const usersSectionRef = useRef<HTMLElement | null>(null);
  const helpSectionRef = useRef<HTMLElement | null>(null);
  const auditSectionRef = useRef<HTMLElement | null>(null);
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
  const [savingObservationKey, setSavingObservationKey] = useState<string | null>(null);
  const [resettingAllData, setResettingAllData] = useState(false);
  const [ageFilter, setAgeFilter] = useState<"todas" | "6-12" | "13-17" | "18+">("todas");
  const [levelFilter, setLevelFilter] = useState<"todos" | "iniciante" | "intermediario" | "avancado">("todos");
  const [trendFilter, setTrendFilter] = useState<"todas" | "subindo" | "estavel" | "caindo">("todas");
  const [prescriptionFilter, setPrescriptionFilter] = useState<"todas" | "pendente" | "concluida">("todas");
  const [linkOwnerEmail, setLinkOwnerEmail] = useState("");
  const [linkStudentEmail, setLinkStudentEmail] = useState("");
  const [linkRelationship, setLinkRelationship] = useState<"professor" | "responsavel">("professor");
  const [restoringBackup, setRestoringBackup] = useState(false);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [observationDrafts, setObservationDrafts] = useState<Record<string, string>>({});
  const [activePanel, setActivePanel] = useState<AdminPanelOption>("visao-geral");
  const userStatusSummary = useMemo(
    () => ({
      ativo: normalizedHistories.filter(({ user }) => user.status === "ativo").length,
      bloqueado: normalizedHistories.filter(({ user }) => user.status === "bloqueado").length,
      excluido: normalizedHistories.filter(({ user }) => user.status === "excluido").length,
    }),
    [normalizedHistories],
  );
  const adminAlerts = useMemo(() => getAdminAlerts(normalizedHistories), [normalizedHistories]);
  const criticalAlerts = useMemo(() => adminAlerts.filter((alert) => alert.severity === "alta"), [adminAlerts]);
  const adherencePanel = useMemo(() => getAdherencePanel(normalizedHistories), [normalizedHistories]);
  const scoreRanking = useMemo(() => getPrivateClassRanking(normalizedHistories, null, "score"), [normalizedHistories]);
  const evolutionRanking = useMemo(() => getPrivateClassRanking(normalizedHistories, null, "evolucao"), [normalizedHistories]);

  const filteredHistories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const advancedFiltered = getFilteredManagedHistories(
      normalizedHistories,
      {
        ageBand: ageFilter,
        level: levelFilter,
        trend: trendFilter,
        prescriptionStatus: prescriptionFilter,
      },
      prescriptions,
    );
    return advancedFiltered.filter(({ user, history }) => {
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
  }, [normalizedHistories, search, userRoleFilter, userStatusFilter, ageFilter, levelFilter, trendFilter, prescriptionFilter, prescriptions]);

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

    for (const { user, history } of normalizedHistories) {
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
  }, [normalizedHistories]);

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
  const openHelpRequestsCount = useMemo(
    () => helpRequests.filter((request) => request.status === "aberta").length,
    [helpRequests],
  );
  const manageableActiveUsersCount = useMemo(
    () =>
      normalizedHistories.filter(
        ({ user }) => user.role !== "admin" && user.status !== "bloqueado" && user.status !== "excluido",
      ).length,
    [normalizedHistories],
  );

  function scrollToSection(target: HTMLElement | null) {
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openPanel(panel: AdminPanelOption, target?: HTMLElement | null) {
    setActivePanel(panel);
    if (target) {
      window.setTimeout(() => scrollToSection(target), 80);
    }
  }

  function getObservation(email: string, category: ClinicalObservation["category"]) {
    return observations.find((item) => item.email === email && item.category === category) ?? null;
  }

  function getObservationDraft(email: string, category: ClinicalObservation["category"]) {
    const key = `${email}:${category}`;
    return observationDrafts[key] ?? getObservation(email, category)?.note ?? "";
  }

  function handleExportAdminPdf() {
    exportAdminReportPdf({
      generatedAt: new Date().toLocaleString("pt-BR"),
      users: filteredHistories.map(({ user, history }) => ({ user, history })),
      helpRequests: filteredHelpRequests,
      observations,
    });
  }

  const panelOptions: Array<{ id: AdminPanelOption; label: string; caption: string }> = [
    { id: "visao-geral", label: "Visão geral", caption: "Riscos, indicadores e rankings" },
    { id: "usuarios", label: "Usuários", caption: "Busca, bloqueio e acompanhamento" },
    { id: "ajuda", label: "Ajuda", caption: "Mensagens e respostas" },
    { id: "rotinas", label: "Rotinas", caption: "Turmas, vínculos e prescrições" },
    { id: "auditoria", label: "Auditoria", caption: "Reset, histórico e rastreio" },
  ];

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <div className="admin-shell">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-profile">
              <div className="sidebar-avatar">{usuario.avatar}</div>
              <div>
                <h2>{usuario.nome}</h2>
                <p className="sidebar-email">{usuario.email}</p>
              </div>
            </div>
            <p className="sidebar-label">Administracao</p>
            <div className="admin-sidebar-nav">
              {panelOptions
                .filter((option) => option.id !== "ajuda")
                .map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`admin-nav-button ${activePanel === option.id ? "admin-nav-button-active" : ""}`}
                    onClick={() => setActivePanel(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.caption}</span>
                  </button>
                ))}
              <button type="button" className="admin-nav-button" onClick={onBack}>
                <strong>Meu perfil</strong>
                <span>Editar dados do administrador</span>
              </button>
              <button
                type="button"
                className={`admin-nav-button ${activePanel === "ajuda" ? "admin-nav-button-active" : ""}`}
                onClick={() => setActivePanel("ajuda")}
              >
                <strong>Ajuda</strong>
                <span>Pedidos, mensagens e respostas</span>
              </button>
              <button type="button" className="admin-nav-button admin-nav-button-danger" onClick={onLogout}>
                <strong>Sair</strong>
                <span>Encerrar sessão administrativa</span>
              </button>
            </div>
          </aside>

          <div className="admin-content">
            <header className="game-header">
              <div>
                <p className="eyebrow admin-area-title">Home administrativa</p>
                <h1 className="admin-home-heading">Operação central do aplicativo</h1>
                <p className="muted">
                  Entrada dedicada para operação, alertas críticos e ações rápidas sem depender do dashboard do aluno.
                </p>
              </div>
              <div className="button-row">
                <button className="btn btn-secondary btn-export-report" onClick={handleExportAdminPdf}>
                  Exportar PDF
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    const backup = await onExportBackup();
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `backup-app-memoria-${new Date().toISOString().slice(0, 10)}.json`;
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Exportar backup
                </button>
                <button className="btn btn-secondary" onClick={() => backupInputRef.current?.click()}>
                  Restaurar backup
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={resettingAllData}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      "Remover todos os usuários não administradores? Isso vai apagar contas, progresso, histórico, pedidos, vínculos e demais dados associados, preservando apenas o administrativo.",
                    );
                    if (!confirmed) return;

                    const finalConfirmed = window.confirm(
                      "Confirmação final: apenas as contas administrativas serão mantidas. Deseja continuar?",
                    );
                    if (!finalConfirmed) return;

                    setResettingAllData(true);
                    try {
                      await onResetAllTrainingData();
                    } finally {
                      setResettingAllData(false);
                    }
                  }}
                >
                  {resettingAllData ? "Limpando usuários..." : "Limpar usuários não admin"}
                </button>
              </div>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setRestoringBackup(true);
                  try {
                    const text = await file.text();
                    await onRestoreBackup(JSON.parse(text) as BackupData);
                  } finally {
                    setRestoringBackup(false);
                    event.target.value = "";
                  }
                }}
              />
            </header>

        <section className="panel admin-priority-panel">
          <div className="section-head">
            <div>
              <h3>Alertas críticos no topo</h3>
              <span className="small-muted">Itens que pedem ação primeiro</span>
            </div>
            <span className="pill">{criticalAlerts.length} prioridade alta</span>
          </div>
          {criticalAlerts.length > 0 ? (
            <div className="admin-critical-list">
              {criticalAlerts.slice(0, 4).map((alert, index) => (
                <article key={`${alert.email}-${alert.category}-${alert.title}`} className="admin-critical-card">
                  <div className="section-head">
                    <div>
                      <p className="small-muted">{`Prioridade ${index + 1}`}</p>
                      <h3>{alert.title}</h3>
                    </div>
                    <span className="pill">Alta</span>
                  </div>
                  <p className="small-muted">{alert.name}</p>
                  <p className="muted">{alert.summary}</p>
                  <p className="small-muted">{alert.recommendation}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="small-muted">Nenhum alerta de prioridade alta no momento.</p>
          )}
        </section>

        <section className="panel admin-quick-actions-panel">
          <div className="section-head">
            <h3>Atalhos de ação rápida</h3>
            <span className="small-muted">Fluxos operacionais mais usados em um clique</span>
          </div>
          <div className="admin-quick-actions-grid">
            <button
              className="admin-quick-action admin-quick-action-warning"
              type="button"
              onClick={() => {
                setSearch("");
                setUserRoleFilter("aluno");
                setUserStatusFilter("ativo");
                openPanel("usuarios", usersSectionRef.current);
              }}
            >
              <strong>Bloquear usuário</strong>
              <span>{`${manageableActiveUsersCount} perfil(is) elegível(is) para revisão`}</span>
            </button>
            <button
              className="admin-quick-action admin-quick-action-info"
              type="button"
              onClick={() => {
                setSearch("");
                setHelpStatusFilter("aberta");
                openPanel("ajuda", helpSectionRef.current);
              }}
            >
              <strong>Responder ajuda</strong>
              <span>{`${openHelpRequestsCount} pedido(s) em aberto`}</span>
            </button>
            <button className="admin-quick-action admin-quick-action-neutral" type="button" onClick={handleExportAdminPdf}>
              <strong>Exportar relatório</strong>
              <span>Gerar PDF consolidado com usuários, ajuda e observações</span>
            </button>
            <button
              className="admin-quick-action admin-quick-action-danger"
              type="button"
              onClick={async () => {
                const confirmed = window.confirm(
                  "Remover todos os usuários não administradores? Isso vai apagar contas, progresso, histórico, pedidos, vínculos e demais dados associados, preservando apenas o administrativo.",
                );
                if (!confirmed) return;

                const finalConfirmed = window.confirm(
                  "Confirmação final: apenas as contas administrativas serão mantidas. Deseja continuar?",
                );
                if (!finalConfirmed) return;

                setResettingAllData(true);
                try {
                  await onResetAllTrainingData();
                  openPanel("auditoria", auditSectionRef.current);
                } finally {
                  setResettingAllData(false);
                }
              }}
            >
              <strong>{resettingAllData ? "Resetando dados..." : "Resetar dados"}</strong>
              <span>Limpar usuários não admin e registrar a ação na auditoria</span>
            </button>
          </div>
        </section>

        {activePanel === "visao-geral" ? (
        <section className="stats-grid">
          <article className="stat-card">
            <p className="small-muted">Usuários monitorados</p>
            <h3>{normalizedHistories.length}</h3>
            <p className="muted">Leitura local das contas cadastradas no app.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Sessões registradas</p>
            <h3>{normalizedHistories.reduce((sum, item) => sum + item.history.length, 0)}</h3>
            <p className="muted">Cada rodada concluída gera um registro para relatórios.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Conclusões totais</p>
            <h3>{normalizedHistories.reduce((sum, item) => sum + item.history.filter((entry) => entry.completed).length, 0)}</h3>
            <p className="muted">Ajuda a acompanhar aderência e evolução geral.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Pedidos de ajuda</p>
            <h3>{helpRequests.length}</h3>
            <p className="muted">Dúvidas registradas pelos usuários dentro do app.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Rotinas agendadas</p>
            <h3>{reminders.length}</h3>
            <p className="muted">Lembretes e agendas de treino ativos no produto.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Sessões prescritas</p>
            <h3>{prescriptions.length}</h3>
            <p className="muted">Blocos orientados por professor ou responsável.</p>
          </article>
        </section>
        ) : null}

        {activePanel === "visao-geral" ? (
        <section className="panel admin-status-panel">
          <div className="section-head">
            <h3>Status dos usuários</h3>
            <span className="small-muted">Controle rápido de acesso ao aplicativo</span>
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
        ) : null}

        {activePanel === "visao-geral" ? (
        <section className="panel admin-alerts-panel">
          <div className="section-head">
            <h3>Alertas inteligentes</h3>
            <span className="small-muted">{adminAlerts.length} alerta(s) priorizados para ação</span>
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
                    <span className="pill">{alert.severity === "alta" ? "Alta" : alert.severity === "media" ? "Média" : "Baixa"}</span>
                  </div>
                  <p className="muted">{alert.summary}</p>
                  <p className="small-muted">{alert.recommendation}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="small-muted">Nenhum alerta crítico agora. O grupo está sem sinais fortes de abandono ou queda.</p>
          )}
        </section>
        ) : null}

        {activePanel === "visao-geral" ? (
        <section className="panel">
          <div className="section-head">
            <h3>Rankings privados do produto</h3>
            <span className="small-muted">Leitura consolidada por desempenho e evolução</span>
          </div>
          <div className="admin-alert-grid">
            <article className="admin-class-card">
              <h3>Desempenho consolidado</h3>
              <div className="ranking-list">
                {scoreRanking.map((entry, index) => (
                  <div key={entry.email} className="ranking-item">
                    <strong>{`${index + 1}. ${entry.name}`}</strong>
                    <span>{entry.score}</span>
                    <p className="small-muted">{entry.subtitle}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="admin-class-card">
              <h3>Evolução recente</h3>
              <div className="ranking-list">
                {evolutionRanking.map((entry, index) => (
                  <div key={entry.email} className="ranking-item">
                    <strong>{`${index + 1}. ${entry.name}`}</strong>
                    <span>{entry.score >= 0 ? `+${entry.score}` : entry.score}</span>
                    <p className="small-muted">{entry.subtitle}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
        ) : null}

        {activePanel === "usuarios" ? (
        <section className="panel admin-toolbar">
          <div className="section-head">
            <h3>Busca e filtros</h3>
            <span className="small-muted">Refine usuários, sessões e dúvidas</span>
          </div>

          <div className="admin-toolbar-grid">
            <label className="field">
              <span>Buscar por nome, email, trilha ou fase</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: Ana, Turma Alfa, professor, memória ou fase 3"
              />
            </label>

            <label className="field">
              <span>Status do usuário</span>
              <select
                className="text-input"
                value={userStatusFilter}
                onChange={(event) => setUserStatusFilter(event.target.value as "todos" | Usuario["status"])}
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="bloqueado">Bloqueados</option>
                <option value="excluido">Excluídos</option>
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
                <option value="responsavel">Responsáveis</option>
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

            <label className="field">
              <span>Faixa etaria</span>
              <select className="text-input" value={ageFilter} onChange={(event) => setAgeFilter(event.target.value as typeof ageFilter)}>
                <option value="todas">Todas</option>
                <option value="6-12">6 a 12</option>
                <option value="13-17">13 a 17</option>
                <option value="18+">18+</option>
              </select>
            </label>

            <label className="field">
              <span>Nível médio</span>
              <select className="text-input" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as typeof levelFilter)}>
                <option value="todos">Todos</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </label>

            <label className="field">
              <span>Tendência</span>
              <select className="text-input" value={trendFilter} onChange={(event) => setTrendFilter(event.target.value as typeof trendFilter)}>
                <option value="todas">Todas</option>
                <option value="subindo">Subindo</option>
                <option value="estavel">Estável</option>
                <option value="caindo">Caindo</option>
              </select>
            </label>

            <label className="field">
              <span>Status da prescricao</span>
              <select
                className="text-input"
                value={prescriptionFilter}
                onChange={(event) => setPrescriptionFilter(event.target.value as typeof prescriptionFilter)}
              >
                <option value="todas">Todas</option>
                <option value="pendente">Pendentes</option>
                <option value="concluida">Concluídas</option>
              </select>
            </label>
          </div>
        </section>
        ) : null}

        {activePanel === "visao-geral" ? (
        <section className="panel">
          <div className="section-head">
            <h3>Painel de adesao</h3>
            <span className="small-muted">Leitura de frequência, risco e abandono</span>
          </div>
          <div className="admin-status-grid">
            <div className="admin-status-card admin-status-card-active">
              <strong>{adherencePanel.regular}</strong>
              <span>Rotina ativa</span>
            </div>
            <div className="admin-status-card admin-status-card-blocked">
              <strong>{adherencePanel.attention}</strong>
              <span>Precisam atenção</span>
            </div>
            <div className="admin-status-card admin-status-card-deleted">
              <strong>{adherencePanel.inactive}</strong>
              <span>Inativos</span>
            </div>
          </div>
          <div className="admin-alert-grid">
            {adherencePanel.entries.slice(0, 8).map((entry) => (
              <article key={entry.email} className={`admin-alert-card admin-alert-${entry.label === "regular" ? "baixa" : entry.label === "attention" ? "media" : "alta"}`}>
                <h3>{entry.name}</h3>
                <p className="small-muted">{entry.email}</p>
                <p className="muted">{entry.summary}</p>
              </article>
            ))}
          </div>
        </section>
        ) : null}

        {activePanel === "rotinas" ? (
        <section className="panel">
          <div className="section-head">
            <h3>Vínculos explícitos</h3>
            <span className="small-muted">Conecte professor ou responsável a alunos especificos</span>
          </div>
          <div className="admin-toolbar-grid">
            <label className="field">
              <span>Email do professor ou responsável</span>
              <input value={linkOwnerEmail} onChange={(event) => setLinkOwnerEmail(event.target.value)} placeholder="adulto@email.com" />
            </label>
            <label className="field">
              <span>Email do aluno</span>
              <input value={linkStudentEmail} onChange={(event) => setLinkStudentEmail(event.target.value)} placeholder="aluno@email.com" />
            </label>
            <label className="field">
              <span>Tipo de vínculo</span>
              <select className="text-input" value={linkRelationship} onChange={(event) => setLinkRelationship(event.target.value as typeof linkRelationship)}>
                <option value="professor">Professor</option>
                <option value="responsavel">Responsável</option>
              </select>
            </label>
            <div className="field">
              <span>&nbsp;</span>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  if (!linkOwnerEmail.trim() || !linkStudentEmail.trim()) return;
                  await onSaveUserLink({
                    ownerEmail: linkOwnerEmail.trim().toLowerCase(),
                    studentEmail: linkStudentEmail.trim().toLowerCase(),
                    relationship: linkRelationship,
                  });
                  setLinkOwnerEmail("");
                  setLinkStudentEmail("");
                }}
              >
                Salvar vínculo
              </button>
            </div>
          </div>
          <div className="admin-alert-grid">
            {userLinks.length > 0 ? (
              userLinks.slice(0, 10).map((item) => (
                <article key={item.id} className="admin-class-card">
                  <h3>{item.relationship === "professor" ? "Professor" : "Responsável"}</h3>
                  <p className="small-muted">{item.ownerEmail}</p>
                  <p className="muted">{`Aluno vinculado: ${item.studentEmail}`}</p>
                </article>
              ))
            ) : (
              <p className="small-muted">Ainda não há vínculos explícitos registrados.</p>
            )}
          </div>
        </section>
        ) : null}

        {activePanel === "rotinas" ? (
        <section className="panel admin-class-panel">
          <div className="section-head">
            <h3>Visão por turma</h3>
            <span className="small-muted">{turmaSummaries.length} grupo(s) cadastrados na base administrativa</span>
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
                    <span className="pill">{`${turma.completionRate}% conclusão`}</span>
                  </div>
                  <div className="admin-class-metrics">
                    <span>{`${turma.alunos} aluno(s)`}</span>
                    <span>{`${turma.professores} professor(es)`}</span>
                    <span>{`${turma.responsaveis} responsável(is)`}</span>
                    {turma.admins > 0 ? <span>{`${turma.admins} admin`}</span> : null}
                  </div>
                  <p className="muted">{`Média consolidada da turma: ${turma.averageScore} pontos.`}</p>
                  <p className="small-muted">
                    {turma.latestActivity
                      ? `Última atividade registrada em ${new Date(turma.latestActivity).toLocaleDateString("pt-BR")}.`
                      : "Ainda sem sessões registradas nesta turma."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="small-muted">Nenhuma turma cadastrada no momento.</p>
          )}
        </section>
        ) : null}

        {activePanel === "usuarios" ? (
        <section ref={usersSectionRef} className="panel">
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
                      <strong>Sessões</strong>
                      <span>{summary.totalSessions}</span>
                    </div>
                    <div className="phase-chip">
                      <strong>Média</strong>
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
                          ? "Usuário excluído"
                        : user.status === "bloqueado"
                          ? "Desbloquear usuário"
                          : "Bloquear usuário"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={updatingUserEmail === user.email || user.role === "admin" || user.status === "excluido"}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Excluir ${user.nome}? O usuário perderá progresso, histórico e pedidos de ajuda salvos.`,
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
                      {user.status === "excluido" ? "Usuário excluído" : "Excluir usuário"}
                    </button>
                  </div>

                  <div className="admin-progress-grid">
                    <span>{`Memória ${getCompletionRate(effectiveProgress.memoria)}%`}</span>
                    <span>{`Visual ${getCompletionRate(effectiveProgress.visual)}%`}</span>
                    <span>{`Atenção ${getCompletionRate(effectiveProgress.atencao)}%`}</span>
                    <span>{`Comparação ${getCompletionRate(effectiveProgress.comparacao)}%`}</span>
                    <span>{`Espacial ${getCompletionRate(effectiveProgress.espacial)}%`}</span>
                    <span>{`Lógica ${getCompletionRate(effectiveProgress.logica)}%`}</span>
                    <span>{`Procrastinação ${getCompletionRate(effectiveProgress.processo)}%`}</span>
                    <span>{`Visão focada ${getCompletionRate(effectiveProgress.visaoFocada)}%`}</span>
                    <span>{`Exclusiva ${getCompletionRate(effectiveProgress.especial)}%`}</span>
                  </div>

                  <div className="admin-history">
                    <strong>Últimas sessões</strong>
                    {history.length > 0 ? (
                      history.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="admin-history-item">
                          <span>{getSessionModeLabel(entry.mode)}</span>
                          <span>{`Fase ${entry.challengeId}`}</span>
                          <span>{`Score ${entry.score}`}</span>
                        </div>
                      ))
                    ) : (
                      <p className="small-muted">Ainda não há sessões registradas para este usuário.</p>
                    )}
                  </div>

                  <div className="admin-observation-grid">
                    {(["clinica", "pedagogica"] as const).map((category) => {
                      const key = `${user.email}:${category}`;
                      const savedObservation = getObservation(user.email, category);
                      return (
                        <label key={key} className="field field-compact">
                          <span>{category === "clinica" ? "Observação clínica" : "Observação pedagógica"}</span>
                          <textarea
                            className="text-input admin-reply-input"
                            rows={4}
                            value={getObservationDraft(user.email, category)}
                            onChange={(event) =>
                              setObservationDrafts((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                            placeholder={
                              category === "clinica"
                                ? "Registre sinais clínicos, adaptações ou pontos de atenção."
                                : "Registre estratégias pedagógicas, resposta a atividade e próximos passos."
                            }
                          />
                          {savedObservation ? (
                            <p className="small-muted">
                              {`Atualizada em ${new Date(savedObservation.updatedAt).toLocaleDateString("pt-BR")} por ${savedObservation.authorName}.`}
                            </p>
                          ) : null}
                          {savedObservation?.history && savedObservation.history.length > 0 ? (
                            <div className="small-muted">
                              {savedObservation.history.slice(-3).map((entry) => (
                                <p key={`${entry.updatedAt}-${entry.authorName}`}>
                                  {`${new Date(entry.updatedAt).toLocaleDateString("pt-BR")} · ${entry.authorName}: ${entry.note}`}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={savingObservationKey === key}
                            onClick={async () => {
                              setSavingObservationKey(key);
                              try {
                                await onSaveObservation(user.email, category, getObservationDraft(user.email, category));
                              } finally {
                                setSavingObservationKey(null);
                              }
                            }}
                          >
                            {savingObservationKey === key ? "Salvando..." : "Salvar observação"}
                          </button>
                        </label>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
          {filteredHistories.length === 0 ? <p className="small-muted">Nenhum aluno corresponde aos filtros atuais.</p> : null}
        </section>
        ) : null}

        {activePanel === "ajuda" ? (
        <section ref={helpSectionRef} className="panel">
          <div className="section-head">
            <h3>Dúvidas enviadas</h3>
            <span className="small-muted">{filteredHelpRequests.length} item(ns) encontrado(s)</span>
          </div>
          <div className="admin-toolbar-grid">
            <label className="field">
              <span>Buscar em pedidos de ajuda</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: nome, email, assunto ou mensagem"
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
                      placeholder="Escreva uma orientação curta para o usuário."
                    />
                  </label>
                  {request.adminReply ? (
                    <p className="admin-reply-preview">
                      <strong>Última resposta enviada:</strong> {request.adminReply}
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
              <p className="small-muted">Nenhuma dúvida corresponde aos filtros atuais.</p>
            )}
          </div>
        </section>
        ) : null}

        {activePanel === "rotinas" ? (
        <section className="panel">
          <div className="section-head">
            <h3>Agenda e prescrições do produto</h3>
            <span className="small-muted">{`${reminders.length} rotina(s) e ${prescriptions.length} sessão(ões) prescrita(s)`}</span>
          </div>
          <div className="admin-alert-grid">
            <article className="admin-class-card">
              <h3>Rotinas agendadas</h3>
              {reminders.length > 0 ? (
                reminders.slice(0, 8).map((item) => (
                  <p key={item.id} className="small-muted">{`${item.title} · ${item.daysOfWeek.join(", ")} · ${item.durationMinutes} min · ${item.turma ?? item.ownerEmail}`}</p>
                ))
              ) : (
                <p className="small-muted">Ainda sem rotinas salvas.</p>
              )}
            </article>
            <article className="admin-class-card">
              <h3>Sessões prescritas</h3>
              {prescriptions.length > 0 ? (
                prescriptions.slice(0, 8).map((item) => (
                  <p key={item.id} className="small-muted">{`${item.title} · ${item.challengeName} · ${item.status} · ${item.assignedByName}`}</p>
                ))
              ) : (
                <p className="small-muted">Ainda sem sessões prescritas.</p>
              )}
            </article>
          </div>
        </section>
        ) : null}

        {activePanel === "auditoria" ? (
        <section ref={auditSectionRef} className="panel">
          <div className="section-head">
            <h3>Log de ações administrativas</h3>
            <span className="small-muted">{auditLog.length} registro(s) recentes</span>
          </div>
          <div className="faq-list">
            {summarizeAuditLog(auditLog).length > 0 ? (
              summarizeAuditLog(auditLog).map((entry) => (
                <article key={entry.id} className="faq-card">
                  <div className="section-head">
                    <strong>{entry.actorName}</strong>
                    <span className="small-muted">{new Date(entry.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="small-muted">{entry.action}</p>
                  <p className="muted">{entry.description}</p>
                  {entry.targetEmail ? <p className="small-muted">{entry.targetEmail}</p> : null}
                </article>
              ))
            ) : (
              <p className="small-muted">{restoringBackup ? "Restaurando backup..." : "Ainda não há ações auditadas."}</p>
            )}
          </div>
        </section>
        ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
