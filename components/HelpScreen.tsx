"use client";

import { useState } from "react";
import type { HelpRequest, Usuario } from "@/lib/types";

type HelpScreenProps = {
  usuario: Usuario;
  requests: HelpRequest[];
  onBack: () => void;
  onSubmit: (request: { email: string; name: string; subject: string; message: string }) => Promise<void>;
};

const FAQ_ITEMS = [
  {
    question: "Como comeco uma rodada?",
    answer: "Entre no jogo desejado, leia a caixa de instruções e clique em 'Iniciar rodada'. A fase passa a valer quando a rodada começa.",
  },
  {
    question: "Como ganho pontos?",
    answer: "Os pontos aumentam quando você melhora o seu melhor resultado naquela fase. Repetir a mesma pontuação não adiciona pontos extras.",
  },
  {
    question: "Meu progresso fica salvo?",
    answer: "Sim. Nesta versão, o progresso fica salvo no navegador do próprio dispositivo. A base já está pronta para backend online no futuro.",
  },
  {
    question: "O que fazer se eu não entender um exercicio?",
    answer: "Leia a caixa 'Como funciona' dentro do jogo. Se ainda houver dúvida, use o formulario abaixo para registrar sua pergunta.",
  },
];

export function HelpScreen({ usuario, requests, onBack, onSubmit }: HelpScreenProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      setNotice("Preencha o assunto e a mensagem para enviar sua dúvida.");
      return;
    }

    setIsSending(true);
    await onSubmit({
      email: usuario.email,
      name: usuario.nome,
      subject: subject.trim(),
      message: message.trim(),
    });
    setSubject("");
    setMessage("");
    setNotice("Sua dúvida foi registrada com sucesso. Ela tambem aparece na área administrativa.");
    setIsSending(false);
  }

  return (
    <main className="shell shell-center">
      <section className="game-card">
        <header className="game-header">
          <div>
            <p className="eyebrow">Ajuda</p>
            <h1>Central de apoio ao usuário</h1>
            <p className="muted">Consulte respostas rápidas e registre uma pergunta se precisar de orientação.</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar ao painel
          </button>
        </header>

        <div className="game-grid">
          <section className="panel">
            <div className="section-head">
              <h3>Perguntas frequentes</h3>
              <span className="small-muted">Respostas imediatas</span>
            </div>

            <div className="faq-list">
              {FAQ_ITEMS.map((item) => (
                <article key={item.question} className="faq-card">
                  <strong>{item.question}</strong>
                  <p className="muted">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <h3>Enviar dúvida</h3>
              <span className="small-muted">{requests.length} registro(s) enviado(s)</span>
            </div>

            <label className="field">
              <span>Assunto</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: Não entendi o jogo de orientação espacial" />
            </label>

            <label className="field">
              <span>Mensagem</span>
              <textarea
                className="text-input area-input"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Descreva o que aconteceu ou em qual tela você precisa de ajuda."
              />
            </label>

            {notice ? <p className={`notice ${notice.includes("sucesso") ? "notice-ok" : ""}`}>{notice}</p> : null}

            <div className="button-row">
              <button className="btn btn-primary" onClick={handleSubmit} disabled={isSending}>
                {isSending ? "Enviando..." : "Enviar dúvida"}
              </button>
            </div>

            <div className="help-history">
              <strong>Suas últimas dúvidas</strong>
              {requests.length > 0 ? (
                requests.slice(0, 4).map((request) => (
                  <article key={request.id} className="faq-card">
                    <div className="section-head">
                      <strong>{request.subject}</strong>
                      <span className="small-muted">{request.status}</span>
                    </div>
                    <p className="muted">{request.message}</p>
                    {request.adminReply ? (
                      <div className="help-reply-box">
                        <strong>Resposta da equipe</strong>
                        <p className="muted">{request.adminReply}</p>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="small-muted">Nenhuma dúvida enviada ainda.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
