
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

// Phase 6: Scaling Analysis
export interface ScalingPoint {
  n: number;
  avgSteps: number;
}

export interface ScalingResult {
  points: ScalingPoint[];
  exponentialR2: number; // Fit for y = a * e^(bx)
  polynomialR2: number; // Fit for y = a * x^b
  diagnosis: 'EXPONENTIAL (NP-Hard)' | 'POLYNOMIAL (P)';
  growthFactor: number; // The 'b' in e^(bx)
}

// Phase 7: Deep Scaling Stress Test
export interface StressTestResult {
  points: ScalingPoint[];
  divergence: number; // Difference between Exp prediction and Poly prediction at N=max
  diagnosis: string;
  isExponentialWallConfirmed: boolean;
}

// Phase 8: Exponential Confirmation (The Kill Shot)
export interface ConfirmationResult {
  n: number;
  steps: number;
  limit: number;
  diagnosis: 'CONFIRMED EXPONENTIALITY' | 'HIDDEN EXPONENTIALITY DETECTED' | 'POLYNOMIAL ANOMALY' | 'INCONCLUSIVE';
  explanation: string;
  branchingFactor?: number; // b_eff
  projectionN250?: number; // Predicted steps for N=250
}

// Phase 9: Complexity Boundary Mapping
export interface BoundaryPoint {
  alpha: number;
  steps: number;
  branchingFactor: number; // b
  zone: 'GREEN' | 'YELLOW' | 'RED'; // Green (Easy), Yellow (Transition), Red (Hard)
}

export interface BoundaryMapResult {
  n: number;
  points: BoundaryPoint[];
  peakB: number;
  peakAlpha: number;
}

// Phase 10: Millennium Prize Search (Invariant Pruning)
export interface MillenniumSearchResult {
  n: number;
  backboneSize: number; // Number of variables identified as "Invariant"
  originalBranchingFactor: number;
  prunedBranchingFactor: number; // b after fixing backbone
  reductionPercentage: number;
  invariantFound: boolean;
  diagnosis: 'FRACTAL COMPLEXITY (Invariant Resistant)' | 'STRUCTURAL WEAKNESS (Prunable)';
}

// Phase 11: Generalization Test (Backbone Prediction)
export interface GeneralizationResult {
  n: number;
  predictionAccuracy: number; // % of top-centrality vars that are actually frozen
  correlation: number; // Simple correlation between centrality and invariance
  verdict: 'TOPOLOGICAL LEAK DETECTED' | 'CRYPTOGRAPHIC BACKBONE' | 'WEAK CORRELATION';
  explanation: string;
}

// Phase 12: Universality Test (Massive Validation)
export interface UniversalityResult {
  samples: number;
  avgAccuracy: number;
  minAccuracy: number;
  maxAccuracy: number;
  consistency: number; // % of instances where accuracy > 80%
  verdict: 'UNIVERSAL LAW CONFIRMED' | 'STATISTICAL FLUCTUATION' | 'FAILED TO GENERALIZE';
  proofDraft: string;
}

// Phase 13: Adversarial Scaling (Theorist's Critique)
export interface AdversarialResult {
  scanPoints: { n: number; accuracy: number; errorRate: number }[];
  slope: number; // Slope of accuracy vs N. Negative means decay.
  deceptivePass: boolean; // Did it survive the "Planted" deceptive structure?
  diagnosis: 'ROBUST SCALING (Winner)' | 'ERROR DECAY (Theorist Correct)' | 'CATASTROPHIC COLLAPSE';
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