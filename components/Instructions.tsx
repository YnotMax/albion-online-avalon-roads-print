
import React from 'react';

export const Instructions: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-4">
      <div className="bg-secondary bg-opacity-90 p-6 md:p-8 rounded-lg border border-border shadow-2xl max-w-lg text-center">
        <h2 className="text-2xl font-bold text-accent mb-4">Bem-vindo ao Avalon Scribe</h2>
        <p className="text-text-secondary mb-4">
          Duas formas de mapear as Estradas de Avalon:
        </p>
        <div className="space-y-4 text-left">
          <div>
            <h3 className="font-bold text-text-primary mb-2">1. Automático (Scan IA)</h3>
            <ol className="text-left text-text-primary space-y-2 list-decimal list-inside">
              <li><strong>No jogo:</strong> Passe o mouse sobre um portal.</li>
              <li><strong>Capture:</strong> Pressione <kbd className="bg-tertiary border border-border px-2 py-1 rounded">Print Screen</kbd> (ou capture a tela).</li>
              <li><strong>Cole:</strong> Volte aqui e pressione <kbd className="bg-tertiary border border-border px-2 py-1 rounded">Ctrl</kbd> + <kbd className="bg-tertiary border border-border px-2 py-1 rounded">V</kbd>.</li>
            </ol>
          </div>
          <div>
            <h3 className="font-bold text-text-primary mb-2">2. Entrada Manual</h3>
            <p className="text-text-secondary">
              Clique no ícone de "Adicionar Manualmente" (lápis) no menu superior para digitar os mapas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
