import React, { useState } from 'react';

// Recursive Tree Node Component
function TreeNode({ nodeName, children }) {
  const childKeys = Object.keys(children);
  return (
    <li className="tree-node">
      <span className="node-label">
        <span>📄 {nodeName}</span>
      </span>
      {childKeys.length > 0 && (
        <ul>
          {childKeys.map(key => (
            <TreeNode key={key} nodeName={key} children={children[key]} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Tree Root Component
function TreeVisualizer({ treeData }) {
  if (!treeData || Object.keys(treeData).length === 0) {
    return <div className="empty-state">No tree structure available.</div>;
  }
  
  const rootKey = Object.keys(treeData)[0];
  const children = treeData[rootKey];
  const childKeys = Object.keys(children);

  return (
    <div style={{ paddingLeft: 0 }}>
      <ul>
        <li className="tree-node" style={{ paddingLeft: 0 }}>
          <span className="node-label node-label-root">
            <span>👑 {rootKey} (Root)</span>
          </span>
          {childKeys.length > 0 && (
            <ul>
              {childKeys.map(key => (
                <TreeNode key={key} nodeName={key} children={children[key]} />
              ))}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}

function App() {
  // Setup default URL and sample data from the PDF challenge
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:5000');
  const [inputText, setInputText] = useState(
    'A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->'
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState('hierarchies');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Parse data safely
    let parsedData = [];
    try {
      const trimmedInput = inputText.trim();
      if (trimmedInput.startsWith('[') && trimmedInput.endsWith(']')) {
        // Try parsing as JSON array
        parsedData = JSON.parse(trimmedInput);
      } else {
        // Parse as comma-separated or newline-separated strings
        parsedData = trimmedInput
          .split(/[,\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        // Remove surrounding quotes if users copied strings like "A->B"
        parsedData = parsedData.map(item => {
          if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
            return item.slice(1, -1);
          }
          return item;
        });
      }
    } catch (parseErr) {
      setError(`Failed to parse inputs. Make sure it is a comma-separated list or a valid JSON array format. Error: ${parseErr.message}`);
      setIsLoading(false);
      return;
    }

    try {
      const fetchUrl = `${apiUrl.trim().replace(/\/+$/, '')}/bfhl`;
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${res.status}`);
      }

      setResponse(data);
    } catch (err) {
      console.error('API Call Error:', err);
      setError(`API call failed: ${err.message}. Please verify that your backend server is running and CORS is enabled.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header section with badge */}
      <header className="header">
        <span className="badge">Chitkara Round 1 Challenge</span>
        <h1 className="title">Hierarchy Analyzer</h1>
        <p className="subtitle">
          Process hierarchical node lists, resolve multi-parents, perform cycle detection, and visualize trees in real-time.
        </p>
      </header>

      {/* Main Dashboard Layout */}
      <main className="dashboard-grid">
        
        {/* Left Side: Input & Settings Form */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <form className="card" onSubmit={handleSubmit}>
            <h2 className="card-title">
              <span>⚙️</span> Configuration & Input
            </h2>

            <div className="form-group">
              <label className="label" htmlFor="api-url">API Base URL</label>
              <input
                id="api-url"
                type="text"
                className="input"
                placeholder="e.g. http://localhost:5000"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="nodes-input">Node Edges List (data)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Enter edges using <code>Parent-&gt;Child</code> format. Separated by commas or newlines.
              </p>
              <textarea
                id="nodes-input"
                className="textarea"
                rows="6"
                placeholder="A->B, A->C, B->D"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Analyze Graph</span>
                </>
              )}
            </button>
          </form>

          {/* Identity Info Panel (Displays details returned from server) */}
          {response && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                <span>👤</span> Student Credentials
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>User ID:</span>{' '}
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{response.user_id}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Email ID:</span>{' '}
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{response.email_id}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Roll Number:</span>{' '}
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{response.college_roll_number}</strong>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Side: Results & Interactive Visualization */}
        <section>
          {!response && !error && !isLoading && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Ready for Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '350px', fontSize: '0.9rem' }}>
                Enter your node edge list on the left and click "Analyze Graph" to see structured hierarchies, cycles, and metrics.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '1.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Analyzing relationships and detecting cycles...</p>
            </div>
          )}

          {error && (
            <div className="card">
              <h3 className="card-title" style={{ color: 'var(--accent-red)' }}>
                <span>❌</span> Analysis Failed
              </h3>
              <div className="alert-error">{error}</div>
            </div>
          )}

          {response && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Stats Summary Cards */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-val" style={{ color: 'var(--accent-green)' }}>
                    {response.summary.total_trees}
                  </div>
                  <div className="stat-label">Valid Trees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{ color: 'var(--accent-red)' }}>
                    {response.summary.total_cycles}
                  </div>
                  <div className="stat-label">Cycles</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{ color: 'var(--secondary)', fontSize: '1.4rem', lineHeight: '1.8rem', padding: '0.2rem 0' }}>
                    {response.summary.largest_tree_root || 'N/A'}
                  </div>
                  <div className="stat-label">Largest Root</div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="tabs">
                <button
                  type="button"
                  className={`tab ${activeTab === 'hierarchies' ? 'active' : ''}`}
                  onClick={() => setActiveTab('hierarchies')}
                >
                  🌳 Hierarchies ({response.hierarchies.length})
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('validation')}
                >
                  ⚠️ Validations ({response.invalid_entries.length + response.duplicate_edges.length})
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
                  onClick={() => setActiveTab('raw')}
                >
                  💻 Developer JSON
                </button>
              </div>

              {/* Tab Content 1: Hierarchies Visualizer */}
              {activeTab === 'hierarchies' && (
                <div className="hierarchy-list">
                  {response.hierarchies.length === 0 ? (
                    <div className="empty-state">No hierarchical structures found in input.</div>
                  ) : (
                    response.hierarchies.map((hier, idx) => (
                      <div className="hierarchy-item" key={idx}>
                        <div className="hierarchy-header">
                          <span className="hierarchy-root-badge">Root: {hier.root}</span>
                          {hier.has_cycle ? (
                            <span className="hierarchy-info-badge badge-cycle">⚠️ CYCLE GROUP</span>
                          ) : (
                            <span className="hierarchy-info-badge badge-depth">Depth: {hier.depth}</span>
                          )}
                        </div>
                        <div className="hierarchy-body">
                          {hier.has_cycle ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                              This component forms a cyclic graph (loop detected). Tree construction is skipped for this group.
                            </p>
                          ) : (
                            <TreeVisualizer treeData={hier.tree} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content 2: Validations Details */}
              {activeTab === 'validation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Invalid Entries Section */}
                  <div>
                    <h4 className="label" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      Invalid Entries ({response.invalid_entries.length})
                    </h4>
                    {response.invalid_entries.length === 0 ? (
                      <p className="empty-state" style={{ padding: '0.5rem 0', fontSize: '0.9rem' }}>No invalid entries found.</p>
                    ) : (
                      <div className="entry-list">
                        {response.invalid_entries.map((entry, idx) => (
                          <span key={idx} className="entry-badge entry-badge-invalid">
                            {entry}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duplicate Edges Section */}
                  <div>
                    <h4 className="label" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      Duplicate Edges ({response.duplicate_edges.length})
                    </h4>
                    {response.duplicate_edges.length === 0 ? (
                      <p className="empty-state" style={{ padding: '0.5rem 0', fontSize: '0.9rem' }}>No duplicate edges found.</p>
                    ) : (
                      <div className="entry-list">
                        {response.duplicate_edges.map((entry, idx) => (
                          <span key={idx} className="entry-badge entry-badge-duplicate">
                            {entry}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab Content 3: Raw JSON Viewer */}
              {activeTab === 'raw' && (
                <div>
                  <pre className="json-viewer">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;
