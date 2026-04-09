"use client";

import { useEffect, useState } from "react";
import { AttentionGame } from "@/components/AttentionGame";
import { AdminScreen } from "@/components/AdminScreen";
import { AudienceGame } from "@/components/AudienceGame";
import { AuthScreen } from "@/components/AuthScreen";
import { ComparisonGame } from "@/components/ComparisonGame";
import { Dashboard } from "@/components/Dashboard";
import { HelpScreen } from "@/components/HelpScreen";
import { LogicGame } from "@/components/LogicGame";
import type { HelpRequest } from "@/lib/types";
import { MemoryGame } from "@/components/MemoryGame";
import { ProfileScreen } from "@/components/ProfileScreen";
import { SpatialGame } from "@/components/SpatialGame";
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
  const [adminHistories, setAdminHistories] = useState<Array<{ user: Usuario; history: SessionRecord[]; progress?: ProgressState }>>([]);
  const [dataMode, setDataMode] = useState<DataMode>(repository.mode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      await repository.bootstrap();
      if (!isMounted) return;

      const activeUser = repository.getActiveSession();
      if (activeUser) {
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

  async function handleLogin(email: string, password: string) {
    const activeUser = await repository.loginUser(email, password);
    if (!activeUser) return null;

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
    setTela("dashboard");
    return activeUser;
  }

  async function handleRegister(email: string, password: string, idade: Usuario["idade"], nome: string, avatar: string) {
    const result = await repository.registerUser(email, password, idade, nome, avatar);
    return result.error ?? null;
  }

  function handleLogout() {
    repository.clearActiveSession();
    setUsuario(null);
    setProgresso(mergeProgress());
    setHistory([]);
    setHelpRequests([]);
    setAdminHistories([]);
    setTela("login");
  }

  async function handleSaveProfile(profile: Pick<Usuario, "idade" | "nome" | "avatar">) {
    if (!usuario) return;
    const updatedUser = await repository.updateUserProfile(usuario.email, profile);
    if (updatedUser) setUsuario(updatedUser);
  }

  async function handleOpenAdmin() {
    const allUsers = await repository.listUsers();
    const histories = await repository.loadAllHistories();
    const nextAdminHistories = await Promise.all(
      allUsers.map(async (userItem) => {
        const existing = histories.find((item) => item.user.email === userItem.email);
        let progressForUser = mergeProgress();
        try {
          progressForUser = await repository.loadProgress(userItem.email);
        } catch {
          progressForUser = mergeProgress();
        }

        return {
          user: userItem,
          history: existing?.history ?? [],
          progress: progressForUser,
        };
      }),
    );

    setAdminHistories(nextAdminHistories);
    setTela("admin");
  }

  async function handleSubmitHelpRequest(request: { email: string; name: string; subject: string; message: string }) {
    const nextRequests = await repository.appendHelpRequest(request);
    setHelpRequests(nextRequests);
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
    return (
      <AuthScreen
        tela={
          tela === "dashboard" ||
          tela === "memoria" ||
          tela === "atencao" ||
          tela === "comparacao" ||
          tela === "espacial" ||
          tela === "logica" ||
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

  if (tela === "admin") {
    return (
      <AdminScreen
        usuario={usuario}
        progressoAtual={progresso}
        histories={adminHistories}
        helpRequests={helpRequests}
        onBack={() => setTela("dashboard")}
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
      onOpenMemory={() => setTela("memoria")}
      onOpenAttention={() => setTela("atencao")}
      onOpenComparison={() => setTela("comparacao")}
      onOpenSpatial={() => setTela("espacial")}
      onOpenLogic={() => setTela("logica")}
      onOpenProfile={() => setTela("perfil")}
      onOpenSpecial={() => setTela("especial")}
      onOpenHelp={() => setTela("ajuda")}
      onOpenAdmin={() => void handleOpenAdmin()}
      onLogout={handleLogout}
      dataMode={dataMode}
    />
  );
}
