import torch
import torch.nn as nn
import torch.optim as optim
import json
import numpy as np
from src.gnn_model import BackboneMPNN

def load_data(path, device):
    with open(path, 'r') as f:
        data = json.load(f)
    
    samples = []
    for d in data:
        n_vars = d['n_vars']
        clauses = d['clauses']
        backbone = d['backbone'] # dict "1": true/false
        backbone_set = set(str(k) for k in backbone.keys())
        
        # Label: 1 if Frozen (in backbone), 0 if Free
        labels = []
        for v in range(1, n_vars + 1):
            if str(v) in backbone_set:
                labels.append(1.0)
            else:
                labels.append(0.0)
                
        labels_tensor = torch.tensor(labels, dtype=torch.float, device=device)
        samples.append((n_vars, clauses, labels_tensor))
        
    return samples

def train():
    device = torch.device('cpu') # GNN is small, CPU is fine
    print(f"Training on {device}...")
    
    train_data = load_data('data/dataset_small.json', device)
    
    # Split
    split_idx = int(0.8 * len(train_data))
    train_set = train_data[:split_idx]
    val_set = train_data[split_idx:]
    
    print(f"Train: {len(train_set)}, Val: {len(val_set)}")
    
    model = BackboneMPNN(hidden_dim=32, num_layers=4).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.005)
    criterion = nn.BCELoss()
    
    epochs = 20
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        
        for n_vars, clauses, labels in train_set:
            optimizer.zero_grad()
            preds = model(n_vars, clauses, device)
            loss = criterion(preds, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        avg_loss = total_loss / len(train_set)
        
        # Validation
        model.eval()
        val_acc = 0
        total_valid_nodes = 0
        correct_frozen = 0
        total_frozen = 0
        
        with torch.no_grad():
            for n_vars, clauses, labels in val_set:
                preds = model(n_vars, clauses, device)
                binary_preds = (preds > 0.5).float()
                
                correct = (binary_preds == labels).sum().item()
                val_acc += correct
                total_valid_nodes += n_vars
                
                frozen_mask = (labels == 1.0)
                frozen_correct = (binary_preds[frozen_mask] == 1.0).sum().item()
                correct_frozen += frozen_correct
                total_frozen += frozen_mask.sum().item()

        epoch_acc = val_acc / total_valid_nodes if total_valid_nodes > 0 else 0
        frozen_recall = correct_frozen / total_frozen if total_frozen > 0 else 0
        
        print(f"Epoch {epoch+1:02d} | Loss: {avg_loss:.4f} | Acc: {epoch_acc*100:.1f}% | Backbone Recall: {frozen_recall*100:.1f}%")

    # Save model
    torch.save(model.state_dict(), 'gnn_backbone_model.pth')
    print("Model saved.")

if __name__ == "__main__":
    train()
