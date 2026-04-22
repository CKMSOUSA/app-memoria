"use client";

import { useEffect, useState } from "react";
import { AttentionGame } from "@/components/AttentionGame";
import { AdvancedTestsPanel } from "@/components/AdvancedTestsPanel";
import { AdminConfirmScreen } from "@/components/AdminConfirmScreen";
import { AdminScreen } from "@/components/AdminScreen";
import { AudienceGame } from "@/components/AudienceGame";
import { AuthScreen } from "@/components/AuthScreen";
import { ComparisonGame } from "@/components/ComparisonGame";
import { Dashboard } from "@/components/Dashboard";
import { HelpScreen } from "@/components/HelpScreen";
import { applyAppSettingsToDocument, registerOfflineSupport, useAppSettingsState } from "@/lib/app-settings";
import { getOfflineSyncStatus, subscribeOfflineSyncStatus, type OfflineSyncStatus } from "@/lib/offline-store";
import { LogicGame } from "@/components/LogicGame";
import type {
  AdminAuditEntry,
  BackupData,
  ClinicalObservation,
  HelpRequest,
  PrescriptionSession,
  ReminderSchedule,
  UserLink,
} from "@/lib/types";
import { MemoryGame } from "@/components/MemoryGame";
import { ProfileScreen } from "@/components/ProfileScreen";
import { SpatialGame } from "@/components/SpatialGame";
import { VisualMemoryGame } from "@/components/VisualMemoryGame";
import { getAppRepository } from "@/lib/app-repository";
import { mergeProgress } from "@/lib/scoring";
import type { DataMode, ProgressState, SessionRecord, SessionMode, Tela, Usuario } from "@/lib/types";

const repository = getAppRepository();

