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
  console.log(`[GeminiClient] Initializing request for agent: ${agentId}`);

  if (!apiKey) {
      console.error("[GeminiClient] Error: No API Key provided");
      throw new Error("API Key is missing. Please check settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const agent = AGENTS[agentId];

  // Prepare context from simulation
  let dataContext = "";
  if (simulationData.length > 0) {
    const peak = simulationData.reduce((prev, current) => (prev.avgSteps > current.avgSteps) ? prev : current);
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
  const contents = history.map(m => ({
    role: m.role,
    parts: [{ text: m.agentId ? `[Speaking as ${AGENTS[m.agentId].name}]: ${m.content}` : m.content }]
  }));

  // Add current input
  contents.push({
    role: 'user',
    parts: [{ text: currentInput }]
  });

  console.log("[GeminiClient] Sending payload to Gemini API...");

  // Retry logic wrapper
  let attempt = 0;
  const maxRetries = 2;
  const timeoutDuration = 90000; // 90 seconds

  while (attempt <= maxRetries) {
    try {
      // Race between the actual API call and a timeout promise
      const apiCall = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: fullSystemInstruction,
        }
      });

      const timeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Request timed out (${timeoutDuration/1000}s). Network too slow.`)), timeoutDuration)
      );

      const response = await Promise.race([apiCall, timeout]);
      
      console.log("[GeminiClient] Response received successfully.");

      if (!response.text) {
          console.warn("[GeminiClient] Warning: Empty response text received.");
          throw new Error("Model returned empty response.");
      }

      return response.text;

    } catch (error: any) {
      console.error(`[GeminiClient] Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries) {
        attempt++;
        const backoff = attempt * 2000; // 2s, 4s wait
        console.log(`[GeminiClient] Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        // Final attempt failed
        throw new Error(error.message || "Unknown connection error after multiple attempts.");
      }
    }
  }

  throw new Error("Unreachable code reached in geminiClient");
};