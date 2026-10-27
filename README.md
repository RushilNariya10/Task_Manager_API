# Practical 4: Building a RESTful API with Node.js and Express

**Subject:** Advanced Web Development Frameworks (ITUE301)  
**Semester:** 5th Semester B. Tech (IT / CE / CSE / AIML)  
**Institute:** Chandubhai S. Patel Institute of Technology (CSPIT) / Devang Patel Institute of Advance Technology and Research (DEPSTAR)  
**University:** Charotar University of Science and Technology (CHARUSAT)  
**Student Name:** Rushil Nariya  
**Student ID:** 24IT055  
**Course Outcomes / Program Outcomes:** CO2 / PO3, PO5  
**Tech Stack:** Node.js, Express.js, JavaScript (ES6+), Thunder Client / Postman, Visual Studio Code  

---

## 📋 Problem Statement & Objectives

### Problem Statement:
- Build a Node/Express backend for a **Task Management system**.
- Implement REST endpoints for creating, reading, updating, and deleting tasks (in-memory array, no database yet).
- Apply a request logging middleware that logs **method, URL, and timestamp** for every incoming request.
- Apply a global error handling middleware as the **last middleware** in the pipeline.
- Use correct HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `415 Unsupported Media Type`, `500 Internal Server Error`) for each response.
- **Supplementary Requirements:**
  - Content-Type check for `POST`/`PUT` requests (rejects missing or non-`application/json` with `415 Unsupported Media Type`).
  - Route-specific task ID validation (`validateId` middleware rejecting non-numeric IDs with `400 Bad Request`).
  - JSON 404 handler for undefined routes (`Route METHOD URL not found`).

---

## 🏛️ Architecture & Middleware Pipeline

```
Client (Postman / Browser / Test Runner)
                  │
                  ▼
      [1. Logging Middleware]
   (Logs: METHOD URL - ISO Timestamp)
                  │
                  ▼
  [2. Content-Type Check Middleware]
 (Rejects non-application/json on POST/PUT with 415)
                  │
                  ▼
         [3. express.json()]
      (Parses JSON request bodies)
                  │
                  ▼
           Express Router
 ├── GET    /tasks              ──► getAllTasks (200 OK)
 ├── POST   /tasks              ──► createTask (201 Created / 400 Bad Request)
 ├── PUT    /tasks/:id          ──► [validateId] ──► updateTask (200 OK / 404 Not Found)
 ├── DELETE /tasks/:id          ──► [validateId] ──► deleteTask (200 OK / 404 Not Found)
 └── GET    /test-error         ──► passes error to next(err)
                  │
                  ▼
       [4. Custom JSON 404 Handler]
   (Handles undefined routes, returns 404 JSON)
                  │
                  ▼
    [5. Global Error Handling Middleware]
 (MUST BE LAST: Logs stack to console, returns safe 500 JSON)
```

---

## 📁 Repository Structure

```
task-manager-api/
├── .gitignore                                           # Excludes node_modules and OS cache
├── package.json                                         # Project dependencies & npm scripts
├── server.js                                            # Express app, middleware pipeline & CRUD controllers
├── test.js                                              # Automated test suite matching Steps 7 to 17
├── Practical_4_Task_Manager_API.postman_collection.json # Exported Postman / Thunder Client collection
├── README.md                                            # Comprehensive lab documentation & analysis
└── assets/                                              # Screenshots and institutional logos
```

---

## 📡 REST API Endpoints Specification

| Step | HTTP Method | Endpoint | Headers | Request Body | Status Code | Description |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **7** | `GET` | `/tasks` | None | None | `200 OK` | Retrieves all tasks |
| **8** | `POST` | `/tasks` | `Content-Type: application/json` | `{"title": "Write lab report"}` | `201 Created` | Creates a new task (auto ID = 3) |
| **9** | `PUT` | `/tasks/3` | `Content-Type: application/json` | `{"completed": true}` | `200 OK` | Updates task status |
| **10** | `DELETE`| `/tasks/1` | None | None | `200 OK` | Deletes task with ID 1 |
| **11** | `GET` | `/tasks` | None | None | `200 OK` | Verifies deletion (id: 1 removed, id: 3 updated) |
| **12** | `PUT` | `/tasks/99`| `Content-Type: application/json` | `{"completed": true}` | `404 Not Found` | Returns `{"error": "Task not found"}` |
| **13** | `POST` | `/tasks` | `Content-Type: application/json` | `{}` | `400 Bad Request` | Returns `{"error": "Title is required"}` |
| **14** | `POST` | `/tasks` | `Content-Type: text/plain` | `title=abc` | `415 Unsupported Media Type` | Content-Type check middleware |
| **15** | `DELETE`| `/tasks/abc`| None | None | `400 Bad Request` | Route-specific ID validator (`validateId`) |
| **16** | `GET` | `/unknown` | None | None | `404 Not Found` | Custom structured JSON 404 handler |
| **17** | `GET` | `/test-error`| None | None | `500 Internal Server Error` | Centralized global error handler |

