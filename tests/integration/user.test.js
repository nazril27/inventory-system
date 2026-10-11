import { faker } from '@faker-js/faker';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../prisma/prisma.js';
import { app } from '../../src/app.js';
import { tokenFixture } from '../fixtures/index.js';
import {
  admin,
  insertUsers,
  userOne,
  userTwo,
} from '../fixtures/user.fixture.js';

describe('User Routes (/v1/users)', () => {
  describe('POST /v1/users', () => {
    it('should return 201 and successfully create user if data is valid and user is admin', async () => {
      await insertUsers([admin]);

      const newUser = {
        name: 'New Created User',
        email: 'createduser@example.com',
        password: 'password123',
        role: 'USER',
      };

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(201);

      expect(res.body.message).toBe('Create user success');
      expect(res.body.data.name).toBe(newUser.name);
      expect(res.body.data.email).toBe(newUser.email);

      // Verifikasi data tersimpan di database
      const dbUser = await prisma.user.findUnique({
        where: { email: newUser.email },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser.name).toBe(newUser.name);
    });

    it('should return 400 error if email format is invalid', async () => {
      await insertUsers([admin]);

      const newUser = {
        name: 'New Created User',
        email: 'invalidemailformat',
        password: 'password123',
        role: 'USER',
      };

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(400);

      expect(res.body.message).toBe('Require valid email format');
    });

    it('should return 401 error if access token is missing', async () => {
      const newUser = {
        name: 'New Created User',
        email: 'createduser@example.com',
        password: 'password123',
      };

      await request(app).post('/v1/users').send(newUser).expect(401);
    });

    it('should return 403 error if non-admin user tries to create user', async () => {
      await insertUsers([userOne]);

      const newUser = {
        name: 'New Created User',
        email: 'createduser2@example.com',
        password: 'password123',
        role: 'USER',
      };

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(newUser)
        .expect(403);

      expect(res.body.message).toBe(
        `Role ${userOne.role} can not access this resource`
      );
    });
  });

  describe('GET /v1/users', () => {
    it('should return 200 and list of users for admin', async () => {
      await insertUsers([admin, userOne, userTwo]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Get users success');
      expect(res.body.data).toHaveProperty('results');
      expect(res.body.data.results).toBeInstanceOf(Array);
      expect(res.body.data.results.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter users by name correctly', async () => {
      await insertUsers([admin, userOne]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ name: userOne.name })
        .expect(200);

      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0].id).toBe(userOne.id);
    });

    it('should return 403 error if non-admin user tries to fetch users', async () => {
      await insertUsers([userOne]);

      await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .expect(403);
    });
  });

  describe('GET /v1/users/:id', () => {
    it('should return 200 and user data if id is valid and user exists', async () => {
      await insertUsers([admin, userOne]);

      const res = await request(app)
        .get(`/v1/users/${userOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Get user success');
      expect(res.body.data.id).toBe(userOne.id);
      expect(res.body.data.email).toBe(userOne.email);
    });

    it('should return 400 error if user id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .get('/v1/users/invalid-uuid-format')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if user is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .get(`/v1/users/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('User not found');
    });
  });

  describe('PATCH /v1/users/:id', () => {
    it('should return 200 and updated user data when admin updates user', async () => {
      await insertUsers([admin, userOne]);

      const updateBody = {
        name: 'Updated Name Admin',
      };

      const res = await request(app)
        .patch(`/v1/users/${userOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(updateBody)
        .expect(200);

      expect(res.body.message).toBe('Update user success');
      expect(res.body.data.name).toBe(updateBody.name);

      // Verifikasi di database
      const dbUser = await prisma.user.findUnique({
        where: { id: userOne.id },
      });
      expect(dbUser.name).toBe(updateBody.name);
    });

    it('should return 400 error if update body is empty', async () => {
      await insertUsers([admin, userOne]);

      const res = await request(app)
        .patch(`/v1/users/${userOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Require update minimum 1 property');
    });

    it('should return 404 error if user to update is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .patch(`/v1/users/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(res.body.message).toBe('User not found');
    });
  });

  describe('DELETE /v1/users/:id', () => {
    it('should return 200 and delete user when admin deletes user', async () => {
      await insertUsers([admin, userOne]);

      const res = await request(app)
        .delete(`/v1/users/${userOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Delete user success');

      // Verifikasi user terhapus dari database
      const dbUser = await prisma.user.findUnique({
        where: { id: userOne.id },
      });
      expect(dbUser).toBeNull();
    });

    it('should return 404 error if user to delete is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .delete(`/v1/users/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('User not found');
    });
  });
});
