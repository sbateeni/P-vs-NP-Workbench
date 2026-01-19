import torch
import torch.nn as nn
import torch.nn.functional as F

class BackboneMPNN(nn.Module):
    """
    Message Passing Neural Network for SAT Backbone Prediction.
    
    Structure: Bipartite Graph (Variables <-> Clauses)
    Logic: Simulates survey propagation / belief propagation with learnable weights.
    """
    def __init__(self, hidden_dim=64, num_layers=4):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # Embeddings
        # 0: Variable (Unassigned), 1: Clause
        self.type_embed = nn.Embedding(2, hidden_dim)
        
        # Message Passing functions
        # Msg from Var -> Clause
        self.msg_v2c = nn.Sequential(
            nn.Linear(hidden_dim * 2 + 1, hidden_dim), # +1 for edge sign
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
        # Msg from Clause -> Var
        self.msg_c2v = nn.Sequential(
            nn.Linear(hidden_dim * 2 + 1, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
        # Update functions (RNN-like)
        self.update_var = nn.GRUCell(hidden_dim, hidden_dim)
        self.update_clause = nn.GRUCell(hidden_dim, hidden_dim)
        
        # Final Readout: Is this variable Frozen?
        # Output: 2 classes (0: Free, 1: Frozen)
        # Actually simplified: Logic is prob of being frozen.
        self.projection_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1) # Logit
        )

    def forward(self, n_vars, clauses, device='cpu'):
        """
        Args:
            n_vars: int
            clauses: list of lists (literals)
        """
        # 1. Build Batch Data
        # We process one graph at a time for research clarity (batching graphs is complex without torch_geometric)
        
        # Nodes: 0..N-1 (Vars), N..N+M-1 (Clauses)
        num_clauses = len(clauses)
        num_nodes = n_vars + num_clauses
        
        # Initial Embeddings
        # Vars=0, Clauses=1
        node_types = torch.zeros(num_nodes, dtype=torch.long, device=device)
        node_types[n_vars:] = 1 
        
        h = self.type_embed(node_types) # [NumNodes, Hidden]
        
        # Build Edge Indices for MP
        # We need two sets: V->C and C->V
        v_indices = []
        c_indices = []
        signs = []
        
        for c_idx, clause in enumerate(clauses):
            c_node = n_vars + c_idx
            for lit in clause:
                v_node = abs(lit) - 1 # 0-indexed
                sign = 1.0 if lit > 0 else -1.0
                
                v_indices.append(v_node)
                c_indices.append(c_node)
                signs.append(sign)
                
        v_tensor = torch.tensor(v_indices, dtype=torch.long, device=device)
        c_tensor = torch.tensor(c_indices, dtype=torch.long, device=device)
        s_tensor = torch.tensor(signs, dtype=torch.float, device=device).unsqueeze(1) # [E, 1]
        
        # Message Passing Loop
        for _ in range(self.num_layers):
            # 1. Var -> Clause Phase
            h_v = h[v_tensor]
            h_c_target = h[c_tensor]
            
            msg_in = torch.cat([h_v, h_c_target, s_tensor], dim=1)
            messages = self.msg_v2c(msg_in)
            
            # Aggregate to Clauses
            # Use index_add (out-of-place) or index_add_ on a FRESH zero tensor
            agg_to_c = torch.zeros(num_nodes, self.hidden_dim, device=device)
            agg_to_c.index_add_(0, c_tensor, messages)
            
            h_clauses_old = h[n_vars:]
            update_input = agg_to_c[n_vars:]
            h_clauses_new = self.update_clause(update_input, h_clauses_old)
            
            # Create NEW h tensor to avoid inplace modification of the old one which is needed for gradient
            # We can't just do h[n_vars:] = ... because h is a leaf or intermediate variable needed.
            # We construct the new state from parts.
            h_vars_current = h[:n_vars]
            h = torch.cat([h_vars_current, h_clauses_new], dim=0)
            
            # 2. Clause -> Var Phase
            # Now h has updated clauses
            h_c = h[c_tensor]
            h_v_target = h[v_tensor]
            
            msg_in = torch.cat([h_c, h_v_target, s_tensor], dim=1)
            messages = self.msg_c2v(msg_in)
            
            agg_to_v = torch.zeros(num_nodes, self.hidden_dim, device=device)
            agg_to_v.index_add_(0, v_tensor, messages)
            
            h_vars_old = h[:n_vars]
            update_input = agg_to_v[:n_vars]
            h_vars_new = self.update_var(update_input, h_vars_old)
            
            h_clauses_current = h[n_vars:]
            h = torch.cat([h_vars_new, h_clauses_current], dim=0)

        # Final Prediction
        h_vars = h[:n_vars]
        logits = self.projection_head(h_vars) # [N, 1]
        probs = torch.sigmoid(logits).squeeze(1)
        
        return probs
