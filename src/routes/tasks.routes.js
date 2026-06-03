const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');

router.get('/', asyncHandler(getAllTasks));
router.get('/search', asyncHandler(getAllTasks));
router.get('/:id', asyncHandler(getTaskById));
router.post('/', asyncHandler(createTask));
router.put('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

module.exports = router;
