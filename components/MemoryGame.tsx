"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { SoundToggle, useSoundFeedback } from "@/components/SoundToggle";
import { TimerDisplay } from "@/components/TimerDisplay";
import { getChildVisual } from "@/lib/child-visuals";
import { advancedMemoryChallenges } from "@/lib/advanced-game-data";
import { memoryChallenges } from "@/lib/game-data-v3";
import { evaluateMemoryRound, getNextVariationIndex } from "@/lib/game-logic";
import {
  getAgeLabel,
  getAudienceFromAge,
  getMemoryAgeProfile,
  getMemoryDifficulty,
  getNivel,
  isChallengeUnlockedInOrder,
} from "@/lib/scoring";
import type { MemoryChallenge, ProgressState, Usuario } from "@/lib/types";

type MemoryGameProps = {
  usuario: Usuario;
  progresso: ProgressState["memoria"];
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

type Phase = "idle" | "memorizing" | "answering" | "result";

const MEMORY_FALLBACK_VISUALS = [
  "🦋",
  "🌈",
  "🍀",
  "🎈",
  "🪁",
  "🧸",
  "🎯",
  "🌟",
  "🎨",
  "🧩",
  "🦄",
  "🐠",
  "🌼",
  "🍎",
  "🚂",
  "⛵",
  "🏕️",
  "🛝",
  "💎",
  "🔔",
];

function getMemoryVisual(token: string) {
  const base = getChildVisual(token);
  if (base !== "✨") return base;

  const hash = token.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
  return MEMORY_FALLBACK_VISUALS[hash % MEMORY_FALLBACK_VISUALS.length];
}

function getStableVisualChoices(expectedItems: string[], allVariations: string[][], challengeId: number, variation: number) {
  const extras = Array.from(new Set(allVariations.flat().filter((item) => !expectedItems.includes(item))));
  const seed = challengeId * 31 + variation * 17;
  const scoreFor = (token: string, offset: number) =>
    (token + String(seed + offset)).split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

  const orderedExtras = [...extras].sort((left, right) => scoreFor(left, 11) - scoreFor(right, 11));
  const pickedExtras = orderedExtras.slice(0, Math.max(3, Math.min(5, orderedExtras.length)));

  return Array.from(new Set([...expectedItems, ...pickedExtras])).sort(
    (left, right) => scoreFor(left, 23) - scoreFor(right, 23),
  );
}

function MemoryFigureCard({ token }: { token: string }) {
  return (
    <span className="memory-figure-card" aria-label={token} title={token}>
      <span className="memory-figure-emoji" aria-hidden="true">
        {getMemoryVisual(token)}
      </span>
    </span>
  );
}

export function MemoryGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
  isAdvancedMode = false,
}: MemoryGameProps) {
  const challengeList: MemoryChallenge[] = isAdvancedMode ? advancedMemoryChallenges : memoryChallenges;
  const challengeIds = challengeList.map((item) => item.id);
  const firstChallengeId = challengeList[0]?.id ?? 1;
  const [selectedId, setSelectedId] = useState(firstChallengeId);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<{
    hits: string[];
    wrongWords: string[];
    missedWords: string[];
    score: number;
    completed: boolean;
  } | null>(null);
  const { soundEnabled, toggleSound, playResultSound, playAnswerSound } = useSoundFeedback();

  const challenge = useMemo(
    () => challengeList.find((item) => item.id === selectedId) ?? challengeList[0],
    [challengeList, selectedId],
  );
  const progressoRef = useRef(progresso);
  const audience = getAudienceFromAge(usuario.idade);
  const baseVariacoes =
    isAdvancedMode || !(audience === "infantil" && challenge.variacoesInfantis?.length)
      ? challenge.variacoes
      : challenge.variacoesInfantis;
  const palavrasDaRodada = baseVariacoes[variationIndex] ?? baseVariacoes[0];
  const ageProfile = getMemoryAgeProfile(usuario.idade);
  const palavrasVisiveis = isAdvancedMode ? palavrasDaRodada : palavrasDaRodada.slice(0, ageProfile.visibleWords);
  const visualChoices = useMemo(
    () => getStableVisualChoices(palavrasVisiveis, baseVariacoes, challenge.id, variationIndex),
    [baseVariacoes, challenge.id, palavrasVisiveis, variationIndex],
  );
  const dificuldade = isAdvancedMode
    ? {
        tempoMemorizacao: challenge.tempoMemorizacao,
        minimoParaConcluir: challenge.minimoParaConcluir,
      }
    : getMemoryDifficulty({
        tempoBase: challenge.tempoMemorizacao,
        minimoBase: challenge.minimoParaConcluir,
        idade: usuario.idade,
        progress: progresso[selectedId],
      });
  const challengeNumber = challengeIds.indexOf(challenge.id) + 1;
  const ageDescription = getAgeLabel(usuario.idade);

  useEffect(() => {
    setSelectedId((current) => (challengeIds.includes(current) ? current : firstChallengeId));
  }, [challengeIds, firstChallengeId]);

  useEffect(() => {
    progressoRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    if (phase !== "memorizing") return;
    if (countdown <= 0) {
      setPhase("answering");
      return;
    }

    const timeout = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "answering") return;
    const interval = window.setInterval(() => setAnswerSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    const savedVariationIndex = progressoRef.current[selectedId]?.lastVariationIndex ?? null;
    setVariationIndex(getNextVariationIndex(baseVariacoes.length, savedVariationIndex));
    setPhase("idle");
    setCountdown(0);
    setAnswerSeconds(0);
    setSelectedItems([]);
    setFeedback("");
    setReview(null);
  }, [selectedId, baseVariacoes.length]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, variationIndex, onRememberVariation]);

  function resetRound() {
    setPhase("idle");
    setCountdown(0);
    setAnswerSeconds(0);
    setSelectedItems([]);
    setFeedback("");
    setReview(null);
    setVariationIndex((current) => getNextVariationIndex(baseVariacoes.length, current));
  }

  function advanceRound() {
    const nextChallenge = challengeList.find((item) => item.id > challenge.id);
    if (review?.completed && nextChallenge) {
      setSelectedId(nextChallenge.id);
      return;
    }

    resetRound();
  }

  function startChallenge() {
    setPhase("memorizing");
    setCountdown(dificuldade.tempoMemorizacao);
    setAnswerSeconds(0);
    setSelectedItems([]);
    setFeedback("");
    setReview(null);
  }

  function toggleItem(item: string) {
    if (phase !== "answering") return;

    playAnswerSound();
    setSelectedItems((current) =>
      current.includes(item) ? current.filter((token) => token !== item) : [...current, item],
    );
  }

  function submitAnswer() {
    if (phase !== "answering") return;

    const result = evaluateMemoryRound({
      expectedWords: palavrasVisiveis,
      response: selectedItems.join(", "),
      answerSeconds,
      memorizationSeconds: dificuldade.tempoMemorizacao,
      minimumToComplete: dificuldade.minimoParaConcluir,
    });

    setPhase("result");
    setFeedback(
      result.completed
        ? `Voce acertou ${result.hits.length} figura(s) e concluiu o desafio. Score da rodada: ${result.score}.`
        : `Voce acertou ${result.hits.length} figura(s). Precisa de ${dificuldade.minimoParaConcluir} para concluir este desafio.`,
    );
    setReview(result);
    playResultSound(result.completed);
    onSaveResult(challenge.id, result.score, answerSeconds, result.completed, variationIndex);
  }

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">{isAdvancedMode ? "Testes Avancados" : "Trilha de memoria"}</p>
            <h1>{isAdvancedMode ? "Memoria de altissima carga" : "Memorize, oculte e recupere"}</h1>
            <p className="muted">
              {isAdvancedMode
                ? "Estas fases usam listas maiores, codigos parecidos e nenhuma reducao por idade."
                : "Cada rodada tem uma unica correcao. Pontos extras so entram quando voce melhora seu recorde anterior."}
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
                  onClick={() => {
                    setSelectedId(item.id);
                  }}
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
                  <h3>Correcao da rodada</h3>
                  <p className="muted">{feedback}</p>
                </div>
                <span className="pill">Score {review.score}</span>
              </div>
              <ReviewMetrics
                items={[
                  { label: "Acertos", value: String(review.hits.length) },
                  { label: "Erros", value: String(review.wrongWords.length) },
                  { label: "Faltaram", value: String(review.missedWords.length) },
                ]}
                note={
                  review.completed
                    ? "Excelente. Agora tente repetir mantendo a mesma precisao."
                    : review.missedWords.length > 0
                      ? `Onde errou: faltou lembrar ${review.missedWords.length} figura(s). Observe a coluna "Faltaram" antes de tentar de novo.`
                      : "Onde errou: havia selecao extra. Compare os erros marcados com as figuras corretas."
                }
              />

            <div className="review-grid">
              <div className="review-column review-good">
                <strong>Acertos</strong>
                <div className="review-tags">
                  {review.hits.length > 0 ? (
                    review.hits.map((item) => (
                      <MemoryFigureCard key={item} token={item} />
                    ))
                  ) : (
                    <span className="small-muted">Nenhuma figura correta.</span>
                  )}
                </div>
              </div>

              <div className="review-column review-bad">
                <strong>Erros marcados</strong>
                <div className="review-tags">
                  {review.wrongWords.length > 0 ? (
                    review.wrongWords.map((item) => (
                      <MemoryFigureCard key={item} token={item} />
                    ))
                  ) : (
                    <span className="small-muted">Nenhuma figura errada.</span>
                  )}
                </div>
              </div>

              <div className="review-column">
                <strong>Faltaram</strong>
                <div className="review-tags">
                  {review.missedWords.length > 0 ? (
                    review.missedWords.map((item) => (
                      <MemoryFigureCard key={item} token={item} />
                    ))
                  ) : (
                    <span className="small-muted">Voce lembrou de todas.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="button-row">
              <button className="btn btn-primary btn-round-retry" onClick={startChallenge}>
                Tentar novamente
              </button>
              <button className="btn btn-secondary" onClick={advanceRound}>
                Avançar
              </button>
              <button className="btn btn-secondary btn-round-swap" onClick={resetRound}>
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
                objective="Observe as figuras, espere o tempo terminar e depois selecione apenas as que voce lembrar."
                steps={[
                  "Clique em Iniciar rodada para mostrar as figuras.",
                  "Memorize cada figura enquanto o contador estiver ativo.",
                  "Quando as figuras sumirem, selecione no painel ao lado o que voce lembrar.",
                  "Use Corrigir rodada para ver acertos, erros e figuras faltantes.",
                ]}
                tip={
                  isAdvancedMode
                    ? "No modo avancado, a diferenca entre itens e minima. Vale conferir com calma antes de responder."
                    : "Cada rodada vale uma correcao. Para subir pontos, voce precisa superar o seu melhor score nesta fase."
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
                  <span>{`${dificuldade.minimoParaConcluir} acertos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Figuras</strong>
                  <span>{`${palavrasVisiveis.length} itens`}</span>
                </div>
              </div>

              <div className="meter-box">
                <strong>Tempo de memorizacao</strong>
                <span>{phase === "memorizing" ? `${countdown}s restantes` : "Pronto para iniciar"}</span>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Figuras lembradas</h3>
                <span className="small-muted">
                  {phase === "answering" ? `${answerSeconds}s respondendo` : "Aguardando rodada"}
                </span>
              </div>
              <div className="response-timer-row">
                <TimerDisplay
                  label={phase === "memorizing" ? "Memorizacao" : phase === "answering" ? "Resposta" : "Tempo"}
                  value={phase === "memorizing" ? `${countdown}s` : phase === "answering" ? `${answerSeconds}s` : "--"}
                  tone={phase === "memorizing" || phase === "answering" ? "active" : "neutral"}
                />
              </div>
              <div className="memory-task-card">
                <strong className="memory-task-title">
                  {!isAdvancedMode && audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}
                </strong>
                <span className="memory-task-meta">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
                <p className={`memory-task-description ${isAdvancedMode ? "advanced-task-description" : ""}`}>
                  {isAdvancedMode
                    ? `Lembre pelo menos ${dificuldade.minimoParaConcluir} de ${palavrasVisiveis.length} figuras desta rodada.`
                    : `${ageDescription} - Lembre pelo menos ${dificuldade.minimoParaConcluir} de ${palavrasVisiveis.length} figuras desta rodada.`}
                </p>
              </div>

              <div className="button-row memory-controls">
                <button className="btn btn-primary btn-round-start" onClick={startChallenge} disabled={phase === "memorizing"}>
                  {phase === "idle" ? "Iniciar rodada" : "Memorizando"}
                </button>
                <button className="btn btn-secondary btn-round-swap" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>

              <div className="memory-answer-board">
                {phase === "memorizing" ? (
                  <div className="memory-preview-box">
                    <p className="small-muted memory-preview-label">Figuras para memorizar</p>
                    <div className="memory-selected-grid">
                      {palavrasVisiveis.map((item) => (
                        <MemoryFigureCard key={item} token={item} />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="memory-selected-box">
                  {selectedItems.length > 0 ? (
                    <div className="memory-selected-grid">
                      {selectedItems.map((item) => (
                        <MemoryFigureCard key={item} token={item} />
                      ))}
                    </div>
                  ) : (
                    <span className="small-muted">As figuras escolhidas aparecem aqui.</span>
                  )}
                </div>

                <div className="memory-choice-grid">
                  {visualChoices.map((item) => (
                    <button
                      key={item}
                      className={`memory-choice-button ${selectedItems.includes(item) ? "memory-choice-button-selected" : ""}`}
                      type="button"
                      onClick={() => toggleItem(item)}
                      disabled={phase !== "answering"}
                    >
                      <MemoryFigureCard token={item} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="button-row">
                <button
                  className="btn btn-primary btn-round-submit"
                  onClick={submitAnswer}
                  disabled={phase !== "answering" || selectedItems.length === 0}
                >
                  Corrigir rodada
                </button>
                <button
                  className="btn btn-secondary btn-round-clear"
                  onClick={() => setSelectedItems([])}
                  disabled={phase !== "answering" || selectedItems.length === 0}
                >
                  Limpar escolha
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
