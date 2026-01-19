import React, { useState, useEffect } from 'react';
import { Terminal, X, Trash2, AlertTriangle, Bug } from 'lucide-react';

export const DebugLogger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<{ type: 'log' | 'error' | 'warn'; msg: string; time: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const formatArgs = (args: any[]) => {
      return args.map(a => {
        if (a instanceof Error) return `${a.name}: ${a.message}${a.stack ? `\n${a.stack}` : ''}`;
        if (typeof a === 'object') {
            try {
                return JSON.stringify(a);
            } catch (e) {
                return '[Circular/Unserializable Object]';
            }
        }
        return String(a);
      }).join(' ');
    };

    const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
      const msg = formatArgs(args);
      const time = new Date().toLocaleTimeString().split(' ')[0];
      setLogs(prev => [...prev.slice(-49), { type, msg, time }]); // Keep last 50 logs
      if (type === 'error') {
        setHasError(true);
        // Auto-open on error for mobile visibility
        if (window.innerWidth < 768) setIsOpen(true);
      }
    };

    console.log = (...args) => {
      addLog('log', args);
      originalLog(...args);
    };

    console.error = (...args) => {
      addLog('error', args);
      originalError(...args);
    };

    console.warn = (...args) => {
      addLog('warn', args);
      originalWarn(...args);
    };

    // Capture unhandled errors
    const errorHandler = (event: ErrorEvent) => {
      addLog('error', [event.error || event.message]);
    };

    // Capture unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      addLog('error', [`Unhandled Promise Rejection:`, event.reason]);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  if (hasError && !isOpen) {
    // Small floating indicator if closed but errors exist
  }

  return (
    <>
      {children}

      {/* Trigger Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setHasError(false); }}
        className={`fixed bottom-20 left-4 z-[9999] p-3 rounded-full shadow-2xl transition-all ${
          hasError ? 'bg-red-600 animate-pulse text-white' : 'bg-zinc-800/80 text-zinc-400'
        }`}
        title="Debug Console"
      >
        {hasError ? <Bug className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
      </button>

      {/* Console Window */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 h-[40vh] bg-black/95 border-t border-zinc-800 z-[9999] flex flex-col font-mono text-[10px] sm:text-xs">
          <div className="flex items-center justify-between p-2 bg-zinc-900 border-b border-zinc-800">
            <span className="text-zinc-400 font-bold flex items-center gap-2">
               <Terminal className="w-3 h-3" /> SYSTEM LOGS
            </span>
            <div className="flex gap-2">
              <button onClick={() => setLogs([])} className="p-1 hover:text-red-400 text-zinc-500">
                <Trash2 className="w-3 h-3" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:text-white text-zinc-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {logs.length === 0 && <span className="text-zinc-600 italic">No logs captured...</span>}
            {logs.map((l, i) => (
              <div key={i} className={`flex gap-2 border-b border-zinc-900/50 pb-0.5 ${
                l.type === 'error' ? 'text-red-400 bg-red-900/10' : 
                l.type === 'warn' ? 'text-yellow-400' : 'text-zinc-400'
              }`}>
                <span className="text-zinc-600 shrink-0">[{l.time}]</span>
                <span className="break-all whitespace-pre-wrap">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};