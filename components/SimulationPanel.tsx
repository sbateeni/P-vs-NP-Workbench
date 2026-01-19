import React, { useState, useEffect, useRef } from 'react';
import { generateRandom3SAT, solveDPLL, createAgentState, getCriticErrors, runSimulatedAnnealingStep, runEnergyVarianceAnalysis, runHysteresisExperiment } from '../satSolver';
import { SolverResult, SimulationDataPoint, AgentStep, VarianceAnalysisResult, HysteresisResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, ComposedChart } from 'recharts';
import { Play, RotateCcw, Activity, GitMerge, Microscope, Zap, Layers, Copy, Flame, Search, Timer, CheckCircle, XCircle, ArrowDown } from 'lucide-react';

interface SimulationPanelProps {
  onDataUpdate: (data: SimulationDataPoint[]) => void;
  runTrigger?: number; // Prop to trigger run externally
  onComplete?: () => void; // Callback when full run finishes
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ onDataUpdate, runTrigger = 0, onComplete }) => {
  // --- Macro State (DPLL Phase Transition) ---
  const [n, setN] = useState<number>(15);
  const [trials, setTrials] = useState<number>(20);
  const [isMacroRunning, setIsMacroRunning] = useState<boolean>(false);
  const [macroProgress, setMacroProgress] = useState<number>(0);
  const [macroResults, setMacroResults] = useState<SimulationDataPoint[]>([]);

  // --- Micro State (Agent Simulation) ---
  const [isMicroRunning, setIsMicroRunning] = useState<boolean>(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentAssignment, setAgentAssignment] = useState<boolean[]>([]);
  const [microVars, setMicroVars] = useState<number>(50); // Larger N for agents
  const [microClauses, setMicroClauses] = useState<number>(215); // Critical region ratio ~4.3
  
  // Simulated Annealing State
  const [currentTemp, setCurrentTemp] = useState<number>(0);
  const [bestErrorsFound, setBestErrorsFound] = useState<number>(0);

  // --- Deep Probe State (Variance & Hysteresis) ---
  const [varianceResult, setVarianceResult] = useState<VarianceAnalysisResult | null>(null);
  const [hysteresisResult, setHysteresisResult] = useState<HysteresisResult | null>(null);
  const [activePhase, setActivePhase] = useState<number>(0); // 0: Idle, 1: Macro, 2: Micro, 3: Variance, 4: Hysteresis

  // Refs for animation loops
  const microLoopRef = useRef<number | null>(null);

  // External Trigger Watcher
  useEffect(() => {
    if (runTrigger > 0 && activePhase === 0) {
      handleRunUnifiedPipeline();
    }
  }, [runTrigger]);

  // --- 1. Macro Simulation Logic ---
  const runMacroSimulation = async (): Promise<SimulationDataPoint[]> => {
    setIsMacroRunning(true);
    setMacroResults([]);
    setMacroProgress(0);

    const alphaStart = 3.0;
    const alphaEnd = 6.0;
    const alphaStep = 0.2;
    const totalSteps = Math.floor((alphaEnd - alphaStart) / alphaStep) + 1;
    let stepCount = 0;
    const newResults: SimulationDataPoint[] = [];

    for (let alpha = alphaStart; alpha <= alphaEnd; alpha += alphaStep) {
      await new Promise(resolve => setTimeout(resolve, 5)); // Yield to UI
      const m = Math.round(alpha * n);
      let totalComplexity = 0;
      let maxComplexity = 0;
      let satCount = 0;

      for (let t = 0; t < trials; t++) {
        const formula = generateRandom3SAT(n, m);
        const result = solveDPLL(formula, n);
        totalComplexity += result.steps;
        if (result.steps > maxComplexity) maxComplexity = result.steps;
        if (result.satisfiable) satCount++;
      }

      const point: SimulationDataPoint = {
        alpha: parseFloat(alpha.toFixed(2)),
        avgSteps: Math.round(totalComplexity / trials),
        maxSteps: maxComplexity,
        satisfiabilityRatio: satCount / trials,
      };

      newResults.push(point);
      setMacroResults([...newResults]);
      stepCount++;
      setMacroProgress((stepCount / totalSteps) * 100);
    }

    setIsMacroRunning(false);
    onDataUpdate(newResults);
    return newResults;
  };

  // --- 2. Micro Simulation Logic ---
  const startAgentSimulation = async (): Promise<void> => {
    if (isMicroRunning) {
      stopAgentSimulation();
      return Promise.resolve();
    }

    // Generate Hard Instance
    const formula = generateRandom3SAT(microVars, microClauses);
    let assignment = createAgentState(microVars);
    setAgentAssignment(assignment);
    setAgentSteps([]);
    
    let temperature = 2.0;
    const coolingRate = 0.98; 
    setCurrentTemp(temperature);
    
    const initialErrors = getCriticErrors(formula, assignment);
    setBestErrorsFound(initialErrors.length);

    setIsMicroRunning(true);

    return new Promise<void>((resolve) => {
      let stepCounter = 0;
      const maxSteps = 400; 
      let currentBest = initialErrors.length;

      const loop = () => {
        const errors = getCriticErrors(formula, assignment);
        const errorCount = errors.length;

        if (errorCount < currentBest) {
          currentBest = errorCount;
          setBestErrorsFound(currentBest);
        }
        
        if (errorCount === 0 || stepCounter >= maxSteps) {
          setAgentSteps(prev => [...prev, {
            step: stepCounter,
            errors: 0,
            bestErrors: 0,
            flippedVar: null,
            action: errorCount === 0 ? 'SOLVED!' : 'TIMEOUT',
            temperature,
            accepted: true
          }]);
          setIsMicroRunning(false);
          resolve();
          return; 
        }

        const { newAssignment, flippedVar, accepted, delta } = runSimulatedAnnealingStep(
          formula, 
          assignment, 
          errors, 
          temperature
        );

        assignment = newAssignment;
        setAgentAssignment(assignment);
        
        let actionDesc = accepted ? `Flipped x${flippedVar}` : `Rejected x${flippedVar}`;
        if (accepted && delta > 0) actionDesc += " (Bad Move Accepted)";

        setAgentSteps(prev => {
          const next = [...prev, {
            step: stepCounter,
            errors: errorCount,
            bestErrors: currentBest,
            flippedVar,
            action: actionDesc,
            temperature,
            accepted
          }];
          if (next.length > 60) next.shift(); 
          return next;
        });

        temperature *= coolingRate;
        if (temperature < 0.05) temperature = 0.05; 
        setCurrentTemp(temperature);

        stepCounter++;
        microLoopRef.current = window.setTimeout(loop, 10); 
      };

      loop();
    });
  };

  const stopAgentSimulation = () => {
    if (microLoopRef.current) clearTimeout(microLoopRef.current);
    setIsMicroRunning(false);
  };

  useEffect(() => {
    return () => stopAgentSimulation();
  }, []);

  // --- THE UNIFIED PIPELINE ---
  const handleRunUnifiedPipeline = async () => {
    if (activePhase !== 0) return;
    
    // Clear previous data
    setMacroResults([]);
    setAgentSteps([]);
    setVarianceResult(null);
    setHysteresisResult(null);

    // --- PHASE 1: MACRO ---
    setActivePhase(1);
    await runMacroSimulation();
    
    await new Promise(r => setTimeout(r, 600)); // Cinematic pause

    // --- PHASE 2: MICRO ---
    setActivePhase(2);
    await startAgentSimulation();

    await new Promise(r => setTimeout(r, 600));

    // --- PHASE 3: VARIANCE PROBE (Alpha 5.6) ---
    setActivePhase(3);
    const vResult = runEnergyVarianceAnalysis(50, 5.6);
    setVarianceResult(vResult);
    // Simulate processing delay for visual effect
    await new Promise(r => setTimeout(r, 800));

    // --- PHASE 4: HYSTERESIS PROBE (Alpha 5.8) ---
    setActivePhase(4);
    const hResult = runHysteresisExperiment(50, 5.8);
    setHysteresisResult(hResult);
    
    setActivePhase(0); // Done
    if (onComplete) onComplete();
  };

  const handleCopyResults = () => {
    const report = `
P vs NP Workbench - Unified Experiment Report
=============================================
Timestamp: ${new Date().toLocaleString()}

1. MACRO ANALYSIS (Phase Transition)
------------------------------------
Peak Complexity: ${macroResults.length ? Math.max(...macroResults.map(r => r.maxSteps)) : 'N/A'} steps
Critical Alpha: ~4.26

2. MICRO ANALYSIS (Annealing Dynamics)
--------------------------------------
Final Error Count: ${agentSteps.length > 0 ? agentSteps[agentSteps.length-1].errors : 'N/A'}
Steps Taken: ${agentSteps.length}

3. ENERGY VARIANCE PROBE (Alpha=5.6)
------------------------------------
${varianceResult ? `
Min Energy: ${varianceResult.minEnergy}
Mean Energy: ${varianceResult.meanEnergy.toFixed(2)}
Variance: ${varianceResult.variance.toFixed(4)}
Diagnosis: ${varianceResult.diagnosis}
` : 'Not Run'}

4. HYSTERESIS PROBE (Alpha=5.8)
-------------------------------
${hysteresisResult ? `
Fast Cooling (0.95): ${hysteresisResult.fast.success ? 'Success' : 'Failed'} (${hysteresisResult.fast.steps} steps)
Slow Cooling (0.999): ${hysteresisResult.slow.success ? 'Success' : 'Failed'} (${hysteresisResult.slow.steps} steps)
Diagnosis: ${hysteresisResult.diagnosis}
` : 'Not Run'}
    `.trim();

    navigator.clipboard.writeText(report);
    alert("Full Scientific Report copied to clipboard!");
  };

  return (
    <div className="h-full flex flex-col space-y-0 overflow-y-auto pr-1">
      
      {/* GLOBAL CONTROLS */}
      <div className="bg-zinc-950 border-b border-zinc-800 p-3 flex gap-4 justify-between items-center mb-2 sticky top-0 z-20">
         <div className="flex flex-col">
             <h2 className="text-sm font-bold text-white flex items-center gap-2">
                 <Activity className={`w-4 h-4 ${activePhase > 0 ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`} />
                 Pipeline Status: {activePhase === 0 ? 'Ready' : `Running Phase ${activePhase}/4...`}
             </h2>
             <div className="flex gap-1 mt-1">
                 {[1,2,3,4].map(p => (
                     <div key={p} className={`h-1 w-8 rounded-full transition-colors ${
                         p < activePhase ? 'bg-emerald-500' :
                         p === activePhase ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-800'
                     }`} />
                 ))}
             </div>
         </div>
         
         <div className="flex gap-2">
            <button
                onClick={handleRunUnifiedPipeline}
                disabled={activePhase !== 0}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${
                activePhase !== 0 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/20'
                }`}
            >
                {activePhase !== 0 ? <RotateCcw className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />}
                Run Unified Experiment
            </button>
            <button
                onClick={handleCopyResults}
                disabled={macroResults.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Copy className="w-4 h-4" />
                Report
            </button>
         </div>
      </div>

      {/* PHASE 1: MACRO */}
      <div className={`transition-opacity duration-500 ${activePhase === 1 ? 'opacity-100' : 'opacity-80'}`}>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-t-lg shadow-lg relative">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-zinc-300 text-sm font-bold flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-purple-400" />
                    Phase 1: Phase Transition (Macro)
                </h3>
                {activePhase === 1 && <span className="text-[10px] text-purple-400 animate-pulse">SIMULATING...</span>}
            </div>
            
            <div className="w-full h-32">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macroResults}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="alpha" stroke="#71717a" domain={[3, 6]} type="number" hide />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '12px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                />
                <ReferenceLine x={4.26} stroke="red" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="avgSteps" stroke="#f87171" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="satisfiabilityRatio" stroke="#4ade80" dot={false} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="flex justify-center -my-2 z-10 relative">
          <ArrowDown className={`w-4 h-4 ${activePhase >= 2 ? 'text-indigo-500' : 'text-zinc-800'}`} />
      </div>

      {/* PHASE 2: MICRO */}
      <div className={`transition-opacity duration-500 ${activePhase === 2 ? 'opacity-100' : 'opacity-80'}`}>
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-zinc-300 text-sm font-bold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Phase 2: Annealing Dynamics (Micro)
                </h3>
                {activePhase === 2 && <span className="text-[10px] text-orange-400 animate-pulse">OPTIMIZING...</span>}
            </div>
            <div className="h-32 w-full relative border border-zinc-800/50 rounded bg-zinc-900/30">
                <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={agentSteps}>
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="#ef444430" />
                </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="flex justify-center -my-2 z-10 relative">
          <ArrowDown className={`w-4 h-4 ${activePhase >= 3 ? 'text-indigo-500' : 'text-zinc-800'}`} />
      </div>

      {/* PHASE 3 & 4: PROBES (Grid Layout) */}
      <div className="grid grid-cols-2 gap-4 mt-2 pb-4">
          
          {/* Phase 3: Variance */}
          <div className={`bg-black border border-zinc-800 p-4 rounded-lg shadow-lg flex flex-col ${activePhase === 3 ? 'ring-1 ring-blue-500' : ''}`}>
             <h3 className="text-zinc-300 text-xs font-bold flex items-center gap-2 mb-3">
                 <Microscope className="w-3 h-3 text-blue-400" />
                 Phase 3: Variance (α=5.6)
             </h3>
             <div className="flex-grow flex flex-col justify-center items-center space-y-2">
                 {varianceResult ? (
                     <>
                        <div className="text-2xl font-mono font-bold text-white">{varianceResult.variance.toFixed(4)}</div>
                        <div className={`text-[10px] px-2 py-1 rounded border ${
                            varianceResult.diagnosis.includes("TRAPPED") 
                            ? 'border-red-900 bg-red-900/20 text-red-400' 
                            : 'border-blue-900 bg-blue-900/20 text-blue-400'
                        }`}>
                            {varianceResult.diagnosis}
                        </div>
                     </>
                 ) : (
                     <span className="text-zinc-700 text-xs">{activePhase === 3 ? 'Analyzing...' : 'Waiting...'}</span>
                 )}
             </div>
          </div>

          {/* Phase 4: Hysteresis */}
          <div className={`bg-black border border-zinc-800 p-4 rounded-lg shadow-lg flex flex-col ${activePhase === 4 ? 'ring-1 ring-yellow-500' : ''}`}>
             <h3 className="text-zinc-300 text-xs font-bold flex items-center gap-2 mb-3">
                 <Zap className="w-3 h-3 text-yellow-400" />
                 Phase 4: Hysteresis (α=5.8)
             </h3>
             <div className="flex-grow flex flex-col justify-center space-y-2">
                 {hysteresisResult ? (
                     <div className="grid grid-cols-2 gap-2 w-full">
                         <div className="flex flex-col items-center p-1 bg-zinc-900/50 rounded">
                             <span className="text-[9px] text-zinc-500">Fast</span>
                             {hysteresisResult.fast.success ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                         </div>
                         <div className="flex flex-col items-center p-1 bg-zinc-900/50 rounded">
                             <span className="text-[9px] text-zinc-500">Slow</span>
                             {hysteresisResult.slow.success ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                         </div>
                         <div className="col-span-2 text-center text-[10px] text-zinc-300 pt-1 border-t border-zinc-800">
                             {hysteresisResult.diagnosis}
                         </div>
                     </div>
                 ) : (
                     <div className="text-center text-zinc-700 text-xs">{activePhase === 4 ? 'Probing...' : 'Waiting...'}</div>
                 )}
             </div>
          </div>

      </div>

    </div>
  );
};

export default SimulationPanel;