import React, { useState } from 'react';
import SimulationPanel from './components/SimulationPanel';
import { Key } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(!process.env.API_KEY);

  return (
    <div className="h-screen w-full bg-[#050505] text-zinc-300 overflow-hidden font-sans selection:bg-indigo-500/30 fixed inset-0">
       {/* Modal for API Key */}
       {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-[90%] max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                Security Clearance
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              To authorize the <strong>Agent Council</strong> (Gemini 1.5), please provide a valid API Key.
            </p>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-black border border-zinc-700 rounded px-4 py-3 text-white mb-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowKeyModal(false)} className="px-4 py-2 text-zinc-500 hover:text-white text-sm transition-colors">Dismiss</button>
              <button onClick={() => setShowKeyModal(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium shadow-lg shadow-indigo-900/20">Authenticate</button>
            </div>
          </div>
        </div>
      )}
      
      {/* The Unified Dashboard */}
      <SimulationPanel apiKey={apiKey} />
      
      {/* Floating Settings Trigger - Positioned higher for mobile to avoid bottom nav */}
      <div className="fixed top-3 right-3 md:bottom-4 md:left-4 md:top-auto md:right-auto z-50">
        <button 
            onClick={() => setShowKeyModal(true)}
            className="p-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-full text-zinc-600 hover:text-indigo-400 transition-colors shadow-lg"
            title="API Settings"
        >
            <Key className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}