# Practical 4: Building a RESTful API with Node.js and Express

**Subject:** Advanced Web Development Frameworks (ITUE301)  
**Semester:** 5th Semester B.Tech (IT)  
**Institute:** Chandubhai S. Patel Institute of Technology (CSPIT) / Devang Patel Institute of Advance Technology and Research (DEPSTAR)  
**University:** Charotar University of Science and Technology (CHARUSAT)  
**Student Name:** Rushil Nariya  
**Student ID / Roll No:** 24IT055  
**Course Outcomes / Program Outcomes:** CO2 / PO3, PO5  

---

## 🎯 Objective
To design and implement a RESTful backend server with complete CRUD endpoints using the Express middleware pipeline, incorporating request logging, Content-Type verification, route-specific parameter validation, custom 404 handling, and centralized global error handling.

---

## 🏗️ Architecture & Middleware Pipeline

```text
Client (Browser / Postman / Automated Test Suite)
       │
       ▼
 [1. express.static('public')]
       │ (Serves modern interactive REST API Explorer Dashboard)
       ▼
 [2. express.json()]
       │ (Parses incoming JSON request bodies)
       ▼
 [3. Request Logging Middleware (Global)]
       │ (Logs: METHOD URL - ISO Timestamp)
       ▼
 [4. Content-Type Validation Middleware (Supplementary)]
       │ (Rejects non-JSON POST/PUT with 415 Unsupported Media Type)
       ▼
 Express Router
   ├── GET    /tasks               → getAllTasks
   ├── GET    /tasks/:id           → [validateTaskId] → getTaskById
   ├── POST   /tasks               → createTask
   ├── PUT    /tasks/:id           → [validateTaskId] → updateTask
   ├── DELETE /tasks/:id           → [validateTaskId] → deleteTask
   └── GET    /tasks/simulate/error→ next(err) [Simulated Server Failure]
       │
       ▼
 [5. 404 Undefined Route Handler (Supplementary)]
       │ (Returns structured JSON { error: 'Not Found', message: ... })
       ▼
 [6. Centralized Global Error Handler (MUST BE DEFINED LAST)]
       │ (Catches unhandled errors, logs stack trace to server console,
       ▼  and returns safe HTTP 500 JSON without exposing internal stack)
```

---

## 📡 REST API Specification

| Method | Endpoint | Headers | Request Body | Status Code | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/tasks` | None | None | `200 OK` | Retrieves all tasks from in-memory array |
| **GET** | `/tasks/:id` | None | None | `200 OK` | Retrieves a single task by ID |
| **GET** | `/tasks/:id` | None | None | `400 Bad Request` | ID is not a positive integer (e.g. `/tasks/abc`) |
| **GET** | `/tasks/:id` | None | None | `404 Not Found` | Task with given ID does not exist |
| **POST** | `/tasks` | `Content-Type: application/json` | `{"title": "...", "completed": false}` | `201 Created` | Creates a new task with auto-increment ID |
| **POST** | `/tasks` | `Content-Type: application/json` | `{}` (missing title) | `400 Bad Request` | Validation failure: title is required |
| **POST** | `/tasks` | `Content-Type: text/plain` | (non-JSON payload) | `415 Unsupported Media Type` | Supplementary rejection middleware |
| **PUT** | `/tasks/:id` | `Content-Type: application/json` | `{"title": "...", "completed": true}` | `200 OK` | Updates task fields |
| **DELETE**| `/tasks/:id` | None | None | `200 OK` | Deletes task by ID |
| **GET** | `/tasks/simulate/error` | None | None | `500 Internal Server Error` | Demonstrates Global Error Handler catching deliberate error |
| **ANY** | `/*` (undefined) | None | None | `404 Not Found` | Supplementary structured JSON 404 fallback |

---

## 🔬 Key Questions & Conceptual Analysis

### 1. Why must the error handling middleware be defined last in the middleware chain?
> **Answer:** Express processes middleware sequentially in the exact order they are registered with `app.use()`. When an endpoint or middleware encounters an error and calls `next(err)`, Express skips all subsequent regular middleware functions and searches downstream for the first error-handling middleware (identified by having 4 arguments: `(err, req, res, next)`). If the error handler was placed before the routes, any error thrown within those route handlers would occur *after* the error middleware in execution order, bypassing it completely and leaving the error unhandled (potentially crashing Node or causing requests to hang). Defining the error handling middleware last guarantees that it acts as a universal safety net for the entire application.

### 2. What is the difference between `app.use()` and a route-specific middleware?
> **Answer:** 
> - **`app.use()` (Application-level / Global Middleware):** Executes for every incoming HTTP request that matches the specified path prefix (or all requests if no path is passed). Examples include `express.json()`, global request logging, and CORS handling.
> - **Route-specific Middleware:** Attached directly to specific route definitions (e.g. `app.get('/tasks/:id', validateTaskId, controller)`). It executes **only** when both the HTTP method and exact route pattern match. This is ideal for endpoint-targeted validation (such as checking parameter formats or user permissions) without incurring unnecessary overhead on unrelated endpoints.

### 3. Why is it considered bad practice to send raw error stack traces to the client?
> **Answer:** 
> 1. **Security Vulnerability / Information Disclosure:** Raw stack traces expose sensitive internal implementation details, including file directory paths, operating system information, database query structures, framework versions, and third-party library names. Attackers can exploit this reconnaissance to identify known CVEs or craft targeted injection attacks.
> 2. **Poor User Experience:** Raw stack traces are cryptic and unhelpful for normal end-users. Instead, APIs should log the detailed stack trace on the server for developer debugging and return a sanitized, consistent JSON error message (e.g. `{ "error": "Internal Server Error", "message": "Something went wrong" }`) with an appropriate HTTP status code (500).

---

## 🛠️ Troubleshooting Guide

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| **Request hangs indefinitely** | Custom middleware forgot to call `next()` or send a response (`res.json()`). | Ensure every middleware branch either invokes `next()` or terminates the response cycle with `res.status(...).json(...)`. |
| **`req.body` is `undefined` on POST/PUT** | Missing `express.json()` middleware before route definitions. | Add `app.use(express.json());` at the top of the middleware pipeline. |
| **Error handler never triggers** | Error handler defined before routes, or error was swallowed without calling `next(err)`. | Place error handler as the last `app.use()` call, and always pass errors to `next(err)` inside `try/catch` blocks. |
| **Postman shows 'Cannot GET /tasks'** | Route path mismatch, server not running, or listening on a different port. | Verify path spelling (`/tasks`), check server console for active port (`http://localhost:5000`), and restart server. |

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will start on `http://localhost:5000`.

### 3. Open Interactive Visual API Explorer Dashboard
Navigate to `http://localhost:5000` in your web browser to test all CRUD endpoints, view live middleware execution logs, and verify status codes interactively!

### 4. Run Automated Test Suite
```bash
npm test
```
Executes all 11 unit and integration tests covering the 4 CRUD routes, ID validation, Content-Type enforcement, 404 fallback, and the 500 global error handler.
