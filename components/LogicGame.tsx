"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChildVisualBadge } from "@/components/ChildVisualBadge";
import { GameGuide } from "@/components/GameGuide";
import { logicChallenges } from "@/lib/game-data-v3";
import { evaluateLogicRound, getNextVariationIndex } from "@/lib/game-logic";
import { getAgeLabel, getAudienceFromAge, getNivel, isChallengeUnlocked } from "@/lib/scoring";
import type { ProgressState, Usuario } from "@/lib/types";

type LogicGameProps = {
  usuario: Usuario;
  progresso: ProgressState["logica"];
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

export function LogicGame({ usuario, progresso, onBack, onRememberVariation, onSaveResult }: LogicGameProps) {
  const [selectedId, setSelectedId] = useState(1);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<{
    hits: number[];
    mistakes: number[];
    score: number;
    completed: boolean;
  } | null>(null);

  const progressRef = useRef(progresso);
  const challenge = useMemo(
    () => logicChallenges.find((item) => item.id === selectedId) ?? logicChallenges[0],
    [selectedId],
  );
  const audience = getAudienceFromAge(usuario.idade);
  const showChildVisuals = usuario.idade <= 10;
  const variation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const currentRound = variation.rounds[currentRoundIndex] ?? variation.rounds[0];

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

  const finishRound = useCallback(
    (answers: string[]) => {
      const expectedAnswers = variation.rounds.map((item) => item.correctAnswer);
      const elapsedSeconds = Math.max(challenge.tempoLimite - timeLeft, 0);
      const result = evaluateLogicRound({
        expectedAnswers,
        selectedAnswers: answers,
        answerSeconds: elapsedSeconds,
        timeLimit: challenge.tempoLimite,
        minimumToComplete: challenge.minimoParaConcluir,
      });

      setPhase("result");
      setFeedback(
        result.completed
          ? `Voce acertou ${result.hits.length} sequencia(s) e concluiu a fase.`
          : `Voce acertou ${result.hits.length} sequencia(s). Precisa de ${challenge.minimoParaConcluir} para concluir.`,
      );
      setReview(result);
      onSaveResult(challenge.id, result.score, elapsedSeconds, result.completed, variationIndex);
    },
    [challenge.id, challenge.minimoParaConcluir, challenge.tempoLimite, onSaveResult, timeLeft, variation.rounds, variationIndex],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finishRound(selectedAnswers);
      return;
    }

    const timeout = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [finishRound, phase, selectedAnswers, timeLeft]);

  function startRound() {
    setPhase("playing");
    setTimeLeft(challenge.tempoLimite);
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

  function handleAnswer(answer: string) {
    if (phase !== "playing") return;
    const nextAnswers = [...selectedAnswers, answer];
    setSelectedAnswers(nextAnswers);

    if (currentRoundIndex >= variation.rounds.length - 1) {
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
            <p className="eyebrow">Trilha de logica</p>
            <h1>Descubra a regra e escolha o proximo termo</h1>
            <p className="muted">Essa trilha trabalha raciocinio sequencial, padroes e previsao de proximo passo.</p>
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
            {logicChallenges.map((item) => {
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

            <div className="review-grid">
              {variation.rounds.map((round, index) => {
                const userAnswer = selectedAnswers[index];
                const correct = review.hits.includes(index);
                return (
                  <div key={`${round.prompt}-${index}`} className={`review-column ${correct ? "review-good" : "review-bad"}`}>
                    <strong>{`Sequencia ${index + 1}`}</strong>
                    <span>{round.sequence.join(" - ")}</span>
                    <span>{`Sua resposta: ${userAnswer ?? "sem resposta"}`}</span>
                    <span>{`Correta: ${round.correctAnswer}`}</span>
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

              <GameGuide
                title="Como jogar"
                objective="Observe a regra da sequencia e escolha qual opcao vem depois."
                steps={[
                  "Clique em Iniciar rodada para abrir a serie de sequencias.",
                  "Leia a sequencia com calma e procure a regra de repeticao, crescimento ou alternancia.",
                  "Escolha a melhor opcao para completar a sequencia.",
                  "Ao final, compare sua resposta com a explicacao correta.",
                ]}
                tip="Nem toda sequencia cresce de 1 em 1. Algumas alternam, dobram ou pulam letras."
              />

              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challenge.id} de ${logicChallenges.length}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${challenge.minimoParaConcluir} acertos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Rodadas</strong>
                  <span>{variation.rounds.length}</span>
                </div>
              </div>

              <div className="status-row">
                <div className="meter-box">
                  <strong>Tempo restante</strong>
                  <span>{phase === "playing" ? `${timeLeft}s` : "Aguardando inicio"}</span>
                </div>
                <div className="meter-box">
                  <strong>Meta da fase</strong>
                  <span>{`${challenge.minimoParaConcluir}/${variation.rounds.length} acertos`}</span>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Sequencia atual</h3>
                <span className="small-muted">
                  {phase === "playing" ? `${currentRoundIndex + 1}/${variation.rounds.length}` : "Aguardando rodada"}
                </span>
              </div>

              <div className="round-task-card">
                <strong className="round-task-title">
                  {audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}
                </strong>
                <span className="round-task-meta">{`Fase ${challenge.id} - ${challenge.difficultyLabel}`}</span>
                <p className="round-task-description">
                  {`${getAgeLabel(usuario.idade)} - ${
                    audience === "infantil" && variation.promptInfantil ? variation.promptInfantil : variation.prompt
                  }`}
                </p>
              </div>

              <div className="button-row round-controls">
                <button className="btn btn-primary" onClick={startRound} disabled={phase === "playing"}>
                  {phase === "playing" ? "Rodada em andamento" : "Iniciar rodada"}
                </button>
                <button className="btn btn-secondary" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>

              <div className="logic-sequence">
                {currentRound.sequence.map((item) => (
                  <span key={`${currentRound.prompt}-${item}`} className="logic-token">
                    {showChildVisuals ? <ChildVisualBadge token={item} compact /> : item}
                  </span>
                ))}
                <span className="logic-token logic-token-next">?</span>
              </div>

              <p className="muted comparison-helper">{currentRound.prompt}</p>

              <div className="comparison-board">
                {currentRound.options.map((option) => (
                  <button key={option} className="comparison-card logic-card" onClick={() => handleAnswer(option)} disabled={phase !== "playing"}>
                    <span className="small-muted">Opcao</span>
                    <strong>{showChildVisuals ? <ChildVisualBadge token={option} /> : option}</strong>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
