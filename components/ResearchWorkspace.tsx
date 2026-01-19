import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SimulationDataPoint, AgentRole } from '../types';
import { generateAgentResponse } from '../lib/geminiClient';
import { AGENTS } from '../lib/agentRegistry';
import MessageBubble from './chat/MessageBubble';
import { Send, BrainCircuit, Terminal, ShieldAlert, Copy, Check, Info, Loader2 } from 'lucide-react';

interface ResearchWorkspaceProps {
  apiKey: string;
  simulationData: SimulationDataPoint[];
  autoAnalysisPrompt?: string | null;
  onAutoAnalysisComplete?: () => void;
}

const ResearchWorkspace: React.FC<ResearchWorkspaceProps> = ({ 
  apiKey, 
  simulationData, 
  autoAnalysisPrompt,
  onAutoAnalysisComplete
}) => {
  const [activeAgent, setActiveAgent] = useState<AgentRole>('theorist');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        agentId: 'theorist',
        content: "Pipeline monitoring active. I am ready to process the phase transition data once the protocol begins.",
        timestamp: Date.now()
      }]);
    }
  }, []);

  // Handle Auto Analysis Trigger from SimulationPanel
  useEffect(() => {
    if (autoAnalysisPrompt && apiKey && !isTyping) {
      handleSend(autoAnalysisPrompt);
      if (onAutoAnalysisComplete) onAutoAnalysisComplete();
    }
  }, [autoAnalysisPrompt, apiKey]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !apiKey) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      console.log(`[Workspace] Triggering ${activeAgent}...`);
      
      const responseText = await generateAgentResponse(
        apiKey,
        activeAgent,
        messages, 
        textToSend,
        simulationData
      );

      const botMsg: ChatMessage = {
        role: 'model',
        agentId: activeAgent,
        content: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("[Workspace] Error caught in UI:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        agentId: activeAgent,
        content: `SYSTEM_ALERT: ${error.message || 'Transmission interrupted.'}`,
        timestamp: Date.now()
      }]);
    } finally {
      // Ensure we always stop the loading indicator, even if it crashed
      setIsTyping(false);
    }
  };

  const handleCopyProtocol = () => {
    // Generate full data dump + chat history
    let report = `[P vs NP WORKBENCH - FULL RESEARCH PROTOCOL]\n`;
    report += `Timestamp: ${new Date().toLocaleString()}\n`;
    report += `-------------------------------------------\n\n`;
    
    report += `[SIMULATION DATA SUMMARY]\n`;
    if (simulationData.length > 0) {
        simulationData.forEach(p => {
            report += `α=${p.alpha.toFixed(2)} | AvgSteps=${p.avgSteps} | SatRatio=${p.satisfiabilityRatio.toFixed(2)}\n`;
        });
    } else {
        report += `No simulation data recorded.\n`;
    }
    report += `\n-------------------------------------------\n\n`;

    report += `[AGENT CONVERSATION LOG]\n`;
    messages.forEach(m => {
        const sender = m.role === 'user' ? 'COMMANDER' : (m.agentId ? AGENTS[m.agentId].name.toUpperCase() : 'ORACLE');
        report += `[${sender}]:\n${m.content}\n\n`;
    });
    
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Agent Selector Toolbar */}
      <div className="p-3 border-b border-zinc-900 flex items-center justify-between gap-2 shrink-0 bg-[#08080a]/50 backdrop-blur-md">
          <div className="flex gap-2">
            {(Object.values(AGENTS) as any[]).map((agent) => {
                const isActive = activeAgent === agent.id;
                const Icon = agent.id === 'theorist' ? BrainCircuit : agent.id === 'empiricist' ? Terminal : ShieldAlert;
                return (
                <button
                    key={agent.id}
                    onClick={() => setActiveAgent(agent.id)}
                    className={`p-2.5 rounded-lg transition-all border ${
                    isActive 
                        ? `bg-zinc-800/80 ${agent.color} border-zinc-700 shadow-sm` 
                        : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-400'
                    }`}
                    title={agent.name}
                >
                    <Icon className="w-4 h-4" />
                </button>
                );
            })}
          </div>
          
          <button
              onClick={handleCopyProtocol}
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-all active:scale-95 ${
                  copied 
                  ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
          >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-black uppercase tracking-tighter">Copy Protocol</span>
          </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5 custom-scrollbar bg-black/10" ref={scrollRef}>
        {!apiKey && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-700 animate-pulse">
             <Info className="w-10 h-10 mb-2 opacity-20" />
             <p className="text-[10px] uppercase font-bold tracking-widest">Authentication Required</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest pl-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Processing Query...</span>
          </div>
        )}
      </div>

      {/* Persistent Input Bar */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Instruct ${AGENTS[activeAgent].name}...`}
            disabled={!apiKey || isTyping}
            className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 text-xs rounded-xl pl-4 pr-12 py-4 focus:border-indigo-500 focus:bg-zinc-900 outline-none font-mono placeholder:text-zinc-700 transition-all shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={!apiKey || isTyping || !input.trim()}
            className={`absolute right-3 top-3.5 p-1.5 rounded-lg transition-all ${
              !input.trim() ? 'text-zinc-800' : 'text-indigo-400 bg-indigo-400/10'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchWorkspace;