import React from 'react';
import { ChatMessage } from '../../types';
import { AGENTS } from '../../lib/agentRegistry';
import { User, Bot, BrainCircuit, ShieldAlert, Terminal } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

const IconMap: Record<string, any> = {
  BrainCircuit,
  ShieldAlert,
  Terminal
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const agent = message.agentId ? AGENTS[message.agentId] : null;
  
  // Dynamic icon selection
  const IconComponent = agent ? IconMap[agent.icon] || Bot : User;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${
          isUser 
            ? 'bg-blue-600 border-blue-500' 
            : 'bg-zinc-800 border-zinc-700'
        }`}>
          <IconComponent className={`w-4 h-4 ${isUser ? 'text-white' : agent?.color || 'text-zinc-400'}`} />
        </div>

        {/* Content */}
        <div className="flex flex-col">
          {!isUser && agent && (
            <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ml-1 ${agent.color}`}>
              {agent.name}
            </span>
          )}
          
          <div className={`p-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-tl-none font-mono'
          }`}>
            {message.content}
          </div>
          
          <span className="text-[9px] text-zinc-600 mt-0.5 px-1 self-end opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;