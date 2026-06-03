const axios = require('axios');
const Task = require('../models/task.model');
const { sanitizeTask } = require('../utils/validation.util');

const fetchToken = async () => {
  const baseUrl = process.env.EXTERNAL_API_BASE_URL;
  const studentId = process.env.STUDENT_ID;
  const password = process.env.STUDENT_PASSWORD;
  if (!baseUrl || !studentId || !password) {
    throw new Error('External API credentials are not configured');
  }

  const response = await axios.post(`${baseUrl}/public/token`, {
    studentId,
    password,
  });

  if (!response?.data?.token) {
    throw new Error('Token response was invalid');
  }

  return response.data.token;
};

const fetchPrivateData = async (token) => {
  const baseUrl = process.env.EXTERNAL_API_BASE_URL;
  const response = await axios.get(`${baseUrl}/private/data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const syncDataset = async () => {
  const token = await fetchToken();
  const payload = await fetchPrivateData(token);
  const records = Array.isArray(payload) ? payload : payload?.data || [];

  let totalFetched = 0;
  let inserted = 0;
  let duplicates = 0;
  let rejected = 0;

  const operations = [];
  const queuedKeys = new Set();

  for (const rawItem of records) {
    totalFetched += 1;
    const sanitized = sanitizeTask(rawItem);
    if (!sanitized) {
      rejected += 1;
      continue;
    }

    const dedupeKey = sanitized.externalId ? `id:${sanitized.externalId}` : `title:${sanitized.title}`;
    if (queuedKeys.has(dedupeKey)) {
      duplicates += 1;
      continue;
    }

    const query = sanitized.externalId ? { externalId: sanitized.externalId } : { title: sanitized.title };
    const existing = await Task.findOne(query).lean();
    if (existing) {
      duplicates += 1;
      queuedKeys.add(dedupeKey);
      continue;
    }

    queuedKeys.add(dedupeKey);
    operations.push({ insertOne: { document: sanitized } });
  }

  if (operations.length > 0) {
    const result = await Task.bulkWrite(operations, { ordered: false });
    inserted = result.insertedCount || operations.length;
  }

  return { success: true, totalFetched, inserted, duplicates, rejected };
};

module.exports = { syncDataset };
