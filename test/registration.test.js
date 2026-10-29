import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('registration API no longer requires or returns Section/className and persists in isolated JSON storage', { skip: Boolean(process.env.DATABASE_URL) }, async t => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'campusconnect-api-'));
  const previousDataDir = process.env.CAMPUSCONNECT_DATA_DIR;
  process.env.CAMPUSCONNECT_DATA_DIR = dataDir;

  const { default: app } = await import('../server/app.js');
  let server;
  const startServer = async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    return `http://127.0.0.1:${server.address().port}`;
  };
  const stopServer = async () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  const baseUrl = await startServer();
  const deviceId = 'fictional-test-device';
  const requestBody = {
    deviceId, eventId: 'test-event', eventTitle: 'Fictional Test Event',
    eventDate: '2026-11-12T09:00:00', eventVenue: 'Test Hall', name: 'Jamie Example',
    rollNumber: 'TEST-12345', mobile: '9876543210', year: '2nd Year', branch: 'CSE', fee: 49
  };

  t.after(async () => {
    if (server?.listening) await stopServer();
    if (previousDataDir === undefined) delete process.env.CAMPUSCONNECT_DATA_DIR;
    else process.env.CAMPUSCONNECT_DATA_DIR = previousDataDir;
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  assert.deepEqual(await (await fetch(`${baseUrl}/api/health`)).json(), { ok: true, service: 'CampusConnect API' });

  const identityUrl = `${baseUrl}/api/student-identity?deviceId=${encodeURIComponent(deviceId)}`;
  const identityFirst = await (await fetch(identityUrl)).json();
  const identityAgain = await (await fetch(identityUrl)).json();
  assert.deepEqual(identityAgain, identityFirst);

  const frontend = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(frontend, /Section\s*<b>|form\.section/, 'registration form must not collect a Section');
  assert.doesNotMatch(frontend, /section:\s*form\./, 'frontend must not submit a section field');

  const registrationResponse = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
  });
  assert.equal(registrationResponse.status, 201);
  const registration = await registrationResponse.json();
  assert.equal('section' in registration, false);
  assert.equal('className' in registration, false);
  assert.equal(registration.rollNumber, 'TEST-12345');
  assert.equal(registration.paymentStatus, 'Demo only — not paid');

  const myEventsUrl = `${baseUrl}/api/registrations?deviceId=${encodeURIComponent(deviceId)}&rollNumber=TEST-12345`;
  const myEvents = await (await fetch(myEventsUrl)).json();
  assert.equal(myEvents.length, 1);
  assert.equal('section' in myEvents[0], false);

  const duplicate = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
  });
  assert.equal(duplicate.status, 409);

  const invalidMobile = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...requestBody, eventId: 'invalid-mobile', mobile: '12345' })
  });
  assert.equal(invalidMobile.status, 400);

  const missingField = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...requestBody, eventId: 'missing-name', name: '' })
  });
  assert.equal(missingField.status, 400);
  assert.match((await missingField.json()).error, /name/);

  const oldClientPayload = { ...requestBody, eventId: 'old-client', section: 'C', className: 'C' };
  const oldClientResponse = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(oldClientPayload)
  });
  assert.equal(oldClientResponse.status, 201);
  const oldClientRegistration = await oldClientResponse.json();
  assert.equal('section' in oldClientRegistration, false);
  assert.equal('className' in oldClientRegistration, false);

  const malformedJson = await fetch(`${baseUrl}/api/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
  });
  assert.equal(malformedJson.status, 400);

  await stopServer();
  const restartedBaseUrl = await startServer();
  const persisted = await (await fetch(`${restartedBaseUrl}${myEventsUrl.slice(baseUrl.length)}`)).json();
  assert.equal(persisted.length, 2);
  assert.equal('section' in persisted.find(item => item.eventId === 'test-event'), false);
});
