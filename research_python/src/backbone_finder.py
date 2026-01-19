from .dpll_solver import DpllSolver

class BackboneFinder:
    """
    Identifies the 'Frozen Backbone' of a SAT formula.
    A variable is in the Backbone if it takes the SAME value in ALL satisfying assignments.
    """
    def __init__(self):
        self.solver = DpllSolver()

    def find_backbone(self, clauses, n_vars):
        """
        Returns: 
           backbone: dict {var_idx: value} (Only frozen vars)
           is_satisfiable: bool
        """
        # 1. Find initial solution
        satisfiable, first_assignment = self.solver.solve(clauses, n_vars)
        if not satisfiable:
            return {}, False

        # 2. Check each variable in the solution
        backbone = {}
        
        # Optimization: We only need to check vars that are assigned in the first solution.
        # Unassigned vars (free) are obviously not frozen, or dont matter.
        # Actually in DPLL partial assignment might be returned if typically adequate? 
        # Our DPLL returns full assignment usually? Let's assume full.
        
        for var in range(1, n_vars + 1):
            if var not in first_assignment:
                # If var is not in assignment, it logicall implies it was free (don't care)
                # So not frozen.
                continue
                
            val = first_assignment[var]
            
            # Try to refute the backbone property:
            # Can we find a solution where var = !val?
            
            # We force var = !val by adding a unit clause
            negated_unit = -var if val else var
            test_clauses = clauses + [[negated_unit]]
            
            # We reuse solver? Or new instance? Solver is stateless basically.
            is_flippable, _ = self.solver.solve(test_clauses, n_vars)
            
            if not is_flippable:
                # Could not flip logic -> It is frozen!
                backbone[var] = val
        
        return backbone, True
