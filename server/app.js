import express from 'express';
import { checkStorage, createRegistration, getIdentity, isDuplicateError, listRegistrations } from './store.js';

const app = express();
app.use(express.json({ limit: '100kb' }));

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function validDeviceId(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await checkStorage();
  return res.json({ ok: true, service: 'CampusConnect API' });
}));

app.get('/api/student-identity', asyncRoute(async (req, res) => {
  const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId.trim() : '';
  if (!validDeviceId(deviceId)) return res.status(400).json({ error: 'A valid deviceId is required (1–100 characters).' });
  return res.json(await getIdentity(deviceId));
}));

app.get('/api/registrations', asyncRoute(async (req, res) => {
  const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId.trim() : '';
  const rollNumber = typeof req.query.rollNumber === 'string' ? req.query.rollNumber.trim() : '';
  if (!validDeviceId(deviceId)) return res.status(400).json({ error: 'A valid deviceId is required (1–100 characters).' });
  if (rollNumber.length > 40) return res.status(400).json({ error: 'rollNumber must be 40 characters or fewer.' });
  return res.json(await listRegistrations(deviceId, rollNumber));
}));

app.post('/api/registrations', asyncRoute(async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'A JSON object is required.' });
  }

  const bodySection = typeof body.section === 'string' ? body.section : body.className;
  const required = ['deviceId', 'eventId', 'eventTitle', 'eventDate', 'eventVenue', 'name', 'mobile', 'rollNumber', 'year', 'branch'];
  const missing = required.filter(key => typeof body[key] !== 'string' || !body[key].trim());
  if (typeof bodySection !== 'string' || !bodySection.trim()) missing.push('section');
  if (missing.length) return res.status(400).json({ error: `Missing or invalid required fields: ${missing.join(', ')}.` });
  if (!validDeviceId(body.deviceId.trim())) return res.status(400).json({ error: 'A valid deviceId is required (1–100 characters).' });

  const limits = { eventId: 80, eventTitle: 120, eventVenue: 120, name: 100, rollNumber: 40, year: 20, branch: 40 };
  if (bodySection.trim().length > 40) return res.status(400).json({ error: 'section must be 40 characters or fewer.' });
  for (const [field, max] of Object.entries(limits)) {
    if (body[field].trim().length > max) return res.status(400).json({ error: `${field} must be ${max} characters or fewer.` });
  }
  if (body.name.trim().length < 2) return res.status(400).json({ error: 'Enter a valid full name.' });
  if (!/^[6-9]\d{9}$/.test(body.mobile.trim())) return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
  if (!Number.isFinite(Date.parse(body.eventDate))) return res.status(400).json({ error: 'Invalid event date.' });
  if (!['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(body.year)) return res.status(400).json({ error: 'Choose a valid year.' });
  if (!['CSE', 'CSE (AI & ML)', 'CSE (Data Science)', 'IT', 'ECE', 'EEE', 'Other'].includes(body.branch)) {
    return res.status(400).json({ error: 'Choose a valid branch.' });
  }
  if (body.fee !== undefined && (typeof body.fee !== 'number' || !Number.isFinite(body.fee) || body.fee < 0)) {
    return res.status(400).json({ error: 'Fee must be a non-negative number.' });
  }

  try {
    return res.status(201).json(await createRegistration(body));
  } catch (error) {
    if (isDuplicateError(error)) return res.status(409).json({ error: 'This student is already registered for this event.' });
    throw error;
  }
}));

app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status >= 500) console.error('API error:', err.message);
  const message = status === 400 ? 'Request body must contain valid JSON.'
    : status === 413 ? 'Request body is too large.'
      : 'The server could not complete the request.';
  return res.status(status).json({ error: message });
});

export default app;
