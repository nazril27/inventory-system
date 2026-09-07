import { faker } from '@faker-js/faker';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../prisma/prisma.js';
import { app } from '../../src/app.js';
import {
  categoryFixture,
  productFixture,
  tokenFixture,
} from '../fixtures/index.js';
import { admin, insertUsers, userOne } from '../fixtures/user.fixture.js';

describe('Product Routes (/v1/products)', () => {
  describe('POST /v1/products', () => {
    it('should return 201 and successfully create product if data is valid and user is admin or non-admin', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);

      const [productByAdmin, productByUser] = [
        {
          name: 'Product created by admin',
          price: 99000,
          quantityInStock: 9,
          categoryId: categoryFixture.categoryOne.id,
        },
        {
          name: 'Product created by user',
          price: 199000,
          quantityInStock: 19,
          categoryId: categoryFixture.categoryOne.id,
        },
      ];

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .post('/v1/products')
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
          .send(productByAdmin),

        request(app)
          .post('/v1/products')
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
          .send(productByUser),
      ]);

      expect(resByAdmin.status).toBe(201);
      expect(resByUser.status).toBe(201);
      expect(resByAdmin.body.message).toBe('Create product success');
      expect(resByUser.body.message).toBe('Create product success');
      expect(resByAdmin.body.data.name).toBe(productByAdmin.name);
      expect(resByUser.body.data.name).toBe(productByUser.name);
      expect(Math.trunc(resByAdmin.body.data.price)).toBe(productByAdmin.price);
      expect(Math.trunc(resByUser.body.data.price)).toBe(productByUser.price);

      // Verifikasi data tersimpan di database
      const [dbProductAdmin, dbProductUser] = await Promise.all([
        prisma.product.findUnique({
          where: { id: resByAdmin.body.data.id },
        }),
        prisma.product.findUnique({
          where: { id: resByUser.body.data.id },
        }),
      ]);

      expect(dbProductAdmin).not.toBeNull();
      expect(dbProductUser).not.toBeNull();
      expect(dbProductAdmin.name).toBe(productByAdmin.name);
      expect(dbProductUser.name).toBe(productByUser.name);
    });

    it('should return 400 error if product name is less than 3 characters', async () => {
      await insertUsers([admin]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);

      const res = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          name: 'ab',
          price: 10000,
          quantityInStock: 5,
          categoryId: categoryFixture.categoryOne.id,
        })
        .expect(400);

      expect(res.body.message).toBe('Minimum 3 characters for product name');
    });

    it('should return 400 error if product name is missing', async () => {
      await insertUsers([admin]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);

      const res = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          price: 10000,
          quantityInStock: 5,
          categoryId: categoryFixture.categoryOne.id,
        })
        .expect(400);

      expect(res.body.message).toBe('Require product name');
    });

    it('should return 400 error if price is not higher than 0', async () => {
      await insertUsers([admin]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);

      const res = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          name: 'Invalid Price Product',
          price: 0,
          quantityInStock: 5,
          categoryId: categoryFixture.categoryOne.id,
        })
        .expect(400);

      expect(res.body.message).toBe('Price must be higher than 0');
    });

    it('should return 400 error if categoryId is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/products')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          name: 'Product Bad Category',
          price: 10000,
          quantityInStock: 5,
          categoryId: 'invalid-category-uuid',
        })
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/v1/products')
        .send({
          name: 'Product Name',
          price: 10000,
          quantityInStock: 5,
          categoryId: categoryFixture.categoryOne.id,
        })
        .expect(401);
    });
  });

  describe('GET /v1/products', () => {
    it('should return 200 and list of products for admin or non-admin', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([
        productFixture.productOne,
        productFixture.productTwo,
      ]);

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .get('/v1/products')
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`),

        request(app)
          .get('/v1/products')
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Get products success');
      expect(resByUser.body.message).toBe('Get products success');
      expect(resByAdmin.body.data).toHaveProperty('results');
      expect(resByUser.body.data).toHaveProperty('results');
      expect(resByAdmin.body.data.results).toBeInstanceOf(Array);
      expect(resByUser.body.data.results).toBeInstanceOf(Array);
      expect(resByAdmin.body.data.results.length).toBeGreaterThanOrEqual(2);
      expect(resByUser.body.data.results.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter products by category name correctly', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([
        productFixture.productOne,
        productFixture.productTwo,
      ]);

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .get('/v1/products')
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
          .query({ category: categoryFixture.categoryOne.name }),

        request(app)
          .get('/v1/products')
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
          .query({ category: 'NonExistentCategory' }),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.data.results.length).toBeGreaterThanOrEqual(2);
      expect(resByUser.body.data.results).toHaveLength(0);
    });

    it('should filter products by product name correctly', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);

      const res = await request(app)
        .get('/v1/products')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ name: productFixture.productOne.name })
        .expect(200);

      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0].id).toBe(productFixture.productOne.id);
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app).get('/v1/products').expect(401);
    });
  });

  describe('GET /v1/products/:id', () => {
    it('should return 200 and product data if id is valid and product exists', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([
        productFixture.productOne,
        productFixture.productTwo,
      ]);

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .get(`/v1/products/${productFixture.productOne.id}`)
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`),

        request(app)
          .get(`/v1/products/${productFixture.productTwo.id}`)
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Get product success');
      expect(resByUser.body.message).toBe('Get product success');
      expect(resByAdmin.body.data.id).toBe(productFixture.productOne.id);
      expect(resByUser.body.data.id).toBe(productFixture.productTwo.id);
      expect(resByAdmin.body.data.name).toBe(productFixture.productOne.name);
      expect(resByUser.body.data.name).toBe(productFixture.productTwo.name);
    });

    it('should return 400 error if product id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .get('/v1/products/invalid-product-uuid')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if product is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .get(`/v1/products/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .get(`/v1/products/${productFixture.productOne.id}`)
        .expect(401);
    });
  });

  describe('PATCH /v1/products/:id', () => {
    it('should return 200 and updated product data when admin or non-admin updates product', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([
        productFixture.productOne,
        productFixture.productTwo,
      ]);

      const [updateBodyByAdmin, updateBodyByUser] = [
        {
          name: 'Product updated by admin',
          price: 399000,
          description: 'Description updated by admin',
          quantityInStock: 10,
        },
        {
          name: 'Product updated by user',
          price: 499000,
          description: 'Description updated by user',
          quantityInStock: 25,
        },
      ];

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .patch(`/v1/products/${productFixture.productOne.id}`)
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
          .send(updateBodyByAdmin),

        request(app)
          .patch(`/v1/products/${productFixture.productTwo.id}`)
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
          .send(updateBodyByUser),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Update product success');
      expect(resByUser.body.message).toBe('Update product success');
      expect(resByAdmin.body.data.name).toBe(updateBodyByAdmin.name);
      expect(resByUser.body.data.name).toBe(updateBodyByUser.name);

      // Verifikasi perubahan di database
      const [dbProductAdmin, dbProductUser] = await Promise.all([
        prisma.product.findUnique({
          where: { id: resByAdmin.body.data.id },
        }),
        prisma.product.findUnique({
          where: { id: resByUser.body.data.id },
        }),
      ]);

      expect(dbProductAdmin).not.toBeNull();
      expect(dbProductUser).not.toBeNull();
      expect(dbProductAdmin.name).toBe(updateBodyByAdmin.name);
      expect(dbProductUser.name).toBe(updateBodyByUser.name);
      expect(Math.trunc(dbProductAdmin.price)).toBe(updateBodyByAdmin.price);
      expect(Math.trunc(dbProductUser.price)).toBe(updateBodyByUser.price);
      expect(dbProductAdmin.description).toBe(updateBodyByAdmin.description);
      expect(dbProductUser.description).toBe(updateBodyByUser.description);
      expect(dbProductAdmin.quantityInStock).toBe(
        updateBodyByAdmin.quantityInStock
      );
      expect(dbProductUser.quantityInStock).toBe(
        updateBodyByUser.quantityInStock
      );
    });

    it('should return 400 error if update body is empty', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);

      const res = await request(app)
        .patch(`/v1/products/${productFixture.productOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Require update minimum 1 property');
    });

    it('should return 400 error if product id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .patch('/v1/products/invalid-product-uuid')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ name: 'New Name' })
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if product to update is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .patch(`/v1/products/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ name: 'Updated Product Name' })
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .patch(`/v1/products/${productFixture.productOne.id}`)
        .send({ name: 'Updated Product Name' })
        .expect(401);
    });
  });

  describe('DELETE /v1/products/:id', () => {
    it('should return 200 and delete product when admin or non-admin deletes product', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([
        productFixture.productOne,
        productFixture.productTwo,
      ]);

      const [resByAdmin, resByUser] = await Promise.all([
        request(app)
          .delete(`/v1/products/${productFixture.productOne.id}`)
          .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`),

        request(app)
          .delete(`/v1/products/${productFixture.productTwo.id}`)
          .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`),
      ]);

      expect(resByAdmin.status).toBe(200);
      expect(resByUser.status).toBe(200);
      expect(resByAdmin.body.message).toBe('Delete product success');
      expect(resByUser.body.message).toBe('Delete product success');

      // Verifikasi terhapus dari database
      const [dbProductAdmin, dbProductUser] = await Promise.all([
        prisma.product.findUnique({
          where: { id: productFixture.productOne.id },
        }),
        prisma.product.findUnique({
          where: { id: productFixture.productTwo.id },
        }),
      ]);

      expect(dbProductAdmin).toBeNull();
      expect(dbProductUser).toBeNull();
    });

    it('should return 400 error if product id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .delete('/v1/products/invalid-product-uuid')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if product to delete is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .delete(`/v1/products/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .delete(`/v1/products/${productFixture.productOne.id}`)
        .expect(401);
    });
  });
});
