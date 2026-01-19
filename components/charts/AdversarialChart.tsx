
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { AdversarialResult } from '../../types';
import { ShieldAlert } from 'lucide-react';

interface AdversarialChartProps {
  result: AdversarialResult | null;
  show: boolean;
}

export const AdversarialChart: React.FC<AdversarialChartProps> = ({ result, show }) => {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 min-h-[200px] flex flex-col overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-3 h-3 text-red-500" /> Adversarial Scaling (N up to 250)
        </h3>
        {result && (
          <span className={`text-[9px] px-2 py-1 rounded border font-bold ${
            result.diagnosis.includes('Winner') 
            ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' 
            : 'bg-red-900/20 text-red-400 border-red-800'
          }`}>
            Slope: {result.slope.toFixed(4)}
          </span>
        )}
      </div>

      <div className="flex-grow min-h-0">
        {show && result ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={result.scanPoints} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis dataKey="n" stroke="#3f3f46" tick={{fontSize: 8}} type="number" domain={['dataMin', 'dataMax']} />
              <YAxis stroke="#3f3f46" tick={{fontSize: 8}} domain={[80, 100]} />
              <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
              <Area type="monotone" dataKey="accuracy" stroke="#10b981" fill="url(#accuracyFill)" strokeWidth={2} />
              <ReferenceLine y={98} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopRight',  value: '98% Threshold', fill: '#ef4444', fontSize: 9 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-zinc-700 text-[10px] uppercase font-bold tracking-widest">
                Awaiting Stress Test...
            </div>
        )}
      </div>
    </div>
  );
};
