from src.sat_generator import SatGenerator
from src.dpll_solver import DpllSolver
import time

def test_system():
    print("--- Testing SAT Core System ---")
    
    # 1. Generation
    n = 20
    alpha = 4.26
    print(f"Generating 3-SAT with N={n}, Alpha={alpha}...")
    clauses, n_vars = SatGenerator.generate_3sat(n, alpha)
    print(f"Generated {len(clauses)} clauses.")
    print("First 3 clauses:", clauses[:3])
    
    # 2. Solver
    solver = DpllSolver()
    print("\nSolving...")
    start_time = time.time()
    satisfiable, assignment = solver.solve(clauses, n_vars)
    duration = time.time() - start_time
    
    print(f"Result: {'SAT' if satisfiable else 'UNSAT'}")
    print(f"Time: {duration:.4f}s")
    print(f"Steps: {solver.steps}")
    print(f"Backtracks: {solver.backtracks}")
    
    if satisfiable:
        print("Verifying assignment...")
        # Verify
        valid = True
        for c in clauses:
            sat_clause = False
            for lit in c:
                val = assignment.get(abs(lit), False)
                if (lit > 0 and val) or (lit < 0 and not val):
                    sat_clause = True
                    break
            if not sat_clause:
                valid = False
                print("ERROR: Clause not satisfied:", c)
                break
        print(f"Verification: {'PASS' if valid else 'FAIL'}")

if __name__ == "__main__":
    test_system()
