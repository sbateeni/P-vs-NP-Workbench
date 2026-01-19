
import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine } from 'recharts';
import { SimulationDataPoint } from '../../types';
import { GitMerge } from 'lucide-react';

interface TransitionChartProps {
  data: SimulationDataPoint[];
  peakAlpha: number;
  show: boolean;
  isMobile: boolean;
}

export const TransitionChart: React.FC<TransitionChartProps> = ({ data, peakAlpha, show, isMobile }) => {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 min-h-[200px] flex flex-col overflow-hidden">
      <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-4 flex items-center gap-2 shrink-0">
        <GitMerge className="w-3 h-3" /> Transition Probability
      </h3>
      <div className="flex-grow min-h-0">
        {show && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
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
  );
};
