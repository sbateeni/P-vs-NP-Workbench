import React, { useState, useEffect, useRef } from 'react';
import ResearchWorkspace from './ResearchWorkspace';
import { generateRandom3SAT, solveDPLL, createAgentState, getCriticErrors, runSimulatedAnnealingStep, runEnergyVarianceAnalysis, runHysteresisExperiment, runStructuralAutopsy } from '../satSolver';
import { SolverResult, SimulationDataPoint, AgentStep, VarianceAnalysisResult, HysteresisResult, StructuralResult, StructuralPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, ComposedChart } from 'recharts';
import { Play, RotateCcw, Activity, GitMerge, Microscope, Zap, Layers, Copy, Flame, Search, Timer, CheckCircle, XCircle, ArrowDown, ScanEye, Bone, Snowflake, Radio, Cpu, Network, Lock, Wifi, LayoutDashboard, LineChart as ChartIcon, MessageSquare } from 'lucide-react';

interface SimulationPanelProps {
  apiKey: string;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ apiKey }) => {
  // --- STATE ---
  const [activePhase, setActivePhase] = useState<number>(0); 
  const [activeMobileTab, setActiveMobileTab] = useState<'control' | 'observatory' | 'agents'>('control');
  
  // Data State
  const [macroResults, setMacroResults] = useState<SimulationDataPoint[]>([]);
  const [peakAlpha, setPeakAlpha] = useState<number>(4.26);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [varianceResult, setVarianceResult] = useState<VarianceAnalysisResult | null>(null);
  const [hysteresisResult, setHysteresisResult] = useState<HysteresisResult | null>(null);
  const [structuralResult, setStructuralResult] = useState<StructuralResult | null>(null);
  
  // Agent Prompts (Moved internally for the Control Stack)
  const [autoAnalysisPrompt, setAutoAnalysisPrompt] = useState<string | null>(null);
  const prompts = [
    { label: "Hypothesis", text: "Analyze the Phase Transition data. Identify the 'critical region' where difficulty spikes." },
    { label: "Red Team", text: "Propose a heuristic to solve 3-SAT at alpha=4.26, then act as a Skeptic and refute it." },
    { label: "Formal Proof", text: "Attempt to construct a proof that the observed Hysteresis implies a First-Order Phase Transition." }
  ];

  // Refs
  const microLoopRef = useRef<number | null>(null);

  // --- LOGIC: PHASE 1 (MACRO) ---
  const runMacroSimulation = async () => {
    const n = 15; const trials = 20;
    const newResults: SimulationDataPoint[] = [];
    
    for (let alpha = 3.0; alpha <= 6.0; alpha += 0.2) {
      await new Promise(r => setTimeout(r, 5));
      const m = Math.round(alpha * n);
      let totalSteps = 0; let maxSteps = 0; let satCount = 0;
      
      for (let t = 0; t < trials; t++) {
        const res = solveDPLL(generateRandom3SAT(n, m), n);
        totalSteps += res.steps;
        if (res.steps > maxSteps) maxSteps = res.steps;
        if (res.satisfiable) satCount++;
      }
      newResults.push({ alpha: parseFloat(alpha.toFixed(2)), avgSteps: Math.round(totalSteps/trials), maxSteps, satisfiabilityRatio: satCount/trials });
      setMacroResults([...newResults]);
    }
    return newResults;
  };

  // --- LOGIC: PHASE 2 (MICRO) ---
  const startAgentSimulation = async (targetAlpha: number) => {
    const n = 50; const m = Math.round(n * targetAlpha);
    const formula = generateRandom3SAT(n, m);
    let assignment = createAgentState(n);
    let temp = 2.0;
    
    setAgentSteps([]);
    return new Promise<void>((resolve) => {
      let step = 0;
      const loop = () => {
        const errors = getCriticErrors(formula, assignment);
        if (errors.length === 0 || step > 400) { resolve(); return; }
        
        const res = runSimulatedAnnealingStep(formula, assignment, errors, temp);
        assignment = res.newAssignment;
        temp *= 0.98;
        
        setAgentSteps(prev => {
          const next = [...prev, { step, errors: errors.length, bestErrors: 0, flippedVar: res.flippedVar, action: '', temperature: temp, accepted: res.accepted }];
          return next.slice(-60);
        });
        step++;
        microLoopRef.current = window.setTimeout(loop, 10);
      };
      loop();
    });
  };

  // --- UNIFIED PIPELINE EXECUTION ---
  const handleRunPipeline = async () => {
    if (activePhase !== 0) return;
    setMacroResults([]); setAgentSteps([]); setVarianceResult(null); setHysteresisResult(null); setStructuralResult(null);

    // Mobile: Switch to charts briefly to show activity
    if (window.innerWidth < 768) {
        setTimeout(() => setActiveMobileTab('observatory'), 500);
    }

    // Phase 1
    setActivePhase(1);
    const mResults = await runMacroSimulation();
    const peak = mResults.reduce((p, c) => (c.maxSteps > p.maxSteps ? c : p), mResults[0]);
    setPeakAlpha(peak.alpha);
    await new Promise(r => setTimeout(r, 500));

    // Phase 2
    setActivePhase(2);
    await startAgentSimulation(peak.alpha);
    await new Promise(r => setTimeout(r, 500));

    // Phase 3
    setActivePhase(3);
    const vRes = runEnergyVarianceAnalysis(50, peak.alpha);
    setVarianceResult(vRes);
    const isTrapped = vRes.variance < 0.05 && vRes.meanEnergy > 0;
    await new Promise(r => setTimeout(r, 800));

    // Phase 4
    setActivePhase(4);
    const hRes = runHysteresisExperiment(50, peak.alpha, isTrapped ? 0.9999 : 0.999);
    setHysteresisResult(hRes);
    await new Promise(r => setTimeout(r, 800));

    // Phase 5
    let finalStructuralRes: StructuralResult | null = null;
    if (peak.alpha > 4.0 || isTrapped) {
      setActivePhase(5);
      // Run Backbone Scan
      const points: StructuralPoint[] = [];
      let shattered = null;
      for (const a of [4.2, 4.6, 5.0, 5.4, 5.8, 6.2]) {
        await new Promise(r => setTimeout(r, 10));
        const sRes = runStructuralAutopsy(50, a);
        points.push({ alpha: a, rigidity: sRes.backboneRigidity, energy: sRes.groundStateEnergy });
        if (!shattered && sRes.backboneRigidity > 0.5) shattered = a;
      }
      // Ultra Slow Check if shattered
      let usCheck = null;
      if (shattered) {
        const check = runHysteresisExperiment(50, shattered, 0.99995);
        usCheck = { alpha: shattered, success: check.slow.success, steps: check.slow.steps };
      }
      
      finalStructuralRes = {
        profile: points,
        shatteredPoint: shattered,
        ultraSlowCheck: usCheck,
        diagnosis: shattered ? (usCheck?.success ? 'GLASSY' : 'SHATTERED') : 'LIQUID',
        explanation: shattered ? "Backbone rigidity detected." : "Solution space is connected."
      };
      setStructuralResult(finalStructuralRes);
    }

    // --- AUTO REPORTING ---
    const report = `
[AUTOMATED PIPELINE REPORT]
1. MACRO: Peak complexity observed at alpha=${peak.alpha} (Steps: ${peak.maxSteps}).
2. MICRO: Agent ${agentSteps[agentSteps.length-1]?.errors === 0 ? 'found a solution' : 'failed to solve'} (Final Errors: ${agentSteps[agentSteps.length-1]?.errors}).
3. VARIANCE: ${vRes.diagnosis} (Variance: ${vRes.variance.toFixed(4)}).
4. HYSTERESIS: ${hRes.diagnosis}.
5. STRUCTURE: ${finalStructuralRes ? finalStructuralRes.diagnosis : 'N/A'} - ${finalStructuralRes ? finalStructuralRes.explanation : ''}.

REQUEST: Analyze these findings. Is the structural rigidity consistent with the variance diagnosis?
`;
    
    setActivePhase(0);
    // Trigger Agent Analysis
    setAutoAnalysisPrompt(report);
    // Mobile: Switch to Agents tab to see the report
    if (window.innerWidth < 768) {
      setTimeout(() => setActiveMobileTab('agents'), 500);
    }
  };

  // --- RENDER HELPERS ---
  const PhaseIndicator = ({ p, label, icon: Icon }: any) => {
    const isActive = activePhase === p;
    const isDone = activePhase === 0 && macroResults.length > 0 && p <= (structuralResult ? 5 : 4);
    
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        isActive ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 
        isDone ? 'bg-zinc-900/50 border-emerald-900/30 opacity-70' :
        'bg-zinc-900/30 border-zinc-800/50 opacity-40'
      }`}>
        <div className={`w-8 h-8 rounded flex items-center justify-center border ${
          isActive ? 'bg-indigo-500 border-indigo-400 text-white animate-pulse' :
          isDone ? 'bg-emerald-900 border-emerald-700 text-emerald-400' :
          'bg-zinc-800 border-zinc-700 text-zinc-500'
        }`}>
          {isActive ? <Activity className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        </div>
        <div className="flex flex-col">
          <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-indigo-300' : 'text-zinc-400'}`}>{label}</span>
          {isActive && <span className="text-[10px] text-indigo-400">Processing...</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen md:grid md:grid-cols-12 bg-[#050505] text-zinc-300 overflow-hidden relative">
      
      {/* === COL 1: CONTROL STACK (Left) === */}
      <div className={`${activeMobileTab === 'control' ? 'flex' : 'hidden'} md:flex col-span-2 border-r border-zinc-900 bg-[#08080a] flex-col z-20 shadow-2xl h-full overflow-hidden`}>
        <div className="p-4 border-b border-zinc-900 mt-10 md:mt-0">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <h1 className="font-bold text-zinc-100 tracking-tight text-sm">P vs NP Workbench</h1>
           </div>
           <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
             <span>SYS: ONLINE</span>
             <span className={apiKey ? "text-emerald-500" : "text-red-500"}>{apiKey ? "API: LINKED" : "API: MISSING"}</span>
           </div>
        </div>

        <div className="p-4 flex-grow flex flex-col gap-4 overflow-y-auto pb-24 md:pb-4">
          {/* Main Trigger */}
          <button 
            onClick={handleRunPipeline}
            disabled={activePhase !== 0}
            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 border flex flex-col items-center gap-2 ${
              activePhase !== 0 
               ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
               : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border-indigo-500 text-white shadow-[0_0_25px_rgba(79,70,229,0.3)] hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] hover:scale-[1.02]'
            }`}
          >
             {activePhase !== 0 ? <RotateCcw className="w-6 h-6 animate-spin"/> : <Radio className="w-6 h-6" />}
             {activePhase !== 0 ? 'EXECUTING...' : 'INITIATE SCAN'}
          </button>

          {/* Pipeline Stepper */}
          <div className="space-y-2 mt-2">
            <PhaseIndicator p={1} label="Macro Scan" icon={GitMerge} />
            <PhaseIndicator p={2} label="Micro Agent" icon={Flame} />
            <PhaseIndicator p={3} label="Variance Probe" icon={Microscope} />
            <PhaseIndicator p={4} label="Hysteresis" icon={Zap} />
            <PhaseIndicator p={5} label="Backbone Autopsy" icon={Bone} />
          </div>

          {/* Quick Prompts */}
          <div className="mt-auto pt-4 border-t border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-600 uppercase mb-2 block">Quick Commands</span>
            <div className="space-y-2">
              {prompts.map((p, i) => (
                <button 
                  key={i}
                  onClick={() => {
                      setAutoAnalysisPrompt(p.text);
                      if(window.innerWidth < 768) setActiveMobileTab('agents');
                  }}
                  className="w-full text-left p-2 rounded bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-900 text-[10px] text-zinc-400 hover:text-indigo-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === COL 2: THE OBSERVATORY (Center) === */}
      <div className={`${activeMobileTab === 'observatory' ? 'flex' : 'hidden'} md:flex col-span-7 bg-[#050505] flex-col relative overflow-hidden h-full`}>
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,23,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,23,0)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
        
        {/* Header */}
        <div className="h-12 border-b border-zinc-900 bg-[#050505]/80 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0 mt-8 md:mt-0">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Network className="w-3 h-3" />
            The Observatory
          </h2>
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
             <span className="hidden sm:inline">TARGET: 3-SAT</span>
             <span className="hidden sm:inline">VARS: 50</span>
             <span>ALPHA: {peakAlpha}</span>
          </div>
        </div>

        {/* Scrollable Dashboard */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 z-10 custom-scrollbar pb-24 md:pb-6">
          
          {/* Top Row: Macro & Micro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             {/* Macro Chart */}
             <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 relative overflow-hidden group h-64">
               <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                 <GitMerge className="w-4 h-4 text-purple-500" />
               </div>
               <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Phase Transition Curve</h3>
               <div className="h-full pb-6">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={macroResults}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                      <XAxis dataKey="alpha" stroke="#3f3f46" tick={{fontSize: 9}} domain={[3, 6]} type="number" />
                      <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                      <Line type="monotone" dataKey="maxSteps" stroke="#a855f7" strokeWidth={2} dot={false} />
                      <ReferenceLine x={peakAlpha} stroke="red" strokeDasharray="3 3" opacity={0.5} />
                    </LineChart>
                 </ResponsiveContainer>
               </div>
             </div>

             {/* Micro Chart */}
             <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 relative overflow-hidden h-64">
               <div className="absolute top-0 right-0 p-2 opacity-50">
                 <Flame className="w-4 h-4 text-orange-500" />
               </div>
               <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Energy Landscape (Errors)</h3>
               <div className="h-full pb-6">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={agentSteps}>
                      <defs>
                        <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                      <Area type="monotone" dataKey="errors" stroke="#f97316" fill="url(#colorError)" animationDuration={300} />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
             </div>
          </div>

          {/* Middle Row: Probes */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
             <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-3 md:p-5 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left gap-2">
                <div>
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Variance Probe</h3>
                   <div className="text-sm font-mono text-zinc-300">
                      {varianceResult ? (
                        <span className={varianceResult.variance < 0.05 ? "text-red-400 font-bold" : "text-emerald-400"}>
                          σ² = {varianceResult.variance.toFixed(4)}
                        </span>
                      ) : "Pending..."}
                   </div>
                   <div className="text-[9px] md:text-[10px] text-zinc-500 mt-1">{varianceResult?.diagnosis || "Waiting..."}</div>
                </div>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border ${varianceResult ? 'border-blue-500/50 bg-blue-900/20 text-blue-400' : 'border-zinc-800 bg-zinc-900 text-zinc-600'}`}>
                  <Microscope className="w-4 h-4 md:w-5 md:h-5" />
                </div>
             </div>

             <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-3 md:p-5 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left gap-2">
                <div>
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Hysteresis Probe</h3>
                   <div className="text-sm font-mono text-zinc-300">
                      {hysteresisResult ? (
                        <span className={hysteresisResult.slow.success ? "text-emerald-400" : "text-red-400 font-bold"}>
                          {hysteresisResult.slow.success ? "PASSED" : "FAILED"}
                        </span>
                      ) : "Pending..."}
                   </div>
                   <div className="text-[9px] md:text-[10px] text-zinc-500 mt-1">{hysteresisResult?.diagnosis || "Waiting..."}</div>
                </div>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border ${hysteresisResult ? 'border-yellow-500/50 bg-yellow-900/20 text-yellow-400' : 'border-zinc-800 bg-zinc-900 text-zinc-600'}`}>
                  <Zap className="w-4 h-4 md:w-5 md:h-5" />
                </div>
             </div>
          </div>

          {/* Bottom: Complexity Radar (Backbone Monitor) */}
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 relative overflow-hidden min-h-[200px]">
             {structuralResult?.diagnosis === 'SHATTERED' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600 z-20 shadow-[0_0_15px_rgba(220,38,38,0.6)]"></div>
             )}
             <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                   <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                     <ScanEye className="w-4 h-4 text-indigo-400" />
                     Complexity Radar
                   </h3>
                   <p className="text-[10px] text-zinc-500 mt-1">
                     Visualizing variable freezing.
                   </p>
                </div>
                {structuralResult && (
                  <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${
                    structuralResult.diagnosis === 'SHATTERED' 
                    ? 'bg-red-900/20 border-red-500/50 text-red-400' 
                    : 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400'
                  }`}>
                    {structuralResult.diagnosis}
                  </div>
                )}
             </div>
             
             <div className="h-40 relative z-10">
                {structuralResult ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={structuralResult.profile}>
                        <defs>
                          <linearGradient id="rigidityGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                          <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                             <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="alpha" stroke="#52525b" tick={{fontSize: 9}} />
                        <YAxis hide domain={[0, 1]} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                        <Area 
                          type="monotone" 
                          dataKey="rigidity" 
                          stroke="url(#rigidityGradient)" 
                          strokeWidth={3}
                          fill="url(#fillGradient)" 
                        />
                        <ReferenceLine y={0.5} stroke="#3f3f46" strokeDasharray="3 3" label={{value:"Frozen", fill:"#52525b", fontSize:9}} />
                      </AreaChart>
                   </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-zinc-700 text-xs uppercase tracking-widest border border-dashed border-zinc-800 rounded">
                      Phase 5 Pending
                   </div>
                )}
             </div>
          </div>

        </div>
      </div>

      {/* === COL 3: AGENT COUNCIL (Right) === */}
      <div className={`${activeMobileTab === 'agents' ? 'flex' : 'hidden'} md:flex col-span-3 bg-[#08080a] border-l border-zinc-900 flex-col z-20 h-full`}>
         <div className="h-12 border-b border-zinc-900 flex items-center px-4 bg-[#08080a] shrink-0 mt-8 md:mt-0">
           <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
             <Cpu className="w-3 h-3" />
             Agent Council
           </h2>
         </div>
         <div className="flex-grow overflow-hidden pb-24 md:pb-0">
            <ResearchWorkspace 
              apiKey={apiKey} 
              simulationData={macroResults} 
              autoAnalysisPrompt={autoAnalysisPrompt}
              onAutoAnalysisComplete={() => setAutoAnalysisPrompt(null)}
            />
         </div>
      </div>

      {/* === MOBILE BOTTOM NAVIGATION === */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-800 flex justify-around items-center h-16 z-50 px-2 pb-safe">
         <button 
           onClick={() => setActiveMobileTab('control')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMobileTab === 'control' ? 'text-indigo-400' : 'text-zinc-600'}`}
         >
           <LayoutDashboard className="w-5 h-5" />
           <span className="text-[10px] font-bold">Control</span>
         </button>
         <button 
           onClick={() => setActiveMobileTab('observatory')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMobileTab === 'observatory' ? 'text-indigo-400' : 'text-zinc-600'}`}
         >
           <ChartIcon className="w-5 h-5" />
           <span className="text-[10px] font-bold">Charts</span>
         </button>
         <button 
           onClick={() => setActiveMobileTab('agents')}
           className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeMobileTab === 'agents' ? 'text-indigo-400' : 'text-zinc-600'}`}
         >
           <MessageSquare className="w-5 h-5" />
           <span className="text-[10px] font-bold">Agents</span>
         </button>
      </div>

    </div>
  );
};

export default SimulationPanel;