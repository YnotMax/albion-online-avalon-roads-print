
import React, { useState } from 'react';
import { AlbionConnection } from '../types';
import { SwapIcon } from './icons';
import logger from '../services/logger';

interface ManualInputFormProps {
  onAddConnection: (connection: AlbionConnection) => void;
}

export const ManualInputForm: React.FC<ManualInputFormProps> = ({ onAddConnection }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hours, setHours] = useState<number | ''>(7);
  const [minutes, setMinutes] = useState<number | ''>(0);

  const handleSwap = () => {
    const tempFrom = from;
    setFrom(to);
    setTo(tempFrom);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || (hours === '' && minutes === '')) {
      logger.warn('Manual add form submitted with missing fields.');
      return;
    }
    
    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);

    const connection: AlbionConnection = {
      origem: from,
      destino: to,
      minutos_ate_fechar: totalMinutes,
    };
    
    logger.info('Manual connection submitted.', connection);
    onAddConnection(connection);
    
    // Clear fields after submission
    setFrom('');
    setTo('');
    setHours(7);
    setMinutes(0);
  };
  
  const inputClasses = "w-full bg-primary border border-border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent";
  const labelClasses = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <div className="bg-secondary border-b border-border p-3 flex-shrink-0">
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-0 md:flex md:items-end md:gap-3">
        
        <div className="flex-1">
          <label htmlFor="from-zone" className={labelClasses}>From</label>
          <input id="from-zone" type="text" value={from} onChange={e => setFrom(e.target.value)} className={inputClasses} placeholder="e.g., Xases-Atraglos" required />
        </div>

        <div className="flex justify-center md:items-end md:pb-2">
            <button type="button" onClick={handleSwap} className="p-2 text-text-secondary hover:text-accent hover:bg-tertiary rounded-full transition-colors" aria-label="Swap zones">
                <SwapIcon />
            </button>
        </div>

        <div className="flex-1">
          <label htmlFor="to-zone" className={labelClasses}>To</label>
          <input id="to-zone" type="text" value={to} onChange={e => setTo(e.target.value)} className={inputClasses} placeholder="e.g., Sleos-Olugham" required />
        </div>

        <div className="flex-1 md:flex-none md:w-48">
          <label className={labelClasses}>Time Left</label>
          <div className="flex items-center gap-2">
            <input type="number" value={hours} onChange={e => setHours(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className={`${inputClasses} text-center`} placeholder="H" min="0" max="23" />
            <span className="text-text-secondary">:</span>
            <input type="number" value={minutes} onChange={e => setMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className={`${inputClasses} text-center`} placeholder="M" min="0" max="59" />
          </div>
        </div>

        <div className="flex-1 md:flex-none">
            <button type="submit" className="w-full bg-success hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200">
                Add Connection
            </button>
        </div>
      </form>
    </div>
  );
};
