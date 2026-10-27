const http = require('http');
const { app, server } = require('./server');

const PORT = 5000;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {};
    if (options.body && options.headers === undefined) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const reqOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: Object.assign({}, defaultHeaders, options.headers || {})
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (options.body !== undefined) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(payload);
    }
    req.end();
  });
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('   Practical 4: Express API & Middleware Verification Tests  ');
  console.log('   Matches Lab Report Layout & Postman Execution Steps 7-17  ');
  console.log('=============================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(` \x1b[32m✔ PASS\x1b[0m [Step ${total + 6}] ${name}`);
      passed++;
    } catch (err) {
      console.log(` \x1b[31m✘ FAIL\x1b[0m [Step ${total + 6}] ${name}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  function assertEqual(actual, expected, desc) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)} (${desc || ''})`);
    }
  }

  try {
    // Step 7: GET /tasks
    await test('GET /tasks: returns all tasks (status 200 OK)', async () => {
      const res = await request('/tasks');
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(res.body.length, 2, 'number of tasks');
      assertEqual(res.body[0].title, 'Learn Express', 'task 1 title');
      assertEqual(res.body[1].title, 'Build REST API', 'task 2 title');
    });

    // Step 8: POST /tasks
    await test('POST /tasks: creates a new task (status 201 Created)', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Write lab report' }
      });
      assertEqual(res.statusCode, 201, 'HTTP status code');
      assertEqual(res.body.id, 3, 'task id');
      assertEqual(res.body.title, 'Write lab report', 'task title');
      assertEqual(res.body.completed, false, 'task completed default');
    });

    // Step 9: PUT /tasks/3
    await test('PUT /tasks/3: updates the task (status 200 OK)', async () => {
      const res = await request('/tasks/3', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { completed: true }
      });
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(res.body.id, 3, 'task id');
      assertEqual(res.body.title, 'Write lab report', 'task title preserved');
      assertEqual(res.body.completed, true, 'task completed updated');
    });

    // Step 10: DELETE /tasks/1
    await test('DELETE /tasks/1: deletes a task (status 200 OK)', async () => {
      const res = await request('/tasks/1', {
        method: 'DELETE'
      });
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(res.body.message, 'Task deleted', 'message');
      assertEqual(res.body.task.id, 1, 'deleted task id');
    });

    // Step 11: GET /tasks after delete
    await test('GET /tasks after delete: task 1 is gone, task 3 shows the update (status 200 OK)', async () => {
      const res = await request('/tasks');
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(res.body.length, 2, 'task count');
      assertEqual(res.body[0].id, 2, 'first task id');
      assertEqual(res.body[1].id, 3, 'second task id');
      assertEqual(res.body[1].completed, true, 'second task completed');
    });

    // Step 12: PUT /tasks/99
    await test('PUT /tasks/99: unknown task ID returns 404 Not Found', async () => {
      const res = await request('/tasks/99', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { completed: true }
      });
      assertEqual(res.statusCode, 404, 'HTTP status code');
      assertEqual(res.body.error, 'Task not found', 'error message');
    });

    // Step 13: POST /tasks without title
    await test('POST /tasks without title: validation error 400 Bad Request', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {}
      });
      assertEqual(res.statusCode, 400, 'HTTP status code');
      assertEqual(res.body.error, 'Title is required', 'error message');
    });

    // Step 14: POST /tasks with Content-Type text/plain
    await test('POST /tasks with Content-Type text/plain: rejected by middleware with 415', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'title=abc'
      });
      assertEqual(res.statusCode, 415, 'HTTP status code');
      assertEqual(res.body.error, 'Content-Type must be application/json', 'error message');
    });

    // Step 15: DELETE /tasks/abc
    await test('DELETE /tasks/abc: route-specific middleware rejects invalid ID format with 400', async () => {
      const res = await request('/tasks/abc', {
        method: 'DELETE'
      });
      assertEqual(res.statusCode, 400, 'HTTP status code');
      assertEqual(res.body.error, 'Task ID must be a number', 'error message');
    });

    // Step 16: GET /unknown
    await test('GET /unknown: undefined route returns structured JSON 404', async () => {
      const res = await request('/unknown');
      assertEqual(res.statusCode, 404, 'HTTP status code');
      assertEqual(res.body.error, 'Route GET /unknown not found', 'error message');
    });

    // Step 17: GET /test-error
    await test('GET /test-error: error passed to next(err), global error handler returns 500', async () => {
      const res = await request('/test-error');
      assertEqual(res.statusCode, 500, 'HTTP status code');
      assertEqual(res.body.error, 'Something went wrong', 'error message');
    });

  } finally {
    server.close();
    console.log('\n-------------------------------------------------------------');
    console.log(` Results: ${passed} of ${total} tests passed (${Math.round((passed/total)*100)}%)`);
    console.log('-------------------------------------------------------------\n');
    if (passed !== total) process.exit(1);
  }
}

runTests();
