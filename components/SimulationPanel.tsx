import React, { useState, useEffect, useRef } from 'react';
import ResearchWorkspace from './ResearchWorkspace';
import { generateRandom3SAT, solveDPLL, createAgentState, getCriticErrors, runSimulatedAnnealingStep, runEnergyVarianceAnalysis, runHysteresisExperiment, runStructuralAutopsy } from '../satSolver';
import { SolverResult, SimulationDataPoint, AgentStep, VarianceAnalysisResult, HysteresisResult, StructuralResult, StructuralPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { Activity, GitMerge, Microscope, Zap, Flame, Radio, Cpu, Network, LayoutDashboard, LineChart as ChartIcon, MessageSquare, RotateCcw, Bone, ScanEye, ClipboardCheck } from 'lucide-react';

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
  
  // Agent Prompts (Automated)
  const [autoAnalysisPrompt, setAutoAnalysisPrompt] = useState<string | null>(null);

  // Refs
  const microLoopRef = useRef<number | null>(null);

  // Check if charts should be rendered (prevents Recharts width(-1) crash on mobile hidden tabs)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const showCharts = isDesktop || activeMobileTab === 'observatory';

  // --- LOGIC: PHASE 1 (MACRO) ---
  const runMacroSimulation = async () => {
    const n = 15; const trials = 15; // Slightly reduced for faster mobile feedback
    const newResults: SimulationDataPoint[] = [];
    
    for (let alpha = 3.0; alpha <= 6.0; alpha += 0.3) {
      await new Promise(r => setTimeout(r, 10));
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
    const n = 40; const m = Math.round(n * targetAlpha);
    const formula = generateRandom3SAT(n, m);
    let assignment = createAgentState(n);
    let temp = 2.0;
    
    setAgentSteps([]);
    return new Promise<void>((resolve) => {
      let step = 0;
      const loop = () => {
        const errors = getCriticErrors(formula, assignment);
        if (errors.length === 0 || step > 250) { resolve(); return; }
        
        const res = runSimulatedAnnealingStep(formula, assignment, errors, temp);
        assignment = res.newAssignment;
        temp *= 0.98;
        
        setAgentSteps(prev => {
          const next = [...prev, { step, errors: errors.length, bestErrors: 0, flippedVar: res.flippedVar, action: '', temperature: temp, accepted: res.accepted }];
          return next.slice(-50);
        });
        step++;
        microLoopRef.current = window.setTimeout(loop, 15);
      };
      loop();
    });
  };

  // --- UNIFIED PIPELINE EXECUTION ---
  const handleRunPipeline = async () => {
    if (activePhase !== 0) return;
    setMacroResults([]); setAgentSteps([]); setVarianceResult(null); setHysteresisResult(null); setStructuralResult(null);

    // Initial Switch for User Visibility
    if (window.innerWidth < 768) {
        setActiveMobileTab('observatory');
    }

    // Phase 1: Macro
    setActivePhase(1);
    const mResults = await runMacroSimulation();
    const peak = mResults.reduce((p, c) => (c.maxSteps > p.maxSteps ? c : p), mResults[0]);
    setPeakAlpha(peak.alpha);
    await new Promise(r => setTimeout(r, 300));

    // Phase 2: Micro
    setActivePhase(2);
    await startAgentSimulation(peak.alpha);
    await new Promise(r => setTimeout(r, 300));

    // Phase 3: Variance
    setActivePhase(3);
    const vRes = runEnergyVarianceAnalysis(40, peak.alpha);
    setVarianceResult(vRes);
    const isTrapped = vRes.variance < 0.05 && vRes.meanEnergy > 0;
    await new Promise(r => setTimeout(r, 500));

    // Phase 4: Hysteresis
    setActivePhase(4);
    const hRes = runHysteresisExperiment(40, peak.alpha, isTrapped ? 0.9999 : 0.999);
    setHysteresisResult(hRes);
    await new Promise(r => setTimeout(r, 500));

    // Phase 5: Structural Autopsy
    let sResFinal: StructuralResult | null = null;
    if (peak.alpha > 4.0 || isTrapped) {
      setActivePhase(5);
      const points: StructuralPoint[] = [];
      let shattered = null;
      for (const a of [4.2, 4.8, 5.4, 6.0]) {
        await new Promise(r => setTimeout(r, 20));
        const autopsy = runStructuralAutopsy(40, a);
        points.push({ alpha: a, rigidity: autopsy.backboneRigidity, energy: autopsy.groundStateEnergy });
        if (!shattered && autopsy.backboneRigidity > 0.5) shattered = a;
      }
      sResFinal = {
        profile: points,
        shatteredPoint: shattered,
        ultraSlowCheck: null,
        diagnosis: shattered ? 'SHATTERED' : 'LIQUID',
        explanation: shattered ? "Structural rigidity detected in the backbone." : "Solution space remains connected."
      };
      setStructuralResult(sResFinal);
    }

    // --- AUTOMATIC REPORT GENERATION ---
    const summaryReport = `
[MISSION SUMMARY: P vs NP SEARCH]
-----------------------------------
1. MACRO: Peak Difficulty at α=${peak.alpha} (Max steps: ${peak.maxSteps}).
2. MICRO: Local search ${agentSteps[agentSteps.length-1]?.errors === 0 ? 'succeeded' : 'failed'}.
3. PROBE: Variance σ²=${vRes.variance.toFixed(4)} -> ${vRes.diagnosis}.
4. HYSTERESIS: ${hRes.diagnosis}.
5. STRUCTURE: ${sResFinal ? sResFinal.diagnosis : 'LIQUID'} - ${sResFinal ? sResFinal.explanation : 'No rigidity observed'}.

AGENT COUNCIL: Please analyze if this specific α=${peak.alpha} instance shows signs of a First-Order Phase Transition or if the trapping is merely algorithmic.
`;
    
    setActivePhase(0);
    setAutoAnalysisPrompt(summaryReport);
    
    // Switch to Agents Tab to see result
    if (window.innerWidth < 768) {
        setTimeout(() => setActiveMobileTab('agents'), 500);
    }
  };

  const PhaseIndicator = ({ p, label, icon: Icon }: any) => {
    const isActive = activePhase === p;
    const isDone = activePhase === 0 && macroResults.length > 0 && p <= (structuralResult ? 5 : 4);
    
    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
        isActive ? 'bg-indigo-900/20 border-indigo-500/50' : 
        isDone ? 'bg-emerald-900/10 border-emerald-900/30 opacity-70' :
        'bg-zinc-900/30 border-zinc-800/50 opacity-40'
      }`}>
        <div className={`w-7 h-7 rounded flex items-center justify-center border ${
          isActive ? 'bg-indigo-500 border-indigo-400 text-white animate-pulse' :
          isDone ? 'bg-emerald-900 border-emerald-700 text-emerald-400' :
          'bg-zinc-800 border-zinc-700 text-zinc-500'
        }`}>
          {isActive ? <Activity className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-indigo-300' : 'text-zinc-500'}`}>{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen md:grid md:grid-cols-12 bg-[#050505] text-zinc-300 overflow-hidden relative">
      
      {/* === COLUMN 1: CONTROL (Tab 1) === */}
      <div className={`${activeMobileTab === 'control' ? 'flex' : 'hidden'} md:flex col-span-3 border-r border-zinc-900 bg-[#08080a] flex-col z-20 h-full overflow-hidden`}>
        <div className="p-4 border-b border-zinc-900 pt-12 md:pt-4">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
             <h1 className="font-black text-zinc-100 tracking-tighter text-base">SAT_SOLVER_PRO</h1>
           </div>
           <p className="text-[10px] font-mono text-zinc-600 uppercase">Strategic Complexity Analyzer</p>
        </div>

        <div className="p-4 flex-grow flex flex-col gap-3 overflow-y-auto pb-24 md:pb-4 scrollbar-hide">
          <button 
            onClick={handleRunPipeline}
            disabled={activePhase !== 0}
            className={`w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all border flex flex-col items-center gap-2 ${
              activePhase !== 0 
               ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed animate-pulse'
               : 'bg-gradient-to-br from-indigo-600 to-purple-800 border-indigo-400 text-white shadow-lg hover:scale-[1.01]'
            }`}
          >
             {activePhase !== 0 ? <RotateCcw className="w-6 h-6 animate-spin"/> : <Radio className="w-6 h-6" />}
             {activePhase !== 0 ? 'ANALYZING...' : 'INITIATE PROTOCOL'}
          </button>

          <div className="space-y-2">
            <PhaseIndicator p={1} label="Macro Curve Scan" icon={GitMerge} />
            <PhaseIndicator p={2} label="Agent Dynamics" icon={Flame} />
            <PhaseIndicator p={3} label="Variance Probe" icon={Microscope} />
            <PhaseIndicator p={4} label="Hysteresis Probe" icon={Zap} />
            <PhaseIndicator p={5} label="Structural Autopsy" icon={Bone} />
          </div>

          <div className="mt-auto p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg">
             <div className="text-[9px] font-bold text-zinc-500 mb-2 uppercase flex items-center gap-1">
               <ClipboardCheck className="w-3 h-3" /> System Status
             </div>
             <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-600">ALPHA_PEAK</span>
                <span className="text-indigo-400 font-bold">{peakAlpha}</span>
             </div>
             <div className="flex justify-between text-[10px] font-mono mt-1">
                <span className="text-zinc-600">STATE</span>
                <span className={activePhase === 0 ? "text-emerald-500" : "text-amber-500"}>
                  {activePhase === 0 ? "READY" : "BUSY"}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* === COLUMN 2: OBSERVATORY (Tab 2) === */}
      <div className={`${activeMobileTab === 'observatory' ? 'flex' : 'hidden'} md:flex col-span-6 bg-[#050505] flex-col relative overflow-hidden h-full`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent)] pointer-events-none"></div>
        
        <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 pt-8 md:pt-0 shrink-0 z-10">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-500" />
            Observatory
          </h2>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[9px] text-zinc-600 font-bold uppercase">Complexity</span>
                <span className="text-[11px] font-mono text-indigo-400">{peakAlpha} α</span>
             </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 z-10 pb-24 md:pb-6 min-h-0">
          
          <div className="grid grid-cols-1 gap-4">
             {/* Chart 1 */}
             <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 h-64 flex flex-col min-h-[250px]">
               <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-4 flex items-center gap-2">
                 <GitMerge className="w-3 h-3" /> SAT Transition Probability
               </h3>
               <div className="flex-grow w-full h-full min-h-0">
                 {/* CRITICAL FIX: Only render chart if visible to prevent crash */}
                 {showCharts && (
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={macroResults} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="alpha" stroke="#3f3f46" tick={{fontSize: 9}} type="number" domain={[3, 6]} />
                        <YAxis stroke="#3f3f46" tick={{fontSize: 9}} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                        <Line type="stepAfter" dataKey="satisfiabilityRatio" stroke="#6366f1" strokeWidth={3} dot={false} />
                        <ReferenceLine x={peakAlpha} stroke="red" strokeDasharray="3 3" />
                      </LineChart>
                   </ResponsiveContainer>
                 )}
               </div>
             </div>

             {/* Chart 2 */}
             <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 h-64 flex flex-col min-h-[250px]">
               <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-4 flex items-center gap-2">
                 <Flame className="w-3 h-3" /> SA Energy Descent
               </h3>
               <div className="flex-grow w-full h-full min-h-0">
                  {showCharts && (
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={agentSteps} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis hide />
                        <YAxis stroke="#3f3f46" tick={{fontSize: 9}} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                        <Area type="monotone" dataKey="errors" stroke="#f43f5e" fill="url(#energyFill)" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                   </ResponsiveContainer>
                  )}
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Variance Diagnosis</p>
                <div className="text-xs font-mono font-bold truncate text-indigo-400">
                   {varianceResult?.diagnosis || "PENDING"}
                </div>
                {varianceResult && <div className="text-[9px] text-zinc-700 mt-1">σ²: {varianceResult.variance.toFixed(4)}</div>}
             </div>
             <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Hysteresis Scan</p>
                <div className="text-xs font-mono font-bold truncate text-indigo-400">
                   {hysteresisResult?.diagnosis || "PENDING"}
                </div>
                {hysteresisResult && <div className="text-[9px] text-zinc-700 mt-1">Barrier Crossed: {hysteresisResult.slow.success ? 'YES' : 'NO'}</div>}
             </div>
          </div>

        </div>
      </div>

      {/* === COLUMN 3: AGENTS (Tab 3) === */}
      <div className={`${activeMobileTab === 'agents' ? 'flex' : 'hidden'} md:flex col-span-3 bg-[#08080a] border-l border-zinc-900 flex-col z-20 h-full`}>
         <div className="h-14 border-b border-zinc-900 flex items-center px-4 pt-8 md:pt-0 shrink-0">
           <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
             <Cpu className="w-4 h-4 text-indigo-500" />
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

      {/* === MOBILE BOTTOM NAV === */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 flex justify-around items-center h-20 z-50 px-4 pb-4">
         <button 
           onClick={() => setActiveMobileTab('control')}
           className={`flex flex-col items-center gap-1 transition-all ${activeMobileTab === 'control' ? 'text-indigo-400 scale-110' : 'text-zinc-600'}`}
         >
           <LayoutDashboard className="w-6 h-6" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Control</span>
         </button>
         <button 
           onClick={() => setActiveMobileTab('observatory')}
           className={`flex flex-col items-center gap-1 transition-all ${activeMobileTab === 'observatory' ? 'text-indigo-400 scale-110' : 'text-zinc-600'}`}
         >
           <ChartIcon className="w-6 h-6" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Observatory</span>
         </button>
         <button 
           onClick={() => setActiveMobileTab('agents')}
           className={`flex flex-col items-center gap-1 transition-all ${activeMobileTab === 'agents' ? 'text-indigo-400 scale-110' : 'text-zinc-600'}`}
         >
           <MessageSquare className="w-6 h-6" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Council</span>
         </button>
      </div>

    </div>
  );
};

export default SimulationPanel;