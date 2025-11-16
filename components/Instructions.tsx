
import React from 'react';

export const Instructions: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-4">
      <div className="bg-secondary bg-opacity-90 p-6 md:p-8 rounded-lg border border-border shadow-2xl max-w-lg text-center">
        <h2 className="text-2xl font-bold text-accent mb-4">Welcome to Avalon Scribe</h2>
        <p className="text-text-secondary mb-4">
          Two ways to map the Roads of Avalon:
        </p>
        <div className="space-y-4 text-left">
          <div>
            <h3 className="font-bold text-text-primary mb-2">1. Automatic (AI Scan)</h3>
            <ol className="text-left text-text-primary space-y-2 list-decimal list-inside">
              <li><strong>In-game:</strong> Hover over a portal to show its tooltip.</li>
              <li><strong>Capture:</strong> Press <kbd className="bg-tertiary border border-border px-2 py-1 rounded">Print Screen</kbd>.</li>
              <li><strong>Paste:</strong> Return here and press <kbd className="bg-tertiary border border-border px-2 py-1 rounded">Ctrl</kbd> + <kbd className="bg-tertiary border border-border px-2 py-1 rounded">V</kbd>.</li>
            </ol>
          </div>
          <div>
            <h3 className="font-bold text-text-primary mb-2">2. Manual Entry</h3>
            <p className="text-text-secondary">
              Use the form at the top to type in connection details directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
