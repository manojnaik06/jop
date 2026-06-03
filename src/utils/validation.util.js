const validator = require('validator');

const normalizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const sanitizeTask = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const title = normalizeText(raw.title || raw.name || raw.task || '');
  if (!title) return null;

  const description = normalizeText(raw.description || raw.details || '');
  const status = normalizeText(raw.status || 'pending').toLowerCase();
  const priority = normalizeText(raw.priority || 'medium').toLowerCase();
  const dueDate = raw.dueDate || raw.due_date || raw.deadline || null;

  const validStatus = ['pending', 'in-progress', 'completed'].includes(status) ? status : 'pending';
  const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

  let parsedDate = null;
  if (dueDate) {
    const dateString = typeof dueDate === 'string' ? dueDate : `${dueDate}`;
    if (validator.isISO8601(dateString)) {
      parsedDate = new Date(dateString);
    }
  }

  const externalId = normalizeText(raw.id || raw.taskId || raw.externalId || '');

  return {
    externalId: externalId || undefined,
    title,
    description,
    status: validStatus,
    priority: validPriority,
    dueDate: parsedDate,
    metadata: raw.metadata || {},
  };
};

module.exports = { sanitizeTask };
