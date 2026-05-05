"use client";

import { useState } from "react";

import { getAudienceLabel, getAudienceFromAge } from "@/lib/scoring";
import type { Usuario } from "@/lib/types";

type OnboardingScreenProps = {
  usuario: Usuario;
  onSave: (
    profile: Pick<Usuario, "idade" | "nome" | "avatar"> &
      Partial<Pick<Usuario, "goal" | "selfReportedLevel" | "weeklyAvailability" | "onboardingCompletedAt">>,
  ) => void | Promise<void>;
};

const goalOptions: Array<{ value: NonNullable<Usuario["goal"]>; label: string; description: string }> = [
  { value: "rotina", label: "Criar rotina", description: "Ganhar constância com sessões curtas e frequentes." },
  { value: "memoria", label: "Fortalecer memória", description: "Priorizar evocação, consolidação e revisão." },
  { value: "atencao", label: "Melhorar atenção", description: "Treinar foco, ritmo e redução de impulsos." },
  { value: "pedagogico", label: "Reforço pedagógico", description: "Usar o treino como apoio escolar e de organização." },
];

const levelOptions: Array<{ value: NonNullable<Usuario["selfReportedLevel"]>; label: string; description: string }> = [
  { value: "iniciante", label: "Iniciante", description: "Quero começar leve e ganhar confiança." },
  { value: "intermediario", label: "Intermediário", description: "Já consigo manter uma rotina moderada." },
  { value: "avancado", label: "Avançado", description: "Quero desafios mais puxados e ritmo alto." },
];

export function OnboardingScreen({ usuario, onSave }: OnboardingScreenProps) {
  const [goal, setGoal] = useState<NonNullable<Usuario["goal"]>>(usuario.goal ?? "rotina");
  const [selfReportedLevel, setSelfReportedLevel] = useState<NonNullable<Usuario["selfReportedLevel"]>>(
    usuario.selfReportedLevel ?? "iniciante",
  );
  const [weeklyAvailability, setWeeklyAvailability] = useState(String(usuario.weeklyAvailability ?? 3));
  const [mensagem, setMensagem] = useState("");
  const currentAudience = getAudienceFromAge(usuario.idade);

  async function handleContinue() {
    const weeklyAvailabilityNumber = Number(weeklyAvailability);
    if (!Number.isInteger(weeklyAvailabilityNumber) || weeklyAvailabilityNumber < 1 || weeklyAvailabilityNumber > 7) {
      setMensagem("Informe quantos dias por semana você consegue treinar, entre 1 e 7.");
      return;
    }

    await onSave({
      idade: usuario.idade,
      nome: usuario.nome,
      avatar: usuario.avatar,
      goal,
      selfReportedLevel,
      weeklyAvailability: weeklyAvailabilityNumber,
      onboardingCompletedAt: new Date().toISOString(),
    });
  }

  return (
    <main className="shell shell-center">
      <section className="auth-card onboarding-card">
        <div className="hero-block">
          <div>
            <p className="eyebrow">Primeiro acesso</p>
            <h1>{`Vamos montar sua rotina, ${usuario.nome}`}</h1>
            <p className="muted">
              Responda rápido para o app sugerir um caminho inicial, destacar o próximo treino e adaptar melhor a experiência.
            </p>
          </div>
          <div className="hero-badge">{getAudienceLabel(currentAudience)}</div>
        </div>

        <section className="panel onboarding-panel">
          <div className="section-head">
            <h3>1. Qual o seu foco principal agora?</h3>
            <span className="small-muted">Isso ajuda a orientar as recomendacoes iniciais.</span>
          </div>
          <div className="onboarding-choice-grid">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`onboarding-choice-card ${goal === option.value ? "onboarding-choice-card-active" : ""}`}
                onClick={() => {
                  setMensagem("");
                  setGoal(option.value);
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel onboarding-panel">
          <div className="section-head">
            <h3>2. Como você se percebe hoje no treino?</h3>
            <span className="small-muted">O nível inicial ajusta o tom da recomendação.</span>
          </div>
          <div className="onboarding-choice-grid">
            {levelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`onboarding-choice-card ${selfReportedLevel === option.value ? "onboarding-choice-card-active" : ""}`}
                onClick={() => {
                  setMensagem("");
                  setSelfReportedLevel(option.value);
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel onboarding-panel">
          <div className="section-head">
            <h3>3. Quantos dias por semana você consegue treinar?</h3>
            <span className="small-muted">Vamos usar isso para sugerir uma rotina mais realista.</span>
          </div>
          <label className="field">
            <span>Dias por semana</span>
            <input
              type="number"
              min={1}
              max={7}
              value={weeklyAvailability}
              onChange={(event) => {
                setMensagem("");
                setWeeklyAvailability(event.target.value);
              }}
            />
          </label>
          <div className="profile-summary">
            <div className="profile-chip">
              <strong>Objetivo atual</strong>
              <span>{goalOptions.find((item) => item.value === goal)?.label}</span>
            </div>
            <div className="profile-chip">
              <strong>Nível inicial</strong>
              <span>{levelOptions.find((item) => item.value === selfReportedLevel)?.label}</span>
            </div>
            <div className="profile-chip">
              <strong>Rotina sugerida</strong>
              <span>{`${weeklyAvailability || "3"} dia(s) por semana`}</span>
            </div>
          </div>
        </section>

        {mensagem ? <p className="notice">{mensagem}</p> : null}

        <div className="button-row">
          <button className="btn btn-primary" onClick={handleContinue}>
            Entrar no meu painel
          </button>
        </div>
      </section>
    </main>
  );
}
