
import React, { useState, useEffect, useRef } from 'react';
import logger, { LogEntry, LogLevel } from '../services/logger';

interface DebugLogProps {
  isVisible: boolean;
}

const LogLevelColors: Record<LogLevel, string> = {
  INFO: 'text-text-secondary',
  ERROR: 'text-danger',
  DEBUG: 'text-blue-400',
  AI: 'text-purple-400',
  WARN: 'text-yellow-400',
};

export const DebugLog: React.FC<DebugLogProps> = ({ isVisible }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewLogs = (newLogs: LogEntry[]) => {
      setLogs(newLogs);
    };

    logger.subscribe(handleNewLogs);

    return () => {
      logger.unsubscribe(handleNewLogs);
    };
  }, []);

  useEffect(() => {
    // Scroll to top when new logs are added
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex-shrink-0 h-48 bg-secondary border-t-2 border-border z-20 flex flex-col">
      <div className="flex justify-between items-center p-2 border-b border-border flex-shrink-0">
        <h3 className="font-bold text-text-primary">Debug Log</h3>
        <button
          onClick={() => logger.clear()}
          className="bg-tertiary hover:bg-opacity-80 text-sm text-text-secondary font-bold py-1 px-3 rounded-md shadow-sm transition-colors duration-200"
        >
          Clear
        </button>
      </div>
      <div ref={logContainerRef} className="flex-grow overflow-y-auto p-2 font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className="flex gap-2 items-start whitespace-pre-wrap break-all">
            <span className="text-text-secondary opacity-60 flex-shrink-0">
              {log.timestamp.toLocaleTimeString()}
            </span>
            <span className={`font-bold ${LogLevelColors[log.level]} flex-shrink-0`}>
              [{log.level}]
            </span>
            <span className={LogLevelColors[log.level]}>
              {log.message} {log.data ? JSON.stringify(log.data, null, 2) : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
