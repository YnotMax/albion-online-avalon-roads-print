import React, { useState, useMemo } from 'react';
import { getApiKey, setApiKey, clearApiKey, OUR_API_KEY } from '../services/apiKeyService';

interface SettingsModalProps {
  onClose: () => void;
  onKeyReset: () => void;
}

const maskApiKey = (key: string | null): string => {
  if (!key) return "Not Set";
  if (key === OUR_API_KEY) return "Using Our Key";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onKeyReset }) => {
  const [newKey, setNewKey] = useState('');
  const currentKey = useMemo(() => getApiKey(), []);

  const handleSaveKey = () => {
    if (newKey.trim()) {
      setApiKey(newKey.trim());
      onClose();
    }
  };

  const handleClearKey = () => {
    clearApiKey();
    onKeyReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-secondary border border-border rounded-lg shadow-2xl max-w-md w-full p-6 text-left animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-accent">API Key Settings</h2>
          <button onClick={onClose} className="text-2xl text-text-secondary hover:text-text-primary leading-none">&times;</button>
        </div>
        
        <p className="text-text-secondary mb-4">
          Current Key: <span className="font-mono bg-primary p-1 rounded">{maskApiKey(currentKey)}</span>
        </p>
        
        <div className="space-y-4">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-text-secondary">
            Enter a new Gemini API key to change it:
          </label>
          <input
            id="api-key-input"
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Enter new API Key"
            className="w-full bg-primary border border-border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleSaveKey}
            disabled={!newKey.trim()}
            className="w-full bg-success hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200 disabled:bg-tertiary disabled:cursor-not-allowed"
          >
            Save New Key
          </button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={handleClearKey}
            className="w-full bg-danger hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200"
          >
            Remove Key & Reset
          </button>
          <p className="text-xs text-text-secondary mt-2 text-center">
            This will require you to set a key again on next use.
          </p>
        </div>
      </div>
    </div>
  );
};
