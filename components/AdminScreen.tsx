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
  observations,
  reminders,
  prescriptions,
  userLinks,
  auditLog,
  onBack,
  onUpdateHelpStatus,
  onUpdateUserStatus,
  onResetAllTrainingData,
  onSaveObservation,
  onSaveUserLink,
  onExportBackup,
  onRestoreBackup,
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
  const userStatusSummary = useMemo(
    () => ({
      ativo: normalizedHistories.filter(({ user }) => user.status === "ativo").length,
      bloqueado: normalizedHistories.filter(({ user }) => user.status === "bloqueado").length,
      excluido: normalizedHistories.filter(({ user }) => user.status === "excluido").length,
    }),
    [normalizedHistories],
  );
  const adminAlerts = useMemo(() => getAdminAlerts(normalizedHistories), [normalizedHistories]);
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
                  "Zerar o treinamento de todos os usuarios? Isso vai reiniciar pontos, progresso, historico e sessoes prescritas, sem apagar as contas.",
                );
                if (!confirmed) return;

                const finalConfirmed = window.confirm(
                  "Confirmacao final: todos os usuarios nao administradores vao recomecar do zero. Deseja continuar?",
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
              {resettingAllData ? "Zerando usuarios..." : "Zerar treinamento de todos"}
            </button>
            <button className="btn btn-admin-back" onClick={onBack}>
              Voltar ao painel
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
          <article className="stat-card">
            <p className="small-muted">Rotinas agendadas</p>
            <h3>{reminders.length}</h3>
            <p className="muted">Lembretes e agendas de treino ativos no produto.</p>
          </article>
          <article className="stat-card">
            <p className="small-muted">Sessoes prescritas</p>
            <h3>{prescriptions.length}</h3>
            <p className="muted">Blocos orientados por professor ou responsavel.</p>
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

        <section className="panel">
          <div className="section-head">
            <h3>Rankings privados do produto</h3>
            <span className="small-muted">Leitura consolidada por desempenho e evolucao</span>
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
              <h3>Evolucao recente</h3>
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
              <span>Nivel medio</span>
              <select className="text-input" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as typeof levelFilter)}>
                <option value="todos">Todos</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediario</option>
                <option value="avancado">Avancado</option>
              </select>
            </label>

            <label className="field">
              <span>Tendencia</span>
              <select className="text-input" value={trendFilter} onChange={(event) => setTrendFilter(event.target.value as typeof trendFilter)}>
                <option value="todas">Todas</option>
                <option value="subindo">Subindo</option>
                <option value="estavel">Estavel</option>
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
                <option value="concluida">Concluidas</option>
              </select>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Painel de adesao</h3>
            <span className="small-muted">Leitura de frequencia, risco e abandono</span>
          </div>
          <div className="admin-status-grid">
            <div className="admin-status-card admin-status-card-active">
              <strong>{adherencePanel.regular}</strong>
              <span>Rotina ativa</span>
            </div>
            <div className="admin-status-card admin-status-card-blocked">
              <strong>{adherencePanel.attention}</strong>
              <span>Precisam atencao</span>
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

        <section className="panel">
          <div className="section-head">
            <h3>Vinculos explicitos</h3>
            <span className="small-muted">Conecte professor ou responsavel a alunos especificos</span>
          </div>
          <div className="admin-toolbar-grid">
            <label className="field">
              <span>Email do professor ou responsavel</span>
              <input value={linkOwnerEmail} onChange={(event) => setLinkOwnerEmail(event.target.value)} placeholder="adulto@email.com" />
            </label>
            <label className="field">
              <span>Email do aluno</span>
              <input value={linkStudentEmail} onChange={(event) => setLinkStudentEmail(event.target.value)} placeholder="aluno@email.com" />
            </label>
            <label className="field">
              <span>Tipo de vinculo</span>
              <select className="text-input" value={linkRelationship} onChange={(event) => setLinkRelationship(event.target.value as typeof linkRelationship)}>
                <option value="professor">Professor</option>
                <option value="responsavel">Responsavel</option>
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
                Salvar vinculo
              </button>
            </div>
          </div>
          <div className="admin-alert-grid">
            {userLinks.length > 0 ? (
              userLinks.slice(0, 10).map((item) => (
                <article key={item.id} className="admin-class-card">
                  <h3>{item.relationship === "professor" ? "Professor" : "Responsavel"}</h3>
                  <p className="small-muted">{item.ownerEmail}</p>
                  <p className="muted">{`Aluno vinculado: ${item.studentEmail}`}</p>
                </article>
              ))
            ) : (
              <p className="small-muted">Ainda nao ha vinculos explicitos registrados.</p>
            )}
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

                  <div className="admin-observation-grid">
                    {(["clinica", "pedagogica"] as const).map((category) => {
                      const key = `${user.email}:${category}`;
                      const savedObservation = getObservation(user.email, category);
                      return (
                        <label key={key} className="field field-compact">
                          <span>{category === "clinica" ? "Observacao clinica" : "Observacao pedagogica"}</span>
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
                                ? "Registre sinais clinicos, adaptacoes ou pontos de atencao."
                                : "Registre estrategias pedagogicas, resposta a atividade e proximos passos."
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
                            {savingObservationKey === key ? "Salvando..." : "Salvar observacao"}
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

        <section className="panel">
          <div className="section-head">
            <h3>Agenda e prescricoes do produto</h3>
            <span className="small-muted">{`${reminders.length} rotina(s) e ${prescriptions.length} sessao(oes) prescrita(s)`}</span>
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
              <h3>Sessoes prescritas</h3>
              {prescriptions.length > 0 ? (
                prescriptions.slice(0, 8).map((item) => (
                  <p key={item.id} className="small-muted">{`${item.title} · ${item.challengeName} · ${item.status} · ${item.assignedByName}`}</p>
                ))
              ) : (
                <p className="small-muted">Ainda sem sessoes prescritas.</p>
              )}
            </article>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h3>Log de acoes administrativas</h3>
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
              <p className="small-muted">{restoringBackup ? "Restaurando backup..." : "Ainda nao ha acoes auditadas."}</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
