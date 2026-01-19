import json
import time
import os
from src.sat_generator import SatGenerator
from src.backbone_finder import BackboneFinder

def generate_dataset(num_samples=50, n_vars=50, alpha=4.26, output_file="data/golden_dataset.json"):
    print(f"Generating Golden Dataset ({num_samples} samples, N={n_vars})...")
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    finder = BackboneFinder()
    dataset = []
    
    start_global = time.time()
    
    count = 0
    attempts = 0
    
    while count < num_samples:
        attempts += 1
        clauses, _ = SatGenerator.generate_3sat(n_vars, alpha)
        
        # Solve & Find Backbone
        # This is the "Expensive" Step (Labeling)
        backbone, satisfiable = finder.find_backbone(clauses, n_vars)
        
        if not satisfiable:
            # We skip UNSAT instances for now, or maybe keep them labeled as UNSAT?
            # For Backbone prediction, we usually care about SAT instances.
            # Let's keep a few UNSAT if needed, but for now focus on SAT.
            print(f"Attempt {attempts}: UNSAT (Skipping)")
            continue
            
        # Calculate Rigidity
        rigidity = len(backbone) / n_vars
        
        sample = {
            "id": count,
            "n_vars": n_vars,
            "alpha": alpha,
            "clauses": clauses,
            "backbone": backbone,
            "backbone_size": len(backbone),
            "rigidity": rigidity
        }
        dataset.append(sample)
        count += 1
        print(f"Generated Sample {count}/{num_samples} (Rigidity: {rigidity:.2f})")
        
    duration = time.time() - start_global
    print(f"Done! Saved {count} samples to {output_file}")
    print(f"Total time: {duration:.2f}s")
    
    with open(output_file, "w") as f:
        json.dump(dataset, f, indent=2)

if __name__ == "__main__":
    # Generate a small batch for testing first
    generate_dataset(num_samples=10, n_vars=40, output_file="data/dataset_small.json")
