"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameGuide } from "@/components/GameGuide";
import { memoryChallenges } from "@/lib/game-data-v3";
import { evaluateMemoryRound, getNextVariationIndex } from "@/lib/game-logic";
import {
  getAgeLabel,
  getAudienceFromAge,
  getMemoryAgeProfile,
  getMemoryDifficulty,
  getNivel,
  isChallengeUnlocked,
} from "@/lib/scoring";
import type { ProgressState, Usuario } from "@/lib/types";

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
};

type Phase = "idle" | "memorizing" | "answering" | "result";

export function MemoryGame({ usuario, progresso, onBack, onRememberVariation, onSaveResult }: MemoryGameProps) {
  const [selectedId, setSelectedId] = useState(1);
  const [variationIndex, setVariationIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState<{
    hits: string[];
    wrongWords: string[];
    missedWords: string[];
    score: number;
    completed: boolean;
  } | null>(null);

  const challenge = useMemo(
    () => memoryChallenges.find((item) => item.id === selectedId) ?? memoryChallenges[0],
    [selectedId],
  );
  const progressoRef = useRef(progresso);
  const audience = getAudienceFromAge(usuario.idade);
  const baseVariacoes =
    audience === "infantil" && challenge.variacoesInfantis?.length ? challenge.variacoesInfantis : challenge.variacoes;
  const palavrasDaRodada = baseVariacoes[variationIndex] ?? baseVariacoes[0];
  const ageProfile = getMemoryAgeProfile(usuario.idade);
  const palavrasVisiveis = palavrasDaRodada.slice(0, ageProfile.visibleWords);
  const dificuldade = getMemoryDifficulty({
    tempoBase: challenge.tempoMemorizacao,
    minimoBase: challenge.minimoParaConcluir,
    idade: usuario.idade,
    progress: progresso[selectedId],
  });

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
    setResponse("");
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
    setResponse("");
    setFeedback("");
    setReview(null);
    setVariationIndex((current) => getNextVariationIndex(baseVariacoes.length, current));
  }

  function startChallenge() {
    setPhase("memorizing");
    setCountdown(dificuldade.tempoMemorizacao);
    setAnswerSeconds(0);
    setResponse("");
    setFeedback("");
    setReview(null);
  }

  function submitAnswer() {
    if (phase !== "answering") return;

    const result = evaluateMemoryRound({
      expectedWords: palavrasVisiveis,
      response,
      answerSeconds,
      memorizationSeconds: dificuldade.tempoMemorizacao,
      minimumToComplete: dificuldade.minimoParaConcluir,
    });

    setPhase("result");
    setFeedback(
      result.completed
        ? `Voce acertou ${result.hits.length} palavra(s) e concluiu o desafio. Score da rodada: ${result.score}.`
        : `Voce acertou ${result.hits.length} palavra(s). Precisa de ${dificuldade.minimoParaConcluir} para concluir este desafio.`,
    );
    setReview(result);
    onSaveResult(challenge.id, result.score, answerSeconds, result.completed, variationIndex);
  }

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Trilha de memoria</p>
            <h1>Memorize, oculte e recupere</h1>
            <p className="muted">
              Cada rodada tem uma unica correcao. Pontos extras so entram quando voce melhora seu recorde anterior.
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
            {memoryChallenges.map((item) => {
              const unlocked = isChallengeUnlocked(progresso, item.id);
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
                    review.hits.map((item) => (
                      <span key={item} className="review-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Nenhuma palavra correta.</span>
                  )}
                </div>
              </div>

              <div className="review-column review-bad">
                <strong>Erros digitados</strong>
                <div className="review-tags">
                  {review.wrongWords.length > 0 ? (
                    review.wrongWords.map((item) => (
                      <span key={item} className="review-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Nenhum erro digitado.</span>
                  )}
                </div>
              </div>

              <div className="review-column">
                <strong>Faltaram</strong>
                <div className="review-tags">
                  {review.missedWords.length > 0 ? (
                    review.missedWords.map((item) => (
                      <span key={item} className="review-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="small-muted">Voce lembrou de todas.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="button-row">
              <button className="btn btn-primary" onClick={startChallenge}>
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
                {`${getAgeLabel(usuario.idade)} - objetivo: lembrar pelo menos ${dificuldade.minimoParaConcluir} de ${palavrasVisiveis.length} palavras desta rodada.`}
              </p>

              <GameGuide
                title="Como jogar"
                objective="Observe as palavras, espere o tempo terminar e depois escreva apenas o que voce lembrar."
                steps={[
                  "Clique em Iniciar rodada para mostrar as palavras.",
                  "Memorize a lista enquanto o contador estiver ativo.",
                  "Quando as palavras sumirem, digite o que lembrar no campo ao lado.",
                  "Use Corrigir rodada para ver acertos, erros e itens faltantes.",
                ]}
                tip="Cada rodada vale uma correcao. Para subir pontos, voce precisa superar o seu melhor score nesta fase."
              />

              <div className="phase-summary">
                <div className="phase-chip">
                  <strong>Fase</strong>
                  <span>{`${challenge.id} de ${memoryChallenges.length}`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Meta</strong>
                  <span>{`${dificuldade.minimoParaConcluir} acertos`}</span>
                </div>
                <div className="phase-chip">
                  <strong>Palavras</strong>
                  <span>{`${palavrasVisiveis.length} itens`}</span>
                </div>
              </div>

              <div className="meter-box">
                <strong>Tempo de memorizacao</strong>
                <span>{phase === "memorizing" ? `${countdown}s restantes` : "Pronto para iniciar"}</span>
              </div>

              {phase === "memorizing" ? (
                <div className="word-box">{palavrasVisiveis.join(" - ")}</div>
              ) : (
                <div className="word-box word-box-hidden">As palavras ficam visiveis apenas durante a memorizacao.</div>
              )}

              <div className="button-row">
                <button className="btn btn-primary" onClick={startChallenge} disabled={phase === "memorizing"}>
                  {phase === "idle" ? "Iniciar rodada" : "Memorizando"}
                </button>
                <button className="btn btn-secondary" onClick={resetRound}>
                  Trocar rodada
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <h3>Sua resposta</h3>
                <span className="small-muted">
                  {phase === "answering" ? `${answerSeconds}s respondendo` : "Aguardando rodada"}
                </span>
              </div>
              <textarea
                className="text-input area-input"
                placeholder="Digite as palavras separadas por espaco, virgula ou quebra de linha. A ordem nao precisa ser igual."
                value={response}
                disabled={phase !== "answering"}
                onChange={(event) => setResponse(event.target.value)}
                rows={8}
              />
              <div className="button-row">
                <button className="btn btn-primary" onClick={submitAnswer} disabled={phase !== "answering" || !response.trim()}>
                  Corrigir rodada
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
