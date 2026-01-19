
import React from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { AgentStep } from '../../types';
import { Flame } from 'lucide-react';

interface EnergyChartProps {
  data: AgentStep[];
  show: boolean;
}

export const EnergyChart: React.FC<EnergyChartProps> = ({ data, show }) => {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 min-h-[200px] flex flex-col overflow-hidden">
      <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-4 flex items-center gap-2 shrink-0">
        <Flame className="w-3 h-3" /> Energy Descent
      </h3>
      <div className="flex-grow min-h-0">
        {show && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
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
  );
};
