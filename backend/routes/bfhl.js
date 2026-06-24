const express = require('express');
const router = express.Router();

// GET /bfhl - Optional operation code handler
router.get('/', (req, res) => {
  res.status(200).json({
    operation_code: 1
  });
});

// POST /bfhl - Main graph relationship processing route
router.post('/', (req, res) => {
  try {
    const { data } = req.body;

    // Retrieve credentials from environment variables, fallback if undefined
    const userId = process.env.USER_ID || 'nitish_goyal_24072004';
    const emailId = process.env.EMAIL_ID || 'nitish.goyal@college.edu';
    const collegeRollNumber = process.env.COLLEGE_ROLL_NUMBER || '21CS1001';

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        is_success: false,
        error: 'Invalid input format. Expected an array of strings under the key "data".'
      });
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    const seen_edges = new Set();
    const child_to_parent = {};
    const adj = {};
    const children = {};
    const all_nodes = new Set();

    function addNode(u) {
      all_nodes.add(u);
      if (!adj[u]) adj[u] = [];
      if (!children[u]) children[u] = [];
    }

    // Step 1: Process and validate entries
    for (const entry of data) {
      // Handle non-string values
      if (typeof entry !== 'string') {
        invalid_entries.push(String(entry));
        continue;
      }

      const trimmed = entry.trim();

      // Validate format: must be X->Y where X and Y are uppercase A-Z
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      if (!match) {
        invalid_entries.push(trimmed);
        continue;
      }

      const parent = match[1];
      const child = match[2];

      // Self-loops are invalid
      if (parent === child) {
        invalid_entries.push(trimmed);
        continue;
      }

      const edge_str = `${parent}->${child}`;

      // Duplicate edges
      if (seen_edges.has(edge_str)) {
        if (!duplicate_edges.includes(edge_str)) {
          duplicate_edges.push(edge_str);
        }
        continue;
      }

      seen_edges.add(edge_str);

      // Multi-parent case: if child already has a parent, silently discard this edge
      if (child_to_parent[child] !== undefined) {
        continue;
      }

      // Add to active graph
      child_to_parent[child] = parent;
      addNode(parent);
      addNode(child);
      adj[parent].push(child);
      adj[child].push(parent);
      children[parent].push(child);
    }

    // Step 2: Group nodes into weakly connected components using BFS
    // We iterate over all_nodes in order of their insertion to preserve discovery order
    const visited = new Set();
    const components = [];

    for (const node of all_nodes) {
      if (!visited.has(node)) {
        const component = [];
        const queue = [node];
        visited.add(node);

        while (queue.length > 0) {
          const curr = queue.shift();
          component.push(curr);
          
          if (adj[curr]) {
            for (const neighbor of adj[curr]) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
        }
        components.push(component);
      }
    }

    // Step 3: Process each component and construct hierarchies
    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let max_depth = -1;
    let largest_tree_root = '';

    for (const comp of components) {
      // Find root candidates (nodes in the component that have no parent in child_to_parent)
      const roots = comp.filter(node => child_to_parent[node] === undefined);

      if (roots.length > 0) {
        // Tree component (since in-degree <= 1, there is exactly one root)
        const root = roots[0];

        // Recursive function to construct the nested tree structure
        function buildTree(curr) {
          const treeObj = {};
          if (children[curr]) {
            // Sort children lexicographically
            const sortedChildren = [...children[curr]].sort();
            for (const ch of sortedChildren) {
              treeObj[ch] = buildTree(ch);
            }
          }
          return treeObj;
        }

        const tree = { [root]: buildTree(root) };

        // Recursive function to calculate maximum root-to-leaf path depth (node count)
        function getDepth(curr) {
          if (!children[curr] || children[curr].length === 0) {
            return 1;
          }
          let maxChildDepth = 0;
          for (const ch of children[curr]) {
            maxChildDepth = Math.max(maxChildDepth, getDepth(ch));
          }
          return 1 + maxChildDepth;
        }

        const depth = getDepth(root);

        hierarchies.push({
          root,
          tree,
          depth
        });

        total_trees++;

        // Track largest tree
        if (depth > max_depth) {
          max_depth = depth;
          largest_tree_root = root;
        } else if (depth === max_depth) {
          // Tiebreaker: lexicographically smaller root
          if (root < largest_tree_root) {
            largest_tree_root = root;
          }
        }
      } else {
        // Pure cycle component (all nodes have parents)
        // Root is the lexicographically smallest node in the component
        const root = [...comp].sort()[0];

        hierarchies.push({
          root,
          tree: {},
          has_cycle: true
        });

        total_cycles++;
      }
    }

    // Return the response following the exact PDF specification
    return res.status(200).json({
      user_id: userId,
      email_id: emailId,
      college_roll_number: collegeRollNumber,
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root: total_trees > 0 ? largest_tree_root : ''
      }
    });

  } catch (error) {
    console.error('Error processing graph:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
