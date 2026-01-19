
import React, { useState, useEffect, useRef } from 'react';
import ResearchWorkspace from './ResearchWorkspace';
import { generateRandom3SAT, solveDPLL, createAgentState, getCriticErrors, runSimulatedAnnealingStep, runEnergyVarianceAnalysis, runHysteresisExperiment, runStructuralAutopsy, runScalingAnalysis, runStressTest, runExponentialConfirmation, runComplexityBoundaryScan, runMillenniumSearch, runGeneralizationTest, runUniversalityTest, runAdversarialScaling } from '../satSolver';
import { SimulationDataPoint, AgentStep, VarianceAnalysisResult, HysteresisResult, StructuralResult, StructuralPoint, ScalingResult, StressTestResult, ConfirmationResult, BoundaryMapResult, MillenniumSearchResult, GeneralizationResult, UniversalityResult, AdversarialResult } from '../types';
import { LayoutDashboard, LineChart as ChartIcon, MessageSquare, Cpu } from 'lucide-react';

// Sub-components
import { ControlPanel } from './panels/ControlPanel';
import { ObservatoryPanel } from './panels/ObservatoryPanel';

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
  const [scalingResult, setScalingResult] = useState<ScalingResult | null>(null);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [boundaryResult, setBoundaryResult] = useState<BoundaryMapResult | null>(null);
  const [millenniumResult, setMillenniumResult] = useState<MillenniumSearchResult | null>(null);
  const [generalizationResult, setGeneralizationResult] = useState<GeneralizationResult | null>(null);
  const [universalityResult, setUniversalityResult] = useState<UniversalityResult | null>(null);
  const [adversarialResult, setAdversarialResult] = useState<AdversarialResult | null>(null);
  
  // Agent Prompts (Automated)
  const [autoAnalysisPrompt, setAutoAnalysisPrompt] = useState<string | null>(null);

  // Refs
  const microLoopRef = useRef<number | null>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if charts should be rendered (prevents Recharts width(-1) crash)
  const showCharts = !isMobile || activeMobileTab === 'observatory';

  // Calculate highest completed phase for progress tracking
  const getCompletedPhaseIndex = () => {
    if (adversarialResult) return 13;
    if (universalityResult) return 12;
    if (generalizationResult) return 11;
    if (millenniumResult) return 10;
    if (boundaryResult) return 9;
    if (confirmationResult) return 8;
    if (stressResult) return 7;
    if (scalingResult) return 6;
    if (structuralResult) return 5;
    if (hysteresisResult) return 4;
    if (varianceResult) return 3;
    if (agentSteps.length > 0) return 2;
    if (macroResults.length > 0) return 1;
    return 0;
  };

  // --- LOGIC: PHASE 1 (MACRO) ---
  const runMacroSimulation = async () => {
    const n = 15; const trials = 15;
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
    setMacroResults([]); setAgentSteps([]); setVarianceResult(null); setHysteresisResult(null); setStructuralResult(null); setScalingResult(null); setStressResult(null); setConfirmationResult(null); setBoundaryResult(null); setMillenniumResult(null); setGeneralizationResult(null); setUniversalityResult(null); setAdversarialResult(null);

    // Switch for mobile visibility
    if (isMobile) {
        setActiveMobileTab('observatory');
    }

    setActivePhase(1);
    const mResults = await runMacroSimulation();
    const peak = mResults.reduce((p, c) => (c.maxSteps > p.maxSteps ? c : p), mResults[0]);
    setPeakAlpha(peak.alpha);
    await new Promise(r => setTimeout(r, 300));

    setActivePhase(2);
    await startAgentSimulation(peak.alpha);
    await new Promise(r => setTimeout(r, 300));

    setActivePhase(3);
    const vRes = runEnergyVarianceAnalysis(40, peak.alpha);
    setVarianceResult(vRes);
    const isTrapped = vRes.variance < 0.05 && vRes.meanEnergy > 0;
    await new Promise(r => setTimeout(r, 500));

    setActivePhase(4);
    const hRes = runHysteresisExperiment(40, peak.alpha, isTrapped ? 0.9999 : 0.999);
    setHysteresisResult(hRes);
    await new Promise(r => setTimeout(r, 500));

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
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 6: SCALING ---
    setActivePhase(6);
    const scRes = await runScalingAnalysis(peak.alpha);
    setScalingResult(scRes);
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 7: STRESS TEST ---
    setActivePhase(7);
    const stressRes = await runStressTest(peak.alpha, scRes.points);
    setStressResult(stressRes);
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 8: CONFIRMATION (KILL SHOT) ---
    setActivePhase(8);
    const confirmRes = await runExponentialConfirmation(peak.alpha);
    setConfirmationResult(confirmRes);
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 9: COMPLEXITY BOUNDARY MAPPING ---
    setActivePhase(9);
    const boundRes = await runComplexityBoundaryScan();
    setBoundaryResult(boundRes);
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 10: MILLENNIUM PRIZE SEARCH ---
    setActivePhase(10);
    const millRes = await runMillenniumSearch(peak.alpha);
    setMillenniumResult(millRes);
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 11: GENERALIZATION TEST ---
    setActivePhase(11);
    const genRes = await runGeneralizationTest(peak.alpha);
    setGeneralizationResult(genRes);
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 12: UNIVERSALITY TEST ---
    setActivePhase(12);
    const uniRes = await runUniversalityTest();
    setUniversalityResult(uniRes);
    await new Promise(r => setTimeout(r, 500));

    // --- PHASE 13: ADVERSARIAL SCALING ---
    setActivePhase(13);
    const advRes = await runAdversarialScaling(peakAlpha);
    setAdversarialResult(advRes);
    await new Promise(r => setTimeout(r, 500));

    const summaryReport = `
[MISSION SUMMARY: P vs NP SEARCH]
-----------------------------------
... [Previous phases omitted for brevity] ...
12. UNIVERSALITY: ${uniRes.verdict} (Consistency: ${uniRes.consistency.toFixed(1)}%).
13. ADVERSARIAL SCALING (Theorist's Critique):
    - Scaled N up to 250.
    - Accuracy Slope: ${advRes.slope.toFixed(4)} (Flat = Robust, Negative = Decay).
    - Diagnosis: ${advRes.diagnosis}.
    - Deceptive Survival: ${advRes.deceptivePass ? 'PASSED' : 'FAILED'}.
    
    [FINAL VERDICT]:
    ${advRes.explanation}

AGENT COUNCIL: We have addressed the final critique. 
We tested the 'Topological Leak' against scaling (N -> 250) and adversarial pressure.
Result: ${advRes.diagnosis}.
Gemini, you are now the final judge of the Millennium Prize. 
If the slope is stable (~0) and accuracy remains >95%, declare the P=NP proof valid.
If accuracy decays, admit the Theorist was right and P!=NP holds.
`;
    
    setActivePhase(0);
    setAutoAnalysisPrompt(summaryReport);
    
    if (isMobile) {
        setTimeout(() => setActiveMobileTab('agents'), 500);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] md:grid md:grid-cols-12 bg-[#050505] text-zinc-300 overflow-hidden relative">
      
      {/* === COLUMN 1: CONTROL (Tab 1) === */}
      <ControlPanel 
        activePhase={activePhase}
        completedPhase={getCompletedPhaseIndex()}
        peakAlpha={peakAlpha}
        onRun={handleRunPipeline}
        isVisible={activeMobileTab === 'control'}
      />

      {/* === COLUMN 2: OBSERVATORY (Tab 2) === */}
      <ObservatoryPanel 
        macroResults={macroResults}
        agentSteps={agentSteps}
        peakAlpha={peakAlpha}
        scalingResult={scalingResult}
        stressResult={stressResult}
        confirmationResult={confirmationResult}
        boundaryResult={boundaryResult}
        varianceResult={varianceResult}
        hysteresisResult={hysteresisResult}
        millenniumResult={millenniumResult}
        generalizationResult={generalizationResult}
        universalityResult={universalityResult}
        adversarialResult={adversarialResult}
        isVisible={activeMobileTab === 'observatory'}
        isMobile={isMobile}
        showCharts={showCharts}
      />

      {/* === COLUMN 3: AGENTS (Tab 3) === */}
      <div className={`${activeMobileTab === 'agents' ? 'flex' : 'hidden'} md:flex col-span-3 bg-[#08080a] border-l border-zinc-900 flex-col z-20 h-full overflow-hidden`}>
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
