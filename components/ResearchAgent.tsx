import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, SimulationDataPoint } from '../types';
import { Send, Bot, User, Terminal } from 'lucide-react';

interface ResearchAgentProps {
  apiKey: string;
  simulationData: SimulationDataPoint[];
}

const ResearchAgent: React.FC<ResearchAgentProps> = ({ apiKey, simulationData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial System Prompt
  const SYSTEM_INSTRUCTION = `
    You are a world-class mathematician and theoretical computer scientist specializing in Computational Complexity Theory. 
    Your goal is to investigate the P vs NP problem, specifically focusing on Phase Transitions in 3-SAT.
    
    Role Guidelines:
    1. Be rigorous, formal, and self-critical. 
    2. Use LaTeX format for math (using single $ for inline).
    3. When you propose an algorithm, immediately try to find a counter-example (Red Teaming).
    4. You are analyzing data from a client-side DPLL simulation provided in the context.
    5. If asked to write code, prefer Python for theoretical explanation, but provide JavaScript/TypeScript if the user wants to run it in this browser environment.
  `;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Add initial greeting based on simulation data status
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        content: "I am ready to analyze the 3-SAT phase transition data. Please run the simulation first, or ask me to propose a hypothesis about the Critical Region (alpha approx 4.26).",
        timestamp: Date.now()
      }]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Construct context from simulation data
      let dataContext = "";
      if (simulationData.length > 0) {
        const peak = simulationData.reduce((prev, current) => (prev.avgSteps > current.avgSteps) ? prev : current);
        dataContext = `
          [Current Simulation Context]
          Data points: ${simulationData.length}
          Observed Peak Complexity (Max Steps): ${peak.maxSteps} at Alpha: ${peak.alpha}
          Critical Region Observation: The computational cost spikes around alpha=${peak.alpha}.
        `;
      }

      // Construct contents from history + new message with context
      const contents = messages.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // Add the data context to the very last message for relevance
      contents.push({
        role: 'user',
        parts: [{ text: `${input}\n\n${dataContext}` }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      const responseText = response.text || "";

      setMessages(prev => [...prev, {
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      }]);

    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: `Error: ${error.message || 'Failed to connect to Gemini API'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-950 p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <span className="font-mono text-sm font-bold text-zinc-300">Complexity_Oracle_v2.5</span>
        </div>
        {!apiKey && <span className="text-xs text-red-400">API Key Required</span>}
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-blue-900/30 text-blue-100 border border-blue-800' 
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono'
              }`}
            >
              {msg.role === 'model' && <Terminal className="w-3 h-3 text-zinc-500 mb-2" />}
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-400 text-xs px-3 py-2 rounded-lg border border-zinc-700 animate-pulse">
              Generating hypothesis...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={apiKey ? "Ask about heuristics, gadgets, or proofs..." : "Enter Gemini API Key in Settings first"}
            disabled={!apiKey || isTyping}
            className="flex-grow bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-3 py-2 focus:border-indigo-500 outline-none font-mono placeholder:text-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={!apiKey || isTyping}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded px-4 py-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchAgent;