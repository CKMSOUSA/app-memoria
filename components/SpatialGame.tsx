"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChildVisualBadge } from "@/components/ChildVisualBadge";
import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { SoundToggle, useSoundFeedback } from "@/components/SoundToggle";
import { TimerDisplay } from "@/components/TimerDisplay";
import { advancedSpatialChallenges } from "@/lib/advanced-game-data";
import { spatialChallenges } from "@/lib/game-data-v3";
import { evaluateSpatialRound, getNextVariationIndex } from "@/lib/game-logic";
import {
  getAgeLabel,
  getAudienceFromAge,
  getNivel,
  getSpatialDifficulty,
  isChallengeUnlockedInOrder,
} from "@/lib/scoring";
import type { ProgressState, SpatialChallenge, Usuario } from "@/lib/types";

type SpatialGameProps = {
  usuario: Usuario;
  progresso: ProgressState["espacial"];
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

type Phase = "idle" | "showing" | "answering" | "result";
type AdaptiveTuning = { responseBonus: number; revealBonus: number; stepDelta: number; minimumDelta: number };

type BoardStep = {
  row: number;
  col: number;
  index: number;
};

const BOARD_SIZE = 5;

const directionMap: Record<string, string> = {
  cima: "↑",
  baixo: "↓",
  esquerda: "←",
  direita: "→",
};

const directionLabelMap: Record<string, string> = {
  cima: "Cima",
  baixo: "Baixo",
  esquerda: "Esquerda",
  direita: "Direita",
};

void directionMap;

function clamp(value: number) {
  return Math.max(0, Math.min(BOARD_SIZE - 1, value));
}

function buildBoardPath(sequence: string[]) {
  let row = Math.floor(BOARD_SIZE / 2);
  let col = Math.floor(BOARD_SIZE / 2);
  const steps: BoardStep[] = [{ row, col, index: 0 }];

  for (const move of sequence) {
    if (move === "cima") row = clamp(row - 1);
    if (move === "baixo") row = clamp(row + 1);
    if (move === "esquerda") col = clamp(col - 1);
    if (move === "direita") col = clamp(col + 1);
    steps.push({ row, col, index: steps.length });
  }

  return steps;
}

export function SpatialGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
  isAdvancedMode = false,
}: SpatialGameProps) {
  const challengeList: SpatialChallenge[] = isAdvancedMode ? advancedSpatialChallenges : spatialChallenges;
  const challengeIds = challengeList.map((item) => item.id);
  const firstChallengeId = challengeList[0]?.id ?? 1;
  const [selectedId, setSelectedId] = useState(firstChallengeId);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealLeft, setRevealLeft] = useState(0);
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [adaptiveTuning, setAdaptiveTuning] = useState<AdaptiveTuning>({
    responseBonus: 0,
    revealBonus: 0,
    stepDelta: 0,
    minimumDelta: 0,
  });
  const [review, setReview] = useState<{
    hits: string[];
    mistakes: string[];
    wrongMoves: string[];
    score: number;
    completed: boolean;
  } | null>(null);
  const { soundEnabled, toggleSound, playResultSound, playAnswerSound } = useSoundFeedback();

  const progressoRef = useRef(progresso);
  const challenge = useMemo(
    () => challengeList.find((item) => item.id === selectedId) ?? challengeList[0],
    [challengeList, selectedId],
  );
  const audience = getAudienceFromAge(usuario.idade);
  const showChildVisuals = !isAdvancedMode && usuario.idade <= 10;
  const currentVariation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const difficulty = isAdvancedMode
    ? { tempoResposta: challenge.tempoResposta, minimoParaConcluir: challenge.minimoParaConcluir }
    : getSpatialDifficulty({
        tempoBase: challenge.tempoResposta,
        minimoBase: challenge.minimoParaConcluir,
        idade: usuario.idade,
        progress: progresso[selectedId],
      });
  const activeStepCount = isAdvancedMode
    ? currentVariation.sequence.length
    : Math.max(2, Math.min(currentVariation.sequence.length, currentVariation.sequence.length + adaptiveTuning.stepDelta));
  const activeSequence = currentVariation.sequence.slice(0, activeStepCount);
  const adaptiveDifficulty = isAdvancedMode
    ? { ...difficulty, revealSeconds: currentVariation.revealSeconds }
    : {
        tempoResposta: Math.max(8, difficulty.tempoResposta + adaptiveTuning.responseBonus),
        minimoParaConcluir: Math.max(2, Math.min(activeSequence.length, difficulty.minimoParaConcluir + adaptiveTuning.minimumDelta)),
        revealSeconds: Math.max(3, currentVariation.revealSeconds + adaptiveTuning.revealBonus),
      };
  const expectedPath = useMemo(() => buildBoardPath(activeSequence), [activeSequence]);
  const userPath = useMemo(() => buildBoardPath(selectedMoves), [selectedMoves]);
  const challengeNumber = challengeIds.indexOf(challenge.id) + 1;
  const ageDescription = getAgeLabel(usuario.idade);

  useEffect(() => {
    setSelectedId((current) => (challengeIds.includes(current) ? current : firstChallengeId));
  }, [challengeIds, firstChallengeId]);

  useEffect(() => {
    progressoRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    if (phase !== "showing") return;
    if (revealLeft <= 0) {
      setPhase("answering");
      return;
    }

    const timeout = window.setTimeout(() => setRevealLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [phase, revealLeft]);

  useEffect(() => {
    if (phase !== "answering") return;
    const interval = window.setInterval(() => setAnswerSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    const savedVariationIndex = progressoRef.current[selectedId]?.lastVariationIndex ?? null;
    setVariationIndex(getNextVariationIndex(challenge.variacoes.length, savedVariationIndex));
    setPhase("idle");
    setRevealLeft(0);
    setAnswerSeconds(0);
    setSelectedMoves([]);
    setFeedback("");
    setAdaptiveTuning({ responseBonus: 0, revealBonus: 0, stepDelta: 0, minimumDelta: 0 });
    setReview(null);
  }, [selectedId, challenge.variacoes.length]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, onRememberVariation, variationIndex]);

  function startRound() {
    setRevealLeft(adaptiveDifficulty.revealSeconds);
    setAnswerSeconds(0);
    setSelectedMoves([]);
    setFeedback("");
    setReview(null);
    setPhase("showing");
  }

  function resetRound() {
    setVariationIndex((current) => getNextVariationIndex(challenge.variacoes.length, current));
    setPhase("idle");
    setRevealLeft(0);
    setAnswerSeconds(0);
    setSelectedMoves([]);
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

  function pushMove(move: string) {
    if (phase !== "answering") return;

    playAnswerSound();
    const nextMoves = [...selectedMoves, move];
    setSelectedMoves(nextMoves);

    if (nextMoves.length === activeSequence.length) {
      const result = evaluateSpatialRound({
        expectedSequence: activeSequence,
        selectedSequence: nextMoves,
        answerSeconds,
        responseSeconds: adaptiveDifficulty.tempoResposta,
        minimumToComplete: adaptiveDifficulty.minimoParaConcluir,
      });

      if (!isAdvancedMode) {
        setAdaptiveTuning((current) => {
          if (result.completed && result.wrongMoves.length === 0 && answerSeconds <= Math.max(4, adaptiveDifficulty.tempoResposta - 2)) {
            return {
              responseBonus: Math.max(-2, current.responseBonus - 1),
              revealBonus: Math.max(-1, current.revealBonus - 1),
              stepDelta: Math.min(2, current.stepDelta + 1),
              minimumDelta: Math.min(1, current.minimumDelta + 1),
            };
          }
          if (!result.completed || result.wrongMoves.length >= 2) {
            return {
              responseBonus: Math.min(4, current.responseBonus + 1),
              revealBonus: Math.min(2, current.revealBonus + 1),
              stepDelta: Math.max(-2, current.stepDelta - 1),
              minimumDelta: Math.max(-1, current.minimumDelta - 1),
            };
          }
          return current;
        });
      }

      setPhase("result");
      setReview(result);
      setFeedback(
        result.completed
          ? `Voce reconstruiu ${result.hits.length} direcao(oes) corretamente e concluiu a rota.`
          : `Voce acertou ${result.hits.length} movimento(s). Precisa de ${adaptiveDifficulty.minimoParaConcluir} para concluir.`,
      );
      playResultSound(result.completed);
      onSaveResult(challenge.id, result.score, answerSeconds, result.completed, variationIndex);
    }
  }

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">{isAdvancedMode ? "Testes Avancados" : "Trilha de orientacao espacial"}</p>
            <h1>{isAdvancedMode ? "Orientacao espacial extrema" : "Observe a rota e monte o caminho"}</h1>
            <p className="muted">
              {isAdvancedMode
                ? "As rotas avancadas sao mais longas, com retorno parcial e menos tempo de observacao."
                : "Este treino trabalha referencia espacial, esquerda e direita, e memoria de deslocamento em sequencia."}
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
                <h3>Correcao da rota</h3>
                <p className="muted">{feedback}</p>
              </div>
              <span className="pill">Score {review.score}</span>
            </div>
            <ReviewMetrics
              items={[
                { label: "Corretos", value: String(review.hits.length) },
                { label: "Erros", value: String(review.wrongMoves.length) },
                { label: "Passos", value: String(activeSequence.length) },
              ]}
              note="Compare a rota correta com a sua rota. Isso ajuda a perceber onde a referencia espacial se perdeu."
            />
            {!review.completed && review.wrongMoves.length > 0 ? (
              <p className="review-note">
                {`Onde errou: a rota desviou em ${review.wrongMoves.length} passo(s). Compare os mapas abaixo para localizar o ponto da troca.`}
              </p>
            ) : null}

            <div className="review-grid">
              <div className="review-column review-good">
                <strong>Movimentos corretos</strong>
                <div className="review-tags">
                  {review.hits.length > 0 ? (
                    review.hits.map((item, index) => (
                      <span key={`${item}-${index}`} className="review-tag">
                        {directionLabelMap[item]}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Nenhum acerto.</span>
                  )}
                </div>
              </div>

              <div className="review-column review-bad">
                <strong>Erros na rota</strong>
                <div className="review-tags">
                  {review.wrongMoves.length > 0 ? (
                    review.wrongMoves.map((item, index) => (
                      <span key={`${item}-${index}`} className="review-tag">
                        {directionLabelMap[item]}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Nenhum movimento errado.</span>
                  )}
                </div>
              </div>

              <div className="review-column">
                <strong>Movimentos esperados</strong>
                <div className="review-tags">
                  {activeSequence.map((item, index) => (
                    <span key={`${item}-${index}`} className="review-tag">
                      {directionLabelMap[item]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="spatial-review-boards">
              <div className="review-column">
                <strong>Rota correta</strong>
                <SpatialBoard path={expectedPath} />
              </div>
              <div className="review-column">
                <strong>Sua rota</strong>
                <SpatialBoard path={userPath} />
              </div>
            </div>

            <div className="button-row">
              <button className="btn btn-primary" onClick={startRound}>
                Tentar novamente
              </button>
              <button className="btn btn-secondary" onClick={advanceRound}>
                Avançar
              </button>
              <button className="btn btn-secondary" onClick={resetRound}>
                Trocar rota
              </button>
            </div>
          </section>
        ) : (
          <div className={`game-grid ${isAdvancedMode ? "spatial-advanced-grid" : ""}`}>
            <section className="panel">
              <div className="section-head">
                <h3>{!isAdvancedMode && audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}</h3>
                <span className="small-muted">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
              </div>

              {isAdvancedMode ? (
                <div className="round-task-card compact-task-card">
                  <strong className="round-task-title">Observacao da rota</strong>
                  <span className="round-task-meta">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
                  <p className="round-task-description advanced-task-description">{currentVariation.prompt}</p>
                </div>
              ) : (
                <GameGuide
                  title="Como jogar"
                  objective="Observe o caminho no tabuleiro e depois repita os movimentos na mesma ordem usando somente os botoes de direcao."
                  steps={[
                    "Clique em Iniciar rodada para mostrar a rota.",
                    "Use os numeros do tabuleiro como guia: 0 e o inicio, 1 e o primeiro passo, 2 e o segundo, e assim por diante.",
                    "Quando a rota sumir, responda clicando em Cima, Baixo, Esquerda e Direita.",
                    "Na correcao final, compare a rota certa com a rota que voce montou.",
                  ]}
                  tip="Voce nao precisa clicar no tabuleiro. O tabuleiro serve apenas para mostrar o caminho visualmente."
                  isChild={!isAdvancedMode && usuario.idade <= 10}
                />
              )}

              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challengeNumber} de ${challengeList.length}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${adaptiveDifficulty.minimoParaConcluir} movimentos certos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Rota</strong>
                  <span>{`${activeSequence.length} passos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Adaptacao</strong>
                  <span>{`${adaptiveDifficulty.tempoResposta}s para responder`}</span>
                </div>
              </div>

              <div className={`${isAdvancedMode ? "status-row compact-status-row" : ""}`}>
                <div className="meter-box">
                  <strong>Tempo de observacao</strong>
                  <span>{phase === "showing" ? `${revealLeft}s restantes` : `${adaptiveDifficulty.revealSeconds}s por rodada`}</span>
                </div>
                {isAdvancedMode ? (
                  <div className="meter-box">
                    <strong>Modo</strong>
                    <span>Resposta imediata ao lado</span>
                  </div>
                ) : null}
              </div>

              <SpatialBoard path={phase === "showing" ? expectedPath : buildBoardPath([])} masked={phase !== "showing"} />
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Monte o caminho</h3>
                <span className="small-muted">
                  {phase === "answering" ? `${answerSeconds}s respondendo` : "Aguardando rodada"}
                </span>
              </div>
              <div className="round-task-card">
                <strong className="round-task-title">
                  {!isAdvancedMode && audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}
                </strong>
                <span className="round-task-meta">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
                <p className={`round-task-description ${isAdvancedMode ? "advanced-task-description" : ""}`}>
                  {isAdvancedMode
                    ? currentVariation.prompt
                    : `${ageDescription} - ${
                        audience === "infantil" && currentVariation.promptInfantil ? currentVariation.promptInfantil : currentVariation.prompt
                      }`}
                </p>
              </div>

              <div className="button-row round-controls">
                <button className="btn btn-primary btn-round-start" onClick={startRound} disabled={phase === "showing"}>
                  {phase === "showing" ? "Observando rota" : "Iniciar rodada"}
                </button>
                <button className="btn btn-secondary btn-round-swap" onClick={resetRound}>
                  Trocar rota
                </button>
              </div>

              <div className="response-timer-row response-timer-row-near-board">
                <TimerDisplay
                  label={phase === "showing" ? "Observacao" : phase === "answering" ? "Resposta" : "Tempo"}
                  value={phase === "showing" ? `${revealLeft}s` : phase === "answering" ? `${answerSeconds}s` : "--"}
                  tone={phase === "showing" || phase === "answering" ? "active" : "neutral"}
                />
              </div>

              <div className={`${isAdvancedMode ? "status-row compact-status-row" : ""}`}>
                <div className="meter-box">
                  <strong>Objetivo da rodada</strong>
                  <span>{`Repita ${activeSequence.length} movimentos na mesma ordem usando Cima, Baixo, Esquerda e Direita.`}</span>
                </div>
              </div>

              <div className="selected-sequence">
                {selectedMoves.length > 0
                  ? showChildVisuals
                    ? selectedMoves.map((item) => directionLabelMap[item]).join(" - ")
                    : selectedMoves.map((item) => directionLabelMap[item]).join(" - ")
                  : "Sua sequencia de direcoes aparecera aqui."}
              </div>

              <SpatialBoard path={userPath} />

              <div className="exclusive-grid">
                {currentVariation.options.map((option) => (
                  <button
                    key={option}
                    className="exclusive-option"
                    onClick={() => pushMove(option)}
                    disabled={phase !== "answering" || selectedMoves.length >= activeSequence.length}
                  >
                    {showChildVisuals ? <ChildVisualBadge token={directionLabelMap[option]} compact /> : directionLabelMap[option]}
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

function SpatialBoard({ path, masked = false }: { path: BoardStep[]; masked?: boolean }) {
  const occupiedMap = new Map(path.map((step) => [`${step.row}-${step.col}`, step.index]));
  const lastStep = path[path.length - 1];

  return (
    <div className="spatial-board">
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
        const row = Math.floor(index / BOARD_SIZE);
        const col = index % BOARD_SIZE;
        const key = `${row}-${col}`;
        const stepIndex = occupiedMap.get(key);
        const isStart = stepIndex === 0;
        const isFinish = lastStep?.row === row && lastStep?.col === col;
        const isPath = stepIndex !== undefined;

        return (
          <div
            key={key}
            className={`spatial-cell ${isPath ? "spatial-cell-path" : ""} ${isStart ? "spatial-cell-start" : ""} ${
              isFinish ? "spatial-cell-finish" : ""
            }`}
          >
            {masked ? "?" : stepIndex !== undefined ? stepIndex : ""}
          </div>
        );
      })}
    </div>
  );
}
