"use client";

import { useEffect, useState } from "react";
import { AttentionGame } from "@/components/AttentionGame";
import { AudienceGame } from "@/components/AudienceGame";
import { AuthScreen } from "@/components/AuthScreen";
import { ComparisonGame } from "@/components/ComparisonGame";
import { Dashboard } from "@/components/Dashboard";
import { MemoryGame } from "@/components/MemoryGame";
import { ProfileScreen } from "@/components/ProfileScreen";
import { SpatialGame } from "@/components/SpatialGame";
import { getAppRepository } from "@/lib/app-repository";
import { mergeProgress } from "@/lib/scoring";
import type { DataMode, ProgressState, Tela, Usuario } from "@/lib/types";

const repository = getAppRepository();

export default function Page() {
  const [tela, setTela] = useState<Tela>("login");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [progresso, setProgresso] = useState<ProgressState>(mergeProgress());
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
    setTela("login");
  }

  async function handleSaveProfile(profile: Pick<Usuario, "idade" | "nome" | "avatar">) {
    if (!usuario) return;
    const updatedUser = await repository.updateUserProfile(usuario.email, profile);
    if (updatedUser) setUsuario(updatedUser);
  }

  function persistResult(
    mode: "memoria" | "atencao" | "comparacao" | "espacial" | "especial",
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

    if (improvement > 0) {
      void repository.updateUserPoints(usuario.email, improvement).then((updatedUser) => {
        if (updatedUser) setUsuario(updatedUser);
      });
    }
  }

  function persistVariation(
    mode: "memoria" | "atencao" | "comparacao" | "espacial" | "especial",
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
          tela === "perfil" ||
          tela === "especial"
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

  return (
    <Dashboard
      usuario={usuario}
      progresso={progresso}
      onOpenMemory={() => setTela("memoria")}
      onOpenAttention={() => setTela("atencao")}
      onOpenComparison={() => setTela("comparacao")}
      onOpenSpatial={() => setTela("espacial")}
      onOpenProfile={() => setTela("perfil")}
      onOpenSpecial={() => setTela("especial")}
      onLogout={handleLogout}
      dataMode={dataMode}
    />
  );
}
