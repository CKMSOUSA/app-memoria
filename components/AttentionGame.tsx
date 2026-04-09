"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameGuide } from "@/components/GameGuide";
import { attentionChallenges } from "@/lib/game-data-v3";
import { evaluateAttentionRound, getNextVariationIndex } from "@/lib/game-logic";
import {
  getAgeLabel,
  getAttentionAgeProfile,
  getAttentionDifficulty,
  getAudienceFromAge,
  getNivel,
  isChallengeUnlocked,
} from "@/lib/scoring";
import type { ProgressState, Usuario } from "@/lib/types";

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

export function AttentionGame({ usuario, progresso, onBack, onRememberVariation, onSaveResult }: AttentionGameProps) {
  const [selectedId, setSelectedId] = useState(1);
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

  const challenge = useMemo(
    () => attentionChallenges.find((item) => item.id === selectedId) ?? attentionChallenges[0],
    [selectedId],
  );
  const progressoRef = useRef(progresso);
  const audience = getAudienceFromAge(usuario.idade);
  const variacaoAtual = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];
  const ageProfile = getAttentionAgeProfile(usuario.idade);
  const gradeBase =
    audience === "infantil" && variacaoAtual.gradeInfantil?.length ? variacaoAtual.gradeInfantil : variacaoAtual.grade;
  const gradeVisivel = useMemo(
    () => gradeBase.slice(0, ageProfile.visibleCells),
    [ageProfile.visibleCells, gradeBase],
  );
  const dificuldade = getAttentionDifficulty({
    tempoBase: challenge.tempoLimite,
    minimoBase: challenge.minimoParaConcluir,
    idade: usuario.idade,
    progress: progresso[selectedId],
  });

  const targetIndexes = useMemo(
    () => grid.map((item, index) => (item === variacaoAtual.alvo ? index : -1)).filter((value) => value >= 0),
    [grid, variacaoAtual.alvo],
  );

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

      setPhase("result");
      setReview({
        ...result,
        hits: Array.from({ length: result.foundCount }, () => variacaoAtual.alvo),
        errors: wrongSelections,
      });
      setFeedback(
        result.completed
          ? `Voce encontrou ${result.foundCount} alvo(s) e concluiu o desafio. Score da rodada: ${result.score}.`
          : `Voce encontrou ${result.foundCount} de ${result.totalTargets} alvo(s). Precisa de ${dificuldade.minimoParaConcluir} para concluir.`,
      );
      onSaveResult(challenge.id, result.score, result.elapsedSeconds, result.completed, variationIndex);
      return;
    }

    const timeout = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [challenge.id, dificuldade.minimoParaConcluir, dificuldade.tempoLimite, foundTargets.length, onSaveResult, phase, targetIndexes.length, timeLeft, variacaoAtual.alvo, variationIndex, wrongClicks, wrongSelections]);

  useEffect(() => {
    setGrid(shuffle(gradeVisivel));
    setPhase("idle");
    setTimeLeft(0);
    setWrongClicks(0);
    setFoundTargets([]);
    setFeedback("");
    setWrongSelections([]);
    setReview(null);
  }, [challenge.id, variationIndex, gradeVisivel]);

  useEffect(() => {
    if (phase === "playing" && targetIndexes.length > 0 && foundTargets.length === targetIndexes.length) {
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
        hits: Array.from({ length: result.foundCount }, () => variacaoAtual.alvo),
        errors: wrongSelections,
      });
      setFeedback(
        result.completed
          ? `Voce encontrou ${result.foundCount} alvo(s) e concluiu o desafio. Score da rodada: ${result.score}.`
          : `Voce encontrou ${result.foundCount} de ${result.totalTargets} alvo(s). Precisa de ${dificuldade.minimoParaConcluir} para concluir.`,
      );
      onSaveResult(challenge.id, result.score, result.elapsedSeconds, result.completed, variationIndex);
    }
  }, [challenge.id, dificuldade.minimoParaConcluir, dificuldade.tempoLimite, foundTargets, onSaveResult, phase, targetIndexes, timeLeft, variacaoAtual.alvo, variationIndex, wrongClicks, wrongSelections]);

  function startRound() {
    setGrid(shuffle(gradeVisivel));
    setTimeLeft(dificuldade.tempoLimite);
    setWrongClicks(0);
    setFoundTargets([]);
    setFeedback("");
    setWrongSelections([]);
    setReview(null);
    setPhase("playing");
  }

  function resetRound() {
    const nextVariationIndex = getNextVariationIndex(challenge.variacoes.length, variationIndex);
    const nextVariation = challenge.variacoes[nextVariationIndex];
    const nextGridBase =
      audience === "infantil" && nextVariation.gradeInfantil?.length ? nextVariation.gradeInfantil : nextVariation.grade;
    setVariationIndex(nextVariationIndex);
    setPhase("idle");
    setTimeLeft(0);
    setWrongClicks(0);
    setFoundTargets([]);
    setFeedback("");
    setWrongSelections([]);
    setReview(null);
    setGrid(shuffle(nextGridBase.slice(0, ageProfile.visibleCells)));
  }

  function handleCellClick(index: number) {
    if (phase !== "playing") return;
    if (foundTargets.includes(index)) return;

    if (grid[index] === variacaoAtual.alvo) {
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
            <p className="eyebrow">Trilha de atencao</p>
            <h1>Encontre apenas o estimulo correto</h1>
            <p className="muted">
              Velocidade ajuda, mas cliques errados reduzem seu score. A ideia aqui e treinar foco seletivo.
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
            {attentionChallenges.map((item) => {
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
              <p className="muted">{`${getAgeLabel(usuario.idade)} - ${audience === "infantil" && variacaoAtual.instrucaoInfantil ? variacaoAtual.instrucaoInfantil : variacaoAtual.instrucao}`}</p>

              <GameGuide
                title="Como jogar"
                objective="Clique somente nos simbolos alvo. Tudo o que nao for alvo conta como erro."
                steps={[
                  "Confira o simbolo alvo antes de iniciar a rodada.",
                  "Clique em Iniciar rodada para liberar a grade.",
                  "Toque apenas nas celulas com o alvo correto antes do tempo acabar.",
                  "No final, veja quantos alvos encontrou e quantos erros cometeu.",
                ]}
                tip="Quanto menos erros e quanto mais rapido voce encontrar os alvos, melhor sera o score da fase."
              />

              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challenge.id} de ${attentionChallenges.length}`}</span>
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
                <div className="target-pill">{variacaoAtual.alvo}</div>
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

              <div className="button-row">
                <button className="btn btn-primary" onClick={startRound} disabled={phase === "playing"}>
                  {phase === "playing" ? "Rodada em andamento" : "Iniciar rodada"}
                </button>
                <button className="btn btn-secondary" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Grade de foco</h3>
                <span className="small-muted">
                  {foundTargets.length}/{targetIndexes.length} alvo(s) encontrados
                </span>
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
                      {item}
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
