
// 3-SAT Types
export type Literal = number; // Positive for x_i, negative for NOT x_i
export type Clause = Literal[];
export type Formula = Clause[];

export interface SatInstance {
  id: string;
  n: number; // Number of variables
  m: number; // Number of clauses
  alpha: number; // Ratio m/n
  formula: Formula;
}

export interface SolverResult {
  instanceId: string;
  satisfiable: boolean;
  steps: number; // Metric for complexity (recursive calls)
  timeMs: number;
  alpha: number;
}

export interface SimulationDataPoint {
  alpha: number;
  avgSteps: number;
  maxSteps: number;
  satisfiabilityRatio: number; // 0.0 to 1.0
}

// New Types for Agent Simulation (Micro-View)
export interface AgentStep {
  step: number;
  errors: number;
  bestErrors: number;
  flippedVar: number | null;
  action: string;
  temperature: number;
  accepted: boolean;
}

// New Type for Variance Analysis
export interface VarianceAnalysisResult {
  energyHistory: { step: number; energy: number }[];
  meanEnergy: number;
  minEnergy: number; // Deepest point reached
  variance: number;
  diagnosis: string;
  alpha: number;
  n: number;
}

// New Type for Hysteresis Probe
export interface HysteresisResult {
  alpha: number;
  fast: { steps: number; success: boolean };
  slow: { steps: number; success: boolean; rate: number };
  diagnosis: string;
  isDeepScan: boolean;
}

// New Type for Phase 5: Structural Autopsy & Backbone Scan
export interface StructuralPoint {
  alpha: number;
  rigidity: number; // 0.0 - 1.0
  energy: number;
}

export interface StructuralResult {
  profile: StructuralPoint[]; // The curve data
  shatteredPoint: number | null; // Alpha where rigidity crosses 0.5
  ultraSlowCheck: {
    alpha: number;
    success: boolean;
    steps: number;
  } | null;
  diagnosis: 'LIQUID' | 'GLASSY' | 'SHATTERED';
  explanation: string;
}

export interface AutopsySnapshot {
  alpha: number;
  groundStateEnergy: number;
  backboneRigidity: number;
  frozenVarsCount: number;
  totalVars: number;
  diagnosis: 'STRUCTURAL' | 'ALGORITHMIC' | 'SOLVABLE';
  explanation: string;
}

export enum AppTab {
  SIMULATION = 'SIMULATION',
  ANALYSIS = 'ANALYSIS',
  PROOF = 'PROOF',
}

export type AgentRole = 'theorist' | 'empiricist' | 'skeptic';

export interface AgentPersona {
  id: AgentRole;
  name: string;
  title: string;
  systemInstruction: string;
  icon: string; // Icon name from lucide-react
  color: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  agentId?: AgentRole; // Track which agent sent the message
  content: string;
  timestamp: number;
}
