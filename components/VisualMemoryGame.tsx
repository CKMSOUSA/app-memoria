"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { SoundToggle, useSoundFeedback } from "@/components/SoundToggle";
import { visualChallenges } from "@/lib/game-data-v3";
import { evaluateVisualRound, getNextVariationIndex } from "@/lib/game-logic";
import { getAgeLabel, getAudienceFromAge, getNivel, isChallengeUnlocked } from "@/lib/scoring";
import type { ProgressState, Usuario } from "@/lib/types";

type VisualMemoryGameProps = {
  usuario: Usuario;
  progresso: ProgressState["visual"];
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

type CardState = {
  id: string;
  value: string;
  matched: boolean;
};

type Phase = "idle" | "showing" | "playing" | "result";

function shuffleCards(items: string[]) {
  const cards = items.flatMap((item, index) => [
    { id: `${item}-${index}-a`, value: item, matched: false },
    { id: `${item}-${index}-b`, value: item, matched: false },
  ]);

  for (let current = cards.length - 1; current > 0; current -= 1) {
    const randomIndex = Math.floor(Math.random() * (current + 1));
    [cards[current], cards[randomIndex]] = [cards[randomIndex], cards[current]];
  }

  return cards;
}

export function VisualMemoryGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
}: VisualMemoryGameProps) {
  const [selectedId, setSelectedId] = useState(1);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wrongMatches, setWrongMatches] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<{
    pairsFound: number;
    totalPairs: number;
    wrongMatches: number;
    score: number;
    completed: boolean;
  } | null>(null);
  const { soundEnabled, toggleSound, playResultSound } = useSoundFeedback();

  const progressRef = useRef(progresso);
  const lockRef = useRef(false);
  const challenge = useMemo(
    () => visualChallenges.find((item) => item.id === selectedId) ?? visualChallenges[0],
    [selectedId],
  );
  const audience = getAudienceFromAge(usuario.idade);
  const symbols = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];

  useEffect(() => {
    progressRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    const savedVariationIndex = progressRef.current[selectedId]?.lastVariationIndex ?? null;
    const nextVariation = getNextVariationIndex(challenge.variacoes.length, savedVariationIndex);
    setVariationIndex(nextVariation);
    setCards(shuffleCards(challenge.variacoes[nextVariation] ?? challenge.variacoes[0]));
    setPhase("idle");
    setFlippedIndexes([]);
    setTimeLeft(0);
    setElapsedSeconds(0);
    setWrongMatches(0);
    setFeedback("");
    setReview(null);
  }, [challenge.variacoes, selectedId]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, onRememberVariation, variationIndex]);

  useEffect(() => {
    if (phase !== "showing") return;
    if (timeLeft <= 0) {
      setPhase("playing");
      setTimeLeft(challenge.tempoLimite);
      return;
    }

    const timeout = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [challenge.tempoLimite, phase, timeLeft]);

  const finishRound = useCallback((currentCards: CardState[]) => {
    const pairsFound = currentCards.filter((item) => item.matched).length / 2;
    const result = evaluateVisualRound({
      pairsFound,
      totalPairs: symbols.length,
      wrongMatches,
      answerSeconds: elapsedSeconds,
      timeLimit: challenge.tempoLimite,
      minimumToComplete: challenge.minimoParaConcluir,
    });

    setPhase("result");
    setReview(result);
    setFeedback(
      result.completed
        ? `Voce encontrou ${result.pairsFound} pares e concluiu a fase visual.`
        : `Voce encontrou ${result.pairsFound} pares. Precisa de ${challenge.minimoParaConcluir} para concluir.`,
    );
    playResultSound(result.completed);
    onSaveResult(challenge.id, result.score, elapsedSeconds, result.completed, variationIndex);
  }, [
    challenge.id,
    challenge.minimoParaConcluir,
    challenge.tempoLimite,
    elapsedSeconds,
    onSaveResult,
    playResultSound,
    symbols.length,
    variationIndex,
    wrongMatches,
  ]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finishRound(cards);
      return;
    }

    const timeout = window.setTimeout(() => {
      setTimeLeft((value) => value - 1);
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cards, finishRound, phase, timeLeft]);

  function startRound() {
    setCards(shuffleCards(symbols));
    setFlippedIndexes([]);
    setPhase("showing");
    setTimeLeft(challenge.revealSeconds);
    setElapsedSeconds(0);
    setWrongMatches(0);
    setFeedback("");
    setReview(null);
  }

  function resetRound() {
    const nextVariationIndex = getNextVariationIndex(challenge.variacoes.length, variationIndex);
    setVariationIndex(nextVariationIndex);
    setCards(shuffleCards(challenge.variacoes[nextVariationIndex] ?? challenge.variacoes[0]));
    setFlippedIndexes([]);
    setPhase("idle");
    setTimeLeft(0);
    setElapsedSeconds(0);
    setWrongMatches(0);
    setFeedback("");
    setReview(null);
  }

  function handleCardClick(index: number) {
    if (phase !== "playing" || lockRef.current) return;
    if (flippedIndexes.includes(index) || cards[index]?.matched) return;

    const nextFlipped = [...flippedIndexes, index];
    setFlippedIndexes(nextFlipped);

    if (nextFlipped.length < 2) return;

    lockRef.current = true;
    const [firstIndex, secondIndex] = nextFlipped;
    const firstCard = cards[firstIndex];
    const secondCard = cards[secondIndex];

    if (firstCard.value === secondCard.value) {
      const nextCards = cards.map((card, cardIndex) =>
        cardIndex === firstIndex || cardIndex === secondIndex ? { ...card, matched: true } : card,
      );
      setCards(nextCards);
      setFlippedIndexes([]);
      lockRef.current = false;

      if (nextCards.every((card) => card.matched)) {
        finishRound(nextCards);
      }
      return;
    }

    setWrongMatches((value) => value + 1);
    window.setTimeout(() => {
      setFlippedIndexes([]);
      lockRef.current = false;
    }, 700);
  }

  const visibleIndexes = new Set(phase === "showing" ? cards.map((_, index) => index) : flippedIndexes);

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Trilha de memoria visual</p>
            <h1>Encontre os pares de figuras</h1>
            <p className="muted">Treino visual com cartas de animais, flores, objetos e outras imagens ilustradas.</p>
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
            {visualChallenges.map((item) => {
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
                { label: "Pares", value: `${review.pairsFound}/${review.totalPairs}` },
                { label: "Erros", value: String(review.wrongMatches) },
                { label: "Meta", value: `${challenge.minimoParaConcluir} pares` },
              ]}
              note="Na memoria visual, o ideal e observar posicao e categoria da figura antes das cartas virarem."
            />
            {!review.completed ? (
              <p className="review-note">
                {`Onde errou: faltaram ${Math.max(review.totalPairs - review.pairsFound, 0)} par(es) e houve ${review.wrongMatches} tentativa(s) incorreta(s). Repare nas figuras da fase antes de repetir.`}
              </p>
            ) : null}
            <div className="review-grid">
              <div className="review-column review-good">
                <strong>Pares encontrados</strong>
                <span>{`${review.pairsFound}/${review.totalPairs}`}</span>
              </div>
              <div className="review-column review-bad">
                <strong>Erros de tentativa</strong>
                <span>{review.wrongMatches}</span>
              </div>
              <div className="review-column">
                <strong>Figuras da fase</strong>
                <div className="review-tags">
                  {symbols.map((symbol) => (
                    <span key={symbol} className="review-tag visual-tag">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
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
                objective="Veja as cartas abertas por alguns segundos e depois encontre os pares iguais."
                steps={[
                  "Clique em Iniciar rodada para revelar todas as figuras.",
                  "Memorize onde estao animais, flores e outros simbolos.",
                  "Quando as cartas virarem, clique em duas por vez para formar pares.",
                  "No fim da rodada, confira quantos pares encontrou e quantos erros cometeu.",
                ]}
                tip="Para criancas pequenas, as figuras funcionam como apoio visual mais concreto do que palavras."
                isChild={usuario.idade <= 10}
              />

              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challenge.id} de ${visualChallenges.length}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${challenge.minimoParaConcluir} pares`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Figuras</strong>
                  <span>{symbols.length}</span>
                </div>
              </div>

              <div className="status-row">
                <div className="meter-box">
                  <strong>Tempo</strong>
                  <span>
                    {phase === "showing"
                      ? `${timeLeft}s para observar`
                      : phase === "playing"
                        ? `${timeLeft}s restantes`
                        : "Pronto para iniciar"}
                  </span>
                </div>
                <div className="meter-box">
                  <strong>Erros</strong>
                  <span>{wrongMatches}</span>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Cartas da rodada</h3>
                <span className="small-muted">
                  {phase === "playing" ? "Encontre os pares iguais" : "Aguardando rodada"}
                </span>
              </div>

              <div className="round-task-card">
                <strong className="round-task-title">
                  {audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}
                </strong>
                <span className="round-task-meta">{`Fase ${challenge.id} - ${challenge.difficultyLabel}`}</span>
                <p className="round-task-description">
                  {`${getAgeLabel(usuario.idade)} - Memorize as cartas abertas e depois encontre os pares iguais.`}
                </p>
              </div>

              <div className="button-row round-controls">
                <button className="btn btn-primary btn-round-start" onClick={startRound} disabled={phase === "showing" || phase === "playing"}>
                  Iniciar rodada
                </button>
                <button className="btn btn-secondary btn-round-swap" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>

              <div className="visual-grid">
                {cards.map((card, index) => {
                  const isVisible = card.matched || visibleIndexes.has(index);
                  return (
                    <button
                      key={card.id}
                      className={`visual-card ${card.matched ? "visual-card-matched" : ""}`}
                      disabled={phase !== "playing" || card.matched}
                      onClick={() => handleCardClick(index)}
                    >
                      <span>{isVisible ? card.value : "?"}</span>
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
