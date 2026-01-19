import json
import numpy as np
from src.graph_utils import build_vc_graph, get_laplacian_spectrum

def run_experiment(dataset_path="data/dataset_small.json"):
    print(f"Loading dataset from {dataset_path}...")
    try:
        with open(dataset_path, "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Dataset not found. Run generate_data.py first.")
        return

    print(f"Loaded {len(data)} samples.")
    
    results = []
    
    print("\n--- Processing Samples ---")
    print(f"{'ID':<5} {'Rigidity':<10} {'Fiedler Value (Gap)':<20} {'Evaluated'}")
    
    rigidities = []
    gaps = []
    
    for sample in data:
        n_vars = sample['n_vars']
        clauses = sample['clauses']
        rigidity = sample['rigidity']
        
        # Build Graph
        G = build_vc_graph(clauses, n_vars)
        
        # Get Spectrum
        evals = get_laplacian_spectrum(G, num_eigenvalues=3)
        
        if not evals:
            continue
            
        fiedler_value = evals[0] # Smallest non-zero
        
        results.append({
            'id': sample['id'],
            'rigidity': rigidity,
            'gap': fiedler_value
        })
        
        rigidities.append(rigidity)
        gaps.append(fiedler_value)
        
        print(f"{sample['id']:<5} {rigidity:<10.2f} {fiedler_value:<20.4f} OK")

    # Correlation Analysis
    if len(results) > 1:
        corr = np.corrcoef(rigidities, gaps)[0, 1]
        print("\n--- Results ---")
        print(f"Correlation Coefficient (Rigidity vs Spectral Gap): {corr:.4f}")
        
        if abs(corr) > 0.5:
            print(">> SIGNIFICANT CORRELATION DETECTED!")
        else:
            print(">> Weak Correlation. Hypothesis needs refinement.")
    else:
        print("Not enough data for correlation.")

if __name__ == "__main__":
    run_experiment()
