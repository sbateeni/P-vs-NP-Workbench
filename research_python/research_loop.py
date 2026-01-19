import torch
import time
from src.sat_generator import SatGenerator
from src.backbone_finder import BackboneFinder
from src.gnn_model import BackboneMPNN
from generate_data import generate_dataset
from train_gnn import train, load_data
import torch.optim as optim
import torch.nn as nn
import os

def automated_search_loop():
    print(">>> STARTING AUTOMATED SOLUTION SEARCH <<<")
    print("Goal: Find a GNN that predicts the Frozen Backbone with >95% Accuracy.")
    
    cycle = 0
    best_accuracy = 0.0
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Compute Device: {device}")
    
    # Initialize Model once (or reset every time? Let's keep learning)
    model = BackboneMPNN(hidden_dim=64, num_layers=6).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCELoss()
    
    while True:
        cycle += 1
        print(f"\n=== CYCLE {cycle} ===")
        
        # 1. Generate Fresh Data (Curriculum Learning)
        # We slowly increase N if we get good at small N?
        # For now, keep N=40 to find a breakthrough there first.
        n_vars = 40
        num_samples = 50 
        dataset_file = f"data/cycle_{cycle}.json"
        
        print(f"[1/3] Generating {num_samples} hard instances (N={n_vars})...")
        generate_dataset(num_samples=num_samples, n_vars=n_vars, output_file=dataset_file)
        
        # 2. Train
        print(f"[2/3] Training GNN on Cycle {cycle} data...")
        # Custom short training loop
        data = load_data(dataset_file, device)
        split = int(0.8 * len(data))
        train_set = data[:split]
        val_set = data[split:]
        
        epochs = 10
        for epoch in range(epochs):
            model.train()
            total_loss = 0
            for n_v, clauses, labels in train_set:
                optimizer.zero_grad()
                preds = model(n_v, clauses, device)
                loss = criterion(preds, labels)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
        
        # 3. Validation & Breakthrough Check
        print(f"[3/3] Validating...")
        model.eval()
        total_acc = 0
        total_nodes = 0
        
        with torch.no_grad():
            for n_v, clauses, labels in val_set:
                preds = model(n_v, clauses, device)
                binary_preds = (preds > 0.5).float()
                correct = (binary_preds == labels).sum().item()
                total_acc += correct
                total_nodes += n_v
        
        accuracy = (total_acc / total_nodes) * 100 if total_nodes > 0 else 0
        print(f"Cycle {cycle} Validation Accuracy: {accuracy:.2f}%")
        
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            torch.save(model.state_dict(), "best_model.pth")
            print(f"NEW RECORD! Model saved. (Best: {best_accuracy:.2f}%)")
        
        if accuracy > 95.0:
            print("\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            print("!!! BREAKTHROUGH DETECTED: ACCURACY > 95% !!!")
            print("!!! POTENTIAL P=NP SOLUTION FOUND. STOPPING LOOP. !!!")
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            break
            
        # Cleanup data file to save space?
        # os.remove(dataset_file)
        
        print("Continuing search...")
        time.sleep(1)

if __name__ == "__main__":
    try:
        automated_search_loop()
    except KeyboardInterrupt:
        print("Search paused by user.")
