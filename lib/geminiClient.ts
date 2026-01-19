import { GoogleGenAI } from "@google/genai";
import { ChatMessage, SimulationDataPoint, AgentRole } from '../types';
import { AGENTS } from './agentRegistry';

export const generateAgentResponse = async (
  apiKey: string,
  agentId: AgentRole,
  history: ChatMessage[],
  currentInput: string,
  simulationData: SimulationDataPoint[]
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const agent = AGENTS[agentId];

  // Prepare context from simulation
  let dataContext = "";
  if (simulationData.length > 0) {
    const peak = simulationData.reduce((prev, current) => (prev.avgSteps > current.avgSteps) ? prev : current);
    // Sample a few points to give the model a trend
    const samplePoints = simulationData
      .filter((_, i) => i % Math.max(1, Math.floor(simulationData.length / 5)) === 0)
      .map(p => `α=${p.alpha}: Steps=${p.avgSteps}, Sat=${p.satisfiabilityRatio.toFixed(2)}`)
      .join('\n');

    dataContext = `
      [LIVE SIMULATION DATA CONTEXT]
      - Total Data Points: ${simulationData.length}
      - Observed Phase Transition Peak: Max Steps=${peak.maxSteps} at α=${peak.alpha}
      - Critical Region: The computational cost spikes around α=${peak.alpha}.
      - Sample Data:\n${samplePoints}
    `;
  }

  // Construct System Prompt
  const fullSystemInstruction = `
    ${agent.systemInstruction}
    
    CONTEXT:
    You are participating in a collaborative research workbench.
    The user is leading the investigation.
    Access to live simulation data is provided below.
    ${dataContext}
  `;

  // Transform history for the API
  // We include previous messages from ALL agents to maintain the "Meeting Room" context
  const contents = history.map(m => ({
    role: m.role,
    parts: [{ text: m.agentId ? `[Speaking as ${AGENTS[m.agentId].name}]: ${m.content}` : m.content }]
  }));

  // Add current input
  contents.push({
    role: 'user',
    parts: [{ text: currentInput }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: fullSystemInstruction,
    }
  });

  return response.text || "";
};