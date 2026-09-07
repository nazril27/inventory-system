import { faker } from '@faker-js/faker';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../prisma/prisma.js';
import { app } from '../../src/app.js';
import { categoryFixture, tokenFixture } from '../fixtures/index.js';
import { admin, insertUsers, userOne } from '../fixtures/user.fixture.js';

describe('Category Routes (/v1/categories)', () => {
  describe('POST /v1/categories', () => {
    it('should return 201 and successfully create category if data is valid and user is admin or non-admin', async () => {
      await insertUsers([admin, userOne]);

      const [categoryByAdmin, categoryByUser] = [
        { name: 'New Category By Admin' },
        { name: 'New Category By User' },
      ];

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .post('/v1/categories')
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
          .send(categoryByAdmin),

        request(app)
          .post('/v1/categories')
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
          .send(categoryByUser),
      ]);

      expect(resByAdmin.status).toBe(201);
      expect(resByUser.status).toBe(201);
      expect(resByAdmin.body.message).toBe('Create category success');
      expect(resByUser.body.message).toBe('Create category success');
      expect(resByAdmin.body.data.name).toBe(categoryByAdmin.name);
      expect(resByUser.body.data.name).toBe(categoryByUser.name);

      // Verifikasi data tersimpan di database
      const [dbCategoryAdmin, dbCategoryUser] = await Promise.all([
        prisma.category.findUnique({
          where: { id: resByAdmin.body.data.id },
        }),
        prisma.category.findUnique({
          where: { id: resByUser.body.data.id },
        }),
      ]);

      expect(dbCategoryAdmin).not.toBeNull();
      expect(dbCategoryUser).not.toBeNull();
      expect(dbCategoryAdmin.name).toBe(categoryByAdmin.name);
      expect(dbCategoryUser.name).toBe(categoryByUser.name);
    });

    it('should return 400 error if category name is less than 3 characters', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/categories')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ name: 'ab' })
        .expect(400);

      expect(res.body.message).toBe(
        'Category name must be at least 3 characters'
      );
    });

    it('should return 400 error if category name is missing', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/categories')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Require category name');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/v1/categories')
        .send({ name: 'Valid Category' })
        .expect(401);
    });
  });

  describe('GET /v1/categories', () => {
    it('should return 200 and list of categories for admin or non-admin', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([
        categoryFixture.categoryOne,
        categoryFixture.categoryTwo,
        categoryFixture.categoryThree,
        categoryFixture.categoryFour,
        categoryFixture.categoryFive,
      ]);

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .get('/v1/categories')
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`),

        request(app)
          .get('/v1/categories')
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Get categories success');
      expect(resByUser.body.message).toBe('Get categories success');
      expect(resByAdmin.body.data).toHaveProperty('results');
      expect(resByUser.body.data).toHaveProperty('results');
      expect(resByAdmin.body.data.results).toBeInstanceOf(Array);
      expect(resByUser.body.data.results).toBeInstanceOf(Array);
      expect(resByAdmin.body.data.results.length).toBeGreaterThanOrEqual(5);
      expect(resByUser.body.data.results.length).toBeGreaterThanOrEqual(5);
    });

    it('should filter categories by name correctly', async () => {
      await insertUsers([admin]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);

      const res = await request(app)
        .get('/v1/categories')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ name: categoryFixture.categoryOne.name })
        .expect(200);

      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0].id).toBe(categoryFixture.categoryOne.id);
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app).get('/v1/categories').expect(401);
    });
  });

  describe('GET /v1/categories/:id', () => {
    it('should return 200 and category data if id is valid and category exists', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .get(`/v1/categories/${categoryFixture.categoryOne.id}`)
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`),

        request(app)
          .get(`/v1/categories/${categoryFixture.categoryOne.id}`)
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Get category success');
      expect(resByUser.body.message).toBe('Get category success');
      expect(resByAdmin.body.data.id).toBe(categoryFixture.categoryOne.id);
      expect(resByUser.body.data.id).toBe(categoryFixture.categoryOne.id);
      expect(resByAdmin.body.data.name).toBe(categoryFixture.categoryOne.name);
      expect(resByUser.body.data.name).toBe(categoryFixture.categoryOne.name);
    });

    it('should return 400 error if category id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .get('/v1/categories/invalid-uuid-123')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if category is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .get(`/v1/categories/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('Category not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .get(`/v1/categories/${categoryFixture.categoryOne.id}`)
        .expect(401);
    });
  });

  describe('PATCH /v1/categories/:id', () => {
    it('should return 200 and updated category data when admin or non-admin updates category', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([
        categoryFixture.categoryOne,
        categoryFixture.categoryTwo,
      ]);

      const [updateBodyByAdmin, updateBodyByUser] = [
        { name: 'Updated Name Admin' },
        { name: 'Updated Name User' },
      ];

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .patch(`/v1/categories/${categoryFixture.categoryOne.id}`)
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
          .send(updateBodyByAdmin),

        request(app)
          .patch(`/v1/categories/${categoryFixture.categoryTwo.id}`)
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
          .send(updateBodyByUser),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Update category success');
      expect(resByUser.body.message).toBe('Update category success');
      expect(resByAdmin.body.data.name).toBe(updateBodyByAdmin.name);
      expect(resByUser.body.data.name).toBe(updateBodyByUser.name);

      // Verifikasi perubahan di database
      const [dbCategoryAdmin, dbCategoryUser] = await Promise.all([
        prisma.category.findUnique({
          where: { id: resByAdmin.body.data.id },
        }),
        prisma.category.findUnique({
          where: { id: resByUser.body.data.id },
        }),
      ]);

      expect(dbCategoryAdmin).not.toBeNull();
      expect(dbCategoryUser).not.toBeNull();
      expect(dbCategoryAdmin.name).toBe(updateBodyByAdmin.name);
      expect(dbCategoryUser.name).toBe(updateBodyByUser.name);
    });

    it('should return 400 error if update body is empty', async () => {
      await insertUsers([admin]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);

      const res = await request(app)
        .patch(`/v1/categories/${categoryFixture.categoryOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Require update minimum 1 property');
    });

    it('should return 400 error if category id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .patch('/v1/categories/invalid-uuid-123')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ name: 'New Name' })
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if category to update is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .patch(`/v1/categories/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ name: 'Updated Category Name' })
        .expect(404);

      expect(res.body.message).toBe('Category not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .patch(`/v1/categories/${categoryFixture.categoryOne.id}`)
        .send({ name: 'Updated Category Name' })
        .expect(401);
    });
  });

  describe('DELETE /v1/categories/:id', () => {
    it('should return 200 and delete category when admin or non-admin deletes category', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([
        categoryFixture.categoryOne,
        categoryFixture.categoryTwo,
      ]);

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .delete(`/v1/categories/${categoryFixture.categoryOne.id}`)
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`),

        request(app)
          .delete(`/v1/categories/${categoryFixture.categoryTwo.id}`)
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Delete category success');
      expect(resByUser.body.message).toBe('Delete category success');

      // Verifikasi terhapus dari database
      const [dbCategoryAdmin, dbCategoryUser] = await Promise.all([
        prisma.category.findUnique({
          where: { id: categoryFixture.categoryOne.id },
        }),
        prisma.category.findUnique({
          where: { id: categoryFixture.categoryTwo.id },
        }),
      ]);

      expect(dbCategoryAdmin).toBeNull();
      expect(dbCategoryUser).toBeNull();
    });

    it('should return 400 error if category id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .delete('/v1/categories/invalid-uuid-123')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if category to delete is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .delete(`/v1/categories/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('Category not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .delete(`/v1/categories/${categoryFixture.categoryOne.id}`)
        .expect(401);
    });
  });
});
