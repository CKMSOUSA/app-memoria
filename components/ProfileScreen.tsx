"use client";

import { useState } from "react";
import { AVATAR_OPTIONS } from "@/lib/storage";
import { getAgeBand, getAgeLabel, getAudienceLabel, getAudienceFromAge } from "@/lib/scoring";
import type { Usuario } from "@/lib/types";

const goalLabels: Record<NonNullable<Usuario["goal"]>, string> = {
  memoria: "Fortalecer memoria",
  atencao: "Melhorar atencao",
  rotina: "Criar rotina de treino",
  pedagogico: "Reforco pedagogico",
};

const levelLabels: Record<NonNullable<Usuario["selfReportedLevel"]>, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediario",
  avancado: "Avancado",
};

type ProfileScreenProps = {
  usuario: Usuario;
  onBack: () => void;
  onSaveProfile: (
    profile: Pick<Usuario, "idade" | "nome" | "avatar"> &
      Partial<Pick<Usuario, "role" | "turma" | "goal" | "selfReportedLevel" | "weeklyAvailability" | "onboardingCompletedAt">>,
  ) => void | Promise<void>;
};

const roleLabels: Record<Usuario["role"], string> = {
  aluno: "Aluno",
  responsavel: "Responsavel",
  professor: "Professor",
  admin: "Administrador",
};

export function ProfileScreen({ usuario, onBack, onSaveProfile }: ProfileScreenProps) {
  const [nome, setNome] = useState(usuario.nome);
  const [idade, setIdade] = useState(String(usuario.idade));
  const [avatar, setAvatar] = useState(usuario.avatar);
  const [role, setRole] = useState<Usuario["role"]>(usuario.role);
  const [turma, setTurma] = useState(usuario.turma ?? "");
  const [goal, setGoal] = useState<NonNullable<Usuario["goal"]>>(usuario.goal ?? "rotina");
  const [selfReportedLevel, setSelfReportedLevel] = useState<NonNullable<Usuario["selfReportedLevel"]>>(
    usuario.selfReportedLevel ?? "iniciante",
  );
  const [weeklyAvailability, setWeeklyAvailability] = useState(String(usuario.weeklyAvailability ?? 3));
  const [mensagem, setMensagem] = useState("");

  async function handleSave() {
    const idadeNumero = Number(idade);
    if (!Number.isInteger(idadeNumero) || idadeNumero < 6 || idadeNumero > 99) {
      setMensagem("Informe uma idade valida entre 6 e 99 anos.");
      return;
    }

    if (!nome.trim()) {
      setMensagem("Informe um nome para o perfil.");
      return;
    }

    const weeklyAvailabilityNumber = Number(weeklyAvailability);
    if (!Number.isInteger(weeklyAvailabilityNumber) || weeklyAvailabilityNumber < 1 || weeklyAvailabilityNumber > 7) {
      setMensagem("Informe quantos dias por semana voce consegue treinar, entre 1 e 7.");
      return;
    }

    await onSaveProfile({
      idade: idadeNumero,
      nome: nome.trim(),
      avatar,
      role,
      turma: turma.trim() || null,
      goal,
      selfReportedLevel,
      weeklyAvailability: weeklyAvailabilityNumber,
      onboardingCompletedAt: usuario.onboardingCompletedAt ?? new Date().toISOString(),
    });
    setMensagem("Perfil atualizado com sucesso.");
  }

  const idadeAtual = Number(idade);
  const idadePreview = Number.isFinite(idadeAtual) ? idadeAtual : usuario.idade;

  return (
    <main className="shell shell-center">
      <section className="auth-card">
        <div className="hero-block">
          <div>
            <p className="eyebrow">Perfil</p>
            <h1>Preferencias do Jogador</h1>
            <p className="muted">
              Ajuste sua idade para o app recalibrar a trilha, a linguagem, a complexidade e a progressao das fases.
            </p>
          </div>
          <div className="hero-badge">Perfil editavel</div>
        </div>

        <label className="field">
          <span>Nome</span>
          <input
            value={nome}
            onChange={(event) => {
              setMensagem("");
              setNome(event.target.value);
            }}
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input value={usuario.email} disabled />
        </label>

        <label className="field">
          <span>Idade</span>
          <input
            type="number"
            min={6}
            max={99}
            value={idade}
            onChange={(event) => {
              setMensagem("");
              setIdade(event.target.value);
            }}
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Perfil</span>
            <select
              className="text-input"
              value={role}
              disabled={usuario.role === "admin"}
              onChange={(event) => {
                setMensagem("");
                setRole(event.target.value as Usuario["role"]);
              }}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Turma ou grupo</span>
            <input
              className="text-input"
              placeholder="Ex.: Turma Alfa, Grupo da tarde"
              value={turma}
              onChange={(event) => {
                setMensagem("");
                setTurma(event.target.value);
              }}
            />
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Objetivo principal</span>
            <select
              className="text-input"
              value={goal}
              onChange={(event) => {
                setMensagem("");
                setGoal(event.target.value as NonNullable<Usuario["goal"]>);
              }}
            >
              {Object.entries(goalLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Nivel percebido</span>
            <select
              className="text-input"
              value={selfReportedLevel}
              onChange={(event) => {
                setMensagem("");
                setSelfReportedLevel(event.target.value as NonNullable<Usuario["selfReportedLevel"]>);
              }}
            >
              {Object.entries(levelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Dias por semana disponiveis</span>
          <input
            type="number"
            min={1}
            max={7}
            value={weeklyAvailability}
            onChange={(event) => {
              setMensagem("");
              setWeeklyAvailability(event.target.value);
            }}
          />
        </label>

        <div className="avatar-picker avatar-picker-profile">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`avatar-option ${avatar === option ? "avatar-option-active" : ""}`}
              onClick={() => {
                setMensagem("");
                setAvatar(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="profile-summary">
          <div className="profile-chip">
            <strong>Avatar</strong>
            <span>{avatar}</span>
          </div>
          <div className="profile-chip">
            <strong>Faixa</strong>
            <span>{getAgeBand(idadePreview)}</span>
          </div>
          <div className="profile-chip">
            <strong>Rotulo</strong>
            <span>{getAgeLabel(idadePreview)}</span>
          </div>
          <div className="profile-chip">
            <strong>Trilha</strong>
            <span>{getAudienceLabel(getAudienceFromAge(idadePreview))}</span>
          </div>
          <div className="profile-chip">
            <strong>Perfil</strong>
            <span>{roleLabels[role]}</span>
          </div>
          <div className="profile-chip">
            <strong>Objetivo</strong>
            <span>{goalLabels[goal]}</span>
          </div>
          <div className="profile-chip">
            <strong>Nivel</strong>
            <span>{levelLabels[selfReportedLevel]}</span>
          </div>
          <div className="profile-chip">
            <strong>Rotina</strong>
            <span>{`${weeklyAvailability || "3"} dia(s) por semana`}</span>
          </div>
          <div className="profile-chip">
            <strong>Turma</strong>
            <span>{turma.trim() || "Sem turma"}</span>
          </div>
        </div>

        {mensagem ? <p className={`notice ${mensagem.includes("sucesso") ? "notice-ok" : ""}`}>{mensagem}</p> : null}

        <div className="button-row">
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar perfil
          </button>
        </div>
      </section>
    </main>
  );
}
