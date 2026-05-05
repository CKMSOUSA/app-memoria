"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { SoundToggle, useSoundFeedback } from "@/components/SoundToggle";
import { TimerDisplay } from "@/components/TimerDisplay";
import { processChallenges } from "@/lib/game-data-v3";
import { getNextVariationIndex } from "@/lib/game-logic";
import { getNivel, isChallengeUnlockedInOrder } from "@/lib/scoring";
import type { ProcessChallenge, ProgressState, Usuario } from "@/lib/types";

type ProcessGameProps = {
  usuario: Usuario;
  progresso: ProgressState["processo"];
  onBack: () => void;
  onRememberVariation: (challengeId: number, variationIndex: number) => void;
  onSaveResult: (
    challengeId: number,
    score: number,
    timeSeconds: number,
    completed: boolean,
    variationIndex: number,
  ) => void;
};

type Phase = "idle" | "playing" | "result";
type StepRecord = { prompt: string; selected: string; correct: string; ok: boolean; feedback: string };

export function ProcessGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
}: ProcessGameProps) {
  const challengeList: ProcessChallenge[] = processChallenges;
  const challengeIds = challengeList.map((item) => item.id);
  const firstChallengeId = challengeList[0]?.id ?? 1;
  const [selectedId, setSelectedId] = useState(firstChallengeId);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepRecords, setStepRecords] = useState<StepRecord[]>([]);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<{ hits: number; mistakes: number; score: number; completed: boolean } | null>(null);
  const progressRef = useRef(progresso);
  const startedAtRef = useRef<number | null>(null);
  const { soundEnabled, toggleSound, playAnswerSound, playResultSound } = useSoundFeedback();

  const challenge = useMemo(
    () => challengeList.find((item) => item.id === selectedId) ?? challengeList[0],
    [challengeList, selectedId],
  );
  const variation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const currentStep = variation.steps[currentStepIndex] ?? variation.steps[0];
  const challengeNumber = challengeIds.indexOf(challenge.id) + 1;
  const progressPercent =
    phase === "result" ? 100 : Math.round((currentStepIndex / Math.max(variation.steps.length, 1)) * 100);

  useEffect(() => {
    progressRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    setSelectedId((current) => (challengeIds.includes(current) ? current : firstChallengeId));
  }, [challengeIds, firstChallengeId]);

  useEffect(() => {
    const savedVariationIndex = progressRef.current[selectedId]?.lastVariationIndex ?? null;
    setVariationIndex(getNextVariationIndex(challenge.variacoes.length, savedVariationIndex));
    setPhase("idle");
    setTimeLeft(0);
    setCurrentStepIndex(0);
    setStepRecords([]);
    setFeedback("");
    setReview(null);
    startedAtRef.current = null;
  }, [challenge.variacoes.length, selectedId]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, onRememberVariation, variationIndex]);

  const finishRound = useCallback(
    (records: StepRecord[]) => {
      const hits = records.filter((item) => item.ok).length;
      const mistakes = records.length - hits;
      const elapsedSeconds = startedAtRef.current
        ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        : Math.max(challenge.tempoLimite - timeLeft, 1);
      const completed = hits >= challenge.minimoParaConcluir && hits >= variation.steps.length;
      const score = Math.max(0, hits * 12 + Math.max(0, challenge.tempoLimite - elapsedSeconds) - mistakes * 3);

      setPhase("result");
      setReview({ hits, mistakes, score, completed });
      setFeedback(
        completed
          ? "Você completou o ciclo mínimo: começou, sustentou o meio e fechou a jogada."
          : "A jogada ficou aberta. Recomece e atravesse a sequência completa antes de sair.",
      );
      playResultSound(completed, completed ? "precision" : "logic");
      onSaveResult(challenge.id, score, elapsedSeconds, completed, variationIndex);
    },
    [challenge.id, challenge.minimoParaConcluir, challenge.tempoLimite, onSaveResult, playResultSound, timeLeft, variation.steps.length, variationIndex],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finishRound(stepRecords);
      return;
    }

    const timerId = window.setTimeout(() => setTimeLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timerId);
  }, [finishRound, phase, stepRecords, timeLeft]);

  function startRound() {
    setPhase("playing");
    setTimeLeft(challenge.tempoLimite);
    setCurrentStepIndex(0);
    setStepRecords([]);
    setFeedback("Complete a sequência mínima antes de sair da jogada.");
    setReview(null);
    startedAtRef.current = Date.now();
  }

  function resetRound() {
    setVariationIndex((current) => getNextVariationIndex(challenge.variacoes.length, current));
    setPhase("idle");
    setTimeLeft(0);
    setCurrentStepIndex(0);
    setStepRecords([]);
    setFeedback("");
    setReview(null);
    startedAtRef.current = null;
  }

  function advanceRound() {
    const nextChallenge = challengeList.find((item) => item.id > challenge.id);
    if (review?.completed && nextChallenge) {
      setSelectedId(nextChallenge.id);
      return;
    }
    resetRound();
  }

  function handleAnswer(answer: string) {
    if (phase !== "playing") return;

    playAnswerSound();
    const ok = answer === currentStep.correctAnswer;
    const nextRecords = [
      ...stepRecords,
      {
        prompt: currentStep.prompt,
        selected: answer,
        correct: currentStep.correctAnswer,
        ok,
        feedback: currentStep.feedback,
      },
    ];
    setStepRecords(nextRecords);
    setFeedback(ok ? currentStep.feedback : "Essa escolha abre fuga ou indefinição. Escolha a ação que mantém o processo organizado.");

    if (!ok) return;

    if (currentStepIndex >= variation.steps.length - 1) {
      finishRound(nextRecords);
      return;
    }

    setCurrentStepIndex((current) => current + 1);
  }

  return (
    <main className="shell shell-center">
      <section className="game-card process-game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Trilha de processo</p>
            <h1>Começo, meio e fim</h1>
            <p className="muted">
              Complete uma sequência mínima antes de encerrar a jogada. O treino trabalha início, permanência e fechamento.
            </p>
          </div>
          <div className="button-row">
            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
            <button className="btn btn-secondary" onClick={onBack} disabled={phase === "playing"}>
              {phase === "playing" ? "Finalize a sequência" : "Voltar ao painel"}
            </button>
          </div>
        </header>

        <section className="panel">
          <div className="section-head">
            <h3>Escolha o desafio</h3>
            <span className="small-muted">Nível atual: {getNivel(usuario.pontos)}</span>
          </div>
          <div className="tabs-grid">
            {challengeList.map((item, index) => {
              const unlocked = isChallengeUnlockedInOrder(progresso, challengeIds, item.id);
              const progress = progresso[item.id];
              const status = progress.completed ? "Concluído" : unlocked ? "Liberado" : "Bloqueado";

              return (
                <button
                  key={item.id}
                  className={`tab-card ${item.id === challenge.id ? "tab-card-active" : ""}`}
                  disabled={!unlocked || phase === "playing"}
                  onClick={() => setSelectedId(item.id)}
                >
                  <strong>{`Fase ${index + 1} - ${item.difficultyLabel}`}</strong>
                  <span>{item.nome}</span>
                  <small>{`${status} - Melhor ${progress.bestScore}`}</small>
                </button>
              );
            })}
          </div>
        </section>

        {phase === "result" && review ? (
          <section className="review-card review-card-full">
            <div className="section-head">
              <div>
                <h3>Fechamento da jogada</h3>
                <p className="muted">{feedback}</p>
              </div>
              <span className="pill">Score {review.score}</span>
            </div>
            <ReviewMetrics
              items={[
                { label: "Etapas certas", value: String(review.hits) },
                { label: "Tentativas de fuga", value: String(review.mistakes) },
                { label: "Sequência", value: `${stepRecords.length}/${variation.steps.length}` },
              ]}
              note="O objetivo desta trilha é treinar a sensação de tarefa fechada: escolher, atravessar o meio e concluir."
            />
            <div className="review-grid">
              {stepRecords.map((record, index) => (
                <div key={`${record.prompt}-${index}`} className={`review-column ${record.ok ? "review-good" : "review-bad"}`}>
                  <strong>{`Etapa ${index + 1}`}</strong>
                  <span>{record.prompt}</span>
                  <span>{`Sua escolha: ${record.selected}`}</span>
                  <span>{`Melhor escolha: ${record.correct}`}</span>
                  <span className="small-muted">{record.feedback}</span>
                </div>
              ))}
            </div>
            <div className="button-row">
              <button className="btn btn-primary" onClick={startRound}>
                Tentar novamente
              </button>
              <button className="btn btn-secondary" onClick={advanceRound}>
                Avançar
              </button>
              <button className="btn btn-secondary" onClick={resetRound}>
                Trocar rodada
              </button>
            </div>
          </section>
        ) : (
          <div className="game-grid">
            <section className="panel">
              <div className="section-head">
                <h3>{challenge.nome}</h3>
                <span className="small-muted">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
              </div>
              <GameGuide
                title="Como jogar"
                objective="Complete todos os passos da sequência mínima. A jogada não registra conclusão se parar no meio."
                steps={[
                  "Clique em Iniciar ciclo.",
                  "Escolha a ação que abre a tarefa com clareza.",
                  "Sustente o meio escolhendo ações concretas, uma etapa por vez.",
                  "Feche a tarefa com uma confirmação de conclusão.",
                ]}
                tip="Quando errar, a etapa continua aberta. Escolha de novo até manter o processo em movimento."
                isChild={usuario.idade <= 10}
              />
              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challengeNumber} de ${challengeList.length}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${challenge.minimoParaConcluir} etapas`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Tempo</strong>
                  <span>{`${challenge.tempoLimite}s`}</span>
                </div>
              </div>
            </section>

            <section className="panel process-play-panel">
              <div className="section-head">
                <div>
                  <h3>{variation.title}</h3>
                  <span className="small-muted">{variation.context}</span>
                </div>
                <TimerDisplay
                  label="Tempo"
                  value={phase === "playing" ? `${timeLeft}s` : "--"}
                  tone={phase === "playing" && timeLeft <= 15 ? "warning" : phase === "playing" ? "active" : "neutral"}
                />
              </div>

              <div className="process-cycle-meter" aria-label={`${progressPercent}% do ciclo concluído`}>
                <span style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="process-step-card">
                <span className="pill">{currentStep.stage}</span>
                <strong>{phase === "playing" ? currentStep.prompt : "Inicie o ciclo para abrir a primeira etapa."}</strong>
                <p className="muted">{feedback || challenge.descricao}</p>
              </div>

              <div className="process-options">
                {currentStep.options.map((option) => (
                  <button key={option} className="comparison-card process-option-card" onClick={() => handleAnswer(option)} disabled={phase !== "playing"}>
                    {option}
                  </button>
                ))}
              </div>

              <div className="button-row round-controls">
                <button className="btn btn-primary btn-round-start" onClick={startRound} disabled={phase === "playing"}>
                  {phase === "playing" ? "Ciclo em andamento" : "Iniciar ciclo"}
                </button>
                <button className="btn btn-secondary" onClick={resetRound} disabled={phase === "playing"}>
                  Trocar rodada
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