export default function Page() {
  const [tela, setTela] = useState<Tela>("login");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [progresso, setProgresso] = useState<ProgressState>(mergeProgress());
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [observations, setObservations] = useState<ClinicalObservation[]>([]);
  const [reminders, setReminders] = useState<ReminderSchedule[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionSession[]>([]);
  const [userLinks, setUserLinks] = useState<UserLink[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [adminHistories, setAdminHistories] = useState<Array<{ user: Usuario; history: SessionRecord[]; progress?: ProgressState }>>([]);
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const [adminAccessCode, setAdminAccessCode] = useState("");
  const [dataMode, setDataMode] = useState<DataMode>(repository.mode);
  const [ready, setReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSyncStatus, setOfflineSyncStatus] = useState<OfflineSyncStatus>({
    isSupported: true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
    lastError: null,
  });
  const { settings, updateSettings } = useAppSettingsState();

  useEffect(() => {
    let isMounted = true;

    async function init() {
      await repository.bootstrap();
      if (!isMounted) return;

        const activeUser = repository.getActiveSession();
        if (activeUser) {
          setUsuario(activeUser);
          setAdminConfirmed(false);
          setAdminAccessCode("");
          try {
            setProgresso(await repository.loadProgress(activeUser.email));
        } catch {
          setProgresso(mergeProgress());
        }
        try {
          setHistory(await repository.loadSessionHistory(activeUser.email));
        } catch {
          setHistory([]);
        }
        try {
          setHelpRequests(await repository.loadHelpRequests());
        } catch {
          setHelpRequests([]);
        }
        try {
          setObservations(await repository.loadClinicalObservations());
        } catch {
          setObservations([]);
        }
        try {
          setReminders(await repository.loadReminderSchedules());
        } catch {
          setReminders([]);
        }
        try {
          setPrescriptions(await repository.loadPrescriptionSessions());
        } catch {
          setPrescriptions([]);
        }
        try {
          setUserLinks(await repository.loadUserLinks());
        } catch {
          setUserLinks([]);
        }
        try {
          setAuditLog(await repository.loadAdminAuditLog());
        } catch {
          setAuditLog([]);
        }
        if (activeUser.role !== "aluno") {
          try {
            const allHistories = await repository.loadAllHistories();
            const users = await repository.listUsers();
            const usersByEmail = new Map(users.map((item) => [item.email, item]));
            const enriched = await Promise.all(
              allHistories.map(async (entry) => ({
                user: usersByEmail.get(entry.user.email) ?? entry.user,
                history: entry.history,
                progress: await repository.loadProgress(entry.user.email),
              })),
            );
            setAdminHistories(enriched);
          } catch {
            setAdminHistories([]);
          }
        }
        setTela("dashboard");
      }

      setDataMode(repository.mode);
      setReady(true);
    }

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    applyAppSettingsToDocument(settings);
  }, [settings]);

  useEffect(() => {
    registerOfflineSupport();
    if (typeof window === "undefined") return;

    const syncOffline = () => {
      const offline = !window.navigator.onLine;
      setIsOffline(offline);
      if (!offline) {
        void repository.syncOfflineData().then(setOfflineSyncStatus).catch(() => undefined);
      }
    };
    void getOfflineSyncStatus().then(setOfflineSyncStatus).catch(() => undefined);
    const unsubscribe = subscribeOfflineSyncStatus(setOfflineSyncStatus);
    syncOffline();
    window.addEventListener("online", syncOffline);
    window.addEventListener("offline", syncOffline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", syncOffline);
      window.removeEventListener("offline", syncOffline);
    };
  }, []);

  useEffect(() => {
    if (usuario && usuario.role !== "admin" && tela === "admin") {
      setTela("dashboard");
    }
  }, [tela, usuario]);

  useEffect(() => {
    if (usuario && usuario.role !== "admin" && tela === "adminConfirm") {
      setTela("dashboard");
    }
  }, [tela, usuario]);

  async function handleLogin(email: string, password: string) {
    const activeUser = await repository.loginUser(email, password);
    if (!activeUser) return null;

    setUsuario(activeUser);
    setAdminConfirmed(false);
    setAdminAccessCode("");
    try {
      setProgresso(await repository.loadProgress(activeUser.email));
    } catch {
      setProgresso(mergeProgress());
    }
    try {
      setHistory(await repository.loadSessionHistory(activeUser.email));
    } catch {
      setHistory([]);
    }
    try {
      setHelpRequests(await repository.loadHelpRequests());
    } catch {
      setHelpRequests([]);
    }
    try {
      setObservations(await repository.loadClinicalObservations());
    } catch {
      setObservations([]);
    }
    try {
      setReminders(await repository.loadReminderSchedules());
    } catch {
      setReminders([]);
    }
    try {
      setPrescriptions(await repository.loadPrescriptionSessions());
    } catch {
      setPrescriptions([]);
    }
    try {
      setUserLinks(await repository.loadUserLinks());
    } catch {
      setUserLinks([]);
    }
    try {
      setAuditLog(await repository.loadAdminAuditLog());
    } catch {
      setAuditLog([]);
    }
    if (activeUser.role !== "aluno") {
      try {
        const allHistories = await repository.loadAllHistories();
        const users = await repository.listUsers();
        const usersByEmail = new Map(users.map((item) => [item.email, item]));
        const enriched = await Promise.all(
          allHistories.map(async (entry) => ({
            user: usersByEmail.get(entry.user.email) ?? entry.user,
            history: entry.history,
            progress: await repository.loadProgress(entry.user.email),
          })),
        );
        setAdminHistories(enriched);
      } catch {
        setAdminHistories([]);
      }
    }
    setTela("dashboard");
    return activeUser;
  }

  async function handleRegister(
    email: string,
    password: string,
    idade: Usuario["idade"],
    nome: string,
    avatar: string,
    role: Exclude<Usuario["role"], "admin">,
    turma: string | null,
  ) {
    const result = await repository.registerUser(email, password, idade, nome, avatar, role, turma);
    return result.error ?? null;
  }

  function handleLogout() {
    repository.clearActiveSession();
    setUsuario(null);
    setAdminConfirmed(false);
    setAdminAccessCode("");
    setProgresso(mergeProgress());
    setHistory([]);
    setHelpRequests([]);
    setObservations([]);
    setReminders([]);
    setPrescriptions([]);
    setUserLinks([]);
    setAuditLog([]);
    setAdminHistories([]);
    setTela("login");
  }

  async function handleSaveProfile(profile: Pick<Usuario, "idade" | "nome" | "avatar"> & Partial<Pick<Usuario, "role" | "turma">>) {
    if (!usuario) return;
    const updatedUser = await repository.updateUserProfile(usuario.email, profile);
    if (updatedUser) setUsuario(updatedUser);
  }

  async function openAdminArea(accessCode = adminAccessCode) {
    const overview = await repository.loadAdminOverview(accessCode);
    setAdminHistories(overview.histories);
    setHelpRequests(overview.helpRequests);
    setObservations(overview.observations);
    setReminders(overview.reminders ?? []);
    setPrescriptions(overview.prescriptions ?? []);
    setUserLinks(overview.userLinks ?? []);
    setAuditLog(overview.auditLog ?? []);
    setTela("admin");
  }

  async function handleOpenAdmin() {
    if (!usuario || usuario.role !== "admin") {
      setTela("dashboard");
      return;
    }

    if (!adminConfirmed) {
      setTela("adminConfirm");
      return;
    }

    await openAdminArea(adminAccessCode);
  }

  async function hydrateUserSession(activeUser: Usuario) {
    setUsuario(activeUser);
    try {
      setProgresso(await repository.loadProgress(activeUser.email));
    } catch {
      setProgresso(mergeProgress());
    }
    try {
      setHistory(await repository.loadSessionHistory(activeUser.email));
    } catch {
      setHistory([]);
    }
    try {
      setHelpRequests(await repository.loadHelpRequests());
    } catch {
      setHelpRequests([]);
    }
    try {
      setObservations(await repository.loadClinicalObservations());
    } catch {
      setObservations([]);
    }
    try {
      setReminders(await repository.loadReminderSchedules());
    } catch {
      setReminders([]);
    }
    try {
      setPrescriptions(await repository.loadPrescriptionSessions());
    } catch {
      setPrescriptions([]);
    }
    if (activeUser.role !== "aluno") {
      try {
        const allHistories = await repository.loadAllHistories();
        const users = await repository.listUsers();
        const usersByEmail = new Map(users.map((item) => [item.email, item]));
        const enriched = await Promise.all(
          allHistories.map(async (entry) => ({
            user: usersByEmail.get(entry.user.email) ?? entry.user,
            history: entry.history,
            progress: await repository.loadProgress(entry.user.email),
          })),
        );
        setAdminHistories(enriched);
      } catch {
        setAdminHistories([]);
      }
    }
  }

  async function handleAdminCodeConfirm(code: string) {
    if (!usuario) {
      const adminUser = await repository.ensureAdminUser();
      if (!adminUser) return false;
      await hydrateUserSession(adminUser);
    }

    try {
      setAdminConfirmed(true);
      setAdminAccessCode(code);
      await openAdminArea(code);
      return true;
    } catch {
      setAdminConfirmed(false);
      setAdminAccessCode("");
      return false;
    }
  }

  async function handleSubmitHelpRequest(request: { email: string; name: string; subject: string; message: string }) {
    const nextRequests = await repository.appendHelpRequest(request);
    setHelpRequests(nextRequests);
  }

  async function handleUpdateHelpStatus(requestId: string, status: HelpRequest["status"], adminReply?: string) {
    const nextRequests = await repository.updateHelpRequestStatus(requestId, status, adminReply, adminAccessCode);
    setHelpRequests(nextRequests);
    if (usuario) {
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "help_replied",
          targetEmail: nextRequests.find((item) => item.id === requestId)?.email ?? null,
          description: `Pedido de ajuda ${requestId} atualizado para ${status}.`,
        }),
      );
    }
  }

  async function handleUpdateUserStatus(email: string, status: Usuario["status"]) {
    await repository.updateManagedUserStatus(email, status, adminAccessCode);
    if (usuario) {
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "user_status_updated",
          targetEmail: email,
          description: `Status do usuario ${email} alterado para ${status}.`,
        }),
      );
    }
    const overview = await repository.loadAdminOverview(adminAccessCode);
    setAdminHistories(overview.histories);
    setHelpRequests(overview.helpRequests);
    setObservations(overview.observations);
    setReminders(overview.reminders ?? []);
    setPrescriptions(overview.prescriptions ?? []);
    setUserLinks(overview.userLinks ?? []);
    setAuditLog(overview.auditLog ?? []);
  }

  async function handleSaveObservation(
    email: string,
    category: ClinicalObservation["category"],
    note: string,
  ) {
    if (!usuario) return;
    const next = await repository.saveClinicalObservation({
      email,
      category,
      note,
      authorName: usuario.nome,
    });
    setObservations(next);
    setAuditLog(
      await repository.appendAdminAuditEntry({
        actorEmail: usuario.email,
        actorName: usuario.nome,
        action: "observation_saved",
        targetEmail: email,
        description: `Observacao ${category} atualizada para ${email}.`,
      }),
    );
  }

  async function handleResetAllTrainingData() {
    await repository.resetAllTrainingData(adminAccessCode);
    if (usuario) {
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "reset_all_training",
          targetEmail: null,
          description: "Treinamento de todos os usuarios nao administradores foi zerado.",
        }),
      );
    }
    const overview = await repository.loadAdminOverview(adminAccessCode);
    setAdminHistories(overview.histories);
    setHelpRequests(overview.helpRequests);
    setObservations(overview.observations);
    setReminders(overview.reminders ?? []);
    setPrescriptions(overview.prescriptions ?? []);
    setUserLinks(overview.userLinks ?? []);
    setAuditLog(overview.auditLog ?? []);
  }

  async function handleSaveReminder(
    input: Omit<ReminderSchedule, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) {
    const next = await repository.saveReminderSchedule(input);
    setReminders(next);
    if (usuario) {
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "reminder_saved",
          targetEmail: input.ownerEmail || null,
          description: `Rotina ${input.title} salva${input.turma ? ` para ${input.turma}` : ""}.`,
        }),
      );
    }
  }

  async function handleSavePrescription(
    input: Omit<PrescriptionSession, "id" | "createdAt" | "status">,
  ) {
    const next = await repository.savePrescriptionSession(input);
    setPrescriptions(next);
    if (usuario) {
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "prescription_saved",
          targetEmail: input.assignedToEmail,
          description: `Sessao prescrita ${input.title} para ${input.assignedToEmail}.`,
        }),
      );
    }
  }

  async function handleUpdatePrescriptionStatus(id: string, status: PrescriptionSession["status"]) {
    const next = await repository.updatePrescriptionStatus(id, status);
    setPrescriptions(next);
    if (usuario) {
      const prescription = next.find((item) => item.id === id);
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "prescription_completed",
          targetEmail: prescription?.assignedToEmail ?? null,
          description: `Sessao ${prescription?.title ?? id} marcada como ${status}.`,
        }),
      );
    }
  }

  async function handleSaveUserLink(input: Omit<UserLink, "id" | "createdAt">) {
    const next = await repository.saveUserLink(input);
    setUserLinks(next);
    if (usuario) {
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "user_link_saved",
          targetEmail: input.studentEmail,
          description: `Vinculo ${input.relationship} criado entre ${input.ownerEmail} e ${input.studentEmail}.`,
        }),
      );
    }
  }

  async function handleRestoreBackup(backup: BackupData) {
    await repository.restoreBackupData(backup);
    if (usuario) {
      setAuditLog(
        await repository.appendAdminAuditEntry({
          actorEmail: usuario.email,
          actorName: usuario.nome,
          action: "backup_restored",
          targetEmail: null,
          description: "Backup restaurado no aplicativo.",
        }),
      );
    }
    await hydrateUserSession(usuario ?? repository.getActiveSession()!);
    if (adminAccessCode) {
      await openAdminArea(adminAccessCode);
    }
  }

  function persistResult(
    mode: SessionMode,
    challengeId: number,
    score: number,
    timeSeconds: number,
    completed: boolean,
    variationIndex?: number,
  ) {
    if (!usuario) return;

    const currentProgress = progresso[mode][challengeId];
    const nextBest = Math.max(currentProgress.bestScore, score);
    const improvement = nextBest - currentProgress.bestScore;

    const updatedProgress: ProgressState = {
      ...progresso,
      [mode]: {
        ...progresso[mode],
        [challengeId]: {
          attempts: currentProgress.attempts + 1,
          bestScore: nextBest,
          lastScore: score,
          bestTimeSeconds:
            currentProgress.bestTimeSeconds === null
              ? timeSeconds
              : Math.min(currentProgress.bestTimeSeconds, timeSeconds),
          completed: currentProgress.completed || completed,
          lastPlayedAt: new Date().toISOString(),
          lastVariationIndex: variationIndex ?? currentProgress.lastVariationIndex,
        },
      },
    };

    void repository.saveProgress(usuario.email, updatedProgress);
    setProgresso(updatedProgress);
    void repository
      .appendSessionHistory(usuario.email, {
        mode,
        challengeId,
        score,
        timeSeconds,
        completed,
        playedAt: new Date().toISOString(),
      })
      .then((nextHistory) => setHistory(nextHistory));

    if (improvement > 0) {
      void repository.updateUserPoints(usuario.email, improvement).then((updatedUser) => {
        if (updatedUser) setUsuario(updatedUser);
      });
    }
  }

  function persistVariation(
    mode: SessionMode,
    challengeId: number,
    variationIndex: number,
  ) {
    if (!usuario) return;

    const currentProgress = progresso[mode][challengeId];
    if (currentProgress.lastVariationIndex === variationIndex) return;

    const updatedProgress: ProgressState = {
      ...progresso,
      [mode]: {
        ...progresso[mode],
        [challengeId]: {
          ...currentProgress,
          lastVariationIndex: variationIndex,
        },
      },
    };

    void repository.saveProgress(usuario.email, updatedProgress);
    setProgresso(updatedProgress);
  }

  if (!ready) {
    return (
      <main className="shell shell-center">
        <section className="auth-card">
          <p className="eyebrow">Carregando</p>
          <h1>Preparando sua rotina de treino</h1>
          <p className="muted">Estamos restaurando sua sessao e seu progresso salvo.</p>
        </section>
      </main>
    );
  }

  if (!usuario) {
    if (tela === "adminConfirm") {
      return <AdminConfirmScreen usuario={null} onBack={() => setTela("login")} onConfirm={handleAdminCodeConfirm} />;
    }

    return (
      <AuthScreen
        tela={
          tela === "dashboard" ||
          tela === "testesAvancados" ||
          tela === "memoria" ||
          tela === "memoriaAvancada" ||
          tela === "visual" ||
          tela === "atencao" ||
          tela === "atencaoAvancada" ||
          tela === "comparacao" ||
          tela === "comparacaoAvancada" ||
          tela === "espacial" ||
          tela === "espacialAvancada" ||
          tela === "logica" ||
          tela === "logicaAvancada" ||
          tela === "perfil" ||
          tela === "especial" ||
          tela === "ajuda" ||
          tela === "admin"
            ? "login"
            : tela
        }
        onChangeScreen={(screen) => setTela(screen)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onRecover={repository.simulateRecovery}
      />
    );
  }

  if (tela === "memoria") {
    return (
      <MemoryGame
        usuario={usuario}
        progresso={progresso.memoria}
        onBack={() => setTela("dashboard")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("memoria", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("memoria", challengeId, score, timeSeconds, completed, variationIndex)
        }
      />
    );
  }

  if (tela === "memoriaAvancada") {
    return (
      <MemoryGame
        usuario={usuario}
        progresso={progresso.memoria}
        onBack={() => setTela("testesAvancados")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("memoria", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("memoria", challengeId, score, timeSeconds, completed, variationIndex)
        }
        isAdvancedMode
      />
    );
  }

  if (tela === "visual") {
    return (
      <VisualMemoryGame
        usuario={usuario}
        progresso={progresso.visual}
        onBack={() => setTela("dashboard")}
        onRememberVariation={(challengeId, variationIndex) => persistVariation("visual", challengeId, variationIndex)}
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("visual", challengeId, score, timeSeconds, completed, variationIndex)
        }
      />
    );
  }

  if (tela === "atencao") {
    return (
      <AttentionGame
        usuario={usuario}
        progresso={progresso.atencao}
        onBack={() => setTela("dashboard")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("atencao", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("atencao", challengeId, score, timeSeconds, completed, variationIndex)
        }
      />
    );
  }

  if (tela === "atencaoAvancada") {
    return (
      <AttentionGame
        usuario={usuario}
        progresso={progresso.atencao}
        onBack={() => setTela("testesAvancados")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("atencao", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("atencao", challengeId, score, timeSeconds, completed, variationIndex)
        }
        isAdvancedMode
      />
    );
  }

  if (tela === "comparacao") {
    return (
      <ComparisonGame
        usuario={usuario}
        progresso={progresso.comparacao}
        onBack={() => setTela("dashboard")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("comparacao", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("comparacao", challengeId, score, timeSeconds, completed, variationIndex)
        }
      />
    );
  }

  if (tela === "comparacaoAvancada") {
    return (
      <ComparisonGame
        usuario={usuario}
        progresso={progresso.comparacao}
        onBack={() => setTela("testesAvancados")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("comparacao", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("comparacao", challengeId, score, timeSeconds, completed, variationIndex)
        }
        isAdvancedMode
      />
    );
  }

  if (tela === "espacial") {
    return (
      <SpatialGame
        usuario={usuario}
        progresso={progresso.espacial}
        onBack={() => setTela("dashboard")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("espacial", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("espacial", challengeId, score, timeSeconds, completed, variationIndex)
        }
      />
    );
  }

  if (tela === "espacialAvancada") {
    return (
      <SpatialGame
        usuario={usuario}
        progresso={progresso.espacial}
        onBack={() => setTela("testesAvancados")}
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("espacial", challengeId, variationIndex)
        }
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("espacial", challengeId, score, timeSeconds, completed, variationIndex)
        }
        isAdvancedMode
      />
    );
  }

  if (tela === "logica") {
    return (
      <LogicGame
        usuario={usuario}
        progresso={progresso.logica}
        onBack={() => setTela("dashboard")}
        onRememberVariation={(challengeId, variationIndex) => persistVariation("logica", challengeId, variationIndex)}
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("logica", challengeId, score, timeSeconds, completed, variationIndex)
        }
      />
    );
  }

  if (tela === "logicaAvancada") {
    return (
      <LogicGame
        usuario={usuario}
        progresso={progresso.logica}
        onBack={() => setTela("testesAvancados")}
        onRememberVariation={(challengeId, variationIndex) => persistVariation("logica", challengeId, variationIndex)}
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("logica", challengeId, score, timeSeconds, completed, variationIndex)
        }
        isAdvancedMode
      />
    );
  }

  if (tela === "especial") {
    return (
      <AudienceGame
        usuario={usuario}
        progresso={progresso.especial}
        onBack={() => setTela("dashboard")}
        onSaveResult={(challengeId, score, timeSeconds, completed, variationIndex) =>
          persistResult("especial", challengeId, score, timeSeconds, completed, variationIndex)
        }
        onRememberVariation={(challengeId, variationIndex) =>
          persistVariation("especial", challengeId, variationIndex)
        }
      />
    );
  }

  if (tela === "perfil") {
    return <ProfileScreen usuario={usuario} onBack={() => setTela("dashboard")} onSaveProfile={handleSaveProfile} />;
  }

  if (tela === "testesAvancados") {
    return (
      <AdvancedTestsPanel
        onBack={() => setTela("dashboard")}
        onOpenMemory={() => setTela("memoriaAvancada")}
        onOpenAttention={() => setTela("atencaoAvancada")}
        onOpenComparison={() => setTela("comparacaoAvancada")}
        onOpenSpatial={() => setTela("espacialAvancada")}
        onOpenLogic={() => setTela("logicaAvancada")}
      />
    );
  }

  if (tela === "adminConfirm") {
    return (
      <AdminConfirmScreen
        usuario={usuario}
        onBack={() => setTela("dashboard")}
        onConfirm={handleAdminCodeConfirm}
      />
    );
  }

  if (tela === "admin") {
    return (
      <AdminScreen
        usuario={usuario}
        progressoAtual={progresso}
        histories={adminHistories}
        helpRequests={helpRequests}
        observations={observations}
        reminders={reminders}
        prescriptions={prescriptions}
        userLinks={userLinks}
        auditLog={auditLog}
        onBack={() => setTela("dashboard")}
        onUpdateHelpStatus={handleUpdateHelpStatus}
        onUpdateUserStatus={handleUpdateUserStatus}
        onResetAllTrainingData={handleResetAllTrainingData}
        onSaveObservation={handleSaveObservation}
        onSaveUserLink={handleSaveUserLink}
        onExportBackup={() => repository.exportBackupData()}
        onRestoreBackup={handleRestoreBackup}
      />
    );
  }

  if (tela === "ajuda") {
    return (
      <HelpScreen
        usuario={usuario}
        requests={helpRequests.filter((item) => item.email === usuario.email)}
        onBack={() => setTela("dashboard")}
        onSubmit={handleSubmitHelpRequest}
      />
    );
  }

  return (
    <Dashboard
      usuario={usuario}
      progresso={progresso}
      history={history}
      managedHistories={adminHistories}
      observations={observations}
      reminders={reminders}
      prescriptions={prescriptions}
      userLinks={userLinks}
      settings={settings}
      isOffline={isOffline}
      offlineSyncStatus={offlineSyncStatus}
      onUpdateSettings={updateSettings}
      onSaveReminder={handleSaveReminder}
      onSavePrescription={handleSavePrescription}
      onUpdatePrescriptionStatus={handleUpdatePrescriptionStatus}
      onOpenMemory={() => setTela("memoria")}
      onOpenVisual={() => setTela("visual")}
      onOpenAttention={() => setTela("atencao")}
      onOpenComparison={() => setTela("comparacao")}
      onOpenSpatial={() => setTela("espacial")}
      onOpenLogic={() => setTela("logica")}
      onOpenProfile={() => setTela("perfil")}
      onOpenSpecial={() => setTela("especial")}
      onOpenAdvanced={() => setTela("testesAvancados")}
      onOpenHelp={() => setTela("ajuda")}
      onOpenAdmin={handleOpenAdmin}
      onLogout={handleLogout}
    />
  );
}
