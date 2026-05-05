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
      setNotice("Digite o código de confirmação para continuar.");
      return;
    }

    const ok = await onConfirm(code.trim());
    if (!ok) {
      setNotice("Código de confirmação inválido.");
    }
  }

  return (
    <main className="shell shell-center">
      <section className="auth-card">
        <div className="hero-block">
          <div>
            <p className="eyebrow">Confirmação administrativa</p>
            <h1>Confirme o acesso de admin</h1>
            <p className="muted">
              {usuario
                ? `${usuario.nome}, sua conta já tem perfil administrativo. Agora confirme o código extra para abrir a área administrativa.`
                : "Digite o código exclusivo para abrir a área administrativa a partir da tela inicial do app."}
            </p>
          </div>
          <div className="hero-badge">Etapa extra de seguranca</div>
        </div>

        <label className="field">
          <span>Código de confirmação</span>
          <input
            type="password"
            placeholder="Digite o código de liberação"
            value={code}
            onChange={(event) => {
              setNotice("");
              setCode(event.target.value);
            }}
          />
        </label>

        <div className="notice notice-ok">
          Esta etapa protege a área administrativa mesmo quando a conta de admin já fez login com email e senha.
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
