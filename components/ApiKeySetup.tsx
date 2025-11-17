import React, { useState } from 'react';
import { setApiKey, OUR_API_KEY } from '../services/apiKeyService';

interface ApiKeySetupProps {
  onKeySet: () => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onKeySet }) => {
  const [userKey, setUserKey] = useState('');

  const handleSaveUserKey = () => {
    if (userKey.trim()) {
      setApiKey(userKey.trim());
      onKeySet();
    }
  };

  const handleUseOurKey = () => {
    setApiKey(OUR_API_KEY);
    onKeySet();
  };

  return (
    <div className="fixed inset-0 bg-primary z-50 flex items-center justify-center p-4">
      <div className="bg-secondary border border-border rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold text-accent mb-4">Gemini API Key Required</h1>
        <p className="text-text-secondary mb-6">
          This application uses Google's Gemini AI to function. Please provide your own API key or use our limited-use key to proceed.
        </p>

        <div className="space-y-4">
          <input
            type="password"
            value={userKey}
            onChange={(e) => setUserKey(e.target.value)}
            placeholder="Enter your Gemini API Key"
            className="w-full bg-primary border border-border rounded-md p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Gemini API Key Input"
          />
          <button
            onClick={handleSaveUserKey}
            disabled={!userKey.trim()}
            className="w-full bg-success hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-md shadow-sm transition-colors duration-200 disabled:bg-tertiary disabled:cursor-not-allowed"
          >
            Save and Continue
          </button>
        </div>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-text-secondary">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <button
          onClick={handleUseOurKey}
          className="w-full bg-accent hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-md shadow-sm transition-colors duration-200"
        >
          Use Our Key (Limited)
        </button>

        <p className="text-xs text-text-secondary mt-8">
          Need an API key? Get one for free from{' '}
          <a
            href="https://aistudio.google.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Google AI Studio
          </a>.
        </p>
      </div>
    </div>
  );
};
