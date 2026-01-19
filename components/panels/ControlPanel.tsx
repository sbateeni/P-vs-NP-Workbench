
import React from 'react';
import { RotateCcw, Radio, Activity, GitMerge, Flame, Microscope, Zap, Bone, TrendingUp, Skull, Radiation, Mountain, Trophy, Globe, Scale, ClipboardCheck, ShieldAlert } from 'lucide-react';

interface ControlPanelProps {
  activePhase: number;
  completedPhase: number; // Highest completed phase index
  peakAlpha: number;
  onRun: () => void;
  isVisible: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  activePhase, 
  completedPhase, 
  peakAlpha, 
  onRun, 
  isVisible 
}) => {
  return (
    <div className={`${isVisible ? 'flex' : 'hidden'} md:flex col-span-3 border-r border-zinc-900 bg-[#08080a] flex-col z-20 h-full overflow-hidden`}>
      <div className="p-4 border-b border-zinc-900 pt-12 md:pt-4 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
          <h1 className="font-black text-zinc-100 tracking-tighter text-base">SAT_SOLVER_PRO</h1>
        </div>
        <p className="text-[10px] font-mono text-zinc-600 uppercase">Strategic Complexity Analyzer</p>
      </div>

      <div className="p-4 flex-grow flex flex-col gap-3 overflow-y-auto pb-24 md:pb-4 custom-scrollbar">
        <button 
          onClick={onRun}
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
          <PhaseIndicator p={1} activePhase={activePhase} completedPhase={completedPhase} label="Macro Curve Scan" icon={GitMerge} />
          <PhaseIndicator p={2} activePhase={activePhase} completedPhase={completedPhase} label="Agent Dynamics" icon={Flame} />
          <PhaseIndicator p={3} activePhase={activePhase} completedPhase={completedPhase} label="Variance Probe" icon={Microscope} />
          <PhaseIndicator p={4} activePhase={activePhase} completedPhase={completedPhase} label="Hysteresis Probe" icon={Zap} />
          <PhaseIndicator p={5} activePhase={activePhase} completedPhase={completedPhase} label="Structural Autopsy" icon={Bone} />
          <PhaseIndicator p={6} activePhase={activePhase} completedPhase={completedPhase} label="Scaling Law" icon={TrendingUp} />
          <PhaseIndicator p={7} activePhase={activePhase} completedPhase={completedPhase} label="Stress Test (Wall)" icon={Skull} />
          <PhaseIndicator p={8} activePhase={activePhase} completedPhase={completedPhase} label="The Kill Shot" icon={Radiation} />
          <PhaseIndicator p={9} activePhase={activePhase} completedPhase={completedPhase} label="Complexity Map" icon={Mountain} />
          <PhaseIndicator p={10} activePhase={activePhase} completedPhase={completedPhase} label="Invariant Search" icon={Trophy} />
          <PhaseIndicator p={11} activePhase={activePhase} completedPhase={completedPhase} label="Generalization Test" icon={Globe} />
          <PhaseIndicator p={12} activePhase={activePhase} completedPhase={completedPhase} label="Massive Validation" icon={Scale} />
          <PhaseIndicator p={13} activePhase={activePhase} completedPhase={completedPhase} label="Adversarial Scaling" icon={ShieldAlert} />
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
  );
};

const PhaseIndicator = ({ p, activePhase, completedPhase, label, icon: Icon }: any) => {
  const isActive = activePhase === p;
  const isDone = activePhase === 0 && p <= completedPhase;
  
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
