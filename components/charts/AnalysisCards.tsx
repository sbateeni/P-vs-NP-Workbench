
import React from 'react';
import { VarianceAnalysisResult, HysteresisResult, MillenniumSearchResult, GeneralizationResult, UniversalityResult } from '../../types';
import { Trophy, Globe, Scale } from 'lucide-react';

interface AnalysisCardsProps {
  varianceResult: VarianceAnalysisResult | null;
  hysteresisResult: HysteresisResult | null;
  millenniumResult: MillenniumSearchResult | null;
  generalizationResult: GeneralizationResult | null;
  universalityResult: UniversalityResult | null;
}

export const AnalysisCards: React.FC<AnalysisCardsProps> = ({ 
  varianceResult, hysteresisResult, millenniumResult, generalizationResult, universalityResult 
}) => {
  return (
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
  );
};
