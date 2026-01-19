import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SimulationDataPoint, AgentRole } from '../types';
import { generateAgentResponse } from '../lib/geminiClient';
import { AGENTS } from '../lib/agentRegistry';
import MessageBubble from './chat/MessageBubble';
import { Send, AlertCircle, BrainCircuit, Terminal, ShieldAlert, Copy, FileText, Check } from 'lucide-react';

interface ResearchWorkspaceProps {
  apiKey: string;
  simulationData: SimulationDataPoint[];
  autoAnalysisPrompt?: string | null; // New prop for auto-trigger
  onAutoAnalysisComplete?: () => void; // Callback to clear trigger
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
        content: "I am monitoring the pipeline. Once the Complexity Radar activates, we can discuss the implications of the frozen backbone.",
        timestamp: Date.now()
      }]);
    }
  }, []);

  // Handle Auto Analysis Trigger
  useEffect(() => {
    if (autoAnalysisPrompt && apiKey && !isTyping) {
      handleSend(autoAnalysisPrompt);
      if (onAutoAnalysisComplete) onAutoAnalysisComplete();
    }
  }, [autoAnalysisPrompt, apiKey]);

  // Auto-scroll
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
      const responseText = await generateAgentResponse(
        apiKey,
        activeAgent,
        messages, // Pass full history
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
      setMessages(prev => [...prev, {
        role: 'model',
        agentId: activeAgent,
        content: `Error: ${error.message || 'Connection failed.'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyProtocol = () => {
    const protocolText = messages.map(m => {
        const sender = m.role === 'user' ? 'USER' : (m.agentId ? AGENTS[m.agentId].name.toUpperCase() : 'AI');
        return `[${sender}]:\n${m.content}\n-----------------------------------`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(protocolText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Mini Toolbar for Agent Switching & Tools */}
      <div className="p-3 border-b border-zinc-900 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {(Object.values(AGENTS) as any[]).map((agent) => {
                const isActive = activeAgent === agent.id;
                const Icon = agent.id === 'theorist' ? BrainCircuit : agent.id === 'empiricist' ? Terminal : ShieldAlert;
                return (
                <button
                    key={agent.id}
                    onClick={() => setActiveAgent(agent.id)}
                    className={`p-2 rounded-lg transition-all border ${
                    isActive 
                        ? `bg-zinc-800 ${agent.color} border-zinc-700` 
                        : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-400'
                    }`}
                    title={agent.name}
                >
                    <Icon className="w-4 h-4" />
                </button>
                );
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <button
                onClick={handleCopyProtocol}
                className={`p-2 rounded-lg border flex items-center gap-1 transition-all ${
                    copied 
                    ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
                title="Copy Full Protocol"
            >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase hidden sm:inline">{copied ? 'COPIED' : 'COPY ALL'}</span>
            </button>
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {!apiKey && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
            <ShieldAlert className="w-8 h-8 mb-2" />
            <p className="text-xs text-center">Auth Required</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs p-2 animate-pulse">
            <span className={`w-1.5 h-1.5 rounded-full ${AGENTS[activeAgent].color.replace('text-', 'bg-')}`}></span>
            Thinking...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#08080a] border-t border-zinc-900">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Query ${AGENTS[activeAgent].name}...`}
            disabled={!apiKey || isTyping}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-3 pr-10 py-3 focus:border-indigo-900 focus:bg-zinc-900 outline-none font-mono placeholder:text-zinc-700 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!apiKey || isTyping}
            className="absolute right-2 top-2 p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchWorkspace;