import { faker } from '@faker-js/faker';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../prisma/prisma.js';
import { app } from '../../src/app.js';
import {
  categoryFixture,
  orderFixture,
  orderItemFixture,
  productFixture,
  tokenFixture,
} from '../fixtures/index.js';
import { admin, insertUsers, userOne } from '../fixtures/user.fixture.js';

describe('Order Routes (/v1/orders)', () => {
  describe('POST /v1/orders', () => {
    it('should return 201 and successfully create order if data is valid and user is admin', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([
        productFixture.productOne,
        productFixture.productTwo,
      ]);

      const orderBody = {
        customerName: 'Order Created By Admin',
        customerEmail: 'customer@example.com',
        items: [
          { productId: productFixture.productOne.id, quantity: 2 },
          { productId: productFixture.productTwo.id, quantity: 3 },
        ],
      };

      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(orderBody)
        .expect(201);

      expect(res.body.message).toBe('Create order success');
      expect(res.body.data.customerName).toBe(orderBody.customerName);
      expect(res.body.data.orderItems).toHaveLength(2);

      // Verifikasi data tersimpan di database
      const dbOrder = await prisma.order.findUnique({
        where: { id: res.body.data.id },
        include: { orderItems: true },
      });
      expect(dbOrder).not.toBeNull();
      expect(dbOrder.customerName).toBe(orderBody.customerName);
      expect(dbOrder.orderItems).toHaveLength(2);
    });

    it('should return 400 error if customerName is missing', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);

      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          items: [{ productId: productFixture.productOne.id, quantity: 1 }],
        })
        .expect(400);

      expect(res.body.message).toBe('Require customer name');
    });

    it('should return 400 error if items array is empty', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          customerName: 'John Customer',
          items: [],
        })
        .expect(400);

      expect(res.body.message).toBe('Require minimum 1 product in order');
    });

    it('should return 400 error if duplicate productId is provided in items', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);

      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          customerName: 'John Customer',
          items: [
            { productId: productFixture.productOne.id, quantity: 1 },
            { productId: productFixture.productOne.id, quantity: 2 },
          ],
        })
        .expect(400);

      expect(res.body.message).toBe('Duplicate product detected');
    });

    it('should return 400 error if stock is insufficient', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);

      const res = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({
          customerName: 'John Customer',
          items: [{ productId: productFixture.productOne.id, quantity: 99999 }],
        })
        .expect(400);

      expect(res.body.message).toContain('Not enough stock');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/v1/orders')
        .send({
          customerName: 'John Customer',
          items: [{ productId: categoryFixture.categoryOne.id, quantity: 1 }],
        })
        .expect(401);
    });

    it('should return 403 error if non-admin user tries to create order', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send({
          customerName: 'John Customer',
          items: [{ productId: categoryFixture.categoryOne.id, quantity: 1 }],
        })
        .expect(403);
    });
  });

  describe('GET /v1/orders', () => {
    it('should return 200 and list of orders for admin', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([
        productFixture.productOne,
        productFixture.productTwo,
      ]);
      await orderFixture.insertOrders([
        orderFixture.orderOne,
        orderFixture.orderTwo,
      ]);
      await orderItemFixture.insertOrderItems([
        orderItemFixture.orderItemOne,
        orderItemFixture.orderItemTwo,
        orderItemFixture.orderItemThree,
        orderItemFixture.orderItemFour,
      ]);

      const res = await request(app)
        .get('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Get orders success');
      expect(res.body.data).toHaveProperty('results');
      expect(res.body.data.results).toBeInstanceOf(Array);
      expect(res.body.data.results.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app).get('/v1/orders').expect(401);
    });

    it('should return 403 error if non-admin user tries to fetch orders', async () => {
      await insertUsers([userOne]);

      await request(app)
        .get('/v1/orders')
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .expect(403);
    });
  });

  describe('GET /v1/orders/:id', () => {
    it('should return 200 and order data if id is valid and order exists', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);
      await orderFixture.insertOrders([orderFixture.orderOne]);

      const res = await request(app)
        .get(`/v1/orders/${orderFixture.orderOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Get order success');
      expect(res.body.data.id).toBe(orderFixture.orderOne.id);
    });

    it('should return 400 error if order id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .get('/v1/orders/invalid-order-uuid')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if order is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .get(`/v1/orders/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .get(`/v1/orders/${orderFixture.orderOne.id}`)
        .expect(401);
    });

    it('should return 403 error if non-admin user tries to fetch order', async () => {
      await insertUsers([userOne]);

      await request(app)
        .get(`/v1/orders/${orderFixture.orderOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .expect(403);
    });
  });

  describe('PATCH /v1/orders/:id', () => {
    it('should return 200 and updated order data when admin updates order status or customer details', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);
      await orderFixture.insertOrders([orderFixture.orderOne]);

      const updateBody = {
        customerName: 'Updated Customer Name Admin',
        status: 'COMPLETED',
      };

      const res = await request(app)
        .patch(`/v1/orders/${orderFixture.orderOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(updateBody)
        .expect(200);

      expect(res.body.message).toBe('Update order success');
      expect(res.body.data.customerName).toBe(updateBody.customerName);
      expect(res.body.data.status).toBe(updateBody.status);

      // Verifikasi perubahan di database
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderFixture.orderOne.id },
      });
      expect(dbOrder.customerName).toBe(updateBody.customerName);
      expect(dbOrder.status).toBe(updateBody.status);
    });

    it('should return 400 error if update body is empty', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);
      await orderFixture.insertOrders([orderFixture.orderOne]);

      const res = await request(app)
        .patch(`/v1/orders/${orderFixture.orderOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Require update minimum 1 property');
    });

    it('should return 400 error if order id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .patch('/v1/orders/invalid-order-uuid')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ customerName: 'Updated Name' })
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if order to update is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .patch(`/v1/orders/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send({ customerName: 'Updated Customer Name' })
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .patch(`/v1/orders/${orderFixture.orderOne.id}`)
        .send({ customerName: 'Updated Customer Name' })
        .expect(401);
    });

    it('should return 403 error if non-admin user tries to update order', async () => {
      await insertUsers([userOne]);

      await request(app)
        .patch(`/v1/orders/${orderFixture.orderOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send({ customerName: 'Updated Customer Name' })
        .expect(403);
    });
  });

  describe('DELETE /v1/orders/:id', () => {
    it('should return 200 and delete order when admin deletes order', async () => {
      await insertUsers([admin, userOne]);
      await categoryFixture.insertCategories([categoryFixture.categoryOne]);
      await productFixture.insertProducts([productFixture.productOne]);
      await orderFixture.insertOrders([orderFixture.orderOne]);

      const res = await request(app)
        .delete(`/v1/orders/${orderFixture.orderOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Delete order success');

      // Verifikasi terhapus dari database
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderFixture.orderOne.id },
      });
      expect(dbOrder).toBeNull();
    });

    it('should return 400 error if order id is not a valid UUID', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .delete('/v1/orders/invalid-order-uuid')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(400);

      expect(res.body.message).toBe('Must be a valid UUID');
    });

    it('should return 404 error if order to delete is not found', async () => {
      await insertUsers([admin]);
      const randomUuid = faker.string.uuid();

      const res = await request(app)
        .delete(`/v1/orders/${randomUuid}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app)
        .delete(`/v1/orders/${orderFixture.orderOne.id}`)
        .expect(401);
    });

    it('should return 403 error if non-admin user tries to delete order', async () => {
      await insertUsers([userOne]);

      await request(app)
        .delete(`/v1/orders/${orderFixture.orderOne.id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .expect(403);
    });
  });
});
