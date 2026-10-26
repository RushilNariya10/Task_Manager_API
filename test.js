const http = require('http');
const app = require('./server');

const PORT = 5099;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {};
    if (options.body && !options.headers) {
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

    if (options.body) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('   Practical 4: Express API & Middleware Verification Tests  ');
  console.log('=============================================================\n');

  server = app.listen(PORT);
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(` \x1b[32m✔ PASS\x1b[0m [${total}] ${name}`);
      passed++;
    } catch (err) {
      console.log(` \x1b[31m✘ FAIL\x1b[0m [${total}] ${name}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  function assertEqual(actual, expected, desc) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: expected ${expected}, got ${actual} (${desc || ''})`);
    }
  }

  try {
    // 1. GET /tasks
    await test('GET /tasks - Retrieve all tasks (Status 200)', async () => {
      const res = await request('/tasks');
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(Array.isArray(res.body), true, 'body must be array');
    });

    // 2. POST /tasks (Valid)
    let createdTaskId;
    await test('POST /tasks - Create task with Content-Type application/json (Status 201)', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Test Task in Postman', completed: false }
      });
      assertEqual(res.statusCode, 201, 'HTTP status code');
      assertEqual(res.body.title, 'Test Task in Postman', 'title match');
      createdTaskId = res.body.id;
    });

    // 3. POST /tasks without title
    await test('POST /tasks - Reject missing title (Status 400)', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { completed: false }
      });
      assertEqual(res.statusCode, 400, 'HTTP status code');
      assertEqual(res.body.error, 'Bad Request', 'error name');
    });

    // 4. POST /tasks without Content-Type: application/json
    await test('POST /tasks - Reject missing/wrong Content-Type (Status 415)', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'Not a JSON'
      });
      assertEqual(res.statusCode, 415, 'HTTP status code');
      assertEqual(res.body.error, 'Unsupported Media Type', 'error name');
    });

    // 5. GET /tasks/:id (Valid ID)
    await test('GET /tasks/:id - Retrieve single task by ID (Status 200)', async () => {
      const res = await request(`/tasks/${createdTaskId}`);
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(res.body.id, createdTaskId, 'task id');
    });

    // 6. GET /tasks/:id (Invalid ID format)
    await test('GET /tasks/abc - Route middleware rejects invalid ID format (Status 400)', async () => {
      const res = await request('/tasks/abc');
      assertEqual(res.statusCode, 400, 'HTTP status code');
      assertEqual(res.body.error, 'Bad Request', 'error name');
    });

    // 7. GET /tasks/9999 (Non-existent ID)
    await test('GET /tasks/9999 - Task not found (Status 404)', async () => {
      const res = await request('/tasks/9999');
      assertEqual(res.statusCode, 404, 'HTTP status code');
      assertEqual(res.body.error, 'Not Found', 'error name');
    });

    // 8. PUT /tasks/:id
    await test('PUT /tasks/:id - Update task by ID (Status 200)', async () => {
      const res = await request(`/tasks/${createdTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Updated Task Title', completed: true }
      });
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(res.body.title, 'Updated Task Title', 'updated title');
      assertEqual(res.body.completed, true, 'updated completed');
    });

    // 9. DELETE /tasks/:id
    await test('DELETE /tasks/:id - Delete task by ID (Status 200)', async () => {
      const res = await request(`/tasks/${createdTaskId}`, {
        method: 'DELETE'
      });
      assertEqual(res.statusCode, 200, 'HTTP status code');
      assertEqual(res.body.message, 'Task deleted successfully', 'delete message');
    });

    // 10. Undefined Route
    await test('Fallback Middleware - 404 for undefined routes (Status 404)', async () => {
      const res = await request('/undefined-route');
      assertEqual(res.statusCode, 404, 'HTTP status code');
      assertEqual(res.body.error, 'Not Found', 'error name');
    });

    // 11. Simulated Error - Global Error Handler
    await test('Global Error Handler - Deliberate error caught safely (Status 500)', async () => {
      const res = await request('/tasks/simulate/error');
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
