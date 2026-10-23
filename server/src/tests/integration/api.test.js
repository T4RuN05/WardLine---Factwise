import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { connectDatabase } from '../../config/database.js';
import mongoose from 'mongoose';

describe('API Integration Test Suite (WP3 & WP5)', () => {
  let nurseToken = null;
  let doctorToken = null;
  let adminToken = null;
  let directorToken = null;
  let nurseUser = null;
  let samplePatientId = null;

  beforeAll(async () => {
    await connectDatabase();

    // 1. Fetch personas
    const personasRes = await request(app).get('/api/auth/personas');
    expect(personasRes.status).toBe(200);
    const users = personasRes.body.data;
    expect(users.length).toBe(9);

    nurseUser = users.find((u) => u.role === 'NURSE');
    const doctorUser = users.find((u) => u.role === 'DOCTOR');
    const adminUser = users.find((u) => u.role === 'ADMIN');
    const directorUser = users.find((u) => u.role === 'DIRECTOR');

    // 2. Log in with each persona
    const nurseLogin = await request(app)
      .post('/api/auth/demo-login')
      .send({ userId: nurseUser.id || nurseUser._id });
    nurseToken = nurseLogin.body.data.token;

    const docLogin = await request(app)
      .post('/api/auth/demo-login')
      .send({ userId: doctorUser.id || doctorUser._id });
    doctorToken = docLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/auth/demo-login')
      .send({ userId: adminUser.id || adminUser._id });
    adminToken = adminLogin.body.data.token;

    const dirLogin = await request(app)
      .post('/api/auth/demo-login')
      .send({ userId: directorUser.id || directorUser._id });
    directorToken = dirLogin.body.data.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('GET /api/health returns 200 without exposing database secrets', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.facility).toBe('WardLine Quarantine & Treatment Centre');
    expect(res.body).not.toHaveProperty('MONGODB_URI');
    expect(res.body).not.toHaveProperty('JWT_SECRET');
  });

  it('GET /api/auth/me returns 401 when unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('GET /api/auth/me returns user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${nurseToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('NURSE');
    expect(res.body.data.name).toBe(nurseUser.name);
  });

  it('GET /api/dashboard/overview returns facility stats and initial 14.0% mortality WARNING', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${nurseToken}`);
    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.rooms.total).toBe(74);
    expect(data.rooms.occupied).toBe(74);
    expect(data.rooms.free).toBe(0);

    expect(data.tasks.temperatures.done).toBe(38);
    expect(data.tasks.temperatures.pending).toBe(36);
    expect(data.tasks.visits.done).toBe(18);

    expect(data.mortality.closed).toBe(50);
    expect(data.mortality.deceased).toBe(7);
    expect(data.mortality.discharged).toBe(43);
    expect(data.mortality.ratePercent).toBe(14.0);
    expect(data.mortality.state).toBe('WARNING');
  });

  it('GET /api/rooms returns 74 tiles for the Bed Map', async () => {
    const res = await request(app)
      .get('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.tiles.length).toBe(74);
    expect(res.body.data.counts.occupied).toBe(74);
    expect(res.body.data.counts.free).toBe(0);
  });

  it('GET /api/nurse/worklist returns pending (36) and done (38)', async () => {
    const res = await request(app)
      .get('/api/nurse/worklist')
      .set('Authorization', `Bearer ${nurseToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.counts.pending).toBe(36);
    expect(res.body.data.counts.done).toBe(38);

    samplePatientId = res.body.data.done[0].patientId;
  });

  it('POST /api/patients/:id/temperatures blocks duplicate readings today (TMP-2)', async () => {
    const res = await request(app)
      .post(`/api/patients/${samplePatientId}/temperatures`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ valueC: 38.5 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_READING');
    expect(res.body.error.message).toContain('already recorded today');
  });

  it('POST /api/patients blocks admission when capacity is 74/74 (ADM-1)', async () => {
    const anyRoom = (
      await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
    ).body.data.tiles[0];

    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Test Patient',
        age: 30,
        sex: 'M',
        phone: '+91 9999999999',
        emergencyContact: { name: 'Emergency', phone: '+91 8888888888' },
        roomId: anyRoom.id,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROOM_FULL');
    expect(res.body.error.message).toContain('All 74 rooms are occupied');
  });

  it('enforces role authorization on sensitive endpoints', async () => {
    // Nurse cannot record death
    const deathRes = await request(app)
      .post(`/api/patients/${samplePatientId}/death`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ causeNote: 'test', confirmRoomNumber: 1 });
    expect(deathRes.status).toBe(403);
    expect(deathRes.body.error.code).toBe('PERMISSION_DENIED');

    // Nurse cannot view full director analytics
    const analyticsRes = await request(app)
      .get('/api/director/analytics')
      .set('Authorization', `Bearer ${nurseToken}`);
    expect(analyticsRes.status).toBe(403);
    expect(analyticsRes.body.error.code).toBe('PERMISSION_DENIED');

    // Director CAN view analytics
    const directorRes = await request(app)
      .get('/api/director/analytics')
      .set('Authorization', `Bearer ${directorToken}`);
    expect(directorRes.status).toBe(200);
    expect(directorRes.body.data.mortality.ratePercent).toBe(14.0);
  });
});
