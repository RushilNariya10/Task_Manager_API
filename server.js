const express = require("express");
const app = express();

// In-memory storage (no database yet)
let tasks = [
  { id: 1, title: "Learn Express", completed: false },
  { id: 2, title: "Build REST API", completed: false },
];
let nextId = 3;

// ---------- Middleware ----------
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Reject POST/PUT requests without Content-Type: application/json
app.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    const type = req.headers["content-type"] || "";
    if (!type.includes("application/json")) {
      return res
        .status(415)
        .json({ error: "Content-Type must be application/json" });
    }
  }
  next();
});

app.use(express.json());

// Route-specific middleware: validate task ID format
function validateId(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: "Task ID must be a number" });
  }
  next();
}

// ---------- Controllers ----------
const getAllTasks = (req, res) => {
  res.status(200).json(tasks);
};

const createTask = (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  const task = { id: nextId++, title, completed: false };
  tasks.push(task);
  res.status(201).json(task);
};

const updateTask = (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.completed !== undefined) task.completed = req.body.completed;
  res.status(200).json(task);
};

const deleteTask = (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  const [removed] = tasks.splice(index, 1);
  res.status(200).json({ message: "Task deleted", task: removed });
};

// ---------- Routes ----------
app.get("/tasks", getAllTasks);
app.post("/tasks", createTask);
app.put("/tasks/:id", validateId, updateTask);
app.delete("/tasks/:id", validateId, deleteTask);

// Route to demonstrate the global error handler
app.get("/test-error", (req, res, next) => {
  next(new Error("Deliberate error for testing"));
});

// 404 handler for undefined routes (JSON response)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

const server = app.listen(5000, () => console.log("Server running on port 5000"));

module.exports = { app, server, tasks };
