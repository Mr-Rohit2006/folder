const assert = require('assert');
const express = require('express');
const bfhlRouter = require('./routes/bfhl');

// Quick Mock Request / Response helper to test the router in-process
function simulatePostRequest(body, callback) {
  const app = express();
  app.use(express.json());
  app.use('/bfhl', bfhlRouter);

  // We use standard supertest-like mock or simple request listener
  const req = {
    method: 'POST',
    url: '/bfhl',
    headers: { 'content-type': 'application/json' },
    body: body
  };

  const res = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      callback(null, this.statusCode, data);
      return this;
    },
    send(data) {
      callback(null, this.statusCode, data);
      return this;
    }
  };

  // Find the POST handler and execute it
  const handler = bfhlRouter.stack.find(layer => layer.route && layer.route.methods.post);
  if (handler) {
    handler.route.stack[0].handle(req, res, (err) => {
      if (err) callback(err);
    });
  } else {
    callback(new Error('POST handler not found'));
  }
}

// Test cases
const tests = [
  {
    name: 'PDF Example Case',
    input: {
      data: [
        'A->B', 'A->C', 'B->D', 'C->E', 'E->F',
        'X->Y', 'Y->Z', 'Z->X',
        'P->Q', 'Q->R',
        'G->H', 'G->H', 'G->I',
        'hello', '1->2', 'A->'
      ]
    },
    verify: (res) => {
      // Identity fields
      assert.strictEqual(typeof res.user_id, 'string');
      assert.ok(res.user_id.length > 0);
      assert.strictEqual(typeof res.email_id, 'string');
      assert.strictEqual(typeof res.college_roll_number, 'string');

      // Invalid entries
      assert.deepStrictEqual(res.invalid_entries, ['hello', '1->2', 'A->']);

      // Duplicate edges
      assert.deepStrictEqual(res.duplicate_edges, ['G->H']);

      // Summary
      assert.strictEqual(res.summary.total_trees, 3);
      assert.strictEqual(res.summary.total_cycles, 1);
      assert.strictEqual(res.summary.largest_tree_root, 'A');

      // Hierarchies
      assert.strictEqual(res.hierarchies.length, 4);

      // Hierarchy 1: A
      const hA = res.hierarchies.find(h => h.root === 'A');
      assert.ok(hA);
      assert.deepStrictEqual(hA.tree, {
        A: {
          B: { D: {} },
          C: { E: { F: {} } }
        }
      });
      assert.strictEqual(hA.depth, 4);
      assert.strictEqual(hA.has_cycle, undefined);

      // Hierarchy 2: X
      const hX = res.hierarchies.find(h => h.root === 'X');
      assert.ok(hX);
      assert.deepStrictEqual(hX.tree, {});
      assert.strictEqual(hX.has_cycle, true);
      assert.strictEqual(hX.depth, undefined);

      // Hierarchy 3: P
      const hP = res.hierarchies.find(h => h.root === 'P');
      assert.ok(hP);
      assert.deepStrictEqual(hP.tree, {
        P: { Q: { R: {} } }
      });
      assert.strictEqual(hP.depth, 3);

      // Hierarchy 4: G
      const hG = res.hierarchies.find(h => h.root === 'G');
      assert.ok(hG);
      assert.deepStrictEqual(hG.tree, {
        G: { H: {}, I: {} }
      });
      assert.strictEqual(hG.depth, 2);
    }
  },
  {
    name: 'Multi-Parent First-Wins Case & Self Loop Case',
    input: {
      data: [
        'A->B',
        'C->B', // B already has parent A, so C->B is silently discarded. C is isolated and not in active graph.
        'B->D',
        'X->X'  // Self-loop, invalid
      ]
    },
    verify: (res) => {
      assert.deepStrictEqual(res.invalid_entries, ['X->X']);
      assert.deepStrictEqual(res.duplicate_edges, []);
      // Hierarchy should only contain A -> B -> D
      assert.strictEqual(res.hierarchies.length, 1);
      assert.strictEqual(res.hierarchies[0].root, 'A');
      assert.deepStrictEqual(res.hierarchies[0].tree, {
        A: { B: { D: {} } }
      });
      assert.strictEqual(res.hierarchies[0].depth, 3);
      assert.strictEqual(res.summary.total_trees, 1);
      assert.strictEqual(res.summary.total_cycles, 0);
      assert.strictEqual(res.summary.largest_tree_root, 'A');
    }
  },
  {
    name: 'Pure Cycle Component',
    input: {
      data: ['B->C', 'C->B'] // 2-node cycle. Smallest node lexicographically is B.
    },
    verify: (res) => {
      assert.strictEqual(res.hierarchies.length, 1);
      assert.strictEqual(res.hierarchies[0].root, 'B');
      assert.deepStrictEqual(res.hierarchies[0].tree, {});
      assert.strictEqual(res.hierarchies[0].has_cycle, true);
      assert.strictEqual(res.hierarchies[0].depth, undefined);
      assert.strictEqual(res.summary.total_cycles, 1);
      assert.strictEqual(res.summary.total_trees, 0);
      assert.strictEqual(res.summary.largest_tree_root, '');
    }
  }
];

let failed = 0;
let passed = 0;

function runTest(index) {
  if (index >= tests.length) {
    console.log(`\nValidation complete: ${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
    return;
  }

  const test = tests[index];
  console.log(`Running test: "${test.name}"...`);
  
  simulatePostRequest(test.input, (err, statusCode, data) => {
    if (err) {
      console.error(`  FAIL: Simulation error:`, err);
      failed++;
      runTest(index + 1);
      return;
    }

    try {
      assert.strictEqual(statusCode, 200);
      test.verify(data);
      console.log(`  PASS`);
      passed++;
    } catch (assertErr) {
      console.error(`  FAIL: Assertion failed:`, assertErr.message);
      console.error(assertErr);
      failed++;
    }
    
    runTest(index + 1);
  });
}

// Start tests
runTest(0);
