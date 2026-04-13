"use client";

import { useState } from "react";
import type { Usuario } from "@/lib/types";

type AdminConfirmScreenProps = {
  usuario?: Usuario | null;
  onBack: () => void;
  onConfirm: (code: string) => boolean | Promise<boolean>;
};

export function AdminConfirmScreen({ usuario, onBack, onConfirm }: AdminConfirmScreenProps) {
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");

  async function handleConfirm() {
    if (!code.trim()) {
      setNotice("Digite o codigo de confirmacao para continuar.");
      return;
    }

    const ok = await onConfirm(code.trim());
    if (!ok) {
      setNotice("Codigo de confirmacao invalido.");
    }
  }

  return (
    <main className="shell shell-center">
      <section className="auth-card">
        <div className="hero-block">
          <div>
            <p className="eyebrow">Confirmacao administrativa</p>
            <h1>Confirme o acesso de admin</h1>
            <p className="muted">
              {usuario
                ? `${usuario.nome}, sua conta ja tem perfil administrativo. Agora confirme o codigo extra para abrir a area administrativa.`
                : "Digite o codigo exclusivo para abrir a area administrativa a partir da tela inicial do app."}
            </p>
          </div>
          <div className="hero-badge">Etapa extra de seguranca</div>
        </div>

        <label className="field">
          <span>Codigo de confirmacao</span>
          <input
            type="password"
            placeholder="Digite o codigo de liberacao"
            value={code}
            onChange={(event) => {
              setNotice("");
              setCode(event.target.value);
            }}
          />
        </label>

        <div className="notice notice-ok">
          Esta etapa protege a area administrativa mesmo quando a conta de admin ja fez login com email e senha.
        </div>

        {notice ? <p className="notice">{notice}</p> : null}

        <div className="button-row">
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirmar acesso
          </button>
        </div>
      </section>
    </main>
  );
}
