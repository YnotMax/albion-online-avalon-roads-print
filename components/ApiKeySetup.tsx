import React, { useState } from 'react';
import { setApiKey } from '../services/apiKeyService';

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

  return (
    <div className="fixed inset-0 bg-primary z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-secondary border border-border rounded-lg shadow-2xl max-w-2xl w-full p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent mb-4">Configuração da Chave API Gemini</h1>
          <p className="text-text-secondary">
            Esta aplicação utiliza a IA Gemini do Google para extrair dados dos prints do Albion Online.
            Para continuar, você precisa fornecer sua própria chave de API gratuita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-primary p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Inserir Chave</h2>
              <div className="space-y-4">
                <input
                  type="password"
                  value={userKey}
                  onChange={(e) => setUserKey(e.target.value)}
                  placeholder="Cole sua chave API aqui"
                  className="w-full bg-secondary border border-border rounded-md p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Gemini API Key Input"
                />
                <button
                  onClick={handleSaveUserKey}
                  disabled={!userKey.trim()}
                  className="w-full bg-success hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-md shadow-sm transition-colors duration-200 disabled:bg-tertiary disabled:cursor-not-allowed"
                >
                  Salvar e Continuar
                </button>
              </div>
            </div>

            <div className="text-sm text-text-secondary italic">
              * Sua chave é salva apenas localmente no seu navegador.
            </div>
          </div>

          <div className="bg-primary p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Como obter uma chave grátis</h2>
            <ol className="list-decimal list-inside space-y-3 text-text-secondary text-sm">
              <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google AI Studio</a>.</li>
              <li>Faça login com sua conta Google.</li>
              <li>Clique no botão <span className="text-text-primary font-medium">"Create API key"</span>.</li>
              <li>Selecione <span className="text-text-primary font-medium">"Create API key in new project"</span>.</li>
              <li>Copie a chave gerada e cole no campo ao lado.</li>
            </ol>
            
            <div className="mt-6 p-3 bg-tertiary rounded border border-border text-xs text-text-secondary">
              <strong>Dica:</strong> O plano gratuito do Gemini é generoso e suficiente para uso pessoal intenso no Avalon Scribe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