---

## 💻 Source Code (`server.js`)

```javascript
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
```

---

## 🚀 Execution & Verification

### 1. Starting the Server
```bash
npm start
```
Console Output:
```text
Server running on port 5000
```

### 2. Running the Verification Test Suite
```bash
npm test
```
All 11 endpoints and middleware layers are tested sequentially matching Steps 7 to 17:
```text
=============================================================
   Practical 4: Express API & Middleware Verification Tests  
   Matches Lab Report Layout & Postman Execution Steps 7-17  
=============================================================

Server running on port 5000
GET /tasks - 2026-10-27T07:07:29.251Z
 ✔ PASS [Step 7] GET /tasks: returns all tasks (status 200 OK)
POST /tasks - 2026-10-27T07:07:29.267Z
 ✔ PASS [Step 8] POST /tasks: creates a new task (status 201 Created)
PUT /tasks/3 - 2026-10-27T07:07:29.835Z
 ✔ PASS [Step 9] PUT /tasks/3: updates the task (status 200 OK)
DELETE /tasks/1 - 2026-10-27T07:07:29.839Z
 ✔ PASS [Step 10] DELETE /tasks/1: deletes a task (status 200 OK)
GET /tasks - 2026-10-27T07:07:29.840Z
 ✔ PASS [Step 11] GET /tasks after delete: task 1 is gone, task 3 shows the update (status 200 OK)
PUT /tasks/99 - 2026-10-27T07:07:29.841Z
 ✔ PASS [Step 12] PUT /tasks/99: unknown task ID returns 404 Not Found
POST /tasks - 2026-10-27T07:07:29.842Z
 ✔ PASS [Step 13] POST /tasks without title: validation error 400 Bad Request
POST /tasks - 2026-10-27T07:07:29.843Z
 ✔ PASS [Step 14] POST /tasks with Content-Type text/plain: rejected by middleware with 415
DELETE /tasks/abc - 2026-10-27T07:07:29.844Z
 ✔ PASS [Step 15] DELETE /tasks/abc: route-specific middleware rejects invalid ID format with 400
GET /unknown - 2026-10-27T07:07:29.845Z
 ✔ PASS [Step 16] GET /unknown: undefined route returns structured JSON 404
GET /test-error - 2026-10-27T07:07:29.846Z
Error: Deliberate error for testing
    at server.js:82:8
 ✔ PASS [Step 17] GET /test-error: error passed to next(err), global error handler returns 500

-------------------------------------------------------------
 Results: 11 of 11 tests passed (100%)
-------------------------------------------------------------
```

---

## 🔬 Key Questions & Conceptual Analysis

### 1. Why must the error handling middleware be defined last?
> **Answer:** Express processes middleware strictly in the sequence it was added to the app. A function with four parameters `(err, req, res, next)` can only catch errors coming from the layers registered before it. If it sits earlier in the file, any error thrown by a later route bypasses it and Express responds with its built-in default error page instead.

### 2. Difference between `app.use()` and a route-specific middleware?
> **Answer:** `app.use()` registers middleware that is applied to all incoming requests, such as the request logger. Route-specific middleware is attached directly to a particular route, like `validateId` on `PUT` and `DELETE /tasks/:id`, so it executes only when that exact route is hit.

### 3. Why not send raw error stack traces to the client?
> **Answer:** A stack trace exposes internal details such as file paths, library versions, and how the code is organised, which an attacker can use to find weaknesses. So the full error is only written to the server log with `console.error`, and the client gets a brief, generic message with status 500 (`{ "error": "Something went wrong" }`).

### 4. Why call `next()` in middleware?
> **Answer:** If a middleware does not call `next()` or send a response, the request is left waiting and never completes. The logger and the Content-Type check therefore call `next()` so that control moves on to the next function in the pipeline.

---

## 🛠️ Troubleshooting Guide

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| **Request hangs indefinitely** | Middleware does not call `next()` or send a response. | Ensure every middleware either calls `next()` or ends the response with `res.status().json()`. |
| **`req.body` is `undefined`** | Missing `express.json()` middleware. | Add `app.use(express.json());` before route definitions. |
| **Error handler never triggers** | Error handler defined before routes, or errors not passed via `next(err)`. | Move error handler to be the last `app.use()`; call `next(err)` inside `try/catch` or error routes. |
| **Postman shows 'Cannot GET /tasks'** | Route path mismatch or server not restarted after changes. | Verify route path spelling and restart the Node server. |
| **Status 415 on POST/PUT** | Missing `Content-Type: application/json` header in client request. | Add `Content-Type: application/json` header in Postman / Thunder Client. |
