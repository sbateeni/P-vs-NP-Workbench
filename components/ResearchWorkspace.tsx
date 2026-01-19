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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null); // 'chat' | 'report' | null
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        agentId: 'theorist',
        content: "Greetings. I am ready to formalize our hypothesis regarding the Phase Transition. Shall we begin by analyzing the Critical Region behavior?",
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

  // --- Copy Logic ---
  const handleCopyChat = () => {
    const chatText = messages.map(m => {
      const speaker = m.role === 'user' ? 'User' : (m.agentId ? AGENTS[m.agentId].name : 'AI');
      const time = new Date(m.timestamp).toLocaleTimeString();
      return `[${time}] ${speaker}:\n${m.content}\n`;
    }).join('\n----------------------------------------\n');

    navigator.clipboard.writeText(chatText);
    showFeedback('chat');
  };

  const handleCopyReport = () => {
    // Note: Ideally we would get full probe results passed down as props, 
    // but the Chat Log itself contains the analysis of those results, which is often more valuable.
    // The Simulation Panel has its own dedicated "Copy Scientific Report" button for the raw data.
    // This report focuses on the qualitative research findings.
    
    const peak = simulationData.length > 0 
      ? simulationData.reduce((prev, current) => (prev.avgSteps > current.avgSteps) ? prev : current) 
      : null;

    const reportHeader = `
P VS NP WORKBENCH - QUALITATIVE RESEARCH SESSION
================================================
Date: ${new Date().toLocaleString()}

1. SIMULATION CONTEXT SUMMARY
-----------------------------
Total Data Points: ${simulationData.length}
${peak ? `Observed Phase Transition Peak:
  - Alpha (m/n): ${peak.alpha}
  - Max Steps: ${peak.maxSteps}
  - Satisfiability Ratio: ${peak.satisfiabilityRatio.toFixed(2)}` : 'No simulation data available.'}
(Note: For full raw data (Variance/Hysteresis), use the Report button in the Simulation Panel.)

2. RESEARCH CONVERSATION LOG
----------------------------
`;

    const chatLog = messages.map(m => {
      const speaker = m.role === 'user' ? 'User' : (m.agentId ? AGENTS[m.agentId].name : 'AI');
      return `### ${speaker}\n${m.content}`;
    }).join('\n\n');

    const fullReport = reportHeader + chatLog;
    navigator.clipboard.writeText(fullReport);
    showFeedback('report');
  };

  const showFeedback = (type: string) => {
    setCopyFeedback(type);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
      {/* Header Toolbar */}
      <div className="bg-zinc-950 p-2 border-b border-zinc-800 flex items-center justify-between gap-2">
        {/* Agent Selector (Left) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-grow mask-fade-right">
          {(Object.values(AGENTS) as any[]).map((agent) => {
            const isActive = activeAgent === agent.id;
            const Icon = agent.id === 'theorist' ? BrainCircuit : agent.id === 'empiricist' ? Terminal : ShieldAlert;
            
            return (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                  isActive 
                    ? `bg-zinc-800 ${agent.color} border-zinc-600` 
                    : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900 hover:text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span>{agent.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 flex-shrink-0">
          <button
            onClick={handleCopyChat}
            className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors relative group"
            title="Copy Chat History"
          >
            {copyFeedback === 'chat' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium border border-zinc-700 transition-colors"
            title="Copy Qualitative Report"
          >
            {copyFeedback === 'report' ? <Check className="w-3 h-3 text-green-500" /> : <FileText className="w-3 h-3" />}
            <span>{copyFeedback === 'report' ? 'Copied!' : 'Transcript'}</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 bg-[#0c0c0e]" ref={scrollRef}>
        {!apiKey && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p>API Key required to consult agents</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs p-2 animate-pulse">
            <span className={`w-2 h-2 rounded-full ${AGENTS[activeAgent].color.replace('text-', 'bg-')}`}></span>
            {AGENTS[activeAgent].name} is thinking...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask ${AGENTS[activeAgent].name}...`}
            disabled={!apiKey || isTyping}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl pl-4 pr-12 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono placeholder:text-zinc-600 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!apiKey || isTyping}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-zinc-600 mt-2 flex justify-between px-1">
           <span>Context: {simulationData.length} simulation points loaded</span>
           <span>Model: gemini-3-flash-preview</span>
        </div>
      </div>
    </div>
  );
};

export default ResearchWorkspace;