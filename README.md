# Task Manager REST API (Practicals 4 & 5)

**Charotar University of Science and Technology (CHARUSAT)**  
**Faculty of Technology and Engineering (FTE)**  
**Department of Information Technology**  
**Subject:** Advanced Web Development Frameworks (`ITUE301`) | **Semester:** 5th  

- **Student Name:** Rushil Nariya  
- **Student ID:** 24IT055  
- **GitHub Repository:** [https://github.com/RushilNariya10/Task_Manager_API](https://github.com/RushilNariya10/Task_Manager_API)  
- **Tech Stack:** Node.js, Express.js, MongoDB, Mongoose ODM, JavaScript (ES6+), Postman, MongoDB Compass  

---

## 📌 Repository Evolution Overview

This repository houses the evolution of the Task Management API across Practicals 4 and 5:

1. **Practical 4 (In-Memory REST API & Middleware Pipeline):**
   - Built a modular Express.js REST API with in-memory storage.
   - Designed request logging middleware (`METHOD URL - Timestamp`).
   - Implemented strict Content-Type filtering (rejecting non-`application/json` on `POST`/`PUT` with `415`).
   - Route-specific numeric ID validation middleware (`400 Bad Request`).
   - JSON 404 handler for undefined routes and global 500 error handler.
   - Evaluated against the Richardson Maturity Model (satisfying Level 2).

2. **Practical 5 (MongoDB Integration & Schema Design with Mongoose):**
   - Connected live MongoDB database using Mongoose ODM.
   - Defined strict `Task` schema with validation (`title` required, `completed` default false, `createdAt` default `Date.now`).
   - Replaced in-memory operations with Mongoose model methods (`Task.find()`, `Task.create()`, `Task.findByIdAndUpdate()`, `Task.findByIdAndDelete()`).
   - Implemented structured JSON validation error formatting (no raw Mongoose error leakage).
   - **Supplementary Features:**
     - `priority` field with enum constraint (`['low', 'medium', 'high']`).
     - Pre-save lifecycle hook automatically trimming whitespace from `title`.
     - `GET /tasks/:id` endpoint returning structured `404 Not Found` JSON if task does not exist.

---

## 🏗️ Architecture & Data Pipeline (Practical 5)

```text
  +-------------------------------------------------------------+
  |                        Client (Postman)                     |
  +-------------------------------------------------------------+
                                 | HTTP Request
                                 v
  +-------------------------------------------------------------+
  |                      Express Application                    |
  |  - JSON Body Parser (express.json())                        |
  |  - Route Handlers (/tasks, /tasks/:id)                      |
  +-------------------------------------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |                         Mongoose ODM                        |
  |  - Task Schema Definition                                   |
  |  - Schema Validation (required, enum, defaults)             |
  |  - Document Lifecycle Hooks (pre('save') trim hook)         |
  +-------------------------------------------------------------+
                                 | (Validated Query / Mutation)
                                 v
  +-------------------------------------------------------------+
  |                       MongoDB Database                      |
  |                       └── tasks collection                  |
  |                           { _id, title, description,        |
  |                             completed, priority, createdAt }|
  +-------------------------------------------------------------+
```

---

## 🧠 Key Questions & Conceptual Analysis

### Q1: What is the purpose of a schema in a NoSQL database like MongoDB, given that MongoDB itself is schema-less?
**Analysis:**  
While MongoDB is natively schema-less at the storage layer (allowing each document in a collection to contain completely arbitrary fields and polymorphic data), production web applications require predictability, structural integrity, and type safety.  
Mongoose ODM implements an **application-level schema layer** that enforces:
1. **Predictable Data Models:** Ensures all documents in a collection share expected keys and data types.
2. **Default Values & Sanitization:** Automatically assigns defaults (e.g., `completed: false`, `createdAt: Date.now()`) and applies transformations (e.g., trimming whitespace).
3. **Business Logic & Middleware:** Encapsulates validators, getters/setters, instance methods, and lifecycle hooks (`pre` and `post` hooks) within the application domain.
4. **Data Integrity Without Database Lock-in:** Provides strict validation before documents reach the database wire protocol, eliminating data corruption without sacrificing MongoDB's dynamic scaling benefits.

---

### Q2: Why is it important to define required fields and default values at the schema level rather than relying on frontend validation alone?
**Analysis:**  
Relying solely on client-side (frontend) validation is an anti-pattern and a severe security risk:
1. **Bypass Vulnerability:** Any client can bypass frontend checks by sending direct HTTP requests using tools like Postman, curl, scripts, or malicious actors.
2. **Single Source of Truth:** Schema-level enforcement acts as the authoritative gatekeeper. Even if multiple clients (mobile app, web app, microservices, CLI tools) interact with the API, the database invariants remain uncompromised.
3. **Fault Tolerance:** Automated defaults (`Date.now`, `completed: false`) prevent `undefined` or `null` bugs downstream in business logic.
4. **Defense in Depth:** Frontend validation improves user experience by providing immediate feedback; schema-level validation guarantees data persistence integrity and security.

---

### Q3: What happens internally when a document fails Mongoose validation — where is the request stopped?
**Analysis:**  
1. When `Task.create()` or `document.save()` is executed, Mongoose initiates the internal validation cycle:
   - It runs built-in validators (`required`, `enum`, `min`, `max`, `match`) and custom validator functions across all schema paths.
2. If any validation constraint fails:
   - Mongoose constructs a `ValidationError` object containing individual `ValidatorError` entries keyed by path (e.g., `err.errors['title']`).
   - **The operation is halted immediately in memory inside the Node.js process.**
   - **No network packet / command is ever sent across the wire to the MongoDB engine.**
3. The returned Promise rejects with the `ValidationError`.
4. Inside our `try/catch` block, `next(err)` passes the error to Express's global error handler.
5. Our custom error handler intercepts `err.name === 'ValidationError'` and serializes a clean, structured JSON response (HTTP 400 Bad Request) instead of leaking raw Mongoose stack traces.

---

## 📡 REST API Endpoint Specification

| Method | Endpoint | Description | Request Body | Success Status | Error Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/tasks` | Retrieve all tasks from MongoDB | None | `200 OK` | `500 Internal Server Error` |
| **GET** | `/tasks/:id` | Retrieve single task by ObjectId | None | `200 OK` | `404 Not Found` |
| **POST** | `/tasks` | Create new task document | `title`, `description`, `completed`, `priority` | `201 Created` | `400 Bad Request` |
| **PUT** | `/tasks/:id` | Update existing task document | Updatable fields | `200 OK` | `404 Not Found`, `400 Bad Request` |
| **DELETE** | `/tasks/:id` | Remove task document from collection | None | `200 OK` | `404 Not Found` |

---

## 📂 Project Directory Structure

```text
D:\F\SEM 5\AWDF\P4\
├── .env                                            # MongoDB URI & PORT (ignored via .gitignore)
├── .env.example                                    # Environment variable template
├── .gitignore                                      # Excludes node_modules/ and .env
├── package.json                                    # Project metadata and dependencies
├── server.js                                       # Express server with Mongoose CRUD routes & error handlers
├── test.js                                         # 10 automated test cases (CRUD, hooks, validation)
├── Practical_5_MongoDB_Mongoose.postman_collection.json # Practical 5 Postman collection
├── Practical_4_Task_Manager_API.postman_collection.json # Practical 4 Postman collection
├── README.md                                       # Full documentation
├── models/
│   └── Task.js                                     # Mongoose Task schema and model
└── assets/
    ├── postman_ss/                                 # Practical 4 screenshots
    └── p5_screenshots/                             # Practical 5 screenshots
```

---

## 🚀 Execution & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Verification Tests (10/10 Passed)
```bash
npm test
```

### 3. Run Live Server
```bash
npm start
```
Server runs at `http://localhost:3000`.
