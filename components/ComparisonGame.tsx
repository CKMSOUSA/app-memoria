"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChildVisualBadge } from "@/components/ChildVisualBadge";
import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { comparisonChallenges } from "@/lib/game-data-v3";
import { evaluateComparisonRound, getNextVariationIndex } from "@/lib/game-logic";
import {
  getAgeLabel,
  getAudienceFromAge,
  getComparisonDifficulty,
  getNivel,
  isChallengeUnlocked,
} from "@/lib/scoring";
import type { ProgressState, Usuario } from "@/lib/types";

type ComparisonGameProps = {
  usuario: Usuario;
  progresso: ProgressState["comparacao"];
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

export function ComparisonGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
}: ComparisonGameProps) {
  const [selectedId, setSelectedId] = useState(1);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Array<"left" | "right">>([]);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<{
    hits: number[];
    mistakes: number[];
    score: number;
    completed: boolean;
  } | null>(null);

  const progressRef = useRef(progresso);
  const challenge = useMemo(
    () => comparisonChallenges.find((item) => item.id === selectedId) ?? comparisonChallenges[0],
    [selectedId],
  );
  const audience = getAudienceFromAge(usuario.idade);
  const showChildVisuals = usuario.idade <= 10;
  const variation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const rounds = usuario.idade <= 10 && variation.roundsAte10?.length ? variation.roundsAte10 : variation.rounds;
  const currentRound = rounds[currentRoundIndex] ?? rounds[0];
  const difficulty = getComparisonDifficulty({
    tempoBase: challenge.tempoLimite,
    minimoBase: challenge.minimoParaConcluir,
    idade: usuario.idade,
    progress: progresso[selectedId],
  });

  useEffect(() => {
    progressRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    const savedVariationIndex = progressRef.current[selectedId]?.lastVariationIndex ?? null;
    setVariationIndex(getNextVariationIndex(challenge.variacoes.length, savedVariationIndex));
    setPhase("idle");
    setTimeLeft(0);
    setCurrentRoundIndex(0);
    setSelectedAnswers([]);
    setFeedback("");
    setReview(null);
  }, [challenge.variacoes.length, selectedId]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, onRememberVariation, variationIndex]);

  function startRound() {
    setPhase("playing");
    setTimeLeft(difficulty.tempoLimite);
    setCurrentRoundIndex(0);
    setSelectedAnswers([]);
    setFeedback("");
    setReview(null);
  }

  function resetRound() {
    setVariationIndex((current) => getNextVariationIndex(challenge.variacoes.length, current));
    setPhase("idle");
    setTimeLeft(0);
    setCurrentRoundIndex(0);
    setSelectedAnswers([]);
    setFeedback("");
    setReview(null);
  }

  const finishRound = useCallback((answers: Array<"left" | "right">) => {
    const expectedAnswers = rounds.map((item) => item.correct);
    const elapsedSeconds = Math.max(difficulty.tempoLimite - timeLeft, 0);
    const result = evaluateComparisonRound({
      expectedAnswers,
      selectedAnswers: answers,
      answerSeconds: elapsedSeconds,
      timeLimit: difficulty.tempoLimite,
      minimumToComplete: difficulty.minimoParaConcluir,
    });

    setPhase("result");
    setFeedback(
      result.completed
        ? `Voce acertou ${result.hits.length} comparacao(oes) e concluiu a fase.`
        : `Voce acertou ${result.hits.length} comparacao(oes). Precisa de ${difficulty.minimoParaConcluir} para concluir.`,
    );
    setReview(result);
    onSaveResult(challenge.id, result.score, elapsedSeconds, result.completed, variationIndex);
  }, [
    challenge.id,
    difficulty.minimoParaConcluir,
    difficulty.tempoLimite,
    onSaveResult,
    timeLeft,
    rounds,
    variationIndex,
  ]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finishRound(selectedAnswers);
      return;
    }

    const timeout = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [finishRound, phase, selectedAnswers, timeLeft]);

  function handleAnswer(answer: "left" | "right") {
    if (phase !== "playing") return;

    const nextAnswers = [...selectedAnswers, answer];
    setSelectedAnswers(nextAnswers);

    if (currentRoundIndex >= rounds.length - 1) {
      finishRound(nextAnswers);
      return;
    }

    setCurrentRoundIndex((current) => current + 1);
  }

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Trilha de comparacao</p>
            <h1>Compare e escolha a opcao correta</h1>
            <p className="muted">
              Esta trilha treina comparacao de tamanho, quantidade, ordem e valor com fases progressivas.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar ao painel
          </button>
        </header>

        <section className="panel">
          <div className="section-head">
            <h3>Escolha o desafio</h3>
            <span className="small-muted">Nivel atual: {getNivel(usuario.pontos)}</span>
          </div>
          <div className="tabs-grid">
            {comparisonChallenges.map((item) => {
              const unlocked = isChallengeUnlocked(progresso, item.id);
              const progress = progresso[item.id];
              const status = progress.completed ? "Concluido" : unlocked ? "Liberado" : "Bloqueado";

              return (
                <button
                  key={item.id}
                  className={`tab-card ${item.id === challenge.id ? "tab-card-active" : ""}`}
                  disabled={!unlocked}
                  onClick={() => setSelectedId(item.id)}
                >
                  <strong>{`Fase ${item.id} - ${item.difficultyLabel}`}</strong>
                  <span>{audience === "infantil" && item.nomeInfantil ? item.nomeInfantil : item.nome}</span>
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
                <h3>Correcao da rodada</h3>
                <p className="muted">{feedback}</p>
              </div>
              <span className="pill">Score {review.score}</span>
            </div>
            <ReviewMetrics
              items={[
                { label: "Acertos", value: String(review.hits.length) },
                { label: "Erros", value: String(review.mistakes.length) },
                { label: "Rodadas", value: String(rounds.length) },
              ]}
              note="Leia sempre o criterio da fase antes de responder. Em comparacao, o erro mais comum e escolher rapido sem conferir a regra."
            />

            <div className="review-grid">
              {rounds.map((round, index) => {
                const userAnswer = selectedAnswers[index];
                const correct = review.hits.includes(index);
                return (
                  <div
                    key={`${round.left}-${round.right}-${index}`}
                    className={`review-column ${correct ? "review-good" : "review-bad"}`}
                  >
                    <strong>{`Comparacao ${index + 1}`}</strong>
                    <span>{`${round.left} x ${round.right}`}</span>
                    <span>{`Sua resposta: ${userAnswer === "left" ? round.left : userAnswer === "right" ? round.right : "sem resposta"}`}</span>
                    <span>{`Correta: ${round.correct === "left" ? round.left : round.right}`}</span>
                    <span className="small-muted">{round.explanation}</span>
                  </div>
                );
              })}
            </div>

            <div className="button-row">
              <button className="btn btn-primary" onClick={startRound}>
                Tentar novamente
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
                <h3>{audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}</h3>
                <span className="small-muted">{`Fase ${challenge.id} - ${challenge.difficultyLabel}`}</span>
              </div>

              <p className="muted">
                {`${getAgeLabel(usuario.idade)} - ${
                  audience === "infantil" && variation.promptInfantil ? variation.promptInfantil : variation.prompt
                }`}
              </p>

              <GameGuide
                title="Como jogar"
                objective="Leia o criterio da fase e escolha, em cada comparacao, qual lado atende melhor a esse criterio."
                steps={[
                  "Clique em Iniciar rodada para abrir a sequencia de comparacoes.",
                  "Leia o criterio da fase antes de responder.",
                  "Escolha entre a opcao esquerda e a direita em cada rodada.",
                  "No fim, compare suas respostas com a correcao explicada.",
                ]}
                tip="Algumas fases pedem o maior valor, outras o menor, a palavra mais longa ou o que vem antes. O criterio da fase e o mais importante."
                isChild={usuario.idade <= 10}
              />

              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challenge.id} de ${comparisonChallenges.length}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${difficulty.minimoParaConcluir} acertos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Rodadas</strong>
                  <span>{rounds.length}</span>
                </div>
              </div>

              <div className="status-row">
                <div className="meter-box">
                  <strong>Tempo restante</strong>
                  <span>{phase === "playing" ? `${timeLeft}s` : "Aguardando inicio"}</span>
                </div>
                <div className="meter-box">
                  <strong>Meta da fase</strong>
                  <span>{`${difficulty.minimoParaConcluir}/${rounds.length} acertos`}</span>
                </div>
              </div>

              <div className="comparison-progress">
                {rounds.map((_, index) => (
                  <span
                    key={index}
                    className={`comparison-dot ${
                      index < selectedAnswers.length ? "comparison-dot-done" : index === currentRoundIndex && phase === "playing" ? "comparison-dot-active" : ""
                    }`}
                  />
                ))}
              </div>

            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Rodada atual</h3>
                <span className="small-muted">
                  {phase === "playing" ? `${currentRoundIndex + 1}/${rounds.length}` : "Aguardando rodada"}
                </span>
              </div>

              <div className="comparison-task-card">
                <strong className="comparison-task-title">
                  {audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}
                </strong>
                <span className="comparison-task-meta">{`Fase ${challenge.id} - ${challenge.difficultyLabel}`}</span>
                <p className="comparison-task-description">
                  {audience === "infantil" && variation.promptInfantil ? variation.promptInfantil : variation.prompt}
                </p>
              </div>

              <div className="button-row comparison-controls">
                <button className="btn btn-primary btn-round-start" onClick={startRound} disabled={phase === "playing"}>
                  {phase === "playing" ? "Rodada em andamento" : "Iniciar rodada"}
                </button>
                <button className="btn btn-secondary btn-round-swap" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>

              <div className="comparison-board">
                <button className="comparison-card" onClick={() => handleAnswer("left")} disabled={phase !== "playing"}>
                  <span className="small-muted">Opcao esquerda</span>
                  <strong>{showChildVisuals ? <ChildVisualBadge token={currentRound.left} /> : currentRound.left}</strong>
                </button>
                <button className="comparison-card" onClick={() => handleAnswer("right")} disabled={phase !== "playing"}>
                  <span className="small-muted">Opcao direita</span>
                  <strong>{showChildVisuals ? <ChildVisualBadge token={currentRound.right} /> : currentRound.right}</strong>
                </button>
              </div>

              <p className="muted comparison-helper">
                Clique na opcao correta para passar para a proxima comparacao.
              </p>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
