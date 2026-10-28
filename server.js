const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');

const app = express();

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// GET - Get all tasks
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET - Get single task by ID (Supplementary Problem)
app.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST - Create a new task
app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;
    const task = await Task.create({
      title,
      description,
      completed,
      priority
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PUT - Update a task
app.put('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete a task
app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }
    res.status(200).json({
      message: 'Task deleted successfully',
      task
    });
  } catch (err) {
    next(err);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  // Return clean, structured validation errors instead of raw Mongoose error objects
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Handle invalid MongoDB ObjectId format
  if (err.name === 'CastError') {
    return res.status(404).json({
      message: 'Task not found'
    });
  }

  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start Server
const PORT = process.env.PORT || 3000;

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
