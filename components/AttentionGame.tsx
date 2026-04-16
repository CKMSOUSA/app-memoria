"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChildVisualBadge } from "@/components/ChildVisualBadge";
import { GameGuide } from "@/components/GameGuide";
import { ReviewMetrics } from "@/components/ReviewMetrics";
import { SoundToggle, useSoundFeedback } from "@/components/SoundToggle";
import { TimerDisplay } from "@/components/TimerDisplay";
import { advancedAttentionChallenges } from "@/lib/advanced-game-data";
import { attentionChallenges } from "@/lib/game-data-v3";
import { evaluateAttentionRound, getNextVariationIndex } from "@/lib/game-logic";
import {
  getAgeLabel,
  getAttentionAgeProfile,
  getAttentionDifficulty,
  getAudienceFromAge,
  getNivel,
  isChallengeUnlockedInOrder,
} from "@/lib/scoring";
import type { AttentionChallenge, ProgressState, Usuario } from "@/lib/types";

type AttentionGameProps = {
  usuario: Usuario;
  progresso: ProgressState["atencao"];
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

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export function AttentionGame({
  usuario,
  progresso,
  onBack,
  onRememberVariation,
  onSaveResult,
  isAdvancedMode = false,
}: AttentionGameProps) {
  const challengeList: AttentionChallenge[] = isAdvancedMode ? advancedAttentionChallenges : attentionChallenges;
  const challengeIds = challengeList.map((item) => item.id);
  const firstChallengeId = challengeList[0]?.id ?? 1;
  const [selectedId, setSelectedId] = useState(firstChallengeId);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [foundTargets, setFoundTargets] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const [grid, setGrid] = useState<string[]>([]);
  const [wrongSelections, setWrongSelections] = useState<string[]>([]);
  const [review, setReview] = useState<{
    foundCount: number;
    totalTargets: number;
    wrongClicks: number;
    elapsedSeconds: number;
    score: number;
    completed: boolean;
    hits: string[];
    errors: string[];
  } | null>(null);
  const { soundEnabled, toggleSound, playResultSound, playAnswerSound } = useSoundFeedback();

  const challenge = useMemo(
    () => challengeList.find((item) => item.id === selectedId) ?? challengeList[0],
    [challengeList, selectedId],
  );
  const progressoRef = useRef(progresso);
  const resultSubmittedRef = useRef(false);
  const audience = getAudienceFromAge(usuario.idade);
  const showChildVisuals = !isAdvancedMode && usuario.idade <= 10;
  const variacaoAtual = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const ageProfile = getAttentionAgeProfile(usuario.idade);
  const gradeBase =
    !isAdvancedMode && audience === "infantil" && variacaoAtual.gradeInfantil?.length ? variacaoAtual.gradeInfantil : variacaoAtual.grade;
  const gradeVisivel = useMemo(
    () => (isAdvancedMode ? gradeBase : gradeBase.slice(0, ageProfile.visibleCells)),
    [ageProfile.visibleCells, gradeBase, isAdvancedMode],
  );
  const dificuldade = isAdvancedMode
    ? { tempoLimite: challenge.tempoLimite, minimoParaConcluir: challenge.minimoParaConcluir }
    : getAttentionDifficulty({
        tempoBase: challenge.tempoLimite,
        minimoBase: challenge.minimoParaConcluir,
        idade: usuario.idade,
        progress: progresso[selectedId],
      });
  const challengeNumber = challengeIds.indexOf(challenge.id) + 1;
  const ageDescription = getAgeLabel(usuario.idade);

  const activeTarget = showChildVisuals && variacaoAtual.gradeInfantil?.includes(variacaoAtual.alvo) ? variacaoAtual.alvo : variacaoAtual.alvo;
  const targetIndexes = useMemo(
    () => grid.map((item, index) => (item === activeTarget ? index : -1)).filter((value) => value >= 0),
    [activeTarget, grid],
  );

  useEffect(() => {
    setSelectedId((current) => (challengeIds.includes(current) ? current : firstChallengeId));
  }, [challengeIds, firstChallengeId]);

  useEffect(() => {
    progressoRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      const foundCount = foundTargets.length;
      const result = evaluateAttentionRound({
        foundCount,
        totalTargets: targetIndexes.length,
        wrongClicks,
        timeLeft,
        timeLimit: dificuldade.tempoLimite,
        minimumToComplete: dificuldade.minimoParaConcluir,
      });

      if (resultSubmittedRef.current) return;
      resultSubmittedRef.current = true;
      setPhase("result");
      setReview({
        ...result,
        hits: Array.from({ length: result.foundCount }, () => activeTarget),
        errors: wrongSelections,
      });
      setFeedback(
        result.completed
          ? `Voce encontrou ${result.foundCount} alvo(s) e concluiu o desafio. Score da rodada: ${result.score}.`
          : `Voce encontrou ${result.foundCount} de ${result.totalTargets} alvo(s). Precisa de ${dificuldade.minimoParaConcluir} para concluir.`,
      );
      playResultSound(result.completed);
      onSaveResult(challenge.id, result.score, result.elapsedSeconds, result.completed, variationIndex);
      return;
    }

    const timeout = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [activeTarget, challenge.id, dificuldade.minimoParaConcluir, dificuldade.tempoLimite, foundTargets.length, onSaveResult, phase, playResultSound, targetIndexes.length, timeLeft, variationIndex, wrongClicks, wrongSelections]);

  useEffect(() => {
    setGrid(shuffle(gradeVisivel));
    setPhase("idle");
    setTimeLeft(0);
    setWrongClicks(0);
    setFoundTargets([]);
    setFeedback("");
    setWrongSelections([]);
    setReview(null);
    resultSubmittedRef.current = false;
  }, [challenge.id, variationIndex, gradeVisivel]);

  useEffect(() => {
    if (phase === "playing" && targetIndexes.length > 0 && foundTargets.length === targetIndexes.length) {
      if (resultSubmittedRef.current) return;
      resultSubmittedRef.current = true;
      const result = evaluateAttentionRound({
        foundCount: foundTargets.length,
        totalTargets: targetIndexes.length,
        wrongClicks,
        timeLeft,
        timeLimit: dificuldade.tempoLimite,
        minimumToComplete: dificuldade.minimoParaConcluir,
      });

      setPhase("result");
      setReview({
        ...result,
        hits: Array.from({ length: result.foundCount }, () => activeTarget),
        errors: wrongSelections,
      });
      setFeedback(
        result.completed
          ? `Voce encontrou ${result.foundCount} alvo(s) e concluiu o desafio. Score da rodada: ${result.score}.`
          : `Voce encontrou ${result.foundCount} de ${result.totalTargets} alvo(s). Precisa de ${dificuldade.minimoParaConcluir} para concluir.`,
      );
      playResultSound(result.completed);
      onSaveResult(challenge.id, result.score, result.elapsedSeconds, result.completed, variationIndex);
    }
  }, [activeTarget, challenge.id, dificuldade.minimoParaConcluir, dificuldade.tempoLimite, foundTargets, onSaveResult, phase, playResultSound, targetIndexes, timeLeft, variationIndex, wrongClicks, wrongSelections]);

  function startRound() {
    setGrid(shuffle(gradeVisivel));
    setTimeLeft(dificuldade.tempoLimite);
    setWrongClicks(0);
    setFoundTargets([]);
    setFeedback("");
    setWrongSelections([]);
    setReview(null);
    resultSubmittedRef.current = false;
    setPhase("playing");
  }

  function resetRound() {
    const nextVariationIndex = getNextVariationIndex(challenge.variacoes.length, variationIndex);
    const nextVariation = challenge.variacoes[nextVariationIndex];
    const nextGridBase =
      !isAdvancedMode && audience === "infantil" && nextVariation.gradeInfantil?.length ? nextVariation.gradeInfantil : nextVariation.grade;
    setVariationIndex(nextVariationIndex);
    setPhase("idle");
    setTimeLeft(0);
    setWrongClicks(0);
    setFoundTargets([]);
    setFeedback("");
    setWrongSelections([]);
    setReview(null);
    resultSubmittedRef.current = false;
    setGrid(shuffle(isAdvancedMode ? nextGridBase : nextGridBase.slice(0, ageProfile.visibleCells)));
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
    if (foundTargets.includes(index)) return;

    playAnswerSound();
    if (grid[index] === activeTarget) {
      setFoundTargets((current) => [...current, index]);
      return;
    }

    setWrongClicks((value) => value + 1);
    setWrongSelections((current) => [...current, grid[index]]);
  }

  useEffect(() => {
    const savedVariationIndex = progressoRef.current[selectedId]?.lastVariationIndex ?? null;
    setVariationIndex(getNextVariationIndex(challenge.variacoes.length, savedVariationIndex));
  }, [selectedId, challenge.variacoes.length]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, variationIndex, onRememberVariation]);

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">{isAdvancedMode ? "Testes Avancados" : "Trilha de atencao"}</p>
            <h1>{isAdvancedMode ? "Atencao seletiva extrema" : "Encontre apenas o estimulo correto"}</h1>
            <p className="muted">
              {isAdvancedMode
                ? "A grade usa distratores muito parecidos e nao reduz carga visual por idade."
                : "Velocidade ajuda, mas cliques errados reduzem seu score. A ideia aqui e treinar foco seletivo."}
            </p>
          </div>
          <div className="button-row">
            <TimerDisplay
              label="Tempo"
              value={phase === "playing" ? `${timeLeft}s` : "--"}
              tone={phase === "playing" && timeLeft <= 10 ? "warning" : phase === "playing" ? "active" : "neutral"}
            />
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
                  <h3>Correcao da rodada</h3>
                  <p className="muted">{feedback}</p>
                </div>
                <span className="pill">Score {review.score}</span>
              </div>
              <ReviewMetrics
                items={[
                  { label: "Alvos certos", value: String(review.foundCount) },
                  { label: "Erros", value: String(review.wrongClicks) },
                  { label: "Tempo", value: `${review.elapsedSeconds}s` },
                ]}
              note="Observe se voce perdeu por pressa ou por clicar no simbolo errado. O foco seletivo melhora quando erro e velocidade entram em equilibrio."
            />
            {!review.completed ? (
              <p className="review-note">
                {review.wrongClicks > 0
                  ? `Onde errou: houve ${review.wrongClicks} clique(s) fora do alvo ${variacaoAtual.alvo}.`
                  : `Onde errou: faltaram ${Math.max(review.totalTargets - review.foundCount, 0)} alvo(s) para completar a meta.`}
              </p>
            ) : null}

            <div className="review-grid">
              <div className="review-column review-good">
                <strong>Acertos</strong>
                <div className="review-tags">
                  {review.hits.length > 0 ? (
                    review.hits.map((item, index) => (
                      <span key={`${item}-${index}`} className="review-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Nenhum alvo encontrado.</span>
                  )}
                </div>
              </div>

              <div className="review-column review-bad">
                <strong>Erros</strong>
                <div className="review-tags">
                  {review.errors.length > 0 ? (
                    review.errors.map((item, index) => (
                      <span key={`${item}-${index}`} className="review-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Nenhum clique errado.</span>
                  )}
                </div>
              </div>

              <div className="review-column">
                <strong>Resumo</strong>
                <div className="review-summary">
                  <span>Alvo: {variacaoAtual.alvo}</span>
                  <span>
                    {review.foundCount}/{review.totalTargets} encontrados
                  </span>
                  <span>{review.elapsedSeconds}s na rodada</span>
                </div>
              </div>
            </div>

            <div className="button-row">
              <button className="btn btn-primary" onClick={startRound}>
                Jogar novamente
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
                objective="Clique somente nos simbolos alvo. Tudo o que nao for alvo conta como erro."
                steps={[
                  "Confira o simbolo alvo antes de iniciar a rodada.",
                  "Clique em Iniciar rodada para liberar a grade.",
                  "Toque apenas nas celulas com o alvo correto antes do tempo acabar.",
                  "No final, veja quantos alvos encontrou e quantos erros cometeu.",
                ]}
                tip={
                  isAdvancedMode
                    ? "No modo avancado, a maior parte da dificuldade esta nos quase-acertos. Olhe duas vezes antes de clicar."
                    : "Quanto menos erros e quanto mais rapido voce encontrar os alvos, melhor sera o score da fase."
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
                  <span>{`${dificuldade.minimoParaConcluir} alvos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Grade</strong>
                  <span>{`${gradeVisivel.length} celulas`}</span>
                </div>
              </div>

              <div className="attention-banner">
                <strong>Alvo do desafio</strong>
                <div className="target-pill">
                  {showChildVisuals ? <ChildVisualBadge token={activeTarget} compact /> : activeTarget}
                </div>
              </div>

              <div className="status-row">
                <div className="meter-box">
                  <strong>Tempo restante</strong>
                  <span>{phase === "playing" ? `${timeLeft}s` : "Aguardando inicio"}</span>
                </div>
                <div className="meter-box">
                  <strong>Erros</strong>
                  <span>{wrongClicks}</span>
                </div>
              </div>

            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Grade de foco</h3>
                <span className="small-muted">
                  {foundTargets.length}/{targetIndexes.length} alvo(s) encontrados
                </span>
              </div>

              <div className="round-task-card">
                <strong className="round-task-title">
                  {!isAdvancedMode && audience === "infantil" && challenge.nomeInfantil ? challenge.nomeInfantil : challenge.nome}
                </strong>
                <span className="round-task-meta">{`Fase ${challengeNumber} - ${challenge.difficultyLabel}`}</span>
                <p className={`round-task-description ${isAdvancedMode ? "advanced-task-description" : ""}`}>
                  {isAdvancedMode
                    ? variacaoAtual.instrucao
                    : `${ageDescription} - ${
                        audience === "infantil" && variacaoAtual.instrucaoInfantil ? variacaoAtual.instrucaoInfantil : variacaoAtual.instrucao
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

              <div className="attention-grid">
                {grid.map((item, index) => {
                  const isFound = foundTargets.includes(index);
                  return (
                    <button
                      key={`${item}-${index}`}
                      className={`attention-cell ${isFound ? "attention-cell-hit" : ""}`}
                      onClick={() => handleCellClick(index)}
                      disabled={phase !== "playing" || isFound}
                    >
                      {showChildVisuals ? <ChildVisualBadge token={item} compact /> : item}
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
