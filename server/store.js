import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'db.json');
const databaseUrl = process.env.DATABASE_URL;

if (process.env.VERCEL && !databaseUrl) {
  throw new Error('DATABASE_URL must be configured for Vercel deployments.');
}

const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, max: 5 }) : null;

export async function checkStorage() {
  if (pool) await pool.query('SELECT 1');
  else readDb();
}

function ensureJsonFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ nextStudent: 1, students: {}, registrations: [] }, null, 2));
  }
}

function readDb() {
  ensureJsonFile();
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

function makeJsonIdentity(db, deviceId) {
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

export async function getIdentity(deviceId) {
  if (!pool) return makeJsonIdentity(readDb(), deviceId);

  const inserted = await pool.query(
    'INSERT INTO students (device_id) VALUES ($1) ON CONFLICT (device_id) DO NOTHING RETURNING roll_number AS "rollNumber", college_id AS "collegeId"',
    [deviceId]
  );
  if (inserted.rowCount) return inserted.rows[0];
  const existing = await pool.query(
    'SELECT roll_number AS "rollNumber", college_id AS "collegeId" FROM students WHERE device_id = $1',
    [deviceId]
  );
  return existing.rows[0];
}

export async function listRegistrations(deviceId) {
  if (!pool) {
    const db = readDb();
    const identity = Object.hasOwn(db.students, deviceId) ? db.students[deviceId] : null;
    return identity ? db.registrations.filter(item => item.rollNumber === identity.rollNumber) : [];
  }

  const result = await pool.query(
    `SELECT registration_id AS "registrationId", event_id AS "eventId", event_title AS "eventTitle",
      event_date AS "eventDate", event_venue AS "eventVenue", name, mobile, class_name AS "className",
      year, branch, roll_number AS "rollNumber", college_id AS "collegeId", fee::float8 AS fee,
      payment_status AS "paymentStatus", created_at AS "createdAt"
     FROM registrations WHERE device_id = $1 ORDER BY created_at DESC`,
    [deviceId]
  );
  return result.rows;
}

export async function createRegistration(input) {
  const identity = await getIdentity(input.deviceId);
  const fee = input.fee ?? 0;
  const registration = {
    registrationId: `REG-${randomUUID()}`,
    eventId: input.eventId.trim(), eventTitle: input.eventTitle.trim(), eventDate: input.eventDate,
    eventVenue: input.eventVenue.trim(), name: input.name.trim(), mobile: input.mobile.trim(),
    className: input.className.trim(), year: input.year, branch: input.branch,
    rollNumber: identity.rollNumber, collegeId: identity.collegeId, fee,
    paymentStatus: fee === 0 ? 'Not required' : 'Demo only — not paid',
    createdAt: new Date().toISOString()
  };

  if (!pool) {
    const db = readDb();
    if (db.registrations.some(item => item.eventId === registration.eventId && item.rollNumber === identity.rollNumber)) {
      const error = new Error('This student is already registered for this event.');
      error.code = 'DUPLICATE_REGISTRATION';
      throw error;
    }
    db.registrations.unshift(registration);
    writeDb(db);
    return registration;
  }

  const result = await pool.query(
    `INSERT INTO registrations
      (registration_id, device_id, event_id, event_title, event_date, event_venue, name, mobile,
       class_name, year, branch, roll_number, college_id, fee, payment_status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING registration_id AS "registrationId", event_id AS "eventId", event_title AS "eventTitle",
       event_date AS "eventDate", event_venue AS "eventVenue", name, mobile, class_name AS "className",
       year, branch, roll_number AS "rollNumber", college_id AS "collegeId", fee::float8 AS fee,
       payment_status AS "paymentStatus", created_at AS "createdAt"`,
    [registration.registrationId, input.deviceId, registration.eventId, registration.eventTitle,
      registration.eventDate, registration.eventVenue, registration.name, registration.mobile,
      registration.className, registration.year, registration.branch, registration.rollNumber,
      registration.collegeId, registration.fee, registration.paymentStatus, registration.createdAt]
  );
  return result.rows[0];
}

export function isDuplicateError(error) {
  return error.code === 'DUPLICATE_REGISTRATION' || error.code === '23505';
}
