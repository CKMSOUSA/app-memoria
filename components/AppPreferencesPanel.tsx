"use client";

import type { AppSettings } from "@/lib/app-settings";
import type { OfflineSyncStatus } from "@/lib/offline-store";

type AppPreferencesPanelProps = {
  settings: AppSettings;
  isOffline: boolean;
  offlineSyncStatus: OfflineSyncStatus;
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

function getOfflineSummary(isOffline: boolean, offlineSyncStatus: OfflineSyncStatus) {
  if (!offlineSyncStatus.isSupported) return "Offline basico no navegador atual";
  if (offlineSyncStatus.isSyncing) return "Sincronizando dados salvos offline";
  if (isOffline && offlineSyncStatus.pendingCount > 0) {
    return `${offlineSyncStatus.pendingCount} acao(oes) aguardando envio`;
  }
  if (isOffline) return "Modo offline ativo";
  if (offlineSyncStatus.pendingCount > 0) return `${offlineSyncStatus.pendingCount} item(ns) aguardando sincronizacao`;
  if (offlineSyncStatus.lastSyncedAt) return `Sincronizado em ${new Date(offlineSyncStatus.lastSyncedAt).toLocaleTimeString("pt-BR")}`;
  return "Offline pronto apos o primeiro acesso";
}

export function AppPreferencesPanel({ settings, isOffline, offlineSyncStatus, onUpdateSettings }: AppPreferencesPanelProps) {
  return (
    <section className="panel">
      <div className="section-head">
        <h3>Preferencias de acessibilidade e uso</h3>
        <span className="small-muted">{getOfflineSummary(isOffline, offlineSyncStatus)}</span>
      </div>
      <div className="offline-sync-strip">
        <span className={`pill ${isOffline ? "pill-locked" : offlineSyncStatus.pendingCount > 0 ? "pill-neutral" : "pill-success"}`}>
          {isOffline ? "Offline" : "Online"}
        </span>
        <span className={`pill ${offlineSyncStatus.pendingCount > 0 ? "pill-neutral" : "pill-success"}`}>
          {offlineSyncStatus.pendingCount > 0 ? `${offlineSyncStatus.pendingCount} pendente(s)` : "Fila vazia"}
        </span>
        <span className={`pill ${offlineSyncStatus.lastError ? "pill-locked" : "pill-success"}`}>
          {offlineSyncStatus.lastError ? "Sincronizacao com atencao" : "Sincronizacao estavel"}
        </span>
      </div>
      {offlineSyncStatus.lastError ? <p className="small-muted">{offlineSyncStatus.lastError}</p> : null}
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
        <SettingToggle
          label="Avaliacao formal"
          description="Ativa um ambiente mais padronizado, com menos distração e leitura mais tecnica."
          checked={settings.formalEvaluationMode}
          onChange={() => onUpdateSettings({ formalEvaluationMode: !settings.formalEvaluationMode })}
        />
        <SettingToggle
          label="Foco visivel"
          description="Reforca bordas e destaque de foco para uso com teclado e leitura assistida."
          checked={settings.visibleFocus}
          onChange={() => onUpdateSettings({ visibleFocus: !settings.visibleFocus })}
        />
        <SettingToggle
          label="Navegacao por teclado"
          description="Mantem a interface preparada para setas, tabulacao e leitura de tela."
          checked={settings.keyboardNavigation}
          onChange={() => onUpdateSettings({ keyboardNavigation: !settings.keyboardNavigation })}
        />
      </div>
    </section>
  );
}
