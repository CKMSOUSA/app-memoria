"use client";

import { useState, useTransition } from "react";
import { AVATAR_OPTIONS } from "@/lib/storage";
import type { Tela, Usuario } from "@/lib/types";

type AuthScreenProps = {
  tela: Exclude<Tela, "dashboard" | "memoria" | "atencao">;
  onChangeScreen: (screen: Exclude<Tela, "dashboard" | "memoria" | "atencao">) => void;
  onLogin: (email: string, password: string) => Promise<Usuario | null>;
  onRegister: (email: string, password: string, idade: number, nome: string, avatar: string) => Promise<string | null>;
  onRecover: (email: string) => string;
};

export function AuthScreen({
  tela,
  onChangeScreen,
  onLogin,
  onRegister,
  onRecover,
}: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("25");
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [mensagem, setMensagem] = useState("");
  const [isPending, startTransition] = useTransition();

  const titulo =
    tela === "cadastro" ? "Criar conta" : tela === "recuperar" ? "Recuperar acesso" : "Entrar no NeuroApp";

  function resetMessage() {
    if (mensagem) setMensagem("");
  }

  function handleLogin() {
    startTransition(async () => {
      const user = await onLogin(email, senha);
      if (!user) {
        setMensagem("Email ou senha invalidos.");
      } else {
        setMensagem("");
      }
    });
  }

  function handleRegister() {
    startTransition(async () => {
      if (!email || !senha || !nome.trim()) {
        setMensagem("Preencha nome, email e senha para criar sua conta.");
        return;
      }

      const idadeNumero = Number(idade);
      if (!Number.isInteger(idadeNumero) || idadeNumero < 6 || idadeNumero > 99) {
        setMensagem("Informe uma idade valida entre 6 e 99 anos.");
        return;
      }

      const error = await onRegister(email, senha, idadeNumero, nome, avatar);
      setMensagem(error ?? "Cadastro realizado. Agora faca login para iniciar seus treinos.");
      if (!error) {
        setSenha("");
        onChangeScreen("login");
      }
    });
  }

  function handleRecover() {
    setMensagem(onRecover(email));
  }

  return (
    <main className="shell shell-center">
      <section className="auth-card">
        <div className="hero-block">
          <div>
            <p className="eyebrow">Treino cognitivo</p>
            <h1>{titulo}</h1>
            <p className="muted">
              Treine memoria, atencao, comparacao e orientacao espacial com fases curtas, progressivas e guiadas.
            </p>
          </div>
          <div className="hero-badge">Base pronta para backend online</div>
        </div>

        {tela === "cadastro" && (
          <label className="field">
            <span>Nome</span>
            <input
              placeholder="Como voce quer aparecer no app"
              value={nome}
              onChange={(event) => {
                resetMessage();
                setNome(event.target.value);
              }}
            />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => {
              resetMessage();
              setEmail(event.target.value);
            }}
          />
        </label>

        {tela !== "recuperar" && (
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => {
                resetMessage();
                setSenha(event.target.value);
              }}
            />
          </label>
        )}

        {tela === "cadastro" && (
          <div className="avatar-picker">
            {AVATAR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`avatar-option ${avatar === option ? "avatar-option-active" : ""}`}
                onClick={() => {
                  resetMessage();
                  setAvatar(option);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {tela === "cadastro" && (
          <label className="field">
            <span>Idade</span>
            <input
              className="text-input"
              type="number"
              min={6}
              max={99}
              value={idade}
              onChange={(event) => {
                resetMessage();
                setIdade(event.target.value);
              }}
            />
          </label>
        )}

        {tela === "login" && (
          <button className="btn btn-primary" onClick={handleLogin} disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </button>
        )}

        {tela === "cadastro" && (
          <button className="btn btn-primary" onClick={handleRegister} disabled={isPending}>
            {isPending ? "Criando conta..." : "Criar conta"}
          </button>
        )}

        {tela === "recuperar" && (
          <button className="btn btn-primary" onClick={handleRecover} disabled={!email}>
            Simular recuperacao
          </button>
        )}

        {mensagem ? (
          <p className={`notice ${mensagem.includes("realizado") || mensagem.includes("fluxo") ? "notice-ok" : ""}`}>
            {mensagem}
          </p>
        ) : null}

        <div className="auth-links">
          {tela !== "login" ? (
            <button className="btn btn-link" onClick={() => onChangeScreen("login")}>
              Voltar para login
            </button>
          ) : (
            <>
              <button className="btn btn-link" onClick={() => onChangeScreen("cadastro")}>
                Criar conta
              </button>
              <button className="btn btn-link" onClick={() => onChangeScreen("recuperar")}>
                Esqueci minha senha
              </button>
            </>
          )}
        </div>

        <div className="demo-box">
          <strong>Conta de teste</strong>
          <span>Nome: Usuario teste</span>
          <span>Email: user@email.com</span>
          <span>Senha: 123456</span>
        </div>
      </section>
    </main>
  );
}
