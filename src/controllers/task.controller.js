const Task = require('../models/task.model');
const { successResponse, errorResponse } = require('../utils/response.util');

const getAllTasks = async (req, res) => {
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status.toLowerCase();
  }

  if (req.query.priority) {
    filter.priority = req.query.priority.toLowerCase();
  }

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  return successResponse(res, 200, 'Tasks fetched successfully', tasks);
};

const getTaskById = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return errorResponse(res, 404, 'Task not found');
  return successResponse(res, 200, 'Task fetched successfully', task);
};

const createTask = async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.title) {
    return errorResponse(res, 400, 'Title is required');
  }

  const task = await Task.create(payload);
  return successResponse(res, 200, 'Task created successfully', task);
};

const updateTask = async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!task) return errorResponse(res, 404, 'Task not found');
  return successResponse(res, 200, 'Task updated successfully', task);
};

const deleteTask = async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return errorResponse(res, 404, 'Task not found');
  return successResponse(res, 200, 'Task deleted successfully', task);
};

const getStats = async (req, res) => {
  const total = await Task.countDocuments();
  const completed = await Task.countDocuments({ status: 'completed' });
  const pending = await Task.countDocuments({ status: 'pending' });

  const priorityGroups = await Task.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);

  const stats = {
    totalRecords: total,
    completedRecords: completed,
    pendingRecords: pending,
    priorityGrouping: priorityGroups.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };

  return successResponse(res, 200, 'Stats fetched successfully', stats);
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getStats };
