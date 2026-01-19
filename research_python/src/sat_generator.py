import random
import numpy as np

class SatGenerator:
    """
    Generates Random 3-SAT instances (CNF formulas).
    """
    @staticmethod
    def generate_3sat(n_vars, alpha=4.26):
        """
        Generates a 3-SAT formula.
        
        Args:
            n_vars (int): Number of variables.
            alpha (float): Clause-to-variable ratio (default 4.26 for phase transition).
            
        Returns:
            tuple: (clauses, n_vars)
            where clauses is a list of lists of integers (literals).
        """
        n_clauses = int(round(n_vars * alpha))
        clauses = []
        
        for _ in range(n_clauses):
            # Pick 3 distinct variables from 1 to n_vars
            # We use 1-based indexing for standard DIMACS format compatibility logic
            vars_idx = random.sample(range(1, n_vars + 1), 3)
            
            # Randomly negate with 0.5 probability
            clause = [v if random.random() > 0.5 else -v for v in vars_idx]
            clauses.append(clause)
            
        return clauses, n_vars

    @staticmethod
    def to_dimacs(clauses, n_vars):
        """
        Converts clauses to DIMACS string format.
        """
        lines = [f"p cnf {n_vars} {len(clauses)}"]
        for c in clauses:
            lines.append(" ".join(map(str, c)) + " 0")
        return "\n".join(lines)
