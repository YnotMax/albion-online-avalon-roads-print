
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white max-w-sm z-50 animate-fade-in-up';
  const typeClasses = {
    success: 'bg-success',
    error: 'bg-danger',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className="flex justify-between items-start">
        <span className="pr-4">{message}</span>
        <button onClick={onDismiss} className="text-xl font-bold leading-none -mt-1">&times;</button>
      </div>
    </div>
  );
};
