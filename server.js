const express = require('express');
const app = express();

// ── 1. Built-in middleware to parse JSON request bodies ───────────
app.use(express.json());

// ── 2. Request logging middleware (applied globally) ───────────────
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next(); // MUST call next() or the request hangs indefinitely
});

// ── 3. Supplementary: Reject POST/PUT missing application/json ─────
app.use((req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json'
      });
    }
  }
  next();
});

// ── 4. In-Memory Data Store (Temporary Storage) ────────────────────
let tasks = [
  { id: 1, title: 'Learn Node.js and Express', completed: false },
  { id: 2, title: 'Build RESTful API with CRUD routes', completed: true },
  { id: 3, title: 'Test endpoints in Postman', completed: false }
];
let nextId = 4;

// ── 5. Supplementary: Route-specific middleware to validate ID ─────
function validateTaskId(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid task ID. ID must be a positive integer.'
    });
  }
  req.taskId = id;
  next();
}

// ── 6. CRUD Endpoints ──────────────────────────────────────────────

// 1. GET /tasks - Read all tasks
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// 2. GET /tasks/:id - Read single task by ID
app.get('/tasks/:id', validateTaskId, (req, res, next) => {
  try {
    const task = tasks.find(t => t.id === req.taskId);
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.taskId} not found`
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// 3. POST /tasks - Create a new task
app.post('/tasks', (req, res, next) => {
  try {
    const { title, completed = false } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "title" is required'
      });
    }

    const newTask = {
      id: nextId++,
      title: title.trim(),
      completed: Boolean(completed)
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// 4. PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', validateTaskId, (req, res, next) => {
  try {
    const index = tasks.findIndex(t => t.id === req.taskId);
    if (index === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.taskId} not found`
      });
    }

    const { title, completed } = req.body;
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Field "title" cannot be empty'
        });
      }
      tasks[index].title = title.trim();
    }
    if (completed !== undefined) {
      tasks[index].completed = Boolean(completed);
    }

    res.status(200).json(tasks[index]);
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /tasks/:id - Delete a task by ID
app.delete('/tasks/:id', validateTaskId, (req, res, next) => {
  try {
    const index = tasks.findIndex(t => t.id === req.taskId);
    if (index === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.taskId} not found`
      });
    }

    const deleted = tasks.splice(index, 1)[0];
    res.status(200).json({
      message: 'Task deleted successfully',
      deletedTask: deleted
    });
  } catch (err) {
    next(err);
  }
});

// Endpoint to simulate an error for testing the Global Error Handler
app.get('/tasks/simulate/error', (req, res, next) => {
  const err = new Error('Deliberate internal server error for testing');
  next(err); // Pass error to global error handler
});

// ── 7. Supplementary: 404 handler for undefined routes ─────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ── 8. Global Error Handling Middleware (MUST BE LAST) ─────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// ── 9. Start Server ────────────────────────────────────────────────
const PORT = 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
