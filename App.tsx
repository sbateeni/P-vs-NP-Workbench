import React, { useState } from 'react';
import SimulationPanel from './components/SimulationPanel';
import ResearchWorkspace from './components/ResearchWorkspace';
import { SimulationDataPoint, AppTab } from './types';
import { BookOpen, Cpu, Sigma, Key, PlayCircle } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.SIMULATION);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(!process.env.API_KEY);
  
  // Auto-Discovery State
  const [simTrigger, setSimTrigger] = useState<number>(0);
  const [autoAnalysisPrompt, setAutoAnalysisPrompt] = useState<string | null>(null);

  // Suggested Prompts based on the User's Persona
  const prompts = [
    {
      label: "Phase 1: Hypothesis",
      text: "Let's focus on the 3-SAT problem. Analyze the simulation data provided. Identify the 'critical region' where the difficulty peaks. Is there a polynomial-time heuristic that works with high probability just outside this critical region?"
    },
    {
      label: "Phase 2: Red Teaming",
      text: "Based on the simulation results, propose a novel heuristic that modifies the variable selection strategy in the DPLL algorithm. Analyze theoretically: Why might this heuristic fail in a worst-case scenario?"
    },
    {
      label: "Phase 3: Formal Proof",
      text: "Let's assume our modified algorithm A runs in polynomial time for the generated instances. Attempt to construct a proof that A is in P for 3-SAT. Critical Step: Act as a skeptical reviewer. Identify the exact step in the proof where the logic is likely to fail."
    }
  ];

  const handleStartAutoDiscovery = () => {
    // 1. Switch to Simulation View
    setActiveTab(AppTab.SIMULATION);
    // 2. Trigger Simulation
    setSimTrigger(prev => prev + 1);
  };

  const handleSimulationComplete = () => {
    if (apiKey) {
      // 3. Switch to Agent View
      setActiveTab(AppTab.ANALYSIS);
      // 4. Trigger Analysis
      setAutoAnalysisPrompt("I have just completed a full simulation run (Macro Phase Transition + Micro Simulated Annealing). Please analyze the collected data points and the behavior of the annealing process. Did we observe a phase transition at alpha=4.3? Did the annealing agent escape local minima?");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-300">
      {/* Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Sigma className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">P vs NP Workbench</h1>
              <p className="text-[10px] text-zinc-500 font-mono">3-SAT PHASE TRANSITION EXPLORER</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button
              onClick={handleStartAutoDiscovery}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-900/40 transition-all border border-indigo-500/50"
             >
               <PlayCircle className="w-4 h-4" />
               Start Auto-Discovery
             </button>

            <button 
              onClick={() => setShowKeyModal(!showKeyModal)}
              className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <Key className="w-3 h-3" />
              {apiKey ? 'API Key Set' : 'Set API Key'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Navigation & Prompts (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab(AppTab.SIMULATION)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === AppTab.SIMULATION 
                  ? 'bg-zinc-800 text-white border border-zinc-700' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Simulation & Data
            </button>
            <button
              onClick={() => setActiveTab(AppTab.ANALYSIS)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === AppTab.ANALYSIS 
                  ? 'bg-zinc-800 text-white border border-zinc-700' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Agent Research Lab
            </button>
          </nav>

          <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-lg">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Research Shortcuts</h3>
            <div className="space-y-2">
              {prompts.map((p, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-600 rounded-l opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-800 hover:border-blue-900 transition-colors cursor-pointer"
                       onClick={() => {
                         navigator.clipboard.writeText(p.text);
                         // Visual feedback could go here
                         setActiveTab(AppTab.ANALYSIS);
                       }}
                  >
                    <div className="text-xs font-bold text-blue-400 mb-1">{p.label}</div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{p.text}</p>
                    <div className="mt-2 text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      Click to copy & switch to Lab
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Dynamic Content (9 cols) */}
        <div className="lg:col-span-9 h-[600px] lg:h-[750px]">
          {activeTab === AppTab.SIMULATION && (
            <SimulationPanel 
              onDataUpdate={setSimulationData} 
              runTrigger={simTrigger}
              onComplete={handleSimulationComplete}
            />
          )}
          
          {activeTab === AppTab.ANALYSIS && (
            <ResearchWorkspace 
              apiKey={apiKey} 
              simulationData={simulationData} 
              autoAnalysisPrompt={autoAnalysisPrompt}
              onAutoAnalysisComplete={() => setAutoAnalysisPrompt(null)}
            />
          )}
        </div>

      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Configure Workbench</h2>
            <p className="text-sm text-zinc-400 mb-4">
              To use the AI Agents, provide a Gemini API Key. The Simulation feature works without it.
            </p>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Gemini API Key"
              className="w-full bg-black border border-zinc-700 rounded px-4 py-2 text-white mb-4 focus:border-blue-500 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Close
              </button>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}