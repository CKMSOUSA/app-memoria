"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChildVisualBadge } from "@/components/ChildVisualBadge";
import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { SoundToggle, useSoundFeedback } from "@/components/SoundToggle";
import { TimerDisplay } from "@/components/TimerDisplay";
import { getSessionAdjustments, useAppSettingsState } from "@/lib/app-settings";
import { advancedLogicChallenges } from "@/lib/advanced-game-data";
import { logicChallenges } from "@/lib/game-data-v3";
import { evaluateLogicRound, getNextVariationIndex } from "@/lib/game-logic";
import { getAgeLabel, getAudienceFromAge, getLogicDifficulty, getNivel, isChallengeUnlockedInOrder } from "@/lib/scoring";
import type { LogicChallenge, ProgressState, Usuario } from "@/lib/types";

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
  isAdvancedMode?: boolean;
};

type Phase = "idle" | "playing" | "result";
type AdaptiveTuning = { timeBonus: number; roundDelta: number; minimumDelta: number };

export function LogicGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
  isAdvancedMode = false,
}: LogicGameProps) {
  const challengeList: LogicChallenge[] = isAdvancedMode ? advancedLogicChallenges : logicChallenges;
  const challengeIds = challengeList.map((item) => item.id);
  const firstChallengeId = challengeList[0]?.id ?? 1;
  const [selectedId, setSelectedId] = useState(firstChallengeId);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [adaptiveTuning, setAdaptiveTuning] = useState<AdaptiveTuning>({ timeBonus: 0, roundDelta: 0, minimumDelta: 0 });
  const [review, setReview] = useState<{
    hits: number[];
    mistakes: number[];
    score: number;
    completed: boolean;
  } | null>(null);
  const { soundEnabled, toggleSound, playResultSound, playAnswerSound } = useSoundFeedback();
  const { settings } = useAppSettingsState();
  const sessionAdjustments = getSessionAdjustments(settings);

  const progressRef = useRef(progresso);
  const challenge = useMemo(
    () => challengeList.find((item) => item.id === selectedId) ?? challengeList[0],
    [challengeList, selectedId],
  );
  const audience = getAudienceFromAge(usuario.idade);
  const showChildVisuals = !isAdvancedMode && usuario.idade <= 10;
  const variation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const activeRoundCount = isAdvancedMode
    ? variation.rounds.length
    : Math.max(
        2,
        Math.min(variation.rounds.length, variation.rounds.length + adaptiveTuning.roundDelta + sessionAdjustments.logicRoundDelta),
      );
  const activeRounds = variation.rounds.slice(0, activeRoundCount);
  const currentRound = activeRounds[currentRoundIndex] ?? activeRounds[0];
  const baseDifficulty = isAdvancedMode
    ? { tempoLimite: challenge.tempoLimite, minimoParaConcluir: challenge.minimoParaConcluir }
    : getLogicDifficulty({
        tempoBase: challenge.tempoLimite,
        minimoBase: challenge.minimoParaConcluir,
        idade: usuario.idade,
        progress: progresso[selectedId],
      });
  const adaptiveDifficulty = isAdvancedMode
    ? baseDifficulty
    : {
        tempoLimite: Math.max(8, baseDifficulty.tempoLimite + adaptiveTuning.timeBonus),
        minimoParaConcluir: Math.max(1, Math.min(activeRounds.length, baseDifficulty.minimoParaConcluir + adaptiveTuning.minimumDelta)),
      };
  const sessionDifficulty = isAdvancedMode
    ? adaptiveDifficulty
    : {
        tempoLimite: adaptiveDifficulty.tempoLimite + sessionAdjustments.timeBonusSeconds,
        minimoParaConcluir: Math.max(1, adaptiveDifficulty.minimoParaConcluir + sessionAdjustments.minimumDelta),
      };
  const challengeNumber = challengeIds.indexOf(challenge.id) + 1;
  const ageDescription = getAgeLabel(usuario.idade);

  useEffect(() => {
    setSelectedId((current) => (challengeIds.includes(current) ? current : firstChallengeId));
  }, [challengeIds, firstChallengeId]);

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
    setAdaptiveTuning({ timeBonus: 0, roundDelta: 0, minimumDelta: 0 });
    setReview(null);
  }, [challenge.variacoes.length, selectedId]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, onRememberVariation, variationIndex]);

  const finishRound = useCallback(
    (answers: string[]) => {
      const expectedAnswers = activeRounds.map((item) => item.correctAnswer);
      const elapsedSeconds = Math.max(sessionDifficulty.tempoLimite - timeLeft, 0);
      const result = evaluateLogicRound({
        expectedAnswers,
        selectedAnswers: answers,
        answerSeconds: elapsedSeconds,
        timeLimit: sessionDifficulty.tempoLimite,
        minimumToComplete: sessionDifficulty.minimoParaConcluir,
      });

      if (!isAdvancedMode) {
        setAdaptiveTuning((current) => {
          if (result.completed && result.mistakes.length === 0 && elapsedSeconds <= Math.max(4, sessionDifficulty.tempoLimite - 2)) {
            return {
              timeBonus: Math.max(-2, current.timeBonus - 1),
              roundDelta: 0,
              minimumDelta: Math.min(1, current.minimumDelta + 1),
            };
          }
          if (!result.completed || result.mistakes.length >= 2) {
            return {
              timeBonus: Math.min(4, current.timeBonus + 1),
              roundDelta: Math.max(-2, current.roundDelta - 1),
              minimumDelta: Math.max(-1, current.minimumDelta - 1),
            };
          }
          return current;
        });
      }

      setPhase("result");
      setFeedback(
        result.completed
          ? `Voce acertou ${result.hits.length} sequencia(s) e concluiu a fase.`
          : `Voce acertou ${result.hits.length} sequencia(s). Precisa de ${sessionDifficulty.minimoParaConcluir} para concluir.`,
      );
      setReview(result);
      playResultSound(result.completed);
      onSaveResult(challenge.id, result.score, elapsedSeconds, result.completed, variationIndex);
    },
    [activeRounds, challenge.id, isAdvancedMode, onSaveResult, playResultSound, sessionDifficulty.minimoParaConcluir, sessionDifficulty.tempoLimite, timeLeft, variationIndex],
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
    setTimeLeft(sessionDifficulty.tempoLimite);
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
    const nextAnswers = [...selectedAnswers, answer];
    setSelectedAnswers(nextAnswers);

    if (currentRoundIndex >= activeRounds.length - 1) {
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
            <p className="eyebrow">{isAdvancedMode ? "Testes Avancados" : "Trilha de logica"}</p>
            <h1>{isAdvancedMode ? "Logica em nivel extremo" : "Descubra a regra e escolha o proximo termo"}</h1>
            <p className="muted">
              {isAdvancedMode
                ? "As fases avancadas combinam duas ou tres regras ao mesmo tempo e reduzem a margem para resposta por impulso."
                : "Essa trilha trabalha raciocinio sequencial, padroes e previsao de proximo passo."}
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
            <h3>Escolha o desafio</h3>
            <span className="small-muted">Nivel atual: {getNivel(usuario.pontos)}</span>
          </div>
          <div className="tabs-grid">
            {challengeList.map((item, index) => {
              const unlocked = isChallengeUnlockedInOrder(progresso, challengeIds, item.id);
              const progress = progresso[item.id];
              const status = progress.completed ? "Concluido" : unlocked ? "Liberado" : "Bloqueado";

              return (
                <button
                  key={item.id}
                  className={`tab-card ${item.id === challenge.id ? "tab-card-active" : ""}`}
                  disabled={!unlocked}
                  onClick={() => setSelectedId(item.id)}
                >
                  <strong>{`Fase ${index + 1} - ${item.difficultyLabel}`}</strong>
                  <span>{!isAdvancedMode && audience === "infantil" && item.nomeInfantil ? item.nomeInfantil : item.nome}</span>
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
                { label: "Sequencias", value: String(activeRounds.length) },
              ]}
              note="Leia a explicacao correta depois de cada rodada. Isso ajuda a reconhecer o padrao com mais rapidez na proxima tentativa."
            />
            {!review.completed && review.mistakes.length > 0 ? (
              <p className="review-note">
                {`Onde errou: a(s) sequencia(s) ${review.mistakes.map((item) => item + 1).join(", ")} precisam de revisao. Veja a regra explicada em cada card.`}
              </p>
            ) : null}

            <div className="review-grid">
              {activeRounds.map((round, index) => {
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
                <h3>{!isAdvancedMode && audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}</h3>
                <span className="small-muted">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
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
                tip={
                  isAdvancedMode
                    ? "Nos testes avancados, procure mais de uma regra. Se uma explicacao parecer simples demais, provavelmente ha outra camada."
                    : "Nem toda sequencia cresce de 1 em 1. Algumas alternam, dobram ou pulam letras."
                }
                isChild={!isAdvancedMode && usuario.idade <= 10}
              />

              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challengeNumber} de ${challengeList.length}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${sessionDifficulty.minimoParaConcluir} acertos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Rodadas</strong>
                  <span>{activeRounds.length}</span>
                </div>
                <div className="phase-chip">
                  <strong>Adaptacao</strong>
                  <span>{`${sessionDifficulty.tempoLimite}s totais`}</span>
                </div>
              </div>

              <div className="status-row">
                <div className="meter-box">
                  <strong>Tempo restante</strong>
                  <span>{phase === "playing" ? `${timeLeft}s` : "Aguardando inicio"}</span>
                </div>
                <div className="meter-box">
                  <strong>Meta da fase</strong>
                  <span>{`${sessionDifficulty.minimoParaConcluir}/${activeRounds.length} acertos`}</span>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Sequencia atual</h3>
                <span className="small-muted">
                  {phase === "playing" ? `${currentRoundIndex + 1}/${activeRounds.length}` : "Aguardando rodada"}
                </span>
              </div>
              <div className="round-task-card">
                <strong className="round-task-title">
                  {!isAdvancedMode && audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}
                </strong>
                <span className="round-task-meta">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
                <p className={`round-task-description ${isAdvancedMode ? "advanced-task-description" : ""}`}>
                  {isAdvancedMode
                    ? variation.prompt
                    : `${ageDescription} - ${
                        audience === "infantil" && variation.promptInfantil ? variation.promptInfantil : variation.prompt
                      }`}
                </p>
              </div>

              <div className="button-row round-controls">
                <button className="btn btn-primary btn-round-start" onClick={startRound} disabled={phase === "playing"}>
                  {phase === "playing" ? "Rodada em andamento" : "Iniciar rodada"}
                </button>
                <button className="btn btn-secondary btn-round-swap" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>

              <div className="response-timer-row response-timer-row-near-board">
                <TimerDisplay
                  label="Tempo"
                  value={phase === "playing" ? `${timeLeft}s` : "--"}
                  tone={phase === "playing" && timeLeft <= 10 ? "warning" : phase === "playing" ? "active" : "neutral"}
                />
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
