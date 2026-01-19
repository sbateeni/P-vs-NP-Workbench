
import React, { useState, useEffect, useRef } from 'react';
import ResearchWorkspace from './ResearchWorkspace';
import { generateRandom3SAT, solveDPLL, createAgentState, getCriticErrors, runSimulatedAnnealingStep, runEnergyVarianceAnalysis, runHysteresisExperiment, runStructuralAutopsy, runScalingAnalysis, runStressTest, runExponentialConfirmation, runComplexityBoundaryScan, runMillenniumSearch, runGeneralizationTest, runUniversalityTest } from '../satSolver';
import { SolverResult, SimulationDataPoint, AgentStep, VarianceAnalysisResult, HysteresisResult, StructuralResult, StructuralPoint, ScalingResult, StressTestResult, ConfirmationResult, BoundaryMapResult, MillenniumSearchResult, GeneralizationResult, UniversalityResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart, ReferenceArea } from 'recharts';
import { Activity, GitMerge, Microscope, Zap, Flame, Radio, Cpu, Network, LayoutDashboard, LineChart as ChartIcon, MessageSquare, RotateCcw, Bone, ScanEye, ClipboardCheck, TrendingUp, Skull, Radiation, Mountain, Trophy, Globe, Scale } from 'lucide-react';

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
    setMacroResults([]); setAgentSteps([]); setVarianceResult(null); setHysteresisResult(null); setStructuralResult(null); setScalingResult(null); setStressResult(null); setConfirmationResult(null); setBoundaryResult(null); setMillenniumResult(null); setGeneralizationResult(null); setUniversalityResult(null);

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

    const summaryReport = `
[MISSION SUMMARY: P vs NP SEARCH]
-----------------------------------
... [Previous phases omitted for brevity] ...
10. MILLENNIUM SEARCH: ${millRes.diagnosis}.
11. GENERALIZATION: ${genRes.predictionAccuracy.toFixed(1)}% Accuracy.
12. UNIVERSALITY TEST (Massive Validation):
    - Samples: ${uniRes.samples} independent instances.
    - Average Accuracy: ${uniRes.avgAccuracy.toFixed(1)}%.
    - Consistency: ${uniRes.consistency.toFixed(1)}% of instances showed leakage.
    - Verdict: ${uniRes.verdict}.
    
    [DRAFT PROOF]:
    ${uniRes.proofDraft}

AGENT COUNCIL: We have concluded the Massive Validation phase.
The 'Topological Leak' phenomenon was tested across ${uniRes.samples} random instances.
Result: ${uniRes.verdict} with ${uniRes.avgAccuracy.toFixed(1)}% average accuracy.
Gemini, please review the final 'Proof Draft' generated above and provide your rigorous critique. Are we ready to publish?
`;
    
    setActivePhase(0);
    setAutoAnalysisPrompt(summaryReport);
    
    if (isMobile) {
        setTimeout(() => setActiveMobileTab('agents'), 500);
    }
  };

  const PhaseIndicator = ({ p, label, icon: Icon }: any) => {
    const isActive = activePhase === p;
    const isDone = activePhase === 0 && macroResults.length > 0 && p <= (universalityResult ? 12 : 11);
    
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
    <div className="flex flex-col h-[100dvh] md:grid md:grid-cols-12 bg-[#050505] text-zinc-300 overflow-hidden relative">
      
      {/* === COLUMN 1: CONTROL (Tab 1) === */}
      <div className={`${activeMobileTab === 'control' ? 'flex' : 'hidden'} md:flex col-span-3 border-r border-zinc-900 bg-[#08080a] flex-col z-20 h-full overflow-hidden`}>
        <div className="p-4 border-b border-zinc-900 pt-12 md:pt-4 shrink-0">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
             <h1 className="font-black text-zinc-100 tracking-tighter text-base">SAT_SOLVER_PRO</h1>
           </div>
           <p className="text-[10px] font-mono text-zinc-600 uppercase">Strategic Complexity Analyzer</p>
        </div>

        <div className="p-4 flex-grow flex flex-col gap-3 overflow-y-auto pb-24 md:pb-4 custom-scrollbar">
          <button 
            onClick={handleRunPipeline}
            disabled={activePhase !== 0}
            className={`w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all border flex flex-col items-center gap-2 shrink-0 ${
              activePhase !== 0 
               ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed animate-pulse'
               : 'bg-gradient-to-br from-indigo-600 to-purple-800 border-indigo-400 text-white shadow-lg active:scale-95'
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
            <PhaseIndicator p={6} label="Scaling Law" icon={TrendingUp} />
            <PhaseIndicator p={7} label="Stress Test (Wall)" icon={Skull} />
            <PhaseIndicator p={8} label="The Kill Shot" icon={Radiation} />
            <PhaseIndicator p={9} label="Complexity Map" icon={Mountain} />
            <PhaseIndicator p={10} label="Invariant Search" icon={Trophy} />
            <PhaseIndicator p={11} label="Generalization Test" icon={Globe} />
            <PhaseIndicator p={12} label="Massive Validation" icon={Scale} />
          </div>

          <div className="mt-auto p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg shrink-0">
             <div className="text-[9px] font-bold text-zinc-500 mb-2 uppercase flex items-center gap-1">
               <ClipboardCheck className="w-3 h-3" /> System Status
             </div>
             <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-600">ALPHA_PEAK</span>
                <span className="text-indigo-400 font-bold">{peakAlpha}</span>
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
        </div>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 z-10 pb-24 md:pb-6 min-h-0 custom-scrollbar">
          
          {/* Top Row Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Chart 1 */}
             <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 min-h-[200px] flex flex-col overflow-hidden">
               <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-4 flex items-center gap-2 shrink-0">
                 <GitMerge className="w-3 h-3" /> Transition Probability
               </h3>
               <div className="flex-grow min-h-0">
                 {showCharts && (
                   <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={macroResults} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="alpha" stroke="#3f3f46" tick={{fontSize: 8}} type="number" domain={[3, 6]} />
                        <YAxis stroke="#3f3f46" tick={{fontSize: 8}} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                        <Line type="stepAfter" dataKey="satisfiabilityRatio" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={!isMobile} />
                        <ReferenceLine x={peakAlpha} stroke="red" strokeDasharray="3 3" />
                      </LineChart>
                   </ResponsiveContainer>
                 )}
               </div>
             </div>

             {/* Chart 2 */}
             <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 min-h-[200px] flex flex-col overflow-hidden">
               <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-4 flex items-center gap-2 shrink-0">
                 <Flame className="w-3 h-3" /> Energy Descent
               </h3>
               <div className="flex-grow min-h-0">
                  {showCharts && (
                   <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={agentSteps} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis hide />
                        <YAxis stroke="#3f3f46" tick={{fontSize: 8}} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                        <Area type="monotone" dataKey="errors" stroke="#f43f5e" fill="url(#energyFill)" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                   </ResponsiveContainer>
                  )}
               </div>
             </div>
          </div>

          {/* New Scaling Chart (Full Width) with Stress Test Overlay */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 min-h-[220px] flex flex-col overflow-hidden relative">
             <div className="flex justify-between items-start mb-4">
               <h3 className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-2 shrink-0">
                 <TrendingUp className="w-3 h-3 text-emerald-500" /> Complexity Wall (Stress Test)
               </h3>
               {confirmationResult && (
                 <span className={`text-[9px] px-2 py-1 rounded border font-bold ${
                    confirmationResult.diagnosis === 'CONFIRMED EXPONENTIALITY' || confirmationResult.diagnosis === 'HIDDEN EXPONENTIALITY DETECTED'
                    ? 'bg-purple-900/20 text-purple-400 border-purple-800 animate-pulse' 
                    : 'bg-zinc-900/20 text-zinc-400 border-zinc-800'
                 }`}>
                    {confirmationResult.diagnosis === 'CONFIRMED EXPONENTIALITY' ? 'EXPONENTIALITY CONFIRMED' : 
                     confirmationResult.diagnosis === 'HIDDEN EXPONENTIALITY DETECTED' ? 'HIDDEN EXPONENTIAL' : 'ANOMALY'}
                 </span>
               )}
             </div>
             
             <div className="flex-grow min-h-0">
                {showCharts && (stressResult || scalingResult) && (
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ScatterChart margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                      <XAxis type="number" dataKey="n" name="Problem Size (n)" stroke="#3f3f46" tick={{fontSize: 8}} domain={['dataMin', 'dataMax']} />
                      <YAxis type="number" dataKey="avgSteps" name="Steps" stroke="#3f3f46" tick={{fontSize: 8}} domain={[0, 'auto']} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                      {/* Scaling Phase Points */}
                      {scalingResult && (
                          <Scatter name="Initial Scaling" data={scalingResult.points} fill="#10b981" line={{stroke: '#10b981', strokeWidth: 1}} shape="circle" />
                      )}
                      {/* Stress Test Points (Red) */}
                      {stressResult && (
                          <Scatter name="Stress Test" data={stressResult.points.filter(p => p.n > 35)} fill="#ef4444" line={{stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5'}} shape="cross" />
                      )}
                      {/* Final Confirmation Point (Purple) */}
                      {confirmationResult && (
                          <Scatter name="Kill Shot" data={[{n: confirmationResult.n, avgSteps: confirmationResult.steps}]} fill="#a855f7" line={{stroke: '#a855f7', strokeWidth: 2}} shape="star" />
                      )}
                    </ScatterChart>
                 </ResponsiveContainer>
                )}
                {!scalingResult && (
                    <div className="flex items-center justify-center h-full text-zinc-700 text-[10px] uppercase font-bold tracking-widest">
                        Awaiting Scaling Data...
                    </div>
                )}
             </div>
          </div>

          {/* COMPLEXITY TOPOGRAPHY CHART */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 min-h-[220px] flex flex-col overflow-hidden relative">
             <div className="flex justify-between items-start mb-4">
               <h3 className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-2 shrink-0">
                 <Mountain className="w-3 h-3 text-orange-500" /> Complexity Topography (The Mountain)
               </h3>
               {boundaryResult && (
                 <span className="text-[9px] px-2 py-1 rounded border font-bold bg-orange-900/20 text-orange-400 border-orange-800">
                    PEAK b = {boundaryResult.peakB.toFixed(4)}
                 </span>
               )}
             </div>
             
             <div className="flex-grow min-h-0">
                {showCharts && boundaryResult && (
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ComposedChart data={boundaryResult.points} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                      <XAxis type="number" dataKey="alpha" name="Alpha" stroke="#3f3f46" tick={{fontSize: 8}} domain={[2, 7]} />
                      <YAxis type="number" dataKey="branchingFactor" name="b" stroke="#3f3f46" tick={{fontSize: 8}} domain={[0.98, 'auto']} />
                      <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                      
                      {/* Color Zones Backgrounds - Approximated visually with distinct lines or custom logic if needed, here we use the line itself */}
                      <ReferenceLine y={1.0} stroke="#10b981" strokeDasharray="3 3" />
                      
                      <Line type="monotone" dataKey="branchingFactor" stroke="#f97316" strokeWidth={2} dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          const color = payload.zone === 'RED' ? '#ef4444' : payload.zone === 'YELLOW' ? '#eab308' : '#10b981';
                          return <circle cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
                      }} />
                    </ComposedChart>
                 </ResponsiveContainer>
                )}
                {!boundaryResult && (
                    <div className="flex items-center justify-center h-full text-zinc-700 text-[10px] uppercase font-bold tracking-widest">
                        Awaiting Boundary Scan...
                    </div>
                )}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Variance Diagnosis</p>
                <div className="text-xs font-mono font-bold truncate text-indigo-400">
                   {varianceResult?.diagnosis || "PENDING"}
                </div>
             </div>
             <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">Hysteresis Scan</p>
                <div className="text-xs font-mono font-bold truncate text-indigo-400">
                   {hysteresisResult?.diagnosis || "PENDING"}
                </div>
             </div>
             {/* Millennium Result Card */}
             {millenniumResult && (
                <div className="col-span-2 bg-gradient-to-r from-zinc-900 to-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Trophy className="w-16 h-16" /></div>
                    <p className="text-[9px] font-bold text-indigo-300 uppercase mb-2">Millennium Invariant Analysis</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-zinc-500 block">Invariant Size</span>
                            <span className="font-mono font-bold text-white">{millenniumResult.backboneSize} vars</span>
                        </div>
                        <div>
                            <span className="text-zinc-500 block">Pruning Impact</span>
                            <span className="font-mono font-bold text-emerald-400">-{millenniumResult.reductionPercentage.toFixed(1)}% complexity</span>
                        </div>
                    </div>
                </div>
             )}
             
             {/* Generalization Result Card */}
             {generalizationResult && (
                <div className="col-span-2 bg-gradient-to-r from-zinc-900 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Globe className="w-16 h-16" /></div>
                    <p className="text-[9px] font-bold text-emerald-300 uppercase mb-2">Topological Generalization Test</p>
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-zinc-400">Prediction Accuracy</span>
                        <span className={`font-mono font-bold ${generalizationResult.predictionAccuracy > 70 ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {generalizationResult.predictionAccuracy.toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-snug">
                        {generalizationResult.explanation}
                    </div>
                </div>
             )}
             
             {/* UNIVERSALITY RESULT CARD (FINAL) */}
             {universalityResult && (
                <div className={`col-span-2 border rounded-xl p-4 relative overflow-hidden ${
                    universalityResult.avgAccuracy > 80 
                    ? 'bg-gradient-to-r from-emerald-950 to-emerald-900/20 border-emerald-500' 
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Scale className="w-16 h-16" /></div>
                    <p className="text-[9px] font-bold uppercase mb-2 flex items-center gap-2">
                        <Scale className="w-3 h-3" /> Massive Validation (N={universalityResult.samples})
                    </p>
                    
                    <div className="mb-4">
                        <h3 className={`text-xl font-black tracking-tighter uppercase ${universalityResult.avgAccuracy > 80 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            {universalityResult.verdict}
                        </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div className="bg-black/20 p-2 rounded">
                            <span className="text-zinc-500 block text-[9px]">Avg Accuracy</span>
                            <span className="font-mono font-bold">{universalityResult.avgAccuracy.toFixed(1)}%</span>
                        </div>
                        <div className="bg-black/20 p-2 rounded">
                            <span className="text-zinc-500 block text-[9px]">Consistency</span>
                            <span className="font-mono font-bold">{universalityResult.consistency.toFixed(1)}%</span>
                        </div>
                        <div className="bg-black/20 p-2 rounded">
                            <span className="text-zinc-500 block text-[9px]">Min / Max</span>
                            <span className="font-mono font-bold">{Math.round(universalityResult.minAccuracy)}% - {Math.round(universalityResult.maxAccuracy)}%</span>
                        </div>
                    </div>
                    
                    <div className="p-3 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-zinc-400 leading-relaxed italic">
                        {universalityResult.proofDraft}
                    </div>
                </div>
             )}
          </div>

        </div>
      </div>

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