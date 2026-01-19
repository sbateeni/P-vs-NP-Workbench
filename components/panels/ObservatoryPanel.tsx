
import React from 'react';
import { Network } from 'lucide-react';
import { SimulationDataPoint, AgentStep, ScalingResult, StressTestResult, ConfirmationResult, BoundaryMapResult, VarianceAnalysisResult, HysteresisResult, MillenniumSearchResult, GeneralizationResult, UniversalityResult, AdversarialResult } from '../../types';
import { TransitionChart } from '../charts/TransitionChart';
import { EnergyChart } from '../charts/EnergyChart';
import { ScalingChart } from '../charts/ScalingChart';
import { TopographyChart } from '../charts/TopographyChart';
import { AdversarialChart } from '../charts/AdversarialChart';
import { AnalysisCards } from '../charts/AnalysisCards';

interface ObservatoryPanelProps {
  macroResults: SimulationDataPoint[];
  agentSteps: AgentStep[];
  peakAlpha: number;
  scalingResult: ScalingResult | null;
  stressResult: StressTestResult | null;
  confirmationResult: ConfirmationResult | null;
  boundaryResult: BoundaryMapResult | null;
  varianceResult: VarianceAnalysisResult | null;
  hysteresisResult: HysteresisResult | null;
  millenniumResult: MillenniumSearchResult | null;
  generalizationResult: GeneralizationResult | null;
  universalityResult: UniversalityResult | null;
  adversarialResult: AdversarialResult | null;
  isVisible: boolean;
  isMobile: boolean;
  showCharts: boolean;
}

export const ObservatoryPanel: React.FC<ObservatoryPanelProps> = ({
  macroResults,
  agentSteps,
  peakAlpha,
  scalingResult,
  stressResult,
  confirmationResult,
  boundaryResult,
  varianceResult,
  hysteresisResult,
  millenniumResult,
  generalizationResult,
  universalityResult,
  adversarialResult,
  isVisible,
  isMobile,
  showCharts
}) => {
  return (
    <div className={`${isVisible ? 'flex' : 'hidden'} md:flex col-span-6 bg-[#050505] flex-col relative overflow-hidden h-full`}>
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
            <TransitionChart 
                data={macroResults} 
                peakAlpha={peakAlpha} 
                show={showCharts} 
                isMobile={isMobile} 
            />
            <EnergyChart 
                data={agentSteps} 
                show={showCharts} 
            />
        </div>

        <ScalingChart 
            scalingResult={scalingResult} 
            stressResult={stressResult} 
            confirmationResult={confirmationResult} 
            show={showCharts} 
        />

        <TopographyChart 
            boundaryResult={boundaryResult} 
            show={showCharts} 
        />

        <AdversarialChart
            result={adversarialResult}
            show={showCharts}
        />

        <AnalysisCards 
            varianceResult={varianceResult}
            hysteresisResult={hysteresisResult}
            millenniumResult={millenniumResult}
            generalizationResult={generalizationResult}
            universalityResult={universalityResult}
        />
      </div>
    </div>
  );
};
