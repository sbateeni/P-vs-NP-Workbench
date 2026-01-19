import networkx as nx
import numpy as np

def build_vc_graph(clauses, n_vars):
    """
    Builds a Variable-Clause (VC) Graph (Bipartite).
    Nodes: 
      - Variable Nodes: 1..N
      - Clause Nodes: N+1..N+M
    Edges:
      - If var v is in clause c: Edge (v, c) with weight +1
      - If -v is in clause c: Edge (v, c) with weight -1 (Signed Graph)
      
    Returns: NetworkX Graph
    """
    G = nx.Graph()
    
    # Add variable nodes
    for i in range(1, n_vars + 1):
        G.add_node(i, type='variable')
        
    num_clauses = len(clauses)
    clause_start_idx = n_vars + 1
    
    # Add clause nodes and edges
    for idx, clause in enumerate(clauses):
        c_node_id = clause_start_idx + idx
        G.add_node(c_node_id, type='clause')
        
        for lit in clause:
            var = abs(lit)
            # sign = 1 if lit > 0 else -1
            # For simple Laplacian, we use unweighted initially.
            # Sign can be stored in edge attribute
            sign = 1 if lit > 0 else -1
            G.add_edge(var, c_node_id, sign=sign)
            
    return G

def get_laplacian_spectrum(G, num_eigenvalues=5):
    """
    Computes the smallest non-zero eigenvalues of the Normalized Laplacian.
    These are the "Fiedler Values" related to graph connectivity and partitioning.
    """
    # Get Normalized Laplacian
    # L = I - D^-1/2 A D^-1/2
    try:
        L = nx.normalized_laplacian_matrix(G)
        
        # Scipy Sparse Eigsh to get smallest real eigenvalues
        # sigma=0 finds eigenvalues near 0
        from scipy.sparse.linalg import eigsh
        
        # k must be < N. G has N+M nodes.
        k = min(num_eigenvalues + 1, L.shape[0] - 1)
        
        # 'SM' = Smallest Magnitude
        evals, _ = eigsh(L, k=k, which='SM')
        
        # Sort and remove the trivial zero (or near-zero)
        evals = sorted(evals)
        
        # Usually first one is 0. 
        return evals[1:] # Return top k non-zero
        
    except Exception as e:
        print(f"Error checking spectrum: {e}")
        return []
