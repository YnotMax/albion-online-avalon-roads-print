import React, { useState, useEffect } from 'react';
import { AlbionConnection, PendingValidation } from '../types';
import { validateZoneName, ValidationResult } from '../services/zoneValidator';
import { CheckIcon, XIcon } from './icons';

interface ValidationModalProps {
  data: PendingValidation;
  onConfirm: (connection: AlbionConnection) => void;
  onCancel: () => void;
}

const ValidationField: React.FC<{
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  validation: ValidationResult;
}> = ({ label, value, onChange, validation }) => {
  const isCorrect = validation.isValid;
  const hasSuggestions = !isCorrect && validation.suggestions.length > 0 &&
    (validation.suggestions.length > 1 || validation.suggestions[0].toUpperCase() !== value.toUpperCase());

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-primary border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 ${
          isCorrect ? 'border-success' : 'border-border focus:ring-accent'
        }`}
      />
      {hasSuggestions ? (
        <div className="text-xs mt-2">
          <span className="text-yellow-400">Unrecognized zone. Did you mean:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {validation.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onChange(suggestion)}
                className="bg-tertiary text-text-primary px-2 py-1 rounded-md hover:bg-accent hover:text-white transition-colors text-xs"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : !isCorrect && (
        <p className="text-xs mt-1 text-yellow-400">
          Unrecognized zone. Please verify spelling.
        </p>
      )}
    </div>
  );
};


export const ValidationModal: React.FC<ValidationModalProps> = ({ data, onConfirm, onCancel }) => {
  const [originValidation, setOriginValidation] = useState<ValidationResult>({ isValid: false, suggestions: [] });
  const [destValidation, setDestValidation] = useState<ValidationResult>({ isValid: false, suggestions: [] });
  
  const [origin, setOrigin] = useState(data.connection.origem || '');
  const [destination, setDestination] = useState(data.connection.destino || '');
  const [minutes, setMinutes] = useState<number | ''>(data.connection.minutos_ate_fechar || '');

  useEffect(() => {
    // Perform initial validation on the AI-extracted data
    setOriginValidation(validateZoneName(data.connection.origem));
    setDestValidation(validateZoneName(data.connection.destino));
    
    // Set the input fields to the original AI output to show any potential errors
    setOrigin(data.connection.origem || '');
    setDestination(data.connection.destino || '');
    setMinutes(data.connection.minutos_ate_fechar ?? '');

  }, [data]);

  // Re-validate origin whenever the user types in the input field
  useEffect(() => {
    setOriginValidation(validateZoneName(origin));
  }, [origin]);
  
  // Re-validate destination whenever the user types in the input field
  useEffect(() => {
    setDestValidation(validateZoneName(destination));
  }, [destination]);

  const handleConfirm = () => {
    onConfirm({
      origem: origin.trim(),
      destino: destination.trim(),
      minutos_ate_fechar: Number(minutes),
    });
  };

  const hours = minutes !== '' ? Math.floor(Number(minutes) / 60) : '';
  const remainingMinutes = minutes !== '' ? Number(minutes) % 60 : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-secondary border border-border rounded-lg shadow-2xl max-w-4xl w-full p-6 text-left animate-fade-in-up flex gap-6" onClick={e => e.stopPropagation()}>
        
        <div className="w-1/2 flex-shrink-0">
          <h3 className="text-lg font-bold text-text-primary mb-2">Scanned Image</h3>
          <img src={data.image} alt="Pasted screenshot for validation" className="rounded-md border border-border object-contain max-h-[400px] w-full" />
        </div>

        <div className="w-1/2 flex flex-col">
          <h2 className="text-xl font-bold text-accent mb-4">Confirm Connection</h2>
          <p className="text-sm text-text-secondary mb-4">
            The AI has extracted the following data. Please verify it is correct before adding it to the map.
          </p>

          <div className="space-y-4 flex-grow">
            <ValidationField
              label="From (Origin)"
              value={origin}
              onChange={setOrigin}
              validation={originValidation}
            />
            <ValidationField
              label="To (Destination)"
              value={destination}
              onChange={setDestination}
              validation={destValidation}
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Time Left</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setMinutes((Number(e.target.value) * 60) + (Number(remainingMinutes)))}
                  className="w-full bg-primary border border-border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent text-center"
                  placeholder="H"
                  min="0"
                />
                <span className="text-text-secondary">:</span>
                <input
                  type="number"
                  value={remainingMinutes}
                  onChange={(e) => setMinutes((Number(hours) * 60) + (Number(e.target.value)))}
                  className="w-full bg-primary border border-border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent text-center"
                  placeholder="M"
                  min="0"
                  max="59"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onCancel} className="flex items-center gap-2 bg-tertiary hover:bg-opacity-80 text-text-secondary font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200">
              <XIcon /> Cancel
            </button>
            <button onClick={handleConfirm} className="flex items-center gap-2 bg-success hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200">
              <CheckIcon /> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
