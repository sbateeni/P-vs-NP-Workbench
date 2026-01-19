import sys
from collections import Counter

# Increase recursion depth for deep DPLL searches
sys.setrecursionlimit(50000)

class DpllSolver:
    """
    Deterministic Exact Solver using DPLL algorithm.
    Used for establishing Ground Truth (finding the actual Backbone).
    """
    def __init__(self):
        self.steps = 0
        self.backtracks = 0

    def solve(self, clauses, n_vars):
        """
        Solves the SAT instance.
        Returns: (satisfiable: bool, assignment: dict)
        """
        self.steps = 0
        self.backtracks = 0
        # Check for empty formula first
        if not clauses: return True, {}
        
        # Unit Prop before starting
        return self._dpll(clauses, {})

    def _dpll(self, clauses, assignment):
        self.steps += 1
        
        # 1. Base Cases
        if not clauses: 
            return True, assignment
        for c in clauses:
            if not c: 
                return False, None
            
        # 2. Unit Propagation
        while True:
            unit_lit = None
            for c in clauses:
                if len(c) == 1:
                    unit_lit = c[0]
                    break
            
            if unit_lit is None:
                break
                
            # Propagate
            assignment[abs(unit_lit)] = (unit_lit > 0)
            clauses = self._simplify(clauses, unit_lit)
            
            if not clauses: return True, assignment
            for c in clauses:
                if not c: return False, None # Conflict

        # 3. Splitting Heuristic (DLIS - Dynamic Largest Individual Sum)
        # Find literal that appears most frequently
        counter = Counter()
        for c in clauses:
            for lit in c:
                counter[lit] += 1
        
        if not counter:
             # Should be covered by base cases, but safety first
             return True, assignment

        best_lit, _ = counter.most_common(1)[0]
        
        # Branch 1: Try best_lit
        new_assign = assignment.copy()
        new_assign[abs(best_lit)] = (best_lit > 0)
        
        res, final_assign = self._dpll(self._simplify(clauses, best_lit), new_assign)
        if res: return True, final_assign
        
        self.backtracks += 1
        
        # Branch 2: Try -best_lit
        new_assign = assignment.copy()
        new_assign[abs(best_lit)] = (best_lit < 0) # Negate value
        
        return self._dpll(self._simplify(clauses, -best_lit), new_assign)

    def _simplify(self, clauses, literal):
        """
        Removes clauses containing 'literal' and removes '-literal' from others.
        Does NOT modify the list in-place (returns new list).
        """
        new_clauses = []
        for c in clauses:
            if literal in c:
                continue # Clause satisfied
            if -literal in c:
                # Remove negated literal
                new_c = [l for l in c if l != -literal]
                new_clauses.append(new_c)
            else:
                new_clauses.append(c)
        return new_clauses
