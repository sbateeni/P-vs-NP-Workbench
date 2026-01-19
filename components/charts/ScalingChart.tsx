
import React from 'react';
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip, Scatter } from 'recharts';
import { ScalingResult, StressTestResult, ConfirmationResult } from '../../types';
import { TrendingUp } from 'lucide-react';

interface ScalingChartProps {
  scalingResult: ScalingResult | null;
  stressResult: StressTestResult | null;
  confirmationResult: ConfirmationResult | null;
  show: boolean;
}

export const ScalingChart: React.FC<ScalingChartProps> = ({ scalingResult, stressResult, confirmationResult, show }) => {
  return (
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
        {show && (stressResult || scalingResult) && (
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
  );
};
