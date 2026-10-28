import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'db.json');
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ nextStudent: 1, students: {}, registrations: [] }, null, 2));
}

app.use(cors());
app.use(express.json({ limit: '100kb' }));

function readDb() {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!db || !Number.isInteger(db.nextStudent) || !db.students || typeof db.students !== 'object'
    || Array.isArray(db.students) || !Array.isArray(db.registrations)) {
    throw new Error('The data file has an invalid format.');
  }
  return db;
}

function writeDb(db) {
  const tempPath = `${dbPath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2));
  fs.renameSync(tempPath, dbPath);
}

function makeIdentity(db, deviceId) {
  if (!Object.hasOwn(db.students, deviceId)) {
    const suffix = String(db.nextStudent++).padStart(4, '0');
    Object.defineProperty(db.students, deviceId, {
      value: { rollNumber: `SDC26-${suffix}`, collegeId: `CC26-${suffix}` },
      enumerable: true, configurable: true, writable: true
    });
    writeDb(db);
  }
  return db.students[deviceId];
}

function validDeviceId(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'CampusConnect API' }));

app.get('/api/student-identity', (req, res) => {
  const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId.trim() : '';
  if (!validDeviceId(deviceId)) return res.status(400).json({ error: 'A valid deviceId is required (1–100 characters).' });
  const db = readDb();
  return res.json(makeIdentity(db, deviceId));
});

app.get('/api/registrations', (req, res) => {
  const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId.trim() : '';
  if (!validDeviceId(deviceId)) return res.status(400).json({ error: 'A valid deviceId is required (1–100 characters).' });
  const db = readDb();
  const identity = Object.hasOwn(db.students, deviceId) ? db.students[deviceId] : null;
  if (!identity) return res.json([]);
  return res.json(db.registrations.filter(registration => registration.rollNumber === identity.rollNumber));
});

app.post('/api/registrations', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'A JSON object is required.' });
  }

  const required = ['deviceId', 'eventId', 'eventTitle', 'eventDate', 'eventVenue', 'name', 'mobile', 'className', 'year', 'branch'];
  const missing = required.filter(key => typeof body[key] !== 'string' || !body[key].trim());
  if (missing.length) return res.status(400).json({ error: `Missing or invalid required fields: ${missing.join(', ')}.` });
  if (!validDeviceId(body.deviceId.trim())) return res.status(400).json({ error: 'A valid deviceId is required (1–100 characters).' });

  const limits = { eventId: 80, eventTitle: 120, eventVenue: 120, name: 100, className: 40, year: 20, branch: 40 };
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

  const db = readDb();
  const deviceId = body.deviceId.trim();
  const identity = makeIdentity(db, deviceId);
  const eventId = body.eventId.trim();
  const duplicate = db.registrations.some(registration => registration.eventId === eventId && registration.rollNumber === identity.rollNumber);
  if (duplicate) return res.status(409).json({ error: 'This student is already registered for this event.' });

  const fee = body.fee ?? 0;
  const registration = {
    registrationId: `REG-${randomUUID()}`,
    eventId, eventTitle: body.eventTitle.trim(), eventDate: body.eventDate,
    eventVenue: body.eventVenue.trim(), name: body.name.trim(), mobile: body.mobile.trim(),
    className: body.className.trim(), year: body.year, branch: body.branch,
    rollNumber: identity.rollNumber, collegeId: identity.collegeId, fee,
    paymentStatus: fee === 0 ? 'Not required' : 'Demo only — not paid',
    createdAt: new Date().toISOString()
  };
  db.registrations.unshift(registration);
  writeDb(db);
  return res.status(201).json(registration);
});

app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status >= 500) console.error('API error:', err.message);
  const message = status === 400 ? 'Request body must contain valid JSON.'
    : status === 413 ? 'Request body is too large.'
      : 'The server could not complete the request.';
  return res.status(status).json({ error: message });
});

app.listen(PORT, () => console.log(`CampusConnect API running at http://localhost:${PORT}`));
