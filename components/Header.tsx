
import React from 'react';
import { SaveIcon, LoadIcon, ClearIcon, AddConnectionIcon, DebugIcon, UploadIcon, SettingsIcon, RouteIcon } from './icons';

interface HeaderProps {
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  onUpload: () => void;
  onToggleForm: () => void;
  isFormVisible: boolean;
  onToggleLog: () => void;
  isLogVisible: boolean;
  onOpenSettings: () => void;
  onOpenRouteFinder: () => void;
}

const IconButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string, className?: string }> = ({ onClick, children, 'aria-label': ariaLabel, className = '' }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`group relative p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
  >
    {children}
    <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0D1117] border border-[#30363D] px-2 py-1 text-xs text-[#C9D1D9] opacity-0 transition-opacity group-hover:opacity-100 z-50">
      {ariaLabel}
    </span>
  </button>
);

export const Header: React.FC<HeaderProps> = ({ onClear, onSave, onLoad, onUpload, onToggleForm, isFormVisible, onToggleLog, isLogVisible, onOpenSettings, onOpenRouteFinder }) => {
  return (
    <header className="bg-secondary border-b border-border p-2 flex justify-between items-center z-10 shadow-md flex-shrink-0">
      <h1 className="text-lg md:text-xl font-bold text-text-primary ml-2">Avalon Scribe</h1>
      <div className="flex items-center gap-1 md:gap-2">
        <IconButton onClick={onOpenRouteFinder} aria-label="Calculadora de Rota" className="hover:bg-tertiary text-accent">
          <RouteIcon />
        </IconButton>
        <div className="w-px h-6 bg-border mx-1"></div>
        <IconButton onClick={onLoad} aria-label="Carregar Mapa" className="hover:bg-tertiary">
          <LoadIcon />
        </IconButton>
        <IconButton onClick={onSave} aria-label="Salvar Mapa" className="hover:bg-tertiary">
          <SaveIcon />
        </IconButton>
        <IconButton onClick={onClear} aria-label="Limpar Mapa" className="hover:bg-danger/20 text-danger">
          <ClearIcon />
        </IconButton>
        <div className="w-px h-6 bg-border mx-1"></div>
        <IconButton onClick={onUpload} aria-label="Enviar Printscreen" className="hover:bg-tertiary">
          <UploadIcon />
        </IconButton>
        <IconButton onClick={onToggleForm} aria-label="Adicionar Manualmente" className={`hover:bg-tertiary ${isFormVisible ? 'bg-tertiary text-accent' : ''}`}>
          <AddConnectionIcon />
        </IconButton>
        <IconButton onClick={onToggleLog} aria-label="Logs de Sistema" className={`hover:bg-tertiary ${isLogVisible ? 'bg-tertiary text-accent' : ''}`}>
          <DebugIcon />
        </IconButton>
        <IconButton onClick={onOpenSettings} aria-label="Configurações" className="hover:bg-tertiary">
          <SettingsIcon />
        </IconButton>
      </div>
    </header>
  );
};
