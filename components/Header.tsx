
import React from 'react';
import { SaveIcon, LoadIcon, ClearIcon, AddConnectionIcon, DebugIcon, SettingsIcon } from './icons';

interface HeaderProps {
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  onToggleForm: () => void;
  isFormVisible: boolean;
  onToggleLog: () => void;
  isLogVisible: boolean;
  onToggleSettings: () => void;
}

const IconButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string, className?: string }> = ({ onClick, children, 'aria-label': ariaLabel, className = '' }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
  >
    {children}
  </button>
);

export const Header: React.FC<HeaderProps> = ({ onClear, onSave, onLoad, onToggleForm, isFormVisible, onToggleLog, isLogVisible, onToggleSettings }) => {
  return (
    <header className="bg-secondary border-b border-border p-2 flex justify-between items-center z-10 shadow-md flex-shrink-0">
      <h1 className="text-lg md:text-xl font-bold text-text-primary ml-2">Avalon Scribe</h1>
      <div className="flex items-center gap-1 md:gap-2">
        <IconButton onClick={onLoad} aria-label="Load Map" className="hover:bg-tertiary">
          <LoadIcon />
        </IconButton>
        <IconButton onClick={onSave} aria-label="Save Map" className="hover:bg-tertiary">
          <SaveIcon />
        </IconButton>
        <IconButton onClick={onClear} aria-label="Clear Map" className="hover:bg-danger/20 text-danger">
          <ClearIcon />
        </IconButton>
        <div className="w-px h-6 bg-border mx-1"></div>
        <IconButton onClick={onToggleForm} aria-label="Toggle Manual Connection Form" className={`hover:bg-tertiary ${isFormVisible ? 'bg-tertiary text-accent' : ''}`}>
          <AddConnectionIcon />
        </IconButton>
        <IconButton onClick={onToggleLog} aria-label="Toggle Debug Log" className={`hover:bg-tertiary ${isLogVisible ? 'bg-tertiary text-accent' : ''}`}>
          <DebugIcon />
        </IconButton>
        <div className="w-px h-6 bg-border mx-1"></div>
        <IconButton onClick={onToggleSettings} aria-label="Open Settings" className="hover:bg-tertiary">
          <SettingsIcon />
        </IconButton>
      </div>
    </header>
  );
};
