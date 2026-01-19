
import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Line } from 'recharts';
import { BoundaryMapResult } from '../../types';
import { Mountain } from 'lucide-react';

interface TopographyChartProps {
  boundaryResult: BoundaryMapResult | null;
  show: boolean;
}

export const TopographyChart: React.FC<TopographyChartProps> = ({ boundaryResult, show }) => {
  return (
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
        {show && boundaryResult && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart data={boundaryResult.points} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis type="number" dataKey="alpha" name="Alpha" stroke="#3f3f46" tick={{fontSize: 8}} domain={[2, 7]} />
              <YAxis type="number" dataKey="branchingFactor" name="b" stroke="#3f3f46" tick={{fontSize: 8}} domain={[0.98, 'auto']} />
              <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
              
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
  );
};
