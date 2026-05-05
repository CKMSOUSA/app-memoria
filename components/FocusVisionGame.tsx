"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { SoundToggle, useSoundFeedback } from "@/components/SoundToggle";
import { TimerDisplay } from "@/components/TimerDisplay";
import { focusVisionChallenges } from "@/lib/game-data-v3";
import { evaluateFocusVisionRound, getNextVariationIndex } from "@/lib/game-logic";
import { getCompletionRate, getNivel, isChallengeUnlockedFlex } from "@/lib/scoring";
import type { FocusVisionChallenge, ProgressState, Usuario } from "@/lib/types";

type FocusVisionGameProps = {
  usuario: Usuario;
  progresso: ProgressState["visaoFocada"];
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
type Cell = { value: string; isTarget: boolean; ring: "central" | "periferico" };

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function buildFocusGrid(challenge: FocusVisionChallenge, variationIndex: number): Cell[] {
  const variation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const totalCells = variation.gridSize * variation.gridSize;
  const centerIndex = Math.floor(totalCells / 2);
  const targetCells: Cell[] = Array.from({ length: variation.targetCount }, () => ({
    value: variation.alvo,
    isTarget: true,
    ring: "periferico" as const,
  }));
  const distractorCells: Cell[] = Array.from({ length: totalCells - targetCells.length - 1 }, (_, index) => ({
    value: variation.distratores[index % variation.distratores.length] ?? variation.distratores[0],
    isTarget: false,
    ring: "periferico" as const,
  }));
  const mixed = shuffle([...targetCells, ...distractorCells]);
  mixed.splice(centerIndex, 0, { value: "●", isTarget: false, ring: "central" });
  return mixed;
}

function getLevelCaption(challenge: FocusVisionChallenge) {
  if (challenge.unlockGroup === "iniciante") return "Iniciante";
  if (challenge.unlockGroup === "intermediario") return "Intermediário";
  return "Avançado";
}

export function FocusVisionGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
}: FocusVisionGameProps) {
  const challengeList: FocusVisionChallenge[] = focusVisionChallenges;
  const challengeIds = challengeList.map((item) => item.id);
  const firstChallengeId = challengeList[0]?.id ?? 1;
  const [selectedId, setSelectedId] = useState(firstChallengeId);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [foundTargets, setFoundTargets] = useState<number[]>([]);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<ReturnType<typeof evaluateFocusVisionRound> | null>(null);
  const progressRef = useRef(progresso);
  const startedAtRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const { soundEnabled, toggleSound, playAnswerSound, playResultSound } = useSoundFeedback();

  const challenge = useMemo(
    () => challengeList.find((item) => item.id === selectedId) ?? challengeList[0],
    [challengeList, selectedId],
  );
  const variation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const challengeNumber = challengeIds.indexOf(challenge.id) + 1;
  const targetIndexes = useMemo(
    () => grid.map((cell, index) => (cell.isTarget ? index : -1)).filter((index) => index >= 0),
    [grid],
  );
  const levelRate = getCompletionRate(
    Object.fromEntries(
      challengeList
        .filter((item) => item.unlockGroup === challenge.unlockGroup)
        .map((item) => [item.id, progresso[item.id]]),
    ),
  );

  useEffect(() => {
    progressRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    setSelectedId((current) => (challengeIds.includes(current) ? current : firstChallengeId));
  }, [challengeIds, firstChallengeId]);

  useEffect(() => {
    const savedVariationIndex = progressRef.current[selectedId]?.lastVariationIndex ?? null;
    const nextVariationIndex = getNextVariationIndex(challenge.variacoes.length, savedVariationIndex);
    setVariationIndex(nextVariationIndex);
    setGrid(buildFocusGrid(challenge, nextVariationIndex));
    setPhase("idle");
    setTimeLeft(0);
    setFoundTargets([]);
    setWrongClicks(0);
    setFeedback("");
    setReview(null);
    submittedRef.current = false;
    startedAtRef.current = null;
  }, [challenge, selectedId]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, onRememberVariation, variationIndex]);

  function finishRound() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const elapsedSeconds = startedAtRef.current
      ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
      : Math.max(1, challenge.tempoLimite - timeLeft);
    const result = evaluateFocusVisionRound({
      foundCount: foundTargets.length,
      totalTargets: targetIndexes.length,
      wrongClicks,
      elapsedSeconds,
      timeLimit: challenge.tempoLimite,
      minimumToComplete: challenge.minimoParaConcluir,
    });

    setPhase("result");
    setReview(result);
    setFeedback(
      result.completed
        ? `Sua visão periférica atingiu ${result.peripheralScore}% nesta rodada.`
        : `Sua visão periférica ficou em ${result.peripheralScore}%. Tente varrer o entorno sem sair do centro.`,
    );
    playResultSound(result.completed, result.completed ? "precision" : wrongClicks > 0 ? "warning" : "timeout");
    onSaveResult(challenge.id, result.score, elapsedSeconds, result.completed, variationIndex);
  }

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finishRound();
      return;
    }
    const timeout = window.setTimeout(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timeout);
  });

  useEffect(() => {
    if (phase === "playing" && targetIndexes.length > 0 && foundTargets.length === targetIndexes.length) {
      finishRound();
    }
  });

  function startRound() {
    setGrid(buildFocusGrid(challenge, variationIndex));
    setPhase("playing");
    setTimeLeft(challenge.tempoLimite);
    setFoundTargets([]);
    setWrongClicks(0);
    setFeedback("Fixe o ponto central. Use a periferia para localizar o alvo.");
    setReview(null);
    submittedRef.current = false;
    startedAtRef.current = Date.now();
  }

  function resetRound() {
    const nextVariationIndex = getNextVariationIndex(challenge.variacoes.length, variationIndex);
    setVariationIndex(nextVariationIndex);
    setGrid(buildFocusGrid(challenge, nextVariationIndex));
    setPhase("idle");
    setTimeLeft(0);
    setFoundTargets([]);
    setWrongClicks(0);
    setFeedback("");
    setReview(null);
    submittedRef.current = false;
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

  function handleCellClick(index: number) {
    if (phase !== "playing") return;
    const cell = grid[index];
    if (!cell || cell.ring === "central" || foundTargets.includes(index)) return;

    playAnswerSound();
    if (cell.isTarget) {
      setFoundTargets((current) => [...current, index]);
      return;
    }
    setWrongClicks((current) => current + 1);
  }

  return (
    <main className="shell shell-center">
      <section className="game-card focus-vision-game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Trilha de visão focada</p>
            <h1>Ache o alvo sem perder o centro</h1>
            <p className="muted">
              Treine foco central e varredura periférica: mantenha o ponto como referência e encontre detalhes ao redor.
            </p>
          </div>
          <div className="button-row">
            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
            <button className="btn btn-secondary" onClick={onBack}>
              Voltar ao painel
            </button>
          </div>
        </header>

        <section className="panel">
          <div className="section-head">
            <h3>Modelo híbrido inteligente</h3>
            <span className="small-muted">Nível atual: {getNivel(usuario.pontos)}</span>
          </div>
          <div className="focus-path-summary">
            <span>Sequência: Iniciante → Intermediário → Avançado</span>
            <span>Cadeado flexível: 70% de score, conclusão ou 3 tentativas</span>
            <span>Exploração: fases paralelas do mesmo nível ficam disponíveis conforme o avanço</span>
          </div>
          <div className="tabs-grid focus-tabs-grid">
            {challengeList.map((item) => {
              const unlocked = isChallengeUnlockedFlex(progresso, challengeIds, item.id);
              const progress = progresso[item.id];
              const status = progress.completed ? "Concluído" : unlocked ? "Liberado" : "Bloqueado leve";
              return (
                <button
                  key={item.id}
                  className={`tab-card ${item.id === challenge.id ? "tab-card-active" : ""}`}
                  disabled={!unlocked}
                  onClick={() => setSelectedId(item.id)}
                >
                  <strong>{`Jogo ${item.id} - ${item.difficultyLabel}`}</strong>
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
                <h3>Correção da varredura</h3>
                <p className="muted">{feedback}</p>
              </div>
              <span className="pill">Score {review.score}</span>
            </div>
            <ReviewMetrics
              items={[
                { label: "Visão periférica", value: `${review.peripheralScore}%` },
                { label: "Alvos", value: `${review.foundCount}/${review.totalTargets}` },
                { label: "Erros", value: String(review.wrongClicks) },
              ]}
              note={`Progresso do nível ${getLevelCaption(challenge)}: ${levelRate}% concluído. A meta é ampliar a varredura sem perder o centro.`}
            />
            <div className="button-row">
              <button className="btn btn-primary" onClick={startRound}>
                Jogar novamente
              </button>
              <button className="btn btn-secondary" onClick={advanceRound}>
                Avançar
              </button>
              <button className="btn btn-secondary" onClick={resetRound}>
                Trocar variação
              </button>
            </div>
          </section>
        ) : (
          <div className="game-grid focus-vision-layout">
            <section className="panel">
              <div className="section-head">
                <h3>{challenge.nome}</h3>
                <span className="small-muted">{`${getLevelCaption(challenge)} · jogo ${challengeNumber} de ${challengeList.length}`}</span>
              </div>
              <GameGuide
                title="Como jogar"
                objective="Ache o alvo ao redor do ponto central sem fixar longamente em cada letra."
                steps={[
                  "Confira o alvo antes de iniciar.",
                  "Mantenha o ponto central como âncora visual.",
                  "Use a visão periférica para varrer o cenário.",
                  "Clique apenas nos alvos corretos antes do tempo acabar.",
                ]}
                tip="Se perceber que está caçando letra por letra, volte ao ponto central e faça uma varredura ampla."
                isChild={usuario.idade <= 10}
              />
              <div className="attention-banner">
                <strong>Alvo</strong>
                <div className="target-pill">{variation.alvo}</div>
              </div>
              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${challenge.minimoParaConcluir}/${variation.targetCount} alvos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Grade</strong>
                  <span>{`${variation.gridSize} x ${variation.gridSize}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Tempo</strong>
                  <span>{`${challenge.tempoLimite}s`}</span>
                </div>
              </div>
              <p className="review-note">{feedback || challenge.descricao}</p>
            </section>

            <section className="panel focus-board-panel">
              <div className="section-head">
                <h3>Campo visual</h3>
                <TimerDisplay
                  label="Tempo"
                  value={phase === "playing" ? `${timeLeft}s` : "--"}
                  tone={phase === "playing" && timeLeft <= 10 ? "warning" : phase === "playing" ? "active" : "neutral"}
                />
              </div>
              <div className="button-row round-controls">
                <button className="btn btn-primary btn-round-start" onClick={startRound} disabled={phase === "playing"}>
                  {phase === "playing" ? "Rodada em andamento" : "Iniciar rodada"}
                </button>
                <button className="btn btn-secondary" onClick={resetRound}>
                  Trocar variação
                </button>
              </div>
              <div className="focus-vision-stats">
                <span>{`${foundTargets.length}/${targetIndexes.length} alvos`}</span>
                <span>{`${wrongClicks} erros`}</span>
              </div>
              <div
                className="focus-vision-grid"
                style={{ gridTemplateColumns: `repeat(${variation.gridSize}, minmax(0, 1fr))` }}
              >
                {grid.map((cell, index) => {
                  const found = foundTargets.includes(index);
                  return (
                    <button
                      key={`${cell.value}-${index}`}
                      className={`focus-vision-cell ${cell.ring === "central" ? "focus-vision-center" : ""} ${found ? "focus-vision-hit" : ""}`}
                      disabled={phase !== "playing" || cell.ring === "central" || found}
                      onClick={() => handleCellClick(index)}
                    >
                      {cell.value}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
