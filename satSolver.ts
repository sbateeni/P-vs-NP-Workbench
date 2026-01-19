import { Formula, Literal, Clause, VarianceAnalysisResult, HysteresisResult } from './types';

// Helper: Generates a random k-SAT formula
export const generateRandom3SAT = (n: number, m: number): Formula => {
  const formula: Formula = [];
  for (let i = 0; i < m; i++) {
    const clause: Clause = [];
    const usedVars = new Set<number>();
    
    while (clause.length < 3) {
      // Pick random variable 1..n
      const v = Math.floor(Math.random() * n) + 1;
      if (usedVars.has(v)) continue;
      usedVars.add(v);
      
      // Randomly negate
      const literal = Math.random() < 0.5 ? v : -v;
      clause.push(literal);
    }
    formula.push(clause);
  }
  return formula;
};

// DPLL Implementation (Exact Solver - The Theorist Approach)
export const solveDPLL = (formula: Formula, n: number): { satisfiable: boolean, steps: number } => {
  let steps = 0;

  const run = (currentFormula: Formula, assignment: Map<number, boolean>): boolean => {
    steps++;
    // Limit steps to prevent browser freeze on hard instances
    if (steps > 5000) return false; 

    // 1. Base Cases
    if (currentFormula.length === 0) return true; // All clauses satisfied
    
    // Check for empty clauses (conflict)
    for (const c of currentFormula) {
      if (c.length === 0) return false;
    }

    // 2. Unit Propagation
    let unitClauseVal: Literal | null = null;
    for (const c of currentFormula) {
      if (c.length === 1) {
        unitClauseVal = c[0];
        break;
      }
    }

    if (unitClauseVal !== null) {
      const lit = unitClauseVal;
      const variable = Math.abs(lit);
      const value = lit > 0;
      
      const nextAssignment = new Map(assignment);
      nextAssignment.set(variable, value);
      
      const simplified = simplify(currentFormula, lit);
      return run(simplified, nextAssignment);
    }

    // 3. Splitting (Heuristic: DLIS - Dynamic Largest Individual Sum)
    const literalCounts = new Map<number, number>();
    for (const c of currentFormula) {
      for (const lit of c) {
        literalCounts.set(lit, (literalCounts.get(lit) || 0) + 1);
      }
    }
    
    let bestLit = 1; 
    let maxCount = -1;
    
    if (literalCounts.size === 0) return false; 

    for (const [lit, count] of literalCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestLit = lit;
      }
    }

    // Branch True
    const branch1 = run(simplify(currentFormula, bestLit), new Map(assignment).set(Math.abs(bestLit), bestLit > 0));
    if (branch1) return true;

    // Branch False
    const branch2 = run(simplify(currentFormula, -bestLit), new Map(assignment).set(Math.abs(bestLit), bestLit < 0));
    return branch2;
  };

  const satisfiable = run(formula, new Map());
  return { satisfiable, steps };
};

// Simplify helper for DPLL
const simplify = (formula: Formula, literal: Literal): Formula => {
  const newFormula: Formula = [];
  for (const clause of formula) {
    if (clause.includes(literal)) {
      continue;
    } else if (clause.includes(-literal)) {
      newFormula.push(clause.filter(l => l !== -literal));
    } else {
      newFormula.push(clause);
    }
  }
  return newFormula;
};

// --- Agent-Based Heuristic Solver (The Empiricist/Critic Approach) ---

export const createAgentState = (n: number) => {
  const assignment = new Array(n).fill(false).map(() => Math.random() < 0.5);
  return assignment;
};

// Returns list of unsatisfied clauses (The Critic)
export const getCriticErrors = (formula: Formula, assignment: boolean[]): Formula => {
  const unsatisfied: Formula = [];
  for (const clause of formula) {
    let satisfied = false;
    for (const lit of clause) {
      const varIdx = Math.abs(lit) - 1;
      const val = assignment[varIdx];
      if ((lit > 0 && val) || (lit < 0 && !val)) {
        satisfied = true;
        break;
      }
    }
    if (!satisfied) unsatisfied.push(clause);
  }
  return unsatisfied;
};

// Fast helper to just count errors without creating arrays (Optimization)
export const countErrors = (formula: Formula, assignment: boolean[]): number => {
  let count = 0;
  for (const clause of formula) {
    let satisfied = false;
    for (const lit of clause) {
      const varIdx = Math.abs(lit) - 1;
      const val = assignment[varIdx];
      if ((lit > 0 && val) || (lit < 0 && !val)) {
        satisfied = true;
        break;
      }
    }
    if (!satisfied) count++;
  }
  return count;
};

