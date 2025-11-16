
export type LogLevel = 'INFO' | 'ERROR' | 'DEBUG' | 'AI' | 'WARN';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
}

type Subscriber = (logs: LogEntry[]) => void;

class Logger {
  private logs: LogEntry[] = [];
  private subscribers: Subscriber[] = [];
  private readonly MAX_LOGS = 200;

  private addLog(level: LogLevel, message: string, data?: any) {
    const newLog: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    this.logs = [newLog, ...this.logs].slice(0, this.MAX_LOGS);
    this.notifySubscribers();
    
    // Also log to browser console for dev experience
    const consoleArgs = [`[${level}] ${message}`, ...(data ? [data] : [])];
    switch (level) {
      case 'ERROR':
        console.error(...consoleArgs);
        break;
      case 'WARN':
        console.warn(...consoleArgs);
        break;
      case 'INFO':
        console.info(...consoleArgs);
        break;
      default:
        console.log(...consoleArgs);
        break;
    }
  }

  public info(message: string, data?: any) {
    this.addLog('INFO', message, data);
  }

  public error(message: string, data?: any) {
    this.addLog('ERROR', message, data);
  }

  public debug(message: string, data?: any) {
    this.addLog('DEBUG', message, data);
  }

  public ai(message: string, data?: any) {
    this.addLog('AI', message, data);
  }

  public warn(message: string, data?: any) {
    this.addLog('WARN', message, data);
  }
  
  public getLogs(): LogEntry[] {
    return this.logs;
  }
  
  public clear() {
      this.logs = [];
      this.notifySubscribers();
      console.clear();
      this.info('Debug log cleared.');
  }

  public subscribe(callback: Subscriber) {
    this.subscribers.push(callback);
    // Immediately provide current logs to new subscriber
    callback(this.logs);
  }

  public unsubscribe(callback: Subscriber) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  private notifySubscribers() {
    for (const sub of this.subscribers) {
      try {
        sub([...this.logs]);
      } catch (error) {
        console.error("Error in logger subscriber:", error);
      }
    }
  }
}

const logger = new Logger();
export default logger;
