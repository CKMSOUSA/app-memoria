"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { exclusiveChallenges } from "@/lib/game-data-v3";
import { evaluateAudienceRound, getNextVariationIndex } from "@/lib/game-logic";
import { getAgeLabel, getAudienceFromAge, getAudienceLabel } from "@/lib/scoring";
import type { ProgressState, Usuario } from "@/lib/types";

type AudienceGameProps = {
  usuario: Usuario;
  progresso: ProgressState["especial"];
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

type Phase = "idle" | "showing" | "answering" | "result";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export function AudienceGame({ usuario, progresso, onBack, onRememberVariation, onSaveResult }: AudienceGameProps) {
  const audience = getAudienceFromAge(usuario.idade);
  const audienceChallenges = useMemo(
    () => exclusiveChallenges.filter((item) => item.audience === audience),
    [audience],
  );

  const [selectedId, setSelectedId] = useState(audienceChallenges[0]?.id ?? 0);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealLeft, setRevealLeft] = useState(0);
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [review, setReview] = useState<{
    hits: string[];
    wrongItems: string[];
    missedItems: string[];
    score: number;
  } | null>(null);

  const challenge = useMemo(
    () => audienceChallenges.find((item) => item.id === selectedId) ?? audienceChallenges[0] ?? exclusiveChallenges[0],
    [audienceChallenges, selectedId],
  );
  const progressoRef = useRef(progresso);
  const phaseNumber = Math.max(1, audienceChallenges.findIndex((item) => item.id === challenge.id) + 1);
  const completedCount = audienceChallenges.filter((item) => progresso[item.id]?.completed).length;
  const currentVariation = challenge.variacoes[variationIndex] ?? challenge.variacoes[0];

  useEffect(() => {
    progressoRef.current = progresso;
  }, [progresso]);

  useEffect(() => {
    if (audienceChallenges.length === 0) return;
    setSelectedId((current) =>
      audienceChallenges.some((item) => item.id === current) ? current : audienceChallenges[0].id,
    );
  }, [audienceChallenges]);

  useEffect(() => {
    const lastVariationIndex = progressoRef.current[challenge.id]?.lastVariationIndex ?? null;
    setVariationIndex(getNextVariationIndex(challenge.variacoes.length, lastVariationIndex));
    setPhase("idle");
    setRevealLeft(0);
    setFeedback("");
    setSelectedSequence([]);
    setAnswerSeconds(0);
    setReview(null);
  }, [challenge.id, challenge.variacoes.length]);

  useEffect(() => {
    setOptions(shuffle(currentVariation.options));
  }, [challenge.id, currentVariation.options, variationIndex]);

  useEffect(() => {
    onRememberVariation(challenge.id, variationIndex);
  }, [challenge.id, onRememberVariation, variationIndex]);

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

  function startRound() {
    setRevealLeft(currentVariation.revealSeconds);
    setSelectedSequence([]);
    setAnswerSeconds(0);
    setFeedback("");
    setReview(null);
    setPhase("showing");
  }

  function resetRound() {
    setVariationIndex((current) => getNextVariationIndex(challenge.variacoes.length, current));
    setSelectedSequence([]);
    setAnswerSeconds(0);
    setRevealLeft(0);
    setFeedback("");
    setReview(null);
    setPhase("idle");
  }

  function isAudienceChallengeUnlocked(challengeId: number) {
    const currentIndex = audienceChallenges.findIndex((item) => item.id === challengeId);
    if (currentIndex <= 0) return true;
    const previousChallenge = audienceChallenges[currentIndex - 1];
    return progresso[previousChallenge.id]?.completed ?? false;
  }

  function handleOptionClick(option: string) {
    if (phase !== "answering") return;

    const nextSequence = [...selectedSequence, option];
    setSelectedSequence(nextSequence);

    if (nextSequence.length === currentVariation.sequence.length) {
      const result = evaluateAudienceRound({
        expectedSequence: currentVariation.sequence,
        selectedSequence: nextSequence,
        answerSeconds,
        revealSeconds: currentVariation.revealSeconds,
        minimumToComplete: challenge.minimoParaConcluir,
      });

      setPhase("result");
      setFeedback(
        result.completed
          ? `Voce reconstruiu ${result.hits.length} item(ns) na ordem certa e concluiu a fase.`
          : `Voce acertou ${result.hits.length} item(ns). Precisa de ${challenge.minimoParaConcluir} para concluir esta fase.`,
      );
      setReview({
        hits: result.hits,
        wrongItems: result.misses,
        missedItems: currentVariation.sequence.filter((item) => !result.hits.includes(item)),
        score: result.score,
      });
      onSaveResult(challenge.id, result.score, answerSeconds, result.completed, variationIndex);
    }
  }

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Minijogo Exclusivo</p>
            <h1>{challenge.nome}</h1>
            <p className="small-muted">{`Fase ${phaseNumber} - ${challenge.difficultyLabel}`}</p>
            <p className="muted">{`${getAudienceLabel(audience)} - ${getAgeLabel(usuario.idade)} - ${challenge.descricao}`}</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar ao painel
          </button>
        </header>

        <section className="panel">
          <div className="section-head">
            <h3>Escolha a fase exclusiva</h3>
            <span className="small-muted">{`${completedCount}/${audienceChallenges.length} concluidas nesta trilha`}</span>
          </div>
          <div className="tabs-grid">
            {audienceChallenges.map((item, index) => {
              const unlocked = isAudienceChallengeUnlocked(item.id);
              const progress = progresso[item.id];
              const status = progress?.completed ? "Concluida" : unlocked ? "Liberada" : "Bloqueada";

              return (
                <button
                  key={item.id}
                  className={`tab-card ${item.id === challenge.id ? "tab-card-active" : ""}`}
                  disabled={!unlocked}
                  onClick={() => setSelectedId(item.id)}
                >
                  <strong>{`Fase ${index + 1} - ${item.difficultyLabel}`}</strong>
                  <span>{item.nome}</span>
                  <small>{`${status} - Melhor ${progress?.bestScore ?? 0}`}</small>
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
                    <span className="small-muted">Nenhum item certo.</span>
                  )}
                </div>
              </div>

              <div className="review-column review-bad">
                <strong>Erros</strong>
                <div className="review-tags">
                  {review.wrongItems.length > 0 ? (
                    review.wrongItems.map((item, index) => (
                      <span key={`${item}-${index}`} className="review-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Nenhuma troca errada.</span>
                  )}
                </div>
              </div>

              <div className="review-column">
                <strong>Faltaram</strong>
                <div className="review-tags">
                  {review.missedItems.length > 0 ? (
                    review.missedItems.map((item, index) => (
                      <span key={`${item}-${index}`} className="review-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Voce completou toda a sequencia.</span>
                  )}
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
                <h3>Como funciona</h3>
                <span className="small-muted">Meta: {challenge.minimoParaConcluir} acertos em ordem</span>
              </div>
              <p className="muted">{currentVariation.prompt}</p>
              <div className="meter-box">
                <strong>Tempo de exibicao</strong>
                <span>{phase === "showing" ? `${revealLeft}s restantes` : `${currentVariation.revealSeconds}s por rodada`}</span>
              </div>

              {phase === "showing" ? (
                <div className="word-box">{currentVariation.sequence.join(" - ")}</div>
              ) : (
                <div className="word-box word-box-hidden">A sequencia aparece apenas durante a exibicao inicial.</div>
              )}

              <div className="button-row">
                <button className="btn btn-primary" onClick={startRound} disabled={phase === "showing"}>
                  {phase === "showing" ? "Observando..." : "Iniciar rodada"}
                </button>
                <button className="btn btn-secondary" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Monte a sequencia</h3>
                <span className="small-muted">{phase === "answering" ? `${answerSeconds}s respondendo` : "Aguardando rodada"}</span>
              </div>

              <div className="selected-sequence">
                {selectedSequence.length > 0 ? selectedSequence.join(" - ") : "Sua resposta aparecera aqui."}
              </div>

              <div className="exclusive-grid">
                {options.map((option) => (
                  <button
                    key={option}
                    className="exclusive-option"
                    onClick={() => handleOptionClick(option)}
                    disabled={phase !== "answering" || selectedSequence.length >= currentVariation.sequence.length}
                  >
                    {option}
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
