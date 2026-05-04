"use client";

import { useMemo, useState } from "react";

import { getSessionModeLabel } from "@/lib/scoring";
import { getAutomaticDiagnostic, getGuidedSessions, getSmartRecommendation } from "@/lib/training-insights";
import type { ProgressState, SessionRecord, Usuario } from "@/lib/types";

type Objective =
  | "diagnostico"
  | "foco"
  | "memoria"
  | "raciocinio"
  | "terapeutico";

type InternalAssistantProps = {
  usuario: Usuario;
  progresso: ProgressState;
  history: SessionRecord[];
  onOpenMemory: () => void;
  onOpenAttention: () => void;
  onOpenComparison: () => void;
  onOpenSpatial: () => void;
  onOpenLogic: () => void;
  onOpenSpecial: () => void;
};

export function InternalAssistant({
  usuario,
  progresso,
  history,
  onOpenMemory,
  onOpenAttention,
  onOpenComparison,
  onOpenSpatial,
  onOpenLogic,
  onOpenSpecial,
}: InternalAssistantProps) {
  const [objective, setObjective] = useState<Objective>("diagnostico");
  const diagnostic = getAutomaticDiagnostic(usuario.idade, history, progresso);
  const recommendation = getSmartRecommendation(history, progresso);
  const guidedPlans = getGuidedSessions(usuario.idade, history, progresso);

  const assistantResponse = useMemo(() => {
    if (objective === "foco") {
      return {
        title: "Sugestão para foco e atenção",
        summary: "A melhor entrada agora é um bloco curto de atenção seletiva, seguido por comparação leve para sustentar critério.",
        actionMode: "atencao" as const,
        actionLabel: "Abrir atenção",
      };
    }
    if (objective === "memoria") {
      return {
        title: "Sugestão para memória",
        summary: `O diagnostico atual indica comecar em ${diagnostic.starters.find((item) => item.mode === "memoria")?.challengeName ?? "memoria"} e combinar com memória visual quando possivel.`,
        actionMode: "memoria" as const,
        actionLabel: "Abrir memória",
      };
    }
    if (objective === "raciocinio") {
      return {
        title: "Sugestão para raciocínio",
        summary: "Comparação e lógica devem abrir a sessão, porque elas organizam critério, padrão e tomada de decisão sob tempo.",
        actionMode: recommendation.mode === "comparacao" || recommendation.mode === "logica" ? recommendation.mode : "logica",
        actionLabel:
          recommendation.mode === "comparacao" || recommendation.mode === "logica" ? `Abrir ${getSessionModeLabel(recommendation.mode)}` : "Abrir lógica",
      };
    }
    if (objective === "terapeutico") {
      return {
        title: "Sugestão para uso terapêutico",
        summary: `${guidedPlans[0]?.title ?? "Treino curto"} funciona bem com baixa carga inicial, pausas curtas e foco em concluir sem pressa.`,
        actionMode: "especial" as const,
        actionLabel: "Abrir trilha exclusiva",
      };
    }
    return {
      title: diagnostic.title,
      summary: `${diagnostic.summary} Estado atual: ${diagnostic.readinessLabel}.`,
      actionMode: recommendation.mode,
      actionLabel: `Abrir ${getSessionModeLabel(recommendation.mode)}`,
    };
  }, [diagnostic, guidedPlans, objective, recommendation.mode]);

  function openAction() {
    if (assistantResponse.actionMode === "memoria") return onOpenMemory();
    if (assistantResponse.actionMode === "atencao") return onOpenAttention();
    if (assistantResponse.actionMode === "comparacao") return onOpenComparison();
    if (assistantResponse.actionMode === "espacial") return onOpenSpatial();
    if (assistantResponse.actionMode === "logica") return onOpenLogic();
    return onOpenSpecial();
  }

  return (
    <section className="panel">
      <div className="section-head">
        <h3>Assistente interno</h3>
        <span className="small-muted">Sugere trilhas conforme idade, objetivo e desempenho</span>
      </div>
      <div className="trail-tabs" role="tablist" aria-label="Objetivos do assistente">
        {[
          ["diagnostico", "Diagnóstico"],
          ["foco", "Foco"],
          ["memoria", "Memória"],
          ["raciocinio", "Raciocínio"],
          ["terapeutico", "Terapêutico"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`trail-tab ${objective === id ? "trail-tab-active" : ""}`}
            onClick={() => setObjective(id as Objective)}
          >
            <span className="trail-tab-label">{label}</span>
          </button>
        ))}
      </div>
      <article className="assistant-card">
        <h3>{assistantResponse.title}</h3>
        <p className="muted">{assistantResponse.summary}</p>
        <p className="small-muted">{`Sugestao atual do desempenho: ${recommendation.challengeName} em ${getSessionModeLabel(recommendation.mode)}.`}</p>
        <button className="btn btn-primary" onClick={openAction}>
          {assistantResponse.actionLabel}
        </button>
      </article>
    </section>
  );
}
