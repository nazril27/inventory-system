import { faker } from '@faker-js/faker';
import { prisma } from '../../prisma/prisma.js';
import { admin } from './user.fixture.js';

class Order {
  constructor(userId, totalPrice = 0, status = 'COMPLETED') {
    this.id = faker.string.uuid();
    this.totalPrice = totalPrice;
    this.customerName = faker.person.fullName();
    this.customerEmail = faker.internet.email().toLowerCase();
    this.status = status;
    this.userId = userId;
  }
}

export const orderOne = new Order(admin.id);
export const orderTwo = new Order(admin.id);

export const insertOrders = async (orders) => {
  await prisma.order.createMany({
    data: orders,
    skipDuplicates: true,
  });
};