// --- Simulated Annealing Step ---
export const runSimulatedAnnealingStep = (
  formula: Formula, 
  assignment: boolean[], 
  currentErrors: Formula, // We need the actual clauses to pick a candidate
  temperature: number
): { newAssignment: boolean[], flippedVar: number, accepted: boolean, delta: number } => {
  
  if (currentErrors.length === 0) {
    return { newAssignment: assignment, flippedVar: -1, accepted: true, delta: 0 };
  }

  // 1. Pick a candidate move (Flip a variable in a random unsatisfied clause)
  const randomClause = currentErrors[Math.floor(Math.random() * currentErrors.length)];
  const randomLit = randomClause[Math.floor(Math.random() * randomClause.length)];
  const varIdx = Math.abs(randomLit) - 1;

  // 2. Create candidate assignment
  const candidateAssignment = [...assignment];
  candidateAssignment[varIdx] = !candidateAssignment[varIdx];

  // 3. Calculate Delta (Cost change)
  const currentCost = currentErrors.length;
  const newCost = countErrors(formula, candidateAssignment);
  const delta = newCost - currentCost;

  // 4. Metropolis Criterion
  let accepted = false;
  if (delta < 0) {
    // Improvement: Always accept
    accepted = true;
  } else {
    // Degradation: Accept with probability e^(-delta / T)
    const probability = Math.exp(-delta / temperature);
    if (Math.random() < probability) {
      accepted = true;
    }
  }

  return { 
    newAssignment: accepted ? candidateAssignment : assignment, 
    flippedVar: varIdx + 1,
    accepted,
    delta 
  };
};

// --- Phase 4: Energy Variance Analysis Probe ---
export const runEnergyVarianceAnalysis = (
  n: number = 50,
  alpha: number = 5.6
): VarianceAnalysisResult => {
  const m = Math.round(n * alpha);
  const formula = generateRandom3SAT(n, m);
  let assignment = createAgentState(n);
  
  const maxSteps = 1000;
  let temp = 1.0;
  const cooling = 0.99; 
  
  const history: { step: number; energy: number }[] = [];
  let minEnergy = Infinity;

  for (let s = 0; s < maxSteps; s++) {
    const currentH = countErrors(formula, assignment);
    history.push({ step: s, energy: currentH });
    
    if (currentH < minEnergy) minEnergy = currentH;
    if (currentH === 0) break;

    const errors = getCriticErrors(formula, assignment);
    
    // 1. Pick candidate
    const randomClause = errors[Math.floor(Math.random() * errors.length)];
    const randomLit = randomClause[Math.floor(Math.random() * randomClause.length)];
    const varIdx = Math.abs(randomLit) - 1;
    
    // 2. Candidate
    const candidateAssignment = [...assignment];
    candidateAssignment[varIdx] = !candidateAssignment[varIdx];
    
    // 3. New Energy
    const newH = countErrors(formula, candidateAssignment);

    // 4. Acceptance Logic
    let accepted = false;
    if (newH < currentH) {
        accepted = true;
    } else if (Math.random() < 0.1) {
        accepted = true;
    }

    if (accepted) {
      assignment = candidateAssignment;
    }
    
    temp *= cooling;
  }

  const tailSize = Math.min(200, history.length);
  const tail = history.slice(-tailSize).map(h => h.energy);
  
  const sum = tail.reduce((a, b) => a + b, 0);
  const mean = sum / tailSize;

  const sumDiffSq = tail.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  const variance = sumDiffSq / tailSize;

  let diagnosis = "UNCERTAIN";
  if (variance < 0.05 && mean > 0) { 
    diagnosis = "TRAPPED (Deep Well)";
  } else if (variance > 1.0) {
    diagnosis = "CHAOTIC (Liquid Phase)";
  } else if (mean === 0) {
    diagnosis = "SOLVED (Ground State)";
  } else {
    diagnosis = "OSCILLATING (Glassy)";
  }

  return {
    energyHistory: history,
    meanEnergy: mean,
    minEnergy: minEnergy,
    variance: variance,
    diagnosis,
    alpha,
    n
  };
};

// --- Phase 5: Hysteresis Probe ---
export const runHysteresisExperiment = (n: number = 50, alpha: number = 5.8): HysteresisResult => {
  const m = Math.round(n * alpha);
  // Generate ONE hard instance to test both strategies
  const formula = generateRandom3SAT(n, m);
  
  const runSA = (coolingRate: number): { steps: number, success: boolean } => {
    let assignment = createAgentState(n);
    let temp = 5.0; // Higher start temp for Hysteresis
    const maxSteps = 5000;
    
    for (let step = 0; step < maxSteps; step++) {
        const errors = getCriticErrors(formula, assignment);
        const currentH = errors.length;
        
        if (currentH === 0) return { steps: step, success: true };
        
        // Heuristic Mutation
        const randomClause = errors[Math.floor(Math.random() * errors.length)];
        const randomLit = randomClause[Math.floor(Math.random() * randomClause.length)];
        const varIdx = Math.abs(randomLit) - 1;
        
        const nextAssignment = [...assignment];
        nextAssignment[varIdx] = !nextAssignment[varIdx];
        
        const newH = countErrors(formula, nextAssignment);
        const delta = newH - currentH;
        
        // Metropolis Criterion
        if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
            assignment = nextAssignment;
        }
        
        temp *= coolingRate;
    }
    
    return { steps: maxSteps, success: false };
  };
  
  const fast = runSA(0.95);
  const slow = runSA(0.999);
  
  let diagnosis = "";
  if (!slow.success && !fast.success) {
      diagnosis = "UNSAT STRUCTURALLY (Thermal Death)";
  } else if (slow.success && !fast.success) {
      diagnosis = "BARRIERS CROSSED (Time is Key)";
  } else {
      diagnosis = "GLASSY PHASE (Chaotic / Easy)";
  }
  
  return { alpha, fast, slow, diagnosis };
};