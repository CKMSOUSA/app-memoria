"use client";

import type { AppSettings } from "@/lib/app-settings";

type AppPreferencesPanelProps = {
  settings: AppSettings;
  isOffline: boolean;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
};

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button type="button" className={`setting-toggle-card ${checked ? "setting-toggle-card-active" : ""}`} onClick={onChange}>
      <div>
        <strong>{label}</strong>
        <p className="small-muted">{description}</p>
      </div>
      <span className={`pill ${checked ? "pill-success" : "pill-neutral"}`}>{checked ? "Ativo" : "Inativo"}</span>
    </button>
  );
}

export function AppPreferencesPanel({ settings, isOffline, onUpdateSettings }: AppPreferencesPanelProps) {
  return (
    <section className="panel">
      <div className="section-head">
        <h3>Preferencias de acessibilidade e uso</h3>
        <span className="small-muted">{isOffline ? "Modo offline ativo" : "Offline pronto apos o primeiro acesso"}</span>
      </div>
      <div className="settings-grid">
        <SettingToggle
          label="Contraste forte"
          description="Aumenta contraste de textos, fundos e bordas para leitura mais segura."
          checked={settings.highContrast}
          onChange={() => onUpdateSettings({ highContrast: !settings.highContrast })}
        />
        <SettingToggle
          label="Fonte ampliada"
          description="Expande o tamanho da tipografia em toda a interface."
          checked={settings.largeText}
          onChange={() => onUpdateSettings({ largeText: !settings.largeText })}
        />
        <SettingToggle
          label="Narracao"
          description="Ativa leitura por voz das instrucoes principais dos jogos."
          checked={settings.narrationEnabled}
          onChange={() => onUpdateSettings({ narrationEnabled: !settings.narrationEnabled })}
        />
        <SettingToggle
          label="Comandos simples"
          description="Mostra orientacoes mais curtas e diretas durante o treino."
          checked={settings.simplifiedCommands}
          onChange={() => onUpdateSettings({ simplifiedCommands: !settings.simplifiedCommands })}
        />
        <SettingToggle
          label="Modo terapeutico"
          description="Encurta sessoes, reduz carga visual e suaviza a exigencia inicial."
          checked={settings.therapeuticMode}
          onChange={() => onUpdateSettings({ therapeuticMode: !settings.therapeuticMode })}
        />
        <SettingToggle
          label="Estimulos reduzidos"
          description="Diminui brilho, profundidade visual e excesso de destaque na tela."
          checked={settings.reducedStimuli}
          onChange={() => onUpdateSettings({ reducedStimuli: !settings.reducedStimuli })}
        />
      </div>
    </section>
  );
}
